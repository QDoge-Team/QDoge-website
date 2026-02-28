import MenuButton from "@/components/Sidebar/MenuButton"
import { MenuList } from "@/components/Sidebar/menulist"

const Sidebar = () => {
    return (
        <div className="hidden md:w-[260px] bg-black/80 backdrop-blur-xl flex-shrink-0 md:flex flex-col relative">
            {/* Gradient right border */}
            <div className="absolute right-0 top-0 bottom-0 glow-separator-v" />

            {/* Terminal header */}
            <div className="game-panel-header">
                <div className="dots">
                    <span className="dot dot-r" />
                    <span className="dot dot-y" />
                    <span className="dot dot-g" />
                </div>
                <span className="panel-title">Game Rooms</span>
            </div>

            {/* Menu items */}
            <nav className="flex flex-col gap-1 p-3 pt-4 flex-1">
                {MenuList.map((menu, index) => (
                    <MenuButton {...menu} key={index} />
                ))}
            </nav>

            {/* Bottom info section */}
            <div className="p-4 border-t border-cyan-400/8">
                <div className="network-status mb-3">
                    <span className="dot" />
                    <span>QUBIC NETWORK</span>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-gray-600 tracking-widest">
                    <span>QDOGE v2.0</span>
                    <span className="text-cyan-400/30">◆</span>
                    <span>CASINO</span>
                </div>
            </div>
        </div>
    )
}

export default Sidebar