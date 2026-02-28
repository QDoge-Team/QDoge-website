import CurrencyIcon from "./CurrencyIcon";
import Input from "./Input";

type props = { onChange: Function, disabled?: boolean, value: number, className?: string, label?: string, amount?: number };

const AmountInput: React.FC<props> = ({ onChange, disabled, value, className, label, amount }) => (
    <div className="mt-2 flex flex-col">
        <div className="flex justify-between">
            <p className={`text-xs font-mono tracking-wide ${disabled ? "text-gray-600" : "text-gray-400"}`}>
                {label || "Amount"}
            </p>
            <div className="text-xs font-mono text-cyan-400/50">
                ${amount || 0}
            </div>
        </div>
        <div className={`flex bg-black/60 rounded-lg overflow-hidden text-white border border-cyan-400/15 hover:border-cyan-400/30 transition-colors ${className}`}>
            <Input onChange={(e: number) => onChange(e)} value={value} disabled={disabled} type="number" icon={<CurrencyIcon />} />
            <div className="flex relative">
                <button
                    disabled={disabled}
                    onClick={() => onChange(Math.floor(value / 2))}
                    className={`px-2 text-cyan-400/50 font-mono text-sm focus:outline-none ${disabled ? "cursor-not-allowed" : "hover:bg-cyan-400/10 hover:text-cyan-400"} ${disabled ? '' : 'active:scale-90 transform'} transition-colors`}
                >
                    ½
                </button>
                <div className={`absolute w-[1px] bg-cyan-400/15 left-[46%] top-[20%] bottom-[25%] transform -translate-x-1/2`} />
                <button
                    disabled={disabled}
                    onClick={() => onChange(Math.floor(value * 2))}
                    className={`px-2 text-cyan-400/50 font-mono text-sm focus:outline-none ${disabled ? "cursor-not-allowed" : "hover:bg-cyan-400/10 hover:text-cyan-400"} ${disabled ? '' : 'active:scale-90 transform'} transition-colors`}
                >
                    2×
                </button>
            </div>
        </div>
    </div>
);


export default AmountInput;