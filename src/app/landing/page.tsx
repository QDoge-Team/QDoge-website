'use client';

import Card from '@/components/Cards/Card'
import React, { useEffect } from 'react'
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import { API_URL } from "@/config";
import ConnectModal from "@/components/CONNECT/ConnectModal";

export default function Page() {
    const router = useRouter();
    const { wallet, connected, walletReady, toggleConnectModal, showConnectModal } = useQubicConnect();
    useEffect(() => {
        const check = async () => {
            if (!walletReady) return;
            if (!connected || !wallet?.publicKey) {
                return;
            }

            const walletId = wallet.publicKey.toUpperCase();
            try {
                const res = await fetch(`${API_URL}/api/users/exists/${walletId}`, { 
                    credentials: "include" 
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.error || "Failed to check user");
                }
                if (!data.exists) {
                    router.push(`/register?walletId=${walletId}`);
                }
            } catch (e: any) {
                const isNetworkError =
                    e instanceof TypeError ||
                    e?.message === "Network Error" ||
                    e?.message === "Failed to fetch";

                if (isNetworkError) {
                    console.warn("Backend unreachable, staying on landing page");
                } else {
                    toast.error("Server error. Please try again.");
                    router.push("/");
                }
            }
        };

        check();
    }, [connected, wallet?.publicKey, router, toggleConnectModal, walletReady]);

    const rooms = [
        {
            link:"/mine",
            background:"mine",
            name: "Mines",
            desc: "Uncover gems",
            badge: "popular",
        },
        {
            link:"/slide",
            background:"jackport",
            name: "Slide",
            desc: "Ride the wave",
            badge: "",
        },
        {
            link:"/videopoker",
            background:"poker",
            name: "Poker",
            desc: "Hold your cards",
            badge: "classic",
        },
        {
            link:"/crash",
            background:"crash",
            name: "Crash",
            desc: "Cash out in time",
            badge: "hot",
        },
    ]

    const handleRoomClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!connected || !wallet?.publicKey) {
            event.preventDefault();
            toggleConnectModal(true);
        }
    };

    return (
        <div className='relative w-screen min-h-screen bg-black overflow-hidden'>
            {/* Background layers */}
            <div className="absolute inset-0 bg-cyber-gradient" />
            <div className="bg-retro-grid" />
            <div className="ambient-particles">
                <span /><span /><span /><span />
                <span /><span /><span /><span />
            </div>
            
            {/* Content */}
            <div className='relative z-10 w-full min-h-screen flex flex-col items-center justify-center py-16 px-4'>
                
                {/* Mascot + Header Section */}
                <div className="flex flex-col items-center mb-10">
                    <img 
                        src="/assets/image/qdoge-logo-small.png" 
                        alt="QDoge" 
                        className="w-16 h-16 rounded-full border border-cyan-400/20 shadow-[0_0_30px_rgba(0,243,255,0.15)] mb-4"
                    />
                    <div className="section-header">
                        <span className="prefix">{'>'} SELECT_GAME</span>
                        <h2>Game Rooms</h2>
                        <span className="separator" />
                    </div>
                    <p className="text-xs font-mono text-gray-500 mt-3 tracking-wider max-w-md text-center">
                        Choose your arena. Each game is provably fair and runs on-chain.
                    </p>
                </div>

                {/* Stats bar */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="stat-badge">
                        <span className="pulse-dot" />
                        <span>4 GAMES LIVE</span>
                    </div>
                    <div className="stat-badge">
                        <span>PROVABLY FAIR</span>
                    </div>
                </div>

                {/* Game grid */}
                <div className='max-w-[580px] w-full'>
                    <div className='grid grid-cols-2 gap-5'>
                        {rooms.map((room, idx) => (
                            <div 
                                key={idx} 
                                className="animate-fade-in-up relative" 
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <Card {...room} onClick={handleRoomClick} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Connect CTA */}
                <div className="mt-10 flex flex-col items-center">
                    {!connected ? (
                        <>
                            <button 
                                onClick={() => toggleConnectModal(true)}
                                className="cyber-button !text-xs !tracking-[0.15em]"
                            >
                                <span className="mr-1.5">⟁</span> Connect Wallet to Play
                            </button>
                            <p className="text-[10px] font-mono text-gray-600 mt-3 tracking-wider">
                                QUBIC WALLET REQUIRED
                            </p>
                        </>
                    ) : (
                        <div className="stat-badge">
                            <span className="pulse-dot" />
                            <span>WALLET CONNECTED</span>
                        </div>
                    )}
                </div>
            </div>

            <div className='hidden bg-jackport bg-mine bg-poker bg-crash'></div>
            <ConnectModal open={showConnectModal} onClose={() => toggleConnectModal(false)} />
        </div>
    )
}
