'use client';

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import toast from "react-hot-toast";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import ConnectModal from "@/components/CONNECT/ConnectModal";
import { API_URL } from "@/config";

function RegisterPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { wallet, connected, toggleConnectModal, showConnectModal } = useQubicConnect();
  const [loading, setLoading] = useState(false);

  const walletId = useMemo(() => {
    return (wallet?.publicKey || sp.get("walletId") || "").toUpperCase();
  }, [wallet?.publicKey, sp]);

  const register = async () => {
    if (loading) return; // Prevent multiple submissions

    if (!connected || !wallet?.publicKey) {
      toast.error("Connect your wallet to register", { id: "register-wallet-required" });
      if (!showConnectModal) {
        toggleConnectModal();
      }
      return;
    }

    if (!/^[A-Z]{60}$/.test(walletId)) {
      toast.error("Invalid wallet id", { id: "register-invalid-wallet" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ walletId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Registration failed");
      }

      toast.success("Registered successfully!", { id: "register-success" });
      router.push("/mine");
    } catch (e: any) {
      toast.error(e?.message || "Registration failed", { id: "register-error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md bg-white/10 rounded-2xl p-6 border border-white/10">
        <h1 className="text-2xl font-semibold mb-2">Register</h1>
        <p className="text-sm opacity-80 mb-4">
          Register by linking your wallet. Your wallet ID will be stored in the database.
        </p>

        <div className="bg-black/30 rounded-lg p-3 text-xs break-all mb-5">
          Wallet: {walletId || "(not connected)"}
        </div>

        <Button
          className="w-full"
          disabled={loading || !connected || !wallet?.publicKey}
          onClick={register}
        >
          {loading ? "Registering..." : "Register Wallet"}
        </Button>

        <Button
          className="w-full mt-3 bg-white/10"
          onClick={() => router.push("/")}
        >
          Back
        </Button>
      </div>
      {/* Connect Modal - rendered here so it's available on register page */}
      <ConnectModal open={showConnectModal} onClose={() => toggleConnectModal(false)} />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-screen flex items-center justify-center bg-black text-white p-6">
          <div className="w-full max-w-md bg-white/10 rounded-2xl p-6 border border-white/10">
            Loading...
          </div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
