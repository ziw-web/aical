"use client";

import { useState } from "react";
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
import { Tag } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface BulkTagDialogProps {
    selectedIds: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function BulkTagDialog({ selectedIds, open, onOpenChange, onSuccess }: BulkTagDialogProps) {
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tags.trim()) {
            toast.error("Please enter at least one tag");
            return;
        }

        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "");

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`${API_BASE_URL}/leads/bulk/tags`, {
                ids: selectedIds,
                tags: tagsArray
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            toast.success(`Tags added to ${selectedIds.length} lead(s)`);
            onSuccess();
            setTags("");
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add tags");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Bulk Add Tags
                    </DialogTitle>
                    <DialogDescription>
                        Add tags to {selectedIds.length} selected lead(s).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="bulk-add-tags">Tags (comma separated)</Label>
                            <Input
                                id="bulk-add-tags"
                                placeholder="priority, follow-up, q1"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Tags"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
