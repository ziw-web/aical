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
import { Plus, Play, Pause, Volume2, Search, Loader2, AlertCircle, AlertTriangle, Hash } from "lucide-react";
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
    });
    const [voices, setVoices] = useState<Voice[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
    const [fetchingVoices, setFetchingVoices] = useState(false);
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (open) {
            fetchVoices();
            fetchPhoneNumbers();
            fetchConfigStatus();
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
                setConfigStatus(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch config status:", err);
        }
    };

    const fetchVoices = async () => {
        try {
            setFetchingVoices(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/agents/voices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                setVoices(response.data.data.voices);
            }
        } catch (err: any) {
            console.error("Failed to fetch voices:", err);
            const message = err.response?.data?.message || "Failed to load custom voices";
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
                outboundPhoneNumber: formData.outboundPhoneNumber === "none" ? null : formData.outboundPhoneNumber
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
                setFormData({ name: "", systemPrompt: "", openingMessage: "", voice: "Polly.Amy", voiceId: "", voiceName: "Rachel", useCustomVoice: false, outboundPhoneNumber: "none" });
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
                                    {!configStatus.isTwilioConfigured && (
                                        <Alert variant="warning" className="py-2 items-center">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <AlertDescription className="text-xs flex items-center justify-between w-full">
                                                <span>Twilio is not configured. Calls cannot be initiated.</span>
                                                <Link href="/settings" className="ml-2 font-bold underline hover:text-amber-900 transition-colors">
                                                    Configure
                                                </Link>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    {formData.useCustomVoice && !configStatus.isElevenLabsConfigured && (
                                        <Alert variant="destructive" className="py-2 items-center">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <AlertDescription className="text-xs flex items-center justify-between w-full">
                                                <span>ElevenLabs key is missing. Custom voices will not load.</span>
                                                <Link href="/settings" className="ml-2 font-bold underline hover:text-red-800 transition-colors">
                                                    Configure
                                                </Link>
                                            </AlertDescription>
                                        </Alert>
                                    )}
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

                            {formData.useCustomVoice ? (
                                <div className="grid gap-2 border-l-2 border-primary/20 pl-4 py-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <Label htmlFor="voice-id">Premium Voice (ElevenLabs)</Label>
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
                                </div>
                            ) : (
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
                            )}
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
