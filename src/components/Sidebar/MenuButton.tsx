"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuButtonProps {
    icon: string;
    title: string;
    path: string;
    desc?: string;
    badge?: string;
}

const MenuButton = ({ icon, title, path, desc, badge }: MenuButtonProps) => {
    const pathname = usePathname()
    const currentPath = pathname.split("/")[pathname.split("/").length - 1]
    const isActive = path === currentPath;

    return (
        <Link 
            href={path} 
            className={`sidebar-menu-item ${isActive ? "active" : ""}`}
        >
            <span className="menu-icon">{icon}</span>
            <span className="menu-text">
                <span className="menu-title">{title}</span>
                {desc && <span className="menu-desc">{desc}</span>}
            </span>
            {isActive && (
                <span className="ml-auto flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
                </span>
            )}
        </Link>
    )
}

export default MenuButton