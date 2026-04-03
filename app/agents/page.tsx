"use client";

import { useEffect, useState, useCallback } from "react";
import { Bot, Loader2, MoreHorizontal, Pencil, Trash2, MessageSquare, Mic, LayoutGrid, List, Brain, Calendar, Hash } from "lucide-react";
import { AgentDialog } from "@/components/agents/agent-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import axios from "axios";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Agent {
    _id: string;
    name: string;
    systemPrompt: string;
    openingMessage: string;
    voice?: string;
    voiceId?: string;
    voiceName?: string;
    useCustomVoice: boolean;
    outboundPhoneNumber?: { _id: string; phoneNumber: string; name: string };
    createdAt: string;
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"card" | "list">("card");
    const [isMobile, setIsMobile] = useState(false);
    const [hasHydrated, setHasHydrated] = useState(false);

    // Initial load from localStorage and mobile check
    useEffect(() => {
        const savedView = localStorage.getItem("agents_view_mode");
        if (savedView === "list" || savedView === "card") {
            setViewMode(savedView);
        }

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        setHasHydrated(true);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Save to localStorage when viewMode changes
    useEffect(() => {
        if (hasHydrated) {
            localStorage.setItem("agents_view_mode", viewMode);
        }
    }, [viewMode, hasHydrated]);

    const fetchAgents = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/agents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                setAgents(response.data.data.agents);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load agents");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this agent?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_BASE_URL}/agents/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Agent deleted successfully");
            fetchAgents();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete agent");
        }
    };

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">AI Agents</h1>
                    <p className="text-muted-foreground">Configure your AI calling agents</p>
                </div>
                <div className="flex items-center gap-4">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "card" | "list")} className="hidden md:block">
                        <TabsList className="bg-muted">
                            <TabsTrigger value="card" className="data-[state=active]:bg-background">
                                <LayoutGrid className="h-4 w-4 mr-2" />
                                Cards
                            </TabsTrigger>
                            <TabsTrigger value="list" className="data-[state=active]:bg-background">
                                <List className="h-4 w-4 mr-2" />
                                List
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <AgentDialog onSuccess={fetchAgents} />
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : agents.length > 0 ? (
                (viewMode === "card" || isMobile) ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {agents.map((agent) => (
                            <Card key={agent._id} className="flex flex-col group transition-all duration-300 border-muted/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                                    <Bot className="h-6 w-6" />
                                                </div>
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold leading-none mb-1.5">{agent.name}</CardTitle>
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    <Badge variant="secondary" className="px-1.5 h-5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground bg-muted/50">
                                                        <Mic className="mr-1 h-3 w-3" />
                                                        {agent.useCustomVoice ? (agent.voiceName || "Premium Voice") : (agent.voice || "Standard Voice")}
                                                    </Badge>
                                                    {agent.outboundPhoneNumber && (
                                                        <Badge variant="outline" className="px-1.5 h-5 text-[10px] font-bold tracking-wider uppercase border-primary/20 text-primary bg-primary/5">
                                                            <Hash className="mr-1 h-3 w-3" />
                                                            {agent.outboundPhoneNumber.phoneNumber}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            Opening Message
                                        </div>
                                        <div className="p-4 rounded-xl bg-muted/40 border border-muted/40 text-sm italic text-foreground/80 leading-relaxed line-clamp-4">
                                            &quot;{agent.openingMessage}&quot;
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            <Brain className="h-3.5 w-3.5" />
                                            System Prompt
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed pl-1">
                                            {agent.systemPrompt}
                                        </p>
                                    </div>
                                </CardContent>
                                <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between mt-auto">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-mono font-medium text-muted-foreground/60 uppercase">
                                            ID: {agent._id.slice(-6)}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                                            <Calendar className="h-3 w-3 opacity-70" />
                                            Created {new Date(agent.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AgentDialog
                                            agent={agent}
                                            onSuccess={fetchAgents}
                                            trigger={
                                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                                    <Pencil className="mr-1.5 h-3 w-3" />
                                                    Edit
                                                </Button>
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleDelete(agent._id)}
                                        >
                                            <Trash2 className="mr-1.5 h-3 w-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Agent Name</TableHead>
                                    <TableHead>Voice</TableHead>
                                    <TableHead className="max-w-[300px]">Opening Message</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agents.map((agent) => (
                                    <TableRow key={agent._id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                                                    <Bot className="h-4 w-4" />
                                                </div>
                                                {agent.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mic className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs">
                                                    {agent.useCustomVoice
                                                        ? (agent.voiceName || agent.voiceId || "Rachel")
                                                        : (agent.voice || "Standard")}
                                                </span>
                                                {agent.outboundPhoneNumber && (
                                                    <div className="flex items-center gap-1 mt-1 font-mono text-[10px] text-primary">
                                                        <Hash className="h-2.5 w-2.5" />
                                                        {agent.outboundPhoneNumber.phoneNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <p className="text-xs text-muted-foreground truncate italic">
                                                &quot;{agent.openingMessage}&quot;
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(agent.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <AgentDialog
                                                    agent={agent}
                                                    onSuccess={fetchAgents}
                                                    trigger={
                                                        <Button variant="outline" size="sm" className="h-7 text-xs">
                                                            <Pencil className="mr-1.5 h-3 w-3" />
                                                            Edit
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleDelete(agent._id)}
                                                >
                                                    <Trash2 className="mr-1.5 h-3 w-3" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )
            ) : (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Bot />
                        </EmptyMedia>
                        <EmptyTitle>No AI Agents Yet</EmptyTitle>
                        <EmptyDescription>
                            You haven&apos;t created any AI agents yet. Create your first agent to start making intelligent calls.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <AgentDialog onSuccess={fetchAgents} />
                    </EmptyContent>
                </Empty>
            )}
        </div>
    );
}
