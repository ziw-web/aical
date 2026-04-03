"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Play, Pause, Volume2, Search, Loader2, AlertCircle, AlertTriangle, Hash, Database, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface AgentDialogProps {
    agent?: Agent;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function AgentDialog({ agent, trigger, onSuccess }: AgentDialogProps) {
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
                // If Twilio is not configured, ElevenLabs (Custom Voice) is the only option
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button><Plus className="h-4 w-4" />Create Agent</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Agent" : "Create New Agent"}</DialogTitle>
                    <DialogDescription>
                        Configure your AI agent. Use variables like {`{{name}}`} and {`{{company}}`} in messages.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="max-h-[70vh] overflow-y-auto px-1 py-4">
                        <div className="grid gap-4">
                            {configStatus && (
                                <div className="space-y-3 mb-2">
                                    {/* Unified voice config alerts are now handled below in the Voice Configuration Section */}
                                    {/* ElevenLabs and Other AI service alerts are now handled below or preserved if necessary */}
                                    {(!configStatus.isDeepgramConfigured || !configStatus.isModelConfigured) && (
                                        <Alert variant="destructive" className="py-2 items-center">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <AlertDescription className="text-xs flex items-center justify-between w-full">
                                                <span>
                                                    {!configStatus.isDeepgramConfigured && !configStatus.isModelConfigured
                                                        ? "Deepgram and OpenRouter keys are missing."
                                                        : !configStatus.isDeepgramConfigured
                                                            ? "Deepgram key is missing (STT)."
                                                            : "OpenRouter key is missing (LLM)."}
                                                </span>
                                                <Link href="/settings" className="ml-2 font-bold underline hover:text-red-800 transition-colors">
                                                    Configure
                                                </Link>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="agent-name">Agent Name</Label>
                                <Input
                                    id="agent-name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Sales Agent"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="outbound-number">Outbound Phone Number</Label>
                                <Select
                                    value={formData.outboundPhoneNumber}
                                    onValueChange={(value) => setFormData({ ...formData, outboundPhoneNumber: value })}
                                    disabled={loading}
                                >
                                    <SelectTrigger id="outbound-number">
                                        <SelectValue placeholder="Select an outbound phone number" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Outbound Number</SelectItem>
                                        {phoneNumbers.map((num: any) => (
                                            <SelectItem key={num._id} value={num._id}>
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-muted-foreground" />
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
                                <p className="text-[10px] text-muted-foreground italic">
                                    Calls made by this agent will display this number as the Caller ID.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="system-prompt">System Prompt (Long Text)</Label>
                                <Textarea
                                    id="system-prompt"
                                    value={formData.systemPrompt}
                                    onChange={(e) =>
                                        setFormData({ ...formData, systemPrompt: e.target.value })
                                    }
                                    placeholder="You are a professional sales agent..."
                                    rows={8}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="opening-message">Opening Message (Template)</Label>
                                <Textarea
                                    id="opening-message"
                                    value={formData.openingMessage}
                                    onChange={(e) =>
                                        setFormData({ ...formData, openingMessage: e.target.value })
                                    }
                                    placeholder="Hi {{name}}, this is calling from {{company}}..."
                                    rows={4}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* --- Knowledge Base Selection --- */}
                            <div className="space-y-4 pt-2 border-t mt-2">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    <Label className="text-sm font-bold uppercase tracking-wider">Knowledge Base Integration</Label>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="kb-select" className="text-xs text-muted-foreground">Select a Knowledge Base</Label>
                                    <Select
                                        value={formData.knowledgeBaseId}
                                        onValueChange={(value) => setFormData({ ...formData, knowledgeBaseId: value })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="kb-select">
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
                                                    No knowledge bases found. <Link href="/knowledge-base" className="underline font-bold">Create one</Link>
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.knowledgeBaseId !== "none" && (
                                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border bg-muted/20 animate-in zoom-in-95 duration-200">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="use-basic-info"
                                                checked={formData.kbSettings.useBasicInfo}
                                                onCheckedChange={(checked) => setFormData({
                                                    ...formData,
                                                    kbSettings: { ...formData.kbSettings, useBasicInfo: checked }
                                                })}
                                                className="scale-75"
                                            />
                                            <Label htmlFor="use-basic-info" className="text-[10px] uppercase font-bold text-muted-foreground">Basic Info</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="use-faqs"
                                                checked={formData.kbSettings.useFaqs}
                                                onCheckedChange={(checked) => setFormData({
                                                    ...formData,
                                                    kbSettings: { ...formData.kbSettings, useFaqs: checked }
                                                })}
                                                className="scale-75"
                                            />
                                            <Label htmlFor="use-faqs" className="text-[10px] uppercase font-bold text-muted-foreground">FAQs</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="use-other-info"
                                                checked={formData.kbSettings.useOtherInfo}
                                                onCheckedChange={(checked) => setFormData({
                                                    ...formData,
                                                    kbSettings: { ...formData.kbSettings, useOtherInfo: checked }
                                                })}
                                                className="scale-75"
                                            />
                                            <Label htmlFor="use-other-info" className="text-[10px] uppercase font-bold text-muted-foreground">Other Info</Label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* --- Language Configuration --- */}
                            <div className="space-y-4 pt-2 border-t mt-2">
                                <div className="flex items-center gap-2">
                                    <Languages className="h-4 w-4 text-primary" />
                                    <Label className="text-sm font-bold uppercase tracking-wider">Voice Language</Label>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="language-select" className="text-xs text-muted-foreground">Select Preferred Language</Label>
                                    <Select
                                        value={formData.language}
                                        onValueChange={(value) => setFormData({ ...formData, language: value })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger id="language-select">
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
                                        <p className="text-[10px] text-amber-600 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 italic">
                                            Auto-detect allows the agent to recognize and respond in multiple languages within the same call.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* --- Appointment Booking Configuration --- */}
                            <div className="space-y-4 pt-4 border-t mt-4 mb-4">
                                <div className="flex items-center justify-between rounded-xl border p-4 bg-primary/5 border-primary/10">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-4 w-4 text-primary" />
                                            <Label className="text-sm font-bold uppercase tracking-wider cursor-pointer" htmlFor="appointment-booking">Appointment Booking</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Allow agent to book and manage appointments using tools.
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
                                    <div className="grid gap-2 animate-in slide-in-from-top-2 duration-200">
                                        <Label htmlFor="appointment-desc" className="text-xs font-semibold text-muted-foreground">Appointment Description</Label>
                                        <Textarea
                                            id="appointment-desc"
                                            value={formData.appointmentDescription}
                                            onChange={(e) => setFormData({ ...formData, appointmentDescription: e.target.value })}
                                            placeholder="E.g. Product consultation or service inquiry."
                                            rows={3}
                                            disabled={loading}
                                        />
                                        <p className="text-[10px] text-muted-foreground italic">
                                            This description helps the AI understand what kind of appointments it is booking.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* --- Voice Configuration Section --- */}
                            {(() => {
                                const selectedNumber = phoneNumbers.find(n => n._id === formData.outboundPhoneNumber);
                                const isSipNumber = selectedNumber?.provider === 'sip';
                                const isTwilioNumber = selectedNumber?.provider === 'twilio';

                                // Unified visibility logic
                                const showTwilioVoices = configStatus?.isTwilioConfigured && !isSipNumber;
                                const forceCustomVoice = !configStatus?.isTwilioConfigured || isSipNumber;

                                if (configStatus && !configStatus.isTwilioConfigured && !configStatus.isElevenLabsConfigured) {
                                    return (
                                        <Alert variant="destructive" className="border-red-500/20 bg-red-500/5">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle className="text-sm font-bold">Voice Configuration Required</AlertTitle>
                                            <AlertDescription className="text-xs space-y-2 mt-1">
                                                <p>You must configure either <strong>ElevenLabs</strong> (works with SIP & Twilio) or <strong>Twilio</strong> in your settings to enable voice features.</p>
                                                <Link href="/settings" className="inline-block font-bold underline hover:text-red-400">
                                                    Go to Settings
                                                </Link>
                                            </AlertDescription>
                                        </Alert>
                                    );
                                }

                                return (
                                    <>
                                        {/* Only show the custom voice toggle if Twilio IS configured AND it's NOT a SIP number (where custom is mandatory) */}
                                        {showTwilioVoices && (
                                            <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold uppercase">Custom Voice Persona</Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Use ultra-high quality ElevenLabs streaming voices.
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={formData.useCustomVoice}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, useCustomVoice: checked })}
                                                />
                                            </div>
                                        )}

                                        {/* Show ElevenLabs section if Custom Voice is enabled OR if Twilio is not configured OR it's a SIP number */}
                                        {(formData.useCustomVoice || forceCustomVoice) ? (
                                            <div className="grid gap-2 border-l-2 border-primary/20 pl-4 py-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="voice-id">Premium Voice (ElevenLabs)</Label>
                                                    {isSipNumber && (
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter h-5 border-primary/20 text-primary bg-primary/5">
                                                            Required for SIP
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <Select
                                                            value={formData.voiceId}
                                                            onValueChange={(value) => {
                                                                const selectedVoice = voices.find(v => v.voice_id === value);
                                                                setFormData({ ...formData, voiceId: value, voiceName: selectedVoice?.name || "Rachel" });
                                                            }}
                                                            disabled={loading || fetchingVoices}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={fetchingVoices ? "Loading voices..." : "Select a professional voice"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {voices.map((v) => (
                                                                    <SelectItem key={v.voice_id} value={v.voice_id}>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">{v.name}</span>
                                                                            <span className="text-[10px] text-muted-foreground uppercase">
                                                                                {v.category} {v.labels?.gender ? `· ${v.labels.gender}` : ''}
                                                                            </span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                                {voices.length === 0 && !fetchingVoices && (
                                                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                                                        No voices found. Check API keys.
                                                                    </div>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {formData.voiceId && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="shrink-0 h-10 w-10 border-muted-foreground/20"
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
                                                    <p className="text-[10px] text-destructive font-bold mt-1 animate-pulse">
                                                        {fetchVoicesError} <Link href="/settings" className="underline">Settings</Link>
                                                    </p>
                                                ) : !configStatus?.isElevenLabsConfigured ? (
                                                    <p className="text-[10px] text-destructive font-medium mt-1 italic">
                                                        ElevenLabs is not configured. <Link href="/settings" className="underline">Configure now</Link> to use premium voices.
                                                    </p>
                                                ) : voices.length === 0 && !fetchingVoices && (
                                                    <p className="text-[10px] text-muted-foreground mt-1 italic">
                                                        No custom voices found in your account.
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            /* Only show Twilio section if Twilio IS configured, NOT a SIP number, and Custom Voice is NOT enabled */
                                            showTwilioVoices && (
                                                <div className="grid gap-2 animate-in fade-in duration-300">
                                                    <Label htmlFor="twilio-voice">Standard Voice (Twilio)</Label>
                                                    <Select
                                                        value={formData.voice}
                                                        onValueChange={(value) => setFormData({ ...formData, voice: value })}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select a standard voice" />
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
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
