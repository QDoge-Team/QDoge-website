import { Button } from "@heroui/react";
import { MINE_OBJECT, MineArea, MineButtonProps } from "./types";



const MineButton = ({ point, mine, isAuto, onClick }: MineButtonProps) => {
  const handleClick = () => {
    onClick(point);
  };

  const renderMineContent = (mine: MineArea | undefined) => {
    if (!mine?.mined) return null;

    const isGem = mine.mine === MINE_OBJECT.GEM;
    const isBomb = mine.mine === MINE_OBJECT.BOMB;

    if (isGem) {
      return (
        <div className="gem-animation">
          <img
            src="/assets/image/jewellery.png"
            alt="jewellery"
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    if (isBomb) {
      return (
        <div className="mine-animation relative">
          <img
            src={'/assets/image/mineEffect.webp'}
            className="z-10 absolute inset-0 w-full h-full"
            alt="mine effect"
          />
          <img
            src="/assets/image/sad.png"
            alt="sad"
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    return null;
  };

  const svgContent = renderMineContent(mine) || (
    <div className="w-full relative pb-full" />
  );

  // Determine button style based on state
  const getButtonClassName = () => {
    const baseClass = "p-2 w-full h-full rounded-lg aspect-square";
    // Transparent thin blocks
    const autoClass = isAuto ? "bg-purple-500/30 border border-purple-500/50" : "bg-white/10 border border-cyan-400/20 hover:bg-cyan-400/5";
    
    if (mine?.mined) {
      // Revealed tile
      if (mine.mine === MINE_OBJECT.GEM) {
        return `${baseClass} bg-white/30 gem-glow ${isAuto && "border-[5px] border-[#9000ff]"}`;
      } else if (mine.mine === MINE_OBJECT.BOMB) {
        return `${baseClass} bg-red-800/60 mine-glow`;
      }
    }
    
    // Hidden tile (transparent with thin border)
    return `${baseClass} ${autoClass}`;
  };

  return (
    <Button
      className={getButtonClassName()}
      onClick={handleClick}
      disabled={mine?.mined}
    >
      {svgContent}
    </Button>
  );
};

export default MineButton