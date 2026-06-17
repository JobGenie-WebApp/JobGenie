"use client";

import { useState, useMemo } from "react";
import {
    format, parseISO, isSameDay, isSameMonth,
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    addDays, addMonths, subMonths, isToday,
} from "date-fns";
import {
    ChevronLeft, ChevronRight,
    Video, MapPin, X, Calendar, Clock,
    Building2, CheckCircle2, Clock4, ExternalLink, Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { InterviewEvent } from "@/app/actions/candidate-dashboard-data";

interface Props { events: InterviewEvent[]; }

function formatTime(rawTime: string): string {
    if (!rawTime) return "";
    const m = rawTime.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return rawTime;
    let h = parseInt(m[1], 10);
    const mins = m[2];
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mins} ${ap}`;
}

/** Build array of Date objects for the 6-week grid covering the given month */
function buildCalendarGrid(month: Date): Date[] {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) {
        days.push(cur);
        cur = addDays(cur, 1);
    }
    return days;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function InterviewCalendarWidget({ events }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [modalOpen, setModalOpen] = useState(false);

    // Build event lookup map
    const eventsByDate = useMemo(() => {
        const map = new Map<string, InterviewEvent[]>();
        for (const ev of events) {
            if (!map.has(ev.date)) map.set(ev.date, []);
            map.get(ev.date)!.push(ev);
        }
        return map;
    }, [events]);

    const calendarDays = useMemo(() => buildCalendarGrid(currentMonth), [currentMonth]);

    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];
        return eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? [];
    }, [selectedDate, eventsByDate]);

    function openDay(day: Date) {
        setSelectedDate(day);
        setModalOpen(true);
    }

    return (
        <>
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {/* ── Header ──────────────────────────────────────── */}
                <div className="px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Interview Calendar</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {events.length === 0
                                ? "No interviews scheduled"
                                : `${events.length} interview${events.length === 1 ? "" : "s"} on calendar`}
                        </p>
                    </div>
                    {events.length > 0 && (
                        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground items-end">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-primary inline-block" /> Confirmed
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-primary/40 inline-block" /> Pending
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Month nav ───────────────────────────────────── */}
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors text-foreground"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-foreground">
                        {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors text-foreground"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* ── Calendar grid ───────────────────────────────── */}
                <div className="px-4 pb-3">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {WEEKDAYS.map((d) => (
                            <div key={d} className="flex items-center justify-center text-[11px] font-medium text-muted-foreground py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {calendarDays.map((day) => {
                            const key = format(day, "yyyy-MM-dd");
                            const dayEvts = eventsByDate.get(key) ?? [];
                            const hasEvt = dayEvts.length > 0;
                            const hasConfirmed = dayEvts.some((e) => e.is_confirmed && !e.is_canceled);
                            const allCanceled = hasEvt && dayEvts.every((e) => e.is_canceled);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isTodayDay = isToday(day);
                            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                            const dotClass = isSelected
                                ? "bg-primary-foreground"
                                : allCanceled
                                    ? "bg-muted-foreground/40"
                                    : hasConfirmed
                                        ? "bg-primary"
                                        : "bg-primary/50";

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => openDay(day)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center h-9 w-full rounded-lg",
                                        "text-[13px] transition-colors select-none outline-none",
                                        // Outside current month
                                        !isCurrentMonth && "opacity-30",
                                        // Today ring
                                        isTodayDay && !isSelected && "font-bold text-primary ring-1 ring-primary/40",
                                        // Selected
                                        isSelected && "bg-primary text-primary-foreground font-semibold",
                                        // Has event — bolder
                                        hasEvt && !isSelected && "font-semibold",
                                        // Default text
                                        !isSelected && !isTodayDay && "text-foreground/85",
                                        // Hover
                                        !isSelected && "hover:bg-muted/60",
                                        isSelected && "hover:bg-primary/90",
                                    )}
                                >
                                    <span className="leading-none">{format(day, "d")}</span>
                                    {hasEvt && (
                                        <span
                                            className={cn(
                                                "absolute bottom-[3px] h-[5px] w-[5px] rounded-full",
                                                dotClass
                                            )}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Legend ──────────────────────────────────────── */}
                <div className="px-5 pb-4 text-[11px] text-muted-foreground">
                    Click any day to see interview details.
                </div>
            </div>

            {/* ── Modal ───────────────────────────────────────────── */}
            {modalOpen && selectedDate && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={() => setModalOpen(false)}
                    />
                    <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                                        {format(selectedDate, "EEEE")}
                                    </p>
                                    <h3 className="text-sm font-bold text-foreground">
                                        {format(selectedDate, "MMMM d, yyyy")}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Body */}
                            {selectedDayEvents.length === 0 ? (
                                <div className="px-5 py-8 flex flex-col items-center text-center gap-2">
                                    <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground mt-1">No interview scheduled</p>
                                    <p className="text-xs text-muted-foreground">
                                        There are no interviews scheduled for this day.
                                    </p>
                                    <Link
                                        href="/candidate/invitations"
                                        className="mt-1 text-xs font-semibold text-primary hover:underline"
                                        onClick={() => setModalOpen(false)}
                                    >
                                        View all invitations →
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
                                    {selectedDayEvents.map((ev) => (
                                        <div key={ev.id} className="px-5 py-4">
                                            <div className="flex items-center justify-between mb-2.5 flex-wrap gap-1">
                                                {ev.is_canceled ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                        <Ban className="h-2.5 w-2.5" /> Canceled
                                                    </span>
                                                ) : ev.is_confirmed ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary">
                                                        <CheckCircle2 className="h-2.5 w-2.5" /> Confirmed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                        <Clock4 className="h-2.5 w-2.5" /> Awaiting Confirmation
                                                    </span>
                                                )}
                                                {ev.interview_mode && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        {ev.interview_mode === "online"
                                                            ? <Video className="h-2.5 w-2.5" />
                                                            : <MapPin className="h-2.5 w-2.5" />}
                                                        {ev.interview_mode === "online" ? "Online" : "In-Person"}
                                                    </span>
                                                )}
                                            </div>

                                            <p className={cn(
                                                "text-sm font-semibold leading-snug",
                                                ev.is_canceled ? "text-muted-foreground line-through" : "text-foreground"
                                            )}>
                                                {ev.job_designation}
                                            </p>

                                            {ev.company_name && (
                                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                    <Building2 className="h-3 w-3 flex-shrink-0" />
                                                    {ev.company_name}
                                                </p>
                                            )}

                                            {ev.time && (
                                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                    {formatTime(ev.time)}
                                                </p>
                                            )}

                                            <Link
                                                href={`/candidate/invitations/${ev.invitation_id}`}
                                                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                                onClick={() => setModalOpen(false)}
                                            >
                                                View full details <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="px-5 py-3 border-t border-border bg-muted/20">
                                <Link
                                    href="/candidate/invitations"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => setModalOpen(false)}
                                >
                                    View all invitations →
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
