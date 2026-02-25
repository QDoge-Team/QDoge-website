import React, { useState, useEffect } from "react";
import { InfinitySvg } from "./svgs";

// Render profit amount field
type props = {
    disabled: boolean,
    value: number;
    onChange: (v: number) => void;
    Icon?: any
}

const BetNumberInput: React.FC<props> = ({ disabled, value, onChange, Icon }) => {
    const [displayValue, setDisplayValue] = useState<string>(String(value || ''));

    // Sync with external value prop changes
    useEffect(() => {
        setDisplayValue(String(value || ''));
    }, [value]);

    return (
        <div className="mt-2">
            <div className="d-flex justify-between">
                <p className={`text-sm ${disabled ? "text-gray-500" : "text-gray-300"} font-bold font-mono`}>
                    Number of Bets
                </p>
            </div>
            <div
                className={`flex w-full rounded-full items-center border border-cyan-400/15 hover:border-cyan-400/30 ${disabled ? "bg-black/40" : "bg-black/60"
                    } rounded p-1.5 transition-colors`}
            >
                <input
                    disabled={disabled}
                    type="number"
                    value={displayValue}
                    onChange={(e) => {
                        const val = e.target.value;
                        setDisplayValue(val);
                        // Allow empty string, convert to 0 on blur or when empty
                        const numValue = val === '' ? 0 : Number(val);
                        if (!isNaN(numValue) && numValue >= 0) {
                            onChange(numValue);
                        }
                    }}
                    onBlur={(e) => {
                        // Convert empty string to 0 on blur
                        const val = e.target.value;
                        if (val === '') {
                            setDisplayValue('0');
                            onChange(0);
                        } else {
                            const numValue = Number(val);
                            if (isNaN(numValue) || numValue < 0) {
                                setDisplayValue('0');
                                onChange(0);
                            } else {
                                setDisplayValue(String(numValue));
                                onChange(numValue);
                            }
                        }
                    }}
                    className={`${disabled ? "bg-black/40" : "bg-black/60"
                        } text-white w-[90%] flex-1 text-sm focus:outline-none font-mono`}
                />
                {value === 0 && (
                    <div className="w-5">
                        <InfinitySvg />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BetNumberInput;