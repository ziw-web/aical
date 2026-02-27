"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Server,
    MoreVertical,
    Edit,
    Trash2,
    Loader2,
    Wifi,
    WifiOff,
    TestTube,
    RefreshCw,
    Globe,
    MapPin,
    Activity,
    CheckCircle2,
    XCircle,
    Info,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { SipTrunkDialog } from "@/components/sip-trunks/sip-trunk-dialog";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function SipTrunksPage() {
    const [trunks, setTrunks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTrunk, setSelectedTrunk] = useState<any>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [reloading, setReloading] = useState(false);
    const [asteriskStatus, setAsteriskStatus] = useState<{
        asteriskConnected: boolean;
        activeSipCalls: number;
    } | null>(null);

    const fetchTrunks = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const [trunksRes, statusRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/sip-trunks`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API_BASE_URL}/sip-trunks/asterisk/status`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).catch(() => null),
            ]);

            if (trunksRes.data?.status === "success") {
                setTrunks(trunksRes.data.data.trunks);
            }
            if (statusRes?.data?.status === "success") {
                setAsteriskStatus(statusRes.data.data);
            }
        } catch (err: any) {
            toast.error("Failed to load SIP trunks");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrunks();
    }, [fetchTrunks]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this SIP trunk?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_BASE_URL}/sip-trunks/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("SIP trunk deleted");
            fetchTrunks();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete");
        }
    };

    const handleTest = async (id: string) => {
        setTestingId(id);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${API_BASE_URL}/sip-trunks/${id}/test`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = res.data?.data;
            if (data?.reachable) {
                toast.success(data.message);
            } else {
                toast.error(data?.message || "Test failed");
            }
            fetchTrunks();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Test failed");
        } finally {
            setTestingId(null);
        }
    };

    const handleReloadConfig = async () => {
        setReloading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${API_BASE_URL}/sip-trunks/reload-config`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.status === "success") {
                toast.success(res.data.message);
            } else {
                toast.warning(res.data?.message || "Config written with warnings");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Reload failed");
        } finally {
            setReloading(false);
        }
    };

    const handleEdit = (trunk: any) => {
        setSelectedTrunk(trunk);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedTrunk(null);
        setDialogOpen(true);
    };

    return (
        <div className="flex-col md:flex">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">SIP Trunks</h1>
                        <p className="text-muted-foreground">
                            Connect to local telecom providers (STC, Mobily, Zain) or any SIP-compatible carrier.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleReloadConfig} disabled={reloading} size="sm">
                            <RefreshCw className={cn("mr-2 h-4 w-4", reloading && "animate-spin")} />
                            Reload Asterisk
                        </Button>
                        <Button onClick={handleAdd}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add SIP Trunk
                        </Button>
                    </div>
                </div>

                {/* Asterisk Status Bar */}
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20">
                    <div className="flex items-center gap-2">
                        {asteriskStatus?.asteriskConnected ? (
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Asterisk Connected</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                <span className="text-sm font-semibold text-red-600 dark:text-red-400">Asterisk Offline</span>
                            </div>
                        )}
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Activity className="h-3.5 w-3.5" />
                        <span>{asteriskStatus?.activeSipCalls ?? 0} active SIP calls</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Server className="h-3.5 w-3.5" />
                        <span>{trunks.length} trunk{trunks.length !== 1 ? "s" : ""} configured</span>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-primary" />
                            <CardTitle>Configured Trunks</CardTitle>
                        </div>
                        <CardDescription>
                            Each trunk represents a connection to a SIP provider. Add your carrier credentials to start making calls.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : trunks.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                <Server className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground">No SIP trunks configured</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                    Add a SIP trunk to connect to your telecom provider and start making cost-effective calls.
                                </p>
                                <Button onClick={handleAdd} variant="outline" className="rounded-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add SIP Trunk
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px]">
                                                Trunk
                                            </TableHead>
                                            <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px]">
                                                Host
                                            </TableHead>
                                            <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px]">
                                                Provider / Region
                                            </TableHead>
                                            <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px]">
                                                Status
                                            </TableHead>
                                            <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px]">
                                                Last Test
                                            </TableHead>
                                            <TableHead className="py-4 font-bold text-muted-foreground uppercase text-[10px]">
                                                Test
                                            </TableHead>
                                            <TableHead className="py-4 text-right font-bold text-muted-foreground uppercase text-[10px]">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trunks.map((trunk) => (
                                            <TableRow key={trunk._id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 p-2 rounded-lg">
                                                            <Server className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-foreground">{trunk.name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                                {trunk.transport.toUpperCase()} · Port {trunk.port}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 font-mono text-sm text-muted-foreground">
                                                    {trunk.host}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {trunk.providerName && (
                                                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                                                <Globe className="h-3 w-3 text-muted-foreground" />
                                                                {trunk.providerName}
                                                            </div>
                                                        )}
                                                        {trunk.region && (
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <MapPin className="h-3 w-3" />
                                                                {trunk.region}
                                                            </div>
                                                        )}
                                                        {!trunk.providerName && !trunk.region && (
                                                            <span className="text-xs text-muted-foreground italic">—</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[9px] font-bold uppercase",
                                                            trunk.status === "active"
                                                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                                                                : "bg-muted text-muted-foreground border-border"
                                                        )}
                                                    >
                                                        {trunk.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {trunk.lastTestedAt ? (
                                                        <div className="flex items-center gap-1.5">
                                                            {trunk.lastTestResult === "success" ? (
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                            ) : (
                                                                <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                                                            )}
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(trunk.lastTestedAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Never</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs"
                                                        onClick={() => handleTest(trunk._id)}
                                                        disabled={testingId === trunk._id}
                                                    >
                                                        {testingId === trunk._id ? (
                                                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <TestTube className="mr-1.5 h-3 w-3" />
                                                        )}
                                                        {testingId === trunk._id ? "Testing..." : "Test"}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(trunk)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => handleDelete(trunk._id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Setup Info Box */}
                <div className="bg-muted/40 p-6 rounded-2xl border border-dashed border-border">
                    <div className="flex items-start gap-4">
                        <div className="bg-muted p-3 rounded-xl border border-border shrink-0">
                            <Info className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-foreground">How SIP Trunks Work</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                A SIP trunk connects IntelliCall to your telecom provider (e.g. STC, Mobily, Zain in Saudi Arabia, or global providers like Telnyx and Bandwidth).
                                Once configured, assign it to a phone number on the <strong className="text-foreground">Phone Numbers</strong> page,
                                then your AI agents will place and receive calls through the trunk, no Twilio required.
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                <strong className="text-foreground">Requirements:</strong> Asterisk must be installed on your server.
                                After adding or modifying trunks, click <strong className="text-foreground">&quot;Reload Asterisk&quot;</strong> to apply the configuration.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <SipTrunkDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                trunk={selectedTrunk}
                onSuccess={fetchTrunks}
            />
        </div>
    );
}
