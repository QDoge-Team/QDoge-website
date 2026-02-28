'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import toast from "react-hot-toast";
import { API_URL } from "@/config";


const GameBoard = () => {
    const router = useRouter();
    const { wallet, connected } = useQubicConnect();
    const [isChecking, setIsChecking] = useState(false);

    const handleLaunch = async () => {
        if (isChecking) return;

        if (!connected || !wallet?.publicKey) {
            router.push("/mine");
            return;
        }

        setIsChecking(true);
        const walletId = wallet.publicKey.toUpperCase();

        try {
            const res = await fetch(`${API_URL}/api/users/exists/${walletId}`, {
                credentials: "include",
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Failed to check registration");
            }

            if (data.exists) {
                router.push("/mine");
            } else {
                router.push(`/register?walletId=${walletId}`);
            }
        } catch (e: any) {
            const isNetworkError =
                e instanceof TypeError ||
                e?.message === "Network Error" ||
                e?.message === "Failed to fetch";

            if (isNetworkError) {
                console.warn("Backend unreachable, proceeding to landing page");
                router.push("/mine");
            } else {
                toast.error(e?.message || "Server error. Please try again.", { id: "launch-error" });
            }
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black">
            {/* Background layers */}
            <div className="absolute inset-0 bg-cyber-gradient" />
            <div className="bg-retro-grid" />
            
            {/* Animated scanlines */}
            <div className="absolute inset-0 pointer-events-none z-[2]" style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,243,255,0.015) 2px, rgba(0,243,255,0.015) 4px)',
            }} />

            {/* Floating particles — deterministic positions to avoid hydration mismatch */}
            <div className="absolute inset-0 z-[3] pointer-events-none">
                {[
                    { l: 5, t: 12, d: 4.2, dl: 0.3 }, { l: 15, t: 68, d: 5.1, dl: 1.8 },
                    { l: 23, t: 34, d: 3.7, dl: 0.9 }, { l: 32, t: 82, d: 6.0, dl: 3.2 },
                    { l: 41, t: 8, d: 4.5, dl: 2.1 },  { l: 50, t: 55, d: 5.4, dl: 4.0 },
                    { l: 58, t: 22, d: 3.3, dl: 0.5 }, { l: 66, t: 91, d: 6.3, dl: 1.4 },
                    { l: 74, t: 47, d: 4.8, dl: 3.7 }, { l: 82, t: 15, d: 5.7, dl: 2.6 },
                    { l: 90, t: 73, d: 3.9, dl: 0.1 }, { l: 8, t: 45, d: 6.5, dl: 4.5 },
                    { l: 28, t: 60, d: 4.1, dl: 1.2 }, { l: 47, t: 3, d: 5.8, dl: 3.5 },
                    { l: 63, t: 78, d: 3.5, dl: 0.7 }, { l: 79, t: 38, d: 6.1, dl: 2.9 },
                    { l: 95, t: 52, d: 4.4, dl: 4.3 }, { l: 12, t: 88, d: 5.2, dl: 1.6 },
                    { l: 37, t: 18, d: 3.8, dl: 3.0 }, { l: 55, t: 65, d: 6.7, dl: 0.4 },
                ].map((p, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
                        style={{
                            left: `${p.l}%`,
                            top: `${p.t}%`,
                            animation: `float ${p.d}s ease-in-out infinite`,
                            animationDelay: `${p.dl}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                {/* Logo */}
                <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <img
                        src="/assets/image/qdoge-logo-small.png"
                        alt="QDoge"
                        className="w-24 h-24 md:w-32 md:h-32 border-2 border-cyan-400/40 rounded-full shadow-neon-lg"
                    />
                </div>

                {/* Title */}
                <div className="text-center mb-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                        QDOGE
                    </h1>
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mt-2" />
                </div>

                {/* Subtitle */}
                <div className="text-center mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <p className="text-gray-400 font-mono text-sm tracking-[0.3em] uppercase">
                        Play-to-Earn Casino on Qubic
                    </p>
                </div>

                {/* Mascot image */}
                <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <img
                        src="/assets/image/qdoge_bark.webp"
                        alt="QDoge Mascot"
                        className="w-48 md:w-64 object-contain drop-shadow-[0_0_30px_rgba(0,243,255,0.15)] hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Launch button */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <button
                        className={`cyber-button text-lg px-10 py-4 tracking-widest ${
                            isChecking ? 'opacity-70 cursor-wait' : ''
                        }`}
                        onClick={handleLaunch}
                        disabled={isChecking}
                    >
                        <span className="mr-2">▸</span>
                        {isChecking ? "Initializing..." : "Launch App"}
                    </button>
                </div>

                {/* Status indicator */}
                <div className="mt-8 flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_8px_rgba(57,255,20,0.6)]' : 'bg-gray-600'}`} />
                    <span className="text-xs font-mono text-gray-500 tracking-wider">
                        {connected ? `Connected: ${wallet?.publicKey?.slice(0,4)}...${wallet?.publicKey?.slice(-4)}` : 'Wallet not connected'}
                    </span>
                </div>
            </div>

            {/* Corner decorations */}
            <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-cyan-400/20 z-10" />
            <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-cyan-400/20 z-10" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-cyan-400/20 z-10" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-cyan-400/20 z-10" />

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center py-3 bg-black/60 border-t border-cyan-400/10">
                <p className="text-[10px] font-mono text-gray-600 tracking-[0.3em]">
                    ▲ BUILT ON QUBIC — PLAY RESPONSIBLY ▲
                </p>
            </div>
        </div>
    );
}

export default GameBoard;

