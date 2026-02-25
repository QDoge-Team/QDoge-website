"use client";
import React from "react";
import Modal from "./Modal";
import { Button } from "@heroui/react";
import { IoClose } from "react-icons/io5";

interface GameGuideProps {
    isOpen: boolean;
    onClose: () => void;
    gameName: "slide" | "crash" | "mine" | "videopoker";
}

const gameGuides = {
    slide: {
        title: "SLIDE Game Guide",
        steps: [
            {
                title: "How to Play",
                content: "SLIDE is a fast-paced betting game where you predict if the multiplier will reach your target before the game crashes."
            },
            {
                title: "Step 1: Place Your Bet",
                content: "1. Enter your bet amount in QU tokens\n2. Set your target multiplier (e.g., 2x, 5x, 10x)\n3. Click 'Bet' or 'Place Bet (next round)'\n4. Confirm the transaction in your wallet"
            },
            {
                title: "Step 2: Wait for Round",
                content: "After placing your bet, wait for the betting phase to end. The game will then start sliding through multipliers."
            },
            {
                title: "Step 3: Win Conditions",
                content: "You WIN if the multiplier reaches or exceeds your target before the game crashes.\nYou LOSE if the game crashes before reaching your target."
            },
            {
                title: "Rewards",
                content: "If you win, your reward is calculated as: Bet Amount × Target Multiplier\nRewards are automatically transferred to your wallet after the game ends."
            },
            {
                title: "Auto Bet Mode",
                content: "Enable Auto Bet to automatically place bets using your saved settings:\n- Set number of bets (0 = infinite)\n- Set Stop on Profit to stop after reaching a profit goal\n- Set Stop on Loss to stop after losing a certain amount"
            },
            {
                title: "Tips",
                content: "• Lower targets (1.5x-2x) have higher win probability but lower payouts\n• Higher targets (10x+) have lower win probability but much higher payouts\n• Always bet what you can afford to lose\n• Use Auto Bet with caution and set stop limits"
            }
        ]
    },
    crash: {
        title: "CRASH Game Guide",
        steps: [
            {
                title: "How to Play",
                content: "CRASH is a multiplier game where you bet and try to cash out before the game crashes. The longer you wait, the higher your multiplier, but the higher the risk of losing everything."
            },
            {
                title: "Step 1: Place Your Bet",
                content: "1. Enter your bet amount in QU tokens\n2. Optionally set an auto-cashout target multiplier\n3. Click 'Place Bet (next round)' during the waiting phase\n4. Confirm the transaction in your wallet"
            },
            {
                title: "Step 2: Watch the Multiplier",
                content: "After the round starts, watch the multiplier climb. You can cash out at any time before the game crashes."
            },
            {
                title: "Step 3: Cash Out",
                content: "Click 'CASHOUT' to collect your winnings. Your payout = Bet Amount × Current Multiplier\nIf the game crashes before you cash out, you lose your bet."
            },
            {
                title: "Rewards",
                content: "Rewards are calculated as: Bet Amount × Multiplier when you cash out\nRewards are automatically transferred to your wallet and your balance updates after confirmation."
            },
            {
                title: "Auto Bet & Auto Cashout",
                content: "• Auto Bet: Automatically places bets for multiple rounds\n• Auto Cashout: Automatically cashes out at your target multiplier\n• Use Stop on Profit/Loss to manage risk"
            },
            {
                title: "Tips",
                content: "• Cash out early for consistent small wins\n• Hold longer for bigger payouts but higher risk\n• Set auto-cashout for hands-free play\n• Never bet more than you can afford to lose"
            }
        ]
    },
    mine: {
        title: "MINE Game Guide",
        steps: [
            {
                title: "How to Play",
                content: "MINE is a strategy game where you reveal tiles to find gems while avoiding mines. The more gems you find, the higher your multiplier, but hitting a mine ends the game."
            },
            {
                title: "Step 1: Set Up Your Game",
                content: "1. Enter your bet amount in QU tokens\n2. Choose the number of mines (1-24)\n3. More mines = higher risk but higher multipliers\n4. Click 'BET' to start"
            },
            {
                title: "Step 2: Confirm Transaction",
                content: "Confirm the transaction in your wallet. The game will start after the transaction is confirmed."
            },
            {
                title: "Step 3: Reveal Tiles",
                content: "Click on tiles to reveal them:\n• 🟢 Gem: You win! Continue revealing for higher multipliers\n• 🔴 Mine: Game over, you lose your bet\n• The more gems you reveal, the higher your payout multiplier"
            },
            {
                title: "Step 4: Cash Out or Continue",
                content: "You can cash out at any time to secure your winnings, or continue revealing tiles for a higher multiplier. The multiplier increases with each gem found."
            },
            {
                title: "Rewards",
                content: "Your payout = Bet Amount × Multiplier (based on probability of current gems found)\nRewards are automatically transferred to your wallet after cashing out."
            },
            {
                title: "Auto Bet Mode",
                content: "In Auto Bet mode:\n• Select tiles before starting (or use auto-selection)\n• The game automatically reveals your selected tiles\n• Set bet count, stop on profit/loss limits\n• Adjust On Win/Loss % to modify bet size"
            },
            {
                title: "Tips",
                content: "• Start with fewer mines (3-5) to learn the game\n• Cash out early when ahead for consistent wins\n• More gems revealed = higher multiplier but higher risk\n• Use random tile picker if you're unsure\n• Always set stop limits in Auto Bet mode"
            }
        ]
    },
    videopoker: {
        title: "VIDEO POKER Game Guide",
        steps: [
            {
                title: "How to Play",
                content: "VIDEO POKER is a classic poker game where you try to make the best possible 5-card poker hand. You're dealt 5 cards, choose which to hold, and then draw new cards to complete your hand."
            },
            {
                title: "Step 1: Place Your Bet",
                content: "1. Enter your bet amount in QU tokens\n2. Click 'Bet' to start the game\n3. Confirm the transaction in your wallet\n4. You'll receive 5 cards"
            },
            {
                title: "Step 2: Choose Cards to Hold",
                content: "After receiving your initial 5 cards:\n• Click on cards you want to KEEP (they will be highlighted)\n• Cards you don't click will be replaced\n• You can hold 0 to 5 cards\n• Strategy: Hold pairs, high cards, or cards that form potential winning hands"
            },
            {
                title: "Step 3: Draw New Cards",
                content: "Click 'Deal' to replace the cards you didn't hold:\n• New cards will be dealt for the positions you didn't hold\n• Your final hand will be evaluated\n• Payouts are based on your final hand ranking"
            },
            {
                title: "Winning Hands & Payouts",
                content: "Hand rankings (from highest to lowest):\n• Royal Flush: A, K, Q, J, 10 of same suit (800x)\n• Straight Flush: 5 consecutive cards, same suit (60x)\n• 4 of a Kind: Four cards of same rank (22x)\n• Full House: Three of a kind + pair (9x)\n• Flush: 5 cards of same suit (6x)\n• Straight: 5 consecutive cards (4x)\n• 3 of a Kind: Three cards of same rank (3x)\n• 2 Pair: Two pairs (2x)\n• Pair of Jacks or Better: Pair of J, Q, K, or A (1x)"
            },
            {
                title: "Rewards",
                content: "Your payout = Bet Amount × Hand Multiplier\nExample: Bet 10 QU with a Full House = 10 × 9 = 90 QU\nRewards are automatically transferred to your wallet after the game ends."
            },
            {
                title: "Tips",
                content: "• Always hold pairs of Jacks or higher\n• Hold 4 cards to a flush or straight over a low pair\n• Keep high cards (A, K, Q, J) when you have 2 or more\n• Don't break up a winning hand to chase a better one\n• Practice with small bets to learn strategy\n• Remember: You need at least a Pair of Jacks to win"
            }
        ]
    }
};

const GameGuide: React.FC<GameGuideProps> = ({ isOpen, onClose, gameName }) => {
    const guide = gameGuides[gameName];

    if (!guide) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-black/95 backdrop-blur-xl text-white rounded-xl max-h-[90vh] overflow-y-auto border border-cyan-400/20">
                <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-cyan-400/15 p-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{guide.title}</h2>
                    <Button
                        isIconOnly
                        variant="light"
                        onClick={onClose}
                        className="text-white hover:bg-gray-800"
                    >
                        <IoClose size={24} />
                    </Button>
                </div>
                <div className="p-6 space-y-6">
                    {guide.steps.map((step, index) => (
                        <div key={index} className="space-y-2">
                            <h3 className="text-lg font-semibold text-cyan-400 flex items-center font-mono">
                                <span className="w-8 h-8 rounded-full bg-cyan-400 text-black font-bold flex items-center justify-center mr-3 text-sm font-mono">
                                    {index + 1}
                                </span>
                                {step.title}
                            </h3>
                            <div className="ml-11 text-gray-300 whitespace-pre-line leading-relaxed">
                                {step.content}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="sticky bottom-0 bg-black/95 backdrop-blur-xl border-t border-cyan-400/15 p-4 flex justify-end">
                    <Button
                        onClick={onClose}
                        className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono"
                    >
                        Got it!
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default GameGuide;
