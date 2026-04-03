"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Bot,
    Megaphone,
    Phone,
    UserCog,
    Settings,
    ShieldCheck,
    Hash,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const mainMenuItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Leads",
        href: "/leads",
        icon: Users,
    },
    {
        title: "Phone Numbers",
        href: "/phone-numbers",
        icon: Hash,
    },
    {
        title: "AI Agents",
        href: "/agents",
        icon: Bot,
    },
    {
        title: "Campaigns",
        href: "/campaigns",
        icon: Megaphone,
    },
    {
        title: "Call Logs",
        href: "/call-logs",
        icon: Phone,
    },
];

const secondaryMenuItems = [
    {
        title: "Admin",
        href: "/admin",
        icon: ShieldCheck,
        adminOnly: true,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                setUser(JSON.parse(userStr));
            }
        } catch (error) {
            console.error("Error parsing user:", error);
        }
    }, [pathname]);

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={cn(
                "fixed left-0 top-0 h-screen w-64 border-r bg-background z-50 transition-transform duration-300 lg:translate-x-0 outline-none shadow-xl lg:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between border-b px-6">
                    <Link href="/dashboard" className="flex items-center" onClick={onClose}>
                        <Logo width={160} height={45} />
                    </Link>
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-4rem)]">
                    <div className="flex flex-col h-full justify-between p-4 min-h-[calc(100vh-6rem)]">
                        <nav className="flex flex-col gap-1">
                            {mainMenuItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                const Icon = item.icon;

                                return (
                                    <Link key={item.href} href={item.href} onClick={onClose}>
                                        <Button
                                            variant={isActive ? "default" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-3",
                                                isActive && "bg-primary text-primary-foreground"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {item.title}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </nav>

                        <nav className="flex flex-col gap-1 pt-4 border-t mt-auto">
                            {secondaryMenuItems.map((item) => {
                                // Check if item is admin only
                                if (item.adminOnly && (!user || (user.role !== 'admin' && !user.isSuperAdmin))) {
                                    return null;
                                }

                                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                const Icon = item.icon;

                                return (
                                    <Link key={item.href} href={item.href} onClick={onClose}>
                                        <Button
                                            variant={isActive ? "default" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-3",
                                                isActive && "bg-primary text-primary-foreground"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {item.title}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </ScrollArea>
            </div>
        </>
    );
}
