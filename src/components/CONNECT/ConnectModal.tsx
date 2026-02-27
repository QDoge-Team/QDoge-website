"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { Button, Card, Input } from "@heroui/react";
import Modal from "@/components/Modal";
import { HeaderButtons } from "./Buttons";
import { MetaMaskContext } from "./MetamaskContext";
import { useQubicConnect } from "./QubicConnectContext";
import { Account } from "./types";
import { useWalletConnect } from "./WalletConnectContext";
import toast from "react-hot-toast";
import AccountSelector from "../ui/AccountSelector";
import { generateQRCode } from "@/utils";

const ConnectModal = ({ open, onClose, darkMode }: { open: boolean; onClose: () => void; darkMode?: boolean }) => {
  const [state] = useContext(MetaMaskContext);
  const [isDisconnectConfirmOpen, setIsDisconnectConfirmOpen] = useState(false);

  const [selectedMode, setSelectedMode] = useState("none");
  
  // Reset mode when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedMode("none");
    }
  }, [open]);
  // Private seed handling
  const [privateSeed, setPrivateSeed] = useState("");
  const [errorMsgPrivateSeed, setErrorMsgPrivateSeed] = useState("");
  // Vault file handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  // Context connect handling
  const { connect, disconnect, connected, wallet, mmSnapConnect, privateKeyConnect, vaultFileConnect } = useQubicConnect();
  // account selection
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState(0);
  // WC
  const [qrCode, setQrCode] = useState<string>("");
  const [connectionURI, setConnectionURI] = useState<string>("");
  const { connect: walletConnectConnect, isConnected, requestAccounts, isReady: walletConnectReady, initError: walletConnectError } = useWalletConnect();

  // Keep latest function without re-triggering the effect
  const requestAccountsRef = useRef(requestAccounts);
  useEffect(() => {
    requestAccountsRef.current = requestAccounts;
  }, [requestAccounts]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const generateURI = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (walletConnectError) {
      toast.error(walletConnectError);
      return false;
    }
    if (!walletConnectReady) {
      toast.error("WalletConnect is still initializing. Please try again in a moment.");
      return false;
    }
    setQrCode("");
    setConnectionURI("");

    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let uri = "";
      let approve = async () => {};
      try {
        const result = await walletConnectConnect();
        uri = result.uri;
        approve = result.approve;
      } catch (error: any) {
        console.error("WalletConnect connect failed:", error);
        toast.error(error?.message || "WalletConnect connect failed");
        return false;
      }
      if (uri) {
        setConnectionURI(uri);
        try {
          const result = await generateQRCode(uri);
          setQrCode(result);
          // fire approval but don't block the UI, errors will be logged
          approve().catch((error) => {
            console.error("WalletConnect approval failed:", error);
          });
        } catch (error) {
          console.error('Failed to generate QR code:', error);
        }
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    toast.error("WalletConnect is not ready yet. Please try again.");
    return false;
  };

  useEffect(() => {
    if (!open) return;                 // ✅ only when modal is open
    if (!isConnected) return;
    if (selectedMode === "account-select" && accounts.length > 0) return; // ✅ prevent repeat

    let cancelled = false;

    (async () => {
      try {
        const accs = await requestAccountsRef.current();
        if (cancelled) return;

        setAccounts(
          accs.map((account) => ({
            publicId: account.address,
            alias: account.name,
          }))
        );
        setSelectedMode("account-select");
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, isConnected]); // ✅ no requestAccounts here - guard checks current state

  // check if input is valid seed (55 chars and only lowercase letters)
  const privateKeyValidate = (pk: string) => {
    if (pk.length !== 55) {
      setErrorMsgPrivateSeed("Seed must be 55 characters long");
    }
    if (pk.match(/[^a-z]/)) {
      setErrorMsgPrivateSeed("Seed must contain only lowercase letters");
    }
    if (pk.length === 55 && !pk.match(/[^a-z]/)) {
      setErrorMsgPrivateSeed("");
    }
    setPrivateSeed(pk);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(event.target.value.toString());

  if (!open) {
    return null;
  }

  return (
    <>
      {open && (
        <Modal
          isOpen={open}
          onClose={() => {
            setSelectedMode("none");
            onClose();
          }}
          className="bg-transparent w-full max-w-md p-0 shadow-none"
        >
          <motion.div
            className="relative flex w-full flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card className="bg-black/90 p-8 text-white">
              <motion.div className="flex items-center justify-between" variants={contentVariants}>
                <h2 className="text-xl font-bold">Connect QUBIC Wallet</h2>
                <IoClose onClick={onClose} className="h-5 w-5 cursor-pointer" />
              </motion.div>

              <AnimatePresence mode="wait" key="modal-content">
                {selectedMode === "none" && (
                  <motion.div
                    className="mt-4 flex flex-col gap-4"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {connected && wallet ? (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-cyan-400/5 p-4 border border-cyan-400/20">
                          <p className="text-sm text-gray-300 mb-2 font-semibold font-mono">✓ Wallet Connected</p>
                          <p className="text-cyan-400 font-mono text-xs break-all bg-black/30 p-2 rounded mt-2">
                            {wallet.publicKey}
                          </p>
                          <p className="text-xs text-gray-400 mt-3">
                            Connection Type: <span className="text-cyan-400 uppercase">{wallet.connectType}</span>
                          </p>
                          {wallet.alias ? (
                            <p className="text-xs text-gray-400 mt-1">
                              Alias: <span className="text-cyan-400">{wallet.alias}</span>
                            </p>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="bordered" 
                            className="flex-1 border-gray-600 text-white" 
                            onPress={onClose}
                          >
                            Close
                          </Button>
                          <Button 
                            color="danger" 
                            className="flex-1" 
                            onPress={() => setIsDisconnectConfirmOpen(true)}
                          >
                            Disconnect Wallet
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    {!connected && (
                      <>
                        <Button
                          color="primary"
                          className="mt-4 flex items-center justify-center gap-3"
                          onPress={() => setSelectedMode("metamask")}
                        >
                          <span className="w-32">MetaMask</span>
                        </Button>
                        <div className="flex flex-col items-center w-full">
                          <Button
                            color="primary"
                            className="flex items-center justify-center gap-3 w-full"
                            onPress={async () => {
                              if (!walletConnectReady) {
                                toast.error("WalletConnect is initializing. Please wait a moment.");
                                return;
                              }
                              if (walletConnectError) {
                                toast.error(walletConnectError);
                                return;
                              }
                              const ok = await generateURI();
                              if (ok) {
                                setSelectedMode("walletconnect");
                              }
                            }}
                          >
                            <span className="w-32">Wallet Connect</span>
                          </Button>
                          {walletConnectError && (
                            <p className="text-red-500 text-xs mt-1">
                              WalletConnect error: {walletConnectError}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {selectedMode === "metamask" && (
                  <motion.div
                    className="mt-4 text-gray-400"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {connected ? (
                      <div className="space-y-3">
                        <p className="text-cyan-400 font-mono">✓ Wallet is already connected!</p>
                        <Button variant="bordered" className="text-white w-full" onPress={() => setSelectedMode("none")}>
                          Back
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p>Connect your MetaMask wallet. You need to have MetaMask installed and unlocked.</p>
                        <p className="text-xs text-gray-500 mt-2">
                          If you previously connected, clicking Connect will reconnect to the existing snap.
                        </p>
                        <div className="mt-5 flex flex-col gap-2">
                          <HeaderButtons
                            state={state}
                            {...(connected ? { isAppConnected: true } : {})}
                            onConnectClick={async () => {
                              try {
                                await mmSnapConnect();
                                setSelectedMode("none");
                                onClose();
                              } catch (error) {
                                console.error("Connection failed:", error);
                                // Keep modal open on error so user can try again
                              }
                            }}
                          />
                          <Button variant="bordered" className="text-white" onPress={() => setSelectedMode("none")}>
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {selectedMode === "walletconnect" && (
                  <motion.div
                    className="mt-4 text-gray-400"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <p className="mb-2">
                      Connect your Qubic Wallet via WalletConnect. Please ensure the mobile app is installed
                      and unlocked. The deep link button only works on devices where the <code>qubic-wallet://</code>
                      protocol is registered (typically mobile). On desktop you can either scan the QR code or
                      copy the URI below and open it on your phone.
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                      <div className="flex min-h-[216px] min-w-[216px] flex-col items-center justify-center">
                        {qrCode ? (
                          <img src={qrCode} alt="Wallet Connect QR Code" className="mx-auto h-54 w-54" />
                        ) : (
                          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-t-2 border-white"></div>
                        )}
                      </div>
                      <Button
                        color="primary"
                        className="flex items-center justify-center gap-3"
                        onPress={() => window.open(`qubic-wallet://pairwc/${encodeURIComponent(connectionURI)}`, "_blank")}
                        isDisabled={!connectionURI}
                      >
                        Open in Qubic Wallet
                      </Button>
                      {connectionURI && (
                        <>
                          <p className="text-xs text-gray-500 break-words mt-1">
                            URI: {connectionURI}
                          </p>
                          <Button
                            variant="bordered"
                            className="text-white text-xs py-1 px-2 mt-1"
                            onPress={() => {
                              navigator.clipboard.writeText(connectionURI).then(() => {
                                toast.success("Connection URI copied to clipboard");
                              });
                            }}
                          >
                            Copy URI
                          </Button>
                        </>
                      )}
                      <div className="flex gap-2 justify-center">
                        <Button variant="bordered" className="text-white" onPress={() => setSelectedMode("none") }>
                          Back
                        </Button>
                        <Button
                          variant="bordered"
                          className="text-white"
                          onPress={async () => {
                            const ok = await generateURI();
                            if (!ok) {
                              setSelectedMode("none");
                            }
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {selectedMode === "account-select" && (
                  <motion.div
                    className="mt-4 text-gray-400"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    Select an account:
                    <AccountSelector
                      label={"Account"}
                      options={accounts.map((account, idx) => ({
                        label: account.alias || `Account ${idx + 1}`,
                        value: account.publicId,
                      }))}
                      selected={selectedAccount}
                      setSelected={setSelectedAccount}
                    />
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <Button
                        variant="bordered"
                        className="mt-4 text-white"
                        onPress={() => {
                          disconnect();
                          setSelectedMode("none");
                        }}
                      >
                        Lock Wallet
                      </Button>
                      <Button
                        color="primary"
                        className="mt-4"
                        onPress={() => {
                          connect({
                            connectType: "walletconnect",
                            publicKey: accounts[parseInt(selectedAccount.toString())]?.publicId || "",
                            alias: accounts[parseInt(selectedAccount.toString())]?.alias,
                          });
                          setSelectedMode("none");
                          onClose();
                        }}
                      >
                        Select Account
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </Modal>
      )}
      
      {/* Disconnect Confirmation Modal - always available */}
      <Modal 
        isOpen={isDisconnectConfirmOpen} 
        onClose={() => setIsDisconnectConfirmOpen(false)}
      >
        <div className="p-6 text-white bg-transparent rounded-xl border border-cyan-400/20">
          <h3 className="text-xl font-bold font-mono text-cyan-400 mb-4 tracking-wide">Disconnect Wallet</h3>
          <p className="text-gray-400 text-sm font-mono mb-6 leading-relaxed">
            Disconnect wallet from this application? You can reconnect anytime by clicking 'Connect Wallet'.
          </p>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="bordered" 
              onPress={() => setIsDisconnectConfirmOpen(false)}
              className="text-white border-cyan-400/30"
            >
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={async () => {
                await disconnect();
                setIsDisconnectConfirmOpen(false);
                onClose();
              }}
              className="text-white"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ConnectModal;
