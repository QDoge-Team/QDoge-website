'use client'
import AmountInput from "@/components/AmountInput";
import ResultModal from "@/components/ResultModal";
import CelebrationAnimations from "@/components/Mine/CelebrationAnimations";
import useIsMobile from "@/hooks/useIsMobile";
import Layout from "@/layout/layout";
import axiosServices from "@/util/axios";
import formatAmount from "@/util/formatAmount";
import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import { CASINO_OWNER_PUBLIC_ID, QUBIC_EXPLORER_URL } from "@/config";
import toast from "react-hot-toast";
import GameGuide from "@/components/GameGuide";



type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
type Card = {
    rank: string;
    suit: 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades' | string;
} | undefined;
const suits = {
    "Hearts": {
        color: "#e9113c",
        icon: <svg fill="currentColor" viewBox="0 0 64 64" > <title></title> <path fillRule="evenodd" clipRule="evenodd" d="M30.907 55.396.457 24.946v.002A1.554 1.554 0 0 1 0 23.843c0-.432.174-.82.458-1.104l14.13-14.13a1.554 1.554 0 0 1 1.104-.458c.432 0 .821.175 1.104.458l14.111 14.13c.272.272.645.443 1.058.453l.1-.013h.004a1.551 1.551 0 0 0 1.045-.452l14.09-14.09a1.554 1.554 0 0 1 1.104-.457c.432 0 .82.174 1.104.457l14.13 14.121a1.557 1.557 0 0 1 0 2.209L33.114 55.396v-.002c-.27.268-.637.438-1.046.452v.001h.003a.712.712 0 0 1-.04.002h-.029c-.427 0-.815-.173-1.095-.453Z"></path></svg>
    },
    "Diamonds": {
        color: "#e9113c",
        icon: <svg fill="currentColor" viewBox="0 0 64 64"> <title></title> <path fillRule="evenodd" clipRule="evenodd" d="m37.036 2.1 24.875 24.865a7.098 7.098 0 0 1 2.09 5.04c0 1.969-.799 3.75-2.09 5.04L37.034 61.909a7.076 7.076 0 0 1-5.018 2.078c-.086 0-.174 0-.25-.004v.004h-.01a7.067 7.067 0 0 1-4.79-2.072L2.089 37.05A7.098 7.098 0 0 1 0 32.009c0-1.97.798-3.75 2.09-5.04L26.965 2.102v.002A7.07 7.07 0 0 1 31.754.02l.002-.004h-.012c.088-.002.176-.004.264-.004A7.08 7.08 0 0 1 37.036 2.1Z"></path></svg>
    },
    "Clubs": {
        color: "#6b7280",
        icon: <svg fill="currentColor" viewBox="0 0 64 64"> <title></title> <path fillRule="evenodd" clipRule="evenodd" d="M63.256 30.626 33.082.452A1.526 1.526 0 0 0 31.994 0c-.024 0-.048 0-.072.002h.004v.002a1.53 1.53 0 0 0-1.034.45V.452L.741 30.604a1.54 1.54 0 0 0-.45 1.09c0 .426.172.81.45 1.09l14.002 14.002c.28.278.663.45 1.09.45.426 0 .81-.172 1.09-.45l13.97-13.97a1.53 1.53 0 0 1 1.031-.45h.002l.027-.001.031-.001c.424 0 .81.172 1.088.452l14.002 14.002c.28.278.664.45 1.09.45.426 0 .81-.172 1.09-.45l14.002-14.002a1.546 1.546 0 0 0 0-2.192v.002ZM45.663 64H18.185a.982.982 0 0 1-.692-1.678L31.23 48.587h-.002a.986.986 0 0 1 .694-.285h.002v.047l.01-.047a.98.98 0 0 1 .686.285l13.736 13.736A.982.982 0 0 1 45.663 64Z"></path></svg>
    },
    "Spades": {
        color: "#6b7280",
        icon: <svg fill="currentColor" viewBox="0 0 64 64" > <title></title> <path d="M14.022 50.698.398 36.438A1.47 1.47 0 0 1 0 35.427c0-.395.152-.751.398-1.012l13.624-14.268c.249-.257.59-.417.967-.417.378 0 .718.16.967.417l13.625 14.268c.245.26.397.617.397 1.012 0 .396-.152.752-.397 1.013L15.957 50.698c-.25.257-.59.416-.968.416s-.718-.16-.967-.416Zm34.022 0L34.41 36.438a1.471 1.471 0 0 1-.398-1.012c0-.395.152-.751.398-1.012l13.633-14.268c.248-.257.589-.417.967-.417s.718.16.967.417l13.624 14.268c.246.26.398.617.398 1.012 0 .396-.152.752-.398 1.013L49.978 50.698c-.249.257-.59.416-.967.416-.378 0-.719-.16-.968-.416ZM44.541 62h.01c.685 0 1.239-.58 1.239-1.296 0-.36-.14-.686-.367-.92L32.871 46.657a1.206 1.206 0 0 0-.871-.375h-.04L27.335 62h17.207ZM32.963 32.965l13.624-14.25a1.47 1.47 0 0 0 .398-1.012 1.47 1.47 0 0 0-.398-1.013L32.963 2.422a1.334 1.334 0 0 0-.97-.422h-.03L26.51 16.229l5.455 17.156h.03c.38 0 .72-.16.968-.42Z"></path><path d="M31.028 2.424 17.404 16.683c-.245.26-.397.616-.397 1.012s.152.752.397 1.012l13.624 14.26c.24.253.568.412.934.421L31.963 2a1.33 1.33 0 0 0-.935.424Zm-12.45 57.36c-.228.234-.368.56-.368.92 0 .717.554 1.296 1.238 1.296h12.515l-.002-15.718c-.33.008-.625.15-.841.375L18.576 59.784Z"></path></svg>
    }
}





const payouts = [
    { id: "royal_flush", multiplier: 800, name: "Royal Flush" },
    { id: "straight_flush", multiplier: 60, name: "Straight Flush" },
    { id: "4_of_a_kind", multiplier: 22, name: "4 of a Kind" },
    { id: "full_house", multiplier: 9, name: "Full House" },
    { id: "flush", multiplier: 6, name: "Flush" },
    { id: "straight", multiplier: 4, name: "Straight" },
    { id: "3_of_a_kind", multiplier: 3, name: "3 of a Kind" },
    { id: "2_pair", multiplier: 2, name: "2 Pair" },
    { id: "pair", multiplier: 1, name: "Pair of Jacks" },
];

// Utility functions for deck operations
const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const VideoPoker = () => {
    const { wallet, connected, transfer, fetchBalance, walletBalances, waitForTxConfirmation } = useQubicConnect();
    const isMobile = useIsMobile();
    const [betAmount, setBetAmount] = useState<number>(0);
    const [dealing, setDealing] = useState(false);
    const [cards, setCards] = useState<Card[]>([undefined, undefined, undefined, undefined, undefined]);
    const [holds, setHolds] = useState<number[]>([]);
    const [gamestart, setStart] = useState(false);
    const [loading, setLoading] = useState(false);

    const [privateHash, setPrivateHash] = useState("");
    const [privateSeed, setPrivateSeed] = useState("");
    const [publicSeed, setPublicSeed] = useState("");
    const [gameId, setGameId] = useState<number | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [lastPayoutAmount, setLastPayoutAmount] = useState(0);
    const [lastMultiplier, setLastMultiplier] = useState(0);

    const handleDeal = async () => {
        if (loading || !connected || !wallet?.publicKey) return;
        
        setLoading(true);
        playAudio("bet");
        
        if (!dealing) {
            // Initial deal: Transfer first, then init
            const amountInt = Math.floor(betAmount);
            if (amountInt <= 0) {
                toast.error("Invalid bet amount");
                setLoading(false);
                return;
            }

            // Check if amount exceeds balance
            const walletBalance = walletBalances?.qubic || 0;
            if (amountInt > walletBalance) {
                toast.error(`Cannot bet! Amount exceeds your balance of ${walletBalance} QU. Please reduce the amount.`);
                setLoading(false);
                return;
            }

            try {
                // First, transfer funds to casino owner (Mines-style)
                let txId: string | null = null;
                try {
                    const transferResult = await transfer(CASINO_OWNER_PUBLIC_ID, amountInt);
                    txId = transferResult.txId;
                } catch (transferError: any) {
                    console.error("Transfer error:", transferError);
                    toast.error(`Transfer failed: ${transferError?.message || "Unknown error"}`, { id: "transfer" });
                    setLoading(false);
                    return;
                }

                // Reset last payout display for new round
                setLastPayoutAmount(0);
                setLastMultiplier(0);

                // Then create the game with the transaction ID
                const { data } = await axiosServices.post("/video-poker/init", {
                    publicKey: wallet.publicKey,
                    betAmount: amountInt,
                    txId: txId
                });
                
                setGameId(data.gameId);
                setStart(true);
                setHolds([]);
                setCards(Array(5).fill(undefined));
                setPrivateHash(data.privateSeedHash);
                setPublicSeed(data.publicSeed);
                setTimeout(() => {
                    setCards(data.hand);
                    setLoading(false);
                    playAudio("dealing");
                    // Notify user that bet was placed successfully
                    toast.success(`Bet placed! ${amountInt} QU`, {
                        duration: 3000,
                        icon: "🎰",
                    });
                }, 400);
            } catch (error: any) {
                console.error("Init error:", error);
                toast.error(error?.response?.data?.error || "Failed to initialize game");
                setGameId(null);
                setDealing(false);
                setLoading(false);
            }
        } else {
            // Draw: Call draw endpoint and poll balance if payout > 0
            if (!gameId) {
                toast.error("No active game. Please Bet first.");
                setLoading(false);
                setDealing(false);
                return;
            }
            
            try {
                const { data } = await axiosServices.post("/video-poker/draw", {
                    publicKey: wallet.publicKey,
                    gameId,
                    holdIndexes: holds
                });
                
                const result = data.result;
                const payoutAmount = data.payoutAmount || 0;
                const multiplier = data.multiplier || 0;
                setLastPayoutAmount(payoutAmount);
                setLastMultiplier(multiplier);
                setPrivateSeed(data.privateSeed);
                
                // Animate card reveals
                let c = 0;
                for (let i = 0; i < data.hand.length + 1; i++) {
                    setTimeout(() => {
                        setCards(data.hand.map((card: Card, index: number) => {
                            if (index < i || holds.includes(index)) {
                                return card;
                            }
                            return undefined;
                        }));

                        if (i == data.hand.length) {
                            setHolds([]);
                            setStart(false);
                            setLoading(false);
                        }
                        playAudio("dealing");
                    }, 300 * c);
                    if (!holds.includes(i)) {
                        c++;
                    }
                }

                // Confirm payout on-chain before showing success + updating balance
                if (payoutAmount > 0 && data.payoutTxId) {
                    setShowCelebration(true); // Show celebration animations

                    toast.loading("Payout submitted. Waiting for confirmation...", { id: "poker-payout" });

                    const confirmed = await waitForTxConfirmation(data.payoutTxId, 30, 1000);

                    setShowCelebration(false);
                    toast.dismiss("poker-payout");

                    // Find the hand name for better user feedback
                    const handName = payouts.find(p => p.id === result)?.name || "Winning Hand";

                    if (confirmed) {
                        if (fetchBalance) {
                            await fetchBalance();
                        }
                        toast.success(
                            <div>
                                <div className="font-bold">🎉 You Win! {handName}</div>
                                <div className="text-sm mt-1">Payout: {payoutAmount} QU ({multiplier}x multiplier)</div>
                                <a
                                    href={`${QUBIC_EXPLORER_URL}${data.payoutTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline text-sm mt-1 block"
                                >
                                    View Transaction
                                </a>
                            </div>,
                            { duration: 8000 }
                        );
                    } else {
                        toast(
                            <div>
                                <div>Payout submitted (pending confirmation)</div>
                                <div className="text-sm mt-1">{handName} • {payoutAmount} QU</div>
                                <a
                                    href={`${QUBIC_EXPLORER_URL}${data.payoutTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline text-sm mt-1 block"
                                >
                                    View Transaction
                                </a>
                            </div>,
                            { duration: 8000, icon: "⏳" }
                        );
                    }

                    // Reset states after payout flow resolves
                    setTimeout(() => {
                        setBetAmount(0);
                        setCards(Array(5).fill(undefined)); // Reset cards to closed status
                        setHolds([]); // Reset holds
                        setStart(false); // Reset game start state
                    }, 1000);
                } else {
                    // No payout - user lost (no_win scenario)
                    setLastPayoutAmount(0);
                    setLastMultiplier(0);
                    // Show loss notification after card animation completes
                    setTimeout(() => {
                        const handName = payouts.find(p => p.id === result)?.name || "No Winning Hand";
                        toast.error(
                            <div>
                                <div>No win this round</div>
                                <div className="text-xs text-gray-300 mt-1">Result: {handName}</div>
                            </div>,
                            {
                                duration: 4000,
                                icon: "😔",
                                style: {
                                    background: '#1a1a1a',
                                    color: '#fff',
                                    border: '2px solid #ff4444',
                                },
                            }
                        );
                        setBetAmount(0);
                    }, 2000);
                }
            } catch (error: any) {
                console.error("Draw error:", error);
                toast.error(error?.response?.data?.error || "Failed to draw cards");
                setHolds([]);
                setStart(false);
                setGameId(null);
                setLoading(false);
            }
        }
        setDealing(!dealing);
    };

    const handleHolder = (index: number) => {
        const i = holds.findIndex((i) => i === index);
        if (i === -1) {
            setHolds([...holds, index])
        } else {
            setHolds([...holds.filter((h) => h !== index)])
        }
    }
    const { ranking, winningCards } = evaluateHand(cards);
    const disabled = dealing || loading;

    useEffect(() => {
        const fetchDatas = async () => {
            // ✅ Guard: prevent 400 when wallet not ready
            if (!wallet?.publicKey || !connected) {
                return;
            }

            setLoading(true);
            try {
                const { data } = await axiosServices.post("/video-poker/fetchgame", {
                    publicKey: wallet.publicKey // ✅ MUST be full 60-char key, not shortened
                }, {
                    headers: {
                        'x-public-id': wallet.publicKey
                    }
                });
                
                // ✅ Normal: nothing to resume (no active game)
                if (!data?.hasGame) {
                    setLoading(false);
                    return;
                }
                
                // ✅ Has active game: resume it
                if (data.hand && Array.isArray(data.hand) && data.hand.length > 0) {
                    setStart(true);
                    setHolds([]);
                    setCards(Array(5).fill(undefined));
                    setPrivateHash(data.privateSeedHash || "");
                    setPublicSeed(data.publicSeed || "");
                    setTimeout(() => {
                        setCards(data.hand);
                        setLoading(false);
                    }, 400);
                } else {
                    setLoading(false);
                }
            } catch (error: any) {
                // Network errors (backend unreachable) — log as warning, not error
                const isNetworkError =
                    !error?.response &&
                    (error?.message === "Network Error" || error?.code === "ERR_NETWORK");

                if (isNetworkError) {
                    console.warn("fetchgame: backend unreachable, skipping game resume check");
                } else {
                    console.warn("fetchgame failed:", error?.response?.status, error?.response?.data);
                }
                setLoading(false);
            }
        }
        fetchDatas();
    }, [wallet?.publicKey, connected]) // ✅ Re-run when wallet connects


    let currentpayout = payouts.find((payout, index) => {
        return !dealing && payout.id === ranking;
    })

    const AUDIO_ENABLED = false;
    const betAudioRef = useRef<HTMLAudioElement | null>(null);
    const dealingAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!AUDIO_ENABLED) return;
        if (typeof window === "undefined") return;
        
        // These will only run in the browser
        betAudioRef.current = new Audio("/assets/audio/bet.DUx2OBl3.mp3");
        dealingAudioRef.current = new Audio("/assets/audio/flip.xdzctLJY.mp3");
        
        return () => {
            // Cleanup audio references
            if (betAudioRef.current) {
                betAudioRef.current.pause();
                betAudioRef.current.src = "";
                betAudioRef.current = null;
            }
            if (dealingAudioRef.current) {
                dealingAudioRef.current.pause();
                dealingAudioRef.current.src = "";
                dealingAudioRef.current = null;
            }
        };
    }, []);

    const playAudio = (key: string) => {
        if (!AUDIO_ENABLED) return;
        try {
            if (key === "bet") {
                if (betAudioRef.current) {
                    if (betAudioRef.current.currentTime > 0) {
                        betAudioRef.current.currentTime = 0;
                    }
                    betAudioRef.current.play().catch(() => {
                        // Silently handle autoplay errors
                    });
                }
            } else if (key === "dealing") {
                if (dealingAudioRef.current) {
                    if (dealingAudioRef.current.currentTime > 0) {
                        dealingAudioRef.current.currentTime = 0;
                    }
                    dealingAudioRef.current.play().catch(() => {
                        // Silently handle autoplay errors
                    });
                }
            }
        } catch (error) {
            // Silently handle errors
        }
    };
    
    return (
        <Layout>
            {/* ═══ Main scrollable content area ═══ */}
            <div
                className="flex flex-col lg:flex-row w-full max-w-[1200px] mx-auto gap-4 p-2 sm:p-4"
                style={{ paddingBottom: isMobile ? 140 : 16 }}
            >
                {/* ─── Game Display: payout table + deal button + cards ─── */}
                <div
                    className="game-display flex-1 flex items-center justify-center w-full p-4 md:p-6 relative overflow-hidden"
                    style={{ minHeight: isMobile ? 320 : 300 }}
                >
                    <CelebrationAnimations
                        visible={showCelebration}
                        onComplete={() => setShowCelebration(false)}
                    />

                    <div className="flex flex-col py-2 md:px-10 w-full md:w-auto">
                        <PayoutTable ranking={ranking} betAmount={betAmount} dealing={dealing} />

                        <div className="flex justify-center">
                            <Button
                                onPress={handleDeal}
                                disabled={loading}
                                color="default"
                                className="synthwave-laser-button synthwave-laser-button--small mt-5 px-8 py-4 text-black"
                            >
                                {dealing ? "Deal" : "Bet Again"}
                            </Button>
                        </div>

                        <VideoPokerGameScreen
                            cards={cards}
                            holds={holds}
                            onSelect={handleHolder}
                            dealing={dealing}
                            gamestart={gamestart}
                            winningCards={winningCards}
                        />
                    </div>

                    <ResultModal
                        visible={!gamestart && winningCards.length > 0 && ranking !== ""}
                        data={{
                            odds: lastMultiplier || currentpayout?.multiplier || 0,
                            profit: lastPayoutAmount,
                            coin: "",
                        }}
                        Currency={""}
                    />
                </div>

                {/* ─── DESKTOP: Side bet panel (static, in-flow) ─── */}
                {!isMobile && (
                    <div className="game-panel min-w-[280px] xl:min-w-[300px] flex flex-col justify-between shrink-0">
                        <div className="game-panel-header">
                            <div className="flex items-center gap-1.5">
                                <span className="terminal-dot" style={{ background: '#ff5f57' }} />
                                <span className="terminal-dot" style={{ background: '#febc2e' }} />
                                <span className="terminal-dot" style={{ background: '#28c840' }} />
                            </div>
                            <span className="text-xs font-mono text-cyan-400/80 tracking-wider">🂠 POKER</span>
                        </div>
                        <div className="game-panel-body flex flex-col gap-4">
                            <div className="flex items-center gap-4 mt-1">
                                <div className="flex-1">
                                    <AmountInput value={betAmount} onChange={setBetAmount} disabled={disabled} />
                                </div>
                                <Button
                                    onClick={() => setShowHelp(true)}
                                    className="w-[36px] h-[36px] min-w-[36px] p-0 text-base font-bold text-white bg-cyan-400 hover:bg-cyan-300 rounded-full shrink-0 flex items-center justify-center"
                                    title="Game Help"
                                >
                                    ?
                                </Button>
                            </div>
                            <Button disabled={disabled} onPress={handleDeal} color="success" className="slide-bet-button">
                                Bet
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ MOBILE: Fixed bottom bet bar — always visible, never hidden ═══ */}
            {isMobile && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: 'linear-gradient(to top, rgba(5,10,20,1) 70%, rgba(5,10,20,0.95) 85%, transparent)',
                        borderTop: '1px solid rgba(0,243,255,0.12)',
                        padding: '16px 16px env(safe-area-inset-bottom, 12px)',
                    }}
                >
                    <div className="flex flex-col gap-3 max-w-[500px] mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <AmountInput value={betAmount} onChange={setBetAmount} disabled={disabled} />
                            </div>
                            <Button
                                onClick={() => setShowHelp(true)}
                                className="w-[36px] h-[36px] min-w-[36px] p-0 text-base font-bold text-white bg-cyan-400 hover:bg-cyan-300 rounded-full shrink-0 flex items-center justify-center"
                                title="Game Help"
                            >
                                ?
                            </Button>
                        </div>
                        <Button
                            disabled={disabled}
                            onPress={handleDeal}
                            color="success"
                            className="w-full rounded-full uppercase font-bold py-4 text-black text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #00f3ff 0%, #00d4e0 100%)',
                                boxShadow: '0 0 20px rgba(0,243,255,0.3)',
                            }}
                        >
                            Bet
                        </Button>
                    </div>
                </div>
            )}

            <GameGuide isOpen={showHelp} onClose={() => setShowHelp(false)} gameName="videopoker" />
        </Layout>
    )
}


export default VideoPoker;



const PayoutTable = ({ ranking, betAmount, dealing }: { ranking: string, betAmount: number, dealing: boolean }) => {
    const isMobile = useIsMobile();
    return (
        <div className="mx-auto bg-sider_panel text-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4">
                <div className="min-w-full">
                    {payouts.map((payout, index) => {
                        let iswinning = !dealing && payout.id === ranking;
                        const wincolor = "#00f3ff";
                        return (
                            <div key={index} className="mt-1  items-center grid uppercase font-bold" style={{
                                gridTemplateColumns: isMobile ? '5fr 2fr' : '5fr 2fr 1fr 2fr'
                            }}>
                                <div className={`py-1 px-4 ${iswinning ? `bg-[${wincolor}]` : "bg-panel"} rounded-l-sm `}>{payout.name}</div>
                                <div className={`py-1 px-4 text-center rounded-r-sm ${iswinning ? `bg-[${wincolor}]` : "bg-black/60"}`}>{payout.multiplier}x</div>
                                {!isMobile && <div className="flex justify-center ">
                                    {iswinning && <div className="w-5 h-5 text-[#071e2c]">
                                        <svg fill="currentColor" viewBox="0 0 64 64" > <title></title> <path fillRule="evenodd" clipRule="evenodd" d="m37.036 2.1 24.875 24.865a7.098 7.098 0 0 1 2.09 5.04c0 1.969-.799 3.75-2.09 5.04L37.034 61.909a7.076 7.076 0 0 1-5.018 2.078c-.086 0-.174 0-.25-.004v.004h-.01a7.067 7.067 0 0 1-4.79-2.072L2.089 37.05A7.098 7.098 0 0 1 0 32.009c0-1.97.798-3.75 2.09-5.04L26.965 2.102v.002A7.07 7.07 0 0 1 31.754.02l.002-.004h-.012c.088-.002.176-.004.264-.004A7.08 7.08 0 0 1 37.036 2.1Z"></path></svg>
                                    </div>}
                                </div>}
                                {!isMobile &&
                                    <div className={`py-1 px-4 text-right ${iswinning ? `bg-[${wincolor}]` : "bg-panel"} rounded-sm`}>{formatAmount(betAmount * payout.multiplier)} <span className="text-blue-400">💰</span></div>
                                }
                            </div>)
                    })}
                </div>
            </div>
        </div>
    );
};


const VideoPokerGameScreen = ({ dealing, cards, holds, onSelect, gamestart, winningCards }: { dealing: boolean, cards: Card[], holds: number[], onSelect: (index: number) => void, gamestart: boolean, winningCards: Card[] }) => {
    return (
        <div className="flex justify-between my-4">
            {cards.map((card, index) => {
                let isHold = false;
                let isHide = true;
                let Icon: any = "";
                let Color = "";
                if (card) {
                    isHide = false;
                    Icon = suits[card.suit as Suit]?.icon;
                    Color = suits[card.suit as Suit]?.color;
                }
                if (holds.findIndex((i) => i == index) !== -1) isHold = true;
                const isWinningCard = !dealing && winningCards.some(winningCard => winningCard?.rank === card?.rank && winningCard?.suit === card?.suit);
                return (
                    <div
                        key={index}
                        className="relative w-[15%] mx-1 cursor-pointer"
                        onClick={() => dealing && onSelect(index)}
                        style={{
                            transformStyle: 'preserve-3d',
                            perspective: '1000px',
                            aspectRatio: '2 / 3',
                        }}
                    >
                        {/* Card Container */}
                        <div
                            className={`w-full h-full flex items-center justify-center rounded-lg shadow-md  transition-transform duration-500 ease-in-out ${isHide ? 'transform rotate-y-180' : ''
                                }`}
                            style={{ position: 'relative', transformStyle: 'preserve-3d' }}
                        >
                            {/* Card Front */}
                            <div
                                className={`absolute inset-0 flex items-center justify-center ${!isWinningCard && !dealing && !gamestart ? "opacity-65" : ""} bg-white rounded-lg shadow-md backface-hidden transition-all duration-500 `}
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: isHide ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    boxShadow: isWinningCard ? "0 0 0 .3em #00f3ff" : isHold ? "0 0 0 .3em #bc13fe" : ""
                                }}
                            >
                                <div className={`flex-col h-full w-full md:p-2 p-1 `} style={{ color: Color }}>
                                    <span className="font-bold md:text-[2.2em]">{card?.rank}</span>
                                    <div className="w-1/2">
                                        {Icon}
                                    </div>
                                </div>

                                {isHold && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">< div className="px-1 rounded-lg bg-green-400 text-sm text-white animate-zoomIn">hold</div></div>}
                            </div>

                            {/* Card Back */}
                            <div
                                className={`absolute inset-0 w-full h-full flex items-center justify-center bg-cover bg-center rounded-lg shadow-md transition-transform duration-500 border-2`}
                                style={{
                                    backfaceVisibility: 'hidden',
                                    backgroundImage: "url('/assets/image/card.png')",
                                    backgroundColor: "#0f5f2b",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "cover",
                                    transform: isHide ? 'rotateY(0deg)' : 'rotateY(180deg)',
                                }}
                            ></div>
                        </div>
                    </div>
                )
            })}
        </div >
    );
};


// Function to create a new deck
function createDeck() {
    let deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push({ rank, suit });
        }
    }
    return deck;
}


function evaluateHand(_hand: Card[]) {
    const hand: Card[] = _hand.filter((h) => h); // Filter out any null/undefined values
    const rankCounts = getRankCounts(hand);
    const suitCounts = getSuitCounts(hand);

    let ranking = '';
    let winningCards: any[] = [];

    // Check for flush
    const isFlush = Object.values(suitCounts).some(count => count === 5);

    // Check for straight using updated straight detection logic
    const isStraight = checkStraight(rankCounts);

    // Check for pairs, three of a kind, four of a kind, full house
    const pairs: any[] = [];
    let threeOfAKind: any = null;
    let fourOfAKind: any = null;

    for (const [rank, count] of Object.entries(rankCounts)) {
        if (count === 2) {
            pairs.push(rank);
        } else if (count === 3) {
            threeOfAKind = rank;
        } else if (count === 4) {
            fourOfAKind = rank;
        }
    }

    // Royal Flush check (Ace, King, Queen, Jack, 10 of the same suit)
    const hasRoyalFlushRanks = ['10', 'J', 'Q', 'K', 'A'].every(rank => rankCounts[rank]);
    if (isFlush && hasRoyalFlushRanks) {
        ranking = 'royal_flush';
        winningCards = hand;
    } else if (isFlush && isStraight) {
        ranking = 'straight_flush';
        winningCards = hand;
    } else if (fourOfAKind) {
        ranking = '4_of_a_kind';
        winningCards = hand.filter((card: Card) => card && card.rank === fourOfAKind);
    } else if (threeOfAKind && pairs.length > 0) {
        ranking = 'full_house';
        winningCards = hand.filter((card: Card) => card && card.rank === threeOfAKind || card && card.rank === pairs[0]);
    } else if (isFlush) {
        ranking = 'flush';
        winningCards = hand;
    } else if (isStraight) {
        ranking = 'straight';
        winningCards = hand;
    } else if (threeOfAKind) {
        ranking = '3_of_a_kind';
        winningCards = hand.filter((card: Card) => card && card.rank === threeOfAKind);
    } else if (pairs.length === 2) {
        ranking = '2_pair';
        winningCards = hand.filter((card: Card) => card && card.rank === pairs[0] || card && card.rank === pairs[1]);
    } else if (pairs.length === 1) {
        const pairRank = rankOrder(pairs[0]);
        if (pairRank >= rankOrder('J')) {
            ranking = 'pair'; // This is "Pair of Jacks or Better"
            winningCards = hand.filter((card: Card) => card && card.rank === pairs[0]);
        }
    } else {
        ranking = ''; // No winning hand
    }

    return { ranking, winningCards };
}

// Updated function to check if the hand is a straight (all cards are consecutive)
function checkStraight(rankCounts: any) {
    // Extract ranks and sort them
    const sortedRanks = Object.keys(rankCounts)
        .map(rank => rankOrder(rank))
        .sort((a, b) => a - b);

    // Check if we have 5 unique ranks
    if (sortedRanks.length !== 5) return false;

    // Check for regular straight (consecutive numbers)
    const isRegularStraight = sortedRanks[4] - sortedRanks[0] === 4 && sortedRanks.every((rank, index) => {
        if (index === 0) return true; // Skip first element comparison
        return rank === sortedRanks[index - 1] + 1;
    });

    // Special case: Check for Ace-to-Five straight (Ace is low: A, 2, 3, 4, 5)
    const isAceLowStraight = sortedRanks[4] === 14 && sortedRanks[0] === 2 &&
        sortedRanks[1] === 3 && sortedRanks[2] === 4 && sortedRanks[3] === 5;

    // Return true if either a regular straight or an Ace-low straight
    return isRegularStraight || isAceLowStraight;
}

// Helper function to count ranks  
function getRankCounts(hand: Card[]) {
    const counts: { [key: string]: number } = {};
    for (let card of hand) {
        if (card) {
            counts[card.rank] = (counts[card.rank] || 0) + 1;
        }
    }
    return counts;
}

// Helper function to count suits  
function getSuitCounts(hand: Card[]) {
    const counts: { [key: string]: number } = {};
    for (let card of hand) {
        if (card) {
            counts[card.suit] = (counts[card.suit] || 0) + 1;
        }
    }
    return counts;
}

// Helper function to determine the order of ranks  
function rankOrder(rank: string) {
    const order: { [key: string]: number } = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
        '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11,
        'Q': 12, 'K': 13, 'A': 14
    };
    return order[rank] || 2;
}

