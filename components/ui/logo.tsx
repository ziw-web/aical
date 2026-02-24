"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    variant?: "auto" | "black" | "white";
}

export function Logo({ className, width = 140, height = 40, variant = "auto" }: LogoProps) {
    if (variant === "black") {
        return (
            <div className={cn("relative", className)}>
                <Image
                    src="/images/logo_black.png"
                    alt="IntelliCall AI Logo"
                    width={width}
                    height={height}
                    priority
                />
            </div>
        );
    }

    if (variant === "white") {
        return (
            <div className={cn("relative", className)}>
                <Image
                    src="/images/logo_white.png"
                    alt="IntelliCall AI Logo"
                    width={width}
                    height={height}
                    priority
                />
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            <Image
                src="/images/logo_black.png"
                alt="IntelliCall AI Logo"
                width={width}
                height={height}
                className="dark:hidden block"
                priority
            />
            <Image
                src="/images/logo_white.png"
                alt="IntelliCall AI Logo"
                width={width}
                height={height}
                className="hidden dark:block"
                priority
            />
        </div>
    );
}
