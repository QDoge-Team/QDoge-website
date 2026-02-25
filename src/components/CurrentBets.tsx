import CurrencyIcon from "./CurrencyIcon";

export const DefaultAvatar = () => {
    return <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"
        style={{ width: "20px", height: "20px" }}>
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
            <path
                d="M5 21C5 17.134 8.13401 14 12 14C15.866 14 19 17.134 19 21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        </g>
    </svg>
}

const CurrentBets = ({ bets }: { bets: any[] }) => {
    return (
        <div className="mt-5">
            <div className="h-[250px] overflow-y-auto bg-black/60 backdrop-blur-sm border border-cyan-400/10 rounded-lg">
                {bets.map((row, index) => (
                    <div
                        key={index}
                        className={`flex px-3 py-1.5 items-center hover:bg-cyan-400/5 justify-between transition-colors ${index % 2 === 0 ? "bg-black/20" : ""}`}
                    >
                        <div className="flex items-center w-3/5">
                            {!row?.avatar ? (
                                <div className="text-stone-100" style={{ width: "30px" }}>
                                    <DefaultAvatar />
                                </div>
                            ) : (
                                <img
                                    alt={row.name}
                                    src={row?.avatar || "default.png"}
                                    className="w-8 h-8 rounded-full"
                                />
                            )}
                            <div className="text-xs px-1 font-[14px] text-gray-300 max-w-sm overflow-hidden text-ellipsis whitespace-nowrap font-mono">
                                {row.name || row.playerID}
                            </div>
                        </div>
                        <div className="text-xs text-center text-cyan-400/80 font-bold font-mono">
                            {row?.stoppedAt
                                ? `${row?.stoppedAt?.toFixed(2)}x`
                                : `${row.target}x`}
                        </div>
                        <div className="flex justify-center items-center">
                            <div className="w-4">
                                <CurrencyIcon />
                            </div>
                            <span
                                className={`text-xs px-1 font-mono ${row.stoppedAt ? "text-cyan-400" : "text-gray-400"
                                    } font-bold`}
                            >{`${row.stoppedAt
                                ? Math.floor((row.stoppedAt / 100) * row.betAmount)
                                : Math.floor(row.betAmount)
                                }`}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CurrentBets;