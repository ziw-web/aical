"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
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
import { Plus, Play, Pause, Volume2, Loader2, AlertCircle, Hash, Database, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

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

interface AgentSheetProps {
    agent?: Agent;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function AgentSheet({ agent, trigger, onSuccess }: AgentSheetProps) {
    const [open, setOpen] = useState(false);
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

    useEffect(() => {
        if (open) {
            fetchVoices();
            fetchPhoneNumbers();
            fetchConfigStatus();
            fetchKnowledgeBases();
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [open]);

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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || <Button><Plus className="h-4 w-4" />Create Agent</Button>}
            </SheetTrigger>
            <SheetContent
                side="bottom"
                className="!h-[85vh] max-h-[85vh] flex flex-col rounded-t-2xl border-t px-4 sm:px-6 md:px-8 pb-6 data-[side=bottom]:!h-[85vh] overflow-hidden"
            >
                <SheetHeader className="flex-shrink-0 pb-4 border-b text-left space-y-1 px-0">
                    <SheetTitle className="text-xl sm:text-2xl font-semibold">
                        {isEditing ? "Edit Agent" : "Create New Agent"}
                    </SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                        Configure your AI agent. Use variables like {`{{name}}`} and {`{{company}}`} in messages.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <ScrollArea className="flex-1 min-h-0 mt-5 -mx-1 px-1">
                        <div className="max-w-4xl mx-auto space-y-6 pb-8">
                            {configStatus && (
                                <>
                                    {(!configStatus.isDeepgramConfigured || !configStatus.isModelConfigured) && (
                                        <Alert variant="destructive" className="py-3">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <AlertDescription className="text-sm flex items-center justify-between w-full gap-2 flex-wrap">
                                                <span>
                                                    {!configStatus.isDeepgramConfigured && !configStatus.isModelConfigured
                                                        ? "Deepgram and OpenRouter keys are missing."
                                                        : !configStatus.isDeepgramConfigured
                                                            ? "Deepgram key is missing (STT)."
                                                            : "OpenRouter key is missing (LLM)."}
                                                </span>
                                                <Link href="/settings" className="shrink-0 font-bold underline hover:text-red-800 transition-colors">
                                                    Configure
                                                </Link>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </>
                            )}

                            {/* Row: Name + (empty) — name constrained width on large */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:max-w-[280px]">
                                    <Label htmlFor="agent-name" className="text-sm font-medium">Agent Name</Label>
                                    <Input
                                        id="agent-name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Sales Agent"
                                        required
                                        disabled={loading}
                                        className="h-10 w-full"
                                    />
                                </div>
                                <div className="hidden md:block" />
                            </div>

                            {/* Two cols: Outbound Number | Voice Language */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="outbound-number" className="text-sm font-medium">Outbound Phone Number</Label>
                                    <Select
                                        value={formData.outboundPhoneNumber}
                                        onValueChange={(value) => setFormData({ ...formData, outboundPhoneNumber: value })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="outbound-number" className="h-10 w-full max-w-md">
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
                                    <p className="text-xs text-muted-foreground max-w-md">
                                        Caller ID for outbound calls.
                                    </p>
                                </div>
                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="language-select" className="text-sm font-medium">Voice Language</Label>
                                    <Select
                                        value={formData.language}
                                        onValueChange={(value) => setFormData({ ...formData, language: value })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="language-select" className="h-10 w-full max-w-[220px]">
                                            <SelectValue placeholder="Select Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English (US)</SelectItem>
                                            <SelectItem value="ar">Arabic</SelectItem>
                                            <SelectItem value="hi">Hindi</SelectItem>
                                            <SelectItem value="he">Hebrew</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                            <SelectItem value="de">German</SelectItem>
                                            <SelectItem value="pt">Portuguese</SelectItem>
                                            <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                                            <SelectItem value="it">Italian</SelectItem>
                                            <SelectItem value="ru">Russian</SelectItem>
                                            <SelectItem value="ja">Japanese</SelectItem>
                                            <SelectItem value="ko">Korean</SelectItem>
                                            <SelectItem value="nl">Dutch</SelectItem>
                                            <SelectItem value="ur">Urdu</SelectItem>
                                            <SelectItem value="ta">Tamil</SelectItem>
                                            <SelectItem value="multi">Auto-detect (Multilingual)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {formData.language === 'multi' && (
                                        <p className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 max-w-md">
                                            Auto-detect allows multi-language within the same call.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Two cols: System Prompt | Opening Message — constrained, no full width */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="system-prompt" className="text-sm font-medium">System Prompt</Label>
                                    <Textarea
                                        id="system-prompt"
                                        value={formData.systemPrompt}
                                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                                        placeholder="You are a professional sales agent..."
                                        rows={5}
                                        required
                                        disabled={loading}
                                        className="resize-y min-h-[120px] w-full max-w-md"
                                    />
                                </div>
                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="opening-message" className="text-sm font-medium">Opening Message</Label>
                                    <Textarea
                                        id="opening-message"
                                        value={formData.openingMessage}
                                        onChange={(e) => setFormData({ ...formData, openingMessage: e.target.value })}
                                        placeholder="Hi {{name}}, this is calling from {{company}}..."
                                        rows={5}
                                        required
                                        disabled={loading}
                                        className="resize-y min-h-[120px] w-full max-w-md"
                                    />
                                </div>
                            </div>

                            {/* Knowledge Base — two cols */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="space-y-2 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-4 w-4 text-primary" />
                                        <Label className="text-sm font-semibold">Knowledge Base</Label>
                                    </div>
                                    <Select
                                        value={formData.knowledgeBaseId}
                                        onValueChange={(value) => setFormData({ ...formData, knowledgeBaseId: value })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="kb-select" className="h-10 w-full max-w-md">
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
                                </div>
                                {formData.knowledgeBaseId !== "none" && (
                                    <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border bg-muted/20 max-w-md">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="use-basic-info"
                                                checked={formData.kbSettings.useBasicInfo}
                                                onCheckedChange={(checked) => setFormData({
                                                    ...formData,
                                                    kbSettings: { ...formData.kbSettings, useBasicInfo: checked }
                                                })}
                                            />
                                            <Label htmlFor="use-basic-info" className="text-sm">Basic Info</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="use-faqs"
                                                checked={formData.kbSettings.useFaqs}
                                                onCheckedChange={(checked) => setFormData({
                                                    ...formData,
                                                    kbSettings: { ...formData.kbSettings, useFaqs: checked }
                                                })}
                                            />
                                            <Label htmlFor="use-faqs" className="text-sm">FAQs</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="use-other-info"
                                                checked={formData.kbSettings.useOtherInfo}
                                                onCheckedChange={(checked) => setFormData({
                                                    ...formData,
                                                    kbSettings: { ...formData.kbSettings, useOtherInfo: checked }
                                                })}
                                            />
                                            <Label htmlFor="use-other-info" className="text-sm">Other Info</Label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Appointment Booking — one row, constrained */}
                            <div className="space-y-4 pt-4 border-t max-w-2xl">
                                <div className="flex items-center justify-between gap-4 rounded-xl border p-4 bg-primary/5 border-primary/10">
                                    <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-4 w-4 text-primary shrink-0" />
                                            <Label className="text-sm font-semibold cursor-pointer" htmlFor="appointment-booking">Appointment Booking</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Allow agent to book and manage appointments.
                                        </p>
                                    </div>
                                    <Switch
                                        id="appointment-booking"
                                        checked={formData.appointmentBookingEnabled}
                                        onCheckedChange={(checked) => setFormData({ ...formData, appointmentBookingEnabled: checked })}
                                        disabled={loading}
                                    />
                                </div>
                                {formData.appointmentBookingEnabled && (
                                    <div className="space-y-2">
                                        <Label htmlFor="appointment-desc" className="text-sm font-medium">Appointment Description</Label>
                                        <Textarea
                                            id="appointment-desc"
                                            value={formData.appointmentDescription}
                                            onChange={(e) => setFormData({ ...formData, appointmentDescription: e.target.value })}
                                            placeholder="E.g. Product consultation or service inquiry."
                                            rows={2}
                                            disabled={loading}
                                            className="w-full max-w-md resize-y"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Helps the AI understand what kind of appointments it is booking.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Voice Configuration — two cols where possible */}
                            {(() => {
                                const selectedNumber = phoneNumbers.find(n => n._id === formData.outboundPhoneNumber);
                                const isSipNumber = selectedNumber?.provider === 'sip';
                                const showTwilioVoices = configStatus?.isTwilioConfigured && !isSipNumber;
                                const forceCustomVoice = !configStatus?.isTwilioConfigured || isSipNumber;

                                if (configStatus && !configStatus.isTwilioConfigured && !configStatus.isElevenLabsConfigured) {
                                    return (
                                        <Alert variant="destructive" className="border-red-500/20 bg-red-500/5 max-w-2xl">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle className="text-sm font-bold">Voice Configuration Required</AlertTitle>
                                            <AlertDescription className="text-sm space-y-2 mt-1">
                                                <p>Configure <strong>ElevenLabs</strong> or <strong>Twilio</strong> in settings to enable voice.</p>
                                                <Link href="/settings" className="inline-block font-bold underline hover:text-red-400">
                                                    Go to Settings
                                                </Link>
                                            </AlertDescription>
                                        </Alert>
                                    );
                                }

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                        <div className="space-y-4 min-w-0">
                                            {showTwilioVoices && (
                                                <div className="flex items-center justify-between gap-4 rounded-xl border p-4 bg-muted/20 max-w-md">
                                                    <div className="space-y-0.5 min-w-0">
                                                        <Label className="text-sm font-semibold">Custom Voice (ElevenLabs)</Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Use streaming voices.
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={formData.useCustomVoice}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, useCustomVoice: checked })}
                                                    />
                                                </div>
                                            )}

                                            {(formData.useCustomVoice || forceCustomVoice) ? (
                                                <div className="space-y-2 border-l-2 border-primary/20 pl-4 py-1 max-w-md">
                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor="voice-id" className="text-sm font-medium">Premium Voice</Label>
                                                        {isSipNumber && (
                                                            <Badge variant="outline" className="text-[10px] font-medium border-primary/20 text-primary bg-primary/5">
                                                                SIP
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Select
                                                            value={formData.voiceId}
                                                            onValueChange={(value) => {
                                                                const selectedVoice = voices.find(v => v.voice_id === value);
                                                                setFormData({ ...formData, voiceId: value, voiceName: selectedVoice?.name || "Rachel" });
                                                            }}
                                                            disabled={loading || fetchingVoices}
                                                        >
                                                            <SelectTrigger className="h-10 flex-1 min-w-0">
                                                                <SelectValue placeholder={fetchingVoices ? "Loading..." : "Select voice"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[280px]">
                                                                {voices.map((v) => (
                                                                    <SelectItem key={v.voice_id} value={v.voice_id}>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">{v.name}</span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {v.category} {v.labels?.gender ? `· ${v.labels.gender}` : ''}
                                                                            </span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                                {voices.length === 0 && !fetchingVoices && (
                                                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                                                        No voices. Check API keys.
                                                                    </div>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        {formData.voiceId && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="shrink-0 h-10 w-10"
                                                                onClick={(e) => {
                                                                    const voice = voices.find(v => v.voice_id === formData.voiceId);
                                                                    if (voice) togglePreview(e, voice);
                                                                }}
                                                                disabled={!voices.find(v => v.voice_id === formData.voiceId)?.preview_url}
                                                            >
                                                                {previewingId === formData.voiceId ? (
                                                                    <Pause className="h-4 w-4 fill-current" />
                                                                ) : (
                                                                    <Volume2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {fetchVoicesError ? (
                                                        <p className="text-xs text-destructive font-medium">
                                                            {fetchVoicesError} <Link href="/settings" className="underline">Settings</Link>
                                                        </p>
                                                    ) : !configStatus?.isElevenLabsConfigured ? (
                                                        <p className="text-xs text-destructive font-medium italic">
                                                            ElevenLabs not configured. <Link href="/settings" className="underline">Settings</Link>
                                                        </p>
                                                    ) : voices.length === 0 && !fetchingVoices && (
                                                        <p className="text-xs text-muted-foreground italic">
                                                            No custom voices found.
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                showTwilioVoices && (
                                                    <div className="space-y-2 max-w-md">
                                                        <Label htmlFor="twilio-voice" className="text-sm font-medium">Standard Voice (Twilio)</Label>
                                                        <Select
                                                            value={formData.voice}
                                                            onValueChange={(value) => setFormData({ ...formData, voice: value })}
                                                        >
                                                            <SelectTrigger id="twilio-voice" className="h-10 w-full">
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
                                                )
                                            )}
                                        </div>
                                        <div className="hidden md:block" />
                                    </div>
                                );
                            })()}
                        </div>
                    </ScrollArea>

                    <SheetFooter className="flex-shrink-0 pt-4 mt-4 border-t gap-3 sm:gap-2 max-w-4xl mx-auto w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditing ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                isEditing ? "Update Agent" : "Create Agent"
                            )}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
