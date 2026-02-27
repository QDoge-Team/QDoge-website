"use client"

import AmountInput from "@/components/AmountInput";
import BetNumberInput from "@/components/BetNumberInput";
import GameCanvas from "@/components/CrashXCanvas";
import CurrentBets from "@/components/CurrentBets";
import GameHistory from "@/components/GameHistory";
import MultiPlierInput from "@/components/MultiplierInput";
import ProfitAmount from "@/components/ProfitAmount";
import StopProfitAmount from "@/components/StopProfitAmount";
import CurrencyIcon from "@/components/CurrencyIcon";
import { QubSvg, InfinitySvg } from "@/components/svgs";
import SwitchTab from "@/components/SwitchTab";
import VerifyModal from "@/components/VerifyModal";
import { API_URL, CASINO_OWNER_PUBLIC_ID } from "@/config";
import { useSocket } from "@/context/socketcontext";
import useIsMobile from "@/hooks/useIsMobile";
import Layout from "@/layout/layout";
import { Button } from "@heroui/react";
import React, { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import toast from "react-hot-toast";
import { QUBIC_EXPLORER_URL } from "@/config";
import GameGuide from "@/components/GameGuide";

// import { crashXSocket as socket } from "../../utils/socket";



const GAME_STATES = {
    NotStarted: 1,
    Starting: 2,
    InProgress: 3,
    Over: 4,
    Blocking: 5,
    Refunded: 6,
};





const SelectedPaymentIcon = ({ currency }: any) => {
    if (currency && currency?.symbol) {
        return <img src={currency.icon} className="w-6 h-6" alt="currency" />;
    } else {
        return <QubSvg />;
    }
};

const AUDIO_ENABLED = false;

const playSound = (audioFile: any) => {
  try {
    if (!AUDIO_ENABLED) return;
    if (!audioFile) return;

    // Supports:
    // - HTMLAudioElement
    // - ref.current (HTMLAudioElement)
    // - string url
    // - imported asset module { default: string }
    let audio: HTMLAudioElement | null = null;

    if (typeof window === "undefined") return;

    if (audioFile instanceof HTMLAudioElement) {
      audio = audioFile;
    } else if (audioFile?.current instanceof HTMLAudioElement) {
      audio = audioFile.current;
    } else if (typeof audioFile?.play === "function") {
      audio = audioFile as HTMLAudioElement;
    } else if (typeof audioFile === "string") {
      audio = new Audio(audioFile);
    } else if (typeof audioFile?.default === "string") {
      audio = new Audio(audioFile.default);
    } else {
      // Not playable
      return;
    }

    // Reset and play (don't let autoplay errors crash the app)
    if (!audio) return;
    
    try {
      audio.currentTime = 0;
    } catch {}

    audio.play().catch(() => {});
  } catch (error) {
    console.log(error);
  }
};

const CrashGame = () => {
    const isMobile = useIsMobile();

    const [activeTab, setActiveTab] = useState(0);

    const [subActiveTab, setSubActiveTab] = useState(0);

    const [gameId, setGameId] = useState("");
    const [privateHash, setPrivateHash] = useState("");
    const [publicSeed, setPublicSeed] = useState("");

    const [betAmount, setBetAmount] = useState(0);
    const [target, setTarget] = useState(2);

    const [autoBetCount, setAutoCount] = useState(0);
    const [stopProfitA, setStopPorfitA] = useState(0);
    const [stopLossA, setStopLossA] = useState(0);

    const [joining, setJoining] = useState(false);
    const [plannedBet, setPlannedBet] = useState(false);
    const [autoBetEnabled, setAutoBetEnabled] = useState(false);
    const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);

    const [players, setPlayers] = useState<any[]>([]);
    const [startTime, setStartTime] = useState<any>(null);
    const [gameState, setGameState] = useState(GAME_STATES.NotStarted);
    const [payout, setPayout] = useState(1);
    const [crashed, setCrashed] = useState(false);
    const [betting, setBetting] = useState(false);
    const [cashedOut, setCashedOut] = useState(false);
    const [amountInputFlag, setAmountInputFlag] = useState(true);

    const [savebetAmount, setBetSaveAmount] = useState(0);
    const [history, setHistory] = useState<any>([]);

    const [verifyId, setGameVerifyId] = useState("");

    const betCountRef = useRef(0);
    const stopOnProfit = useRef(0);
    const stopOnLoss = useRef(0);
    const selfId = useRef(null);
    const savedTarget = useRef(0);
    const [showHelp, setShowHelp] = useState(false);
    const [privateSeed, setPrivateSeed] = useState("");

    const [currencies, setCurrencies] = useState<any[]>([]);
    const [currency, setCurrency] = useState<any | null>(null);

    const { wallet, connected, transfer, fetchBalance, walletBalances, waitForTxConfirmation, setBalanceUpdatesPaused } = useQubicConnect();
    const crashSocket = useSocket() as Socket;


    // Emit new bet event
    const clickBet = async () => {
        const amount = Number(betAmount);
        const tgt = Number(target);

        // ✅ Validate wallet
        if (!wallet?.publicKey) {
            console.log("Wallet not ready yet");
            return;
        }

        // ✅ Validate amount
        if (!Number.isFinite(amount) || amount <= 0) {
            setAmountInputFlag(false);
            return;
        }

        // ✅ Validate currency (this is the likely crash)
        if (!currency?._id) {
            console.error("Currency not selected / not loaded yet:", currency);
            // show a toast if you want
            // toast.error("Currency not loaded yet. Please wait and try again.");
            return;
        }

        // ✅ Validate price (avoid NaN logic)
        const price = Number(currency.price || 0);
        if (price > 0 && amount * price > 100) {
            return;
        }

        // ✅ Validate socket
        if (!crashSocket || !crashSocket.connected) {
            console.error("Crash socket not connected");
            // toast.error("Socket not connected. Refresh page.");
            return;
        }

        betCountRef.current = autoBetCount;
        stopOnProfit.current = stopProfitA;
        stopOnLoss.current = stopLossA;

        if (gameState === GAME_STATES.Starting) {
            setJoining(true);

            const target100 = Math.round(tgt * 100);
            savedTarget.current = target100;
            const amountInt = Math.floor(amount);

            try {
                // 1) Create payment tx first (Qubic transfer)
                const transferResult = await transfer(CASINO_OWNER_PUBLIC_ID, amountInt);
                const txId = transferResult.txId;

                // 2) Only after confirmation, join game with txId
                crashSocket.emit("join-game", {
                    target: target100,
                    betAmount: amountInt,
                    currencyId: currency._id,
                    txId,
                });
            } catch (err: any) {
                console.error("Transfer error:", err);
                setJoining(false);
                return;
            }
        } else {
            if (plannedBet) {
                savedTarget.current = 0;
                setPlannedBet(false);
            } else if (!autoBetEnabled) {
                savedTarget.current = Math.round(tgt * 100);
                setBetSaveAmount(Math.floor(amount));
                setPlannedBet(true);
            }
        }
    };

    // Switch to auto betting
    const handleAutoBetChange = (value: any) => {
        setAutoBetEnabled(value);
        setPlannedBet(false);
    };

    // Emit bet cashout
    const clickCashout = () => {
        const socket = crashSocket;
        if (!socket) return;
        socket.emit("bet-cashout");
    };

    // handle target value
    const onTargetChange = (value: any) => {
        setTarget(value);
    };

    useEffect(() => {
        if (!crashSocket) return;
        // const { playAudio } = useAudio();
        // Add new player to the current game
        const addNewPlayer = (player: any) => {
            setPlayers((state) => [...state, player]);
        };

        // New round is starting handler
        const onGameStarting = (data: any) => {
            // Update state
            setGameId(data?._id);
            setStartTime(
                new Date(Date.now() + new Date(data.timeUntilStart).valueOf())
            );
            setGameState(GAME_STATES.Starting);
            setPrivateSeed("");
            setPublicSeed(data.publicSeed);
            setPrivateHash(data.privateHash);
            setPayout(1);
            setPlayers([]);

            setCrashed(false);

            /// auto betting
            if (autoBetEnabled) {
                console.log(savedTarget.current, savebetAmount);
                // check stop on profit amount
                if (stopProfitA !== 0 && stopOnProfit.current <= 0) {
                    setAutoBetEnabled(false);
                    return;
                }
                // check stop on loss amount
                if (
                    stopLossA !== 0 &&
                    stopOnLoss.current <= 0 &&
                    Math.abs(stopOnLoss.current) > Math.abs(stopOnProfit.current)
                ) {
                    setAutoBetEnabled(false);
                }

                setJoining(true);
                // Emit new bet event
                crashSocket.emit(
                    "join-game",
                    savedTarget.current,
                    savebetAmount,
                    currency._id
                );

                //Check the number of bets. If the number of bets is 0, it is infinite.

                if (betCountRef.current > 0) {
                    betCountRef.current--;
                    setAutoCount(betCountRef.current);
                    if (betCountRef.current === 0) {
                        setAutoBetEnabled(false);
                        savedTarget.current = 0;
                    }
                }
            } else if (plannedBet) {
                setJoining(true);

                // Emit new bet event
                crashSocket.emit(
                    "join-game",
                    savedTarget.current,
                    betAmount,
                    currency._id
                );
                savedTarget.current = 0;
                // Reset planned bet
                setPlannedBet(false);
            }
        };

        // New round started handler
        const onGameStart = (data: any) => {
            // Update state
            setStartTime(Date.now());
            setGameState(GAME_STATES.InProgress);
            setPublicSeed(data.publicSeed);
            setPrivateHash(data.privateHash);
            setCrashed(false);
        };

        // Current round ended handler
        const onGameEnd = ({ game }: any) => {
            setGameState(GAME_STATES.Over);
            setCrashed(true);
            setPayout(game.crashPoint);
            setPublicSeed(game.publicSeed);
            setPrivateSeed(game.privateSeed);
            setBetting(false);
            playSound("crash");
            
            // Check if user lost (was betting but didn't cash out)
            if (betting && !cashedOut && savebetAmount > 0) {
                toast.error(`Game crashed at ${game.crashPoint.toFixed(2)}x. You lost ${savebetAmount} QU`, { 
                    id: "game-crashed",
                    duration: 5000 
                });
                setBetAmount(0);
            }
            
            setCashedOut(false);
            addGameToHistory(game);
        };

        // Current round tick handler
        const onGameTick = (payoutData: any) => {
            if (gameState !== GAME_STATES.InProgress) return;
            setPayout(payoutData);
        };

        // Error event handler
        const joinError = (msg: string) => {
            console.log("game-join-error:", msg);
            setJoining(false);
            setBetting(false);
            if (msg === "You are not logged in!") {
                if (wallet?.publicKey) {
                    crashSocket.emit("auth", { publicId: wallet.publicKey });
                }
                toast.error("Please try again", { id: "join-error" });
            } else {
                toast.error(String(msg || "Bet failed"), { id: "join-error" });
            }
            playSound("error");
        };

        // Success event handler
        const joinSuccess = (bet: any) => {
            setJoining(false);
            setBetting(true);
            selfId.current = bet.playerID;
            setBetSaveAmount(Math.floor(Number(betAmount)));
            toast.success(`Bet placed! ${betAmount} QU`, { id: "join-success" });
            playSound("placebet");
            if (autoBetEnabled && stopLossA !== 0) {
                stopOnLoss.current -= bet.betAmount;
            }
        };

        // New game bets handler
        const onGameBets = (bets: any[]) => {
            bets.forEach((bet) => addNewPlayer(bet));
        };

        // New cashout handler
        const onBetCashout = (bet: any) => {
            if (
                autoBetEnabled &&
                bet[0].playerID === selfId.current &&
                stopProfitA !== 0
            ) {
                stopOnProfit.current -= bet[0].betAmount * bet[0].stoppedAt;
            }
            // Check if local user cashed out
            setCashedOut(true);
            // Update state
            if (bet[0]) {
                setPlayers((state) =>
                    state.map((player) =>
                        player.playerID === bet[0].playerID
                            ? Object.assign(player, bet[0])
                            : player
                    )
                );
            }
        };

        // Success event handler
        const onCashoutSuccess = async (data?: { payoutTxId?: string; winAmount?: number; multiplier?: number }) => {
            const winAmount = data?.winAmount || 0;
            const payoutTxId = data?.payoutTxId;
            
            // Reset betting state
            setTimeout(() => {
                setBetting(false);
            }, 500);

            // Confirm payout on-chain before showing success + updating balance
            if (payoutTxId && winAmount > 0) {
                const payoutToastId = "cashout-payout";
                toast.loading("Payout submitted. Waiting for confirmation...", { id: payoutToastId });

                setBalanceUpdatesPaused(true);
                const confirmed = await waitForTxConfirmation(payoutTxId, 30, 1000);

                if (confirmed) {
                    // Success sound only after confirmation
                    playSound("success");
                    setBalanceUpdatesPaused(false);
                    if (fetchBalance) {
                        await fetchBalance();
                    }
                    toast.success(
                        <div>
                            <div>You received {winAmount} QU!</div>
                            <a
                                href={`${QUBIC_EXPLORER_URL}${payoutTxId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline"
                            >
                                View Transaction
                            </a>
                        </div>,
                        { duration: 5000, id: payoutToastId }
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
                        { duration: 5000, id: payoutToastId, icon: "⏳" }
                    );

                    // Keep balance paused until confirmation arrives, then refresh
                    (async () => {
                        const confirmedLater = await waitForTxConfirmation(payoutTxId, 300, 1000);
                        if (confirmedLater) {
                            playSound("success");
                            setBalanceUpdatesPaused(false);
                            if (fetchBalance) {
                                await fetchBalance();
                            }
                            toast.success(
                                <div>
                                    <div>You received {winAmount} QU!</div>
                                    <a
                                        href={`${QUBIC_EXPLORER_URL}${payoutTxId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 underline"
                                    >
                                        View Transaction
                                    </a>
                                </div>,
                                { duration: 5000, id: payoutToastId }
                            );
                        }
                    })();
                }

                setTimeout(() => {
                    toast.success("Ready to play! Place your bet to start a new round.", {
                        duration: 4000,
                        id: confirmed ? "place-bet-again" : "place-bet-again-pending"
                    });
                }, 5500);

                setBetAmount(0);
            } else if (winAmount > 0) {
                // Missing payout txId - do not celebrate or update balance
                toast.error("Payout transaction missing. Please contact support.", { duration: 5000, id: "payout-missing" });
            }
        };

        // Error event handler
        const onCashoutError = (msg: string) => {
            toast.error(msg || "Cashout failed", { id: "cashout-error" });
            playSound("error");
        };

        const cancelError = () => { };

        const cancelSuccess = () => { };

        // Add game to history
        const addGameToHistory = (game: any) => {
            setHistory((state: any[]) =>
                state.length >= 6
                    ? [...state.slice(1, state.length), game]
                    : [...state, game]
            );
        };

        const onFetchGame = (schema: any) => {
            // Update state
            setGameId(schema._id);
            setPrivateHash(schema.privateHash);
            setPublicSeed(schema.publicSeed);
            setPlayers(schema.players);
            setStartTime(new Date(Date.now() - new Date(schema.elapsed).valueOf()));
            setHistory(schema.history.reverse().slice(0, 6));
            setGameState(schema.status);
        };
        // Listeners
        crashSocket.on("connect", () => {
            crashSocket.emit("games");
            // Send auth after connect
            if (wallet?.publicKey) {
                crashSocket.emit("auth", { publicId: wallet.publicKey });
            }
        });
        crashSocket.on("disconnect", () => {
            setJoining(false);
        });
        crashSocket.on("game-starting", onGameStarting);
        crashSocket.on("game-start", onGameStart);
        crashSocket.on("game-end", onGameEnd);
        crashSocket.on("game-tick", onGameTick);
        crashSocket.on("game-bets", onGameBets);
        crashSocket.on("bet-cashout", onBetCashout);
        crashSocket.on("game-join-error", joinError);
        crashSocket.on("game-join-success", joinSuccess);
        crashSocket.on("bet-cashout-error", onCashoutError);
        crashSocket.on("bet-cashout-success", onCashoutSuccess);
        crashSocket.on("game-cancel-error", cancelError);
        crashSocket.on("game-cancel-success", cancelSuccess);
        crashSocket.on("games", onFetchGame);

        return () => {
            // Remove Listeners
            crashSocket.off("game-starting", onGameStarting);
            crashSocket.off("game-start", onGameStart);
            crashSocket.off("game-end", onGameEnd);
            crashSocket.off("game-tick", onGameTick);
            crashSocket.off("game-bets", onGameBets);
            crashSocket.off("bet-cashout", onBetCashout);
            crashSocket.off("game-join-error", joinError);
            crashSocket.off("game-join-success", joinSuccess);
            crashSocket.off("game-cancel-error", cancelError);
            crashSocket.off("game-cancel-success", cancelSuccess);

            crashSocket.off("bet-cashout-error", onCashoutError);
            crashSocket.off("bet-cashout-success", onCashoutSuccess);

            crashSocket.off("connect");
            crashSocket.off("disconnect");
            crashSocket.off("games", onFetchGame);
        };
    }, [
        crashSocket,
        gameState,
        startTime,
        plannedBet,
        autoBetEnabled,
        autoCashoutEnabled,
        betAmount,
        target,
        stopProfitA,
        stopLossA,
        autoBetCount,
        savebetAmount,
    ]);

    // Load currencies on mount
    useEffect(() => {
        let mounted = true;

        const loadCurrencies = async () => {
            try {
                // Default currency (QUBIC) - adjust API endpoint if available
                const defaultCurrency = {
                    _id: "QU",
                    symbol: "QU",
                    price: 1,
                    icon: "/assets/image/Qubic-Logo-White.svg"
                };

                if (!mounted) return;

                setCurrencies([defaultCurrency]);
                setCurrency(defaultCurrency);
            } catch (e) {
                console.error("Failed to load currencies:", e);
                // Fallback to default currency even on error
                const defaultCurrency = {
                    _id: "QU",
                    symbol: "QU",
                    price: 1,
                    icon: "/assets/image/Qubic-Logo-White.svg"
                };
                if (mounted) {
                    setCurrencies([defaultCurrency]);
                    setCurrency(defaultCurrency);
                }
            }
        };

        loadCurrencies();

        return () => {
            mounted = false;
        };
    }, []);

    // Send auth when wallet is available
    useEffect(() => {
        if (!crashSocket || !wallet?.publicKey) return;
        if (crashSocket.connected) {
            crashSocket.emit("auth", { publicId: wallet.publicKey });
        } else {
            const onConnect = () => {
                crashSocket.emit("auth", { publicId: wallet.publicKey });
            };
            crashSocket.on("connect", onConnect);
            return () => {
                crashSocket.off("connect", onConnect);
            };
        }
    }, [crashSocket, wallet?.publicKey]);

    useEffect(() => {
        if (!crashSocket) return;
        crashSocket.emit("games");
    }, [crashSocket]);

    useEffect(() => {
        if (Number(betAmount) > 0) {
            setAmountInputFlag(true);
        }
    }, [betAmount]);

    const disabled = joining || betting || autoBetEnabled;
    const isAuto = activeTab === 1;

    const useAudio = () => {
        const errorAudioRef = useRef<HTMLAudioElement | null>(null);
        const placebetAudioRef = useRef<HTMLAudioElement | null>(null);
        const successAudioRef = useRef<HTMLAudioElement | null>(null);
        const crashAudioRef = useRef<HTMLAudioElement | null>(null);

        useEffect(() => {
            if (!AUDIO_ENABLED) return;
            if (typeof window === "undefined") return;
            
            errorAudioRef.current = new Audio("/assets/audio/error.wav");
            placebetAudioRef.current = new Audio("/assets/audio/placebet.wav");
            successAudioRef.current = new Audio("/assets/audio/success.wav");
            crashAudioRef.current = new Audio("/assets/audio/crash.wav");

            return () => {
                // Cleanup audio references
                if (errorAudioRef.current) {
                    errorAudioRef.current.pause();
                    errorAudioRef.current.src = "";
                    errorAudioRef.current = null;
                }
                if (placebetAudioRef.current) {
                    placebetAudioRef.current.pause();
                    placebetAudioRef.current.src = "";
                    placebetAudioRef.current = null;
                }
                if (successAudioRef.current) {
                    successAudioRef.current.pause();
                    successAudioRef.current.src = "";
                    successAudioRef.current = null;
                }
                if (crashAudioRef.current) {
                    crashAudioRef.current.pause();
                    crashAudioRef.current.src = "";
                    crashAudioRef.current = null;
                }
            };
        }, []);

        const playAudio = (key: string) => {
            if (!AUDIO_ENABLED) return;
            let audio: HTMLAudioElement | null = null;
            
            switch (key) {
                case "error":
                    audio = errorAudioRef.current;
                    break;
                case "placebet":
                    audio = placebetAudioRef.current;
                    break;
                case "success":
                    audio = successAudioRef.current;
                    break;
                case "crash":
                    audio = crashAudioRef.current;
                    break;
            }
            
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
                    // Silently handle autoplay errors - expected behavior
                });
            } catch (error) {
                // Silently handle errors
            }
        };

        return { playAudio };
    };

    const socketReady = !!crashSocket;

    return (
        <Layout>
            {!socketReady ? (
                <div className="flex w-full h-full items-center justify-center text-white">
                    Loading...
                </div>
            ) : (
            <div className="flex w-full justify-center h-full p-2 sm:p-4">
                <div className="w-full h-full flex justify-center max-w-[1400px]">
                    <div
                        className={` ${isMobile ? "flex flex-col items-center gap-4" : "flex gap-4"
                            } w-full`}
                    >
                        <div
                            className={`game-display w-full gap-2 ${isMobile ? "p-1 w-full" : "p-0"
                                } px-4 sm:px-0 ${isMobile ? "h-[300px] " : "min-h-[300px] "
                                } relative h-full overflow-hidden`}
                        >
                            <div className="absolute top-4 z-10 left-5 max-w-[70%]">
                                <div className="flex space-x-1 items-center">
                                    {history
                                        .slice(isMobile ? 3 : 0, 6)
                                        .map((item: any, key: number) => {
                                            const opacity = `opacity-${key + 4
                                                }0 hover:opacity-100 transition-all`;
                                            return (
                                                <div
                                                    key={key}
                                                    className={`text-stone-50 animate-zoomIn cursor-pointer `}
                                                    onClick={() => setGameVerifyId(item._id)}
                                                >
                                                    {item.crashPoint < 1.2 ? (
                                                        <div
                                                            className={`px-1 rounded-full overflow-hidden  ${opacity}`}
                                                        >
                                                            {parseCommasToThousands(
                                                                cutDecimalPoints(item.crashPoint.toFixed(2))
                                                            )}
                                                            x
                                                        </div>
                                                    ) : item.crashPoint >= 1.2 && item.crashPoint < 2 ? (
                                                        <div
                                                            className={` px-1 rounded-full overflow-hidden  ${opacity}`}
                                                        >
                                                            {" "}
                                                            {parseCommasToThousands(
                                                                cutDecimalPoints(item.crashPoint.toFixed(2))
                                                            )}
                                                            x
                                                        </div>
                                                    ) : item.crashPoint >= 2 && item.crashPoint < 100 ? (
                                                        <div
                                                            className={` px-1 rounded-full overflow-hidden ${opacity}`}
                                                        >
                                                            {parseCommasToThousands(
                                                                cutDecimalPoints(item.crashPoint.toFixed(2))
                                                            )}
                                                            x
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`px-1 rounded-full overflow-hidden  ${opacity}`}
                                                        >
                                                            {" "}
                                                            {parseCommasToThousands(
                                                                cutDecimalPoints(item.crashPoint.toFixed(2))
                                                            )}
                                                            x
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    {/* <FairnessView
                    gameId={"crash"}
                    privateSeed={privateSeed}
                    privateHash={privateHash}
                    publicSeed={publicSeed}
                  >
                    <div className="text-white">Fairness</div>
                  </FairnessView> */}
                                    <GameHistory Label={"crash"} setGameId={setGameVerifyId} />
                                </div>
                            </div>
                            <span className="absolute top-2.5 right-5 z-10 h-6 text-base crash-game-status text-stone-100">
                                <div className="flex items-center">
                                    <div className="p-2">
                                        <NetStatus payout={payout} />
                                    </div>
                                </div>
                            </span>
                            <GameCanvas
                                status={gameState}
                                payout={payout}
                                startTime={startTime}
                            />
                        </div>
                        {!isMobile && (
                            <div className="game-panel min-w-[300px] xl:min-w-[320px] min-h-[560px] flex flex-col justify-between">
                                <div className="game-panel-header">
                                    <div className="flex items-center gap-1.5">
                                        <span className="terminal-dot" style={{background:'#ff5f57'}}></span>
                                        <span className="terminal-dot" style={{background:'#febc2e'}}></span>
                                        <span className="terminal-dot" style={{background:'#28c840'}}></span>
                                    </div>
                                    <span className="text-xs font-mono text-cyan-400/80 tracking-wider">📈 CRASH</span>
                                </div>
                                <div className="game-panel-body gap-2 flex flex-col">
                                    <div className="flex items-center gap-4 mb-2 mt-1">
                                        <div className="flex-1 [&>div]:mt-0">
                                    <SwitchTab
                                        onChange={(e) => setActiveTab(e)}
                                        disabled={disabled}
                                        active={activeTab}
                                    />
                                        </div>
                                        <Button 
                                            onClick={() => setShowHelp(true)} 
                                            className="w-[36px] h-[36px] min-w-[36px] p-0 text-base font-bold text-white bg-cyan-400 hover:bg-cyan-300 rounded-full flex-shrink-0 flex items-center justify-center"
                                            title="Game Help"
                                        >
                                            ?
                                        </Button>
                                    </div>
                                    {isAuto && (
                                        <SwitchTab
                                            onChange={setSubActiveTab}
                                            disabled={false}
                                            active={subActiveTab}
                                            options={["Controls", "Leaderboard"]}
                                            type={"sub"}
                                        />
                                    )}
                                    {(!isAuto || subActiveTab !== 1) && (
                                        <>
                                            <AmountInput
                                                disabled={disabled}
                                                value={betAmount}
                                                onChange={setBetAmount}
                                                className={`${!amountInputFlag ? "animate-bounding2" : ""
                                                    }`}
                                            />
                                            <MultiPlierInput
                                                disabled={disabled}
                                                value={target}
                                                onChange={onTargetChange}
                                            />
                                        </>
                                    )}

                                    {isAuto && subActiveTab === 1 && (
                                        <CurrentBets bets={players} />
                                    )}
                                    {isAuto && subActiveTab !== 1 && (
                                        <>
                                            <BetNumberInput
                                                disabled={disabled}
                                                value={autoBetCount}
                                                onChange={setAutoCount}
                                                Icon={<InfinitySvg />}
                                            />
                                            <StopProfitAmount
                                                disabled={disabled}
                                                Label={"Stop on Profit"}
                                                onChange={setStopPorfitA}
                                                value={stopProfitA}
                                                Icon={<CurrencyIcon />}
                                            />
                                            <StopProfitAmount
                                                disabled={disabled}
                                                Label={"Loss on Profit"}
                                                onChange={setStopLossA}
                                                value={stopLossA}
                                                Icon={<CurrencyIcon />}
                                            />
                                        </>
                                    )}
                                    <ProfitAmount
                                        disabled={true}
                                        profit={payout * savebetAmount}
                                        multiplier={payout}
                                        icon={<CurrencyIcon />}
                                    />

                                    {isAuto ? (
                                        <Button className="bg-cyan-400 hover:bg-cyan-300 font-bold uppercase rounded-full px-8 py-4 text-black"
                                            disabled={
                                                (betting &&
                                                gameState !== GAME_STATES.InProgress &&
                                                !autoBetEnabled) || !currency?._id
                                            }
                                            onClick={() => {
                                                if (!betting) {
                                                    if (autoBetEnabled) {
                                                        handleAutoBetChange(false);
                                                    } else {
                                                        clickBet();
                                                        handleAutoBetChange(true);
                                                    }
                                                } else if (
                                                    gameState === GAME_STATES.InProgress &&
                                                    !cashedOut
                                                ) {
                                                    clickCashout();
                                                } else if (autoBetEnabled) {
                                                    handleAutoBetChange(false);
                                                }
                                            }}
                                        >
                                            {!currency?._id
                                                ? "LOADING..."
                                                : !betting
                                                    ? autoBetEnabled
                                                        ? "Stop Autobet"
                                                        : "Start Autobet"
                                                    : gameState === GAME_STATES.InProgress && !cashedOut
                                                        ? "CASHOUT"
                                                        : autoBetEnabled
                                                            ? "Stop Autobet"
                                                            : "Finishing Bet"}
                                        </Button>
                                    ) : (
                                        <Button
                                            className="bg-cyan-400 hover:bg-cyan-300 font-bold uppercase rounded-full px-8 py-4 text-black"
                                            disabled={joining || !currency?._id}
                                            onClick={() => {
                                                if (!betting) {
                                                    clickBet();
                                                } else if (
                                                    gameState === GAME_STATES.InProgress &&
                                                    !cashedOut
                                                ) {
                                                    clickCashout();
                                                }
                                            }}
                                        >
                                            {!currency?._id
                                                ? "LOADING..."
                                                : !betting
                                                    ? joining
                                                        ? "BETTING..."
                                                        : plannedBet
                                                            ? "CANCEL BET"
                                                            : "Place Bet (next round)"
                                                    : cashedOut
                                                        ? "CASHED OUT"
                                                        : "CASHOUT"}
                                        </Button>
                                    )}

                                    {!isAuto && <CurrentBets bets={players} />}
                                </div>
                            </div>
                        )}
                        {isMobile && (
                            <div className="game-panel w-full flex flex-col justify-between">
                                <div className="game-panel-header">
                                    <div className="flex items-center gap-1.5">
                                        <span className="terminal-dot" style={{background:'#ff5f57'}}></span>
                                        <span className="terminal-dot" style={{background:'#febc2e'}}></span>
                                        <span className="terminal-dot" style={{background:'#28c840'}}></span>
                                    </div>
                                    <span className="text-xs font-mono text-cyan-400/80 tracking-wider">📈 CRASH</span>
                                </div>
                                <div className="game-panel-body">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-white font-bold">CRASH</h3>
                                    <Button 
                                        onClick={() => setShowHelp(true)} 
                                        className="w-[36px] h-[36px] min-w-[36px] p-0 text-base font-bold text-white bg-cyan-400 hover:bg-cyan-300 rounded-full flex items-center justify-center"
                                        title="Game Help"
                                    >
                                        ?
                                    </Button>
                                </div>
                                {isAuto ? (
                                    <Button
                                        className="bg-cyan-400 hover:bg-cyan-300 font-bold uppercase rounded-full px-8 py-4 text-black"
                                        disabled={
                                            (betting &&
                                            gameState !== GAME_STATES.InProgress &&
                                            !autoBetEnabled) || !currency?._id
                                        }
                                        onClick={() => {
                                            if (!betting) {
                                                if (autoBetEnabled) {
                                                    handleAutoBetChange(false);
                                                } else {
                                                    clickBet();
                                                    handleAutoBetChange(true);
                                                }
                                            } else if (
                                                gameState === GAME_STATES.InProgress &&
                                                !cashedOut
                                            ) {
                                                clickCashout();
                                            } else if (autoBetEnabled) {
                                                handleAutoBetChange(false);
                                            }
                                        }}
                                    >
                                        {!currency?._id
                                            ? "LOADING..."
                                            : !betting
                                                ? autoBetEnabled
                                                    ? "Stop Autobet"
                                                    : "Start Autobet"
                                                : gameState === GAME_STATES.InProgress && !cashedOut
                                                    ? "CASHOUT"
                                                    : autoBetEnabled
                                                        ? "Stop Autobet"
                                                        : "Finishing Bet"}
                                    </Button>
                                ) : (
                                    <Button
                                        className="bg-cyan-400 hover:bg-cyan-300 font-bold uppercase rounded-full px-8 py-4 text-black"
                                        disabled={joining || !currency?._id}
                                        onClick={() => {
                                            if (!betting) {
                                                clickBet();
                                            } else if (
                                                gameState === GAME_STATES.InProgress &&
                                                !cashedOut
                                            ) {
                                                clickCashout();
                                            }
                                        }}
                                    >
                                        {!currency?._id
                                            ? "LOADING..."
                                            : !betting
                                                ? joining
                                                    ? "BETTING..."
                                                    : plannedBet
                                                        ? "CANCEL BET"
                                                        : "Place Bet (next round)"
                                                : cashedOut
                                                    ? "CASHED OUT"
                                                    : "CASHOUT"}
                                    </Button>
                                )}
                                {(!isAuto || subActiveTab !== 1) && (
                                    <>
                                        <AmountInput
                                            disabled={disabled}
                                            value={betAmount}
                                            onChange={setBetAmount}
                                        />
                                        <MultiPlierInput
                                            disabled={disabled}
                                            value={target}
                                            onChange={onTargetChange}
                                        />
                                    </>
                                )}
                                {(!isAuto || subActiveTab === 1) && (
                                    <CurrentBets bets={players} />
                                )}
                                {isAuto && subActiveTab !== 1 && (
                                    <>
                                        <BetNumberInput
                                            disabled={disabled}
                                            value={autoBetCount}
                                            onChange={setAutoCount}
                                            Icon={<SelectedPaymentIcon currency={currency} />}
                                        />
                                        <StopProfitAmount
                                            disabled={disabled}
                                            Label={"Stop on Profit"}
                                            onChange={setStopPorfitA}
                                            value={stopProfitA}
                                            Icon={<CurrencyIcon />}
                                        />
                                        <StopProfitAmount
                                            disabled={disabled}
                                            Label={"Loss on Profit"}
                                            onChange={setStopLossA}
                                            value={stopLossA}
                                            Icon={<CurrencyIcon />}
                                        />
                                    </>
                                )}
                                <ProfitAmount
                                    multiplier={payout}
                                    disabled={true}
                                    profit={payout * savebetAmount}
                                    icon={<CurrencyIcon />}
                                />
                                {isAuto && (
                                    <SwitchTab
                                        onChange={setSubActiveTab}
                                        disabled={false}
                                        active={subActiveTab}
                                        options={["Controls", "Leaderboard"]}
                                        type={"sub"}
                                    />
                                )}
                                <SwitchTab
                                    onChange={setActiveTab}
                                    disabled={disabled}
                                    active={activeTab}
                                />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <VerifyModal
                    Label={"crash"}
                    gameId={verifyId}
                    setGameId={() => setGameVerifyId("")}
                />
                <GameGuide isOpen={showHelp} onClose={() => setShowHelp(false)} gameName="crash" />
            </div>
            )}
        </Layout>
    );
};

export default CrashGame;

const parseCommasToThousands = (value: number) =>
    value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const cutDecimalPoints = (num: any) =>
    num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

const NetStatus = ({ payout }: { payout: number }) => {
    const [netStatus, setNetStatus] = useState(false);

    useEffect(() => {
        setNetStatus(true);
        const timer = setTimeout(() => setNetStatus(false), 500);
        return () => {
            clearTimeout(timer);
        };
    }, [payout]);

    return (
        <div
            className={`w-[10px] h-[10px] rounded-full  bg-cyan-400 ${netStatus ? " animate-zoom " : ""
                }`}
        />
    );
};
