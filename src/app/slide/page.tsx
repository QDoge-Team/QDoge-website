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
import MultiPlierInput from "@/components/MultiplierInput";
import CurrentBets from "@/components/CurrentBets";
import Slider from "@/components/Slider";
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
        // Use polling first as fallback, then upgrade to websocket
        const s = io(`${API_URL}/slide`, {
            autoConnect: false,
            transports: ['polling', 'websocket'], // Try polling first, then websocket (better fallback)
            upgrade: true, // Allow transport upgrades
            rememberUpgrade: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000, // Increase timeout for connection attempts
        });

        socketRef.current = s;

        let socketErrorCount = 0;

        const handleConnect = () => {
            if (isUnmountingRef.current) return;
            if (socketErrorCount > 0) {
                console.log(`[SLIDE] Server connected after ${socketErrorCount} failed attempt(s)`);
            } else {
                console.log("[SLIDE] Server connected");
            }
            socketErrorCount = 0;
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

        const handleConnectError = (error: any) => {
            if (isUnmountingRef.current) return;
            socketErrorCount++;
            if (socketErrorCount === 1) {
                console.warn("[SLIDE] Connection error (will retry silently):", error?.message);
            } else if (socketErrorCount % 10 === 0) {
                console.warn(`[SLIDE] Still unable to connect after ${socketErrorCount} attempts`);
            }
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
        s.on("connect_error", handleConnectError);
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

    // Helper: get tier class for history pill
    const getTierClass = (point: number) => {
        if (point >= 1000) return 'tier-diamond';
        if (point >= 100) return 'tier-cyan';
        if (point >= 10) return 'tier-orange';
        if (point >= 5) return 'tier-blue';
        if (point >= 2) return 'tier-white';
        return 'tier-dark';
    };

    // Helper: is cancel action
    const isCancel = planedbet && (status === STATUS.PLAYING || status === STATUS.BETTING);

    return (
        <Layout>
            <div className={`h-full ${isMobile ? "w-full p-2" : "p-2 sm:p-4"}`}>
                <div className="flex flex-col sm:flex-row gap-3 h-full max-w-[1200px] mx-auto">

                    {/* ═══ GAME DISPLAY ═══ */}
                    <div className="flex-1 game-display flex flex-col">
                        {/* History row */}
                        {/* Top bar: JACKPOT title + Join Pot */}
                        <div className="slide-top-bar">
                            <div className="slide-jackpot-title">JACKPOT</div>
                            <button className="join-pot-button" onClick={() => { /* placeholder for join pot action */ }}>
                                Join Pot
                            </button>
                        </div>

                        <div className="slide-history-row m-3 mb-0 flex-wrap">
                            {history.slice(-8).map((h: any, i: number) => (
                                <span key={i} className={`slide-history-pill ${getTierClass(h.resultpoint)}`}>
                                    {h.resultpoint}x
                                </span>
                            ))}
                            <div className="flex-1" />
                            <button className="slide-fairness-btn" onClick={() => setShowHelp(true)}>
                                ⚖ Fair
                            </button>
                        </div>

                        {/* Slider area */}
                        <div className={`relative flex-1 flex items-center justify-center ${isMobile ? "min-h-[280px]" : "min-h-[300px]"} overflow-hidden`}>
                            <div className="w-full h-full flex items-center">
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
                        </div>

                        {/* Bottom bar: bets count + payouts info + round */}
                        <div className="flex items-center gap-3 px-3 pb-1">
                            <div className="slide-bets-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                <span>{bets.length} Players</span>
                            </div>
                            <div className="slide-bets-badge">
                                <span className="bet-dot" />
                                <span>Payouts are settled in QU</span>
                            </div>
                            <div className="flex-1" />
                            <div className="slide-bets-badge">
                                <span className="opacity-60">#</span>
                                <span>Round: {history.length}</span>
                            </div>
                        </div>
                        <StatusBar status={status} />
                    </div>

                    {/* ═══ BET PANEL ═══ */}
                    <div className={`game-panel ${isMobile ? 'w-full' : 'min-w-[280px] xl:min-w-[300px]'} flex flex-col`}>
                        <div className="game-panel-header">
                            <div className="flex items-center gap-1.5">
                                <span className="terminal-dot" style={{background:'#ff5f57'}} />
                                <span className="terminal-dot" style={{background:'#febc2e'}} />
                                <span className="terminal-dot" style={{background:'#28c840'}} />
                            </div>
                            <span className="flex-1 text-center text-[10px] font-mono text-cyan-400/50 tracking-[3px] uppercase">
                                🎰 slide
                            </span>
                            <button
                                onClick={() => setShowHelp(true)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-cyan-400/60 border border-cyan-400/15 hover:border-cyan-400/30 hover:text-cyan-400 transition-all"
                                title="Game Help"
                            >?</button>
                        </div>

                        <div className="game-panel-body flex flex-col gap-3 flex-1">
                            <SwitchTab onChange={setActiveTab} active={activeTab} disabled={disable} />
                            <AmountInput onChange={setBetAmount} value={betAmount} disabled={disable} />
                            <MultiPlierInput onChange={setTarget} value={target} disabled={disable} />

                            <button
                                className={`slide-bet-button ${isCancel ? 'cancel' : ''} ${betting ? 'waiting' : ''}`}
                                disabled={disable && !isCancel}
                                onClick={() => {
                                    if (betting || inputDisable.current) return;
                                    if (status === STATUS.PLAYING) {
                                        if (planedbet) {
                                            savedBet.current = undefined;
                                            setPlanedBet(false);
                                        } else {
                                            createbet();
                                        }
                                    } else if (status === STATUS.BETTING) {
                                        if (planedbet) {
                                            savedBet.current = undefined;
                                            setPlanedBet(false);
                                        } else {
                                            createbet();
                                        }
                                    }
                                }}
                            >
                                {getButtonContent()}
                            </button>

                            <CurrentBets bets={bets.map((b) => {
                                if (status === STATUS.PLAYING) {
                                    return { ...b, isWinner: false };
                                } else {
                                    return { ...b, isWinner: result.multiplier > b.target };
                                }
                            })} />
                        </div>
                    </div>

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
        let interval: ReturnType<typeof setInterval> | undefined;
        switch (status) {
            case STATUS.BETTING:
                time.current = 2000;
                setstatustime(2000);
                interval = setInterval(() => {
                    if (time.current > 0) {
                        time.current--;
                        setstatustime(time.current);
                    }
                }, 10);
                break;
            case STATUS.PLAYING:
                time.current = -1;
                setstatustime(-1);
                break;
            case STATUS.STARTING:
            case STATUS.WAITTING:
                break;
        }
        return () => { if (interval) clearInterval(interval); };
    }, [status]);

    return (
        <div className="slide-status-bar">
            {statustime === -1 && status === STATUS.WAITTING && (
                <span className="status-text connecting">Connecting…</span>
            )}
            {statustime === -1 && status !== STATUS.WAITTING && (
                <span className="status-text" style={{ color: 'rgba(0,243,255,0.3)' }}>●●●</span>
            )}
            {statustime === 0 && (
                <span className="status-text">Starting…</span>
            )}
            {statustime > 0 && (
                <>
                    <div className="progress-fill" style={{ width: `${(statustime / 2000) * 100}%` }} />
                    <span className="status-text">
                        Betting {(statustime / 100).toFixed(1)}s
                    </span>
                </>
            )}
        </div>
    );
}