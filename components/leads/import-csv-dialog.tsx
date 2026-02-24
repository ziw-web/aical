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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export function ImportCsvDialog({ onSuccess }: { onSuccess?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [tags, setTags] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select a CSV file");
            return;
        }

        const bulkTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "");

        setLoading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const token = localStorage.getItem("token");
                    const leads = results.data.map((row: any) => {
                        const { name, phone, ...rest } = row;
                        const fields = Object.entries(rest).map(([key, value]) => ({
                            name: key,
                            value
                        }));
                        return {
                            name: name || "Unknown",
                            phone: phone || "",
                            fields,
                            tags: bulkTags
                        };
                    }).filter(lead => lead.phone);

                    if (leads.length === 0) {
                        toast.error("No valid leads found in CSV");
                        setLoading(false);
                        return;
                    }

                    await axios.post(`${API_BASE_URL}/leads/bulk`, leads, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    toast.success(`${leads.length} leads imported successfully!`);
                    setOpen(false);
                    setFile(null);
                    setTags("");
                    onSuccess?.();
                } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to import leads");
                } finally {
                    setLoading(false);
                }
            },
            error: (error) => {
                toast.error(`Error parsing CSV: ${error.message}`);
                setLoading(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Leads from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with columns: name, phone, company (optional)
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="csv-file">CSV File</Label>
                            <Input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                required
                            />
                            {file && (
                                <p className="text-sm text-muted-foreground">
                                    Selected: {file.name}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bulk-tags">Add Tags to all (comma separated)</Label>
                            <Input
                                id="bulk-tags"
                                placeholder="new-leads, campaign-1"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Uploading..." : "Upload"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
