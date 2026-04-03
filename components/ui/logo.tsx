"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/settings-provider";

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    variant?: "auto" | "black" | "white";
}

export function Logo({ className, width = 140, height = 40, variant = "auto" }: LogoProps) {
    const { branding, resolveBrandingUrl } = useSettings();
    const lightSrc = resolveBrandingUrl(branding.logoLight);
    const darkSrc = resolveBrandingUrl(branding.logoDark);

    if (variant === "black") {
        return (
            <div className={cn("relative", className)}>
                <img
                    src={lightSrc}
                    alt={`${branding.appName} Logo`}
                    width={width}
                    height={height}
                />
            </div>
        );
    }

    if (variant === "white") {
        return (
            <div className={cn("relative", className)}>
                <img
                    src={darkSrc}
                    alt={`${branding.appName} Logo`}
                    width={width}
                    height={height}
                />
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            <img
                src={lightSrc}
                alt={`${branding.appName} Logo`}
                width={width}
                height={height}
                className="dark:hidden block"
            />
            <img
                src={darkSrc}
                alt={`${branding.appName} Logo`}
                width={width}
                height={height}
                className="hidden dark:block"
            />
        </div>
    );
}
