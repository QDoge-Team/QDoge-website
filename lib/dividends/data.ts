/**
 * Per-share dividend history (in qu) for Qubic tokens and smart contracts,
 * epochs 184-232 (232 is the last complete epoch as of 2026-09-30; 233 is
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
 * Prices are each asset's live "Last Price" (qu) on qxboard.com, refreshed
 * 2026-09-30 (previous snapshot: 2026-09-01) -- qx.qubic.org itself remains
 * deprecated (see prior note). Yields and payback periods move with price,
 * so these drift out of date; re-pull from qxboard.com (or whatever
 * succeeds it) on refresh. Aggregates (total/avg/yields/payback) are
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
export const EPOCH_TO = 232;

export const DIVIDEND_PROJECTS: DividendProject[] = [
  {
    name: 'QTREAT',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.2348,
    annualYieldPct: 12.21,
    paybackWeeks: 425.9,
    avgWeekly: 113190.03,
    totalDividends: 3848461,
    price: 48206500,
    // epochs 184..232 -- epoch 226 unknown (see file header: the 67314 previously recorded there was actually epoch 227's payout)
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, 39961, 36029, 55400, 288032, 318896, 248096, 232384, 210612, 189123, 156286, 154599, 127903, 118250, 123493, 102582, 89501, 88599, 87597, 89761, 81669, 80190, 79419, 83782, 73448, 73727, 76858, 67710, 71054, null, 67314, 66925, 65470, 68681, 67559, 67551],
  },
  {
    name: 'QIP',
    kind: 'contract',
    scIndex: 18,
    weeklyYieldPct: 0.4973,
    annualYieldPct: 25.86,
    paybackWeeks: 201.1,
    avgWeekly: 561981.43,
    totalDividends: 12925573,
    price: 113000001,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, 545018, 2208906, 32098, 167337, 2695350, 7094101, 26088, 100134, 1849, 53900, 423, 369, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'QMINE',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.0627,
    annualYieldPct: 3.26,
    paybackWeeks: 1594.6,
    avgWeekly: 2.08,
    totalDividends: 91.69,
    price: 3323,
    // epochs 184..232
    epochs: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 5, 2, 5, 2, 3, 2, 1.03, 0.93, 0.96, 1.72, 3.21, 1.47, 1.31, 0.1, 1.59, 1.22, 0.25, 1.84, 1.72, 1.65, 1.54, 1.37, null, null, null, null, null, 5.6009824, 0, 7.54814346, 2.58189888, 1.53561095, 2.51478754],
  },
  {
    name: 'RL',
    kind: 'contract',
    scIndex: 16,
    weeklyYieldPct: 0.0713,
    annualYieldPct: 3.71,
    paybackWeeks: 1401.6,
    avgWeekly: 48516.8,
    totalDividends: 1698088,
    price: 68000001,
    // epochs 184..232
    epochs: [19526, 10355, 31656, 163461, 616863, 261834, 143491, 77218, 72781, 7100, 94523, 46004, 24800, 47928, 27958, 81, 0, 3041, 10651, 5570, 5240, 1930, 16277, 9504, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 296, 0, 0, 0, 0],
  },
  {
    name: 'QRWA',
    kind: 'contract',
    scIndex: 20,
    weeklyYieldPct: 0.0491,
    annualYieldPct: 2.55,
    paybackWeeks: 2036.2,
    avgWeekly: 298760.72,
    totalDividends: 10755386,
    price: 608333333,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, 263942, 254398, 232495, 617160, 849655, 277462, 282033, 230109, 321229, 209494, 146136, 143511, 130547, 134017, 240396, 215543, 193635, 220435, 171224, 309069, 440522, 326556, 254747, 226589, 200882, 184860, 217033, 172450, 0, 893654, 820792, 0, 601832, 378205, 224951, 369823],
  },
  {
    name: 'QX',
    kind: 'contract',
    scIndex: 1,
    weeklyYieldPct: 0.0235,
    annualYieldPct: 1.22,
    paybackWeeks: 4259.2,
    avgWeekly: 2113060.12,
    totalDividends: 103539946,
    price: 9000000000,
    // epochs 184..232 -- 225/227 corrected using the more accurate chain-log read, see file header
    epochs: [353352, 5213601, 2122733, 846164, 645950, 882189, 2248160, 722157, 3607086, 480634, 3887334, 2108958, 681487, 12098906, 10715776, 8506098, 6829267, 9715154, 6379210, 944134, 2194350, 4688782, 3147873, 612702, 727820, 582077, 431974, 336943, 426051, 243880, 378977, 359969, 182740, 1812708, 1432197, 819827, 376294, 583775, 227400, 230360, 399257, 81507, 523290, 1757500, 250988, 526186, 290716, 406323, 519130],
  },
  {
    name: 'QCAP',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.0254,
    annualYieldPct: 1.32,
    paybackWeeks: 3943.5,
    avgWeekly: 59.59,
    totalDividends: 2920,
    price: 235000,
    // epochs 184..232
    epochs: [49, 8, 3, 5, 148, 55, 48, 16, 28, 5, 124, 90, 31, 128, 323, 525, 14, 311, 92, 37, 35, 73, 63, 32, 16, 24, 36, 19, 8, 5, 29, 14, 20, 45, 34, 21, 24, 16, 15, 20, 34, 32, 43, 121, 15, 9, 40, 14, 23],
  },
  {
    name: 'NOST',
    kind: 'contract',
    scIndex: 14,
    weeklyYieldPct: 0.003,
    annualYieldPct: 0.15,
    paybackWeeks: 33602.8,
    avgWeekly: 5951.88,
    totalDividends: 101182,
    price: 199999998,
    // epochs 184..232
    epochs: [5325, null, null, 1331, null, null, null, null, null, 42603, 7988, null, null, null, 1332, null, 42603, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'VOTTUN',
    kind: 'contract',
    scIndex: 25,
    weeklyYieldPct: 0.0538,
    annualYieldPct: 2.8,
    paybackWeeks: 1858.5,
    avgWeekly: 204460.62,
    totalDividends: 5315976,
    price: 380000000,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 332, 147618, 200236, 210980, 157664, 77554, 26662, 77045, 99285, 159990, 429484, 15641, 31009, 66240, 39736, 78460, 254475, 712415, 40554, 49578, 2441018, 0, 0, 0, 0, 0],
  },
  {
    name: 'QSWAP',
    kind: 'contract',
    scIndex: 13,
    weeklyYieldPct: 0.0111,
    annualYieldPct: 0.58,
    paybackWeeks: 9012.8,
    avgWeekly: 120846.1,
    totalDividends: 5921459,
    price: 1089166668,
    // epochs 184..232 -- 225 corrected using the more accurate chain-log read, see file header
    epochs: [9829, 330231, 26405, 39146, 27016, 25393, 327367, 344659, 39095, 29006, 38327, 14741, 22956, 64749, 899266, 9769, 306435, 355547, 337457, 321340, 43044, 319003, 24886, 34597, 19946, 23493, 605917, 16260, 25448, 12816, 16561, 25669, 35011, 42333, 44260, 31029, 45760, 38899, 29162, 29364, 26563, 308813, 21956, 35586, 322976, 56920, 43885, 39569, 32999],
  },
  {
    name: 'QRAFFLE',
    kind: 'contract',
    scIndex: 19,
    weeklyYieldPct: 0.0032,
    annualYieldPct: 0.16,
    paybackWeeks: 31594.5,
    avgWeekly: 1898.75,
    totalDividends: 75950,
    price: 59990000,
    // epochs 184..232 -- 223/225 corrected by a few qu using the chain-log read, see file header
    epochs: [null, null, null, null, null, null, null, null, 7988, 4205, 2196, 1420, null, 2130, 2218, 1331, 887, 1020, 221, 1331, 221, 4437, 44, 443, 1331, 1420, 2958, 2366, 4260, 4615, 946, 4733, 4970, 2366, 473, 591, 710, 591, 828, 5239, 946, 831, 710, 591, 1065, 1307, 710, 591, 710],
  },
  {
    name: 'QBAY',
    kind: 'contract',
    scIndex: 12,
    weeklyYieldPct: 0.0095,
    annualYieldPct: 0.49,
    paybackWeeks: 10521.7,
    avgWeekly: 20918.8,
    totalDividends: 962265,
    price: 220101007,
    // epochs 184..232
    epochs: [162630, 53461, 4881, 47736, 171183, 24717, 66234, 118, 27943, 13357, 1005, null, null, 11449, 2500, 1967, 1183, 39511, 10806, 12507, 8579, 1997, 4881, 7011, 17869, 118, 19881, 4637, 18713, 18047, 0, 369, 43890, 939, 27943, 562, null, 7396, 1612, 0, 11183, 6270, 0, 221, 0, 5103, 15828, 0, 86028],
  },
  {
    name: 'QVAULT',
    kind: 'contract',
    scIndex: 10,
    weeklyYieldPct: 0.0047,
    annualYieldPct: 0.24,
    paybackWeeks: 21351.2,
    avgWeekly: 16392.51,
    totalDividends: 803233,
    price: 350000000,
    // epochs 184..232
    epochs: [10981, 1941, 791, 1200, 33742, 12582, 15032, 2218, 6915, 1360, 15554, 12420, 12420, 17663, 44544, 75409, 14266, 44679, 13223, 5493, 5255, 84839, 24457, 19786, 17264, 18496, 5662, 2926, 1348, 862, 4520, 2231, 47587, 80878, 5378, 3382, 3778, 17367, 2393, 3183, 5450, 5045, 21567, 19013, 17168, 1483, 6288, 14793, 18401],
  },
  {
    name: 'MSVAULT',
    kind: 'contract',
    scIndex: 11,
    weeklyYieldPct: 0.0031,
    annualYieldPct: 0.16,
    paybackWeeks: 31915.3,
    avgWeekly: 6266.6,
    totalDividends: 294530,
    price: 200000000,
    // epochs 184..232
    epochs: [50000, 3255, 31952, 2223, 2662, 2219, null, null, 2663, 2219, 1775, 1480, 1479, 1775, 18195, 2219, 28255, 5029, 4290, 3994, 3254, 23373, 5030, 5029, 5622, 4289, 4438, 5917, 3846, 3255, 3698, 3402, 3255, 3550, 3550, 3551, 3550, 3254, 3551, 3106, 3846, 3403, 3254, 3551, 3254, 3846, 3255, 2958, 2959],
  },
  {
    name: 'QTRY',
    kind: 'contract',
    scIndex: 2,
    weeklyYieldPct: 0.0005,
    annualYieldPct: 0.03,
    paybackWeeks: 190900.9,
    avgWeekly: 2777.36,
    totalDividends: 38883,
    price: 530200000,
    // epochs 184..232
    epochs: [3698, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 9838, 25347, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
    price: 4000000000,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 26020001,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 2900000000,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 56500000,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 15000000,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 2702009,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QTF',
    kind: 'contract',
    scIndex: 22,
    weeklyYieldPct: 0.0069,
    annualYieldPct: 0.36,
    paybackWeeks: 14519.1,
    avgWeekly: 206.63,
    totalDividends: 1653,
    price: 3000003,
    // epochs 184..232 -- previously wrongly marked a permanent zero-payer, see file header
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 137, 0, 1516, 0, 0, 0, 0, 0],
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
    price: 4963640,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 20000000,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 106000000,
    // epochs 184..232
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'ESCROW',
    kind: 'contract',
    scIndex: 27,
    weeklyYieldPct: 0.0013,
    annualYieldPct: 0.07,
    paybackWeeks: 79697.7,
    avgWeekly: 1455.5,
    totalDividends: 14555,
    price: 116000001,
    // epochs 184..232 -- previously wrongly marked a permanent zero-payer, see file header
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 344, null, null, null, null, null, null, null, null, null, 2408, 2407, 688, 3027, 0, 1994, 1968, 1719, 0],
  },
  {
    name: 'GGWP',
    kind: 'contract',
    scIndex: 28,
    weeklyYieldPct: 0.0386,
    annualYieldPct: 2.01,
    paybackWeeks: 2587.8,
    avgWeekly: 33812.07,
    totalDividends: 473369,
    price: 87500000,
    // epochs 184..232 -- previously wrongly marked a permanent zero-payer, see file header
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 73964, 44378, 0, 88757, 44378, 0, 88757, 44378, 0, 0, 88757, 0, 0, 0],
  },
  {
    name: 'QPAY',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.008,
    annualYieldPct: 0.41,
    paybackWeeks: 12571.6,
    avgWeekly: 0.04,
    totalDividends: 0.08,
    price: 515,
    // epochs 184..232 -- new project, only tracked since epoch 231
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.060276, 0.021655],
  },
  {
    name: 'QPAYHUB',
    kind: 'contract',
    scIndex: 29,
    weeklyYieldPct: 0.0029,
    annualYieldPct: 0.15,
    paybackWeeks: 34887.4,
    avgWeekly: 3153,
    totalDividends: 6306,
    price: 109999999,
    // epochs 184..232 -- new project, only tracked since epoch 231 (contract index confirmed via /v1/assets/ownerships: 676 shares, matching dividends.qubic.tools's unlabeled "contract #29")
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 4618, 1688],
  },
];

/**
 * QTREAT circulating supply at the end of each epoch (from the team's
 * "dividends" sheet emission log, cross-checked against a live RPC balance
 * query on 2026-07-20 -- epoch 221's figure matched the live circulating
 * supply exactly). Tokens release gradually; max supply is fixed at 6,000.
 * Only defined for epochs QTREAT has actually paid (198 onward).
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
};

/**
 * QTREAT's own treasury holdings -- the assets that actually generate the
 * qu dividends paid out to QTREAT holders. Supplied directly by the team,
 * 2026-09.
 */
export type TreasuryAssetKind = 'sc-share' | 'token' | 'income';

export type TreasuryAsset = {
  name: string;
  kind: TreasuryAssetKind;
  amount: number;
  unit: string;
  note?: string;
};

export const QTREAT_TREASURY_ASSETS: TreasuryAsset[] = [
  { name: 'QRAFFLE', kind: 'sc-share', amount: 22, unit: 'shares' },
  { name: 'MSVAULT', kind: 'sc-share', amount: 12, unit: 'shares' },
  { name: 'QRWA', kind: 'sc-share', amount: 12, unit: 'shares' },
  { name: 'QSWAP', kind: 'sc-share', amount: 1, unit: 'share' },
  { name: 'QIP', kind: 'sc-share', amount: 1, unit: 'share' },
  { name: 'VOTTUN', kind: 'sc-share', amount: 1, unit: 'share' },
  { name: 'QBAY', kind: 'sc-share', amount: 6, unit: 'shares' },
  { name: 'QMINE', kind: 'token', amount: 1357051, unit: 'tokens' },
  { name: 'WP', kind: 'token', amount: 4000000, unit: 'tokens', note: 'staked' },
  { name: 'ML', kind: 'token', amount: 4000000, unit: 'tokens' },
  { name: 'Mining rewards', kind: 'income', amount: 10000000, unit: 'qu' },
  { name: 'NFT sales', kind: 'income', amount: 192000000, unit: 'qu' },
];
