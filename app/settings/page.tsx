"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, Clock, Phone, Lock, Server, Activity, Settings, ShoppingBag, Key, Webhook, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

import { useSettings } from "@/components/settings-provider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Zap,
    Check,
    CreditCard,
    Plus,
    BarChart3,
    ChevronDown as ChevronDownIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function SettingsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshSettings } = useSettings();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [currency, setCurrency] = useState("$");
    const [currencyCode, setCurrencyCode] = useState("USD");
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [enabledGateways, setEnabledGateways] = useState<any>({
        stripe: false,
        stripeTestMode: true,
        paypal: false,
        paypalTestMode: true,
        paypalClientId: "",
        dodopayments: false,
        dodopaymentsTestMode: true,
        razorpay: false,
        razorpayTestMode: true,
        razorpayKeyId: ""
    });
    const [loadingGateways, setLoadingGateways] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [usage, setUsage] = useState<any>(null);
    const [loadingUsage, setLoadingUsage] = useState(false);
    const [asteriskStatus, setAsteriskStatus] = useState<{
        asteriskConnected: boolean;
        activeSipCalls: number;
    } | null>(null);

    const [apiKeys, setApiKeys] = useState({
        twilioSid: "",
        twilioToken: "",
        openRouterKey: "",
        elevenLabsKey: "",
        deepgramKey: "",
    });

    const [systemSettings, setSystemSettings] = useState({
        recordingEnabled: true,
        autoAnalysisEnabled: false,
        timeFormat: "12",
    });

    const [webhookSettings, setWebhookSettings] = useState({
        url: "",
        secret: "whsec_ae12...8f9c",
        enabled: false,
        events: {
            inboundCall: true,
            outboundCall: true,
            callCompleted: true,
            leadCreated: true,
            leadQualified: true,
            campaignCompleted: true,
        }
    });

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [settingsRes, userRes, plansRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/settings`, { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/plans`)
            ]);

            if (settingsRes.data?.status === "success") {
                const settings = settingsRes.data.data.settings;
                if (settings) {
                    setApiKeys({
                        twilioSid: settings.twilioSid || "",
                        twilioToken: settings.twilioToken || "",
                        openRouterKey: settings.openRouterKey || "",
                        elevenLabsKey: settings.elevenLabsKey || "",
                        deepgramKey: settings.deepgramKey || "",
                    });
                    setSystemSettings({
                        recordingEnabled: settings.recordingEnabled ?? true,
                        autoAnalysisEnabled: settings.autoAnalysisEnabled ?? false,
                        timeFormat: settings.timeFormat || "12",
                    });
                    if (settings.webhooks) {
                        setWebhookSettings({
                            url: settings.webhooks.url || "",
                            secret: settings.webhooks.secret || "",
                            enabled: settings.webhooks.enabled || false,
                            events: {
                                inboundCall: settings.webhooks.events?.inboundCall ?? true,
                                outboundCall: settings.webhooks.events?.outboundCall ?? true,
                                callCompleted: settings.webhooks.events?.callCompleted ?? true,
                                leadCreated: settings.webhooks.events?.leadCreated ?? true,
                                leadQualified: settings.webhooks.events?.leadQualified ?? true,
                                campaignCompleted: settings.webhooks.events?.campaignCompleted ?? true,
                            }
                        });
                    }
                }
            }

            if (userRes.data?.status === "success") {
                setUser(userRes.data.data.user);
            }

            if (plansRes.data?.status === "success") {
                setPlans(plansRes.data.data.plans);
            }

            // Fetch public settings for gateway info
            setLoadingGateways(true);
            const publicSettingsRes = await axios.get(`${API_BASE_URL}/settings/public`);
            if (publicSettingsRes.data?.status === "success") {
                const { currency: cur, gateways: g } = publicSettingsRes.data.data;
                const symbolMap: any = { "USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "AUD": "$", "ZAR": "R" };
                setCurrency(symbolMap[cur] || "$");
                setCurrencyCode(cur || "USD");
                setEnabledGateways(g);
            }

            // Fetch transactions
            setLoadingTransactions(true);
            const transactionsRes = await axios.get(`${API_BASE_URL}/payments/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (transactionsRes.data?.status === "success") {
                setTransactions(transactionsRes.data.data.transactions);
            }

            // Fetch usage
            setLoadingUsage(true);
            const usageRes = await axios.get(`${API_BASE_URL}/users/usage`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (usageRes.data?.status === "success") {
                setUsage(usageRes.data.data);
            }

            // Fetch Asterisk status
            try {
                const astRes = await axios.get(`${API_BASE_URL}/sip-trunks/asterisk/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (astRes.data?.status === "success") {
                    setAsteriskStatus(astRes.data.data);
                }
            } catch {
                // Asterisk endpoint might not exist — that's fine
            }

        } catch (err: any) {
            console.error("Data load error:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                router.push("/login");
                return;
            }
            toast.error("Failed to load settings data");
        } finally {
            setLoading(false);
            setLoadingGateways(false);
            setLoadingTransactions(false);
            setLoadingUsage(false);
        }
    }, [refreshSettings]);

    const verifyStripeSession = useCallback(async (sessionId: string) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/payments/stripe/verify-session?sessionId=${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                toast.success(`Success! You have been upgraded to the ${response.data.data.planName}.`);
                fetchData(); // Refresh user data
                // Clean up URL
                router.replace('/settings');
            }
        } catch (err: any) {
            console.error("Verification error:", err);
            toast.error("Failed to verify payment. Please contact support.");
            router.replace('/settings');
        }
    }, [fetchData, router]);

    const verifyDodoSession = useCallback(async (planId: string) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/payments/dodopayments/verify-session?planId=${planId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                toast.success(`Success! You have been upgraded to the ${response.data.data.planName}.`);
                fetchData(); // Refresh user data
                router.replace('/settings');
            }
        } catch (err: any) {
            console.error("Dodo Verification error:", err);
            toast.error("Failed to verify payment. Please contact support.");
            router.replace('/settings');
        }
    }, [fetchData, router]);



    useEffect(() => {
        fetchData();

        const sessionId = searchParams.get('session_id');
        if (sessionId) {
            verifyStripeSession(sessionId);
        }

        const status = searchParams.get('status');
        const gateway = searchParams.get('gateway');
        const pId = searchParams.get('planId');
        if (status === 'success' && gateway === 'dodopayments' && pId) {
            verifyDodoSession(pId);
        }
    }, [fetchData, searchParams, verifyStripeSession, verifyDodoSession]);

    const handleSaveSettings = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const response = await axios.post(`${API_BASE_URL}/settings`, {
                ...apiKeys,
                ...systemSettings,
                webhooks: webhookSettings
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.status === "success") {
                toast.success("Settings saved successfully!");
                await refreshSettings();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        const testNumber = window.prompt("Enter phone number for basic credential test (+1234567890):");
        if (!testNumber) return;

        try {
            toast.loading("Initiating basic test...", { id: "test-call" });
            const token = localStorage.getItem("token");
            await axios.post(`${API_BASE_URL}/calls/test`, { to: testNumber }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Test call initiated!", { id: "test-call" });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Test failed", { id: "test-call" });
        }
    };

    const handleUpgrade = (plan: any) => {
        setSelectedPlan(plan);
        setIsPaymentModalOpen(true);
    };

    const handleGatewaySelect = async (gateway: string) => {
        if (gateway === "Stripe") {
            try {
                toast.loading("Preparing checkout...", { id: "stripe-checkout" });
                const token = localStorage.getItem("token");
                const response = await axios.post(`${API_BASE_URL}/payments/stripe/create-checkout`, {
                    planId: selectedPlan?._id
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data?.status === "success" && response.data.data.url) {
                    toast.success("Redirecting to secure checkout...", { id: "stripe-checkout" });
                    window.location.href = response.data.data.url;
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to initiate payment", { id: "stripe-checkout" });
            }
            return;
        }

        if (gateway === "Razorpay") {
            try {
                toast.loading("Preparing Razorpay checkout...", { id: "razorpay-checkout" });
                const token = localStorage.getItem("token");
                const response = await axios.post(`${API_BASE_URL}/payments/razorpay/create-order`, {
                    planId: selectedPlan?._id
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data?.status === "success" && response.data.data.order) {
                    const order = response.data.data.order;
                    const options = {
                        key: enabledGateways.razorpayKeyId,
                        amount: order.amount,
                        currency: order.currency,
                        name: "aical AI",
                        description: `Upgrade to ${selectedPlan.name}`,
                        order_id: order.id,
                        handler: async (response: any) => {
                            try {
                                toast.loading("Verifying payment...", { id: "razorpay-verify" });
                                const verifyRes = await axios.post(`${API_BASE_URL}/payments/razorpay/verify`, {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    planId: selectedPlan._id
                                }, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });

                                if (verifyRes.data?.status === "success") {
                                    toast.success(`Success! Plan upgraded to ${verifyRes.data.data.planName}.`, { id: "razorpay-verify" });
                                    setIsPaymentModalOpen(false);
                                    fetchData();
                                }
                            } catch (err: any) {
                                toast.error(err.response?.data?.message || "Verification failed", { id: "razorpay-verify" });
                            }
                        },
                        prefill: {
                            name: user?.name,
                            email: user?.email
                        },
                        theme: {
                            color: "#000000"
                        }
                    };

                    const rzp = new (window as any).Razorpay(options);
                    rzp.open();
                    toast.dismiss("razorpay-checkout");
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to initiate Razorpay", { id: "razorpay-checkout" });
            }
            return;
        }

        if (gateway === "Dodo Payments") {
            try {
                toast.loading("Preparing checkout...", { id: "dodo-checkout" });
                const token = localStorage.getItem("token");
                const response = await axios.post(`${API_BASE_URL}/payments/dodopayments/create-checkout`, {
                    planId: selectedPlan?._id
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data?.status === "success" && response.data.data.url) {
                    toast.success("Redirecting to secure checkout...", { id: "dodo-checkout" });
                    window.location.href = response.data.data.url;
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to initiate payment", { id: "dodo-checkout" });
            }
            return;
        }

        toast.info(`${gateway} payment demo initiated for ${selectedPlan?.name}`);
        // Demo: just close modal
        setIsPaymentModalOpen(false);
    };

    const handleSendTestEvent = async (eventName: string, label: string) => {
        try {
            toast.loading(`Sending ${label} test event...`, { id: "test-webhook" });
            const token = localStorage.getItem("token");
            const response = await axios.post(`${API_BASE_URL}/settings/webhooks/test`, {
                event: eventName
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.status === "success") {
                toast.success(`${label} event delivered successfully!`, { id: "test-webhook" });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to deliver ${label} event.`, { id: "test-webhook" });
        }
    };

    const handleRegenerateSecret = async () => {
        try {
            toast.loading("Regenerating secret...", { id: "regen-secret" });
            const token = localStorage.getItem("token");
            const response = await axios.post(`${API_BASE_URL}/settings/webhooks/regenerate-secret`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.status === "success") {
                setWebhookSettings(prev => ({ ...prev, secret: response.data.data.secret }));
                toast.success("Webhook secret regenerated!", { id: "regen-secret" });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to regenerate secret", { id: "regen-secret" });
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Configure your account, API credentials, and subscription.</p>
            </div>

            <Tabs defaultValue="system" className="w-full">
                <TabsList variant="line" className="flex items-center border-b mb-6 bg-card/50 overflow-x-auto scrollbar-hide flex-nowrap w-full justify-start h-auto p-0 rounded-none border-border shadow-none">
                    <TabsTrigger
                        value="system"
                        className="flex-none flex items-center gap-2 px-6 py-2 rounded-none transition-all duration-200 shrink-0 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:bg-primary/5 border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground hover:text-foreground hover:bg-muted shadow-none bg-transparent !border-x-0 !border-t-0 !shadow-none after:hidden"
                    >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">Preferences</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="api-keys"
                        className="flex-none flex items-center gap-2 px-6 py-2 rounded-none transition-all duration-200 shrink-0 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:bg-primary/5 border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground hover:text-foreground hover:bg-muted shadow-none bg-transparent !border-x-0 !border-t-0 !shadow-none after:hidden"
                    >
                        <Key className="h-4 w-4" />
                        <span className="text-sm">API Keys</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="webhooks"
                        className="flex-none flex items-center gap-2 px-6 py-2 rounded-none transition-all duration-200 shrink-0 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:bg-primary/5 border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground hover:text-foreground hover:bg-muted shadow-none bg-transparent !border-x-0 !border-t-0 !shadow-none after:hidden"
                    >
                        <Webhook className="h-4 w-4" />
                        <span className="text-sm">Webhooks</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="billing"
                        className="flex-none flex items-center gap-2 px-6 py-2 rounded-none transition-all duration-200 shrink-0 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:bg-primary/5 border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground hover:text-foreground hover:bg-muted shadow-none bg-transparent !border-x-0 !border-t-0 !shadow-none after:hidden"
                    >
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm">Plan & Billing</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="transactions"
                        className="flex-none flex items-center gap-2 px-6 py-2 rounded-none transition-all duration-200 shrink-0 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:bg-primary/5 border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground hover:text-foreground hover:bg-muted shadow-none bg-transparent !border-x-0 !border-t-0 !shadow-none after:hidden"
                    >
                        <ShoppingBag className="h-4 w-4" />
                        <span className="text-sm">Transaction History</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="api-keys">
                    <Card>
                        <CardHeader>
                            <CardTitle>Twilio & AI Credentials</CardTitle>
                            <CardDescription>
                                These keys are required to initiate phone calls and power the AI agent.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveSettings} className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="twilio-sid" className="text-xs font-bold uppercase text-muted-foreground">Twilio Account SID</Label>
                                        <Input
                                            id="twilio-sid"
                                            value={apiKeys.twilioSid}
                                            onChange={(e) =>
                                                setApiKeys({ ...apiKeys, twilioSid: e.target.value })
                                            }
                                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            className="font-mono text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="twilio-token" className="text-xs font-bold uppercase text-muted-foreground">Twilio Auth Token</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="twilio-token"
                                                type="password"
                                                value={apiKeys.twilioToken}
                                                onChange={(e) =>
                                                    setApiKeys({ ...apiKeys, twilioToken: e.target.value })
                                                }
                                                placeholder="••••••••••••••••••••••••••••••••"
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="openrouter-key" className="text-xs font-bold uppercase text-muted-foreground">OpenRouter API Key</Label>
                                        <Input
                                            id="openrouter-key"
                                            type="password"
                                            value={apiKeys.openRouterKey}
                                            onChange={(e) =>
                                                setApiKeys({ ...apiKeys, openRouterKey: e.target.value })
                                            }
                                            placeholder="sk-or-••••••••••••••••••••••••••••"
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="elevenlabs-key" className="text-xs font-bold uppercase text-muted-foreground">ElevenLabs API Key</Label>
                                        <Input
                                            id="elevenlabs-key"
                                            type="password"
                                            value={apiKeys.elevenLabsKey}
                                            onChange={(e) =>
                                                setApiKeys({ ...apiKeys, elevenLabsKey: e.target.value })
                                            }
                                            placeholder="••••••••••••••••••••••••••••••••"
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deepgram-key" className="text-xs font-bold uppercase text-muted-foreground">Deepgram API Key</Label>
                                        <Input
                                            id="deepgram-key"
                                            type="password"
                                            value={apiKeys.deepgramKey}
                                            onChange={(e) =>
                                                setApiKeys({ ...apiKeys, deepgramKey: e.target.value })
                                            }
                                            placeholder="••••••••••••••••••••••••••••••••"
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button type="submit" disabled={saving}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="webhooks">
                    <Card className="max-w-3xl">
                        <CardHeader>
                            <CardTitle>Webhook Configuration</CardTitle>
                            <CardDescription>
                                Receive real-time notifications for events in your application via HTTP POST requests.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20 max-w-2xl">
                                <div className="space-y-1">
                                    <Label className="text-sm font-bold uppercase tracking-wider">Enable Webhooks</Label>
                                    <p className="text-xs text-muted-foreground">Toggle to start sending events to your URL.</p>
                                </div>
                                <Switch
                                    checked={webhookSettings.enabled}
                                    onCheckedChange={(checked) => setWebhookSettings({ ...webhookSettings, enabled: checked })}
                                />
                            </div>

                            <div className="grid gap-6 md:grid-cols-1 max-w-2xl mt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="webhook-url" className="text-xs font-bold uppercase text-muted-foreground/80">Payload URL</Label>
                                    <Input
                                        id="webhook-url"
                                        placeholder="https://your-app.com/webhooks"
                                        value={webhookSettings.url}
                                        onChange={(e) => setWebhookSettings({ ...webhookSettings, url: e.target.value })}
                                        className="font-mono text-sm h-11"
                                    />
                                    <p className="text-[11px] text-muted-foreground">Events will be sent as JSON POST requests to this URL.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="webhook-secret" className="text-xs font-bold uppercase text-muted-foreground/80">Signing Secret</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="webhook-secret"
                                            readOnly
                                            value={webhookSettings.secret}
                                            className="font-mono text-sm bg-muted/30"
                                        />
                                        <Button variant="outline" size="sm" onClick={handleRegenerateSecret}>
                                            Regenerate
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">Secures your webhook by signing the payload with HMAC-SHA256.</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t max-w-2xl">
                                <Label className="text-sm font-bold uppercase tracking-wider mb-4 block">Trigger Events</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    {[
                                        { id: 'inboundCall', label: 'Inbound Call Received', desc: 'Sent when an inbound call starts' },
                                        { id: 'outboundCall', label: 'Outbound Call Started', desc: 'Sent when a new outbound call is initiated' },
                                        { id: 'callCompleted', label: 'Call Completed', desc: 'Sent when any call finishes' },
                                        { id: 'leadCreated', label: 'Lead Created', desc: 'Sent when a new lead is added' },
                                        { id: 'leadQualified', label: 'Lead Qualified', desc: 'Sent when AI qualifies a lead' },
                                        { id: 'campaignCompleted', label: 'Campaign Finished', desc: 'Sent when a campaign ends' },
                                    ].map((event) => (
                                        <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-card/50 hover:bg-muted/10 transition-colors">
                                            <Switch
                                                id={`event-${event.id}`}
                                                className="mt-1"
                                                checked={(webhookSettings.events as any)[event.id]}
                                                onCheckedChange={(checked) => {
                                                    setWebhookSettings({
                                                        ...webhookSettings,
                                                        events: { ...webhookSettings.events, [event.id]: checked }
                                                    });
                                                }}
                                            />
                                            <div className="grid gap-0.5 pointer-events-none">
                                                <Label htmlFor={`event-${event.id}`} className="text-sm font-semibold">{event.label}</Label>
                                                <span className="text-[10px] text-muted-foreground leading-tight">{event.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 flex gap-3">
                                <Button onClick={() => handleSaveSettings()} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Webhook Configuration
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            Send Test Event
                                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[200px] rounded-xl">
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendTestEvent('inboundCall', 'Inbound Call')}>
                                            Inbound Call Received
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendTestEvent('outboundCall', 'Outbound Call')}>
                                            Outbound Call Started
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendTestEvent('callCompleted', 'Call Completed')}>
                                            Call Completed
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendTestEvent('leadCreated', 'Lead Created')}>
                                            Lead Created
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendTestEvent('leadQualified', 'Lead Qualified')}>
                                            Lead Qualified
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendTestEvent('campaignCompleted', 'Campaign Finished')}>
                                            Campaign Finished
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing">
                    <div className="grid gap-6">
                        <Card className="rounded-2xl border-slate-100 shadow-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-bold">Your Current Plan</CardTitle>
                                        <CardDescription>Manage your subscription and view usage limits.</CardDescription>
                                    </div>
                                    <Badge className="px-4 py-1 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                                        {user?.plan?.name || "Free Trial"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-muted/30 space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                                            <span>Agents</span>
                                            <span className="text-slate-900 dark:text-slate-100">{usage?.usage?.agents ?? 0} / {usage?.limits?.agents ?? 0}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${Math.min(100, ((usage?.usage?.agents ?? 0) / Math.max(1, usage?.limits?.agents ?? 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-muted/30 space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                                            <span>Campaigns</span>
                                            <span className="text-slate-900 dark:text-slate-100">{usage?.usage?.campaigns ?? 0} / {usage?.limits?.campaigns ?? 0}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${Math.min(100, ((usage?.usage?.campaigns ?? 0) / Math.max(1, usage?.limits?.campaigns ?? 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-muted/30 space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                                            <span>Leads</span>
                                            <span className="text-slate-900 dark:text-slate-100">{usage?.usage?.leads ?? 0} / {usage?.limits?.leads ?? 0}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${Math.min(100, ((usage?.usage?.leads ?? 0) / Math.max(1, usage?.limits?.leads ?? 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <h2 className="text-xl font-bold px-1">Available Plans</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <Card key={plan._id} className={`rounded-2xl border-slate-100 shadow-sm flex flex-col ${user?.plan?._id === plan._id ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="p-2 bg-primary/5 rounded-lg mb-2">
                                                    <Zap className="h-5 w-5 text-primary" />
                                                </div>
                                                {user?.plan?._id === plan._id && (
                                                    <Badge className="bg-primary text-white">Current Plan</Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-xl font-bold pt-2">{plan.name}</CardTitle>
                                            <CardDescription>{plan.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 space-y-4">
                                            <div className="flex items-baseline gap-1 py-2">
                                                <span className="text-3xl font-bold">{currency}{plan.price}</span>
                                                <span className="text-slate-500 dark:text-slate-400 text-sm">/{plan.interval}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                                    {plan.limits.agents === -1 ? "Unlimited" : plan.limits.agents} Agents
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                                    {plan.limits.campaigns === -1 ? "Unlimited" : plan.limits.campaigns} Campaigns
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                                    {plan.limits.leads === -1 ? "Unlimited" : plan.limits.leads} Leads
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                                    Unlimited Calls (BYOK)
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-6">
                                            <Button
                                                className="w-full rounded-full"
                                                variant={user?.plan?._id === plan._id ? "outline" : "default"}
                                                disabled={user?.plan?._id === plan._id}
                                                onClick={() => handleUpgrade(plan)}
                                            >
                                                {user?.plan?._id === plan._id ? "Current Plan" : "Upgrade Plan"}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                View all your past subscription payments and billing records.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-100 dark:border-border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50/50 dark:bg-muted/40 border-b border-slate-100 dark:border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Date</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Plan</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Amount</th>
                                            <th className="px-4 py-3 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Method</th>
                                            <th className="px-4 py-3 text-right font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-border">
                                        {loadingTransactions ? (
                                            Array(3).fill(0).map((_, i) => (
                                                <tr key={i}>
                                                    <td colSpan={5} className="px-4 py-4">
                                                        <Skeleton className="h-4 w-full" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                                    No transactions found.
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions.map((tx) => (
                                                <tr key={tx._id} className="hover:bg-slate-50/30 dark:hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-4 font-medium">
                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-4 font-bold text-slate-900 dark:text-slate-100">
                                                        {tx.plan?.name || "Premium Plan"}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {currency}{tx.amount}
                                                    </td>
                                                    <td className="px-4 py-4 capitalize text-slate-500 dark:text-slate-400">
                                                        {tx.paymentGateway}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <Badge
                                                            variant="outline"
                                                            className={`
                                                                ${tx.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                                                                    tx.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                                                                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}
                                                            `}
                                                        >
                                                            {tx.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="system">
                    <Card className="max-w-3xl">
                        <CardHeader>
                            <CardTitle>Operation Preferences</CardTitle>
                            <CardDescription>
                                Global settings for platform and calling campaigns.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20 max-w-2xl">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="time-format" className="text-sm font-bold uppercase">Time Format</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Choose between 12-hour (AM/PM) or 24-hour clock format.
                                        </p>
                                    </div>
                                    <Select
                                        value={systemSettings.timeFormat}
                                        onValueChange={(val) => {
                                            setSystemSettings({ ...systemSettings, timeFormat: val });
                                        }}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="12">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>12 Hour</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="24">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>24 Hour</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-bold uppercase tracking-wider">Call Settings</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20 max-w-2xl">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="recording-enabled" className="text-sm font-bold uppercase">Call Recording</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Automatically record all phone calls via Twilio.
                                                </p>
                                            </div>
                                            <Switch
                                                id="recording-enabled"
                                                checked={systemSettings.recordingEnabled}
                                                onCheckedChange={(checked) => {
                                                    setSystemSettings({ ...systemSettings, recordingEnabled: checked });
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20 max-w-2xl">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="auto-analysis" className="text-sm font-bold uppercase">Automatic Call Analysis</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Automatically generate AI summary and qualification after each call.
                                                </p>
                                            </div>
                                            <Switch
                                                id="auto-analysis"
                                                checked={systemSettings.autoAnalysisEnabled}
                                                onCheckedChange={(checked) => {
                                                    setSystemSettings({ ...systemSettings, autoAnalysisEnabled: checked });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button onClick={() => handleSaveSettings()} disabled={saving}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Apply Preferences
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Asterisk / SIP Status Card */}
                    <Card className="mt-6 max-w-3xl">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Server className="h-5 w-5 text-primary" />
                                <CardTitle>Asterisk / SIP Engine</CardTitle>
                            </div>
                            <CardDescription>
                                Status of the Asterisk PBX server for SIP-based calling.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6 p-4 rounded-xl border bg-muted/20 max-w-2xl">
                                <div className="flex items-center gap-2">
                                    {asteriskStatus?.asteriskConnected ? (
                                        <>
                                            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-sm font-semibold text-green-700">Connected</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-3 w-3 rounded-full bg-red-400" />
                                            <span className="text-sm font-semibold text-red-600">Offline</span>
                                        </>
                                    )}
                                </div>
                                <div className="h-5 w-px bg-border" />
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Activity className="h-4 w-4" />
                                    <span>{asteriskStatus?.activeSipCalls ?? 0} active SIP calls</span>
                                </div>
                                <div className="ml-auto">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/sip-trunks">
                                            <Server className="mr-2 h-3.5 w-3.5" />
                                            Manage SIP Trunks
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">Select a gateway to continue</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Choose your preferred payment method to upgrade to <span className="font-bold text-slate-900">{selectedPlan?.name}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-6">
                        {loadingGateways ? (
                            <>
                                <Skeleton className="h-20 w-full rounded-xl" />
                                <Skeleton className="h-20 w-full rounded-xl" />
                            </>
                        ) : (
                            <>
                                {enabledGateways.stripe && (
                                    <Button
                                        variant="outline"
                                        className="h-20 justify-start gap-6 px-6 rounded-xl hover:bg-muted/50 transition-all"
                                        onClick={() => handleGatewaySelect("Stripe")}
                                    >
                                        <div className="relative h-10 w-32 flex items-center justify-center shrink-0">
                                            <Image src="/images/gateways/stripe.png" alt="Stripe" fill className="object-contain dark:hidden" />
                                            <Image src="/images/gateways/stripe_dark.png" alt="Stripe" fill className="object-contain hidden dark:block" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-base">Stripe</p>
                                                {enabledGateways.stripeTestMode && (
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase bg-yellow-100 text-yellow-700 border-yellow-200">Test Mode</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">Pay via Credit/Debit Cards</p>
                                        </div>
                                    </Button>
                                )}
                                {enabledGateways.paypal && (
                                    <div className="mt-2">
                                        <PayPalButtons
                                            style={{ layout: "vertical", shape: "pill", label: "pay" }}
                                            createOrder={async () => {
                                                try {
                                                    const token = localStorage.getItem("token");
                                                    const response = await axios.post(`${API_BASE_URL}/payments/paypal/create-order`, {
                                                        planId: selectedPlan?._id
                                                    }, {
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                    return response.data.data.id;
                                                } catch (err) {
                                                    console.error("PayPal Create Order Error:", err);
                                                    toast.error("Failed to initiate PayPal payment");
                                                    return "";
                                                }
                                            }}
                                            onApprove={async (data) => {
                                                try {
                                                    toast.loading("Capturing payment...", { id: "paypal-capture" });
                                                    const token = localStorage.getItem("token");
                                                    const response = await axios.post(`${API_BASE_URL}/payments/paypal/capture-order`, {
                                                        orderId: data.orderID,
                                                        planId: selectedPlan?._id
                                                    }, {
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });

                                                    if (response.data?.status === "success") {
                                                        toast.success(`Success! You have been upgraded to the ${response.data.data.planName}.`, { id: "paypal-capture" });
                                                        setIsPaymentModalOpen(false);
                                                        fetchData();
                                                    }
                                                } catch (err) {
                                                    console.error("PayPal Capture Error:", err);
                                                    toast.error("Failed to complete PayPal payment", { id: "paypal-capture" });
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                                {enabledGateways.dodopayments && (
                                    <Button
                                        variant="outline"
                                        className="h-20 justify-start gap-6 px-6 rounded-xl hover:bg-muted/50 transition-all"
                                        onClick={() => handleGatewaySelect("Dodo Payments")}
                                    >
                                        <div className="relative h-10 w-32 flex items-center justify-center shrink-0">
                                            <Image src="/images/gateways/dodopayments.png" alt="Dodo" fill className="object-contain dark:hidden" />
                                            <Image src="/images/gateways/dodopayments_dark.png" alt="Dodo" fill className="object-contain hidden dark:block" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-base">Dodo Payments</p>
                                                {enabledGateways.dodopaymentsTestMode && (
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase bg-yellow-100 text-yellow-700 border-yellow-200">Test Mode</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">Local payment methods</p>
                                        </div>
                                    </Button>
                                )}
                                {enabledGateways.razorpay && (
                                    <Button
                                        variant="outline"
                                        className="h-20 justify-start gap-6 px-6 rounded-xl hover:bg-muted/50 transition-all"
                                        onClick={() => handleGatewaySelect("Razorpay")}
                                    >
                                        <div className="relative h-10 w-32 flex items-center justify-center shrink-0">
                                            <Image src="/images/gateways/razorpay.png" alt="Razorpay" fill className="object-contain dark:hidden" />
                                            <Image src="/images/gateways/razorpay_dark.png" alt="Razorpay" fill className="object-contain hidden dark:block" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-base">Razorpay</p>
                                                {enabledGateways.razorpayTestMode && (
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase bg-yellow-100 text-yellow-700 border-yellow-200">Test Mode</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">India's most popular gateway</p>
                                        </div>
                                    </Button>
                                )}
                                {!enabledGateways.stripe && !enabledGateways.paypal && !enabledGateways.dodopayments && !enabledGateways.razorpay && (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        No payment methods are currently available. Please contact support.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <p className="text-[10px] text-center w-full text-slate-400">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                            Securely processed, SSL encrypted.
                        </p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <PayPalWrapper />
        </Suspense>
    );
}

function PayPalWrapper() {
    const [clientId, setClientId] = useState<string | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/settings/public`);
                if (response.data?.status === "success") {
                    setClientId(response.data.data.gateways.paypalClientId || "");
                }
            } catch (err) {
                console.error("Failed to fetch PayPal config", err);
                setClientId("");
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []);

    if (loadingConfig) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!clientId) {
        return <SettingsPageContent />;
    }

    return (
        <PayPalScriptProvider options={{ clientId }}>
            <SettingsPageContent />
        </PayPalScriptProvider>
    );
}
