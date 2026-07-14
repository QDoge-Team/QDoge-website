/** QDoge team identity that issued both QDOGE and QTREAT on QX. */
export const QDOGE_ISSUER_ID =
  'QDOGEEESKYPAICECHEAHOXPULEOADTKGEJHAVYPFKHLEWGXXZQUGIGMBUTZE';

export const QUBIC_RPC = 'https://rpc.qubic.org';

export type TokenAsset = 'QDOGE' | 'QTREAT';

export type TokenConfig = {
  assetName: TokenAsset;
  issuerIdentity: string;
  /** Declared max supply (from tokenomics). Omitted when the on-chain sum is the reference. */
  maxSupply?: number;
};

export const TOKENS: Record<TokenAsset, TokenConfig> = {
  QDOGE: {
    assetName: 'QDOGE',
    issuerIdentity: QDOGE_ISSUER_ID,
    maxSupply: 21_000_000_000,
  },
  QTREAT: {
    assetName: 'QTREAT',
    issuerIdentity: QDOGE_ISSUER_ID,
  },
};

/** Known Qubic smart-contract names by contract index. */
export const CONTRACT_NAMES: Record<number, string> = {
  1: 'QX',
  2: 'Quottery',
  3: 'Random',
  4: 'QUtil',
  5: 'MLM',
  6: 'GQmProp',
  7: 'SWATCH',
  8: 'CCF',
  9: 'QEarn',
  10: 'QVault',
  11: 'MsVault',
  12: 'QBay',
  13: 'QSwap',
  14: 'Nostromo',
};

/** Index of the MSVAULT contract — QDoge team tokens are locked there. */
export const MSVAULT_CONTRACT_INDEX = 11;

/**
 * Qubic smart-contract addresses encode the contract index in the first
 * identity character (index 11 -> 'L' followed by 55 'A's + checksum).
 */
const CONTRACT_ADDRESS_RE = /^([A-Z])A{55}[A-Z]{4}$/;

export function contractIndexFromIdentity(identity: string): number | null {
  const match = CONTRACT_ADDRESS_RE.exec(identity);
  if (!match) return null;
  return match[1].charCodeAt(0) - 65;
}
