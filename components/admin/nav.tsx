"use client";

import Link from "next/link";
import {
    Users,
    Layers,
    CreditCard,
    ShoppingBag,
    BarChart3,
    Settings as SettingsIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
    href: string;
    label: string;
    icon: any;
    isActive: boolean;
}

function NavItem({ href, label, icon: Icon, isActive }: NavItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2 px-6 py-2 border-b-2 transition-all duration-200 shrink-0",
                isActive
                    ? "border-primary text-primary font-bold bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
        >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{label}</span>
        </Link>
    );
}

export function AdminNav({ currentPath }: { currentPath: string }) {
    const navItems = [
        { href: "/admin", label: "Users", icon: Users },
        { href: "/admin/plans", label: "Plans", icon: Layers },
        { href: "/admin/gateways", label: "Payment Gateways", icon: CreditCard },
        { href: "/admin/purchases", label: "Purchases", icon: ShoppingBag },
        { href: "/admin/analytics", label: "Global Analytics", icon: BarChart3 },
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
                />
            ))}
        </div>
    );
}
