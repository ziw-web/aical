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
    Hash,
    MoreVertical,
    Edit,
    Trash2,
    Loader2,
    ArrowLeft,
    Info,
    Settings,
    PhoneIncoming,
    User,
    Phone
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { PhoneNumberDialog } from "@/components/numbers/phone-number-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function PhoneNumbersPage() {
    const [numbers, setNumbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<any>(null);
    const [isTwilioConfigured, setIsTwilioConfigured] = useState(true);

    const fetchNumbers = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/numbers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                setNumbers(response.data.data.numbers);
            }

            // Also check Twilio config status
            const configRes = await axios.get(`${API_BASE_URL}/settings/config-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (configRes.data?.status === "success") {
                setIsTwilioConfigured(configRes.data.data.isTwilioConfigured);
            }
        } catch (err: any) {
            console.error("Failed to fetch data:", err);
            toast.error("Failed to load phone numbers");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNumbers();
    }, [fetchNumbers]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this phone number?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_BASE_URL}/numbers/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Phone number removed");
            fetchNumbers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete");
        }
    };

    const handleEdit = (number: any) => {
        setSelectedNumber(number);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedNumber(null);
        setDialogOpen(true);
    };

    const [testingNumberId, setTestingNumberId] = useState<string | null>(null);

    const handleTestCall = async (number: any) => {
        const phoneToCall = prompt("Enter the phone number to call (with country code, e.g. +1234567890):");
        if (!phoneToCall) return;

        try {
            setTestingNumberId(number._id);
            const token = localStorage.getItem("token");
            await axios.post(`${API_BASE_URL}/calls/test`, {
                to: phoneToCall,
                fromNumberId: number._id
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Test call initiated! Check your phone.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to initiate test call");
        } finally {
            setTestingNumberId(null);
        }
    };

    return (
        <div className="flex-col md:flex">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Phone Numbers</h1>
                        <p className="text-muted-foreground">Manage your Twilio phone numbers and inbound call agents.</p>
                    </div>
                    <Button onClick={handleAdd} className="w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Number
                    </Button>
                </div>

                {!isTwilioConfigured && (
                    <Alert variant="destructive">
                        <Settings className="h-4 w-4" />
                        <AlertTitle>Twilio Not Configured</AlertTitle>
                        <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span>You need to configure your Twilio SID and Token in Settings before you can use these numbers.</span>
                            <Button variant="outline" size="sm" asChild className="bg-white hover:bg-slate-50 border-input shrink-0">
                                <Link href="/settings">Configure Now</Link>
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Hash className="h-5 w-5 text-primary" />
                            <CardTitle>Connected Numbers</CardTitle>
                        </div>
                        <CardDescription>
                            Your Twilio numbers that are ready to handle outbound campaigns and inbound calls.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : numbers.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                <Hash className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No numbers connected</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-6">
                                    Add your first Twilio phone number to start making AI voice calls.
                                </p>
                                <Button onClick={handleAdd} variant="outline" className="rounded-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Number
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-xl border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px]">Friendly Name</TableHead>
                                            <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px]">Phone Number</TableHead>
                                            <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px]">Inbound Agent</TableHead>
                                            <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px]">Test Call</TableHead>
                                            <TableHead className="py-4 text-right font-bold text-slate-500 uppercase text-[10px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {numbers.map((number) => (
                                            <TableRow key={number._id} className="hover:bg-slate-50/30 transition-colors">
                                                <TableCell className="py-4 font-bold text-slate-900">
                                                    {number.name}
                                                </TableCell>
                                                <TableCell className="py-4 font-mono text-slate-600">
                                                    {number.phoneNumber}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {number.inboundAgentId ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-primary/10 p-1.5 rounded-lg">
                                                                <User className="h-3.5 w-3.5 text-primary" />
                                                            </div>
                                                            <span className="font-medium">{number.inboundAgentId.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">No Agent Assigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs"
                                                        onClick={() => handleTestCall(number)}
                                                        disabled={testingNumberId === number._id}
                                                    >
                                                        {testingNumberId === number._id ? (
                                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Phone className="mr-2 h-3 w-3" />
                                                        )}
                                                        {testingNumberId === number._id ? "Calling..." : "Test Call"}
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
                                                            <DropdownMenuItem onClick={() => handleEdit(number)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(number._id)}>
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

                <div className="mt-12 bg-slate-50/80 p-6 rounded-2xl border border-dashed border-slate-200">
                    <div className="flex items-start gap-4">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 shrink-0">
                            <Info className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-900">How Inbound Calling Works</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                To receive inbound calls, you must point your Twilio phone number's <strong>"A Call Comes In"</strong> webhook to:
                                <code className="block mt-2 p-3 bg-white border rounded-lg font-mono text-xs text-primary">
                                    {API_BASE_URL.replace('/api', '')}/twilio/voice
                                </code>
                                Once pointed, any call to your number will automatically be handled by the Inbound Agent you assigned in the table above.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <PhoneNumberDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                phoneNumber={selectedNumber}
                onSuccess={fetchNumbers}
            />
        </div>
    );
}
