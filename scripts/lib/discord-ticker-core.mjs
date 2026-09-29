// Shared logic for the Discord price ticker, used by both the standalone
// long-running script (scripts/discord-price-ticker.mjs) and the Netlify
// scheduled function (netlify/functions/discord-price-ticker.mjs).

export const QDOGE_ISSUER_ID = 'QDOGEEESKYPAICECHEAHOXPULEOADTKGEJHAVYPFKHLEWGXXZQUGIGMBUTZE';
export const QPAY_ISSUER_ID = 'QPAYNOWSWZMGHFEAEVJXGZAVSHABAZDDBDIHTEBOPCOGHRGBCYCUZOHCVLXG';
export const QPAYHUB_ISSUER_ID = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB';

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

export async function fetchAveragePriceQu(issuer, asset) {
  const url = `https://api.quhub.app/service/v1/qx/issuer/${issuer}/asset/${asset}/chart/average-price`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Price feed returned ${res.status}`);
  const days = await res.json();
  const today = days.at(-1);
  if (!today) throw new Error('Price feed returned no data');
  return Math.round(today.averagePrice);
}

export function formatChannelName(ticker, priceQu) {
  return `${ticker.emoji} ${ticker.label} Price: ${priceQu.toLocaleString('en-US')} qu`;
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
  const priceQu = await fetchAveragePriceQu(ticker.issuer, ticker.asset);
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
