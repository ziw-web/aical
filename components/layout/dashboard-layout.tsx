"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isAuthPage = pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/auth/callback" ||
        pathname === "/" ||
        pathname === "/deactivated" ||
        pathname === "/about" ||
        pathname === "/contact" ||
        pathname === "/privacy" ||
        pathname === "/terms";

    // Close sidebar on navigation for mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="lg:ml-64 mt-16 p-6">
                {children}
            </main>
        </div>
    );
}
