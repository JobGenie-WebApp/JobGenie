"use client";

import { useMemo, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday, isPast, addWeeks, subWeeks, startOfDay, endOfDay, eachHourOfInterval, isBefore, isAfter } from "date-fns";
import useSWR from "swr";
import {
    buildCalendarEvents,
    getEventColor,
    isEventClickable,
    type CalendarEvent,
    type CalendarInvitation,
} from "@/lib/calendar-utils";
import { Loader2, Video, MapPin, CheckCircle2, Clock4, Ban, ExternalLink, X, Calendar as CalendarIcon, Building2, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getInvitationJourneyDisplay, normalizeEmbeddedOffer } from "@/lib/invitation-journey-status";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type CalView = "Month" | "Week" | "Day";

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
                <div className="glass-card overflow-hidden rounded-2xl border border-border shadow-2xl">
                    <div className="flex items-start justify-between px-5 py-4 border-b border-border gap-3">
                        <div className="min-w-0">
                            {r.roundLabel && (
                                <span className="text-[10px] uppercase tracking-wide font-semibold text-primary mb-1 block">{r.roundLabel}</span>
                            )}
                            <h3 className="text-base font-bold text-foreground leading-snug">{r.jobDesignation}</h3>
                            {r.companyName && (
                                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                    <Building2 className="h-3.5 w-3.5 flex-shrink-0" />{r.companyName}
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
                        <Link href={`/candidate/invitations/${r.invitationId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline" onClick={onClose}>
                            View full invitation details<ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Chip rendered inside calendar cells ─────────────────────────────────────
function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
    const color = getEventColor(event.resource);
    const clickable = isEventClickable(event.resource);
    const label = event.resource.companyName ?? event.resource.jobDesignation;

    return (
        <button
            onClick={clickable ? onClick : undefined}
            title={event.title}
            className={cn(
                "w-full text-left truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight text-white transition-opacity",
                clickable ? "cursor-pointer hover:opacity-80" : "cursor-default",
                event.resource.isCanceled && "opacity-50 line-through",
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

    const eventsOnDay = (day: Date) =>
        events.filter(e => isSameDay(e.start, day));

    return (
        <div className="flex flex-col h-full">
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-border">
                {dayNames.map(d => (
                    <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {d}
                    </div>
                ))}
            </div>
            {/* Weeks */}
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

    const eventsOnDay = (day: Date) =>
        events.filter(e => isSameDay(e.start, day));

    return (
        <div className="flex flex-col h-full overflow-auto">
            {/* Header */}
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
            {/* Time grid */}
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

// ─── Sidebar upcoming/past list ───────────────────────────────────────────────
function SidebarList({ events, onSelectEvent }: {
    events: CalendarEvent[];
    onSelectEvent: (e: CalendarEvent) => void;
}) {
    const now = new Date();
    const upcoming = events
        .filter(e => !isPast(e.start) || isToday(e.start))
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 6);

    const past = events
        .filter(e => isPast(e.start) && !isToday(e.start))
        .sort((a, b) => b.start.getTime() - a.start.getTime())
        .slice(0, 4);

    const Item = ({ ev, dimmed }: { ev: CalendarEvent; dimmed?: boolean }) => {
        const color = getEventColor(ev.resource);
        const clickable = isEventClickable(ev.resource);
        return (
            <button
                onClick={clickable ? () => onSelectEvent(ev) : undefined}
                className={cn(
                    "w-full text-left rounded-lg px-3 py-2.5 border border-border/60 bg-card/50 hover:bg-muted/40 transition-colors",
                    dimmed && "opacity-50",
                    clickable ? "cursor-pointer" : "cursor-default",
                )}
            >
                <div className="flex items-start gap-2">
                    <div className="w-0.5 h-full min-h-[32px] rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                            {ev.resource.companyName
                                ? `${ev.resource.companyName} · ${ev.resource.roundLabel ?? ev.resource.jobDesignation}`
                                : ev.resource.jobDesignation}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {format(ev.start, "MMM d")} · {format(ev.start, "h:mm a")}
                        </p>
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
            {upcoming.length > 0 && (
                <div>
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-foreground mb-2 px-1">Upcoming</p>
                    <div className="space-y-1.5">
                        {upcoming.map(ev => <Item key={ev.id} ev={ev} />)}
                    </div>
                </div>
            )}
            {past.length > 0 && (
                <div>
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-2 px-1">Past</p>
                    <div className="space-y-1.5">
                        {past.map(ev => <Item key={ev.id} ev={ev} dimmed />)}
                    </div>
                </div>
            )}
            {upcoming.length === 0 && past.length === 0 && (
                <p className="text-xs text-muted-foreground px-1">No interviews yet.</p>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CandidateCalendarClient() {
    const { data, isLoading } = useSWR("/api/candidate/calendar", fetcher);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [view, setView] = useState<CalView>("Month");
    const [date, setDate] = useState(new Date());

    const invitations: CalendarInvitation[] = data?.success ? data.data : [];
    const events = useMemo(() => buildCalendarEvents(invitations, "candidate"), [invitations]);

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
                    <p className="text-sm text-muted-foreground">Syncing your interview timeline…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0 h-[calc(100vh-150px)] min-h-[500px] md:min-h-[600px]">
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-1 pb-2 gap-2">
                <h1 className="text-base font-bold text-foreground sm:text-xl">Interview Calendar</h1>
                <div className="flex items-center gap-1 sm:gap-2">
                    {(["Month", "Week", "Day"] as CalView[]).map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border sm:px-4 sm:text-sm",
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

            {/* ── Body ── */}
            <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
                {/* Calendar panel */}
                <div className="flex-1 flex flex-col min-w-0 rounded-xl border border-border bg-card overflow-hidden">
                    {/* Calendar header nav */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
                        <button onClick={() => navigate(-1)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted/50 transition-colors">
                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-semibold text-foreground">{headerLabel()}</span>
                        <button onClick={() => navigate(1)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted/50 transition-colors">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Calendar grid */}
                    <div className="flex-1 overflow-hidden">
                        {events.length === 0 && view === "Month" ? (
                            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 ring-1 ring-primary/20">
                                    <CalendarIcon className="h-7 w-7 text-primary" />
                                </div>
                                <div className="max-w-sm space-y-1.5">
                                    <p className="text-sm font-semibold text-foreground">No interviews on the calendar yet</p>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Accept an invitation with proposed slots and confirmed times will appear here automatically.
                                    </p>
                                </div>
                                <Link href="/candidate/invitations" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                                    Open invitations
                                </Link>
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

                {/* Sidebar — hidden on mobile, shown on lg+ */}
                <div className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-2">
                    <p className="text-sm font-semibold text-foreground px-1">Upcoming</p>
                    <SidebarList events={events} onSelectEvent={handleSelectEvent} />
                </div>
            </div>

            {/* Event modal */}
            {selectedEvent && (
                <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </div>
    );
}
