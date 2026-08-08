/**
 * QDOGE Move-to-Earn — data store.
 *
 * The backend's persistence seam. Every route and job talks to the Store
 * interface, never to a concrete database, so the in-memory reference
 * implementation used for development and tests can be swapped for
 * Postgres/Redis by implementing one interface — no route changes.
 *
 * NOTE: the in-memory store is per-process and resets on redeploy. It is
 * NOT suitable for production settlement; it exists to make the API real
 * and testable before the database is chosen.
 */

export interface Account {
  /** Stable account id (derived from the attested device at registration). */
  id: string;
  /** Qubic wallet ID (60 uppercase letters) that receives payouts. */
  walletId: string;
  /** Anti-cheat trust score in [0, 1]; starts at probation level. */
  trustScore: number;
  /** Minimum QDOGE held across the current epoch (updated by balance checks). */
  qdogeBalance: number;
  createdAtTick: number;
}

/** Credited steps for one account on one UTC day (YYYY-MM-DD). */
export interface DailyCredit {
  accountId: string;
  day: string;
  creditedSteps: number;
  sessions: number;
  rejectedSessions: number;
}

export interface PendingPayout {
  accountId: string;
  walletId: string;
  epoch: number;
  amountQus: number;
  status: 'pending' | 'review' | 'released' | 'forfeited';
}

export interface EpochSettlement {
  epoch: number;
  rigIncomeQus: number;
  poolQus: number;
  retainedQus: number;
  carriedOverQus: number;
  participants: number;
  settledAtTick: number;
}

export interface Store {
  getAccount(id: string): Promise<Account | null>;
  upsertAccount(account: Account): Promise<void>;
  listAccounts(): Promise<Account[]>;

  getDailyCredit(accountId: string, day: string): Promise<DailyCredit | null>;
  upsertDailyCredit(credit: DailyCredit): Promise<void>;
  /** All daily credits for the given UTC days (an epoch's day range). */
  listCreditsForDays(days: string[]): Promise<DailyCredit[]>;

  addPayouts(payouts: PendingPayout[]): Promise<void>;
  listPayouts(epoch: number): Promise<PendingPayout[]>;
  listPayoutsForAccount(accountId: string): Promise<PendingPayout[]>;

  getSettlement(epoch: number): Promise<EpochSettlement | null>;
  addSettlement(settlement: EpochSettlement): Promise<void>;
}

/* ---------------- IN-MEMORY REFERENCE IMPLEMENTATION ---------------- */

class InMemoryStore implements Store {
  private accounts = new Map<string, Account>();
  private credits = new Map<string, DailyCredit>(); // key: accountId|day
  private payouts: PendingPayout[] = [];
  private settlements = new Map<number, EpochSettlement>();

  async getAccount(id: string) {
    return this.accounts.get(id) ?? null;
  }
  async upsertAccount(account: Account) {
    this.accounts.set(account.id, account);
  }
  async listAccounts() {
    return [...this.accounts.values()];
  }

  async getDailyCredit(accountId: string, day: string) {
    return this.credits.get(`${accountId}|${day}`) ?? null;
  }
  async upsertDailyCredit(credit: DailyCredit) {
    this.credits.set(`${credit.accountId}|${credit.day}`, credit);
  }
  async listCreditsForDays(days: string[]) {
    const wanted = new Set(days);
    return [...this.credits.values()].filter((c) => wanted.has(c.day));
  }

  async addPayouts(payouts: PendingPayout[]) {
    this.payouts.push(...payouts);
  }
  async listPayouts(epoch: number) {
    return this.payouts.filter((p) => p.epoch === epoch);
  }
  async listPayoutsForAccount(accountId: string) {
    return this.payouts.filter((p) => p.accountId === accountId);
  }

  async getSettlement(epoch: number) {
    return this.settlements.get(epoch) ?? null;
  }
  async addSettlement(settlement: EpochSettlement) {
    this.settlements.set(settlement.epoch, settlement);
  }
}

/**
 * Singleton store, stashed on globalThis so Next.js dev-server hot reloads
 * don't reset it between requests.
 */
const globalForStore = globalThis as unknown as { __m2eStore?: Store };

export function getStore(): Store {
  if (!globalForStore.__m2eStore) {
    globalForStore.__m2eStore = new InMemoryStore();
  }
  return globalForStore.__m2eStore;
}
