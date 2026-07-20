/**
 * Per-share dividend history (in qu) for Qubic tokens and smart contracts,
 * epochs 184-217. Source: QTREAT dividends comparison sheet (QX price snapshot
 * at epoch 217). Regenerate from the CSV when a new snapshot lands.
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
export const EPOCH_TO = 217;

export const DIVIDEND_PROJECTS: DividendProject[] = [
  {
    name: 'QTREAT',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.71,
    annualYieldPct: 36.9,
    paybackWeeks: 140.91,
    avgWeekly: 141938.65,
    totalDividends: 2838773,
    price: 20000000,
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, 39961, 36029, 55400, 288032, 318896, 248096, 232384, 210612, 189123, 156286, 154599, 127903, 118250, 123493, 102582, 89501, 88599, 87597, 89761, 81669],
  },
  {
    name: 'QIP',
    kind: 'contract',
    scIndex: 18,
    weeklyYieldPct: 0.36,
    annualYieldPct: 18.67,
    paybackWeeks: 278.52,
    avgWeekly: 1077131.08,
    totalDividends: 12925573,
    price: 300000000,
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, 545018, 2208906, 32098, 167337, 2695350, 7094101, 26088, 100134, 1849, 53900, 423, 369, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QMINE',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.06,
    annualYieldPct: 2.87,
    paybackWeeks: 1810.39,
    avgWeekly: 2.26,
    totalDividends: 77,
    price: 4100,
    // epochs 184..217
    epochs: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 5, 2, 5, 2, 3, 2, 2, 2, 1, 1, 5, 2, 2, 2, 2, 3, 2, 3],
  },
  {
    name: 'RL',
    kind: 'contract',
    scIndex: 16,
    weeklyYieldPct: 0.05,
    annualYieldPct: 2.66,
    paybackWeeks: 1953.13,
    avgWeekly: 70741.33,
    totalDividends: 1697792,
    price: 138166666.67,
    // epochs 184..217
    epochs: [19526, 10355, 31656, 163461, 616863, 261834, 143491, 77218, 72781, 7100, 94523, 46004, 24800, 47928, 27958, 81, 0, 3041, 10651, 5570, 5240, 1930, 16277, 9504, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'QRWA',
    kind: 'contract',
    scIndex: 20,
    weeklyYieldPct: 0.04,
    annualYieldPct: 2.23,
    paybackWeeks: 2336.55,
    avgWeekly: 312426.05,
    totalDividends: 6560947,
    price: 730000000,
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, 263942, 254398, 232495, 617160, 277462, 1477271, 230109, 321229, 209494, 334977, 143511, 143511, 130547, 134017, 240396, 215543, 193635, 220435, 171224, 309069, 440522],
  },
  {
    name: 'QX',
    kind: 'contract',
    scIndex: 1,
    weeklyYieldPct: 0.02,
    annualYieldPct: 1.24,
    paybackWeeks: 4179.14,
    avgWeekly: 2826535.21,
    totalDividends: 93275662,
    price: 11812500000,
    // epochs 184..217
    epochs: [353352, 5213601, 2122733, 846164, 645950, 882189, 2248160, 722157, 3607086, 480634, 3887334, 2108958, 681487, 12098906, 10715776, 8506098, 6829267, 9715154, 6379210, 944134, 2194350, 4688782, 3121047, 612702, 727820, 582077, 431974, 336943, 426051, 243880, 378977, 359969, 182740, null],
  },
  {
    name: 'QCAP',
    kind: 'token',
    scIndex: null,
    weeklyYieldPct: 0.02,
    annualYieldPct: 1.2,
    paybackWeeks: 4325.21,
    avgWeekly: 72.32,
    totalDividends: 2459,
    price: 312814.13,
    // epochs 184..217
    epochs: [49, 8, 3, 5, 148, 55, 48, 16, 28, 5, 124, 90, 31, 128, 323, 525, 14, 311, 92, 37, 35, 73, 63, 32, 16, 24, 36, 19, 8, 5, 29, 14, 20, 45],
  },
  {
    name: 'NOST',
    kind: 'contract',
    scIndex: 14,
    weeklyYieldPct: 0.01,
    annualYieldPct: 0.44,
    paybackWeeks: 11859.82,
    avgWeekly: 16863.67,
    totalDividends: 101182,
    price: 200000000,
    // epochs 184..217
    epochs: [5325, null, null, 1331, null, null, null, null, null, 42603, 7988, null, null, null, 1332, null, 42603, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
  {
    name: 'VOTTUN',
    kind: 'contract',
    scIndex: 25,
    weeklyYieldPct: 0.01,
    annualYieldPct: 0.51,
    paybackWeeks: 10165.48,
    avgWeekly: 144279.09,
    totalDividends: 1587070,
    price: 1466666666.33,
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 332, 147618, 200236, 210980, 157664, 77554, 26662, 77045, 99285, 159990, 429704],
  },
  {
    name: 'QSWAP',
    kind: 'contract',
    scIndex: 13,
    weeklyYieldPct: 0.01,
    annualYieldPct: 0.5,
    paybackWeeks: 10374.35,
    avgWeekly: 144587.42,
    totalDividends: 4771385,
    price: 1500000000,
    // epochs 184..217
    epochs: [9829, 330231, 26405, 39146, 27016, 25393, 327367, 344659, 39095, 29006, 38327, 14741, 22956, 64749, 899266, 9769, 306435, 355547, 337457, 321340, 43044, 319003, 24886, 34597, 19946, 23493, 605917, 16260, 25448, 12816, 16561, 25669, 35011, null],
  },
  {
    name: 'QRAFFLE',
    kind: 'contract',
    scIndex: 19,
    weeklyYieldPct: 0,
    annualYieldPct: 0.19,
    paybackWeeks: 26671.95,
    avgWeekly: 2624.48,
    totalDividends: 65612,
    price: 69999999,
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, 7988, 4205, 2196, 1420, 7433, 2130, 2218, 1331, 887, 1508, 221, 1331, 221, 4437, 44, 443, 1331, 1420, 2958, 2366, 4260, 4615, 946, 4733, 4970, null],
  },
  {
    name: 'QBAY',
    kind: 'contract',
    scIndex: 12,
    weeklyYieldPct: 0.01,
    annualYieldPct: 0.3,
    paybackWeeks: 17455.03,
    avgWeekly: 25207.63,
    totalDividends: 756229,
    price: 440000000,
    // epochs 184..217
    epochs: [162630, 53461, 4881, 47736, 171183, 24717, 66234, 118, 27943, 13357, 1005, null, null, 11449, 2500, 1967, 1183, 39511, 10806, 12507, 8579, 1997, 4881, 7011, 17869, 118, 19881, 4637, 18713, 18047, null, 369, 43890, 939],
  },
  {
    name: 'QVAULT',
    kind: 'contract',
    scIndex: 10,
    weeklyYieldPct: 0.01,
    annualYieldPct: 0.33,
    paybackWeeks: 15735.52,
    avgWeekly: 19065.15,
    totalDividends: 648215,
    price: 300000000,
    // epochs 184..217
    epochs: [10981, 1941, 791, 1200, 33742, 12582, 11006, 4026, 6915, 1360, 15554, 12420, 4309, 17663, 44544, 75409, 14266, 44679, 13223, 5493, 5255, 84839, 24457, 19786, 17264, 18496, 5662, 2926, 1348, 862, 4520, 2231, 47587, 80878],
  },
  {
    name: 'MSVAULT',
    kind: 'contract',
    scIndex: 11,
    weeklyYieldPct: 0,
    annualYieldPct: 0.11,
    paybackWeeks: 49173.79,
    avgWeekly: 7613.81,
    totalDividends: 243642,
    price: 374400000,
    // epochs 184..217
    epochs: [50000, 3255, 31952, 2223, 2662, 2219, null, null, 2663, 2219, 1775, 1480, 1479, 1775, 18195, 2219, 28255, 5029, 4290, 3994, 3254, 23373, 5030, 5029, 5622, 4289, 4438, 5917, 3846, 3255, 3698, 3402, 3255, 3550],
  },
  {
    name: 'QTRY',
    kind: 'contract',
    scIndex: 2,
    weeklyYieldPct: 0,
    annualYieldPct: 0.11,
    paybackWeeks: 47457.76,
    avgWeekly: 12961,
    totalDividends: 38883,
    price: 615100000,
    // epochs 184..217
    epochs: [3698, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 9838, 25347, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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
    // epochs 184..217
    epochs: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  },
];
