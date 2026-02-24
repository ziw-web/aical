"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Play, Loader2, CheckCircle2, Clock, StopCircle, Bot, Users, LayoutGrid, List, MoreHorizontal, Trash2 } from "lucide-react";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
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

interface Campaign {
    _id: string;
    name: string;
    agentId: {
        _id: string;
        name: string;
    } | null;
    leadIds: string[];
    status: "idle" | "running" | "completed" | "stopped";
    createdAt: string;
}

export default function CampaignsPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"card" | "list">("card");
    const [isMobile, setIsMobile] = useState(false);
    const [hasHydrated, setHasHydrated] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    // Initial load from localStorage and mobile check
    useEffect(() => {
        const savedView = localStorage.getItem("campaigns_view_mode");
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
            localStorage.setItem("campaigns_view_mode", viewMode);
        }
    }, [viewMode, hasHydrated]);

    const fetchCampaigns = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/campaigns`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                setCampaigns(response.data.data.campaigns);
            }
        } catch (err: any) {
            toast.error("Failed to load campaigns");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    const startCampaign = async (id: string) => {
        try {
            const token = localStorage.getItem("token");

            // Check config status first
            const configResp = await axios.get(`${API_BASE_URL}/settings/config-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (configResp.data?.status === "success") {
                const status = configResp.data.data;
                if (!status.isTwilioConfigured) {
                    toast.error("Twilio is not configured. Please complete setup in Settings.");
                    return;
                }
                if (!status.isDeepgramConfigured || !status.isModelConfigured) {
                    toast.error("Deepgram or Model keys are missing. Calls may fail.");
                }
            }

            await axios.post(`${API_BASE_URL}/campaigns/${id}/start`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Campaign started successfully");
            fetchCampaigns(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to start campaign");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this campaign?")) return;
        try {
            setIsDeleting(true);
            const token = localStorage.getItem("token");
            await axios.delete(`${API_BASE_URL}/campaigns/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Campaign deleted successfully");
            setSelectedIds(prev => prev.filter(item => item !== id));
            fetchCampaigns();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete campaign");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} campaigns?`)) return;
        try {
            setIsDeleting(true);
            const token = localStorage.getItem("token");
            await axios.post(`${API_BASE_URL}/campaigns/bulk-delete`, { ids: selectedIds }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Campaigns deleted successfully");
            setSelectedIds([]);
            fetchCampaigns();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete campaigns");
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === campaigns.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(campaigns.map(c => c._id));
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    // Polling logic if any campaign is running
    useEffect(() => {
        const hasRunningCampaign = campaigns.some(c => c.status === "running");

        if (hasRunningCampaign) {
            if (!pollInterval.current) {
                pollInterval.current = setInterval(() => {
                    fetchCampaigns(false);
                }, 3000); // Poll every 3 seconds
            }
        } else {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }
        }

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }
        };
    }, [campaigns, fetchCampaigns]);

    const getStatusBadge = (status: Campaign["status"]) => {
        const variants = {
            idle: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20",
            running: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 animate-pulse",
            completed: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20",
            stopped: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
        };

        const icons = {
            idle: <Clock className="mr-1 h-3 w-3" />,
            running: <Loader2 className="mr-1 h-3 w-3 animate-spin" />,
            completed: <CheckCircle2 className="mr-1 h-3 w-3" />,
            stopped: <StopCircle className="mr-1 h-3 w-3" />,
        };

        return (
            <Badge variant="outline" className={`${variants[status]} flex w-fit items-center px-2 py-0.5 capitalize`}>
                {icons[status]}
                {status}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Campaigns</h1>
                    <p className="text-muted-foreground">Orchestrate and monitor your calling campaigns</p>
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
                    <CreateCampaignDialog onSuccess={() => fetchCampaigns()} />
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : campaigns.length > 0 ? (
                (viewMode === "card" || isMobile) ? (
                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map((campaign) => (
                            <Card
                                key={campaign._id}
                                className={`flex flex-col transition-all duration-300 hover:shadow-lg cursor-pointer ${campaign.status === "running" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                onClick={() => router.push(`/campaigns/${campaign._id}`)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-bold">{campaign.name}</CardTitle>
                                            <CardDescription>
                                                Created {new Date(campaign.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(campaign.status)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4 pt-0">
                                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                <Bot className="h-3.5 w-3.5" />
                                                AI Agent
                                            </div>
                                            <p className="text-sm font-semibold truncate">
                                                {campaign.agentId?.name || "Deleted Agent"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                <Users className="h-3.5 w-3.5" />
                                                Total Leads
                                            </div>
                                            <p className="text-sm font-semibold">
                                                {campaign.leadIds.length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between mt-auto">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-mono font-medium text-muted-foreground/60 uppercase">
                                            ID: {campaign._id.slice(-6)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={campaign.status === "running" ? "destructive" : "default"}
                                            disabled={campaign.status === "completed"}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startCampaign(campaign._id);
                                            }}
                                        >
                                            {campaign.status === "running" ? (
                                                <>
                                                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                                    Active
                                                </>
                                            ) : campaign.status === "completed" ? (
                                                <>
                                                    <CheckCircle2 className="mr-1.5 h-3 w-3" />
                                                    Done
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="mr-1.5 h-3 w-3 fill-current" />
                                                    Start
                                                </>
                                            )}
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
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedIds.length === campaigns.length && campaigns.length > 0}
                                            onCheckedChange={toggleAll}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[200px]">Campaign Name</TableHead>
                                    <TableHead>Agent</TableHead>
                                    <TableHead>Leads</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <TableRow
                                        key={campaign._id}
                                        className={`cursor-pointer group ${selectedIds.includes(campaign._id) ? "bg-muted/50" : ""}`}
                                        onClick={() => router.push(`/campaigns/${campaign._id}`)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.includes(campaign._id)}
                                                onCheckedChange={() => toggleSelection(campaign._id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                                                    <Megaphone className="h-4 w-4" />
                                                </div>
                                                {campaign.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm">{campaign.agentId?.name || "Deleted Agent"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm">{campaign.leadIds.length}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(campaign.status)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {new Date(campaign.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2 px-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/campaigns/${campaign._id}`);
                                                    }}
                                                >
                                                    <List className="mr-1.5 h-3 w-3" />
                                                    Details
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={campaign.status === "running" ? "destructive" : "default"}
                                                    className="h-7 text-xs"
                                                    disabled={campaign.status === "completed"}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startCampaign(campaign._id);
                                                    }}
                                                >
                                                    {campaign.status === "running" ? (
                                                        <>
                                                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="mr-1.5 h-3 w-3 fill-current" />
                                                            Start
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    disabled={campaign.status === "running" || isDeleting}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(campaign._id);
                                                    }}
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
                <Empty className="border border-dashed py-12">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Megaphone />
                        </EmptyMedia>
                        <EmptyTitle>No Campaigns Yet</EmptyTitle>
                        <EmptyDescription>
                            You haven&apos;t created any campaigns yet. Create your first campaign to start reaching out to leads.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <CreateCampaignDialog onSuccess={() => fetchCampaigns()} />
                    </EmptyContent>
                </Empty>
            )}

            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-background border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
                        <span className="text-sm font-medium">
                            {selectedIds.length} campaign{selectedIds.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIds([])}
                                className="h-8 rounded-full"
                            >
                                Deselect All
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="h-8 rounded-full shadow-lg shadow-destructive/20"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
