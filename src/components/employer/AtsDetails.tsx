"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The full ATS result for one application. Everything here is produced by the
 * scorer in `app/actions/ats-score.ts` and persisted on `job_applications`.
 */
export interface AtsResult {
    ats_score?: number | null;
    ats_status?: string | null;
    ats_breakdown?: { skills?: number; experience?: number; education?: number; keywords?: number } | null;
    ats_matched_keywords?: string[] | null;
    ats_missing_keywords?: string[] | null;
    ats_scored_at?: string | null;
    ats_error?: string | null;
}

/** Green at 75+, amber at 50+, red below - the same thresholds as the compact badge. */
export function atsTone(score: number) {
    if (score >= 75) return {
        text: "text-emerald-700 dark:text-emerald-300",
        bar: "bg-emerald-500",
        ring: "text-emerald-500",
        chip: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900",
    };
    if (score >= 50) return {
        text: "text-amber-700 dark:text-amber-300",
        bar: "bg-amber-500",
        ring: "text-amber-500",
        chip: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900",
    };
    return {
        text: "text-rose-700 dark:text-rose-300",
        bar: "bg-rose-500",
        ring: "text-rose-500",
        chip: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900",
    };
}

const BREAKDOWN_LABELS: [keyof NonNullable<AtsResult["ats_breakdown"]>, string][] = [
    ["skills", "Skills"],
    ["experience", "Experience"],
    ["education", "Education"],
    ["keywords", "Keywords"],
];

function ScoreRing({ score }: { score: number }) {
    const tone = atsTone(score);
    const r = 26;
    const circumference = 2 * Math.PI * r;

    return (
        <div className="relative h-[68px] w-[68px] shrink-0">
            <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="34" cy="34" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
                <circle
                    cx="34" cy="34" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
                    className={cn("stroke-current transition-[stroke-dashoffset] duration-500", tone.ring)}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - score / 100)}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-lg font-bold leading-none tabular-nums", tone.text)}>{score}</span>
                <span className="text-[9px] font-medium text-muted-foreground">/ 100</span>
            </div>
        </div>
    );
}

function KeywordList({ title, words, className }: { title: string; words: string[]; className: string }) {
    if (words.length === 0) return null;
    return (
        <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {title} <span className="tabular-nums">({words.length})</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
                {words.map((w) => (
                    <span key={w} className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", className)}>
                        {w}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function AtsDetails({
    app,
    onRecheck,
    rechecking = false,
}: {
    app: AtsResult;
    /** Omit to hide the re-score button (e.g. where there is no endpoint to call). */
    onRecheck?: () => void;
    rechecking?: boolean;
}) {
    const recheckButton = onRecheck && (
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={rechecking} onClick={onRecheck}>
            {rechecking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Check again"}
        </Button>
    );

    if (app.ats_status === "failed") {
        return (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium">ATS scoring failed</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {app.ats_error || "The résumé could not be scored."}
                    </p>
                </div>
                {recheckButton}
            </div>
        );
    }

    if (app.ats_status !== "scored" || typeof app.ats_score !== "number") {
        return (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                    {app.ats_status === "pending" ? "ATS scoring in progress…" : "Not scored yet."}
                </p>
                {recheckButton}
            </div>
        );
    }

    const score = Math.round(app.ats_score);
    const tone = atsTone(score);
    const breakdown = app.ats_breakdown ?? {};
    const hasBreakdown = BREAKDOWN_LABELS.some(([k]) => typeof breakdown[k] === "number");
    const matched = app.ats_matched_keywords ?? [];
    const missing = app.ats_missing_keywords ?? [];

    return (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-start gap-4">
                <ScoreRing score={score} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold">ATS match</p>
                            <p className={cn("text-xs font-medium", tone.text)}>
                                {score >= 75 ? "Strong match" : score >= 50 ? "Partial match" : "Weak match"}
                            </p>
                        </div>
                        {recheckButton}
                    </div>

                    {hasBreakdown && (
                        <div className="mt-2.5 space-y-1.5">
                            {BREAKDOWN_LABELS.map(([key, label]) => {
                                const v = breakdown[key];
                                if (typeof v !== "number") return null;
                                return (
                                    <div key={key} className="flex items-center gap-2">
                                        <span className="w-[68px] shrink-0 text-[11px] text-muted-foreground">{label}</span>
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={cn("h-full rounded-full", atsTone(v).bar)}
                                                style={{ width: `${Math.max(0, Math.min(100, v))}%` }}
                                            />
                                        </div>
                                        <span className="w-7 shrink-0 text-right text-[11px] font-medium tabular-nums">{Math.round(v)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {(matched.length > 0 || missing.length > 0) && (
                <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
                    <KeywordList
                        title="Matched"
                        words={matched}
                        className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                    />
                    <KeywordList
                        title="Missing"
                        words={missing}
                        className="border-border bg-background text-muted-foreground"
                    />
                </div>
            )}

            {app.ats_scored_at && (
                <p className="text-[11px] text-muted-foreground">
                    Scored {new Date(app.ats_scored_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}AI-assisted screening, not a hiring decision.
                </p>
            )}
        </div>
    );
}
