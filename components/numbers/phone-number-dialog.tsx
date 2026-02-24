"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { toast } from "sonner";
import axios from "axios";
import { Plus, Hash, UserCircle } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Agent {
    _id: string;
    name: string;
}

interface PhoneNumber {
    _id: string;
    phoneNumber: string;
    name: string;
    inboundAgentId?: any;
    status: string;
}

interface PhoneNumberDialogProps {
    phoneNumber?: PhoneNumber;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function PhoneNumberDialog({ phoneNumber, open, onOpenChange, onSuccess }: PhoneNumberDialogProps) {
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [formData, setFormData] = useState({
        phoneNumber: phoneNumber?.phoneNumber || "",
        name: phoneNumber?.name || "",
        inboundAgentId: phoneNumber?.inboundAgentId?._id || phoneNumber?.inboundAgentId || "none",
    });

    useEffect(() => {
        if (open) {
            fetchAgents();
            setFormData({
                phoneNumber: phoneNumber?.phoneNumber || "",
                name: phoneNumber?.name || "",
                inboundAgentId: phoneNumber?.inboundAgentId?._id || phoneNumber?.inboundAgentId || "none",
            });
        }
    }, [open, phoneNumber]);

    const fetchAgents = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/agents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.status === "success") {
                setAgents(response.data.data.agents);
            }
        } catch (err) {
            console.error("Failed to fetch agents:", err);
        }
    };

    const isEditing = !!phoneNumber;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const submissionData = {
                ...formData,
                inboundAgentId: formData.inboundAgentId === "none" ? null : formData.inboundAgentId
            };
            if (isEditing) {
                await axios.patch(`${API_BASE_URL}/numbers/${phoneNumber._id}`, submissionData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success("Phone number updated successfully!");
            } else {
                await axios.post(`${API_BASE_URL}/numbers`, submissionData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success("Phone number added successfully!");
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Phone Number" : "Add New Phone Number"}</DialogTitle>
                    <DialogDescription>
                        Configure your Twilio phone number and assign an inbound agent.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone-number">Phone Number (E.164)</Label>
                            <Input
                                id="phone-number"
                                value={formData.phoneNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, phoneNumber: e.target.value })
                                }
                                placeholder="+1234567890"
                                required
                                disabled={loading || isEditing}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Friendly Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="Sales Line - US"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="inbound-agent">Inbound Call Handling Agent</Label>
                            <Select
                                value={formData.inboundAgentId}
                                onValueChange={(value) => setFormData({ ...formData, inboundAgentId: value })}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an agent for inbound calls" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Agent (Hang up)</SelectItem>
                                    {agents.map((agent) => (
                                        <SelectItem key={agent._id} value={agent._id}>
                                            <div className="flex items-center gap-2">
                                                <UserCircle className="h-4 w-4 text-muted-foreground" />
                                                <span>{agent.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground italic">
                                Incoming calls to this number will be handled by the selected agent.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update" : "Add Number")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
