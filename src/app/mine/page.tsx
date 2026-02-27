'use client'
import AmountInput from "@/components/AmountInput";
import BetNumberInput from "@/components/BetNumberInput";
import MineButton from "@/components/Mine/MineButton";
import MineCustomInput from "@/components/Mine/MineCustomInput";
import MineModal from "@/components/Mine/MineModal";
import StopProfitInput from "@/components/Mine/StopProfitInput";
import CelebrationAnimations from "@/components/Mine/CelebrationAnimations";
import { GAME_STATUS, MINE_OBJECT, MineArea } from "@/components/Mine/types";
import ProfitAmount from "@/components/ProfitAmount";
import { BombSvg, QubSvg } from "@/components/svgs";
import SwitchTab from "@/components/SwitchTab";
import useIsMobile from "@/hooks/useIsMobile";
import Layout from "@/layout/layout";
import axiosServices from "@/util/axios";
import { Button, Switch } from "@heroui/react";
import Modal from "@/components/Modal";
import { useEffect, useRef, useState } from "react";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import { CASINO_OWNER_PUBLIC_ID, QUBIC_EXPLORER_URL } from "@/config";
import toast from "react-hot-toast";
import GameGuide from "@/components/GameGuide";
const MINE_API = "/mine";

function calculateMinesGame(mines: number, picks: number, bet: number): any {
    const totalSlots = 25; // Total number of slots
    const safeSlots = totalSlots - mines; // Slots without mines

    // Function to calculate factorial
    function factorial(n: number): number {
        let value = 1;
        for (let i = 2; i <= n; i++) {
            value *= i;
        }
        return value;
    }

    // Function to calculate combinations
    function combination(n: number, k: number): number {
        if (k > n) return 0;
        return factorial(n) / (factorial(k) * factorial(n - k));
    }

    // Calculate total combinations and safe combinations
    const totalCombinations = combination(totalSlots, picks);
    const safeCombinations = combination(safeSlots, picks);

    // Calculate probability and other metrics
    let probability = 0.99 * (totalCombinations / safeCombinations);
    probability = Math.round(probability * 100) / 100;

    const winAmount = bet * probability;
    const roundedWinAmount = Math.floor(Math.round(winAmount * 100000000) / 100000000);

    const lossAmount = 100 / (probability - 1);
    const roundedLossAmount = Math.round(lossAmount * 100) / 100;

    const chance = 99 / probability;
    const roundedChance = Math.round(chance * 100000) / 100000;

    // Log results if conditions are met
    if (mines + picks <= totalSlots && picks > 0 && mines > 0) {
        if (mines && picks) {
            return {
                probability,
                roundedLossAmount,
                roundedChance,
                roundedWinAmount,
            };
            // console.log("Probability:", probability);
            // console.log("Loss:", roundedLossAmount);
            // console.log("Chance:", roundedChance);
            // if (bet > 0.00000000999) console.log("Win:", roundedWinAmount);
        }
    }
    return {
        probability: 0,
        roundedLossAmount: 0,
        roundedChance: 0,
        roundedWinAmount: 0,
    };
}

const MineGame: React.FC = () => {
    const { wallet, connected, transfer, fetchBalance, walletBalances } = useQubicConnect();
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState(0); // 0 for Manual, 1 for Auto
    const [mineCount, setMineCount] = useState<number>(3);
    const [betAmount, setBetAmount] = useState<number>(0);
    const [status, setStatus] = useState<GAME_STATUS>(GAME_STATUS.READY);
    const [loading, setLoading] = useState(false);
    const [mineAreas, setMineAreas] = useState<MineArea[]>([]);
    const [autoAreas, setAutoAreas] = useState<MineArea[]>([]);

    const statusRef = useRef<any>(null);
    const balanceBeforePayoutRef = useRef<number>(0);
    const walletBalanceRef = useRef<number>(0);
    const [resultVisible, setResultVisible] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [autoBetCount, setAutoBetCount] = useState(0);
    const [isInfinity, setInfinity] = useState(false);
    const [stopProfitA, setStopProfitA] = useState(0);
    const [stopLossA, setStopLossA] = useState(0);
    const [onWinP, setOnWinP] = useState(0);
    const [onLossP, setOnLossP] = useState(0);
    const [areaFlag, setAreaFlag] = useState(true);

    const [totalProfit, setProfitA] = useState<number>(0);
    const [totalLoss, setLossA] = useState<number>(0);

    const [result, setResult] = useState({
        odds: 0,
        profit: 0,
    });
    const [gameId, setGameId] = useState<number | null>(null);
    const [prevProbability, setPrevProbability] = useState<number>(0);
    const [showProbabilityAnimation, setShowProbabilityAnimation] = useState(false);
    const [isCashingOut, setIsCashingOut] = useState(false);
    const [showCashoutConfirm, setShowCashoutConfirm] = useState(false);
    const [amountExceedsBalance, setAmountExceedsBalance] = useState(false);
    const gameStateBeforeCashoutRef = useRef<{ mineAreas: MineArea[]; gameId: number | null; status: GAME_STATUS } | null>(null);
    
    // AUTO state refs (prevent double-runs, enable instant stop)
    const autoRunningRef = useRef(false);
    const autoAbortRef = useRef<AbortController | null>(null);
    const baseBetRef = useRef(0);
    const currentBetRef = useRef(0);
    const netProfitRef = useRef(0);
    
    // Calculate profit based on revealed crystals (not total tiles)
    const revealedCrystals = mineAreas.filter((m) => m.mined && m.mine === MINE_OBJECT.GEM).length;
    const profitAndOdds = calculateMinesGame(
        mineCount,
        revealedCrystals,
        betAmount
    );
    
    // Track probability changes and trigger animation
    useEffect(() => {
        if (status === GAME_STATUS.LIVE && profitAndOdds.probability > prevProbability && prevProbability > 0) {
            setShowProbabilityAnimation(true);
            const timer = setTimeout(() => {
                setShowProbabilityAnimation(false);
            }, 800); // Animation duration (matches CSS animation)
            return () => clearTimeout(timer);
        }
        setPrevProbability(profitAndOdds.probability);
    }, [profitAndOdds.probability, status, prevProbability]);

    useEffect(() => {
        walletBalanceRef.current = walletBalances?.qubic || 0;
    }, [walletBalances?.qubic]);

    const waitForTxConfirmation = async (txId: string, maxAttempts = 30, intervalMs = 1000) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const res = await axiosServices.get(`/tx/status/${txId}`);
                if (res?.data) return true;
            } catch (err: any) {
                if (err?.response?.status !== 404) {
                    console.warn("tx status check failed:", err?.message || err);
                }
            }
            if (attempt < maxAttempts - 1) {
                await new Promise((r) => setTimeout(r, intervalMs));
            }
        }
        return false;
    };
    
    // Helper function to convert backend string mine types to frontend enum values
    // IMPORTANT: Only set mine type if mined is true (don't reveal until clicked)
    const convertBackendDatas = (datas: any[]): MineArea[] => {
        if (!Array.isArray(datas)) return [];
        return datas.map((item: any) => ({
            point: item.point,
            // Only show mine type if tile has been mined (revealed)
            mine: item.mined ? (item.mine === 'GEM' ? MINE_OBJECT.GEM : item.mine === 'BOMB' ? MINE_OBJECT.BOMB : null) : null,
            mined: item.mined || false
        }));
    };
    
    const resetGame = () => {
        setResultVisible(false);
        setMineAreas([]);
        setStatus(GAME_STATUS.READY);
        setLoading(false);
        setGameId(null);
        setProfitA(0); // Reset profit when starting new game
    };

    const handleApiError = (point?: number) => {
        if (point !== undefined) {
            setMineAreas(mineAreas.filter((m) => m.point !== point));
        }
        setLoading(false);
    };

    const checkActiveGame = async () => {
        if (!connected || !wallet?.publicKey) {
            return;
        }
        try {
            const { data } = await axiosServices.post(`${MINE_API}/status`, {
                publicId: wallet.publicKey
            });
            if (data.success) {
                const { datas, amount, mines, gameId } = data;
                setStatus(GAME_STATUS.LIVE);
                if (datas && Array.isArray(datas)) {
                    setMineAreas(convertBackendDatas(datas));
                } else {
                    setMineAreas([]);
                }
                setBetAmount(amount);
                setMineCount(mines);
                if (gameId) {
                    setGameId(gameId);
                }
            }
        } catch (error) {
            handleApiError();
        }
    };

    const createBet = async () => {
        if (loading || !connected || !wallet?.publicKey) return;
        
        const amountInt = Math.floor(betAmount);
        if (amountInt <= 0) {
            toast.error("Invalid bet amount");
            return;
        }

        // Check if amount exceeds balance
        const walletBalance = walletBalances?.qubic || 0;
        if (amountInt > walletBalance) {
            toast.error(`Cannot bet! Amount exceeds your balance of ${walletBalance} QU. Please reduce the amount.`);
            return;
        }

        resetGame();
        setLoading(true);
        
        try {
            // First, transfer funds to casino owner
            let txId: string | null = null;
            try {
                // Transfer function now waits for confirmation and shows notification
                const transferResult = await transfer(CASINO_OWNER_PUBLIC_ID, amountInt);
                txId = transferResult.txId;
                // Notification is already shown by transfer function
            } catch (transferError: any) {
                console.error("Transfer error:", transferError);
                toast.error(`Transfer failed: ${transferError?.message || "Unknown error"}`, { id: "transfer" });
                setLoading(false);
                return;
            }

            // Then create the game with the transaction ID
            // IMPORTANT: All values must be proper types (numbers, strings, not undefined)
            const createPayload = {
                publicId: String(wallet.publicKey),
                mines: Number(mineCount),
                amount: Number(amountInt),
                txId: txId ? String(txId) : null,
            };
            
            // Log payload for debugging
            console.log('createBet payload:', createPayload);
            
            const { data } = await axiosServices.post(`${MINE_API}/create`, createPayload, {
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (data.status === "BET") {
                setStatus(GAME_STATUS.LIVE);
                // Store gameId for tile clicks
                if (data.gameId) {
                    setGameId(data.gameId);
                }
                // Initialize mineAreas with game data (all tiles, but not revealed yet)
                if (data.datas && Array.isArray(data.datas)) {
                    setMineAreas(convertBackendDatas(data.datas));
                }
            } else {
                checkActiveGame();
            }
        } catch (error: any) {
            console.error("Create bet error:", error?.response?.data ?? error);
            toast.error(error?.response?.data?.error || error?.response?.data?.message || error?.message || "Failed to create bet");
            handleApiError();
        }
        setLoading(false);
    };

    const selectArea = async (point: number) => {
        // Block editing points during AUTO run
        if (autoRunningRef.current) return;
        if (GAME_STATUS.LIVE === status) return;
        const autoIndex = autoAreas.findIndex((m: MineArea) => m.point === point);
        if (autoIndex === -1) {
            setAutoAreas((prev) => [...prev, { point, mine: null, mined: false }]);
        } else {
            setAutoAreas([
                ...autoAreas.filter(
                    (m: MineArea, index: number) => index !== autoIndex
                ),
            ]);
        }
    };

    // Auto-select tiles for autobet (random selection)
    const autoSelectTiles = (): number[] => {
        if (GAME_STATUS.LIVE === status || loading) return [];
        
        const totalTiles = 25;
        const maxSafeTiles = totalTiles - mineCount; // Don't select more than safe tiles
        
        // Calculate how many tiles to select (default to a reasonable number, e.g., 5-10 tiles)
        // User can still manually adjust by clicking tiles
        const tilesToSelect = Math.min(maxSafeTiles, Math.max(3, Math.floor(maxSafeTiles * 0.4))); // Select 40% of safe tiles, minimum 3
        
        const allPoints = Array.from({ length: totalTiles }, (_, i) => i);
        const selectedPoints: number[] = [];
        
        // Randomly select tiles
        while (selectedPoints.length < tilesToSelect && selectedPoints.length < maxSafeTiles) {
            const randomIndex = Math.floor(Math.random() * allPoints.length);
            const point = allPoints[randomIndex];
            if (!selectedPoints.includes(point)) {
                selectedPoints.push(point);
            }
        }
        
        setAutoAreas(selectedPoints.map(point => ({ point, mine: null, mined: false })));
        return selectedPoints;
    };

    const placeBet = async (point: number) => {
        // If AUTO is running, manual clicks must be blocked
        if (autoRunningRef.current) return;
        // Check if game is not started yet
        if (status !== GAME_STATUS.LIVE || !gameId) {
            toast.error("You must place a bet first to play the game!", {
                duration: 4000,
                style: {
                    background: '#1a1a1a',
                    color: '#00f3ff',
                    border: '2px solid #00f3ff',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                },
                iconTheme: {
                    primary: '#00f3ff',
                    secondary: '#fff',
                },
            });
            return;
        }
        
        // Only allow tile clicks when game is LIVE and gameId exists
        if (!connected || !wallet?.publicKey) return;
        const mine = mineAreas.find((m: MineArea) => m.point === point);
        if (mine?.mined) return;

        setLoading(true);

        try {
            // Call /pick endpoint with gameId and point/index
            const { data } = await axiosServices.post(`${MINE_API}/pick`, { 
                gameId: gameId,
                index: point
            });
            
            if (data.status === "BET") {
                // Continue game - update mine areas with revealed tile
                if (data.datas && Array.isArray(data.datas)) {
                    setMineAreas(convertBackendDatas(data.datas));
                } else {
                    // Fallback: manually update the clicked tile
                    setMineAreas((prev) =>
                        prev.map((m) =>
                            m.point === point ? { ...m, mine: MINE_OBJECT.GEM, mined: true } : m
                        )
                    );
                }
            } else if (data.status === "END") {
                // Game ended
                if (data.datas && Array.isArray(data.datas)) {
                    setMineAreas(convertBackendDatas(data.datas));
                }
                if (data.hitMine) {
                    // Hit a bomb - game over
                    // Wait 2-3 seconds for player to see the bomb animation, then show notification and reset
                    setTimeout(() => {
                        // Reset game state
                        setMineAreas([]);
                        setGameId(null);
                        setStatus(GAME_STATUS.READY);
                        setProfitA(0);
                        setBetAmount(0); // Reset bet amount to 0
                        
                        // Show notification
                        toast.error("Game Over! You hit a mine! Click BET to start a new game.", {
                            duration: 6000,
                            style: {
                                background: '#1a1a1a',
                                color: '#ff0000',
                                border: '2px solid #ff0000',
                                padding: '16px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                            },
                            iconTheme: {
                                primary: '#ff0000',
                                secondary: '#fff',
                            },
                        });
                    }, 2500); // 2.5 seconds delay
                } else {
                    // All safe tiles mined - game won
                    setResult({
                        odds: profitAndOdds.probability,
                        profit: profitAndOdds.roundedWinAmount,
                    });
                    setResultVisible(true);
                    setStatus(GAME_STATUS.READY);
                    setGameId(null);
                }
            } else {
                checkActiveGame();
            }
        } catch (error) {
            handleApiError(point);
        }
        setLoading(false);
    };

    const handleCashoutConfirm = () => {
        setShowCashoutConfirm(false);
        performCashout();
    };

    const handleCashoutCancel = () => {
        setShowCashoutConfirm(false);
        // Revert to original state
        if (gameStateBeforeCashoutRef.current) {
            setMineAreas(gameStateBeforeCashoutRef.current.mineAreas);
            setGameId(gameStateBeforeCashoutRef.current.gameId);
            setStatus(gameStateBeforeCashoutRef.current.status);
            gameStateBeforeCashoutRef.current = null;
        }
    };

    const performCashout = async () => {
        // Prevent duplicate calls
        if (isCashingOut || status !== GAME_STATUS.LIVE || loading || mineAreas.length === 0 || !connected || !wallet?.publicKey || !gameId)
            return;
        
        setIsCashingOut(true);
        setLoading(true);
        try {
            const { data } = await axiosServices.post(`${MINE_API}/cashout`, {
                gameId: gameId,
                publicId: wallet.publicKey
            }, {
                headers: {
                    'x-public-id': wallet.publicKey
                }
            });
            
            if (data.status === "END" || data.status === "PAYOUT_PENDING") {
                // Use actual payout data from backend
                const actualPayoutAmount = data.payoutAmount || 0;
                const actualMultiplier = data.multiplier || profitAndOdds.probability;
                
                setResult({
                    odds: actualMultiplier,
                    profit: actualPayoutAmount,
                });
                // Show revealed tiles for result modal, then reset after modal closes
                if (data.datas && Array.isArray(data.datas)) {
                    setMineAreas(convertBackendDatas(data.datas));
                } else {
                    setMineAreas([]);
                }
                setStatus(GAME_STATUS.READY);
                setGameId(null); // Clear gameId for new game
                setResultVisible(true);
                setShowCelebration(true); // Show celebration animations
                
                // Confirm payout transaction and refresh balance
                if (data.payoutTxId) {
                    toast.loading("Confirming payout...", { id: "cashout-payout" });
                    balanceBeforePayoutRef.current = walletBalanceRef.current;

                    const confirmed = await waitForTxConfirmation(data.payoutTxId, 30, 1000);

                    if (confirmed) {
                        if (fetchBalance) {
                            await fetchBalance();
                        }
                        toast.dismiss("cashout-payout");
                        toast.success(
                            <div>
                                <div>Payout confirmed! {actualPayoutAmount} QU</div>
                                <a 
                                    href={`${QUBIC_EXPLORER_URL}${data.payoutTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline"
                                >
                                    View Transaction
                                </a>
                            </div>,
                            { duration: 8000 }
                        );
                    } else {
                        toast.dismiss("cashout-payout");
                        toast(
                            <div>
                                <div>Payout submitted (pending confirmation)</div>
                                <a 
                                    href={`${QUBIC_EXPLORER_URL}${data.payoutTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 underline"
                                >
                                    View Transaction
                                </a>
                            </div>,
                            { duration: 8000, icon: "⏳" }
                        );
                    }

                    // Reset all states after payout flow
                    setTimeout(() => {
                        resetGame();
                        setBetAmount(0);
                        setShowCelebration(false);
                        setResult({ odds: 0, profit: 0 });
                        setIsCashingOut(false);
                    }, 1000);
                } else if (data.status === "PAYOUT_PENDING") {
                    toast.success("Payout processing...", { duration: 3000 });
                } else {
                    toast.error("Payout tx missing. Please contact support.", { duration: 4000 });
                }
            } else {
                checkActiveGame();
            }
        } catch (error: any) {
            console.error('Cashout error:', error);
            const errorMessage = error?.response?.data?.error || error?.message || 'Cashout failed';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
            setIsCashingOut(false);
        }
    };

    const randomBet = async () => {
        const excludeArray = mineAreas.map((m) => m.point);
        const allNumbers: number[] = Array.from({ length: 25 }, (_, i) => i); // Creates an array [0, 1, 2, ..., 24]
        const availableNumbers = allNumbers.filter(
            (num) => !excludeArray.includes(num)
        ); // Exclude numbers

        if (availableNumbers.length === 0) {
            throw new Error("No available numbers to choose from");
        }

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        placeBet(availableNumbers[randomIndex]);
    };

    const handleAmountChange = (amount: number) => {
        if (status === GAME_STATUS.READY) {
            const walletBalance = walletBalances?.qubic || 0;
            const amountInt = Math.floor(amount);
            
            if (amountInt > walletBalance) {
                setAmountExceedsBalance(true);
                toast.error(`Cannot bet! Amount exceeds your balance of ${walletBalance} QU. Please reduce the amount.`, {
                    duration: 4000,
                });
                setBetAmount(amountInt); // Still set the amount but disable betting
            } else {
                setAmountExceedsBalance(false);
                setBetAmount(amountInt);
            }
        }
    };

    const handleTabChange = (s: number) => {
        if (status === GAME_STATUS.READY) {
            setActiveTab(s);
            resetGame();
        }
    };

    const handleBetCount = (value: number) => {
        const count = value;
        if (count >= 0) {
            setAutoBetCount(value);
        }
        setInfinity(count === 0);
    };

    useEffect(() => {
        checkActiveGame();
    }, []);

    //------------------- auto -----------------------//

    // Function to start auto betting
    const autoBet = () => {
        if (loading || autoRunningRef.current) return;
        
        // Auto-select tiles if none are selected
        if (autoAreas.length === 0) {
            const selectedPoints = autoSelectTiles() || [];
            if (selectedPoints.length > 0) {
                setStatus(GAME_STATUS.LIVE);
                setLoading(true);
                setInfinity(autoBetCount === 0);
                runTimeBet(selectedPoints);
            }
            return;
        }
        
        setStatus(GAME_STATUS.LIVE);
        setLoading(true);
        setInfinity(autoBetCount === 0);
        runTimeBet();
    };

    // Function to stop auto betting
    const stopBet = () => {
        // Stop loop immediately
        autoRunningRef.current = false;
        autoAbortRef.current?.abort();
        autoAbortRef.current = null;

        setLoading(false);
        setStatus(GAME_STATUS.READY);
    };

    // Function to handle the betting loop (cancelable, uses backend outcome/profit)
    const runTimeBet = async (pointsOverride?: number[]) => {
        // Prevent double-start
        if (autoRunningRef.current) return;

        if (!connected || !wallet?.publicKey) return;

        autoRunningRef.current = true;

        // Snapshot config at start (recommended)
        const publicId = wallet.publicKey;
        const points = (pointsOverride && pointsOverride.length > 0)
            ? pointsOverride
            : autoAreas.map((a) => a.point);
        if (points.length === 0) {
            stopBet();
            return;
        }
        const mines = mineCount;

        // Base bet + current bet
        baseBetRef.current = Math.max(1, Math.floor(betAmount));
        currentBetRef.current = baseBetRef.current;

        // Reset totals
        netProfitRef.current = 0;
        setProfitA(0);
        setLossA(0);

        // Bets remaining snapshot
        let remaining = isInfinity ? Number.POSITIVE_INFINITY : autoBetCount;
        let roundNumber = 0; // Track round number for notifications

        try {
            while (autoRunningRef.current && remaining > 0) {
                // Compute bet for this round
                const amountInt = Math.max(1, Math.floor(currentBetRef.current));

                // Check balance before transfer
                const currentBalance = walletBalanceRef.current || 0;
                if (amountInt > currentBalance) {
                    toast.error(`Cannot autobet! Amount exceeds your balance of ${currentBalance} QU.`);
                    stopBet();
                    return;
                }

                // Transfer funds to casino owner for this round
                let txId: string | null = null;
                try {
                    const transferResult = await transfer(CASINO_OWNER_PUBLIC_ID, amountInt);
                    txId = transferResult.txId;
                } catch (transferError: any) {
                    console.error("Autobet transfer error:", transferError);
                    toast.error(`Transfer failed: ${transferError?.message || "Unknown error"}`, { id: "transfer" });
                    stopBet();
                    return;
                }

                // Abortable request so STOP works instantly
                const ac = new AbortController();
                autoAbortRef.current = ac;

                let data: any;
                try {
                    const resp = await axiosServices.post(
                        `${MINE_API}/autobet`,
                        { publicId, points, mines, amount: amountInt, txId },
                        { signal: ac.signal }
                    );
                    data = resp.data;
                } catch (err: any) {
                    if (ac.signal.aborted) return; // User stopped
                    stopBet();
                    return;
                } finally {
                    autoAbortRef.current = null;
                }

                if (!data || data.status !== "END") {
                    stopBet();
                    return;
                }

                // Prefer backend truth: outcome/profit/payoutAmount
                const won = data.outcome === "WIN";

                const roundProfit =
                    typeof data.profit === "number"
                        ? data.profit
                        : won
                            ? (Number(data.payoutAmount || 0) - amountInt)
                            : -amountInt;

                netProfitRef.current += roundProfit;

                roundNumber += 1; // Increment round number

                // Update board first so user can see gems/mines
                if (Array.isArray(data.datas)) {
                    setMineAreas(convertBackendDatas(data.datas));
                }

                // Show result popup for wins
                if (won) {
                    setResult({
                        odds: data.multiplier ?? 0,
                        profit: Number(data.payoutAmount || 0),
                    });
                    setResultVisible(true);
                }

                // Show notification for each round's profit
                if (roundProfit > 0) {
                    const payoutAmount = Number(data.payoutAmount || 0);
                    const payoutTxId = data.payoutTxId;

                    if (payoutTxId) {
                        toast.loading(
                            `Round ${roundNumber}: Payout submitted. Waiting for confirmation...`,
                            { id: `auto-payout-${roundNumber}` }
                        );

                        const confirmed = await waitForTxConfirmation(payoutTxId, 30, 1000);

                        if (!autoRunningRef.current) {
                            return;
                        }

                        toast.dismiss(`auto-payout-${roundNumber}`);

                        if (confirmed) {
                            if (fetchBalance) {
                                await fetchBalance();
                            }
                            toast.success(
                                `Round ${roundNumber}: Success! Reward: ${payoutAmount.toFixed(2)} QU (Total Profit: ${netProfitRef.current.toFixed(2)} QU)`,
                                {
                                    duration: 3000,
                                    style: {
                                        background: '#1a1a1a',
                                        color: '#00f3ff',
                                        border: '2px solid #00f3ff',
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        borderRadius: '8px',
                                    },
                                    iconTheme: {
                                        primary: '#00f3ff',
                                        secondary: '#fff',
                                    },
                                }
                            );
                        } else {
                            toast(
                                `Round ${roundNumber}: Payout submitted (pending confirmation). Reward: ${payoutAmount.toFixed(2)} QU`,
                                { duration: 3000, icon: "⏳" }
                            );
                        }
                    } else {
                        // Fallback if payout tx is missing
                        toast.success(
                            `Round ${roundNumber}: Success! Reward: ${payoutAmount.toFixed(2)} QU (Total Profit: ${netProfitRef.current.toFixed(2)} QU)`,
                            {
                                duration: 3000,
                                style: {
                                    background: '#0a0a0a',
                                    color: '#00f3ff',
                                    border: '2px solid #00f3ff',
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    borderRadius: '8px',
                                },
                                iconTheme: {
                                    primary: '#00f3ff',
                                    secondary: '#fff',
                                },
                            }
                        );
                    }
                } else if (roundProfit < 0) {
                    toast.error(
                        `Round ${roundNumber}: Lost ${Math.abs(roundProfit).toFixed(2)} QU (Total: ${netProfitRef.current.toFixed(2)} QU)`,
                        {
                            duration: 3000,
                            style: {
                                background: '#1a1a1a',
                                color: '#ff4444',
                                border: '2px solid #ff4444',
                                padding: '12px 16px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                            },
                            iconTheme: {
                                primary: '#ff4444',
                                secondary: '#fff',
                            },
                        }
                    );
                }

                // Update stop profit/loss counters using NET (correct)
                if (roundProfit >= 0) {
                    setProfitA((p) => p + roundProfit);
                } else {
                    setLossA((l) => l + (-roundProfit));
                }

                // Stop thresholds (NET)
                if (stopProfitA !== 0 && netProfitRef.current >= stopProfitA) {
                    stopBet();
                    return;
                }
                if (stopLossA !== 0 && netProfitRef.current <= -stopLossA) {
                    stopBet();
                    return;
                }

                // Wait a moment to show the board state, then reset all states to initial (for next round)
                await new Promise((r) => setTimeout(r, 2000)); // 2 seconds to see the board

                // Reset all states to initial after showing board
                setMineAreas([]);
                setResultVisible(false);
                setResult({ odds: 0, profit: 0 });
                setGameId(null);

                // Next bet sizing (increase %; 0 means keep same)
                const pct = won ? onWinP : onLossP;
                const safePct = Math.max(0, Number(pct) || 0);
                const nextBet = Math.floor(amountInt * (1 + safePct / 100));

                currentBetRef.current = Math.max(1, nextBet);

                // Decrement remaining
                if (!isInfinity) {
                    remaining -= 1;
                    setAutoBetCount(remaining);

                    if (remaining <= 0) {
                        stopBet();
                        return;
                    }
                }

                // Delay between rounds (matches your old timeouts)
                await new Promise((r) => setTimeout(r, 1500));
            }

            stopBet();
        } finally {
            autoRunningRef.current = false;
            autoAbortRef.current?.abort();
            autoAbortRef.current = null;
        }
    };

    // REMOVED: useEffect auto-trigger (causes double-runs)
    // AUTO now starts directly from button handler

    // -------------auto end ---------------------//

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        if (autoAreas.length > 0) {
            setAreaFlag(true);
        }
    }, [autoAreas]);

    const disabled = GAME_STATUS.LIVE === status || loading || autoRunningRef.current;
    const isAuto = activeTab === 1;



    // Render mine count slider
    const renderMineCount = () => (
        <div className="mt-2 flex flex-col">
            <p className={`text-xs font-mono ${disabled ? "text-gray-500" : "text-gray-200"}`}>
                Mines
            </p>
            <div
                className={`flex items-center p-1.5 ${disabled ? "bg-black/40" : "bg-black/60"
                    } rounded-full border-[2px] border-cyan-400/15 hover:border-cyan-400/30`}
            >
                <div className="px-4 w-[10px] text-white">{mineCount}</div>
                <input
                    type="range"
                    min="1"
                    max="24"
                    disabled={disabled}
                    value={mineCount}
                    onChange={(e) => setMineCount(Number(e.target.value))}
                    className="mx-2 w-full h-2 bg-cyan-400/30 rounded-lg cursor-pointer "
                />
                <div className="px-4 text-white">24</div>
            </div>
        </div>
    );

    // Render mine status fields
    const renderMineStatus = () => (
        <div className="mt-2 w-[100%]">
            <div style={{ display: "grid" }}>
                <div className="pr-2 flex flex-col" style={{ gridRow: 1 }}>
                    <p
                        className={`text-sm w-full ${disabled ? "text-gray-500" : "text-white"
                            }`}
                    >
                        Mines
                    </p>
                    <input
                        value={mineCount}
                        disabled
                        className="bg-black/60 text-white  border-[2px] border-cyan-400/15 hover:border-cyan-400/30 rounded w-full p-1.5 text-sm"
                    />
                </div>
                <div className="pl-2 flex flex-col" style={{ gridRow: 1 }}>
                    <p
                        className={`text-sm w-full ${disabled ? "text-gray-500" : "text-white"
                            }`}
                    >
                        Games
                    </p>
                    <input
                        value={25 - mineCount - mineAreas.length}
                        disabled
                        className="bg-black/60 text-white  border-[2px] border-cyan-400/15 hover:border-cyan-400/30 rounded w-full p-1.5 text-sm"
                    />
                </div>
            </div>
        </div>
    );

    // Render pick random tile button
    const renderRandomPickBtn = () => (
        <div className="mt-3 w-full">
            <Button
                onPress={randomBet}
                className=" w-full  font-bold py-2 px-4 rounded-full"
                color="default"
            >
                Pick random tile
            </Button>
        </div>
    );

    // Render bet button
    const renderBetBtn = () => {
        // When LIVE: button stays clickable (Stop Autobet / Cashout)
        // When not LIVE: enforce selection/balance rules
        const disabledbtn = status !== GAME_STATUS.LIVE &&
            (loading || amountExceedsBalance);
        return (
            <div className="mt-3 w-full">
                <Button
                    disabled={disabledbtn || isCashingOut}
                    onPress={() => {
                        if (!isAuto) {
                            if (!loading && !isCashingOut) {
                                if (status === GAME_STATUS.LIVE) {
                                    // Store current game state before showing confirmation
                                    gameStateBeforeCashoutRef.current = {
                                        mineAreas: [...mineAreas],
                                        gameId: gameId,
                                        status: status
                                    };
                                    setShowCashoutConfirm(true);
                                } else {
                                    createBet();
                                }
                            }
                        } else {
                            // AUTO mode
                            if (status === GAME_STATUS.LIVE) {
                                stopBet();
                            } else {
                                if (!loading && !autoRunningRef.current) {
                                    autoBet();
                                }
                            }
                        }
                    }}
                    className={`${disabledbtn ? "bg-cyan-400/50" : "bg-cyan-400 hover:bg-cyan-300"
                        } slide-bet-button`}
                >
                    <div className="flex text-nowrap">
                        {status === GAME_STATUS.LIVE
                            ? isAuto
                                ? "Stop Autobet"
                                : "CASHOUT"
                            : isAuto
                                ? "Start AutoBet"
                                : "BET"}
                        {loading && (
                            <div className="h-6 flex w-full items-center justify-center animate-zoom p-1">
                                <BombSvg />
                            </div>
                        )}
                    </div>
                </Button>
            </div>
        );
    };

    const renderStopProfitAmount = () => (
        <StopProfitInput
            value={stopProfitA}
            onChange={setStopProfitA}
            disabled={disabled}
            label="Stop on Profit"
        />
    );

    const renderStopLossAmount = () => (
        <StopProfitInput
            value={stopLossA}
            onChange={setStopLossA}
            disabled={disabled}
            label="Stop on Loss"
        />
    );

    return (
        <Layout>
            <div className="flex w-full justify-center p-2 sm:p-4">
                <div
                    className={` ${isMobile ? "flex flex-col items-center gap-4" : "flex gap-4"
                        } w-full max-w-[1200px]`}
                >
                    {/* Main content - Game Display */}
                    <div className="game-display flex items-center w-full">
                        <div
                            className={`${isMobile ? "w-11/12" : "w-[500px] xl:w-[630px] p-5"} mx-auto relative`}
                        >
                            <div
                                className={`grid grid-cols-5 gap-2.5 p-1.5 ${!areaFlag ? "animate-bounding2" : ""
                                    } `}>
                                {[...Array(25)].map((_, index) => {
                                    const mine = mineAreas.find((m) => m.point == index);
                                    const auto = isAuto
                                        ? autoAreas.findIndex((m) => m.point == index) !== -1
                                        : false;
                                    return (
                                        <div
                                            key={index}
                                            className={`overflow-hidden max-h-[126px] ${mineAreas.length == 0 ? "animate-zoomIn" : ""
                                                } `}
                                        >
                                            <MineButton
                                                point={index}
                                                mine={mine}
                                                isAuto={auto}
                                                onClick={isAuto ? selectArea : placeBet}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            <MineModal
                                visible={resultVisible}
                                data={{
                                    odds: result.odds,
                                    profit: result.profit,
                                    coin: null,
                                }}
                            />
                            <CelebrationAnimations
                                visible={showCelebration}
                                onComplete={() => setShowCelebration(false)}
                            />
                        </div>
                    </div>
                    {!isMobile && (
                        <div className="game-panel xl:w-[320px] flex-shrink-0">
                            <div className="game-panel-header">
                                <div className="flex items-center gap-1.5">
                                    <span className="terminal-dot" style={{background:'#ff5f57'}}></span>
                                    <span className="terminal-dot" style={{background:'#febc2e'}}></span>
                                    <span className="terminal-dot" style={{background:'#28c840'}}></span>
                                </div>
                                <span className="text-xs font-mono text-cyan-400/80 tracking-wider">💎 MINE</span>
                            </div>
                            <div className="game-panel-body">
                            {isAuto ? (
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4 mb-2 mt-1">
                                        <div className="flex-1 [&>div]:mt-0">
                                    <SwitchTab onChange={handleTabChange} active={activeTab} disabled={disabled} />
                                        </div>
                                        <Button 
                                            onClick={() => setShowHelp(true)} 
                                            className="w-[36px] h-[36px] min-w-[36px] p-0 text-base font-bold text-white bg-cyan-400 hover:bg-cyan-300 rounded-full flex-shrink-0 flex items-center justify-center"
                                            title="Game Help"
                                        >
                                            ?
                                        </Button>
                                    </div>
                                    <AmountInput value={betAmount} onChange={handleAmountChange} disabled={disabled} />
                                    {renderMineCount()}
                                    <BetNumberInput value={autoBetCount} disabled={disabled} onChange={handleBetCount} />
                                    <MineCustomInput
                                        onChange={(value) => {
                                            setOnWinP(value);
                                        }}
                                        value={onWinP}
                                        label={"On Win"}
                                        disabled={disabled}
                                    />
                                    <MineCustomInput
                                        onChange={(value) => {
                                            setOnLossP(value);
                                        }}
                                        value={onLossP}
                                        label={"On Loss"}
                                        disabled={disabled}
                                    />
                                    {renderStopProfitAmount()}
                                    {renderStopLossAmount()}
                                    {renderBetBtn()}
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4 mb-2 mt-3">
                                        <div className="flex-1 [&>div]:mt-0">
                                    <SwitchTab onChange={handleTabChange} active={activeTab} disabled={disabled} />
                                        </div>
                                        <Button 
                                            onClick={() => setShowHelp(true)} 
                                            className="w-[36px] h-[36px] min-w-[36px] p-0 text-base font-bold text-white bg-cyan-400 hover:bg-cyan-300 rounded-full flex-shrink-0 flex items-center justify-center"
                                            title="Game Help"
                                        >
                                            ?
                                        </Button>
                                    </div>
                                    <AmountInput value={betAmount} onChange={handleAmountChange} disabled={disabled} />

                                    {status === GAME_STATUS.READY && renderMineCount()}
                                    {status === GAME_STATUS.LIVE && renderMineStatus()}
                                    {status === GAME_STATUS.LIVE && <ProfitAmount
                                        disabled={disabled}
                                        multiplier={profitAndOdds.probability}
                                        profit={profitAndOdds.roundedWinAmount}
                                        animateProbability={showProbabilityAnimation}
                                        icon={
                                            <QubSvg />
                                        } />}
                                    {status === GAME_STATUS.LIVE && renderRandomPickBtn()}
                                    {renderBetBtn()}
                                </div>
                            )}
                            </div>
                        </div>
                    )}

                    {isMobile &&
                        (isAuto ? (
                            <div className="game-panel w-full">
                                <div className="game-panel-header">
                                    <div className="flex items-center gap-1.5">
                                        <span className="terminal-dot" style={{background:'#ff5f57'}}></span>
                                        <span className="terminal-dot" style={{background:'#febc2e'}}></span>
                                        <span className="terminal-dot" style={{background:'#28c840'}}></span>
                                    </div>
                                    <span className="text-xs font-mono text-cyan-400/80 tracking-wider">💎 MINE</span>
                                </div>
                                <div className="game-panel-body">
                                {renderBetBtn()}
                                <AmountInput value={betAmount} onChange={handleAmountChange} disabled={disabled} />
                                {renderMineCount()}
                                <BetNumberInput value={autoBetCount} disabled={disabled} onChange={handleBetCount} />
                                <MineCustomInput
                                    onChange={(value) => {
                                        setOnWinP(value);
                                    }}
                                    value={onWinP}
                                    label={"On Win"}
                                    disabled={disabled}
                                />
                                <MineCustomInput
                                    onChange={(value) => {
                                        setOnLossP(value);
                                    }}
                                    value={onLossP}
                                    label={"On Loss"}
                                    disabled={disabled}
                                />
                                {renderStopProfitAmount()}
                                {renderStopLossAmount()}
                                <SwitchTab onChange={handleTabChange} active={activeTab} disabled={disabled} />
                                </div>
                            </div>
                        ) : (
                            <div className="game-panel w-full">
                                <div className="game-panel-header">
                                    <div className="flex items-center gap-1.5">
                                        <span className="terminal-dot" style={{background:'#ff5f57'}}></span>
                                        <span className="terminal-dot" style={{background:'#febc2e'}}></span>
                                        <span className="terminal-dot" style={{background:'#28c840'}}></span>
                                    </div>
                                    <span className="text-xs font-mono text-cyan-400/80 tracking-wider">💎 MINE</span>
                                </div>
                                <div className="game-panel-body">
                                <AmountInput value={betAmount} onChange={handleAmountChange} disabled={disabled} />
                                {renderBetBtn()}
                                {status === GAME_STATUS.READY && renderMineCount()}
                                {status === GAME_STATUS.LIVE && renderMineStatus()}
                                {status === GAME_STATUS.LIVE && <ProfitAmount
                                    disabled={disabled}
                                    multiplier={profitAndOdds.probability}
                                    profit={profitAndOdds.roundedWinAmount}
                                    icon={
                                        <QubSvg />
                                    } />}
                                <SwitchTab onChange={handleTabChange} active={activeTab} disabled={disabled} />
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <GameGuide isOpen={showHelp} onClose={() => setShowHelp(false)} gameName="mine" />

            {/* Cashout Confirmation Modal */}
            <Modal isOpen={showCashoutConfirm} onClose={handleCashoutCancel}>
                <div className="p-6 text-white bg-black/95 backdrop-blur-xl rounded-xl border border-cyan-400/20">
                    <h3 className="text-xl font-bold mb-4">Confirm Cashout</h3>
                    <p className="text-gray-300 mb-6">
                        Are you sure you want to cash out? This will end your current game and claim your rewards.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button 
                            variant="bordered" 
                            onPress={handleCashoutCancel}
                            className="text-white border-gray-600"
                        >
                            No
                        </Button>
                        <Button 
                            color="success" 
                            onPress={handleCashoutConfirm}
                            className="text-white bg-cyan-400 hover:bg-cyan-300"
                        >
                            Yes
                        </Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default MineGame