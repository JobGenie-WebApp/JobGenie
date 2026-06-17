import { parseISO, isValid } from "date-fns";
import { getInvitationJourneyDisplay, normalizeEmbeddedOffer } from "./invitation-journey-status";

export interface TimeSlot {
    date: string;
    time: string;
    order: number;
    is_alternative?: boolean;
}

export interface InterviewRound {
    id: string;
    round_number: number;
    round_label: string | null;
    status: string;
    outcome: string | null;
    interview_mode: string | null;
    interview_confirmed?: boolean;
    given_time_slots: TimeSlot[] | null;
    selected_time_slot: TimeSlot | null;
    confirmed_time: unknown;
    meeting_link: string | null;
    interview_address: string | null;
    map_link: string | null;
    confirmed_at: string | null;
    sent_at: string | null;
    round_canceled?: boolean;
    mis_rescheduled?: boolean;
    mis_reschedule_data?: { date?: string; time?: string; interview_mode?: string; meeting_link?: string; interview_address?: string; map_link?: string } | null;
}

export interface CalendarInvitation {
    id: string;
    job_designation: string;
    industry: string;
    interview_mode: string | null;
    given_time_slots: TimeSlot[] | null;
    selected_time_slot: TimeSlot | null;
    confirmed_time: unknown;
    meeting_link: string | null;
    interview_address: string | null;
    map_link: string | null;
    confirmed_at: string | null;
    interview_confirmed: boolean;
    invitation_canceled: boolean;
    canceled_at: string | null;
    status: string;
    pipeline_status: string | null;
    current_round_number: number | null;
    mis_rescheduled: boolean;
    mis_reschedule_data?: { date?: string; time?: string; interview_mode?: string; meeting_link?: string; interview_address?: string; map_link?: string } | null;
    // candidate view
    company?: { company_name: string; logo_url: string | null };
    // employer view
    candidate?: { id: string; first_name: string; last_name: string; profile_image_url: string | null; email: string } | null;
    interview_rounds: InterviewRound[] | null;
    job_offers?: unknown;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: EventResource;
}

export interface EventResource {
    invitationId: string;
    roundId?: string;
    roundNumber?: number;
    roundLabel?: string;
    jobDesignation: string;
    industry: string;
    interviewMode: string | null;
    isConfirmed: boolean;
    isCanceled: boolean;
    isCompleted: boolean;
    outcome: string | null;
    status: string;
    pipelineStatus: string | null;
    meetingLink: string | null;
    interviewAddress: string | null;
    mapLink: string | null;
    confirmedAt: string | null;
    // candidate view
    companyName?: string;
    companyLogo?: string | null;
    // employer view
    candidateName?: string;
    candidateImage?: string | null;
    candidateEmail?: string;
    candidateId?: string;
    eventType: 'invitation' | 'round';
    misRescheduled: boolean;
    jobOffers?: unknown;
}

function parseTimeString(time: string): { hours: number; minutes: number } {
    // Handle "HH:MM" or "HH:MM:SS" formats
    const m = time.match(/^(\d{1,2}):(\d{2})/);
    if (m) return { hours: parseInt(m[1], 10), minutes: parseInt(m[2], 10) };
    return { hours: 9, minutes: 0 };
}

function buildEventDate(dateStr: string, timeStr: string): Date {
    try {
        const base = parseISO(dateStr);
        if (!isValid(base)) return new Date();
        const { hours, minutes } = parseTimeString(timeStr);
        base.setHours(hours, minutes, 0, 0);
        return base;
    } catch {
        return new Date();
    }
}

function confirmedTimeToRawString(value: unknown): string | null {
    if (value == null || value === "") return null;
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "number" && Number.isFinite(value)) {
        return new Date(value).toISOString();
    }
    return null;
}

// Determine the confirmed/relevant time slot for an invitation's initial round
export function resolveInvitationSlot(inv: CalendarInvitation): TimeSlot | null {
    // If MIS rescheduled, use the new date/time from reschedule data
    if (inv.mis_rescheduled && inv.mis_reschedule_data?.date && inv.mis_reschedule_data?.time) {
        return { date: inv.mis_reschedule_data.date, time: inv.mis_reschedule_data.time, order: 1 };
    }
    // If employer confirmed a specific time from alternatives
    if (inv.confirmed_time != null && inv.confirmed_time !== "") {
        const raw = confirmedTimeToRawString(inv.confirmed_time);
        if (!raw) return null;
        const parts = raw.split(/[ T]/);
        if (parts.length >= 2) {
            return { date: parts[0], time: parts[1].substring(0, 5), order: 1 };
        }
    }
    // Candidate selected a slot
    if (inv.selected_time_slot) return inv.selected_time_slot;
    // Fall back to first given slot (for pending invitations)
    if (inv.given_time_slots && inv.given_time_slots.length > 0) {
        return inv.given_time_slots[0];
    }
    return null;
}

export function resolveRoundSlot(round: InterviewRound): TimeSlot | null {
    // If MIS rescheduled this round, use the new date/time
    if (round.mis_rescheduled && round.mis_reschedule_data?.date && round.mis_reschedule_data?.time) {
        return { date: round.mis_reschedule_data.date, time: round.mis_reschedule_data.time, order: 1 };
    }
    if (round.confirmed_time != null && round.confirmed_time !== "") {
        let raw: string | null = null;
        if (typeof round.confirmed_time === "string") {
            raw = round.confirmed_time;
        } else if (typeof round.confirmed_time === "object" && round.confirmed_time !== null) {
            const maybeTime = (round.confirmed_time as { time?: unknown }).time;
            if (typeof maybeTime === "string") {
                const baseDate = round.selected_time_slot?.date ?? "";
                if (baseDate) {
                    return { date: baseDate, time: maybeTime.substring(0, 5), order: 1 };
                }
                return null;
            }
            raw = confirmedTimeToRawString(round.confirmed_time);
        } else {
            raw = confirmedTimeToRawString(round.confirmed_time);
        }
        if (!raw) return null;
        const parts = raw.split(/[ T]/);
        if (parts.length >= 2) {
            return { date: parts[0], time: parts[1].substring(0, 5), order: 1 };
        }
    }
    if (round.selected_time_slot) return round.selected_time_slot;
    if (round.given_time_slots && round.given_time_slots.length > 0) {
        return round.given_time_slots[0];
    }
    return null;
}

export function buildCalendarEvents(invitations: CalendarInvitation[], role: 'candidate' | 'employer'): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    for (const inv of invitations) {
        const rounds = inv.interview_rounds ?? [];
        const hasRounds = rounds.length > 0;

        const offer = normalizeEmbeddedOffer(inv.job_offers);
        const journey = getInvitationJourneyDisplay({
            status: inv.status,
            invitation_canceled: inv.invitation_canceled,
            interview_confirmed: inv.interview_confirmed,
            mis_rescheduled: inv.mis_rescheduled,
            pipeline_status: inv.pipeline_status,
            current_round_number: inv.current_round_number,
            candidate_reschedule_requested: false,
        }, offer);
        const statusLabel = `[${journey.label}]`;

        // If there are no rounds, show the invitation itself
        if (!hasRounds) {
            const slot = resolveInvitationSlot(inv);
            if (!slot) continue;

            const start = buildEventDate(slot.date, slot.time);
            const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default

            const title = role === 'candidate'
                ? `${statusLabel} ${inv.job_designation}${inv.company ? ` @ ${inv.company.company_name}` : ''}`
                : `${statusLabel} ${inv.job_designation}${inv.candidate ? ` - ${inv.candidate.first_name} ${inv.candidate.last_name}` : ''}`;

            // Rescheduled = canceled + mis_rescheduled; treat as active (not canceled)
            const invIsCanceled = inv.invitation_canceled && !inv.mis_rescheduled;
            // Use rescheduled meeting details if available
            const invMode = inv.mis_rescheduled && inv.mis_reschedule_data?.interview_mode
                ? inv.mis_reschedule_data.interview_mode
                : inv.interview_mode;
            const invMeetingLink = inv.mis_rescheduled && inv.mis_reschedule_data?.meeting_link
                ? inv.mis_reschedule_data.meeting_link
                : inv.meeting_link;
            const invAddress = inv.mis_rescheduled && inv.mis_reschedule_data?.interview_address
                ? inv.mis_reschedule_data.interview_address
                : inv.interview_address;
            const invMapLink = inv.mis_rescheduled && inv.mis_reschedule_data?.map_link
                ? inv.mis_reschedule_data.map_link
                : inv.map_link;

            events.push({
                id: `inv-${inv.id}`,
                title,
                start,
                end,
                resource: {
                    invitationId: inv.id,
                    jobDesignation: inv.job_designation,
                    industry: inv.industry,
                    interviewMode: invMode,
                    isConfirmed: inv.interview_confirmed,
                    isCanceled: invIsCanceled,
                    isCompleted: false,
                    outcome: null,
                    status: inv.status,
                    pipelineStatus: inv.pipeline_status,
                    meetingLink: invMeetingLink,
                    interviewAddress: invAddress,
                    mapLink: invMapLink,
                    confirmedAt: inv.confirmed_at,
                    companyName: inv.company?.company_name,
                    companyLogo: inv.company?.logo_url,
                    candidateName: inv.candidate ? `${inv.candidate.first_name} ${inv.candidate.last_name}` : undefined,
                    candidateImage: inv.candidate?.profile_image_url,
                    candidateEmail: inv.candidate?.email,
                    candidateId: inv.candidate?.id,
                    eventType: 'invitation',
                    misRescheduled: inv.mis_rescheduled,
                    jobOffers: inv.job_offers,
                },
            });
        } else {
            // Show each round as a separate event
            for (const round of rounds) {
                // Skip rounds that weren't sent yet (no time slots)
                const slot = resolveRoundSlot(round);
                if (!slot) continue;

                const start = buildEventDate(slot.date, slot.time);
                const end = new Date(start.getTime() + 60 * 60 * 1000);

                const roundLabel = round.round_label || `Round ${round.round_number}`;
                const title = role === 'candidate'
                    ? `${statusLabel} ${inv.job_designation} (${roundLabel})${inv.company ? ` @ ${inv.company.company_name}` : ''}`
                    : `${statusLabel} ${inv.job_designation} (${roundLabel})${inv.candidate ? ` - ${inv.candidate.first_name} ${inv.candidate.last_name}` : ''}`;

                const roundMisRescheduled = round.mis_rescheduled ?? false;
                // Round is canceled only if actually canceled AND NOT rescheduled by MIS
                const roundActuallyCanceled = (round.round_canceled || round.status === 'canceled') && !roundMisRescheduled;
                // Parent invitation canceled propagates only when not rescheduled
                const isCanceled = roundActuallyCanceled || (inv.invitation_canceled && !inv.mis_rescheduled);
                const isConfirmed = round.status === 'confirmed' || round.confirmed_at !== null;
                const isCompleted = !!round.outcome && !isCanceled;

                // Use rescheduled details if available
                const roundMode = roundMisRescheduled && round.mis_reschedule_data?.interview_mode
                    ? round.mis_reschedule_data.interview_mode
                    : (round.interview_mode ?? inv.interview_mode);
                const roundMeetingLink = roundMisRescheduled && round.mis_reschedule_data?.meeting_link
                    ? round.mis_reschedule_data.meeting_link
                    : round.meeting_link;
                const roundAddress = roundMisRescheduled && round.mis_reschedule_data?.interview_address
                    ? round.mis_reschedule_data.interview_address
                    : round.interview_address;
                const roundMapLink = roundMisRescheduled && round.mis_reschedule_data?.map_link
                    ? round.mis_reschedule_data.map_link
                    : round.map_link;

                events.push({
                    id: `round-${round.id}`,
                    title,
                    start,
                    end,
                    resource: {
                        invitationId: inv.id,
                        roundId: round.id,
                        roundNumber: round.round_number,
                        roundLabel,
                        jobDesignation: inv.job_designation,
                        industry: inv.industry,
                        interviewMode: roundMode,
                        isConfirmed,
                        isCanceled,
                        isCompleted,
                        outcome: round.outcome ?? null,
                        status: round.status,
                        pipelineStatus: inv.pipeline_status,
                        meetingLink: roundMeetingLink,
                        interviewAddress: roundAddress,
                        mapLink: roundMapLink,
                        confirmedAt: round.confirmed_at,
                        companyName: inv.company?.company_name,
                        companyLogo: inv.company?.logo_url,
                        candidateName: inv.candidate ? `${inv.candidate.first_name} ${inv.candidate.last_name}` : undefined,
                        candidateImage: inv.candidate?.profile_image_url,
                        candidateEmail: inv.candidate?.email,
                        candidateId: inv.candidate?.id,
                        eventType: 'round',
                        misRescheduled: roundMisRescheduled,
                        jobOffers: inv.job_offers,
                    },
                });
            }
        }
    }

    return events;
}

export function getEventColor(resource: EventResource): string {
    if (resource.isCompleted) return "#8b5cf6"; // violet – completed rounds (has outcome)
    if (resource.isCanceled)  return "#64748b"; // slate  – canceled

    const offer = normalizeEmbeddedOffer(resource.jobOffers);
    const journey = getInvitationJourneyDisplay({
        status: resource.status,
        invitation_canceled: resource.isCanceled,
        interview_confirmed: resource.isConfirmed,
        mis_rescheduled: resource.misRescheduled,
        pipeline_status: resource.pipelineStatus,
        current_round_number: resource.roundNumber ?? null,
        candidate_reschedule_requested: false,
    }, offer);

    switch (journey.variant) {
        case "success":   return "#10b981"; // emerald  – confirmed / rescheduled / accepted
        case "info":      return "#6366f1"; // indigo   – active round
        case "warning":   return "#f59e0b"; // amber    – needs action / reschedule requested / offered
        case "pending":   return "#3b82f6"; // blue     – pending / viewed
        case "danger":    return "#ef4444"; // red      – declined / rejected
        case "muted":     return "#64748b"; // slate    – canceled / expired / withdrawn
        default:          return "#6366f1";
    }
}

export function isEventClickable(resource: EventResource): boolean {
    // Only truly canceled/expired events (muted) are non-clickable.
    // Confirmed, rescheduled, declined, etc. should all be clickable to view details.
    if (resource.isCanceled) return false;
    return true;
}
