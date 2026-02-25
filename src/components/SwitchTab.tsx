// Render switch tab (Manual/Auto)
const SwitchTab = ({ active, options, disabled, onChange, type }: { disabled?: boolean, active: number, options?: string[], onChange: (e: number) => void, type?: string }) => (
    <div className={`flex flex-row gap-1 p-1 ${type === "sub" ? "" : "rounded-lg "} bg-black/60 border border-cyan-400/15 mt-3`}>
        {(options || ["Manual", "Auto"]).map((label, index) => (
            <button
                key={index}
                className={`flex-1 ${type === "sub" ? "" : "rounded-md "} font-mono text-xs tracking-wide hover:bg-cyan-400/10 py-2 px-2.5 transition-all ${disabled ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-pointer"
                    } ${active === index ? "bg-cyan-400/15 text-cyan-400 shadow-[inset_0_0_10px_rgba(0,243,255,0.05)]" : "bg-transparent"}`}
                onClick={() => !disabled && onChange(index)}
                disabled={disabled}
            >
                {label}
            </button>
        ))}
    </div>
);


export default SwitchTab;