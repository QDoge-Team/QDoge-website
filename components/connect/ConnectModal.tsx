/* eslint-disable @next/next/no-img-element -- dynamically generated QR data URI, not an optimizable static asset */
'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, FileKey2, KeyRound, Loader2, QrCode, X } from 'lucide-react';
import { useQubicConnect } from './QubicConnectContext';
import { useWalletConnect } from './WalletConnectContext';
import { cn } from '@/lib/utils';

type Mode = 'none' | 'walletconnect' | 'private-seed' | 'vault-file' | 'account-select';

type Account = { publicId: string; alias?: string };

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API is unavailable or blocked (some mobile webviews) -- fall back to a hidden textarea.
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export function ConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('none');
  const [privateSeed, setPrivateSeed] = useState('');
  const [seedError, setSeedError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { connect, privateKeyConnect, vaultFileConnect } = useQubicConnect();
  const { connect: wcConnect, disconnect: wcDisconnect, isConnected: wcIsConnected, requestAccounts } = useWalletConnect();

  const [qrCode, setQrCode] = useState('');
  const [connectionUri, setConnectionUri] = useState('');
  const [wcError, setWcError] = useState('');
  const [copied, setCopied] = useState(false);
  const [wcSlow, setWcSlow] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  // Which flow produced the current `accounts` list -- recorded once, at the
  // moment that flow succeeds, rather than re-derived from a live value at
  // click time (wcIsConnected can be true for an unrelated earlier session,
  // wrongly mislabeling a vault-file selection as 'walletconnect' or vice
  // versa).
  const [accountSource, setAccountSource] = useState<'walletconnect' | 'vault' | null>(null);

  useEffect(() => {
    if (!open) {
      setMode('none');
      setSelectedFile(null);
      setPassword('');
      setVaultError('');
      setIsUnlocking(false);
      setPrivateSeed('');
      setSeedError('');
      setQrCode('');
      setConnectionUri('');
      setWcError('');
      setCopied(false);
      setAccountSource(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  const loadWalletConnectAccounts = async () => {
    setWcError('');
    setWcSlow(false);
    // Don't abandon the request: the wallet may answer late (the user has to
    // switch apps and approve), and a late answer must still complete the
    // connection. After a while just surface the escape hatches.
    const slowTimer = setTimeout(() => setWcSlow(true), 10_000);
    try {
      const accs = await requestAccounts();
      setAccounts(accs.map((a) => ({ publicId: a.address, alias: a.name })));
      setAccountSource('walletconnect');
      setMode('account-select');
    } catch (err) {
      setWcError(
        err instanceof Error && err.message
          ? err.message
          : 'The wallet did not respond. Open the Qubic Wallet app and try again.'
      );
    } finally {
      clearTimeout(slowTimer);
      setWcSlow(false);
    }
  };

  useEffect(() => {
    if (wcIsConnected && mode === 'walletconnect') {
      void loadWalletConnectAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wcIsConnected]);

  const generateUri = async () => {
    setWcError('');
    setQrCode('');
    setConnectionUri('');
    setCopied(false);
    try {
      const { uri, approve } = await wcConnect();
      setConnectionUri(uri);
      if (uri) {
        const QRCode = (await import('qrcode')).default;
        setQrCode(await QRCode.toDataURL(uri));
      }
      await approve();
    } catch (err) {
      setWcError(
        err instanceof Error && err.message
          ? err.message
          : 'The connection request expired or was declined. Generate a new code and try again.'
      );
    }
  };

  // Once the session exists the pairing QR/link is spent; what's left is waiting on the wallet to answer.
  const waitingForWallet = wcIsConnected;

  const startOver = async () => {
    if (wcIsConnected) await wcDisconnect().catch(() => {});
    await generateUri();
  };

  const handleCopy = async () => {
    if (!connectionUri) return;
    if (await copyText(connectionUri)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validateSeed = (value: string) => {
    if (value.length !== 55) setSeedError('Seed must be 55 characters long');
    else if (/[^a-z]/.test(value)) setSeedError('Seed must contain only lowercase letters');
    else setSeedError('');
    setPrivateSeed(value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setSelectedFile(null);
    if (!file.name.toLowerCase().endsWith('.qubic-vault')) {
      setVaultError('Please select a .qubic-vault file.');
      e.target.value = '';
      setSelectedFile(null);
      return;
    }
    setVaultError('');
    setSelectedFile(file);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-cyan-400/25 bg-surface/90 p-6 font-mono shadow-[0_0_40px_rgba(0,243,255,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Connect Wallet</p>
          <button onClick={onClose} className="text-muted-text hover:text-cyan-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === 'none' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setMode('walletconnect');
                // A session may already exist (e.g. approved in the wallet while this
                // page was reloaded) -- use it instead of pairing from scratch.
                void (wcIsConnected ? loadWalletConnectAccounts() : generateUri());
              }}
              className="flex items-center gap-3 rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-400/10 transition-colors"
            >
              <QrCode className="h-5 w-5 text-cyan-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold">WalletConnect</p>
                <p className="text-[11px] text-muted-text">Approve from the Qubic Wallet mobile app</p>
              </div>
            </button>

            <button
              onClick={() => setMode('vault-file')}
              className="flex items-center gap-3 rounded-xl border border-purple-400/30 bg-purple-400/5 px-4 py-3 text-sm text-purple-100 hover:border-purple-400/60 hover:bg-purple-400/10 transition-colors"
            >
              <FileKey2 className="h-5 w-5 text-purple-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold">Vault File</p>
                <p className="text-[11px] text-muted-text">Unlock a .qubic-vault file with your password</p>
              </div>
            </button>

            <div className="my-1 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-wider text-amber-400/80">Use with care</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={() => setMode('private-seed')}
              className="flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-100 hover:border-amber-400/60 hover:bg-amber-400/10 transition-colors"
            >
              <KeyRound className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold">Private Seed</p>
                <p className="text-[11px] text-muted-text">Type your 55-character seed directly</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'walletconnect' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-text text-center">
              {wcIsConnected && !wcError
                ? 'Connected to your wallet. Open the Qubic Wallet app and approve the request to continue.'
                : 'Scan with the Qubic Wallet app, or open it directly on this device.'}
            </p>
            <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-border bg-white p-2">
              {qrCode && !waitingForWallet ? (
                <img src={qrCode} alt="WalletConnect QR code" className="h-full w-full" />
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-black/40" />
              )}
            </div>
            {waitingForWallet ? (
              <>
                <button
                  onClick={() => {
                    window.location.href = 'qubic-wallet://';
                  }}
                  className="w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-300 hover:bg-cyan-400/20 transition-colors"
                >
                  Open Qubic Wallet
                </button>
                {wcSlow && !wcError ? (
                  <button
                    onClick={() => void startOver()}
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-surface-foreground hover:bg-muted transition-colors"
                  >
                    Start over with a new code
                  </button>
                ) : null}
              </>
            ) : (
              <>
                {/* location.href, not window.open: mobile browsers often leave a blank tab (or block it) for custom-scheme popups. */}
                <button
                  onClick={() => {
                    window.location.href = `qubic-wallet://pairwc/${connectionUri}`;
                  }}
                  disabled={!connectionUri}
                  className="w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-300 hover:bg-cyan-400/20 transition-colors disabled:opacity-40"
                >
                  Open in Qubic Wallet
                </button>
                <button
                  onClick={() => void handleCopy()}
                  disabled={!connectionUri}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-surface-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Link copied' : 'Copy link'}
                </button>
              </>
            )}
            {wcError ? (
              <div className="w-full rounded-lg border border-red-400/30 bg-red-400/5 p-3">
                <p className="text-xs text-red-300 leading-snug">{wcError}</p>
                <div className="mt-2 flex gap-4">
                  {wcIsConnected ? (
                    <button
                      onClick={() => void loadWalletConnectAccounts()}
                      className="text-xs font-bold text-cyan-300 hover:text-cyan-200"
                    >
                      Try again
                    </button>
                  ) : null}
                  <button
                    onClick={() => void startOver()}
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-200"
                  >
                    {wcIsConnected ? 'Start over' : 'Generate a new code'}
                  </button>
                </div>
              </div>
            ) : null}
            <button onClick={() => setMode('none')} className="text-xs text-muted-text hover:text-surface-foreground">
              Cancel
            </button>
          </div>
        )}

        {mode === 'private-seed' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200/90 leading-snug">
                Your seed is used only in this browser tab to sign transactions locally, and is never sent
                anywhere. Still, prefer WalletConnect or a Vault File when you can.
              </p>
            </div>
            <label className="text-xs text-muted-text">Your 55-character seed</label>
            <input
              type="password"
              value={privateSeed}
              onChange={(e) => validateSeed(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm text-surface-foreground outline-none focus:border-amber-400/50"
              autoComplete="off"
              spellCheck={false}
            />
            {seedError ? <p className="text-xs text-red-400">{seedError}</p> : null}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                onClick={() => setMode('none')}
                className="rounded-lg border border-border py-2 text-sm text-muted-text hover:bg-muted"
              >
                Cancel
              </button>
              <button
                disabled={!!seedError || privateSeed.length !== 55}
                onClick={async () => {
                  await privateKeyConnect(privateSeed);
                  onClose();
                }}
                className="rounded-lg border border-amber-400/40 bg-amber-400/10 py-2 text-sm font-bold text-amber-300 hover:bg-amber-400/20 disabled:opacity-40"
              >
                Unlock
              </button>
            </div>
          </div>
        )}

        {mode === 'vault-file' && (
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".qubic-vault"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-surface-foreground hover:bg-muted"
            >
              Choose File
            </button>
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-text truncate">
              {selectedFile ? selectedFile.name : 'No file selected'}
            </div>
            <input
              type="password"
              placeholder="Vault password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm text-surface-foreground outline-none focus:border-purple-400/50"
            />
            {vaultError ? <p className="text-xs text-red-400">{vaultError}</p> : null}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                onClick={() => {
                  setMode('none');
                  setVaultError('');
                }}
                className="rounded-lg border border-border py-2 text-sm text-muted-text hover:bg-muted"
              >
                Cancel
              </button>
              <button
                disabled={isUnlocking}
                onClick={async () => {
                  if (!selectedFile) return setVaultError('Please select a .qubic-vault file.');
                  if (!password) return setVaultError('Please enter your password.');
                  setVaultError('');
                  setIsUnlocking(true);
                  try {
                    const vault = await vaultFileConnect(selectedFile, password);
                    const seeds = vault.getSeeds() as Account[];
                    setAccounts(seeds);
                    setAccountSource('vault');
                    setMode('account-select');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    setVaultError(
                      msg.includes('password') || msg.includes('Import Failed')
                        ? 'Incorrect password or invalid vault file.'
                        : 'Failed to unlock vault. Please try again.'
                    );
                  } finally {
                    setIsUnlocking(false);
                  }
                }}
                className="rounded-lg border border-purple-400/40 bg-purple-400/10 py-2 text-sm font-bold text-purple-300 hover:bg-purple-400/20 disabled:opacity-40"
              >
                {isUnlocking ? 'Unlocking…' : 'Unlock'}
              </button>
            </div>
          </div>
        )}

        {mode === 'account-select' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-text">Select an account:</p>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {accounts.map((acc, idx) => (
                <button
                  key={acc.publicId}
                  onClick={() => {
                    connect({
                      connectType: accountSource === 'walletconnect' ? 'walletconnect' : 'vault',
                      publicKey: acc.publicId,
                      alias: acc.alias,
                    });
                    onClose();
                  }}
                  className={cn(
                    'rounded-lg border border-border bg-muted/50 px-3 py-2 text-left text-xs hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-colors'
                  )}
                >
                  <p className="text-cyan-200 font-bold">{acc.alias || `Account ${idx + 1}`}</p>
                  <p className="text-muted-text truncate">{acc.publicId}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
