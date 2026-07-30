/**
 * Per-share dividend history (in qu) for Qubic tokens and smart contracts,
 * epochs 184-223. Base history (184-221) from the QTREAT dividends comparison
 * sheet. Epoch 222/223 verified per-asset from dividends.qubic.tools (which
 * only tracks smart-contract dividend payers -- it does NOT track QTREAT,
 * QMINE, or QCAP, since those pay via direct issuer transfers rather than the
 * SC dividend mechanism). QTREAT's own epoch 222/223 supplied by the team.
 * Aggregates (total/avg/yields/payback) are recomputed from the per-epoch
 * series rather than taken from any summary columns, which lag the epoch
 * data. Regenerate when a new snapshot lands.
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
export const EPOCH_TO = 223;

export const DIVIDEND_PROJECTS: DividendProject[] = [
  {
    name: 'QTREAT',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.6358,
    annualYieldPct: 33.06,
    paybackWeeks: 157.3,
    avgWeekly: 127161.42,
    totalDividends: 3306197,
    price: 20000000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, 39961, 36029, 55400, 288032, 318896, 248096, 232384, 210612, 189123, 156286, 154599, 127903, 118250, 123493, 102582, 89501, 88599, 87597, 89761, 81669, 80190, 79419, 83782, 73448, 73727, 76858],
  },
  {
    name: 'QIP',
    kind: 'contract',
    scIndex: 18,
    weeklyYieldPct: 0.3078,
    annualYieldPct: 16,
    paybackWeeks: 324.9,
    avgWeekly: 923255.21,
    totalDividends: 12925573,
    price: 300000000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, 545018, 2208906, 32098, 167337, 2695350, 7094101, 26088, 100134, 1849, 53900, 423, 369, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0],
  },
  {
    name: 'QMINE',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.0462,
    annualYieldPct: 2.4,
    paybackWeeks: 2166.6,
    avgWeekly: 1.89,
    totalDividends: 71.91,
    price: 4100,
    // epochs 184..223
    epochs: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 5, 2, 5, 2, 3, 2, 1.03, 0.93, 0.96, 1.72, 3.21, 1.47, 1.31, 0.1, 1.59, 1.22, 0.25, 1.84, 1.72, 1.65, 1.54, 1.37, null, null],
  },
  {
    name: 'RL',
    kind: 'contract',
    scIndex: 16,
    weeklyYieldPct: 0.0473,
    annualYieldPct: 2.46,
    paybackWeeks: 2115.9,
    avgWeekly: 65299.69,
    totalDividends: 1697792,
    price: 138166666.67,
    // epochs 184..223
    epochs: [19526, 10355, 31656, 163461, 616863, 261834, 143491, 77218, 72781, 7100, 94523, 46004, 24800, 47928, 27958, 81, 0, 3041, 10651, 5570, 5240, 1930, 16277, 9504, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0],
  },
  {
    name: 'QRWA',
    kind: 'contract',
    scIndex: 20,
    weeklyYieldPct: 0.0353,
    annualYieldPct: 1.84,
    paybackWeeks: 2830.3,
    avgWeekly: 257920.33,
    totalDividends: 6963848.78,
    price: 730000000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, 263942, 254398, 232495, 617160, 277462, 1477271, 230109, 321229, 209494, 334977, 143511, 143511, 130547, 134017, 240396, 215543, 193635, 220435, 171224, 309069, 440522, 326.56, 254.75, 226.59, 200.88, 184860, 217033],
  },
  {
    name: 'QX',
    kind: 'contract',
    scIndex: 1,
    weeklyYieldPct: 0.0204,
    annualYieldPct: 1.06,
    paybackWeeks: 4895.1,
    avgWeekly: 2413104.07,
    totalDividends: 96524162.9,
    price: 11812500000,
    // epochs 184..223
    epochs: [353352, 5213601, 2122733, 846164, 645950, 882189, 2248160, 722157, 3607086, 480634, 3887334, 2108958, 681487, 12098906, 10715776, 8506098, 6829267, 9715154, 6379210, 944134, 2194350, 4688782, 3121047, 612702, 727820, 582077, 431974, 336943, 426051, 243880, 378977, 359969, 182740, 1812708, 1432197, 819.83, 376.29, 583.78, 1812, 4],
  },
  {
    name: 'QCAP',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.0215,
    annualYieldPct: 1.12,
    paybackWeeks: 4654.2,
    avgWeekly: 67.21,
    totalDividends: 2554,
    price: 312814.13,
    // epochs 184..223
    epochs: [49, 8, 3, 5, 148, 55, 48, 16, 28, 5, 124, 90, 31, 128, 323, 525, 14, 311, 92, 37, 35, 73, 63, 32, 16, 24, 36, 19, 8, 5, 29, 14, 20, 45, 34, 21, 24, 16, null, null],
  },
  {
    name: 'NOST',
    kind: 'contract',
    scIndex: 14,
    weeklyYieldPct: 0.0063,
    annualYieldPct: 0.33,
    paybackWeeks: 15813.1,
    avgWeekly: 12647.75,
    totalDividends: 101182,
    price: 200000000,
    // epochs 184..223
    epochs: [5325, null, null, 1331, null, null, null, null, null, 42603, 7988, null, null, null, 1332, null, 42603, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0],
  },
  {
    name: 'VOTTUN',
    kind: 'contract',
    scIndex: 25,
    weeklyYieldPct: 0.0077,
    annualYieldPct: 0.4,
    paybackWeeks: 12986.5,
    avgWeekly: 112937.51,
    totalDividends: 1919937.63,
    price: 1466666666.33,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 332, 147618, 200236, 210980, 157664, 77554, 26662, 77045, 99285, 159990, 429484, 15.64, 31.01, 66.24, 39.74, 78460, 254475],
  },
  {
    name: 'QSWAP',
    kind: 'contract',
    scIndex: 13,
    weeklyYieldPct: 0.008,
    annualYieldPct: 0.41,
    paybackWeeks: 12573.7,
    avgWeekly: 119296.23,
    totalDividends: 4771849.28,
    price: 1500000000,
    // epochs 184..223
    epochs: [9829, 330231, 26405, 39146, 27016, 25393, 327367, 344659, 39095, 29006, 38327, 14741, 22956, 64749, 899266, 9769, 306435, 355547, 337457, 321340, 43044, 319003, 24886, 34597, 19946, 23493, 605917, 16260, 25448, 12816, 16561, 25669, 35011, 42.33, 44.26, 31.03, 45.76, 38.9, 130, 132],
  },
  {
    name: 'QRAFFLE',
    kind: 'contract',
    scIndex: 19,
    weeklyYieldPct: 0.0033,
    annualYieldPct: 0.17,
    paybackWeeks: 29853.7,
    avgWeekly: 2344.77,
    totalDividends: 70343,
    price: 69999999,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, 7988, 4205, 2196, 1420, 7433, 2130, 2218, 1331, 887, 1508, 221, 1331, 221, 4437, 44, 443, 1331, 1420, 2958, 2366, 4260, 4615, 946, 4733, 4970, 2366, 473, 591, 710, 591, null, null],
  },
  {
    name: 'QBAY',
    kind: 'contract',
    scIndex: 12,
    weeklyYieldPct: 0.0049,
    annualYieldPct: 0.26,
    paybackWeeks: 20267.2,
    avgWeekly: 21709.93,
    totalDividends: 803267.34,
    price: 440000000,
    // epochs 184..223
    epochs: [162630, 53461, 4881, 47736, 171183, 24717, 66234, 118, 27943, 13357, 1005, null, null, 11449, 2500, 1967, 1183, 39511, 10806, 12507, 8579, 1997, 4881, 7011, 17869, 118, 19881, 4637, 18713, 18047, null, 369, 43890, 939, 939, 27.94, 562, 7.4, 1612, 0],
  },
  {
    name: 'QVAULT',
    kind: 'contract',
    scIndex: 10,
    weeklyYieldPct: 0.0054,
    annualYieldPct: 0.28,
    paybackWeeks: 18353.7,
    avgWeekly: 16345.52,
    totalDividends: 653820.81,
    price: 300000000,
    // epochs 184..223
    epochs: [10981, 1941, 791, 1200, 33742, 12582, 11006, 4026, 6915, 1360, 15554, 12420, 4309, 17663, 44544, 75409, 14266, 44679, 13223, 5493, 5255, 84839, 24457, 19786, 17264, 18496, 5662, 2926, 1348, 862, 4520, 2231, 47587, 80878, 5.38, 3.28, 3.78, 17.37, 2393, 3183],
  },
  {
    name: 'MSVAULT',
    kind: 'contract',
    scIndex: 11,
    weeklyYieldPct: 0.0018,
    annualYieldPct: 0.09,
    paybackWeeks: 56837.7,
    avgWeekly: 6587.18,
    totalDividends: 250312.9,
    price: 374400000,
    // epochs 184..223
    epochs: [50000, 3255, 31952, 2223, 2662, 2219, null, null, 2663, 2219, 1775, 1480, 1479, 1775, 18195, 2219, 28255, 5029, 4290, 3994, 3254, 23373, 5030, 5029, 5622, 4289, 4438, 5917, 3846, 3255, 3698, 3402, 3255, 3550, 3.55, 3.55, 3.55, 3.25, 3551, 3106],
  },
  {
    name: 'QTRY',
    kind: 'contract',
    scIndex: 2,
    weeklyYieldPct: 0.0013,
    annualYieldPct: 0.07,
    paybackWeeks: 79096.3,
    avgWeekly: 7776.6,
    totalDividends: 38883,
    price: 615100000,
    // epochs 184..223
    epochs: [3698, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 9838, 25347, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0],
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
    price: 2820000000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 30000002,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 2700000004,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 12500000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 67499999.5,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 9400000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QTF',
    kind: 'contract',
    scIndex: 22,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 6000000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 4800004,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 42200000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    price: 68000000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'ESCROW',
    kind: 'contract',
    scIndex: 27,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 159000000,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'GGWP',
    kind: 'contract',
    scIndex: 28,
    weeklyYieldPct: 0,
    annualYieldPct: 0,
    paybackWeeks: null,
    avgWeekly: 0,
    totalDividends: 0,
    price: 140999999,
    // epochs 184..223
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
};
