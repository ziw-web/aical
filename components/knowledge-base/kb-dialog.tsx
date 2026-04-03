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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import { Plus, Trash2, Database, HelpCircle, Info, FileText } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface FAQ {
    question: string;
    answer: string;
}

interface KnowledgeBase {
    _id: string;
    name: string;
    description: string;
    basicInfo: string;
    faqs: FAQ[];
    otherInfo: string;
}

interface KBDialogProps {
    kb?: KnowledgeBase;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function KBDialog({ kb, trigger, onSuccess }: KBDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: kb?.name || "",
        description: kb?.description || "",
        basicInfo: kb?.basicInfo || "",
        otherInfo: kb?.otherInfo || "",
        faqs: kb?.faqs || [] as FAQ[],
    });

    useEffect(() => {
        if (open && kb) {
            setFormData({
                name: kb.name,
                description: kb.description || "",
                basicInfo: kb.basicInfo || "",
                otherInfo: kb.otherInfo || "",
                faqs: kb.faqs || [],
            });
        } else if (open && !kb) {
            setFormData({
                name: "",
                description: "",
                basicInfo: "",
                otherInfo: "",
                faqs: [],
            });
        }
    }, [open, kb]);

    const handleAddFAQ = () => {
        setFormData({
            ...formData,
            faqs: [...formData.faqs, { question: "", answer: "" }],
        });
    };

    const handleRemoveFAQ = (index: number) => {
        const newFaqs = [...formData.faqs];
        newFaqs.splice(index, 1);
        setFormData({ ...formData, faqs: newFaqs });
    };

    const handleFAQChange = (index: number, field: keyof FAQ, value: string) => {
        const newFaqs = [...formData.faqs];
        newFaqs[index][field] = value;
        setFormData({ ...formData, faqs: newFaqs });
    };

    const isEditing = !!kb;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (isEditing) {
                await axios.patch(`${API_BASE_URL}/knowledge-base/${kb._id}`, formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success("Knowledge Base updated successfully!");
            } else {
                await axios.post(`${API_BASE_URL}/knowledge-base`, formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success("Knowledge Base created successfully!");
            }
            setOpen(false);
            onSuccess?.();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button><Plus className="h-4 w-4 mr-2" />Create Knowledge Base</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Knowledge Base" : "Create Knowledge Base"}</DialogTitle>
                    <DialogDescription>
                        Store reusable information that your AI agents can use during calls.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="max-h-[70vh] overflow-y-auto px-1 py-4 space-y-6">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="kb-name">Knowledge Base Name</Label>
                                <Input
                                    id="kb-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Company General Info"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="kb-desc">Description (Internal)</Label>
                                <Input
                                    id="kb-desc"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of what this info covers"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-2 border-t">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                                    <Info className="h-4 w-4" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wider">Basic Information</Label>
                            </div>
                            <Textarea
                                value={formData.basicInfo}
                                onChange={(e) => setFormData({ ...formData, basicInfo: e.target.value })}
                                placeholder="Describe your business, services, office hours, etc."
                                rows={4}
                                disabled={loading}
                                className="bg-muted/30"
                            />
                        </div>

                        <div className="space-y-4 pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                                        <HelpCircle className="h-4 w-4" />
                                    </div>
                                    <Label className="text-sm font-bold uppercase tracking-wider">Frequently Asked Questions (FAQs)</Label>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddFAQ} disabled={loading} className="h-7 text-[10px] font-bold uppercase">
                                    <Plus className="mr-1 h-3 w-3" /> Add FAQ
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {formData.faqs.map((faq, index) => (
                                    <div key={index} className="grid gap-3 p-4 rounded-xl border bg-muted/20 relative group">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveFAQ(index)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Question {index + 1}</Label>
                                            <Input
                                                value={faq.question}
                                                onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                                                placeholder="e.g. What is your refund policy?"
                                                required
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Answer</Label>
                                            <Textarea
                                                value={faq.answer}
                                                onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                                                placeholder="e.g. We offer a 30-day money back guarantee..."
                                                rows={2}
                                                required
                                                className="bg-background"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {formData.faqs.length === 0 && (
                                    <div className="text-center py-8 rounded-xl border border-dashed bg-muted/5">
                                        <p className="text-xs text-muted-foreground italic">No FAQs added yet. Click &quot;Add FAQ&quot; to begin.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 pt-2 border-t">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wider">Other Information</Label>
                            </div>
                            <Textarea
                                value={formData.otherInfo}
                                onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
                                placeholder="Any additional context, pricing tables, or specialized knowledge..."
                                rows={4}
                                disabled={loading}
                                className="bg-muted/30"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Save Knowledge Base" : "Create Knowledge Base")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
