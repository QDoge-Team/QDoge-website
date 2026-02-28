"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Tabs, Tab } from "@heroui/react";
import Modal from "@/components/Modal";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { TRANSACTION_FEE, MIN_WITHDRAWAL } from "@/constants";
import { convertQDogeToQubic, convertQubicToQDoge } from "@/services/tokenPrice";
import toast from "react-hot-toast";
import axiosServices from "@/util/axios";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ open, onClose }) => {
  const { wallet, walletBalances, fetchBalance } = useQubicConnect();
  const { price: qdogePrice, loading: priceLoading } = useTokenPrice();
  const [tokenType, setTokenType] = useState<"QUBIC" | "QDoge">("QUBIC");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Calculate minimum withdrawal in selected token
  const minWithdrawal = tokenType === "QUBIC" 
    ? MIN_WITHDRAWAL 
    : Math.ceil(MIN_WITHDRAWAL / qdogePrice.price);

  // Convert amount based on token type
  const amountInQubic = tokenType === "QUBIC" 
    ? parseInt(amount) || 0
    : convertQDogeToQubic(parseInt(amount) || 0, qdogePrice.price);

  // Calculate net amount (after fee)
  const netAmount = amountInQubic - TRANSACTION_FEE;

  // Get available balance
  const availableBalance = tokenType === "QUBIC" 
    ? walletBalances.qubic 
    : walletBalances.qdoge;

  // Validation
  const isValid = 
    amountInQubic >= MIN_WITHDRAWAL &&
    amountInQubic > 0 &&
    availableBalance >= amountInQubic &&
    walletBalances.qubic >= TRANSACTION_FEE && // Must have QUBIC for fee
    netAmount > 0;

  const handleAmountChange = (value: string) => {
    // Only allow integers
    if (value === "" || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet) {
      toast.error("Please connect your wallet to withdraw");
      return;
    }

    if (amountInQubic < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${MIN_WITHDRAWAL.toLocaleString()} QUBIC`);
      return;
    }

    if (!isValid) {
      toast.error("Please check your withdrawal amount and balance");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosServices.post("/withdraw", {
        publicKey: wallet.publicKey,
        amount: amountInQubic,
        tokenType,
      });

      if (response.data.success) {
        toast.success(`Withdrawal successful! Transaction: ${response.data.txHash?.slice(0, 10)}...`);
        setAmount("");
        onClose();
        // Refresh balance
        await fetchBalance();
      } else {
        toast.error(response.data.error || "Withdrawal failed");
      }
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setAmount("");
      setTokenType("QUBIC");
    }
  }, [open]);

  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="p-6 text-white bg-transparent rounded-xl w-full">
        <h3 className="text-xl font-bold mb-4 text-cyan-400 font-mono tracking-wide">Withdraw Funds</h3>

        {/* Available Balance */}
        <div className="mb-4 p-3 bg-cyan-400/5 border border-cyan-400/15 rounded-lg">
          <p className="text-sm text-gray-400 mb-1 font-mono">Available Balance</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-bold text-cyan-400 font-mono">QUBIC: {walletBalances.qubic.toLocaleString()}</p>
              <p className="text-sm text-gray-400 font-mono">QDoge: {walletBalances.qdoge.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Token Type Selection */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2 font-mono">Token Type</p>
          <Tabs
            selectedKey={tokenType}
            onSelectionChange={(key) => {
              setTokenType(key as "QUBIC" | "QDoge");
              setAmount("");
            }}
            className="w-full"
            classNames={{
              tabList: "gap-2 bg-black/60 border border-cyan-400/15 p-1 rounded-lg",
              tab: "min-w-fit text-gray-400 font-mono",
              cursor: "bg-cyan-400/15",
            }}
          >
            <Tab key="QUBIC" title="QUBIC" />
            <Tab key="QDoge" title="QDoge" />
          </Tabs>
        </div>

        {/* QDoge Price Display */}
        {tokenType === "QDoge" && (
          <div className="mb-4 p-2 bg-cyan-400/5 border border-cyan-400/15 rounded text-sm">
            {priceLoading ? (
              <p className="text-gray-400 font-mono">Loading price...</p>
            ) : (
              <p className="text-cyan-400 font-mono">
                1 QDoge = {qdogePrice.price.toFixed(2)} QUBIC
              </p>
            )}
          </div>
        )}

        {/* Amount Input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400 font-mono">Amount ({tokenType})</p>
            <p className="text-xs text-cyan-400/50 font-mono">
              Minimum: {minWithdrawal.toLocaleString()} {tokenType}
            </p>
          </div>
          <Input
            type="number"
            value={amount}
            onValueChange={handleAmountChange}
            placeholder={`Enter amount (min: ${minWithdrawal.toLocaleString()})`}
            min={0}
            step={1}
            className="text-white font-mono"
            classNames={{
              input: "text-white",
              inputWrapper: "bg-black/40 border border-cyan-400/15 hover:border-cyan-400/30",
            }}
            endContent={
              <Button
                size="sm"
                variant="light"
                onPress={() => setAmount(Math.floor(availableBalance).toString())}
                className="text-xs text-cyan-400/60 hover:text-cyan-400 font-mono"
              >
                MAX
              </Button>
            }
          />
        </div>

        {/* Transaction Fee */}
        <div className="mb-4 p-3 bg-cyan-400/5 rounded-lg border border-cyan-400/15">
          <div className="flex justify-between text-sm font-mono">
            <span className="text-gray-400">Transaction Fee:</span>
            <span className="text-cyan-400 font-bold">{TRANSACTION_FEE} QUBIC</span>
          </div>
          {tokenType === "QDoge" && amountInQubic > 0 && (
            <div className="flex justify-between text-xs mt-1 text-gray-500 font-mono">
              <span>Fee in QDoge:</span>
              <span>{Math.ceil(TRANSACTION_FEE / qdogePrice.price)} QDoge</span>
            </div>
          )}
        </div>

        {/* Net Amount */}
        {amountInQubic > 0 && (
          <div className="mb-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
            <div className="flex justify-between text-sm font-mono">
              <span className="text-gray-400">You will receive:</span>
              <span className="text-green-400 font-bold">
                {tokenType === "QUBIC" 
                  ? `${netAmount.toLocaleString()} QUBIC`
                  : `${convertQubicToQDoge(netAmount, qdogePrice.price).toLocaleString()} QDoge (${netAmount.toLocaleString()} QUBIC)`}
              </span>
            </div>
          </div>
        )}

        {/* Validation Messages */}
        {amountInQubic > 0 && !isValid && (
          <div className="mb-4 p-2 bg-red-900/20 rounded border border-red-500/30 text-sm text-red-400 font-mono">
            {amountInQubic < MIN_WITHDRAWAL && (
              <p>Minimum withdrawal is {MIN_WITHDRAWAL.toLocaleString()} QUBIC</p>
            )}
            {availableBalance < amountInQubic && (
              <p>Insufficient balance</p>
            )}
            {walletBalances.qubic < TRANSACTION_FEE && (
              <p>You need {TRANSACTION_FEE} QUBIC for transaction fee</p>
            )}
            {netAmount <= 0 && (
              <p>Amount too small after transaction fee</p>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cyber-button cyber-button--secondary !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={!isValid || loading}
            className="cyber-button !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Withdraw"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WithdrawModal;
