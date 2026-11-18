/**
 * Per-share dividend history (in qu) for Qubic tokens and smart contracts,
 * epochs 184-238 (238 is the last complete epoch as of 2026-11-18; 239 is
 * still in progress). Base history (184-221) from the QTREAT dividends
 * comparison sheet. Epochs 222-232 verified per-asset from
 * dividends.qubic.tools's "Dividends" tab (v0.4.2, reads chain event logs
 * directly -- confirmed far more reliable than the old balance-change
 * estimator: QCAP/QRWA/QBAY/QVAULT/MSVAULT matched our existing figures
 * exactly at every overlapping epoch). Falls back to the "Old version"
 * estimator tab only for contracts the new tab hasn't started tracking yet
 * (QIP, QTRY -- both confirmed flat 0 through 232 either way).
 *
 * This pass also found three projects wrongly marked as permanent
 * zero-payers that have real, previously-missed histories: GGWP (paying
 * since epoch 219), ESCROW (since 214), and QTF (since 225) -- backfilled
 * here from the chain log, aggregates now computed from real data.
 *
 * QX and QSWAP (very high payout-count epochs, 100s-1000s of individual
 * transactions each) showed real, non-trivial differences between the old
 * estimator and the new chain-log read for a couple of already-recorded
 * epochs (e.g. QX epoch 225: 6 -> 81,507). The chain-log read is the more
 * accurate source (it doesn't sample/estimate), so those epochs were
 * corrected in place rather than left inconsistent.
 *
 * QTREAT epoch 226: resolved (confirmed 2026-09-30) -- the 67,314 figure
 * originally reported to us as epoch 226 was actually epoch 227's payout, a
 * one-message mislabel (QCAP, reported in the same batch, had no such
 * issue). Moved to epoch 227; epoch 226 itself has no known source and is
 * left null rather than guessed.
 *
 * Epochs 233-235 added 2026-10-21 from dividends.qubic.tools's per-asset
 * pages (same source as 222-232); QIP/NOST/QTRY aren't tracked there, so they
 * were checked on chain instead (only 100-qu fee transfers, no dividends ->
 * 0). QTREAT is the one that needs care: since epoch 233 a holder receives
 * TWO payments per epoch -- the team's QUtil distribution (what
 * dividends.qubic.tools lists as the QTREAT token: 79,616 / 24,480 / 33,894)
 * AND the QTREAT contract's own rollover payout, which the tool does not
 * count as token income (47,500 / 75,640 / 62,214 per eligible token,
 * measured from payouts to several steady holders). The QTREAT series stores
 * the sum a holder actually received: 127,116 / 100,120 / 96,108. (For epoch
 * 233 the tool's 79,616 already included the manual part, so the contract's
 * 47,500 was added on top.)
 *
 * Epochs 236-238 added 2026-11-18 the same way (per-asset pages of
 * dividends.qubic.tools; a project missing from a page's epoch list = no payout
 * that epoch = 0). QIP/NOST/QTRY aren't tracked there and were re-checked on
 * chain: QIP/NOST only 100-qu fee transfers, QTRY only single-recipient bet
 * payouts, no per-share dividends -> 0.
 *
 * QTREAT changed again: the team's manual QUtil distribution (the 233-235 second
 * stream described above) stopped after epoch 235. From 236 a holder receives only
 * the QTREAT contract's own rollover payout, measured on chain from holders whose
 * balance did not change (57,597 / 56,640 / 84,064 per token for 236 / 237 / 238).
 * dividends.qubic.tools lists only 236 (57,596.8) for the token and misses 237 and
 * 238, so those two come from the chain, not the tool.
 *
 * QPUMP added 2026-11-18 (smart contract index 31, read from the sender of its
 * payout, FBAAA...PAKO = 5 + 1*26; 676 shares). Only tracked from epoch 238 so far,
 * and its yield is extrapolated from that single 591,715 payout: treat it as
 * provisional until it has more history.
 *
 * Prices are now the 7-day volume-weighted average of each asset's QX trades
 * (quhub.app, refreshed 2026-11-18, previously 2026-10-21; previous snapshot: qxboard.com "Last
 * Price", 2026-09-30). Assets with no trade that week use their last trade if
 * it is under 60 days old, otherwise the previous price is kept (QEARN).
 * Yields and payback periods move with price, so these drift out of date. Aggregates (total/avg/yields/payback) are
 * recomputed from the per-epoch series rather than taken from any summary
 * columns, which lag the epoch data. Regenerate when a new snapshot lands.
 *
 * QPAY and QPAYHUB added 2026-09-30 (both new, only tracked by
 * dividends.qubic.tools since epoch 231): QPAY is a QX-issued token; QPAYHUB
 * is a native smart-contract share (scIndex 29, confirmed empirically via
 * /v1/assets/ownerships -- 676 shares, matching the exact share count of the
 * site's unlabeled "contract #29" entry -- since this repo's local core
 * checkout doesn't yet register it by name in contract_def.h).
 */

export type DividendProject = {
  name: string;
  /** 'token' = QX asset, 'contract' = smart contract shares. */
  kind: 'token' | 'contract';
  scIndex: number | null;
  weeklyYieldPct: number;
  annualYieldPct: number;
  /** Weeks of dividends to recoup the share price; null if never paid. */
  paybackWeeks: number | null;
  avgWeekly: number;
  totalDividends: number;
  /** Share price in qu (QX snapshot). */
  price: number;
  /** Dividends per share per epoch (qu); null = no data / not live yet. */
  epochs: Array<number | null>;
};

export const EPOCH_FROM = 184;
export const EPOCH_TO = 238;

export const DIVIDEND_PROJECTS: DividendProject[] = [
  {
    name: 'QTREAT',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.2323,
    annualYieldPct: 12.08,
    paybackWeeks: 430.6,
    avgWeekly: 109252.65,
    totalDividends: 4370106,
    price: 47040816,
    // epochs 184..238 -- epoch 226 unknown (see file header: the 67314 previously recorded there was actually epoch 227's payout)
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, 39961, 36029, 55400, 288032, 318896, 248096, 232384, 210612, 189123, 156286, 154599, 127903, 118250, 123493, 102582, 89501, 88599, 87597, 89761, 81669, 80190, 79419, 83782, 73448, 73727, 76858, 67710, 71054, null, 67314, 66925, 65470, 68681, 67559, 67551, 127116, 100120, 96108, 57597, 56640, 84064],
  },
  {
    name: 'QIP',
    kind: 'contract',
    scIndex: 18,
    weeklyYieldPct: 0.9689,
    annualYieldPct: 50.38,
    paybackWeeks: 103.2,
    avgWeekly: 445709.41,
    totalDividends: 12925573,
    price: 46000001,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, 545018, 2208906, 32098, 167337, 2695350, 7094101, 26088, 100134, 1849, 53900, 423, 369, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'QMINE',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.0698,
    annualYieldPct: 3.63,
    paybackWeeks: 1433.6,
    avgWeekly: 2.5,
    totalDividends: 124.86,
    price: 3580,
    // epochs 184..238
    epochs: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 5, 2, 5, 2, 3, 2, 1.03, 0.93, 0.96, 1.72, 3.21, 1.47, 1.31, 0.1, 1.59, 1.22, 0.25, 1.84, 1.72, 1.65, 1.54, 1.37, null, null, null, null, null, 5.6009824, 0, 7.54814346, 2.58189888, 1.53561095, 2.51478754, 12.64463528, 7.9078087, 2.52471716, 0, 0, 10.09140734],
  },
  {
    name: 'RL',
    kind: 'contract',
    scIndex: 16,
    weeklyYieldPct: 0.0609,
    annualYieldPct: 3.17,
    paybackWeeks: 1640.8,
    avgWeekly: 41442,
    totalDividends: 1699122,
    price: 68000001,
    // epochs 184..238
    epochs: [19526, 10355, 31656, 163461, 616863, 261834, 143491, 77218, 72781, 7100, 94523, 46004, 24800, 47928, 27958, 81, 0, 3041, 10651, 5570, 5240, 1930, 16277, 9504, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 296, 0, 0, 0, 0, 0, 443, 296, 0, 295, 0],
  },
  {
    name: 'QRWA',
    kind: 'contract',
    scIndex: 20,
    weeklyYieldPct: 0.0453,
    annualYieldPct: 2.36,
    paybackWeeks: 2207.2,
    avgWeekly: 355978.98,
    totalDividends: 14951117,
    price: 785725000,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, 263942, 254398, 232495, 617160, 849655, 277462, 282033, 230109, 321229, 209494, 146136, 143511, 130547, 134017, 240396, 215543, 193635, 220435, 171224, 309069, 440522, 326556, 254747, 226589, 200882, 184860, 217033, 172450, 0, 893654, 820792, 0, 601832, 378205, 224951, 369823, 1598780, 1165748, 369823, 0, 0, 1061380],
  },
  {
    name: 'QX',
    kind: 'contract',
    scIndex: 1,
    weeklyYieldPct: 0.0283,
    annualYieldPct: 1.47,
    paybackWeeks: 3533.4,
    avgWeekly: 1995227.91,
    totalDividends: 109737535,
    price: 7050000000,
    // epochs 184..238 -- 225/227 corrected using the more accurate chain-log read, see file header
    epochs: [353352, 5213601, 2122733, 846164, 645950, 882189, 2248160, 722157, 3607086, 480634, 3887334, 2108958, 681487, 12098906, 10715776, 8506098, 6829267, 9715154, 6379210, 944134, 2194350, 4688782, 3147873, 612702, 727820, 582077, 431974, 336943, 426051, 243880, 378977, 359969, 182740, 1812708, 1432197, 819827, 376294, 583775, 227400, 230360, 399257, 81507, 523290, 1757500, 250988, 526186, 290716, 406323, 519130, 1856754, 233400, 158450, 137431, 220174, 3591380],
  },
  {
    name: 'QCAP',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.0213,
    annualYieldPct: 1.11,
    paybackWeeks: 4702.3,
    avgWeekly: 58.16,
    totalDividends: 3199,
    price: 273501,
    // epochs 184..238
    epochs: [49, 8, 3, 5, 148, 55, 48, 16, 28, 5, 124, 90, 31, 128, 323, 525, 14, 311, 92, 37, 35, 73, 63, 32, 16, 24, 36, 19, 8, 5, 29, 14, 20, 45, 34, 21, 24, 16, 15, 20, 34, 32, 43, 121, 15, 9, 40, 14, 23, 77, 52, 19, 4, 3, 124],
  },
  {
    name: 'NOST',
    kind: 'contract',
    scIndex: 14,
    weeklyYieldPct: 0.0022,
    annualYieldPct: 0.11,
    paybackWeeks: 45462.6,
    avgWeekly: 4399.22,
    totalDividends: 101182,
    price: 199999994,
    // epochs 184..238
    epochs: [5325, null, null, 1331, null, null, null, null, null, 42603, 7988, null, null, null, 1332, null, 42603, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'VOTTUN',
    kind: 'contract',
    scIndex: 25,
    weeklyYieldPct: 0.0286,
    annualYieldPct: 1.49,
    paybackWeeks: 3501.4,
    avgWeekly: 166124.25,
    totalDividends: 5315976,
    price: 581666667,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 332, 147618, 200236, 210980, 157664, 77554, 26662, 77045, 99285, 159990, 429484, 15641, 31009, 66240, 39736, 78460, 254475, 712415, 40554, 49578, 2441018, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'QSWAP',
    kind: 'contract',
    scIndex: 13,
    weeklyYieldPct: 0.0142,
    annualYieldPct: 0.74,
    paybackWeeks: 7036.2,
    avgWeekly: 120803.45,
    totalDividends: 6644190,
    price: 850000000,
    // epochs 184..238 -- 225 corrected using the more accurate chain-log read, see file header
    epochs: [9829, 330231, 26405, 39146, 27016, 25393, 327367, 344659, 39095, 29006, 38327, 14741, 22956, 64749, 899266, 9769, 306435, 355547, 337457, 321340, 43044, 319003, 24886, 34597, 19946, 23493, 605917, 16260, 25448, 12816, 16561, 25669, 35011, 42333, 44260, 31029, 45760, 38899, 29162, 29364, 26563, 308813, 21956, 35586, 322976, 56920, 43885, 39569, 32999, 35315, 17980, 20605, 13652, 24432, 610747],
  },
  {
    name: 'QRAFFLE',
    kind: 'contract',
    scIndex: 19,
    weeklyYieldPct: 0.0112,
    annualYieldPct: 0.58,
    paybackWeeks: 8955,
    avgWeekly: 3339,
    totalDividends: 153594,
    price: 29900900,
    // epochs 184..238 -- 223/225 corrected by a few qu using the chain-log read, see file header
    epochs: [null, null, null, null, null, null, null, null, 7988, 4205, 2196, 1420, null, 2130, 2218, 1331, 887, 1020, 221, 1331, 221, 4437, 44, 443, 1331, 1420, 2958, 2366, 4260, 4615, 946, 4733, 4970, 2366, 473, 591, 710, 591, 828, 5239, 946, 831, 710, 591, 1065, 1307, 710, 591, 710, 591, 710, 591, 602, 591, 74559],
  },
  {
    name: 'QBAY',
    kind: 'contract',
    scIndex: 12,
    weeklyYieldPct: 0.0061,
    annualYieldPct: 0.32,
    paybackWeeks: 16380.8,
    avgWeekly: 24418.77,
    totalDividends: 1269776,
    price: 400000000,
    // epochs 184..238
    epochs: [162630, 53461, 4881, 47736, 171183, 24717, 66234, 118, 27943, 13357, 1005, null, null, 11449, 2500, 1967, 1183, 39511, 10806, 12507, 8579, 1997, 4881, 7011, 17869, 118, 19881, 4637, 18713, 18047, 0, 369, 43890, 939, 27943, 562, null, 7396, 1612, 0, 11183, 6270, 0, 221, 0, 5103, 15828, 0, 86028, 30014, 255103, 17085, 0, 4940, 369],
  },
  {
    name: 'QVAULT',
    kind: 'contract',
    scIndex: 10,
    weeklyYieldPct: 0.0028,
    annualYieldPct: 0.15,
    paybackWeeks: 35223.7,
    avgWeekly: 16608.13,
    totalDividends: 913447,
    price: 585000000,
    // epochs 184..238
    epochs: [10981, 1941, 791, 1200, 33742, 12582, 15032, 2218, 6915, 1360, 15554, 12420, 12420, 17663, 44544, 75409, 14266, 44679, 13223, 5493, 5255, 84839, 24457, 19786, 17264, 18496, 5662, 2926, 1348, 862, 4520, 2231, 47587, 80878, 5378, 3382, 3778, 17367, 2393, 3183, 5450, 5045, 21567, 19013, 17168, 1483, 6288, 14793, 18401, 12289, 44379, 17963, 663, 14793, 20127],
  },
  {
    name: 'MSVAULT',
    kind: 'contract',
    scIndex: 11,
    weeklyYieldPct: 0.0026,
    annualYieldPct: 0.14,
    paybackWeeks: 38408.8,
    avgWeekly: 6508.92,
    totalDividends: 344973,
    price: 250000000,
    // epochs 184..238
    epochs: [50000, 3255, 31952, 2223, 2662, 2219, null, null, 2663, 2219, 1775, 1480, 1479, 1775, 18195, 2219, 28255, 5029, 4290, 3994, 3254, 23373, 5030, 5029, 5622, 4289, 4438, 5917, 3846, 3255, 3698, 3402, 3255, 3550, 3550, 3551, 3550, 3254, 3551, 3106, 3846, 3403, 3254, 3551, 3254, 3846, 3255, 2958, 2959, 3698, 11686, 3994, 12278, 5030, 13757],
  },
  {
    name: 'QTRY',
    kind: 'contract',
    scIndex: 2,
    weeklyYieldPct: 0.0004,
    annualYieldPct: 0.02,
    paybackWeeks: 253303.5,
    avgWeekly: 1944.15,
    totalDividends: 38883,
    price: 492460000,
    // epochs 184..238
    epochs: [3698, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 9838, 25347, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'RANDOM',
    kind: 'contract',
    scIndex: 3,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 3500000002,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QUTIL',
    kind: 'contract',
    scIndex: 4,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 59624970,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'MLM',
    kind: 'contract',
    scIndex: 5,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 1800000000,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QEARN',
    kind: 'contract',
    scIndex: 9,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 2200002,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QDRAW',
    kind: 'contract',
    scIndex: 15,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 3000008,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QBOND',
    kind: 'contract',
    scIndex: 17,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 50000000,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QRP',
    kind: 'contract',
    scIndex: 21,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 1888803,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QTF',
    kind: 'contract',
    scIndex: 22,
    weeklyYieldPct: 0.0022,
    annualYieldPct: 0.12,
    paybackWeeks: 44464.6,
    avgWeekly: 157.43,
    totalDividends: 2204,
    price: 6999999,
    // epochs 184..238 -- previously wrongly marked a permanent zero-payer, see file header
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 137, 0, 1516, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 551],
  },
  {
    name: 'QDUEL',
    kind: 'contract',
    scIndex: 23,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 3100001,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'PULSE',
    kind: 'contract',
    scIndex: 24,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 30000000,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QUSINO',
    kind: 'contract',
    scIndex: 26,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 54000001,
    // epochs 184..238
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'ESCROW',
    kind: 'contract',
    scIndex: 27,
    weeklyYieldPct: 0.0011,
    annualYieldPct: 0.06,
    paybackWeeks: 94208.3,
    avgWeekly: 1167.62,
    totalDividends: 18682,
    price: 110000000,
    // epochs 184..238 -- previously wrongly marked a permanent zero-payer, see file header
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 344, null, null, null, null, null, null, null, null, null, 2408, 2407, 688, 3027, 0, 1994, 1968, 1719, 0, 1720, 0, 344, 688, 1031, 344],
  },
  {
    name: 'GGWP',
    kind: 'contract',
    scIndex: 28,
    weeklyYieldPct: 0.0426,
    annualYieldPct: 2.22,
    paybackWeeks: 2344.9,
    avgWeekly: 23668.45,
    totalDividends: 473369,
    price: 55500003,
    // epochs 184..238 -- previously wrongly marked a permanent zero-payer, see file header
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 73964, 44378, 0, 88757, 44378, 0, 88757, 44378, 0, 0, 88757, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'QPAY',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.0038,
    annualYieldPct: 0.2,
    paybackWeeks: 26100,
    avgWeekly: 0.04,
    totalDividends: 0.29,
    price: 958.93,
    // epochs 184..238 -- new project, only tracked since epoch 231
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.060276, 0.021655, 0.078512, 0.029226, 0.01667585, 0.04397877, 0, 0.04360091],
  },
  {
    name: 'QPAYHUB',
    kind: 'contract',
    scIndex: 29,
    weeklyYieldPct: 0.0023,
    annualYieldPct: 0.12,
    paybackWeeks: 42968.2,
    avgWeekly: 2909.12,
    totalDividends: 23273,
    price: 125000000,
    // epochs 184..238 -- new project, only tracked since epoch 231 (contract index confirmed via /v1/assets/ownerships: 676 shares, matching dividends.qubic.tools's unlabeled "contract #29")
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 4618, 1688, 6251, 2346, 1339, 3531, 0, 3500],
  },
  {
    name: 'QPUMP',
    kind: 'contract',
    scIndex: 31,
    weeklyYieldPct: 0.2346,
    annualYieldPct: 12.2,
    paybackWeeks: 426.2,
    avgWeekly: 591715,
    totalDividends: 591715,
    price: 252180001,
    // epochs 184..238 -- new project, only tracked since epoch 238 (contract index 31 read from the sender of its payout, FBAAA...PAKO = 5 + 1*26)
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 591715],
  },
];

/**
 * QTREAT circulating supply at the end of each epoch (from the team's
 * "dividends" sheet emission log, cross-checked against a live RPC balance
 * query on 2026-07-20 -- epoch 221's figure matched the live circulating
 * supply exactly). Tokens release gradually; max supply is fixed at 6,000.
 * Only defined for epochs QTREAT has actually paid (198 onward). Epochs 235 and
 * 238 are the live circulating supply read on 2026-10-21 and 2026-11-18 (site
 * holders API, excluding issuer/contract-held); 226-234 and 236-237 were never
 * recorded and fall back to the last known figure.
 */
export const QTREAT_MAX_SUPPLY = 6000;

export const QTREAT_SUPPLY_BY_EPOCH: Record<number, number> = {
  198: 166,
  199: 234,
  200: 319,
  201: 543,
  202: 609,
  203: 683,
  204: 752,
  205: 821,
  206: 1004,
  207: 1154,
  208: 1247,
  209: 1463,
  210: 1539,
  211: 1682,
  212: 1865,
  213: 2105,
  214: 2103,
  215: 2111,
  216: 2197,
  217: 2364,
  218: 2376,
  219: 2428,
  220: 2493,
  221: 2610,
  222: 2624,
  223: 2819,
  224: 2902,
  225: 3035,
  235: 3555,
  238: 3699,
};
