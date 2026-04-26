import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/auth-provider";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700"],
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export async function generateMetadata(): Promise<Metadata> {
  let appName = "aical";
  let faviconUrl = "/favicon.ico";
  try {
    const res = await fetch(`${API_BASE_URL}/settings/public`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      appName = data?.data?.branding?.appName || appName;
      const dbFavicon = data?.data?.branding?.favicon;
      if (dbFavicon) {
        faviconUrl = dbFavicon.startsWith('/uploads/')
          ? `${API_BASE_URL.replace(/\/api$/, '')}${dbFavicon}`
          : dbFavicon;
      }
    }
  } catch { }
  // Append cache-buster to force browser re-fetch on branding changes
  const cacheBuster = `v=${Date.now()}`;
  const finalFaviconUrl = `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}${cacheBuster}`;

  return {
    title: `${appName} - Dashboard`,
    description: "AI-powered outbound calling platform",
    icons: {
      icon: [
        { url: finalFaviconUrl, sizes: 'any' },
      ],
    },
  };
}

import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/components/settings-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sora.variable} suppressHydrationWarning>
      <body className={`${sora.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <SettingsProvider>
              <DashboardLayout>{children}</DashboardLayout>
              <Toaster />
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
