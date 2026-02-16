'use client';
import React, { useState } from "react";
import { Button, Image } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Dancing_Script } from "next/font/google";
import styled from "styled-components";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import toast from "react-hot-toast";
import { API_URL } from "@/config";

const dancing = Dancing_Script({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});


const GameBoard = () => {
    const router = useRouter();
    const { wallet, connected } = useQubicConnect();
    const [isChecking, setIsChecking] = useState(false);

    const handleLaunch = async () => {
        // Prevent multiple simultaneous calls
        if (isChecking) return;

        if (!connected || !wallet?.publicKey) {
            router.push("/landing");
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
                router.push("/landing");
            } else {
                router.push(`/register?walletId=${walletId}`);
            }
        } catch (e: any) {
            toast.error(e?.message || "Server error. Please try again.", { id: "launch-error" });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <StyledWrapper>
            <div className="relative">
                <img 
                    src="/assets/image/home.png" 
                    alt="Casino Background" 
                    className="object-cover w-screen h-screen"
                />

                {/* Logo - top left area */}
                <img
                    src="/assets/image/logo.png"
                    alt="Logo"
                    className="absolute z-10 left-6 top-6 w-[140px] md:w-[180px] lg:w-[220px] object-contain"
                />

                {/* Dog and machine - bottom corners (symmetrical) */}
                <img
                    src="/assets/image/dog.png"
                    alt="Dog"
                    className="absolute z-10 left-6 bottom-7 w-[140px] md:w-[200px] lg:w-[260px] object-contain"
                />
                <img
                    src="/assets/image/machine.png"
                    alt="Slot machine"
                    className="absolute z-10 right-6 bottom-10 w-[140px] md:w-[200px] lg:w-[260px] object-contain"
                />
                
                {/* Launch App Button - Positioned in the blue area */}
                <div className="absolute z-10 left-1/2 -translate-x-1/2" style={{ top: '65%' }}>
                    <Button 
                        className={`synthwave-laser-button ${isChecking ? 'is-checking' : ''}`}
                        onClick={handleLaunch}
                        disabled={isChecking}
                    >
                        <span className="button-text">
                            {isChecking ? "Checking..." : "Launch App"}
                        </span>
                        {isChecking && (
                            <div className="progress-bar-container">
                                <div className="progress-bar-fill"></div>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </StyledWrapper>
    );
}


const StyledWrapper = styled.div`
    .masked-text {
    font-weight: bold;
    color: transparent;
    background-image: url('https://images.unsplash.com/photo-1732535725600-f805d8b33c9c?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
    background-size: 200%;
    /* Enlarged for smooth animation */
    background-position: 0 50%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: animate-background 5s infinite alternate linear;
    }
    @keyframes animate-background {
        0% {
            background-position: 0 50%;
        }

        100% {
            background-position: 100% 50%;
        }

    }

`;


export default GameBoard;

