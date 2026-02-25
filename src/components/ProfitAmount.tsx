import React from "react";

// Render profit amount field
type props = {
    disabled: boolean,
    multiplier: number;
    profit: number;
    icon: any;
    animateProbability?: boolean;
}
const ProfitAmount: React.FC<props> = ({ disabled, multiplier, profit, icon, animateProbability }) => (
    <div className="mt-2">
        <p className={`text-sm ${disabled ? "text-gray-500" : "text-gray-300"} font-bold font-mono`}>
            Total profit <span className={animateProbability ? "probability-explosion-container" : ""}>
                <span className={animateProbability ? "probability-slide-in inline-block" : ""}>{`(${multiplier})x`}</span>
            </span>
        </p>
        <div
            className={`rounded-full flex w-full items-center border border-cyan-400/15 hover:border-cyan-400/30 ${disabled ? "bg-black/40" : "bg-black/60"
                } rounded p-1.5 transition-colors`}
        >
            <input
                disabled={disabled}
                type="number"
                value={Math.floor(profit)}
                className={`${disabled ? "bg-black/40" : "bg-black/60"
                    } text-white w-[90%] flex-1 text-sm focus:outline-none font-mono`}
            />
            <div className="w-5">
                {icon}
            </div>
        </div>
    </div>
);

export default ProfitAmount