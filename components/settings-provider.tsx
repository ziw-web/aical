"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface SettingsContextType {
    timeFormat: "12" | "24";
    googleSheetsConnected: boolean;
    googleSheetsConfig: any;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
    timeFormat: "12",
    googleSheetsConnected: false,
    googleSheetsConfig: null,
    refreshSettings: async () => { },
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [timeFormat, setTimeFormat] = useState<"12" | "24">("12");
    const [googleSheetsConnected, setGoogleSheetsConnected] = useState(false);
    const [googleSheetsConfig, setGoogleSheetsConfig] = useState<any>(null);

    const fetchSettings = React.useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                const settings = response.data.data.settings;
                setTimeFormat(settings.timeFormat || "12");
                setGoogleSheetsConnected(settings.googleSheetsConnected || false);
                setGoogleSheetsConfig(settings.googleSheetsConfig || null);
            }
        } catch (err) {
            console.error("Failed to load settings in provider", err);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{
            timeFormat,
            googleSheetsConnected,
            googleSheetsConfig,
            refreshSettings: fetchSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function formatTime(dateInput: string | Date | undefined, format: "12" | "24") {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: format === "12"
    });
}
