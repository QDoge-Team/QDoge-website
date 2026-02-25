import { usePathname } from "next/navigation";
import CustomNavbar from "./navbar";
import Sidebar from "./sidebar";

const Layout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    const path = usePathname()

    return (
        <div className="flex flex-col min-h-screen bg-cyber-gradient relative">
            {/* Retro grid overlay */}
            <div className="bg-retro-grid" />
            
            {/* Ambient floating particles */}
            <div className="ambient-particles">
                <span /><span /><span /><span />
                <span /><span /><span /><span />
            </div>

            <CustomNavbar />
            <main className="flex-grow flex relative z-10">
                <Sidebar />
                <div className="content-wrapper w-full overflow-y-auto">
                    {children}
                </div>
            </main>
            
            {/* Enhanced footer */}
            <footer className="footer-enhanced">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/assets/image/qdoge-logo-small.png" 
                            alt="QDoge" 
                            className="h-6 w-auto opacity-50"
                        />
                        <span className="text-[10px] font-mono text-gray-600 tracking-widest">
                            &copy; 2026 QDOGE CASINO
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-mono text-gray-600 tracking-wider hover:text-cyan-400/40 transition-colors cursor-pointer">TERMS</span>
                        <span className="text-cyan-400/10">|</span>
                        <span className="text-[10px] font-mono text-gray-600 tracking-wider hover:text-cyan-400/40 transition-colors cursor-pointer">PROVABLY FAIR</span>
                        <span className="text-cyan-400/10">|</span>
                        <span className="text-[10px] font-mono text-gray-600 tracking-wider hover:text-cyan-400/40 transition-colors cursor-pointer">SUPPORT</span>
                    </div>
                    <div className="network-status">
                        <span className="dot" />
                        <span>QUBIC</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}


export default Layout;