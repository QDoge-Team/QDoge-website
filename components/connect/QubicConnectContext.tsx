'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { QubicTransaction } from '@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction';
// @ts-expect-error -- no bundled types for this package
import { QubicVault } from '@qubic-lib/qubic-ts-vault-library';
import { useWalletConnect } from './WalletConnectContext';
import { base64ToUint8Array, decodeUint8ArrayTx, uint8ArrayToBase64 } from '@/lib/qubic/tx-utils';

export type ConnectType = 'walletconnect' | 'privateKey' | 'vault';

export type Wallet = {
  connectType: ConnectType;
  publicKey: string;
  alias?: string;
  privateKey?: string;
};

interface QubicConnectContextType {
  connected: boolean;
  wallet: Wallet | null;
  showConnectModal: boolean;
  connect: (wallet: Wallet) => void;
  disconnect: () => void;
  toggleConnectModal: () => void;
  getSignedTx: (tx: QubicTransaction) => Promise<{ tx: Uint8Array }>;
  privateKeyConnect: (privateSeed: string) => Promise<void>;
  vaultFileConnect: (file: File, password: string) => Promise<InstanceType<typeof QubicVault>>;
}

const QubicConnectContext = createContext<QubicConnectContextType | undefined>(undefined);

const qHelper = new QubicHelper();

export function QubicConnectProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const { signTransaction } = useWalletConnect();

  const connect = (w: Wallet) => {
    localStorage.setItem('qtreatStakingWallet', JSON.stringify({ ...w, privateKey: undefined }));
    setWallet(w);
    setConnected(true);
  };

  const disconnect = () => {
    localStorage.removeItem('qtreatStakingWallet');
    setWallet(null);
    setConnected(false);
  };

  const toggleConnectModal = () => setShowConnectModal((v) => !v);

  const getSignedTx = async (tx: QubicTransaction): Promise<{ tx: Uint8Array }> => {
    if (!wallet) throw new Error('No wallet connected');
    const processedTx = await tx.build('0'.repeat(55));

    if (wallet.connectType === 'walletconnect') {
      const decodedTx = decodeUint8ArrayTx(processedTx);
      const [from, to] = await Promise.all([
        qHelper.getIdentity(decodedTx.sourcePublicKey.getIdentity()),
        qHelper.getIdentity(decodedTx.destinationPublicKey.getIdentity()),
      ]);
      const payloadBase64 = uint8ArrayToBase64(decodedTx.payload.getPackageData());
      const result = await signTransaction({
        from,
        to,
        amount: Number(decodedTx.amount.getNumber()),
        tick: decodedTx.tick,
        inputType: decodedTx.inputType,
        payload: payloadBase64 === '' ? null : payloadBase64,
      });
      if (!result?.signedTransaction) throw new Error('WalletConnect signing failed');
      return { tx: base64ToUint8Array(result.signedTransaction) };
    }

    // privateKey / vault -- both resolve to a raw 55-char seed we sign locally.
    if (!wallet.privateKey) throw new Error('Private key required');
    const signedTx = await tx.build(wallet.privateKey);
    return { tx: signedTx || new Uint8Array(processedTx.length) };
  };

  const privateKeyConnect = async (privateSeed: string) => {
    const idPackage = await qHelper.createIdPackage(privateSeed);
    connect({ connectType: 'privateKey', privateKey: privateSeed, publicKey: idPackage.publicId });
  };

  const vaultFileConnect = async (file: File, password: string) => {
    if (!file || !password) throw new Error('Please select a file and enter a password.');
    const vault = new QubicVault();
    await vault.importAndUnlock(true, password, null, file, true);
    return vault;
  };

  return (
    <QubicConnectContext.Provider
      value={{
        connected,
        wallet,
        showConnectModal,
        connect,
        disconnect,
        toggleConnectModal,
        getSignedTx,
        privateKeyConnect,
        vaultFileConnect,
      }}
    >
      {children}
    </QubicConnectContext.Provider>
  );
}

export function useQubicConnect() {
  const ctx = useContext(QubicConnectContext);
  if (!ctx) throw new Error('useQubicConnect must be used within a QubicConnectProvider');
  return ctx;
}
