
'use client'
import React, { useEffect, useState } from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarMenuToggle,
    NavbarMenuItem,
    NavbarMenu,
    NavbarContent,
    NavbarItem,
    Link,
    Button,
} from "@heroui/react";
import { MenuList } from "@/components/Sidebar/menulist";
import { useQubicConnect } from "@/components/CONNECT/QubicConnectContext";
import ConnectModal from "@/components/CONNECT/ConnectModal";
import WithdrawModal from "@/components/WithdrawModal";
import Modal from "@/components/Modal";

const CustomNavbar = () => {

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = React.useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = React.useState(false);

    const { connected, wallet, disconnect, showConnectModal, toggleConnectModal, walletBalances } = useQubicConnect();

    function truncateMiddle(str: string): string {
        if (str.length <= 8) return str;
        return `${str.slice(0, 4)}...${str.slice(-4)}`;
    }

    const handleDisconnect = async () => {
        await disconnect();
        setIsDisconnectModalOpen(false);
    };

    return (
        <Navbar isBordered isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} classNames={
            {
                base: "sm:backdrop-blur-none h-[74px] bg-black text-white shadow-md",
            }
        }>
            <NavbarContent className="sm:hidden" justify="start">
                <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
            </NavbarContent>

            <NavbarContent className="sm:hidden pr-3" justify="center">
                <NavbarBrand>
                    <img
                        src="/assets/image/logo.png"
                        alt="QDoge Casino"
                        className="h-8 w-auto"
                    />
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarBrand>
                    <img
                        src="/assets/image/logo.png"
                        alt="QDoge Casino"
                        className="h-8 w-auto"
                    />
                </NavbarBrand>
                {/* <NavbarItem>
                    <Link color="foreground" href="#">
                        Features
                    </Link>
                </NavbarItem>
                <NavbarItem isActive>
                    <Link aria-current="page" href="#">
                        Customers
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Integrations
                    </Link>
                </NavbarItem> */}
            </NavbarContent>

            <NavbarContent justify="end">
                <NavbarItem>
                    {connected && wallet ? (
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end mr-2">
                                <p className="text-xs text-gray-400">Balance</p>
                                <p className="text-sm font-bold text-white">
                                    {walletBalances.qubic.toLocaleString()} QUBIC
                                </p>
                            </div>
                            <Button 
                                color="success" 
                                variant="flat" 
                                className="border border-success-500 text-white hover:bg-success-500/20" 
                                onPress={() => toggleConnectModal()}
                            >
                                {truncateMiddle(wallet.publicKey)}
                            </Button>
                            <Button 
                                color="primary" 
                                variant="flat" 
                                size="sm"
                                className="border border-primary-500 text-white hover:bg-primary-500/20 font-semibold" 
                                onPress={() => setIsWithdrawModalOpen(true)}
                            >
                                Withdraw
                            </Button>
                            <Button 
                                color="danger" 
                                variant="flat" 
                                size="sm"
                                className="border border-red-500 text-white hover:bg-red-500/20 font-semibold" 
                                onPress={() => setIsDisconnectModalOpen(true)}
                            >
                                Disconnect
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            color="primary" 
                            variant="flat" 
                            className="border border-primary-500 text-white hover:bg-primary-500 font-semibold" 
                            onPress={() => toggleConnectModal()}
                        >
                            Connect Wallet
                        </Button>
                    )}
                </NavbarItem>
            </NavbarContent>

            <NavbarMenu className="bg-dark-900/20 px-12 flex flex-col items-center justify-center gap-4">
                {MenuList.map((item, index) => (
                    <NavbarMenuItem key={`${item}-${index}`} className="w-1/2 bg-dark-500 py-2 px-4 rounded-lg">
                        <Link
                            className="text-white w-full hover:text-success-500"
                            color={
                                "foreground"
                            }
                            href={item.path}
                            size="lg"
                        >
                            {item.title}
                        </Link>
                    </NavbarMenuItem>
                ))}
            </NavbarMenu>
            <ConnectModal open={showConnectModal} onClose={() => toggleConnectModal(false)} />
            <WithdrawModal open={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
            
            {/* Disconnect Confirmation Modal */}
            <Modal 
                isOpen={isDisconnectModalOpen} 
                onClose={() => setIsDisconnectModalOpen(false)}
            >
                <div className="p-6 text-white bg-[#1a1a1a] rounded-lg border border-gray-700 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">Disconnect Wallet</h3>
                    <p className="text-gray-300 mb-6">
                        Are you sure you want to disconnect your wallet? You can reconnect anytime by clicking 'Connect Wallet'.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button 
                            variant="bordered" 
                            onPress={() => setIsDisconnectModalOpen(false)}
                            className="text-white border-gray-600"
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="danger" 
                            onPress={async () => {
                                await disconnect();
                                setIsDisconnectModalOpen(false);
                            }}
                            className="text-white"
                        >
                            Disconnect
                        </Button>
                    </div>
                </div>
            </Modal>
        </Navbar>
    );
}

export default CustomNavbar;