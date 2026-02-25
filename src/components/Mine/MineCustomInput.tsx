'use client'
import { useEffect, useState } from "react";
import { PercentSvg } from "../svgs";

const MineCustomInput = ({
  disabled,
  onChange,
  value,
  label,
}: {
  disabled: boolean;
  onChange: (e: number) => void;
  value: number;
  label: string;
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [inputValue, seInputValue] = useState(value);
  const [displayValue, setDisplayValue] = useState<string>(String(value || ''));

  // Sync displayValue with inputValue when inputValue changes externally
  useEffect(() => {
    setDisplayValue(String(inputValue || ''));
  }, [inputValue]);

  // Sync inputValue with value prop when value changes externally
  useEffect(() => {
    seInputValue(value);
  }, [value]);

  const handleChange = (val: string) => {
    setDisplayValue(val);
    // Allow empty string, convert to 0 when empty
    const numValue = val === '' ? 0 : Number(val);
    if (!isNaN(numValue) && numValue >= 0) {
      seInputValue(numValue);
      if (visible) {
        onChange(numValue);
      }
    }
  };

  useEffect(() => {
    if (!visible) {
      onChange(0);
    } else {
      onChange(inputValue);
    }
  }, [visible, inputValue]);
  return (
    <div className="mt-2 flex flex-col">
      {label && (
        <p className={`text-sm font-mono ${disabled ? "text-gray-500" : "text-gray-200"}`}>
          {label}
        </p>
      )}
      <div className="flex bg-black/60 border border-cyan-400/15 overflow-hidden p-[1px] rounded-full">
        <button
          className={`px-2 text-gray-500 rounded-l-full focus:outline-none rounded-md text-[.75rem] font-mono hover:bg-cyan-400/15 ${visible == false && "bg-cyan-400/10 text-cyan-400"
            }`}
          onClick={() => !disabled && setVisible(false)}
        >
          Rest
        </button>
        <button
          onClick={() => !disabled && setVisible(true)}
          className={`px-2 text-gray-500 focus:outline-none rounded-md text-[.75rem] text-nowrap font-mono hover:bg-cyan-400/15 ${visible && "bg-cyan-400/10 text-cyan-400"
            }`}
        >
          Increase By:
        </button>
        <div
          className={`flex ${!visible || disabled ? "bg-black/40" : "bg-black/60"
            } rounded-r-full border-cyan-400/15 hover:border-cyan-400/30 w-full transition-colors`}
        >
          <input
            type="number"
            value={visible ? displayValue : String(value || '')}
            min={0}
            disabled={disabled || !visible}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={(e) => {
              // Convert empty string to 0 on blur
              const val = e.target.value;
              if (val === '') {
                setDisplayValue('0');
                seInputValue(0);
                if (visible) {
                  onChange(0);
                }
              } else {
                const numValue = Number(val);
                if (isNaN(numValue) || numValue < 0) {
                  setDisplayValue('0');
                  seInputValue(0);
                  if (visible) {
                    onChange(0);
                  }
                } else {
                  setDisplayValue(String(numValue));
                  seInputValue(numValue);
                  if (visible) {
                    onChange(numValue);
                  }
                }
              }
            }}
            className=" px-3 py-1 text-white bg-transparent w-[80%] focus:outline-none font-mono"
          />
          <div className="flex items-center justify-center pl-2 pr-1.5 w-[35px] ">
            <PercentSvg />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MineCustomInput