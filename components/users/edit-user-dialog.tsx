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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { Pencil, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface EditUserDialogProps {
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
        sharedTags?: string[];
        sharedAgents?: string[];
        sharedCampaigns?: string[];
    };
    onUserUpdated: () => void;
}

interface Agent {
    _id: string;
    name: string;
}

interface Campaign {
    _id: string;
    name: string;
}

export function EditUserDialog({ user, onUserUpdated }: EditUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        role: user.role,
        sharedTags: user.sharedTags || [],
        sharedAgents: user.sharedAgents || [],
        sharedCampaigns: user.sharedCampaigns || [],
    });

    const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
    const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");

    useEffect(() => {
        if (open) {
            setFormData({
                role: user.role,
                sharedTags: user.sharedTags || [],
                sharedAgents: user.sharedAgents || [],
                sharedCampaigns: user.sharedCampaigns || [],
            });
            fetchData();
        }
    }, [open, user]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [agentsRes, campaignsRes, leadsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/agents`, { headers }),
                axios.get(`${API_BASE_URL}/campaigns`, { headers }),
                axios.get(`${API_BASE_URL}/leads`, { headers }), // To extract unique tags
            ]);

            if (agentsRes.data.status === "success") {
                setAvailableAgents(agentsRes.data.data.agents);
            }
            if (campaignsRes.data.status === "success") {
                setAvailableCampaigns(campaignsRes.data.data.campaigns);
            }
            if (leadsRes.data.status === "success") {
                // Extract unique tags from leads
                const tags = new Set<string>();
                leadsRes.data.data.leads.forEach((lead: any) => {
                    if (lead.tags && Array.isArray(lead.tags)) {
                        lead.tags.forEach((tag: string) => tags.add(tag));
                    }
                });
                setAvailableTags(Array.from(tags));
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.patch(`${API_BASE_URL}/users/${user._id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.status === "success") {
                toast.success("User updated successfully!");
                setOpen(false);
                onUserUpdated();
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to update user";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleArrayItem = (field: 'sharedTags' | 'sharedAgents' | 'sharedCampaigns', value: string) => {
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit User: {user.name}</DialogTitle>
                    <DialogDescription>
                        Update role and manage shared resources.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value) =>
                                setFormData({ ...formData, role: value })
                            }
                        >
                            <SelectTrigger id="edit-role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>Shared Tags (Leads Access)</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[80px]">
                            {availableTags.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic w-full text-center py-2">No tags found in leads</p>
                            ) : (
                                availableTags.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant={formData.sharedTags.includes(tag) ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-primary/90"
                                        onClick={() => toggleArrayItem('sharedTags', tag)}
                                    >
                                        {tag}
                                        {formData.sharedTags.includes(tag) && <Check className="ml-1 h-3 w-3" />}
                                    </Badge>
                                ))
                            )}
                        </div>
                        <div className="flex gap-2 items-center text-xs text-muted-foreground">
                            <span>Or manually add tag:</span>
                            <Input
                                className="h-7 w-[150px]"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (newTag && !formData.sharedTags.includes(newTag)) {
                                            toggleArrayItem('sharedTags', newTag);
                                            if (!availableTags.includes(newTag)) {
                                                setAvailableTags([...availableTags, newTag]);
                                            }
                                            setNewTag("");
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-7"
                                onClick={() => {
                                    if (newTag && !formData.sharedTags.includes(newTag)) {
                                        toggleArrayItem('sharedTags', newTag);
                                        if (!availableTags.includes(newTag)) {
                                            setAvailableTags([...availableTags, newTag]);
                                        }
                                        setNewTag("");
                                    }
                                }}
                            >
                                Add
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Shared Agents</Label>
                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-[150px] overflow-y-auto">
                            {availableAgents.length === 0 ? (
                                <p className="col-span-2 text-sm text-muted-foreground italic text-center py-2">No agents available</p>
                            ) : (
                                availableAgents.map(agent => (
                                    <div
                                        key={agent._id}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-md border text-sm cursor-pointer transition-colors",
                                            formData.sharedAgents.includes(agent._id)
                                                ? "bg-primary/10 border-primary/30"
                                                : "hover:bg-muted"
                                        )}
                                        onClick={() => toggleArrayItem('sharedAgents', agent._id)}
                                    >
                                        <div className={cn(
                                            "h-4 w-4 rounded-sm border flex items-center justify-center",
                                            formData.sharedAgents.includes(agent._id)
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-muted-foreground"
                                        )}>
                                            {formData.sharedAgents.includes(agent._id) && <Check className="h-3 w-3" />}
                                        </div>
                                        <span className="truncate">{agent.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Shared Campaigns</Label>
                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-[150px] overflow-y-auto">
                            {availableCampaigns.length === 0 ? (
                                <p className="col-span-2 text-sm text-muted-foreground italic text-center py-2">No campaigns available</p>
                            ) : (
                                availableCampaigns.map(campaign => (
                                    <div
                                        key={campaign._id}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-md border text-sm cursor-pointer transition-colors",
                                            formData.sharedCampaigns.includes(campaign._id)
                                                ? "bg-primary/10 border-primary/30"
                                                : "hover:bg-muted"
                                        )}
                                        onClick={() => toggleArrayItem('sharedCampaigns', campaign._id)}
                                    >
                                        <div className={cn(
                                            "h-4 w-4 rounded-sm border flex items-center justify-center",
                                            formData.sharedCampaigns.includes(campaign._id)
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-muted-foreground"
                                        )}>
                                            {formData.sharedCampaigns.includes(campaign._id) && <Check className="h-3 w-3" />}
                                        </div>
                                        <span className="truncate">{campaign.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
