import React, { useState, useEffect } from "react";
import { QubSvg } from "../svgs";

interface StopProfitInputProps {
    value: number;
    onChange: (value: number) => void;
    disabled: boolean;
    label: string;
}

const StopProfitInput: React.FC<StopProfitInputProps> = ({ value, onChange, disabled, label }) => {
    const [displayValue, setDisplayValue] = useState<string>(String(value || ''));

    useEffect(() => {
        setDisplayValue(String(value || ''));
    }, [value]);

    return (
        <div className="mt-2">
            <p className={`text-sm ${disabled ? "text-[#879097]" : "text-white"}`}>
                {label}
            </p>
            <div
                className={`flex w-full items-center  border-[2px] border-[#2f4553] hover:border-[#557086] ${disabled ? "bg-[#172c38]" : "bg-[#0f212e]"
                    } rounded-full p-1.5`}
            >
                <input
                    disabled={disabled}
                    type="number"
                    value={displayValue}
                    onChange={(e: any) => {
                        const val = e.target.value;
                        setDisplayValue(val);
                        // Allow empty string, convert to 0 when empty
                        const numValue = val === '' ? 0 : Number(val);
                        if (!isNaN(numValue) && numValue >= 0) {
                            onChange(numValue);
                        }
                    }}
                    onBlur={(e: any) => {
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
                    className={`${disabled ? "bg-[#172c38]" : "bg-[#0f212e]"
                        } text-white  w-[90%] flex-1 text-sm focus:outline-none`}
                />
                <div className="w-5">
                    <QubSvg />
                </div>
            </div>
        </div>
    );
};

export default StopProfitInput;
