"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, XCircle, AlertCircle, Plus, Trash2, CalendarDays, Bot, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AvailabilityManager } from "@/components/appointments/availability-manager";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("appointments");
    const [viewMode, setViewMode] = useState<"card" | "list">("card");

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                setAppointments(response.data.data.appointments);
            }
        } catch (err) {
            console.error("Failed to fetch appointments:", err);
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`${API_BASE_URL}/appointments/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Appointment ${status}`);
            fetchAppointments();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Appointments</h1>
                    <p className="text-muted-foreground">
                        Manage scheduled sessions and define your availability.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="appointments" className="gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Appointments
                        </TabsTrigger>
                        <TabsTrigger value="slots" className="gap-2">
                            <Clock className="h-4 w-4" />
                            Availability & Slots
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === "appointments" && (
                        <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/40">
                            <Button
                                variant={viewMode === "card" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setViewMode("card")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setViewMode("list")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <TabsContent value="appointments" className="space-y-4">
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-8 w-full mb-2" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : appointments.length > 0 ? (
                        viewMode === "card" ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {appointments.map((app) => (
                                    <Card key={app._id} className={app.status === 'canceled' ? 'opacity-60' : ''}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                {format(new Date(app.dateTime), "PPP")}
                                            </CardTitle>
                                            <Badge variant={app.status === 'scheduled' ? 'default' : app.status === 'completed' ? 'outline' : 'destructive'}>
                                                {app.status}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="text-2xl font-bold">{format(new Date(app.dateTime), "p")}</div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="h-3 w-3" />
                                                {(app.clientName && app.clientName.trim()) || (app.leadId && [app.leadId.firstName, app.leadId.lastName].filter(Boolean).join(" ").trim()) || app.clientPhone || "Client"}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                {app.clientPhone}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Bot className="h-3 w-3" />
                                                Agent: {app.agentId?.name || "Deleted Agent"}
                                            </div>

                                            {app.status === 'scheduled' && (
                                                <div className="flex gap-2 pt-2 mt-2 border-t">
                                                    <Button size="sm" variant="outline" className="h-8 flex-1 gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => updateStatus(app._id, 'completed')}>
                                                        <CheckCircle2 className="h-3 w-3" /> Complete
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 flex-1 gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateStatus(app._id, 'canceled')}>
                                                        <XCircle className="h-3 w-3" /> Cancel
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Lead</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Agent</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {appointments.map((app) => (
                                            <TableRow key={app._id} className={app.status === 'canceled' ? 'opacity-60' : ''}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{format(new Date(app.dateTime), "PPP")}</span>
                                                        <span className="text-muted-foreground text-xs">{format(new Date(app.dateTime), "p")}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                        {(app.clientName && app.clientName.trim()) || (app.leadId && [app.leadId.firstName, app.leadId.lastName].filter(Boolean).join(" ").trim()) || app.clientPhone || "Client"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                        {app.clientPhone}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Bot className="h-3 w-3 text-muted-foreground" />
                                                        {app.agentId?.name || "Deleted Agent"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={app.status === 'scheduled' ? 'default' : app.status === 'completed' ? 'outline' : 'destructive'} className="capitalize">
                                                        {app.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {app.status === 'scheduled' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus(app._id, 'completed')} title="Mark Completed">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateStatus(app._id, 'canceled')} title="Cancel Appointment">
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )
                    ) : (
                        <Card className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                            <CalendarDays className="h-12 w-12 text-muted-foreground/20 mb-4" />
                            <CardDescription>No appointments found.</CardDescription>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="slots" className="space-y-4">
                    <AvailabilityManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
