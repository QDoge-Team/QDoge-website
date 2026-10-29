// Shared logic for the Discord price ticker, used by both the standalone
// long-running script (scripts/discord-price-ticker.mjs) and the Netlify
// scheduled function (netlify/functions/discord-price-ticker.mjs).

export const QDOGE_ISSUER_ID = 'QDOGEEESKYPAICECHEAHOXPULEOADTKGEJHAVYPFKHLEWGXXZQUGIGMBUTZE';
export const QPAY_ISSUER_ID = 'QPAYNOWSWZMGHFEAEVJXGZAVSHABAZDDBDIHTEBOPCOGHRGBCYCUZOHCVLXG';
// Well-known zero identity -- also where QPAYHUB's token is issued from, and
// separately where a second, differently-traded "QTREAT"-named asset lives
// (distinct market from the QDOGE-issued QTREAT token: contract-side, not
// the token itself).
export const NULL_ID = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB';
export const QPAYHUB_ISSUER_ID = NULL_ID;

/**
 * Fixed per-epoch airdrop/fetch schedule, as given directly by the team --
 * intentionally NOT a formula, even though the values happen to decay
 * geometrically (~5.626%/epoch for airdrop, ~1%/epoch for fetch). Add new
 * rows here as they're provided; a missing epoch logs a clear error instead
 * of guessing via the decay rate, matching how the dividends page is kept in
 * sync with team-supplied data rather than extrapolated.
 *
 * Epochs change weekly (Wednesdays ~12:00 UTC), so this ~19-row table covers
 * roughly that many weeks before it needs more rows.
 */
export const EPOCH_SCHEDULE = {
  232: { airdrop: 27_499_901, fetch: 731_198 },
  233: { airdrop: 25_952_538, fetch: 723_886 },
  234: { airdrop: 24_492_243, fetch: 716_647 },
  235: { airdrop: 23_114_115, fetch: 709_480 },
  236: { airdrop: 21_813_532, fetch: 702_386 },
  237: { airdrop: 20_586_129, fetch: 695_362 },
  238: { airdrop: 19_427_790, fetch: 688_408 },
  239: { airdrop: 18_334_629, fetch: 681_524 },
  240: { airdrop: 17_302_977, fetch: 674_709 },
  241: { airdrop: 16_329_375, fetch: 667_962 },
  242: { airdrop: 15_410_555, fetch: 661_282 },
  243: { airdrop: 14_543_435, fetch: 654_669 },
  244: { airdrop: 13_725_106, fetch: 648_123 },
  245: { airdrop: 12_952_822, fetch: 641_641 },
  246: { airdrop: 12_223_994, fetch: 635_225 },
  247: { airdrop: 11_536_175, fetch: 628_873 },
  248: { airdrop: 10_887_058, fetch: 622_584 },
  249: { airdrop: 10_274_466, fetch: 616_358 },
  250: { airdrop: 9_696_343, fetch: 610_195 },
};

// Fill in each `channelId` with the target voice channel's ID (or an env var).
export const TICKERS = [
  {
    kind: 'price',
    label: 'QDOGE',
    issuer: QDOGE_ISSUER_ID,
    asset: 'QDOGE',
    emoji: '🤑',
    channelId: process.env.DISCORD_CHANNEL_ID_QDOGE,
  },
  {
    kind: 'price',
    label: 'QTREAT',
    issuer: QDOGE_ISSUER_ID,
    asset: 'QTREAT',
    emoji: '🍬',
    channelId: process.env.DISCORD_CHANNEL_ID_QTREAT,
  },
  {
    // The QTREAT *contract's* (index 30) own "QTREAT"-named asset -- a
    // separate market from the QDOGE-issued QTREAT token ticker above.
    kind: 'price',
    label: 'QTREATSC',
    issuer: NULL_ID,
    asset: 'QTREAT',
    emoji: '🍬',
    channelId: process.env.DISCORD_CHANNEL_ID_QTREATSC,
  },
  {
    kind: 'price',
    label: 'QPAY',
    issuer: QPAY_ISSUER_ID,
    asset: 'QPAY',
    emoji: '💳',
    channelId: process.env.DISCORD_CHANNEL_ID_QPAY,
  },
  {
    kind: 'price',
    label: 'QPAYHUB',
    issuer: QPAYHUB_ISSUER_ID,
    asset: 'QPAYHUB',
    emoji: '🏦',
    channelId: process.env.DISCORD_CHANNEL_ID_QPAYHUB,
  },
  {
    kind: 'epoch-number',
    label: 'EPOCH',
    emoji: '📅',
    channelId: process.env.DISCORD_CHANNEL_ID_EPOCH,
  },
  {
    kind: 'epoch-schedule',
    field: 'airdrop',
    label: 'AIRDROP',
    displayLabel: 'Airdrop',
    emoji: '🎁',
    channelId: process.env.DISCORD_CHANNEL_ID_AIRDROP,
  },
  {
    kind: 'epoch-schedule',
    field: 'fetch',
    label: 'FETCH',
    displayLabel: 'Fetch',
    emoji: '🦴',
    channelId: process.env.DISCORD_CHANNEL_ID_FETCH,
  },
];

/** Readable message for a failed fetch: Node's "fetch failed" hides the real cause (ECONNRESET, ENOTFOUND, ...). */
export function describeError(err) {
  const cause = err?.cause?.code ?? err?.cause?.message;
  return cause ? `${err.message} (${cause})` : (err?.message ?? String(err));
}

const QUBIC_RPC = 'https://rpc.qubic.org';
const QX_CONTRACT_INDEX = 1;
const QX_ASSET_ASK_ORDERS = 2;
const QX_ASSET_BID_ORDERS = 3;
/** Ask/bid beyond this ratio means the book is too thin for a midpoint to mean much. */
const WIDE_SPREAD_RATIO = 2.5;

/** 60-char Qubic identity -> its 32-byte public key (the 4 checksum characters are not needed). */
function identityToPublicKey(identity) {
  if (!/^[A-Z]{60}$/.test(identity)) throw new Error(`Invalid identity: ${identity}`);
  const bytes = new Uint8Array(32);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < 4; i++) {
    let value = 0n;
    for (let j = 13; j >= 0; j--) value = value * 26n + BigInt(identity.charCodeAt(i * 14 + j) - 65);
    view.setBigUint64(i * 8, value, true);
  }
  return bytes;
}

function assetNameToU64(name) {
  let value = 0n;
  for (let i = name.length - 1; i >= 0; i--) value = (value << 8n) | BigInt(name.charCodeAt(i));
  return value;
}

/**
 * Best price on one side of QX's order book for an asset, or null if that
 * side is empty. QX returns each side best-first (lowest ask / highest bid),
 * so only the first slot is needed; unused slots are zeroed.
 */
async function fetchBestOrderQu(issuer, asset, functionNumber) {
  const input = new Uint8Array(48);
  const view = new DataView(input.buffer);
  input.set(identityToPublicKey(issuer), 0);
  view.setBigUint64(32, assetNameToU64(asset), true);
  view.setBigUint64(40, 0n, true);

  const res = await fetch(`${QUBIC_RPC}/live/v1/querySmartContract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractIndex: QX_CONTRACT_INDEX,
      inputType: functionNumber,
      inputSize: input.length,
      requestData: Buffer.from(input).toString('base64'),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`QX order book returned ${res.status}`);
  const { responseData } = await res.json();
  const out = Buffer.from(responseData ?? '', 'base64');
  if (out.length < 48) throw new Error('QX order book returned an empty response');
  const price = Number(out.readBigInt64LE(32));
  const shares = Number(out.readBigInt64LE(40));
  return price > 0 && shares > 0 ? price : null;
}

/**
 * Price from QX's own order book: the midpoint of the best bid and best ask
 * (or whichever side exists). Returns null when nobody is quoting the asset.
 */
export async function fetchOrderBookPriceQu(issuer, asset, label = asset) {
  const [ask, bid] = await Promise.all([
    fetchBestOrderQu(issuer, asset, QX_ASSET_ASK_ORDERS),
    fetchBestOrderQu(issuer, asset, QX_ASSET_BID_ORDERS),
  ]);
  if (ask == null && bid == null) return null;
  if (ask != null && bid != null) {
    if (ask / bid > WIDE_SPREAD_RATIO) {
      console.warn(`[${label}] wide spread (bid ${bid.toLocaleString('en-US')}, ask ${ask.toLocaleString('en-US')}); midpoint is only a rough price`);
    }
    return Math.round((ask + bid) / 2);
  }
  return ask ?? bid;
}

/** Average trade price today from quhub; only used when the order book can't price the asset. */
export async function fetchAveragePriceQu(issuer, asset) {
  const url = `https://api.quhub.app/service/v1/qx/issuer/${issuer}/asset/${asset}/chart/average-price`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Price feed returned ${res.status}`);
  const days = await res.json();
  const today = days.at(-1);
  if (!today) throw new Error('Price feed returned no data');
  return Math.round(today.averagePrice);
}

/** QX order book first (it is the source of truth), quhub trades only as a fallback. */
export async function fetchPriceQu(issuer, asset, label = asset) {
  try {
    const price = await fetchOrderBookPriceQu(issuer, asset, label);
    if (price != null) return price;
    console.warn(`[${label}] no orders on the QX book, falling back to average trade price`);
  } catch (err) {
    console.warn(`[${label}] QX order book failed (${describeError(err)}), falling back to average trade price`);
  }
  try {
    return await fetchAveragePriceQu(issuer, asset);
  } catch (err) {
    throw new Error(`no price: QX order book empty/unavailable and trade feed failed (${describeError(err)})`);
  }
}

export function formatChannelName(ticker, priceQu) {
  return `${ticker.emoji} ${ticker.displayLabel ?? ticker.label} Price: ${priceQu.toLocaleString('en-US')} qu`;
}

/** Current Qubic epoch, straight from network status (epochs change weekly, ~Wed 12:00 UTC). */
export async function fetchCurrentEpoch() {
  const res = await fetch('https://rpc.qubic.org/v1/status');
  if (!res.ok) throw new Error(`Qubic status endpoint returned ${res.status}`);
  const data = await res.json();
  const epoch = data?.lastProcessedTick?.epoch;
  if (typeof epoch !== 'number') throw new Error('Could not read current epoch from status response');
  return epoch;
}

export async function fetchEpochScheduleValue(field) {
  const epoch = await fetchCurrentEpoch();
  const row = EPOCH_SCHEDULE[epoch];
  if (!row) {
    throw new Error(
      `No ${field} data for epoch ${epoch} -- add it to EPOCH_SCHEDULE in scripts/lib/discord-ticker-core.mjs`
    );
  }
  return { epoch, value: row[field] };
}

export async function renameChannel(botToken, channelId, name) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (res.status === 429) {
    const { retry_after: retryAfter } = await res.json();
    console.warn(`[${channelId}] Rate limited by Discord, retrying after ${retryAfter}s`);
    await new Promise((r) => setTimeout(r, retryAfter * 1000 + 500));
    return renameChannel(botToken, channelId, name);
  }

  if (!res.ok) {
    throw new Error(`Discord API returned ${res.status}: ${await res.text()}`);
  }
}

async function resolveChannelName(ticker) {
  if (ticker.kind === 'epoch-number') {
    const epoch = await fetchCurrentEpoch();
    return `${ticker.emoji} Epoch: ${epoch}`;
  }
  if (ticker.kind === 'epoch-schedule') {
    const { value } = await fetchEpochScheduleValue(ticker.field);
    return `${ticker.emoji} ${ticker.displayLabel}: ${value.toLocaleString('en-US')}`;
  }
  const priceQu = await fetchPriceQu(ticker.issuer, ticker.asset, ticker.label);
  return formatChannelName(ticker, priceQu);
}

/** Resolves a ticker's current value and renames its channel. Skips (doesn't throw) if channelId is unset. */
export async function tickOne(botToken, ticker, { onSkipUnchanged } = {}) {
  if (!ticker.channelId) {
    console.warn(`[${ticker.label}] No channel ID configured, skipping.`);
    return;
  }
  const name = await resolveChannelName(ticker);
  if (onSkipUnchanged?.(ticker, name)) {
    console.log(`[${new Date().toISOString()}] ${ticker.label} unchanged (${name}), skipping.`);
    return;
  }
  await renameChannel(botToken, ticker.channelId, name);
  console.log(`[${new Date().toISOString()}] ${ticker.label} channel renamed to "${name}"`);
  return name;
}
