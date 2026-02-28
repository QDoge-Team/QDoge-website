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
      <div className="p-6 text-black bg-white rounded-lg w-full">
        <h3 className="text-xl font-bold mb-4 text-black">Withdraw Funds</h3>

        {/* Available Balance */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-700 mb-1">Available Balance</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-bold text-black">QUBIC: {walletBalances.qubic.toLocaleString()}</p>
              <p className="text-sm text-gray-700">QDoge: {walletBalances.qdoge.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Token Type Selection */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">Token Type</p>
          <Tabs
            selectedKey={tokenType}
            onSelectionChange={(key) => {
              setTokenType(key as "QUBIC" | "QDoge");
              setAmount("");
            }}
            className="w-full"
            classNames={{
              tabList: "gap-2 bg-gray-200 p-1 rounded-lg",
              tab: "min-w-fit text-black",
              cursor: "bg-white",
            }}
          >
            <Tab key="QUBIC" title="QUBIC" />
            <Tab key="QDoge" title="QDoge" />
          </Tabs>
        </div>

        {/* QDoge Price Display */}
        {tokenType === "QDoge" && (
          <div className="mb-4 p-2 bg-blue-50 rounded text-sm">
            {priceLoading ? (
              <p className="text-gray-700">Loading price...</p>
            ) : (
              <p className="text-blue-700">
                1 QDoge = {qdogePrice.price.toFixed(2)} QUBIC
              </p>
            )}
          </div>
        )}

        {/* Amount Input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-700">Amount ({tokenType})</p>
            <p className="text-xs text-gray-600">
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
            className="text-black"
            classNames={{
              input: "text-black",
              inputWrapper: "bg-gray-50 border border-gray-300",
            }}
            endContent={
              <Button
                size="sm"
                variant="light"
                onPress={() => setAmount(Math.floor(availableBalance).toString())}
                className="text-xs text-gray-600 hover:text-black"
              >
                MAX
              </Button>
            }
          />
        </div>

        {/* Transaction Fee */}
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Transaction Fee:</span>
            <span className="text-yellow-700 font-bold">{TRANSACTION_FEE} QUBIC</span>
          </div>
          {tokenType === "QDoge" && amountInQubic > 0 && (
            <div className="flex justify-between text-xs mt-1 text-gray-600">
              <span>Fee in QDoge:</span>
              <span>{Math.ceil(TRANSACTION_FEE / qdogePrice.price)} QDoge</span>
            </div>
          )}
        </div>

        {/* Net Amount */}
        {amountInQubic > 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">You will receive:</span>
              <span className="text-green-700 font-bold">
                {tokenType === "QUBIC" 
                  ? `${netAmount.toLocaleString()} QUBIC`
                  : `${convertQubicToQDoge(netAmount, qdogePrice.price).toLocaleString()} QDoge (${netAmount.toLocaleString()} QUBIC)`}
              </span>
            </div>
          </div>
        )}

        {/* Validation Messages */}
        {amountInQubic > 0 && !isValid && (
          <div className="mb-4 p-2 bg-red-50 rounded border border-red-200 text-sm text-red-700">
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
            className="px-6 py-2.5 text-black font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={!isValid || loading}
            className="px-6 py-2.5 text-white font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Withdraw"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WithdrawModal;
