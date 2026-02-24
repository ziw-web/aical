"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Loader2, RefreshCw } from "lucide-react";
import { useSettings } from "@/components/settings-provider";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { ImportCsvDialog } from "@/components/leads/import-csv-dialog";
import { GoogleSheetsDialog } from "@/components/leads/google-sheets-dialog";
import { LeadsTable } from "@/components/leads/leads-table";
import axios from "axios";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Settings2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Lead {
    _id: string;
    name: string;
    phone: string;
    fields: Array<{ name: string; value: any }>;
    tags: string[];
    createdAt: string;
}

export default function LeadsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [visibleFields, setVisibleFields] = useState<string[] | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoSyncing, setAutoSyncing] = useState(false);
    const [hasHydrated, setHasHydrated] = useState(false);
    const { googleSheetsConnected, googleSheetsConfig } = useSettings();
    const isFirstRender = useRef(true);
    const hasSyncRef = useRef(false);

    // 1. Initial Load from LocalStorage
    useEffect(() => {
        const savedTags = localStorage.getItem("leads_selected_tags");
        const savedColumns = localStorage.getItem("leads_visible_columns");

        if (savedTags) {
            try {
                setSelectedTags(JSON.parse(savedTags));
            } catch (e) {
                console.error("Failed to parse saved tags", e);
            }
        }

        if (savedColumns) {
            try {
                setVisibleFields(JSON.parse(savedColumns));
            } catch (e) {
                console.error("Failed to parse saved columns", e);
            }
        }

        setHasHydrated(true);
    }, []);

    // 2. Save to LocalStorage ONLY after hydration and when state changes
    useEffect(() => {
        if (!hasHydrated) return;

        localStorage.setItem("leads_selected_tags", JSON.stringify(selectedTags));
    }, [selectedTags, hasHydrated]);

    useEffect(() => {
        if (!hasHydrated) return;

        if (visibleFields !== null) {
            localStorage.setItem("leads_visible_columns", JSON.stringify(visibleFields));
        } else {
            localStorage.removeItem("leads_visible_columns");
        }
    }, [visibleFields, hasHydrated]);

    const fetchLeads = useCallback(async () => {
        console.log("fetchLeads called directly");
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await axios({
                method: 'get',
                url: `${API_BASE_URL}/leads`,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("Direct axios fetch successful:", response.data);
            if (response.data && response.data.data && response.data.data.leads) {
                setLeads(response.data.leads || response.data.data.leads);
            }
        } catch (err: any) {
            console.error("fetchLeads error:", err);
            toast.error(err.response?.data?.message || "Failed to fetch leads");
        } finally {
            setLoading(false);
        }
    }, []);

    const allTags = Array.from(new Set(leads.flatMap((lead: any) => lead.tags || []))).sort();
    const allCustomFieldNames = Array.from(
        new Set(leads.flatMap((lead) => lead.fields?.map((f) => f.name) || []))
    ).sort();

    const activeVisibleFields = visibleFields ?? allCustomFieldNames;

    const filteredLeads = leads.filter((lead: any) => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.phone.includes(searchQuery);
        const matchesTag = selectedTags.length > 0
            ? selectedTags.every((tag) => lead.tags?.includes(tag))
            : true;
        return matchesSearch && matchesTag;
    });

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag)
                ? prev.filter((t) => t !== tag)
                : [...prev, tag]
        );
    };

    const toggleFieldVisibility = (fieldName: string) => {
        const current = visibleFields ?? allCustomFieldNames;
        if (current.includes(fieldName)) {
            setVisibleFields(current.filter((f) => f !== fieldName));
        } else {
            setVisibleFields([...current, fieldName]);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Auto-sync from Google Sheets on page load
    useEffect(() => {
        const triggerAutoSync = async () => {
            if (hasSyncRef.current) return;
            if (!googleSheetsConnected || !googleSheetsConfig?.spreadsheetId) return;

            hasSyncRef.current = true;
            setAutoSyncing(true);

            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_BASE_URL}/leads/google-sheets/sync-last`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.data.results > 0) {
                    console.log(`[Auto-Sync] Found ${res.data.results} new leads`);
                    fetchLeads();
                } else {
                    console.log("[Auto-Sync] Already up to date");
                }
            } catch (err) {
                console.error("[Auto-Sync] Failed", err);
            } finally {
                setAutoSyncing(false);
            }
        };

        if (hasHydrated) {
            triggerAutoSync();
        }
    }, [hasHydrated, googleSheetsConnected, googleSheetsConfig, fetchLeads]);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Centralized management for your {leads.length} contacts and prospects.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <GoogleSheetsDialog onSuccess={fetchLeads} syncing={autoSyncing} />
                    <ImportCsvDialog onSuccess={fetchLeads} />
                    <AddLeadDialog onSuccess={fetchLeads} />
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-muted/30 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 px-4 border-dashed hover:border-primary/50 transition-all">
                                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                {selectedTags.length > 0
                                    ? `Tags (${selectedTags.length})`
                                    : "Filter"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-primary/10 shadow-xl">
                            <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-bold px-3 py-2">Filter by Tags</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto p-1">
                                {allTags.length > 0 ? (
                                    allTags.map((tag) => (
                                        <DropdownMenuCheckboxItem
                                            key={tag as string}
                                            checked={selectedTags.includes(tag as string)}
                                            onCheckedChange={() => toggleTag(tag as string)}
                                            onSelect={(e) => e.preventDefault()}
                                            className="rounded-lg"
                                        >
                                            <span className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                                {tag as string}
                                            </span>
                                        </DropdownMenuCheckboxItem>
                                    ))
                                ) : (
                                    <div className="px-2 py-4 text-xs text-muted-foreground text-center italic">
                                        No tags created yet
                                    </div>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 px-4 border-dashed hover:border-primary/50 transition-all">
                                <Settings2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-primary/10 shadow-xl">
                            <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-bold px-3 py-2">Visible Fields</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto p-1">
                                {allCustomFieldNames.map((fieldName) => (
                                    <DropdownMenuCheckboxItem
                                        key={fieldName}
                                        checked={activeVisibleFields.includes(fieldName)}
                                        onCheckedChange={() => toggleFieldVisibility(fieldName)}
                                        className="capitalize rounded-lg"
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        {fieldName}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {(selectedTags.length > 0 || visibleFields !== null) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedTags([]);
                                setVisibleFields(null);
                            }}
                            className="h-11 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        >
                            <X className="mr-1.5 h-4 w-4" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : leads.length > 0 ? (
                filteredLeads.length > 0 ? (
                    <LeadsTable
                        leads={filteredLeads}
                        onRefresh={fetchLeads}
                        visibleFields={activeVisibleFields}
                    />
                ) : (
                    <Empty className="border border-dashed py-12">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Search className="h-8 w-8 text-muted-foreground" />
                            </EmptyMedia>
                            <EmptyTitle>No leads found</EmptyTitle>
                            <EmptyDescription>
                                No leads match your current search or tag filters.
                            </EmptyDescription>
                        </EmptyHeader>
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedTags([]);
                                }}
                            >
                                Clear all filters
                            </Button>
                        </div>
                    </Empty>
                )
            ) : (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Users />
                        </EmptyMedia>
                        <EmptyTitle>No Leads Yet</EmptyTitle>
                        <EmptyDescription>
                            You haven&apos;t added any leads yet. Get started by adding your first lead or importing from CSV.
                        </EmptyDescription>
                    </EmptyHeader>
                    <div className="flex justify-center gap-2 pb-8">
                        <ImportCsvDialog onSuccess={fetchLeads} />
                        <AddLeadDialog onSuccess={fetchLeads} />
                    </div>
                </Empty>
            )}
        </div>
    );
}
