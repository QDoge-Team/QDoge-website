import formatAmount from "@/util/formatAmount";

const ResultModal = ({ visible, data, Currency }: {
    visible: boolean;
    data: {
        odds: number;
        profit: any;
        coin: any;
    };
    Currency: any
}) => {
    if (!visible) return <></>;
    return (
        <div className="absolute left-1/2 top-1/2 opacity-95 z-10">
            <div className="w-40 h-32 absolute left-[-5rem] top-[-4rem] pb-3 rounded-xl bg-black/95 backdrop-blur-sm text-sm shadow-neon-lg border-2 border-cyan-400/60 text-center animate-zoomIn">
                <div className="flex flex-col items-center p-4">
                    <div className="text-cyan-400 font-mono font-bold text-4xl leading-[1.5] drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                        {data.odds.toFixed(2)}×
                    </div>
                    <div className="inline-flex items-center">
                        <div className="text-green-400 font-mono font-bold whitespace-nowrap tabular-nums text-sm drop-shadow-[0_0_6px_rgba(57,255,20,0.4)]">
                            +{formatAmount(data.profit)}
                        </div>
                        <div className="w-[20px] px-1">
                            {Currency}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultModal;