"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axios from "axios";
import { Plus, Play, Pause, Volume2, Loader2, AlertCircle, Hash, Database, Phone, Calendar, Mic, Bot, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AgentTemplate } from "@/lib/agent-templates";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const AGENT_ICON_GRADIENTS = [
    "/images/gradients/grad1.png",
    "/images/gradients/grad2.png",
    "/images/gradients/grad3.png",
    "/images/gradients/grad4.png",
    "/images/gradients/grad5.png",
    "/images/gradients/grad6.png",
];

function getAgentGradientUrl(agentName: string): string {
    const trimmed = agentName?.trim();
    if (!trimmed) return AGENT_ICON_GRADIENTS[0];
    const ascii = trimmed[0].charCodeAt(0);
    return AGENT_ICON_GRADIENTS[ascii % AGENT_ICON_GRADIENTS.length];
}

interface ConfigStatus {
    isTwilioConfigured: boolean;
    isElevenLabsConfigured: boolean;
    isDeepgramConfigured: boolean;
    isModelConfigured: boolean;
}

interface Agent {
    _id: string;
    name: string;
    systemPrompt: string;
    openingMessage: string;
    voice?: string;
    voiceId?: string;
    voiceName?: string;
    useCustomVoice: boolean;
    outboundPhoneNumber?: any;
    knowledgeBaseId?: any;
    kbSettings?: {
        useBasicInfo: boolean;
        useFaqs: boolean;
        useOtherInfo: boolean;
    };
    language?: string;
    appointmentBookingEnabled?: boolean;
    appointmentDescription?: string;
}

interface Voice {
    voice_id: string;
    name: string;
    preview_url: string;
    category: string;
    labels?: Record<string, string>;
}

interface AgentDrawerProps {
    agent?: Agent;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    templateData?: AgentTemplate;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AgentDrawer({ agent, trigger, onSuccess, templateData, open: controlledOpen, onOpenChange }: AgentDrawerProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = (value: boolean) => {
        if (isControlled) {
            onOpenChange?.(value);
        } else {
            setInternalOpen(value);
        }
    };
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: agent?.name || "",
        systemPrompt: agent?.systemPrompt || "",
        openingMessage: agent?.openingMessage || "",
        voice: agent?.voice || "Polly.Amy",
        voiceId: agent?.voiceId || "",
        voiceName: agent?.voiceName || "Rachel",
        useCustomVoice: agent?.useCustomVoice || false,
        outboundPhoneNumber: agent?.outboundPhoneNumber?._id || agent?.outboundPhoneNumber || "none",
        knowledgeBaseId: agent?.knowledgeBaseId?._id || agent?.knowledgeBaseId || "none",
        language: agent?.language || "en",
        appointmentBookingEnabled: agent?.appointmentBookingEnabled || false,
        appointmentDescription: agent?.appointmentDescription || "",
        kbSettings: {
            useBasicInfo: agent?.kbSettings?.useBasicInfo ?? true,
            useFaqs: agent?.kbSettings?.useFaqs ?? true,
            useOtherInfo: agent?.kbSettings?.useOtherInfo ?? true,
        }
    });
    const [voices, setVoices] = useState<Voice[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
    const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
    const [fetchingVoices, setFetchingVoices] = useState(false);
    const [fetchVoicesError, setFetchVoicesError] = useState<string | null>(null);
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const prevOpenRef = useRef(false);

    useEffect(() => {
        if (open) {
            fetchVoices();
            fetchPhoneNumbers();
            fetchConfigStatus();
            fetchKnowledgeBases();
            if (prevOpenRef.current === false) {
                if (agent) {
                    setFormData({
                        name: agent.name,
                        systemPrompt: agent.systemPrompt,
                        openingMessage: agent.openingMessage,
                        voice: agent.voice || "Polly.Amy",
                        voiceId: agent.voiceId || "",
                        voiceName: agent.voiceName || "Rachel",
                        useCustomVoice: agent.useCustomVoice ?? false,
                        outboundPhoneNumber: agent.outboundPhoneNumber?._id || agent.outboundPhoneNumber || "none",
                        knowledgeBaseId: agent.knowledgeBaseId?._id || agent.knowledgeBaseId || "none",
                        language: agent.language || "en",
                        appointmentBookingEnabled: agent.appointmentBookingEnabled ?? false,
                        appointmentDescription: agent.appointmentDescription || "",
                        kbSettings: {
                            useBasicInfo: agent.kbSettings?.useBasicInfo ?? true,
                            useFaqs: agent.kbSettings?.useFaqs ?? true,
                            useOtherInfo: agent.kbSettings?.useOtherInfo ?? true,
                        },
                    });
                } else if (templateData) {
                    setFormData({
                        name: templateData.name,
                        systemPrompt: templateData.systemPrompt,
                        openingMessage: templateData.openingMessage,
                        voice: "Polly.Amy",
                        voiceId: templateData.voiceId || "",
                        voiceName: templateData.voiceName || "Rachel",
                        useCustomVoice: templateData.useCustomVoice ?? false,
                        outboundPhoneNumber: "none",
                        knowledgeBaseId: "none",
                        language: templateData.language || "en",
                        appointmentBookingEnabled: templateData.appointmentBookingEnabled ?? false,
                        appointmentDescription: templateData.appointmentDescription || "",
                        kbSettings: { useBasicInfo: true, useFaqs: true, useOtherInfo: true },
                    });
                } else {
                    setFormData({
                        name: "",
                        systemPrompt: "",
                        openingMessage: "",
                        voice: "Polly.Amy",
                        voiceId: "",
                        voiceName: "Rachel",
                        useCustomVoice: false,
                        outboundPhoneNumber: "none",
                        knowledgeBaseId: "none",
                        language: "en",
                        appointmentBookingEnabled: false,
                        appointmentDescription: "",
                        kbSettings: { useBasicInfo: true, useFaqs: true, useOtherInfo: true },
                    });
                }
            }
        }
        prevOpenRef.current = open;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [open, agent, templateData]);

    const fetchConfigStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/settings/config-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                const status = response.data.data;
                setConfigStatus(status);
                if (!status.isTwilioConfigured) {
                    setFormData(prev => ({ ...prev, useCustomVoice: true }));
                }
            }
        } catch (err) {
            console.error("Failed to fetch config status:", err);
        }
    };

    const fetchVoices = async () => {
        try {
            setFetchingVoices(true);
            setFetchVoicesError(null);
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/agents/voices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                setVoices(response.data.data.voices);
            }
        } catch (err: any) {
            console.error("Failed to fetch voices:", err);
            setFetchVoicesError("Please check your ElevenLabs API key in settings.");
        } finally {
            setFetchingVoices(false);
        }
    };

    const fetchPhoneNumbers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/numbers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                setPhoneNumbers(response.data.data.numbers);
            }
        } catch (err) {
            console.error("Failed to fetch phone numbers:", err);
        }
    };

    const fetchKnowledgeBases = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/knowledge-base`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                setKnowledgeBases(response.data.data.kbs);
            }
        } catch (err) {
            console.error("Failed to fetch knowledge bases:", err);
        }
    };

    const togglePreview = (e: React.MouseEvent, voice: Voice) => {
        e.preventDefault();
        e.stopPropagation();

        if (previewingId === voice.voice_id) {
            audioRef.current?.pause();
            setPreviewingId(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(voice.preview_url);
        audioRef.current = audio;
        setPreviewingId(voice.voice_id);

        audio.play().catch(console.error);
        audio.onended = () => setPreviewingId(null);
    };

    const isEditing = !!agent;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const submissionData = {
                ...formData,
                outboundPhoneNumber: formData.outboundPhoneNumber === "none" ? null : formData.outboundPhoneNumber,
                knowledgeBaseId: formData.knowledgeBaseId === "none" ? null : formData.knowledgeBaseId
            };
            if (isEditing) {
                await axios.patch(`${API_BASE_URL}/agents/${agent._id}`, submissionData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success("Agent updated successfully!");
            } else {
                await axios.post(`${API_BASE_URL}/agents`, submissionData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success("Agent created successfully!");
            }
            setOpen(false);
            onSuccess?.();
            if (!isEditing) {
                setFormData({
                    name: "",
                    systemPrompt: "",
                    openingMessage: "",
                    voice: "Polly.Amy",
                    voiceId: "",
                    voiceName: "Rachel",
                    useCustomVoice: false,
                    outboundPhoneNumber: "none",
                    knowledgeBaseId: "none",
                    language: "en",
                    appointmentBookingEnabled: false,
                    appointmentDescription: "",
                    kbSettings: { useBasicInfo: true, useFaqs: true, useOtherInfo: true }
                });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={setOpen} direction="bottom" shouldScaleBackground={false}>
            {!isControlled && (
                <DrawerTrigger asChild>
                    {trigger || <Button><Plus className="h-4 w-4" />Create Agent</Button>}
                </DrawerTrigger>
            )}
            <DrawerContent
                fullScreen
                className="flex flex-col overflow-hidden px-4 pb-4 sm:px-6 sm:pb-6 md:px-8"
            >
                <DrawerHeader className="flex-shrink-0 border-b border-border/80 py-3 sm:py-4 text-left space-y-0.5 px-0">
                    <DrawerTitle className="text-lg font-semibold sm:text-xl tracking-tight">
                        {isEditing ? "Edit Agent" : "Create New Agent"}
                    </DrawerTitle>
                    <DrawerDescription className="text-xs sm:text-sm text-muted-foreground">
                        Configure your AI agent. Use variables like {`{{name}}`} and {`{{company}}`} in messages.
                    </DrawerDescription>
                </DrawerHeader>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-4 sm:py-5 pr-2 -mr-2">
                        {configStatus && (!configStatus.isDeepgramConfigured || !configStatus.isModelConfigured) && (
                            <Alert variant="destructive" className="mb-4 rounded-lg">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <AlertDescription className="text-sm flex items-center justify-between w-full gap-2 flex-wrap">
                                    <span>
                                        {!configStatus.isDeepgramConfigured && !configStatus.isModelConfigured
                                            ? "Deepgram and OpenRouter keys are missing."
                                            : !configStatus.isDeepgramConfigured
                                                ? "Deepgram key is missing (STT)."
                                                : "OpenRouter key is missing (LLM)."}
                                    </span>
                                    <Link href="/settings" className="shrink-0 font-bold underline hover:text-red-800">Configure</Link>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                            {/* LEFT: Prompts & main content */}
                            <div className="flex min-w-0 flex-col gap-5">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">Agent content</p>
                                <div className="flex items-start gap-4">
                                    <div
                                        className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center overflow-hidden bg-cover bg-center"
                                        style={{ backgroundImage: `url(${getAgentGradientUrl(formData.name)})` }}
                                    >
                                        <span className="flex items-center justify-center text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)] mix-blend-overlay">
                                            <Bot className="h-7 w-7" strokeWidth={1.75} />
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <Label htmlFor="agent-name" className="text-sm font-medium">
                                            Agent Name
                                        </Label>
                                        <Input
                                            id="agent-name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Sales Agent"
                                            required
                                            disabled={loading}
                                            className="h-9 w-full rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="system-prompt" className="text-sm font-medium">System prompt</Label>
                                    <Textarea
                                        id="system-prompt"
                                        value={formData.systemPrompt}
                                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                                        placeholder="You are a professional sales agent..."
                                        required
                                        disabled={loading}
                                        className="min-h-[140px] w-full resize-y rounded-md md:min-h-[200px]"
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-snug">Type {`{{name}}`}, {`{{company}}`} for variables.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="opening-message" className="text-sm font-medium">First message</Label>
                                    <p className="text-[11px] text-muted-foreground leading-snug">The first message the agent will say.</p>
                                    <Textarea
                                        id="opening-message"
                                        value={formData.openingMessage}
                                        onChange={(e) => setFormData({ ...formData, openingMessage: e.target.value })}
                                        placeholder="Hi {{name}}, this is calling from {{company}}..."
                                        required
                                        disabled={loading}
                                        className="min-h-[88px] w-full resize-y rounded-md"
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-snug">Type {`{{name}}`}, {`{{company}}`} for variables.</p>
                                </div>
                            </div>

                            {/* RIGHT: Voice, language, settings */}
                            <div className="flex min-w-0 flex-col gap-5 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">Call & voice settings</p>
                                <div className="space-y-1.5">
                                    <Label htmlFor="outbound-number" className="flex items-center gap-2 text-sm font-medium">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        Outbound Phone Number
                                    </Label>
                                    <Select
                                        value={formData.outboundPhoneNumber}
                                        onValueChange={(value) => setFormData({ ...formData, outboundPhoneNumber: value })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="outbound-number" className="h-9 w-full rounded-md">
                                            <SelectValue placeholder="Select number" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Outbound Number</SelectItem>
                                            {phoneNumbers.map((num: any) => (
                                                <SelectItem key={num._id} value={num._id}>
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{num.name} ({num.phoneNumber})</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {phoneNumbers.length === 0 && (
                                                <div className="p-2 text-xs text-muted-foreground text-center">
                                                    No numbers found. <Link href="/phone-numbers" className="underline font-bold">Add one</Link>
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-muted-foreground leading-snug">Caller ID for outbound calls.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="language-select" className="flex items-center gap-2 text-sm font-medium">
                                        <Languages className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        Language
                                    </Label>
                                    <Select
                                        value={formData.language}
                                        onValueChange={(value) => setFormData({ ...formData, language: value })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="language-select" className="h-9 w-full rounded-md">
                                            <SelectValue placeholder="Select Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en"><span className="inline-flex items-center gap-2"><span aria-hidden>🇺🇸</span> English (US)</span></SelectItem>
                                            <SelectItem value="ar"><span className="inline-flex items-center gap-2"><span aria-hidden>🇸🇦</span> Arabic</span></SelectItem>
                                            <SelectItem value="hi"><span className="inline-flex items-center gap-2"><span aria-hidden>🇮🇳</span> Hindi</span></SelectItem>
                                            <SelectItem value="he"><span className="inline-flex items-center gap-2"><span aria-hidden>🇮🇱</span> Hebrew</span></SelectItem>
                                            <SelectItem value="es"><span className="inline-flex items-center gap-2"><span aria-hidden>🇪🇸</span> Spanish</span></SelectItem>
                                            <SelectItem value="fr"><span className="inline-flex items-center gap-2"><span aria-hidden>🇫🇷</span> French</span></SelectItem>
                                            <SelectItem value="de"><span className="inline-flex items-center gap-2"><span aria-hidden>🇩🇪</span> German</span></SelectItem>
                                            <SelectItem value="pt"><span className="inline-flex items-center gap-2"><span aria-hidden>🇵🇹</span> Portuguese</span></SelectItem>
                                            <SelectItem value="pt-BR"><span className="inline-flex items-center gap-2"><span aria-hidden>🇧🇷</span> Portuguese (Brazil)</span></SelectItem>
                                            <SelectItem value="it"><span className="inline-flex items-center gap-2"><span aria-hidden>🇮🇹</span> Italian</span></SelectItem>
                                            <SelectItem value="ru"><span className="inline-flex items-center gap-2"><span aria-hidden>🇷🇺</span> Russian</span></SelectItem>
                                            <SelectItem value="ja"><span className="inline-flex items-center gap-2"><span aria-hidden>🇯🇵</span> Japanese</span></SelectItem>
                                            <SelectItem value="ko"><span className="inline-flex items-center gap-2"><span aria-hidden>🇰🇷</span> Korean</span></SelectItem>
                                            <SelectItem value="nl"><span className="inline-flex items-center gap-2"><span aria-hidden>🇳🇱</span> Dutch</span></SelectItem>
                                            <SelectItem value="ur"><span className="inline-flex items-center gap-2"><span aria-hidden>🇵🇰</span> Urdu</span></SelectItem>
                                            <SelectItem value="ta"><span className="inline-flex items-center gap-2"><span aria-hidden>🇮🇳</span> Tamil</span></SelectItem>
                                            <SelectItem value="multi">Auto-detect (Multilingual)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {formData.language === 'multi' && (
                                        <p className="text-[11px] text-amber-600 bg-amber-500/10 p-2 rounded-md border border-amber-500/20 leading-snug">
                                            Auto-detect allows multi-language within the same call.
                                        </p>
                                    )}
                                </div>

                                {configStatus && !configStatus.isTwilioConfigured && !configStatus.isElevenLabsConfigured ? (
                                    <Alert variant="destructive" className="border-red-500/20 bg-red-500/5 rounded-lg py-3">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-bold">Voice Configuration Required</AlertTitle>
                                        <AlertDescription className="text-sm mt-1">
                                            <p>Configure <strong>ElevenLabs</strong> or <strong>Twilio</strong> in settings.</p>
                                            <Link href="/settings" className="inline-block font-bold underline hover:text-red-400">Go to Settings</Link>
                                        </AlertDescription>
                                    </Alert>
                                ) : (() => {
                                    const selectedNumber = phoneNumbers.find(n => n._id === formData.outboundPhoneNumber);
                                    const isSipNumber = selectedNumber?.provider === 'sip';
                                    const showTwilioVoices = configStatus?.isTwilioConfigured && !isSipNumber;
                                    const forceCustomVoice = !configStatus?.isTwilioConfigured || isSipNumber;
                                    return (
                                        <div className="space-y-4">
                                            {showTwilioVoices ? (
                                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => setFormData({ ...formData, useCustomVoice: !formData.useCustomVoice })}
                                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFormData({ ...formData, useCustomVoice: !formData.useCustomVoice }); } }}
                                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/80 p-3 transition-colors bg-muted/20 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 sm:min-w-[200px]"
                                                        aria-pressed={formData.useCustomVoice}
                                                        aria-label="Toggle custom voice (ElevenLabs)"
                                                    >
                                                        <div className="space-y-0.5 min-w-0 pointer-events-none">
                                                            <span className="text-sm font-semibold">Custom Voice (ElevenLabs)</span>
                                                            <p className="text-[11px] text-muted-foreground leading-snug">Use streaming voices.</p>
                                                        </div>
                                                        <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
                                                            <Switch checked={formData.useCustomVoice} onCheckedChange={(c) => setFormData({ ...formData, useCustomVoice: c })} />
                                                        </div>
                                                    </div>
                                                    {formData.useCustomVoice ? (
                                                        <div className="flex-1 min-w-0 space-y-1.5 min-w-[200px]">
                                                            <div className="flex items-center gap-2 min-h-[1.375rem]">
                                                                <Mic className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                <Label htmlFor="voice-id-row" className="text-sm font-medium">Voices</Label>
                                                            </div>
                                                            <div className="flex gap-2 items-center flex-wrap min-h-9">
                                                                <Select
                                                                    value={formData.voiceId}
                                                                    onValueChange={(value) => {
                                                                        const v = voices.find(x => x.voice_id === value);
                                                                        setFormData({ ...formData, voiceId: value, voiceName: v?.name || "Rachel" });
                                                                    }}
                                                                    disabled={loading || fetchingVoices}
                                                                >
                                                                    <SelectTrigger id="voice-id-row" className="h-9 flex-1 min-w-[160px] rounded-md shrink-0 [&_[data-slot=select-value]]:items-start [&_[data-slot=select-value]]:text-left">
                                                                        <SelectValue placeholder={fetchingVoices ? "Loading..." : "Select voice"} />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="max-h-[280px]">
                                                                        {voices.map((v) => (
                                                                            <SelectItem key={v.voice_id} value={v.voice_id}>
                                                                                <div className="flex flex-col items-start text-left">
                                                                                    <span className="font-medium">{v.name}</span>
                                                                                    <span className="text-xs text-muted-foreground">{v.category} {v.labels?.gender ? `· ${v.labels.gender}` : ''}</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))}
                                                                        {voices.length === 0 && !fetchingVoices && <div className="p-2 text-xs text-muted-foreground text-center">No voices. Check API keys.</div>}
                                                                    </SelectContent>
                                                                </Select>
                                                                {formData.voiceId && (
                                                                    <Button type="button" variant="outline" size="icon" className="shrink-0 h-9 w-9 rounded-md"
                                                                        onClick={(e) => { const voice = voices.find(v => v.voice_id === formData.voiceId); if (voice) togglePreview(e, voice); }}
                                                                        disabled={!voices.find(v => v.voice_id === formData.voiceId)?.preview_url}>
                                                                        {previewingId === formData.voiceId ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Volume2 className="h-3.5 w-3.5" />}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 min-w-0 space-y-1.5 min-w-[200px]">
                                                            <div className="flex items-center gap-2 min-h-[1.375rem]">
                                                                <Mic className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                <Label htmlFor="twilio-voice" className="text-sm font-medium">Standard Voice (Twilio)</Label>
                                                            </div>
                                                            <div className="flex gap-2 items-center min-h-9">
                                                                <Select value={formData.voice} onValueChange={(v) => setFormData({ ...formData, voice: v })}>
                                                                    <SelectTrigger id="twilio-voice" className="h-9 flex-1 min-w-0 rounded-md">
                                                                        <SelectValue placeholder="Select voice" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Polly.Amy">Amy (Female - UK)</SelectItem>
                                                                        <SelectItem value="Polly.Joey">Joey (Male - US)</SelectItem>
                                                                        <SelectItem value="Polly.Joanna">Joanna (Female - US)</SelectItem>
                                                                        <SelectItem value="Polly.Brian">Brian (Male - UK)</SelectItem>
                                                                        <SelectItem value="Polly.Geraint">Geraint (Male - Welsh)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                            {showTwilioVoices && formData.useCustomVoice && (
                                                <>
                                                    {fetchVoicesError && <p className="text-[11px] text-destructive font-medium leading-snug">{fetchVoicesError} <Link href="/settings" className="underline">Settings</Link></p>}
                                                    {!configStatus?.isElevenLabsConfigured && <p className="text-[11px] text-destructive font-medium italic leading-snug">ElevenLabs not configured. <Link href="/settings" className="underline">Settings</Link></p>}
                                                </>
                                            )}
                                            {!showTwilioVoices && (formData.useCustomVoice || forceCustomVoice) ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Mic className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        <Label htmlFor="voice-id" className="text-sm font-medium">Voices</Label>
                                                        {isSipNumber && <Badge variant="outline" className="text-[10px] font-medium border-primary/20 text-primary bg-primary/5">SIP</Badge>}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Select
                                                            value={formData.voiceId}
                                                            onValueChange={(value) => {
                                                                const v = voices.find(x => x.voice_id === value);
                                                                setFormData({ ...formData, voiceId: value, voiceName: v?.name || "Rachel" });
                                                            }}
                                                            disabled={loading || fetchingVoices}
                                                        >
                                                            <SelectTrigger id="voice-id" className="h-9 flex-1 min-w-0 rounded-md [&_[data-slot=select-value]]:items-start [&_[data-slot=select-value]]:text-left">
                                                                <SelectValue placeholder={fetchingVoices ? "Loading..." : "Select voice"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[280px]">
                                                                {voices.map((v) => (
                                                                    <SelectItem key={v.voice_id} value={v.voice_id}>
                                                                        <div className="flex flex-col items-start text-left">
                                                                            <span className="font-medium">{v.name}</span>
                                                                            <span className="text-xs text-muted-foreground">{v.category} {v.labels?.gender ? `· ${v.labels.gender}` : ''}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                                {voices.length === 0 && !fetchingVoices && <div className="p-2 text-xs text-muted-foreground text-center">No voices. Check API keys.</div>}
                                                            </SelectContent>
                                                        </Select>
                                                        {formData.voiceId && (
                                                            <Button type="button" variant="outline" size="icon" className="shrink-0 h-9 w-9 rounded-md"
                                                                onClick={(e) => { const voice = voices.find(v => v.voice_id === formData.voiceId); if (voice) togglePreview(e, voice); }}
                                                                disabled={!voices.find(v => v.voice_id === formData.voiceId)?.preview_url}>
                                                                {previewingId === formData.voiceId ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Volume2 className="h-3.5 w-3.5" />}
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {fetchVoicesError && <p className="text-[11px] text-destructive font-medium leading-snug">{fetchVoicesError} <Link href="/settings" className="underline">Settings</Link></p>}
                                                    {!configStatus?.isElevenLabsConfigured && <p className="text-[11px] text-destructive font-medium italic leading-snug">ElevenLabs not configured. <Link href="/settings" className="underline">Settings</Link></p>}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })()}

                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">Capabilities</p>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Database className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <Label className="text-sm font-medium">Knowledge Base</Label>
                                        </div>
                                        <Select
                                            value={formData.knowledgeBaseId}
                                            onValueChange={(value) => setFormData({ ...formData, knowledgeBaseId: value })}
                                            disabled={loading}
                                        >
                                            <SelectTrigger id="kb-select" className="h-9 w-full rounded-md">
                                                <SelectValue placeholder="No Knowledge Base" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Knowledge Base</SelectItem>
                                                {knowledgeBases.map((kb) => (
                                                    <SelectItem key={kb._id} value={kb._id}>
                                                        {kb.name}
                                                    </SelectItem>
                                                ))}
                                                {knowledgeBases.length === 0 && (
                                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                                        No knowledge bases. <Link href="/knowledge-base" className="underline font-bold">Create one</Link>
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {formData.knowledgeBaseId !== "none" && (
                                            <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-md border border-border/80 bg-muted/20">
                                                <div className="flex items-center gap-2">
                                                    <Switch id="use-basic-info" checked={formData.kbSettings.useBasicInfo} onCheckedChange={(c) => setFormData({ ...formData, kbSettings: { ...formData.kbSettings, useBasicInfo: c } })} />
                                                    <Label htmlFor="use-basic-info" className="text-sm">Basic Info</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch id="use-faqs" checked={formData.kbSettings.useFaqs} onCheckedChange={(c) => setFormData({ ...formData, kbSettings: { ...formData.kbSettings, useFaqs: c } })} />
                                                    <Label htmlFor="use-faqs" className="text-sm">FAQs</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch id="use-other-info" checked={formData.kbSettings.useOtherInfo} onCheckedChange={(c) => setFormData({ ...formData, kbSettings: { ...formData.kbSettings, useOtherInfo: c } })} />
                                                    <Label htmlFor="use-other-info" className="text-sm">Other Info</Label>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => !loading && setFormData({ ...formData, appointmentBookingEnabled: !formData.appointmentBookingEnabled })}
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); !loading && setFormData({ ...formData, appointmentBookingEnabled: !formData.appointmentBookingEnabled }); } }}
                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/80 p-3 transition-colors bg-muted/20 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        aria-pressed={formData.appointmentBookingEnabled}
                                        aria-label="Toggle appointment booking"
                                    >
                                        <div className="space-y-0.5 min-w-0 pointer-events-none">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <span className="text-sm font-semibold">Appointment Booking</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-snug">Allow agent to book and manage appointments.</p>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
                                            <Switch
                                                id="appointment-booking"
                                                checked={formData.appointmentBookingEnabled}
                                                onCheckedChange={(checked) => setFormData({ ...formData, appointmentBookingEnabled: checked })}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    {formData.appointmentBookingEnabled && (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="appointment-desc" className="text-sm font-medium">Appointment Description</Label>
                                            <Textarea
                                                id="appointment-desc"
                                                value={formData.appointmentDescription}
                                                onChange={(e) => setFormData({ ...formData, appointmentDescription: e.target.value })}
                                                placeholder="E.g. Product consultation or service inquiry."
                                                rows={2}
                                                disabled={loading}
                                                className="w-full resize-y rounded-md text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DrawerFooter className="flex-shrink-0 border-t border-border bg-background py-4 px-4 sm:px-6 md:px-8 gap-3 w-full flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                            className="w-full sm:w-auto min-w-0 h-10 rounded-md border-border bg-background text-foreground hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto min-w-0 h-10 rounded-md font-medium"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                                    {isEditing ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                isEditing ? "Update Agent" : "Create Agent"
                            )}
                        </Button>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
