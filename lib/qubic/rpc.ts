import { QUBIC_RPC } from '@/lib/tokens/constants';
import { uint8ArrayToBase64 } from './tx-utils';

async function rpcGet<T>(path: string): Promise<T> {
  const res = await fetch(`${QUBIC_RPC}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`RPC ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function rpcPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${QUBIC_RPC}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`RPC ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export type TickInfo = {
  tick: number;
  epoch: number;
  initialTick: number;
};

export async function fetchTickInfo(): Promise<TickInfo> {
  const data = await rpcGet<{ tickInfo: TickInfo }>('/live/v1/tick-info');
  return data.tickInfo;
}

export type BalanceInfo = {
  balance: string;
  id: string;
};

export async function fetchBalance(publicId: string): Promise<BalanceInfo> {
  const data = await rpcGet<{ balance: BalanceInfo }>(`/live/v1/balances/${publicId}`);
  return data.balance;
}

type OwnedAsset = {
  data: {
    ownerIdentity: string;
    managingContractIndex: number;
    numberOfUnits: string;
    issuedAsset: { name: string; issuerIdentity: string };
  };
};

/** Sums a wallet's owned units of one asset, optionally scoped to a specific managing contract. */
export async function fetchAssetBalance(
  publicId: string,
  assetName: string,
  managingContractIndex?: number
): Promise<number> {
  const data = await rpcGet<{ ownedAssets?: OwnedAsset[] }>(`/v1/assets/${publicId}/owned`);
  const owned = data.ownedAssets ?? [];
  return owned
    .filter(
      (a) =>
        a.data.issuedAsset.name === assetName &&
        (managingContractIndex === undefined || a.data.managingContractIndex === managingContractIndex)
    )
    .reduce((sum, a) => sum + Number(a.data.numberOfUnits), 0);
}

export type BroadcastResult = {
  transactionId?: string;
  peersBroadcasted?: number;
  encodedTransaction?: string;
};

export async function broadcastTx(tx: Uint8Array): Promise<BroadcastResult> {
  return rpcPost<BroadcastResult>('/v1/broadcast-transaction', {
    encodedTransaction: uint8ArrayToBase64(tx),
  });
}

export type QuerySCRequest = {
  contractIndex: number;
  inputType: number;
  inputSize: number;
  requestData: string;
};

export type QuerySCResponse = {
  responseData: string;
};

export async function fetchQuerySC(query: QuerySCRequest): Promise<QuerySCResponse> {
  return rpcPost<QuerySCResponse>('/live/v1/querySmartContract', query);
}

export type TxStatus = {
  moneyFlew?: boolean;
  executed?: boolean;
};

export async function fetchTxStatus(txId: string): Promise<TxStatus | null> {
  try {
    const data = await rpcGet<{ transactionStatus: TxStatus }>(`/v1/tx-status/${txId}`);
    return data.transactionStatus;
  } catch {
    return null;
  }
}
