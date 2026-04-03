"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
    Loader2,
    DollarSign,
    Save,
    Palette,
    Upload,
    Trash2,
    ImageIcon,
    RotateCcw,
    RefreshCw,
    ExternalLink,
    CheckCircle2,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { AdminNav } from "@/components/admin/nav";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/** Current app version – compared against latest from version API */
const CURRENT_VERSION = "v7.1";

const VERSION_CHECK_URL = "https://envatosupportapi.wixzel.com/api/products/latest-version/61664541";
const INSTALLER_URL = "https://envato.aqeelshamz.com/installer";

const BRANDING_DEFAULTS: Record<string, string> = {
    logoLight: "/images/logo_black.png",
    logoDark: "/images/logo_white.png",
    favicon: "/favicon.ico",
};

function BrandingUpload({
    label,
    description,
    type,
    currentUrl,
    onUploaded,
    onDeleted,
}: {
    label: string;
    description: string;
    type: string;
    currentUrl: string;
    onUploaded: (url: string) => void;
    onDeleted: (defaultUrl: string) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const isUploaded = currentUrl.startsWith("/uploads/");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        try {
            setUploading(true);
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_BASE_URL}/admin/branding/upload`, formData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            if (res.data?.status === "success") {
                onUploaded(res.data.data.url);
                toast.success(`${label} uploaded successfully`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to upload ${label.toLowerCase()}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const token = localStorage.getItem("token");
            const res = await axios.delete(`${API_BASE_URL}/admin/branding/${type}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (res.data?.status === "success") {
                onDeleted(res.data.data.url);
                toast.success(`${label} reverted to default`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to delete ${label.toLowerCase()}`);
        } finally {
            setDeleting(false);
        }
    };

    // Build the preview URL — uploaded files are served from the backend
    const previewSrc = isUploaded
        ? `${API_BASE_URL.replace(/\/api$/, "")}${currentUrl}`
        : currentUrl;

    return (
        <div className="space-y-3">
            <Label>{label}</Label>
            <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                    {currentUrl ? (
                        <img
                            src={previewSrc}
                            alt={label}
                            className="max-w-full max-h-full object-contain p-1"
                        />
                    ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.ico"
                            onChange={handleUpload}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="text-xs"
                        >
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                            {isUploaded ? "Replace" : "Upload"}
                        </Button>
                        {isUploaded && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="text-xs text-destructive hover:text-destructive"
                            >
                                {deleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                                Delete
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                    {isUploaded && (
                        <p className="text-xs text-muted-foreground/60 italic">Custom uploaded • Deleting reverts to default</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any>({
        currency: "USD",
        supportEmail: "",
        branding: {
            appName: "IntelliCallAI",
            primaryColor: "#8078F0",
            logoLight: "/images/logo_black.png",
            logoDark: "/images/logo_white.png",
            favicon: "/favicon.ico",
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [versionCheckLoading, setVersionCheckLoading] = useState(false);
    const [versionCheckError, setVersionCheckError] = useState<string | null>(null);

    const checkForUpdates = useCallback(async () => {
        try {
            setVersionCheckLoading(true);
            setVersionCheckError(null);
            const res = await axios.get<{ version: string }>(VERSION_CHECK_URL);
            const version = res.data?.version ?? null;
            setLatestVersion(version);
        } catch (err: any) {
            setVersionCheckError(err.message || "Failed to check for updates");
            setLatestVersion(null);
        } finally {
            setVersionCheckLoading(false);
        }
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/admin/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success" && response.data.data.settings) {
                const s = response.data.data.settings;
                setSettings({
                    currency: s.currency || "USD",
                    supportEmail: s.supportEmail || "support@intellicall.ai",
                    branding: {
                        appName: s.branding?.appName || "IntelliCallAI",
                        primaryColor: s.branding?.primaryColor || "#8078F0",
                        logoLight: s.branding?.logoLight || "/images/logo_black.png",
                        logoDark: s.branding?.logoDark || "/images/logo_white.png",
                        favicon: s.branding?.favicon || "/favicon.ico",
                    }
                });
            }
        } catch (err: any) {
            toast.error("Failed to load admin settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        checkForUpdates();
    }, [checkForUpdates]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const response = await axios.post(`${API_BASE_URL}/admin/settings`, settings, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                toast.success("Settings saved successfully");
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (err: any) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const updateBranding = (key: string, value: string) => {
        setSettings({
            ...settings,
            branding: { ...settings.branding, [key]: value }
        });
    };

    const handleResetBranding = async () => {
        try {
            setResetting(true);
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_BASE_URL}/admin/branding/reset`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data?.status === "success") {
                setSettings({
                    ...settings,
                    branding: res.data.data.branding
                });
                toast.success("Branding reset to defaults");
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (err: any) {
            toast.error("Failed to reset branding");
        } finally {
            setResetting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-sora">Admin Settings</h1>
                <p className="text-muted-foreground">Global platform configurations.</p>
            </div>

            <AdminNav currentPath="/admin/settings" />

            <div className="grid gap-6 max-w-4xl">
                {/* Branding Card */}
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-primary" />
                                    Branding
                                </CardTitle>
                                <CardDescription className="mt-1.5">Customize your platform's identity. Changes apply across the entire application.</CardDescription>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-xs text-muted-foreground shrink-0">
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        Reset to Default
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Reset Branding to Defaults?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will reset the app name, primary color, logos, and favicon to their original default values. Any uploaded custom images will be permanently deleted. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleResetBranding}
                                            disabled={resetting}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                                            Reset All
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="appName">App Name</Label>
                                <Input
                                    id="appName"
                                    placeholder="IntelliCallAI"
                                    value={settings.branding.appName}
                                    onChange={(e) => updateBranding("appName", e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Displayed across the platform, emails, and footer.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryColor">Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="primaryColor"
                                        type="color"
                                        value={settings.branding.primaryColor}
                                        onChange={(e) => updateBranding("primaryColor", e.target.value)}
                                        className="w-14 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={settings.branding.primaryColor}
                                        onChange={(e) => updateBranding("primaryColor", e.target.value)}
                                        placeholder="#8078F0"
                                        className="font-mono text-sm"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Used for accents, buttons, and highlights.</p>
                            </div>
                        </div>

                        <div className="border-t border-border pt-6 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <BrandingUpload
                                    label="Light Mode Logo"
                                    description="Logo shown in light mode (dark-colored logo). PNG, SVG recommended."
                                    type="logoLight"
                                    currentUrl={settings.branding.logoLight}
                                    onUploaded={(url) => updateBranding("logoLight", url)}
                                    onDeleted={(url) => updateBranding("logoLight", url)}
                                />
                                <BrandingUpload
                                    label="Dark Mode Logo"
                                    description="Logo shown in dark mode (light-colored logo). PNG, SVG recommended."
                                    type="logoDark"
                                    currentUrl={settings.branding.logoDark}
                                    onUploaded={(url) => updateBranding("logoDark", url)}
                                    onDeleted={(url) => updateBranding("logoDark", url)}
                                />
                            </div>

                            <BrandingUpload
                                label="Favicon"
                                description="Browser tab icon. Supports .ico, .png, and .svg."
                                type="favicon"
                                currentUrl={settings.branding.favicon}
                                onUploaded={(url) => updateBranding("favicon", url)}
                                onDeleted={(url) => updateBranding("favicon", url)}
                            />
                        </div>

                        {/* Preview */}
                        <div className="mt-4 p-4 rounded-xl border border-dashed border-border bg-muted/20">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Preview</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: settings.branding.primaryColor }} />
                                <span className="font-bold text-foreground">{settings.branding.appName || "Your App"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Updates Card */}
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-primary" />
                            Updates
                        </CardTitle>
                        <CardDescription>Check for the latest version and update via the web installer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="text-sm">
                                <span className="text-muted-foreground">Current version: </span>
                                <span className="font-semibold">{CURRENT_VERSION}</span>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={checkForUpdates}
                                disabled={versionCheckLoading}
                            >
                                {versionCheckLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                ) : (
                                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Check for updates
                            </Button>
                        </div>
                        {versionCheckError && (
                            <p className="text-sm text-destructive">{versionCheckError}</p>
                        )}
                        {!versionCheckLoading && latestVersion != null && (
                            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                                {latestVersion !== CURRENT_VERSION ? (
                                    <>
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            <span className="text-primary">Update available</span>
                                            <span className="text-muted-foreground font-normal">— Latest is {latestVersion}</span>
                                        </p>
                                        <a
                                            href={INSTALLER_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                                        >
                                            Open web installer
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    </>
                                ) : (
                                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                                        You&apos;re on the latest version ({CURRENT_VERSION}).
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* General Settings Card */}
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            General Settings
                        </CardTitle>
                        <CardDescription>Basic configurations for the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currency">Global Currency</Label>
                            <Select
                                value={settings.currency}
                                onValueChange={(val) => setSettings({ ...settings, currency: val })}
                            >
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Select Currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                    <SelectItem value="AUD">AUD ($)</SelectItem>
                                    <SelectItem value="ZAR">ZAR (R)</SelectItem>
                                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supportEmail">Support Email</Label>
                            <Input
                                id="supportEmail"
                                type="email"
                                placeholder="support@example.com"
                                value={settings.supportEmail}
                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                className="max-w-md"
                            />
                            <p className="text-xs text-muted-foreground">The email address users should contact for support and account issues.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Settings
                    </Button>
                </div>
            </div>
        </div>
    );
}
