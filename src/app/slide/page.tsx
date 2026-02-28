"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";


import { API_URL, CASINO_OWNER_PUBLIC_ID, QUBIC_EXPLORER_URL } from "@/config";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import toast from "react-hot-toast";
import CelebrationAnimations from "@/components/Mine/CelebrationAnimations";
import useIsMobile from "@/hooks/useIsMobile";
import SwitchTab from "@/components/SwitchTab";
import AmountInput from "@/components/AmountInput";
import { Button } from "@heroui/react";
import MultiPlierInput from "@/components/MultiplierInput";
import CurrentBets from "@/components/CurrentBets";
import Slider, { findTile } from "@/components/Slider";
import Layout from "@/layout/layout";
import GameGuide from "@/components/GameGuide";

enum STATUS {
    WAITTING,
    STARTING,
    BETTING,
    PLAYING
}

type Player = {
    playerId: string,
    betAmount: number;
    currencyId: string;
    target: number;
    status: string;
}


const AUDIO_ENABLED = false;

const useAudio = () => {
    const betAudioRef = useRef<HTMLAudioElement | null>(null);
    const slidingAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!AUDIO_ENABLED) return;
        if (typeof window === "undefined") return;

        betAudioRef.current = new Audio("/assets/audio/bet.DUx2OBl3.mp3");
        slidingAudioRef.current = new Audio("/assets/audio/sliding.pgFKr6A8.mp3");

        return () => {
            // Cleanup audio references
            if (betAudioRef.current) {
                betAudioRef.current.pause();
                betAudioRef.current.src = "";
                betAudioRef.current = null;
            }
            if (slidingAudioRef.current) {
                slidingAudioRef.current.pause();
                slidingAudioRef.current.src = "";
                slidingAudioRef.current = null;
            }
        };
    }, []);

    const playAudio = (key: string) => {
        if (!AUDIO_ENABLED) return;
        const audio = key === "bet" ? betAudioRef.current : slidingAudioRef.current;
        if (!audio) return;

        try {
            // Reset audio to beginning for consistent playback
            if (audio.currentTime > 0) {
                audio.currentTime = 0;
            }
            audio.muted = true;
            audio.play().then(() => {
                setTimeout(() => {
                    audio.muted = false;
                }, 1000);
            }).catch(() => {
                // Silently handle autoplay errors - expected behavior in browsers
            });
        } catch (error) {
            // Silently handle errors
        }
    };

    return { playAudio };
};


const SlideGame = () => {
    const isMobile = useIsMobile();
    const { wallet, connected, transfer, fetchBalance, walletBalances, waitForTxConfirmation } = useQubicConnect();
    
    // Create socket inside component using useRef to prevent recreation
    const socketRef = useRef<Socket | null>(null);
    const isUnmountingRef = useRef(false);
    const playingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const handleStatusRef = useRef<(data: any) => void>(() => {});

    const [activeTab, setActiveTab] = useState<number>(0);
    const [betAmount, setBetAmount] = useState<number>(0);
    const [target, setTarget] = useState<number>(0);
    const betCount = useRef<number>(0);
    const [autobet, setAutobet] = useState<boolean>(false);
    const [bets, setBets] = useState<any[]>([]);

    const [history, setHistory] = useState<any[]>([]);

    const [result, setResult] = useState({
        numbers: [],
        multiplier: 1
    });

    const savedBet = useRef<any | undefined>(null);
    const elapsedTime = 5;
    const inputDisable = useRef<boolean>(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [currentPlayerBet, setCurrentPlayerBet] = useState<any>(null);
    const selfPlayerId = useRef<string | null>(null);
    const pendingTxRef = useRef<{ txId: string; target: number; betAmount: number; currencyId: string } | null>(null);
    const lastJoinPayloadRef = useRef<{ txId: string; target: number; betAmount: number; currencyId: string } | null>(null);

    const [privateHash, setPriviateHash] = useState<string>("");
    const [publichSeed, setPublicSeed] = useState<string>("");

    const [status, setStatus] = useState(STATUS.WAITTING);
    const statusRef = useRef<STATUS>(STATUS.WAITTING); // Ref to check status before transfer
    const [betting, setBetting] = useState(false);
    const [planedbet, setPlanedBet] = useState<boolean>(false);
    const [betcount, setBetCount] = useState(0);
    const unlockTimerRef = useRef<NodeJS.Timeout | null>(null); // Fail-safe timeout for join-game

    const [stopProfitA, setStopPorfitA] = useState<number>(0);
    const [stopLossA, setStopLossA] = useState<number>(0);
    const [amountInputFlag, setAmountInputFlag] = useState(true);

    const stopOnProfit = useRef(0);
    const stopOnLoss = useRef(0);
    const { playAudio } = useAudio();
    const createbet = async () => {
        stopOnProfit.current = stopProfitA;
        stopOnLoss.current = stopLossA;

        if (!wallet?.publicKey || !connected) {
            toast.error("Please connect your wallet first");
            return;
        }
        if (pendingTxRef.current) {
            toast.error("Bet already confirmed. Waiting for next round.", { id: "pending-bet" });
            return;
        }

        const amountInt = Math.floor(betAmount);
        if (amountInt <= 0) {
            setAmountInputFlag(false);
            toast.error("Please input your bet amount!");
            return;
        }

        // Check if amount exceeds balance
        const walletBalance = walletBalances?.qubic || 0;
        if (amountInt > walletBalance) {
            toast.error(`Cannot bet! Amount exceeds your balance of ${walletBalance} QU. Please reduce the amount.`);
            setAmountInputFlag(false);
            return;
        }

        const targetNum = Math.floor(target);
        if (targetNum <= 0) {
            toast.error("Please set a valid target multiplier!");
            return;
        }

        if (status !== STATUS.BETTING) {
            // Not in betting phase - plan bet for next round
            savedBet.current = {
                target: targetNum,
                betAmount: amountInt,
                currencyId: "",
                infinity: autobet && betcount > 0
            }

            if (autobet && betcount > 0) {
                betCount.current = betcount;
                betCount.current--;
                setBetCount(betCount.current);
            } else {
                betCount.current = 0;
            }

            setPlanedBet(true);
            toast.success("Bet planned for next round!");
        } else {
            // In betting phase - place bet immediately
            if (betting || inputDisable.current) {
                return;
            }

            setBetting(true);
            inputDisable.current = true;

            // Clear any existing unlock timer
            if (unlockTimerRef.current) {
                clearTimeout(unlockTimerRef.current);
                unlockTimerRef.current = null;
            }

            try {
                // Transfer tokens first - wait for confirmation
                const transferResult = await transfer(CASINO_OWNER_PUBLIC_ID, amountInt);
                const txId = transferResult.txId;

                if (!txId) {
                    throw new Error("Transaction ID not received");
                }

                const joinPayload = {
                    target: targetNum,
                    betAmount: amountInt,
                    currencyId: "",
                    txId: txId
                };
                lastJoinPayloadRef.current = joinPayload;

                // Only after successful transfer, join game with txId
                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit("join-game", joinPayload);

                    // Fail-safe timeout: unlock controls if server doesn't respond within 15s
                    unlockTimerRef.current = setTimeout(() => {
                        if (unlockTimerRef.current) {
                            setBetting(false);
                            inputDisable.current = false;
                            toast.error("No response from server. Bet cancelled. Please try again.");
                            unlockTimerRef.current = null;
                        }
                    }, 15000);
                } else {
                    throw new Error("Socket not connected");
                }

                // Don't show success here - wait for server confirmation
            } catch (err: any) {
                console.error("Transfer error:", err);
                toast.error(`Transfer failed: ${err?.message || "Unknown error"}`, { id: "transfer-error" });
                setBetting(false);
                inputDisable.current = false;
                return;
            }

            if (autobet) {
                betCount.current = betcount;
                savedBet.current = {
                    target: targetNum,
                    betAmount: amountInt,
                    currencyId: "",
                    infinity: betcount > 0
                }
                setPlanedBet(true);
            }
        }
    }


    const startBetting = async () => {
        if (!wallet?.publicKey || !connected) {
            return;
        }

        // Only proceed if there's a planned bet
        if (!planedbet || !savedBet.current) {
            return;
        }

        // Check stop conditions for autobet
        if (autobet) {
            if (stopProfitA !== 0 && stopOnProfit.current <= 0) {
                setPlanedBet(false);
                savedBet.current = undefined;
                return;
            }
            // check stop on loss amount
            if (stopLossA !== 0 && stopOnLoss.current <= 0 && Math.abs(stopOnLoss.current) > Math.abs(stopOnProfit.current)) {
                setPlanedBet(false);
                savedBet.current = undefined;
                return;
            }

            // Check bet count for finite autobet
            if (!savedBet.current.infinity && betCount.current <= 0) {
                setPlanedBet(false);
                savedBet.current = undefined;
                return;
            }

            // Decrement bet count for finite autobet
            if (savedBet.current.infinity && betCount.current > 0) {
                betCount.current--;
                setBetCount(betCount.current);
            }
        }

        // Check balance before betting
        const walletBalance = walletBalances?.qubic || 0;
        if (savedBet.current.betAmount > walletBalance) {
            toast.error(`Insufficient balance! Need ${savedBet.current.betAmount} QU but only have ${walletBalance} QU.`);
            setPlanedBet(false);
            savedBet.current = undefined;
            return;
        }

        // Prevent multiple simultaneous bets
        if (betting || inputDisable.current) {
            return;
        }

        // Check status before transfer - only transfer if in BETTING phase
        if (statusRef.current !== STATUS.BETTING) {
            setBetting(false);
            inputDisable.current = false;
            toast.error("Game is not accepting bets right now. Please wait for the betting phase.");
            return;
        }

        // If we already have a confirmed tx waiting, use it for this round
        if (pendingTxRef.current) {
            const payload = pendingTxRef.current;
            pendingTxRef.current = null;
            lastJoinPayloadRef.current = payload;
            setBetting(true);
            inputDisable.current = true;
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit("join-game", payload);
                unlockTimerRef.current = setTimeout(() => {
                    if (unlockTimerRef.current) {
                        setBetting(false);
                        inputDisable.current = false;
                        toast.error("No response from server. Bet cancelled. Please try again.");
                        unlockTimerRef.current = null;
                    }
                }, 15000);
            }
            return;
        }

        setBetting(true);
        inputDisable.current = true;

        // Clear any existing unlock timer
        if (unlockTimerRef.current) {
            clearTimeout(unlockTimerRef.current);
            unlockTimerRef.current = null;
        }

        try {
            // Transfer tokens first - wait for confirmation
            const transferResult = await transfer(CASINO_OWNER_PUBLIC_ID, savedBet.current.betAmount);
            const txId = transferResult.txId;

            if (!txId) {
                throw new Error("Transaction ID not received");
            }

            const joinPayload = {
                target: savedBet.current.target,
                betAmount: savedBet.current.betAmount,
                currencyId: savedBet.current.currencyId || "",
                txId: txId
            };
            lastJoinPayloadRef.current = joinPayload;

            // Only after successful transfer, join game with txId
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit("join-game", joinPayload);

                // Fail-safe timeout: unlock controls if server doesn't respond within 15s
                unlockTimerRef.current = setTimeout(() => {
                    if (unlockTimerRef.current) {
                        setBetting(false);
                        inputDisable.current = false;
                        toast.error("No response from server. Bet cancelled. Please try again.");
                        unlockTimerRef.current = null;
                    }
                }, 15000);
            } else {
                throw new Error("Socket not connected");
            }

            // For non-autobet mode, clear planned bet after placing
            if (!autobet) {
                savedBet.current = undefined;
                setPlanedBet(false);
            }
        } catch (err: any) {
            console.error("Transfer error:", err);
            toast.error(`Transfer failed: ${err?.message || "Unknown error"}`, { id: "transfer-error" });
            setBetting(false);
            inputDisable.current = false;
            
            // On error, clear planned bet
            if (!autobet) {
                savedBet.current = undefined;
                setPlanedBet(false);
            }
        }
    }

    const joinSuccess = (data: any) => {
        // Clear fail-safe timeout
        if (unlockTimerRef.current) {
            clearTimeout(unlockTimerRef.current);
            unlockTimerRef.current = null;
        }

        setBetting(false);
        inputDisable.current = false;
        playAudio("bet");
        pendingTxRef.current = null;
        lastJoinPayloadRef.current = null;
        
        // Store player ID for payout tracking
        if (data?.playerId) {
            selfPlayerId.current = data.playerId;
            setCurrentPlayerBet({
                playerId: data.playerId,
                betAmount: savedBet.current?.betAmount || betAmount,
                target: savedBet.current?.target || target,
                status: "active"
            });
        }

        toast.success(`Bet placed! ${savedBet.current?.betAmount || betAmount} QU`, { id: "join-success" });

        // Update stop on loss for autobet
        if (planedbet && savedBet.current && stopLossA !== 0) {
            stopOnLoss.current -= savedBet.current.betAmount;
        }
    }

    const joinFailed = (msg: string) => {
        // Clear fail-safe timeout
        if (unlockTimerRef.current) {
            clearTimeout(unlockTimerRef.current);
            unlockTimerRef.current = null;
        }

        setBetting(false);
        inputDisable.current = false;
        toast.error(msg || "Failed to join game", { id: "join-error" });

        // If bet was confirmed but round closed, queue it for next round
        if (String(msg || "").toLowerCase().includes("not accepting bets") && lastJoinPayloadRef.current) {
            pendingTxRef.current = lastJoinPayloadRef.current;
            savedBet.current = {
                target: pendingTxRef.current.target,
                betAmount: pendingTxRef.current.betAmount,
                currencyId: pendingTxRef.current.currencyId,
                infinity: false
            };
            setPlanedBet(true);
            toast.success("Bet confirmed. Joining the next round automatically.", { id: "join-next-round" });
            return;
        }

        // Clear planned bet on failure
        if (!autobet) {
            savedBet.current = undefined;
            setPlanedBet(false);
        }
    }

    // Handle payout success - similar to crash game
    const handlePayoutSuccess = async (data?: { payoutTxId?: string; winAmount?: number; multiplier?: number; playerId?: string }) => {
        const winAmount = data?.winAmount || 0;
        const payoutTxId = data?.payoutTxId;
        
        // Only process if this is our payout
        if (data?.playerId && selfPlayerId.current && data.playerId !== selfPlayerId.current) {
            return;
        }

        if (winAmount > 0) {
            // Show celebration animation
            setShowCelebration(true);
            
            // Confirm payout on-chain before showing success + updating balance
            if (payoutTxId) {
                toast.loading("Payout submitted. Waiting for confirmation...", { id: "payout-slide" });

                const confirmed = await waitForTxConfirmation(payoutTxId, 30, 1000);

                if (isUnmountingRef.current) {
                    return;
                }

                setShowCelebration(false);
                toast.dismiss("payout-slide");

                if (confirmed) {
                    if (fetchBalance) {
                        await fetchBalance();
                    }
                    toast.success(
                        <div>
                            <div>You won {winAmount} QU!</div>
                            <a
                                href={`${QUBIC_EXPLORER_URL}${payoutTxId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline"
                            >
                                View Transaction
                            </a>
                        </div>,
                        { duration: 5000, id: "payout-confirmed-slide" }
                    );
                } else {
                    toast(
                        <div>
                            <div>Payout submitted (pending confirmation)</div>
                            <a
                                href={`${QUBIC_EXPLORER_URL}${payoutTxId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline"
                            >
                                View Transaction
                            </a>
                        </div>,
                        { duration: 5000, id: "payout-pending-slide", icon: "⏳" }
                    );
                }

                setTimeout(() => {
                    if (!isUnmountingRef.current) {
                        setBetAmount(0);
                        setCurrentPlayerBet(null);
                        selfPlayerId.current = null;
                    }
                }, 2000);
            } else {
                // No payout TxId but win amount exists
                toast.success(`You won! ${winAmount} QU`, { duration: 5000 });
                setTimeout(() => {
                    if (!isUnmountingRef.current) {
                        setShowCelebration(false);
                        setBetAmount(0);
                        setCurrentPlayerBet(null);
                        selfPlayerId.current = null;
                    }
                }, 5000);
            }
        }
    }


    // Handle status with ref wrapper to avoid stale closures
    handleStatusRef.current = (data: any) => {
        // Clear previous delayed handler (prevents timeout pile-up)
        if (playingTimeoutRef.current) {
            clearTimeout(playingTimeoutRef.current);
            playingTimeoutRef.current = null;
        }

        if (data.status === STATUS.STARTING) {
            setBets([]);
            setPublicSeed(data.publicSeed);
            setPriviateHash(data.privateHash);
            setStatus(STATUS.STARTING);
            inputDisable.current = false;
            // Reset player tracking for new round
            setCurrentPlayerBet(null);
            if (data._id) {
                addGameToHistory({ _id: data._id, resultpoint: data.crashPoint })
            }
        } else if (data.status === STATUS.BETTING) {
            setStatus(STATUS.BETTING);
            inputDisable.current = false; // Allow user to type + click bet
            // Only auto-bet if there's a planned bet (user must confirm first bet)
            // This prevents the game from betting automatically without user confirmation
            if (planedbet && savedBet.current && (autobet || !betting)) {
                startBetting();
            }
        } else if (data.status === STATUS.PLAYING) {
            setStatus(STATUS.PLAYING);
            inputDisable.current = false;
            
            // Check if user has bet (participating in this round)
            const userHasBet = !!selfPlayerId.current || !!currentPlayerBet || !!savedBet.current || betting || planedbet;
            
            if (userHasBet) {
                playAudio("sliding");
                
                // Update stop on profit for autobet
                if (planedbet && savedBet.current && data.crashPoint >= savedBet.current.target && stopProfitA !== 0) {
                    stopOnProfit.current -= savedBet.current.betAmount * data.crashPoint;
                }

                // Cap numbers array to prevent UI freeze (max 1500 points)
                const MAX_POINTS = 1500;
                const safeNumbers = Array.isArray(data.numbers) ? data.numbers.slice(0, MAX_POINTS) : [];
                
                // Update result with capped numbers (only if user has bet)
                setResult({ numbers: safeNumbers, multiplier: data.crashPoint });
            } else {
                // Spectator: no animation, keep idle state
                setResult({ numbers: [], multiplier: 1 });
            }

            // Update bets list with delay to show animation
            playingTimeoutRef.current = setTimeout(() => {
                if (isUnmountingRef.current) return;
                
                setBets(data.players || []);
                
                // Check if current player won and trigger payout
                if (selfPlayerId.current && data.players && data.players.length > 0) {
                    const playerBet = data.players.find((p: any) => p.playerId === selfPlayerId.current);
                    const betAmount = savedBet.current?.betAmount || 0;
                    const target = savedBet.current?.target || 0;
                    
                    if (playerBet) {
                        // Check if player won (multiplier reached or exceeded target)
                        const won = data.crashPoint >= target;
                        
                        if (won && betAmount > 0) {
                            // Player won - calculate win amount
                            const winAmount = betAmount * data.crashPoint;
                            
                            // Trigger payout handling (backend should handle payout automatically)
                            // Poll balance to confirm receipt
                            handlePayoutSuccess({
                                payoutTxId: playerBet.payoutTxId || undefined,
                                winAmount: winAmount,
                                multiplier: data.crashPoint,
                                playerId: selfPlayerId.current
                            });
                        } else if (!won && betAmount > 0) {
                            // Player lost - show notification
                            toast.error(`Game stopped at ${data.crashPoint.toFixed(2)}x. Target was ${target.toFixed(2)}x. You lost ${betAmount} QU`, {
                                id: "game-lost-slide",
                                duration: 5000
                            });
                            setBetAmount(0);
                            setCurrentPlayerBet(null);
                            selfPlayerId.current = null;
                            savedBet.current = undefined;
                            setPlanedBet(false);
                        }
                    }
                }
            }, 3000);
        }
    };

    const addGameToHistory = (game: any) => {
        setHistory((state) =>
            state.length >= 6
                ? [...state.slice(1, state.length), game]
                : [...state, game]
        );
    };

    const getButtonContent = () => {
        if (betting)
            return "Betting..."

        if (status === STATUS.PLAYING) {
            if (planedbet) {
                if (autobet)
                    return "Stop Autobet";
                else
                    return "Cancel Bet"
            } else {
                if (autobet)
                    return "Start Autobet";
                return "Bet (Next Round)"
            }
        } else if (status === STATUS.BETTING) {
            if (autobet) {
                if (inputDisable.current)
                    return "Waiting..."
                if (planedbet)
                    return "Stop Autobet";
                return "Start Autobet";
            }
            if (planedbet)
                return "Cancel Bet";
            if (inputDisable.current)
                return "Waiting.."
            return "Bet"
        }

        return "Starting..."
    }

    const joinBet = (_bets: any[]) => {
        setBets((prevBets) => [...prevBets, ..._bets]);
    }

    // Single socket initialization effect - safest approach
    useEffect(() => {
        // Reset unmounting flag
        isUnmountingRef.current = false;
        
        if (socketRef.current) {
            return; // Socket already initialized
        }

        // Create socket with autoConnect: false to avoid StrictMode issues
        const s = io(`${API_URL}/slide`, {
            autoConnect: false,
            transports: ['websocket'], // Avoid polling noise
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socketRef.current = s;

        const handleConnect = () => {
            if (isUnmountingRef.current) return;
            console.log("[SLIDE] Server connected");
            if (wallet?.publicKey) {
                s.emit("auth", { publicId: wallet.publicKey });
            }
            // Request initial game state after connection is established
            s.emit("games");
        };

        const handleDisconnect = () => {
            if (isUnmountingRef.current) return;
            console.log("[SLIDE] Server disconnected");
        };

        const handleHistory = (data: any) => {
            if (isUnmountingRef.current) return;
            setHistory(data.reverse().slice(0, 6));
        };

        // Use ref wrapper for handleStatus to avoid stale closures
        const onSlideTrack = (data: any) => {
            handleStatusRef.current(data);
        };

        s.on("connect", handleConnect);
        s.on("disconnect", handleDisconnect);
        s.on("game-join-error", joinFailed);
        s.on("game-join-sucess", joinSuccess);
        s.on("slide-track", onSlideTrack);
        s.on("bet", joinBet);
        s.on("history", handleHistory);

        // Manually connect after setting up listeners
        s.connect();

        // Send auth when wallet is available
        if (wallet?.publicKey) {
            if (s.connected) {
                s.emit("auth", { publicId: wallet.publicKey });
            } else {
                s.once("connect", () => {
                    if (wallet?.publicKey && !isUnmountingRef.current) {
                        s.emit("auth", { publicId: wallet.publicKey });
                    }
                });
            }
        }

        return () => {
            // Mark as unmounting
            isUnmountingRef.current = true;
            
            // Clean up playing timeout
            if (playingTimeoutRef.current) {
                clearTimeout(playingTimeoutRef.current);
                playingTimeoutRef.current = null;
            }
            
            // Clean up unlock timer
            if (unlockTimerRef.current) {
                clearTimeout(unlockTimerRef.current);
                unlockTimerRef.current = null;
            }
            
            // Always disconnect, even if not connected (fixes zombie sockets)
            s.removeAllListeners();
            s.disconnect(); // ✅ ALWAYS disconnect
            socketRef.current = null;
        };
    }, [API_URL]); // Don't include wallet here to avoid re-initialization

    // Send auth when wallet becomes available
    useEffect(() => {
        if (!wallet?.publicKey || !socketRef.current) return;
        
        const s = socketRef.current;
        
        if (s.connected) {
            s.emit("auth", { publicId: wallet.publicKey });
        } else {
            const handleConnectForAuth = () => {
                if (wallet?.publicKey && !isUnmountingRef.current && s) {
                    s.emit("auth", { publicId: wallet.publicKey });
                }
            };
            s.once("connect", handleConnectForAuth);
            
            return () => {
                if (s) {
                    s.off("connect", handleConnectForAuth);
                }
            };
        }
    }, [wallet?.publicKey]);

    const disable = inputDisable.current || planedbet;

    useEffect(() => {
        setAutobet(activeTab == 1)
    }, [activeTab])

    // Update statusRef when status changes
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    return (
        <Layout>
            <div className={`h-full ${isMobile ? "w-full p-1" : ""} `}>
                <div className="grid grid-cols-1 sm:grid-cols-4 rounded-md overflow-hidden  bg-panel border-[1px] border-[#020202bb]  shadow-md h-full">
                    <div className="col-span-3 flex items-center justify-center">
                        <div className={`  gap-2 ${isMobile ? "min-h-[350px] " : "min-h-[300px] "
                            }   relative h-full overflow-hidden flex items-center justify-center`}>
                            <div className="flex absolute right-1/2 translate-x-1/2 top-5 z-20 w-[300px] space-x-1 items-center">
                                {history.slice(history.length - 10, history.length).map((h: any, index) => {
                                    return <Button onClick={() => { }}
                                        className="p-[3px] w-10  text-sm font-medium text-white"
                                        key={index}
                                        style={{
                                            background: findTile(h.resultpoint).color,
                                            color: findTile(h.resultpoint).text
                                        }}>
                                        {h.resultpoint}x
                                    </Button>
                                })}
                                <Button onClick={() => { }} className="p-[3px] w-10 text-sm font-medium text-white" style={{ background: "#50e3c2" }}>Fairness</Button>
                            </div>
                            <div className="w-full h-full flex items-center" >
                                {(() => {
                                    const userHasBet = !!selfPlayerId.current || !!currentPlayerBet || !!savedBet.current || betting || planedbet;
                                    return (
                                        <Slider 
                                            multiplier={userHasBet ? result.multiplier : 1} 
                                            elapsedTime={elapsedTime} 
                                            numbers={userHasBet ? result.numbers : []} 
                                        />
                                    );
                                })()}
                            </div>
                            <div className="absolute bottom-10 left-5 z-20">
                                <div className="flex space-x-1 w-20 items-center">
                                    <div className="w-3 h-3 rounded-full bg-bet_button"></div>
                                    <div className="text-white text-sm">Bets: {bets.length}</div>
                                </div>
                            </div>
                            <div className="w-full absolute bottom-0 z-20">
                                <StatusBar status={status} />
                            </div>
                            <div className="absolute z-10 top-0 left-0 w-full h-full" style={{ background: "linear-gradient(90deg,#071824,transparent,#071824)" }} />
                        </div>
                    </div>
                    {isMobile &&
                        <div className="col-span-1 p-2 min-h-[560px] bg-sider_panel shadow-[0px_0px_15px_rgba(0,0,0,0.25)] flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-white font-bold">SLIDE</h3>
                                <Button 
                                    onClick={() => setShowHelp(true)} 
                                    className="w-[36px] h-[36px] min-w-[36px] p-0 text-base font-bold text-white bg-[#00e701] hover:bg-[#00d600] rounded-full flex items-center justify-center"
                                    title="Game Help"
                                >
                                    ?
                                </Button>
                            </div>
                            <Button disabled={disable} onClick={() => {
                                if (betting || inputDisable.current)
                                    return;
                                if (status === STATUS.PLAYING) {
                                    if (planedbet) {
                                        savedBet.current = undefined;
                                        setPlanedBet(false);
                                    } else {
                                        createbet();
                                    }
                                } else if (status === STATUS.BETTING) {
                                    createbet();
                                }
                            }}>{getButtonContent()}
                            </Button>
                            <AmountInput onChange={setBetAmount} value={betAmount} disabled={disable} />
                            <MultiPlierInput onChange={setTarget} value={target} disabled={disable} />
                            <SwitchTab onChange={setActiveTab} active={activeTab} disabled={disable} />
                            <CurrentBets bets={bets.map((b) => {
                                if (status === STATUS.PLAYING) {
                                    return { ...b, isWinner: false }
                                } else {
                                    return { ...b, isWinner: result.multiplier > b.target }
                                }
                            })} />
                        </div>
                    }
                    {!isMobile &&
                        <div className="col-span-1 p-2 min-h-[560px] bg-sider_panel shadow-[0px_0px_15px_rgba(0,0,0,0.25)] flex flex-col gap-4">
                            <div className="flex items-center gap-4 mb-2 mt-3">
                                <div className="flex-1 [&>div]:mt-0">
                                    <SwitchTab onChange={setActiveTab} active={activeTab} disabled={disable} />
                                </div>
                                <Button 
                                    onClick={() => setShowHelp(true)} 
                                    className="w-[36px] h-[36px] min-w-[36px] p-0 text-base font-bold text-white bg-[#00e701] hover:bg-[#00d600] rounded-full flex-shrink-0 flex items-center justify-center"
                                    title="Game Help"
                                >
                                    ?
                                </Button>
                            </div>
                            <AmountInput onChange={setBetAmount} value={betAmount} disabled={disable} />
                            <MultiPlierInput onChange={setTarget} value={target} disabled={disable} />
                            <Button className="bg-[#00e701] hover:bg-[#00d600] rounded-full uppercase font-bold" disabled={disable} onPress={() => {
                                if (betting || inputDisable.current)
                                    return;
                                if (status === STATUS.PLAYING) {
                                    if (planedbet) {
                                        savedBet.current = undefined;
                                        setPlanedBet(false);
                                    } else {
                                        createbet();
                                    }
                                } else if (status === STATUS.BETTING) {
                                    createbet();
                                }
                            }}>{
                                    getButtonContent()
                                }</Button>
                            <CurrentBets bets={bets.map((b) => {
                                if (status === STATUS.PLAYING) {
                                    return { ...b, isWinner: false }
                                } else {
                                    return { ...b, isWinner: result.multiplier > b.target }
                                }
                            })} />
                        </div>
                    }
                </div>
            </div>
            <GameGuide isOpen={showHelp} onClose={() => setShowHelp(false)} gameName="slide" />
            <CelebrationAnimations
                visible={showCelebration}
                onComplete={() => setShowCelebration(false)}
            />
        </Layout>
    )
}

export default SlideGame;


const StatusBar = ({ status }: { status: STATUS }) => {
    const time = useRef<number>(-1);
    const [statustime, setstatustime] = useState(0);
    useEffect(() => {
        let interval: any;
        switch (status) {
            case STATUS.BETTING:
                time.current = 2000;
                setstatustime(2000);
                interval = setInterval(() => {
                    if (time.current > 0) {
                        time.current--;
                        setstatustime(time.current);
                    }
                }, 10)
                break;
            case STATUS.PLAYING:
                time.current = -1;
                setstatustime(-1);
                break;
            case STATUS.STARTING:
                break;
            case STATUS.WAITTING:
                break;
        }
        return () => {
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [status])


    return <div className="w-full h-2 flex-col justify-between">
        {statustime === -1 && <></>}
        {statustime === 0 && <div className="text-white">Starting...</div>}
        {statustime > 0 && <div className="h-2 bg-cyan-600" style={{
            width: (100 / 2000) * statustime + "%"
        }} ></div>}
    </div >

}