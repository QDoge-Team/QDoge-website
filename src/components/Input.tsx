import React, { useState, useEffect } from "react";

type props = { icon?: any, type?: string, value: string | number, onChange?: Function, disabled?: boolean, className?: string }
const Input: React.FC<props> = ({ icon, type, onChange, value, disabled, className }) => {
    // Internal state to allow empty string while user is typing
    const [displayValue, setDisplayValue] = useState<string>(String(value || ''));

    // Sync with external value prop changes
    useEffect(() => {
        setDisplayValue(String(value || ''));
    }, [value]);

    return <div className={`flex ${disabled ? "bg-[#2b2f3a]" : "bg-[#1f2937]"
        } rounded-full outline-none border border-white/10 hover:border-[#4b5563] w-full ${className || ""}`}>
        <input
            disabled={disabled}
            type={type || "number"} 
            onChange={(e) => {
                const val = e.target.value;
                // Allow empty input or integer-only values
                if (val === '' || /^\d+$/.test(val)) {
                    setDisplayValue(val);
                    // Pass 0 for empty string, or parsed integer
                    onChange && onChange(val === '' ? 0 : parseInt(val, 10));
                }
            }} 
            value={displayValue}
            min={0} 
            step={1} 
            className="outline-none h-full w-full p-[7px] px-2 focus:outline-none bg-transparent text-white" />
        {icon &&
            <div className="flex items-center justify-center p-1 w-[30px] ">
                {icon}
            </div>
        }
    </div>
}

export default Input;
