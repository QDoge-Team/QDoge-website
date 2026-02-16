import { QubSvg } from "../svgs";
import { MineModalPropsType } from "./types";

const MineModal = ({ visible, data }: MineModalPropsType) => {
  if (!visible) return <></>;
  return (
    <div className="absolute left-1/2 top-1/2 opacity-90 z-10">
      <div className="w-36 h-28 absolute left-[-4.5rem] top-[-3rem] pb-3 rounded-md bg-[#1a2c38] text-sm shadow-md border-4 border-[#00e701] text-center animate-zoomIn">
        <div className="flex flex-col items-center p-4">
          <div className="text-[#00e701] font-bold text-4xl leading-[1.5]">
            {data.odds.toFixed(2)}×
          </div>
          <div className="inline-flex items-center">
            <div className="text-[#00e701] font-bold whitespace-nowrap tabular-nums reward-amount heartbeat-glow">
              {data.profit}
            </div>
            <div className="w-[20px] px-1">
              <QubSvg />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .reward-amount {
          color: #ffd700;
          text-shadow: 
            0 0 10px #ffd700,
            0 0 20px #ffd700,
            0 0 30px #ffd700,
            0 0 40px #ffd700;
        }

        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          10% {
            transform: scale(1.1);
          }
          20% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.15);
          }
          40% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          60% {
            transform: scale(1);
          }
        }

        @keyframes golden-glow {
          0%, 100% {
            text-shadow: 
              0 0 10px #ffd700,
              0 0 20px #ffd700,
              0 0 30px #ffd700,
              0 0 40px #ffd700;
          }
          50% {
            text-shadow: 
              0 0 20px #ffd700,
              0 0 40px #ffd700,
              0 0 60px #ffd700,
              0 0 80px #ffd700,
              0 0 100px #ffd700;
          }
        }

        .heartbeat-glow {
          animation: heartbeat 1.5s ease-in-out infinite, golden-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MineModal
