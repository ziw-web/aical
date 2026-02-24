"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Lead {
    _id: string;
    name: string;
    phone: string;
    fields: Array<{ name: string; value: any }>;
    tags: string[];
}

interface EditLeadDialogProps {
    lead: Lead;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditLeadDialog({ lead, open, onOpenChange, onSuccess }: EditLeadDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: lead.name,
        phone: lead.phone,
        company: lead.fields?.find(f => f.name === "company")?.value || "",
        tags: lead.tags?.join(", ") || "",
    });

    // Update form data when lead prop changes
    useEffect(() => {
        setFormData({
            name: lead.name,
            phone: lead.phone,
            company: lead.fields?.find(f => f.name === "company")?.value || "",
            tags: lead.tags?.join(", ") || "",
        });
    }, [lead]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const tagsArray = formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag !== "");

            await axios.patch(`${API_BASE_URL}/leads/${lead._id}`, {
                name: formData.name,
                phone: formData.phone,
                fields: formData.company ? [{ name: "company", value: formData.company }] : [],
                tags: tagsArray
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            toast.success("Lead updated successfully!");
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update lead");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Lead</DialogTitle>
                    <DialogDescription>
                        Update lead details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input
                                id="edit-phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                placeholder="+1234567890"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-company">Company (Optional)</Label>
                            <Input
                                id="edit-company"
                                value={formData.company}
                                onChange={(e) =>
                                    setFormData({ ...formData, company: e.target.value })
                                }
                                placeholder="Acme Inc."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-tags">Tags (Comma separated)</Label>
                            <Input
                                id="edit-tags"
                                value={formData.tags}
                                onChange={(e) =>
                                    setFormData({ ...formData, tags: e.target.value })
                                }
                                placeholder="customer, high-priority, vips"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
