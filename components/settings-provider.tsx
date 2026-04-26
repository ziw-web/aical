"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface BrandingConfig {
    appName: string;
    primaryColor: string;
    logoLight: string;
    logoDark: string;
    favicon: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
    appName: 'aical',
    primaryColor: '#8078F0',
    logoLight: '/images/logo_black.png',
    logoDark: '/images/logo_white.png',
    favicon: '/favicon.ico'
};

const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

// Resolve branding URLs: uploaded files are served from the backend, defaults from frontend
function resolveBrandingUrl(path: string): string {
    if (path.startsWith("/uploads/")) {
        return `${BACKEND_BASE_URL}${path}`;
    }
    return path;
}

interface SettingsContextType {
    timeFormat: "12" | "24";
    googleSheetsConnected: boolean;
    googleSheetsConfig: any;
    branding: BrandingConfig;
    resolveBrandingUrl: (path: string) => string;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
    timeFormat: "12",
    googleSheetsConnected: false,
    googleSheetsConfig: null,
    branding: DEFAULT_BRANDING,
    resolveBrandingUrl: (path: string) => path,
    refreshSettings: async () => { },
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [timeFormat, setTimeFormat] = useState<"12" | "24">("12");
    const [googleSheetsConnected, setGoogleSheetsConnected] = useState(false);
    const [googleSheetsConfig, setGoogleSheetsConfig] = useState<any>(null);
    const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);

    // Fetch public settings (branding) — no auth required
    useEffect(() => {
        const fetchPublicSettings = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/settings/public`);
                if (response.data?.status === "success" && response.data.data.branding) {
                    const b = response.data.data.branding;
                    const newBranding: BrandingConfig = {
                        appName: b.appName || DEFAULT_BRANDING.appName,
                        primaryColor: b.primaryColor || DEFAULT_BRANDING.primaryColor,
                        logoLight: b.logoLight || DEFAULT_BRANDING.logoLight,
                        logoDark: b.logoDark || DEFAULT_BRANDING.logoDark,
                        favicon: b.favicon || DEFAULT_BRANDING.favicon,
                    };
                    setBranding(newBranding);

                    // Inject CSS custom property
                    document.documentElement.style.setProperty('--brand-primary', newBranding.primaryColor);
                }
            } catch (err) {
                console.error("Failed to load public settings", err);
            }
        };
        fetchPublicSettings();
    }, []);

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
            branding,
            resolveBrandingUrl,
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
