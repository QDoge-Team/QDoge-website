
'use client'
import React, { useEffect, useState } from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
    Button,
} from "@heroui/react";
import { usePathname } from "next/navigation";
import { MenuList } from "@/components/Sidebar/menulist";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import ConnectModal from "@/components/CONNECT/ConnectModal";
import WithdrawModal from "@/components/WithdrawModal";
import Modal from "@/components/Modal";

const CustomNavbar = () => {

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = React.useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = React.useState(false);
    const pathname = usePathname();

    const { connected, wallet, disconnect, showConnectModal, toggleConnectModal, walletBalances } = useQubicConnect();

    function truncateMiddle(str: string): string {
        if (str.length <= 8) return str;
        return `${str.slice(0, 4)}...${str.slice(-4)}`;
    }

    // Get current page name for breadcrumb
    const currentPage = pathname.split("/").pop() || "home";
    const pageTitle = MenuList.find(m => m.path === currentPage)?.title || 
                      (currentPage === "landing" ? "Lobby" : currentPage.charAt(0).toUpperCase() + currentPage.slice(1));

    const handleDisconnect = async () => {
        await disconnect();
        setIsDisconnectModalOpen(false);
    };

    return (
        <>
        <Navbar isBordered isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} classNames={
            {
                base: "sm:backdrop-blur-xl h-[64px] bg-black/80 backdrop-blur-xl text-white border-b border-cyan-400/10 shadow-[0_1px_30px_rgba(0,0,0,0.5)]",
            }
        }>
            <NavbarContent className="sm:hidden" justify="start">
                <button
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="text-cyan-400 p-2 focus:outline-none"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    )}
                </button>
            </NavbarContent>

            <NavbarContent className="sm:hidden pr-3" justify="center">
                <NavbarBrand>
                    <img
                        src="/assets/image/qdoge-logo-small.png"
                        alt="QDoge Casino"
                        className="h-8 w-auto border border-cyan-400/30 rounded-full shadow-[0_0_12px_rgba(0,243,255,0.15)]"
                    />
                    <span className="ml-2 text-cyan-400 font-mono text-xs tracking-[0.15em]">QDOGE</span>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex gap-6" justify="center">
                <NavbarBrand className="gap-3">
                    <img
                        src="/assets/image/qdoge-logo-small.png"
                        alt="QDoge Casino"
                        className="h-8 w-auto border border-cyan-400/25 rounded-full shadow-[0_0_15px_rgba(0,243,255,0.1)] transition-shadow hover:shadow-[0_0_20px_rgba(0,243,255,0.25)]"
                    />
                    <div className="flex flex-col">
                        <span className="text-cyan-400 font-mono text-xs tracking-[0.2em] leading-none">QDOGE<span className="text-gray-600">::</span><span className="text-gray-500">CASINO</span></span>
                        {/* Breadcrumb */}
                        <div className="nav-breadcrumb mt-0.5">
                            <span>home</span>
                            <span className="separator">/</span>
                            <span className="current">{pageTitle.toLowerCase()}</span>
                        </div>
                    </div>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent justify="end">
                <NavbarItem>
                    {connected && wallet ? (
                        <div className="flex items-center gap-2">
                            {/* Balance display */}
                            <div className="hidden sm:flex items-center gap-3 mr-1 px-4 py-2 rounded-xl bg-black/60 border border-cyan-400/10">
                                <div className="flex flex-col items-end">
                                    <p className="text-[9px] text-gray-500 font-mono tracking-[0.2em] leading-none">BALANCE</p>
                                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                                        {walletBalances.qubic.toLocaleString()} <span className="text-cyan-400/40 text-[10px]">QUBIC</span>
                                    </p>
                                </div>
                                <div className="w-[1px] h-6 bg-cyan-400/10" />
                                <div className="flex flex-col items-end">
                                    <p className="text-[9px] text-gray-500 font-mono tracking-[0.2em] leading-none">QDOGE</p>
                                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                                        {walletBalances.qdoge.toLocaleString()} <span className="text-purple-400/40 text-[10px]">QDG</span>
                                    </p>
                                </div>
                            </div>
                            {/* Wallet address */}
                            <button 
                                className="cyber-button !py-1.5 !px-3 !text-[10px] !tracking-wider !rounded-lg"
                                onClick={() => toggleConnectModal()}
                            >
                                <span className="font-mono">{truncateMiddle(wallet.publicKey)}</span>
                            </button>
                            {/* Withdraw */}
                            <button 
                                className="cyber-button cyber-button--secondary !py-1.5 !px-3 !text-[10px] !rounded-lg hidden sm:inline-flex !tracking-wider"
                                onClick={() => setIsWithdrawModalOpen(true)}
                            >
                                WITHDRAW
                            </button>
                            {/* Disconnect */}
                            <button 
                                className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all text-xs"
                                onClick={() => setIsDisconnectModalOpen(true)}
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="cyber-button !text-xs !tracking-[0.15em] !rounded-lg"
                            onClick={() => toggleConnectModal()}
                        >
                            <span className="mr-1.5 text-sm">⟁</span> CONNECT
                        </button>
                    )}
                </NavbarItem>
            </NavbarContent>
        </Navbar>

        {/* ─── Custom Left-Side Mobile Drawer ─── */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[9999]" style={{ top: 0 }}>
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    {/* Drawer panel — slides from left */}
                    <div 
                        className="absolute top-0 left-0 h-full w-[280px] bg-black/95 backdrop-blur-xl border-r border-cyan-400/10 shadow-[4px_0_30px_rgba(0,0,0,0.8)] flex flex-col overflow-y-auto"
                        style={{ animation: 'slideInLeft 0.25s ease-out' }}
                    >
                        {/* Drawer header */}
                        <div className="flex items-center justify-between p-4 border-b border-cyan-400/10">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/assets/image/qdoge-logo-small.png"
                                    alt="QDoge"
                                    className="h-7 w-auto rounded-full border border-cyan-400/20"
                                />
                                <span className="text-cyan-400 font-mono text-xs tracking-[0.15em]">QDOGE</span>
                            </div>
                            <button
                                className="text-gray-400 hover:text-white p-1"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Mobile balance */}
                        {connected && wallet && (
                            <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-black/60 border border-cyan-400/10">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[9px] text-gray-500 font-mono tracking-[0.2em]">WALLET BALANCE</p>
                                    <div className="network-status">
                                        <span className="dot" />
                                        <span>LIVE</span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-base font-bold text-white font-mono">{walletBalances.qubic.toLocaleString()}</p>
                                        <p className="text-[9px] text-cyan-400/50 font-mono tracking-widest">QUBIC</p>
                                    </div>
                                    <div className="w-[1px] bg-cyan-400/10" />
                                    <div>
                                        <p className="text-base font-bold text-white font-mono">{walletBalances.qdoge.toLocaleString()}</p>
                                        <p className="text-[9px] text-purple-400/50 font-mono tracking-widest">QDOGE</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Game menu items */}
                        <nav className="flex flex-col gap-1 p-3 flex-1">
                            {MenuList.map((item, index) => (
                                <Link
                                    key={`${item.path}-${index}`}
                                    className={`sidebar-menu-item w-full ${pathname.endsWith(item.path) ? "active" : ""}`}
                                    href={item.path}
                                    onPress={() => setIsMenuOpen(false)}
                                >
                                    <span className="menu-icon">{item.icon}</span>
                                    <span className="menu-text">
                                        <span className="menu-title">{item.title}</span>
                                        <span className="menu-desc">{item.desc}</span>
                                    </span>
                                </Link>
                            ))}
                        </nav>

                        {/* Mobile actions */}
                        {connected && wallet && (
                            <div className="flex gap-2 p-4 border-t border-cyan-400/10">
                                <button 
                                    className="cyber-button cyber-button--secondary flex-1 !text-[10px] !tracking-wider"
                                    onClick={() => { setIsWithdrawModalOpen(true); setIsMenuOpen(false); }}
                                >
                                    WITHDRAW
                                </button>
                                <button 
                                    className="cyber-button cyber-button--danger flex-1 !text-[10px] !tracking-wider"
                                    onClick={() => { setIsDisconnectModalOpen(true); setIsMenuOpen(false); }}
                                >
                                    DISCONNECT
                                </button>
                            </div>
                        )}

                        {/* Bottom info */}
                        <div className="p-4 border-t border-cyan-400/8">
                            <div className="network-status mb-2">
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
                </div>
            )}
            <ConnectModal open={showConnectModal} onClose={() => toggleConnectModal(false)} />
            <WithdrawModal open={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
            
            {/* Disconnect Confirmation Modal */}
            <Modal 
                isOpen={isDisconnectModalOpen} 
                onClose={() => setIsDisconnectModalOpen(false)}
            >
                <div className="game-panel w-full max-w-md">
                    <div className="game-panel-header">
                        <div className="dots">
                            <span className="dot dot-r" />
                            <span className="dot dot-y" />
                            <span className="dot dot-g" />
                        </div>
                        <span className="panel-title">Disconnect</span>
                    </div>
                    <div className="game-panel-body">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-red-400 text-xl">⚠</span>
                            <h3 className="text-base font-mono text-white tracking-wide">Disconnect Wallet</h3>
                        </div>
                        <p className="text-gray-500 text-xs font-mono mb-6 leading-relaxed">
                            Are you sure you want to disconnect your wallet? You can reconnect at any time.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button 
                                className="cyber-button cyber-button--secondary !text-xs !py-2 !px-5"
                                onClick={() => setIsDisconnectModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="cyber-button cyber-button--danger !text-xs !py-2 !px-5"
                                onClick={async () => {
                                    await disconnect();
                                    setIsDisconnectModalOpen(false);
                                }}
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}

export default CustomNavbar;