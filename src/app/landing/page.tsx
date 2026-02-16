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
            } catch (e) {
                toast.error("Server error. Please try again.");
                router.push("/");
            }
        };

        check();
    }, [connected, wallet?.publicKey, router, toggleConnectModal, walletReady]);

    const rooms = [
        {
            link:"/mine",
            background:"mine",
        },
        {
            link:"/slide",
            background:"jackport",
        },
        {
            link:"/videopoker",
            background:"poker",
        },
        {
            link:"/crash",
            background:"crash",
        },
    ]

    const handleRoomClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!connected || !wallet?.publicKey) {
            event.preventDefault();
            toggleConnectModal(true);
        }
    };

    return (
        <div className='bg-casino w-screen min-h-screen bg-center bg-cover bg-no-repeat'>
            <div className='w-full md:w-4/5 lg:w-2/3 xl:w-1/2 bg-black/60 backdrop-blur-sm min-h-screen relative flex items-center justify-center'>
                <div className='grid grid-cols-2 gap-4'>
                    {rooms.map((room, idx)=>(
                        <Card {...room} key={idx} onClick={handleRoomClick} />
                    ))}
                </div>

                <div className='hidden bg-jackport bg-mine bg-poker bg-crash'></div>
            </div>
            <ConnectModal open={showConnectModal} onClose={() => toggleConnectModal(false)} />
        </div>
    )
}
