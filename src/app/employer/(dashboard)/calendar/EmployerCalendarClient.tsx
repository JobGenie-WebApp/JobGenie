"use client";

import { useMemo, useState, useCallback } from "react";
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday,
    isPast, addWeeks, subWeeks,
} from "date-fns";
import useSWR from "swr";
import {
    buildCalendarEvents,
    getEventColor,
    isEventClickable,
    type CalendarEvent,
    type CalendarInvitation,
} from "@/lib/calendar-utils";
import {
    Loader2, Video, MapPin, CheckCircle2, Clock4, Ban, ExternalLink, X,
    Calendar as CalendarIcon, Clock, User, AlertCircle,
    ChevronLeft, ChevronRight, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getInvitationJourneyDisplay, normalizeEmbeddedOffer } from "@/lib/invitation-journey-status";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type CalView = "Month" | "Week" | "Day";

type StatusFilter = "all" | "confirmed" | "completed" | "active" | "needs_action" | "declined" | "canceled";

const STATUS_FILTERS: { value: StatusFilter; label: string; color: string }[] = [
    { value: "all", label: "All", color: "" },
    { value: "confirmed", label: "Confirmed", color: "bg-emerald-500" },
    { value: "completed", label: "Completed", color: "bg-violet-500" },
    { value: "active", label: "Active Pipeline", color: "bg-teal-500" },
    { value: "needs_action", label: "Needs Action", color: "bg-lime-500" },
    { value: "declined", label: "Declined", color: "bg-red-500" },
    { value: "canceled", label: "Canceled", color: "bg-slate-500" },
];

function getEventStatusCategory(resource: CalendarEvent["resource"]): StatusFilter {
    if (resource.isCanceled) return "canceled";
    if (resource.isCompleted) return "completed";
    if (resource.status === "declined") return "declined";
    if (resource.isConfirmed) return "confirmed";
    if (resource.pipelineStatus && resource.pipelineStatus !== "initial") return "active";
    return "needs_action";
}

// ─── Event detail modal ───────────────────────────────────────────────────────
interface EventDetailModalProps {
    event: CalendarEvent;
    onClose: () => void;
}

function EventDetailModal({ event, onClose }: EventDetailModalProps) {
    const r = event.resource;
    const offer = normalizeEmbeddedOffer(r.jobOffers);
    const journey = getInvitationJourneyDisplay({
        status: r.status,
        invitation_canceled: r.isCanceled,
        interview_confirmed: r.isConfirmed,
        mis_rescheduled: r.misRescheduled,
        pipeline_status: r.pipelineStatus,
        current_round_number: r.roundNumber ?? null,
        candidate_reschedule_requested: false,
    }, offer);

    let BadgeIcon = Clock4;
    if (journey.variant === "success") BadgeIcon = CheckCircle2;
    else if (journey.variant === "danger") BadgeIcon = Ban;
    else if (journey.variant === "warning") BadgeIcon = AlertCircle;
    else if (journey.variant === "muted") BadgeIcon = Ban;
    else if (journey.variant === "info") BadgeIcon = CheckCircle2;

    const colorClasses = {
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        warning: "bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary",
        info: "bg-accent/15 text-accent dark:bg-accent/20 dark:text-accent-foreground",
        muted: "bg-muted text-muted-foreground",
        pending: "bg-primary/12 text-primary dark:bg-primary/18 dark:text-primary",
    }[journey.variant] ?? "bg-muted text-muted-foreground";

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="glass-card overflow-hidden rounded-2xl border border-border shadow-2xl bg-white dark:bg-slate-800">
                    <div className="flex items-start justify-between px-5 py-4 border-b border-border gap-3">
                        <div className="min-w-0">
                            {r.roundLabel && (
                                <span className="text-[10px] uppercase tracking-wide font-semibold text-primary mb-1 block">{r.roundLabel}</span>
                            )}
                            <h3 className="text-base font-bold text-foreground leading-snug">{r.jobDesignation}</h3>
                            {r.candidateName && (
                                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                    <User className="h-3.5 w-3.5 flex-shrink-0" />
                                    {r.candidateName}
                                    {r.candidateEmail && (
                                        <span className="text-xs text-muted-foreground/70">({r.candidateEmail})</span>
                                    )}
                                </p>
                            )}
                        </div>
                        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors flex-shrink-0 mt-0.5">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", colorClasses)}>
                                <BadgeIcon className="h-3 w-3" />{journey.label}
                            </span>
                            {r.interviewMode && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                    {r.interviewMode === "online" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                    {r.interviewMode === "online" ? "Online" : "In-Person"}
                                </span>
                            )}
                            {r.misRescheduled && (
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Rescheduled</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarIcon className="h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{format(event.start, "EEEE, MMMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}</span>
                        </div>
                        {r.interviewMode === "online" && r.meetingLink && (
                            <a href={r.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                                <Video className="h-4 w-4 flex-shrink-0" />Join Meeting<ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                        {r.interviewMode === "physical" && r.interviewAddress && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                                <div>
                                    <p>{r.interviewAddress}</p>
                                    {r.mapLink && (
                                        <a href={r.mapLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-medium mt-0.5 inline-flex items-center gap-1">
                                            View on map <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="px-5 py-3 border-t border-border bg-muted/20">
                        <Link href="/employer/invitations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline" onClick={onClose}>
                            View in invitations<ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Event chip ───────────────────────────────────────────────────────────────
function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
    const color = getEventColor(event.resource);
    const clickable = isEventClickable(event.resource);
    const label = event.resource.candidateName ?? event.resource.jobDesignation;

    return (
        <button
            onClick={clickable ? onClick : undefined}
            title={`${event.resource.jobDesignation}${event.resource.candidateName ? ` · ${event.resource.candidateName}` : ""}`}
            className={cn(
                "w-full text-left truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight text-white transition-opacity",
                clickable ? "cursor-pointer hover:opacity-80" : "cursor-default",
                event.resource.isCanceled && "opacity-40 line-through",
                event.resource.isCompleted && "opacity-70",
            )}
            style={{ backgroundColor: color }}
        >
            {label}
        </button>
    );
}

// ─── Month view ───────────────────────────────────────────────────────────────
function MonthView({ date, events, onSelectEvent }: {
    date: Date;
    events: CalendarEvent[];
    onSelectEvent: (e: CalendarEvent) => void;
}) {
    const weeks: Date[][] = [];
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    let cursor = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    while (cursor <= gridEnd) {
        const week: Date[] = [];
        for (let i = 0; i < 7; i++) {
            week.push(cursor);
            cursor = addDays(cursor, 1);
        }
        weeks.push(week);
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const eventsOnDay = (day: Date) => events.filter(e => isSameDay(e.start, day));

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-7 border-b border-border">
                {dayNames.map(d => (
                    <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {d}
                    </div>
                ))}
            </div>
            <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
                {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
                        {week.map((day, di) => {
                            const dayEvents = eventsOnDay(day);
                            const inMonth = isSameMonth(day, date);
                            const today = isToday(day);
                            return (
                                <div
                                    key={di}
                                    className={cn(
                                        "min-h-[60px] p-1 border-r border-border last:border-r-0 flex flex-col gap-0.5",
                                        !inMonth && "opacity-40",
                                    )}
                                >
                                    <span className={cn(
                                        "self-start text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full leading-none",
                                        today
                                            ? "bg-[hsl(var(--primary))] text-primary-foreground font-bold"
                                            : "text-muted-foreground",
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                    {dayEvents.slice(0, 3).map(ev => (
                                        <EventChip key={ev.id} event={ev} onClick={() => onSelectEvent(ev)} />
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <span className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Week view ────────────────────────────────────────────────────────────────
function WeekView({ date, events, onSelectEvent }: {
    date: Date;
    events: CalendarEvent[];
    onSelectEvent: (e: CalendarEvent) => void;
}) {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const eventsOnDay = (day: Date) => events.filter(e => isSameDay(e.start, day));

    return (
        <div className="flex flex-col h-full overflow-auto">
            <div className="grid border-b border-border sticky top-0 bg-card z-10" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
                <div />
                {days.map(day => (
                    <div key={day.toISOString()} className="py-2 text-center border-l border-border">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{format(day, "EEE")}</div>
                        <div className={cn(
                            "mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold",
                            isToday(day) ? "bg-[hsl(var(--primary))] text-primary-foreground" : "text-foreground",
                        )}>
                            {format(day, "d")}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex-1 relative">
                {hours.map(hour => (
                    <div key={hour} className="grid border-b border-border/40" style={{ gridTemplateColumns: "48px repeat(7, 1fr)", height: 56 }}>
                        <div className="text-[10px] text-muted-foreground pr-2 text-right translate-y-[-0.5em] leading-none">
                            {hour === 0 ? "" : format(new Date(2000, 0, 1, hour), "h a")}
                        </div>
                        {days.map(day => (
                            <div key={day.toISOString()} className="border-l border-border/40 relative px-0.5">
                                {eventsOnDay(day)
                                    .filter(e => e.start.getHours() === hour)
                                    .map(ev => (
                                        <EventChip key={ev.id} event={ev} onClick={() => onSelectEvent(ev)} />
                                    ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Day view ─────────────────────────────────────────────────────────────────
function DayView({ date, events, onSelectEvent }: {
    date: Date;
    events: CalendarEvent[];
    onSelectEvent: (e: CalendarEvent) => void;
}) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = events.filter(e => isSameDay(e.start, date));

    return (
        <div className="flex flex-col h-full overflow-auto">
            <div className="py-3 px-4 border-b border-border text-sm font-semibold text-foreground sticky top-0 bg-card z-10">
                {format(date, "EEEE, MMMM d, yyyy")}
            </div>
            <div className="flex-1">
                {hours.map(hour => (
                    <div key={hour} className="flex border-b border-border/40 min-h-[56px]">
                        <div className="w-12 text-[10px] text-muted-foreground pr-2 text-right translate-y-[-0.5em] flex-shrink-0 leading-none pt-1">
                            {hour === 0 ? "" : format(new Date(2000, 0, 1, hour), "h a")}
                        </div>
                        <div className="flex-1 border-l border-border/40 px-1 py-0.5 space-y-0.5">
                            {dayEvents
                                .filter(e => e.start.getHours() === hour)
                                .map(ev => (
                                    <EventChip key={ev.id} event={ev} onClick={() => onSelectEvent(ev)} />
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Candidate roadmap sidebar ───────────────────────────────────────────────
interface CandidateGroup {
    candidateId: string;
    candidateName: string;
    candidateEmail?: string;
    events: CalendarEvent[]; // sorted by start asc
}

function buildCandidateGroups(events: CalendarEvent[]): CandidateGroup[] {
    const map = new Map<string, CandidateGroup>();
    for (const ev of events) {
        const id = ev.resource.candidateId ?? ev.resource.invitationId;
        if (!map.has(id)) {
            map.set(id, {
                candidateId: id,
                candidateName: ev.resource.candidateName ?? "Unknown",
                candidateEmail: ev.resource.candidateEmail,
                events: [],
            });
        }
        map.get(id)!.events.push(ev);
    }
    for (const g of map.values()) {
        g.events.sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    // Sort groups: those with upcoming first, then by earliest event
    return Array.from(map.values()).sort((a, b) => {
        const now = new Date();
        const aUpcoming = a.events.some(e => e.start >= now);
        const bUpcoming = b.events.some(e => e.start >= now);
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
        return a.events[0].start.getTime() - b.events[0].start.getTime();
    });
}

function RoadmapStepIcon({ isCanceled, isConfirmed, misRescheduled, isPastEvent }: {
    isCanceled: boolean;
    isConfirmed: boolean;
    misRescheduled: boolean;
    isPastEvent: boolean;
}) {
    if (misRescheduled) return <span className="h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />;
    if (isCanceled) return <Ban className="h-3 w-3 text-slate-400 flex-shrink-0" />;
    if (isConfirmed && isPastEvent) return <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />;
    if (isConfirmed) return <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />;
    return <span className="h-2 w-2 rounded-full bg-primary/60 flex-shrink-0" />;
}

function CandidateRoadmapCard({ group, onSelectEvent, isExpanded, onToggle }: {
    group: CandidateGroup;
    onSelectEvent: (e: CalendarEvent) => void;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const now = new Date();
    const nextEvent = group.events.find(e => e.start >= now);
    const hasUpcoming = !!nextEvent;

    return (
        <div className="rounded-lg border border-border/60 bg-card/50 overflow-hidden">
            {/* Card header — one per candidate */}
            <button
                onClick={onToggle}
                className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-muted/30 transition-colors"
            >
                {/* Avatar initial */}
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-primary uppercase">
                        {group.candidateName.charAt(0)}
                    </span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-foreground truncate leading-tight">{group.candidateName}</p>
                    <p className="text-[10px] text-muted-foreground">
                        {group.events.length} {group.events.length === 1 ? "interview" : "interviews"}
                        {hasUpcoming && nextEvent && (
                            <span className="text-primary"> · next {format(nextEvent.start, "MMM d")}</span>
                        )}
                    </p>
                </div>
                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform", isExpanded && "rotate-90")} />
            </button>

            {/* Roadmap — shown when expanded */}
            {isExpanded && (
                <div className="border-t border-border/40 px-3 py-2 space-y-0">
                    {group.events.map((ev, idx) => {
                        const isPastEvent = isPast(ev.start) && !isToday(ev.start);
                        const clickable = isEventClickable(ev.resource);
                        const isLast = idx === group.events.length - 1;
                        const label = ev.resource.roundLabel ?? ev.resource.jobDesignation;
                        const color = getEventColor(ev.resource);

                        return (
                            <div key={ev.id} className="flex items-stretch gap-2">
                                {/* Timeline line */}
                                <div className="flex flex-col items-center w-3 flex-shrink-0 pt-1.5">
                                    <RoadmapStepIcon
                                        isCanceled={ev.resource.isCanceled}
                                        isConfirmed={ev.resource.isConfirmed}
                                        misRescheduled={ev.resource.misRescheduled}
                                        isPastEvent={isPastEvent}
                                    />
                                    {!isLast && <div className="w-px flex-1 mt-1 bg-border/50 min-h-[12px]" />}
                                </div>

                                {/* Step content */}
                                <button
                                    onClick={clickable ? () => onSelectEvent(ev) : undefined}
                                    className={cn(
                                        "flex-1 min-w-0 text-left pb-2.5",
                                        clickable ? "cursor-pointer" : "cursor-default",
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className={cn(
                                                "text-[11px] font-semibold truncate",
                                                ev.resource.isCanceled ? "line-through text-muted-foreground/60" : "text-foreground",
                                                clickable && "hover:text-primary transition-colors",
                                            )}
                                            style={!ev.resource.isCanceled ? { color } : undefined}
                                        >
                                            {label}
                                        </span>
                                        {ev.resource.misRescheduled && (
                                            <span className="text-[9px] rounded px-1 py-0.5 bg-purple-500/15 text-purple-500 font-semibold flex-shrink-0">Rescheduled</span>
                                        )}
                                    </div>
                                    <p className={cn("text-[10px] mt-0.5", isPastEvent ? "text-muted-foreground/60" : "text-muted-foreground")}>
                                        {format(ev.start, "MMM d")} · {format(ev.start, "h:mm a")}
                                    </p>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CandidateRoadmapSidebar({ allEvents, filteredEvents, onSelectEvent }: {
    allEvents: CalendarEvent[];
    filteredEvents: CalendarEvent[];
    onSelectEvent: (e: CalendarEvent) => void;
}) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Always group by all events so we always show every candidate,
    // but show roadmap steps only for events that pass the current filter
    const groups = useMemo(() => buildCandidateGroups(allEvents), [allEvents]);

    // For display, replace each group's events with filtered events if filter is active
    const filteredIds = useMemo(() => new Set(filteredEvents.map(e => e.id)), [filteredEvents]);

    const toggle = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    if (groups.length === 0) {
        return <p className="text-xs text-muted-foreground px-1">No interviews yet.</p>;
    }

    return (
        <div className="flex flex-col gap-1.5 h-full overflow-y-auto pr-1">
            {groups.map(group => {
                // Show roadmap steps filtered to current filter
                const groupFiltered: CandidateGroup = {
                    ...group,
                    events: group.events.filter(e => filteredIds.has(e.id)),
                };
                // If filter hides all events for this group, still show the card but grayed
                const hasVisibleEvents = groupFiltered.events.length > 0;
                if (!hasVisibleEvents) return null;

                return (
                    <CandidateRoadmapCard
                        key={group.candidateId}
                        group={groupFiltered}
                        onSelectEvent={onSelectEvent}
                        isExpanded={expandedIds.has(group.candidateId)}
                        onToggle={() => toggle(group.candidateId)}
                    />
                );
            })}
        </div>
    );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ events, invitations }: { events: CalendarEvent[]; invitations: CalendarInvitation[] }) {
    const confirmedCount = events.filter(e => e.resource.isConfirmed && !e.resource.isCanceled && !e.resource.isCompleted).length;
    const completedCount = events.filter(e => e.resource.isCompleted).length;
    const upcomingCount = events.filter(e => !e.resource.isCanceled && !e.resource.isCompleted && e.start >= new Date()).length;
    const totalCandidates = new Set(
        invitations.map((i: CalendarInvitation) => (i as unknown as { candidate?: { id: string } }).candidate?.id).filter(Boolean)
    ).size;

    const stats = [
        { label: "Total", value: events.length, accent: false, color: "" },
        { label: "Upcoming", value: upcomingCount, accent: true, color: "" },
        { label: "Confirmed", value: confirmedCount, accent: true, color: "" },
        { label: "Completed", value: completedCount, accent: false, color: "text-violet-500" },
        { label: "Candidates", value: totalCandidates, accent: false, color: "" },
    ];

    return (
        <div className="grid grid-cols-5 gap-2 flex-shrink-0">
            {stats.map(s => (
                <div key={s.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className={cn("text-xl font-bold tabular-nums", s.color || (s.accent ? "text-primary" : "text-foreground"))}>{s.value}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EmployerCalendarClient() {
    const { data, isLoading } = useSWR("/api/employer/calendar", fetcher);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [view, setView] = useState<CalView>("Month");
    const [date, setDate] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const invitations: CalendarInvitation[] = data?.success ? data.data : [];
    const allEvents = useMemo(() => buildCalendarEvents(invitations, "employer"), [invitations]);

    const events = useMemo(() =>
        statusFilter === "all"
            ? allEvents
            : allEvents.filter(e => getEventStatusCategory(e.resource) === statusFilter),
        [allEvents, statusFilter]
    );

    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        if (!isEventClickable(event.resource)) return;
        setSelectedEvent(event);
    }, []);

    const navigate = (dir: 1 | -1) => {
        if (view === "Month") setDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
        else if (view === "Week") setDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
        else setDate(d => addDays(d, dir));
    };

    const headerLabel = () => {
        if (view === "Month") return format(date, "MMMM yyyy");
        if (view === "Week") {
            const ws = startOfWeek(date, { weekStartsOn: 0 });
            const we = endOfWeek(date, { weekStartsOn: 0 });
            return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
        }
        return format(date, "MMMM d, yyyy");
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading company interview grid…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 h-[calc(100vh-150px)] min-h-[600px]">
            {/* Stats */}
            <StatsBar events={allEvents} invitations={invitations} />

            {/* Top bar: title + filters + view toggle */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                <h1 className="text-base font-bold text-foreground sm:text-xl">Interview Calendar</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Status filter */}
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1 flex-shrink-0" />
                        {STATUS_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                                    statusFilter === f.value
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                )}
                            >
                                {f.color && <span className={cn("h-2 w-2 rounded-full flex-shrink-0", f.color)} />}
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-1">
                        {(["Month", "Week", "Day"] as CalView[]).map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={cn(
                                    "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border",
                                    view === v
                                        ? "bg-muted border-border text-foreground"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                )}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
                {/* Calendar panel */}
                <div className="flex-1 flex flex-col min-w-0 rounded-xl border border-border bg-card overflow-hidden">
                    {/* Nav header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
                        <button onClick={() => navigate(-1)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted/50 transition-colors">
                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{headerLabel()}</span>
                            {statusFilter !== "all" && (
                                <span className="text-xs text-muted-foreground">
                                    ({events.length} {events.length === 1 ? "interview" : "interviews"})
                                </span>
                            )}
                        </div>
                        <button onClick={() => navigate(1)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted/50 transition-colors">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Calendar grid */}
                    <div className="flex-1 overflow-hidden">
                        {allEvents.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 ring-1 ring-primary/20">
                                    <CalendarIcon className="h-7 w-7 text-primary" />
                                </div>
                                <div className="max-w-sm space-y-1.5">
                                    <p className="text-sm font-semibold text-foreground">No interviews on the calendar yet</p>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Confirm slots inside Invitations — accepted times sync here for your whole hiring team.
                                    </p>
                                </div>
                                <Link href="/employer/invitations" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                                    Open invitations
                                </Link>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                                <CalendarIcon className="h-8 w-8 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">No interviews match the selected filter.</p>
                                <button onClick={() => setStatusFilter("all")} className="text-xs font-semibold text-primary hover:underline">
                                    Clear filter
                                </button>
                            </div>
                        ) : view === "Month" ? (
                            <MonthView date={date} events={events} onSelectEvent={handleSelectEvent} />
                        ) : view === "Week" ? (
                            <WeekView date={date} events={events} onSelectEvent={handleSelectEvent} />
                        ) : (
                            <DayView date={date} events={events} onSelectEvent={handleSelectEvent} />
                        )}
                    </div>
                </div>

                {/* Sidebar — one card per candidate with roadmap */}
                <div className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-2">
                    <p className="text-sm font-semibold text-foreground px-1">Candidates</p>
                    <CandidateRoadmapSidebar
                        allEvents={allEvents}
                        filteredEvents={events}
                        onSelectEvent={handleSelectEvent}
                    />
                </div>
            </div>

            {selectedEvent && (
                <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </div>
    );
}
