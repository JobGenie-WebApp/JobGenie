"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Mail, MapPin } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    getInvitationJourneyDisplay,
    normalizeEmbeddedOffer,
    journeyVariantToCandidateClasses,
} from "@/lib/invitation-journey-status";
import useSWR from "swr";
import InvitationDetailClient from "./[id]/InvitationDetailClient";

interface TimeSlot { date: string; time: string; order: number; is_alternative?: boolean; }

interface Invitation {
    id: string;
    industry: string;
    job_designation: string;
    message: string | null;
    given_time_slots: TimeSlot[];
    alternative_dates: TimeSlot[];
    status: string;
    sent_at: string;
    viewed_at: string | null;
    invitation_canceled: boolean;
    canceled_by: string | null;
    cancellation_reason: string | null;
    canceled_at: string | null;
    interview_confirmed?: boolean;
    pipeline_status?: string | null;
    current_round_number?: number | null;
    mis_rescheduled?: boolean;
    candidate_reschedule_requested?: boolean;
    job_offers?: { id: string; status: string } | { id: string; status: string }[] | null;
    company: {
        company_name: string;
        logo_url: string | null;
        industry: string;
        headoffice_location: string | null;
    };
}

function formatInvitationDate(sentAt: string): string {
    const sentDate = new Date(sentAt);
    const daysAgo = differenceInDays(new Date(), sentDate);
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    if (daysAgo < 7) return `${daysAgo}d ago`;
    return format(sentDate, "MMM d, yyyy");
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const FILTERS = [
    { key: "all",       label: "All" },
    { key: "pending",   label: "Pending" },
    { key: "accepted",  label: "Accepted" },
    { key: "declined",  label: "Declined" },
    { key: "cancelled", label: "Cancelled" },
] as const;

// Dot color per journey variant
const variantDot: Record<string, string> = {
    pending: "bg-blue-500",
    info:    "bg-indigo-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger:  "bg-red-500",
    muted:   "bg-slate-400",
};

export default function InvitationsClient() {
    const { data, isLoading, mutate } = useSWR("/api/candidate/invitations", fetcher);
    const [filter, setFilter] = useState<string>("all");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const invitations: Invitation[] = data?.success ? data.data : [];

    const filteredInvitations = invitations.filter(inv => {
        if (filter === "all") return true;
        if (filter === "cancelled") return inv.invitation_canceled && !inv.mis_rescheduled;
        return inv.status === filter;
    });

    const statusCounts = {
        all:       invitations.length,
        pending:   invitations.filter(i => i.status === "pending" || i.status === "viewed").length,
        accepted:  invitations.filter(i => i.status === "accepted").length,
        declined:  invitations.filter(i => i.status === "declined").length,
        cancelled: invitations.filter(i => i.invitation_canceled && !i.mis_rescheduled).length,
    };

    const pendingCount = statusCounts.pending;
    const selectedInv = invitations.find(i => i.id === selectedId) ?? null;

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (invitations.length === 0) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border text-center p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/20">
                    <Mail className="h-7 w-7 text-primary/60" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-base font-semibold">No invitations yet</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        When employers shortlist you, interview requests will appear here.
                    </p>
                </div>
                <Button size="sm" asChild className="mt-1">
                    <Link href="/candidate/jobs">Browse open roles</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
            /* Mobile: show only list OR detail (stack, no height lock) */
            "flex-col",
            /* md+: two-panel side-by-side with height lock */
            "md:flex-row md:h-[calc(100vh-68px-2.5rem*2)] md:min-h-[560px]",
        )}>

            {/* ── Left panel: list ── */}
            <div className={cn(
                "flex flex-col border-border flex-shrink-0",
                /* Mobile: show list only when no detail selected */
                selectedId ? "hidden md:flex" : "flex",
                "w-full md:w-80 md:border-r xl:w-96",
            )}>
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-base font-bold leading-tight">Invitations</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {invitations.length} total{pendingCount > 0 && ` · `}
                                {pendingCount > 0 && <span className="text-amber-600 dark:text-amber-400 font-medium">{pendingCount} need action</span>}
                            </p>
                        </div>
                        {pendingCount > 0 && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                                {pendingCount}
                            </span>
                        )}
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-0.5 rounded-lg bg-muted/40 p-0.5">
                        {FILTERS.map(f => {
                            const active = filter === f.key;
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={cn(
                                        "flex-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors",
                                        active
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {f.label}
                                    <span className={cn("ml-0.5 opacity-60", active && "opacity-100")}>
                                        ({statusCounts[f.key as keyof typeof statusCounts]})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Card list */}
                <div className="flex-1 overflow-y-auto min-h-[300px] md:min-h-0">
                    {filteredInvitations.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
                            No invitations in this filter.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {filteredInvitations.map(inv => {
                                const offer = normalizeEmbeddedOffer(inv.job_offers);
                                const journey = getInvitationJourneyDisplay({
                                    status: inv.status,
                                    invitation_canceled: inv.invitation_canceled,
                                    interview_confirmed: inv.interview_confirmed ?? false,
                                    mis_rescheduled: inv.mis_rescheduled,
                                    pipeline_status: inv.pipeline_status ?? null,
                                    current_round_number: inv.current_round_number ?? null,
                                    candidate_reschedule_requested: inv.candidate_reschedule_requested,
                                }, offer);
                                const badgeClass = journeyVariantToCandidateClasses(journey.variant);
                                const dot = variantDot[journey.variant] ?? "bg-slate-400";
                                const isSelected = selectedId === inv.id;
                                const isPending = inv.status === "pending" || inv.status === "viewed";

                                return (
                                    <button
                                        key={inv.id}
                                        onClick={() => setSelectedId(inv.id)}
                                        className={cn(
                                            "w-full text-left px-4 py-3.5 transition-colors group relative",
                                            isSelected
                                                ? "bg-primary/[0.06] dark:bg-primary/[0.10]"
                                                : "hover:bg-muted/40",
                                        )}
                                    >
                                        {/* Selected indicator */}
                                        {isSelected && (
                                            <div className="absolute inset-y-0 left-0 w-0.5 bg-primary rounded-r-full" />
                                        )}

                                        <div className="flex gap-2.5 items-start">
                                            {/* Logo */}
                                            <div className="h-9 w-9 rounded-lg border border-border/70 bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                                                {inv.company.logo_url
                                                    ? <img src={inv.company.logo_url} alt="" className="h-full w-full object-contain p-1" />
                                                    : <Building2 className="h-4 w-4 text-muted-foreground/60" />
                                                }
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-1.5">
                                                    <p className={cn(
                                                        "text-[13px] font-semibold leading-snug line-clamp-1",
                                                        isSelected ? "text-foreground" : "text-foreground/90",
                                                    )}>
                                                        {inv.job_designation}
                                                    </p>
                                                    {isPending && (
                                                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                                    {inv.company.company_name}
                                                </p>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5",
                                                        badgeClass,
                                                    )}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dot)} />
                                                        {journey.label}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                                                        {formatInvitationDate(inv.sent_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right panel: detail ── */}
            {selectedId ? (
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-background/50">
                    {/* Mobile back button */}
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
                        <button
                            onClick={() => setSelectedId(null)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors"
                            aria-label="Back to list"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-sm font-semibold">Invitation Details</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4 md:p-6">
                            <InvitationDetailClient
                                key={selectedId}
                                invitationId={selectedId}
                                onMutateList={mutate}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 text-center p-12 bg-muted/10">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border">
                        <Mail className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-1 max-w-xs">
                        <p className="text-sm font-medium text-muted-foreground">Select an invitation</p>
                        <p className="text-xs text-muted-foreground/60">
                            Click any card on the left to view details, respond to slots, and track your interview progress.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
