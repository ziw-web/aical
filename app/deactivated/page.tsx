"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert, Mail, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function DeactivatedPage() {
    const router = useRouter();
    const [supportEmail, setSupportEmail] = useState("zowmmo1@gmail.com");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/settings/public`);
                if (response.data?.status === "success") {
                    setSupportEmail(response.data.data.supportEmail || "zowmmo1@gmail.com");
                }
            } catch (err) {
                console.error("Failed to fetch public settings", err);
            }
        };
        fetchSettings();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="w-10 h-10 text-destructive" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sora mb-2">
                Account Deactivated
            </h1>

            <p className="text-muted-foreground text-lg max-w-md mb-8">
                Your account has been deactivated by an administrator. You no longer have access to this platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => window.location.href = `mailto:${supportEmail}`}
                >
                    <Mail className="w-4 h-4" />
                    Contact Support
                </Button>

                <Button
                    variant="ghost"
                    className="flex-1 gap-2"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4" />
                    Log Out
                </Button>
            </div>

            <p className="mt-12 text-sm text-muted-foreground">
                If you believe this is a mistake, please reach out to our team.
            </p>
        </div>
    );
}
