"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Users,
    Layers,
    CreditCard,
    ShoppingBag,
    BarChart3,
    Settings as SettingsIcon,
    HeadphonesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface NavItemProps {
    href: string;
    label: string;
    icon: any;
    isActive: boolean;
    showPendingDot?: boolean;
}

function NavItem({ href, label, icon: Icon, isActive, showPendingDot }: NavItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2 px-6 py-2 border-b-2 transition-all duration-200 shrink-0 relative",
                isActive
                    ? "border-primary text-primary font-bold bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
        >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{label}</span>
            {showPendingDot && (
                <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500 shrink-0"
                    aria-label="Pending support tickets"
                />
            )}
        </Link>
    );
}

export function AdminNav({ currentPath }: { currentPath: string }) {
    const [pendingSupportCount, setPendingSupportCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${API_BASE_URL}/support/tickets/pending-count`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data?.status === "success" && typeof data?.data?.count === "number") {
                    setPendingSupportCount(data.data.count);
                }
            })
            .catch(() => setPendingSupportCount(0));
    }, [currentPath]);

    const navItems = [
        { href: "/admin", label: "Users", icon: Users },
        { href: "/admin/plans", label: "Plans", icon: Layers },
        { href: "/admin/gateways", label: "Payment Gateways", icon: CreditCard },
        { href: "/admin/purchases", label: "Purchases", icon: ShoppingBag },
        { href: "/admin/analytics", label: "Global Analytics", icon: BarChart3 },
        { href: "/admin/support", label: "Support", icon: HeadphonesIcon },
        { href: "/admin/settings", label: "Admin Settings", icon: SettingsIcon },
    ];

    return (
        <div className="flex items-center border-b mb-6 bg-card/50 overflow-x-auto scrollbar-hide flex-nowrap">
            {navItems.map((item) => (
                <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={currentPath === item.href}
                    showPendingDot={item.href === "/admin/support" && pendingSupportCount > 0}
                />
            ))}
        </div>
    );
}
