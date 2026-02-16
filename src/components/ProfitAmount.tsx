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
        <p className={`text-sm ${disabled ? "text-[#879097]" : "text-[#c5c5c5]"} font-bold`}>
            Total profit <span className={animateProbability ? "probability-explosion-container" : ""}>
                <span className={animateProbability ? "probability-slide-in inline-block" : ""}>{`(${multiplier})x`}</span>
            </span>
        </p>
        <div
            className={`rounded-full flex w-full items-center  border-[2px] border-[#2f4553] hover:border-[#557086] ${disabled ? "bg-[#172c38]" : "bg-[#0f212e]"
                } rounded p-1.5`}
        >
            <input
                disabled={disabled}
                type="number"
                value={Math.floor(profit)}
                className={`${disabled ? "bg-[#172c38]" : "bg-[#0f212e]"
                    } text-white  w-[90%] flex-1 text-sm focus:outline-none`}
            />
            <div className="w-5">
                {icon}
            </div>
        </div>
    </div>
);

export default ProfitAmount