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
            <div style={{ fontSize: "27px" }} className={cn("relative", className)}>
                ai<span style={{ color: "#8078f0e6" }}>cal</span>
            </div>
        );
    }

    if (variant === "white") {
        return (
            <div style={{ fontSize: "27px" }} className={cn("relative", className)}>
                ai<span style={{ color: "#8078f0e6" }}>cal</span>
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            <Image
                src="/images/logo_black.png"
                alt="aical AI Logo"
                width={width}
                height={height}
                className="dark:hidden block"
                priority
            />
            <Image
                src="/images/logo_white.png"
                alt="aical AI Logo"
                width={width}
                height={height}
                className="hidden dark:block"
                priority
            />
        </div>
    );
}
