import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarInvitation, InterviewRound } from "@/lib/calendar-utils";
import {
    isRoundReminderEligible,
    resolveReminderSlotForInvitation,
    resolveReminderSlotForRound,
    wallSlotToUtc,
} from "@/lib/interview-reminder-utils";
import { sendInterviewReminderEmail } from "@/lib/interview-emails";
import { getUserTimezoneBatch } from "@/lib/user-timezone";
import { logBusiness, logError } from "@/lib/logger";

const LOOKAHEAD_DAYS = Math.min(
    Math.max(1, parseInt(process.env.INTERVIEW_REMINDER_LOOKAHEAD_DAYS || "30", 10) || 30),
    90
);

type InvitationRow = {
    id: string;
    job_designation: string;
    industry: string;
    interview_mode: string | null;
    given_time_slots: unknown;
    selected_time_slot: unknown;
    confirmed_time: string | null;
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
    mis_reschedule_data: { date?: string; time?: string; interview_mode?: string; meeting_link?: string; interview_address?: string; map_link?: string } | null;
    sent_at: string;
    candidate: {
        first_name: string;
        last_name: string;
        email: string;
        user_id: string;
    };
    company: { company_name: string };
    interview_rounds: InterviewRound[] | null;
};

function asCalendarInvitation(row: InvitationRow): CalendarInvitation {
    return {
        id: row.id,
        job_designation: row.job_designation,
        industry: row.industry,
        interview_mode: row.interview_mode,
        given_time_slots: row.given_time_slots as CalendarInvitation["given_time_slots"],
        selected_time_slot: row.selected_time_slot as CalendarInvitation["selected_time_slot"],
        confirmed_time: row.confirmed_time,
        meeting_link: row.meeting_link,
        interview_address: row.interview_address,
        map_link: row.map_link,
        confirmed_at: row.confirmed_at,
        interview_confirmed: row.interview_confirmed,
        invitation_canceled: row.invitation_canceled,
        canceled_at: row.canceled_at,
        status: row.status,
        pipeline_status: row.pipeline_status,
        current_round_number: row.current_round_number,
        mis_rescheduled: row.mis_rescheduled,
        mis_reschedule_data: row.mis_reschedule_data,
        company: { company_name: row.company.company_name, logo_url: null },
        candidate: {
            id: "",
            first_name: row.candidate.first_name,
            last_name: row.candidate.last_name,
            email: row.candidate.email,
            profile_image_url: null,
        },
        interview_rounds: row.interview_rounds,
    };
}

function locationForReminder(
    inv: CalendarInvitation,
    round: InterviewRound | null
): { mode: string; text: string } {
    const mode = (round?.interview_mode ?? inv.interview_mode ?? "online").toLowerCase();
    if (mode === "physical") {
        const addr = round?.interview_address ?? inv.interview_address ?? "";
        return { mode: "physical", text: addr };
    }
    const link = round?.meeting_link ?? inv.meeting_link ?? "";
    return { mode: "online", text: link };
}

/**
 * Sends due MIS-configured interview reminders. Intended for cron (service role).
 */
export async function processInterviewReminders(): Promise<{
    scanned: number;
    sent: number;
    skipped: number;
}> {
    const admin = createAdminClient();
    const now = new Date();

    const { data: settingsRow, error: settingsError } = await admin
        .from("mis_interview_reminder_settings")
        .select("enabled, offsets_minutes")
        .eq("id", 1)
        .maybeSingle();

    if (settingsError) {
        await logError({
            source: "processInterviewReminders:settings",
            errorType: "APIError",
            message: settingsError.message,
        });
        return { scanned: 0, sent: 0, skipped: 0 };
    }

    if (!settingsRow?.enabled) {
        return { scanned: 0, sent: 0, skipped: 0 };
    }

    const offsets = Array.from(
        new Set(
            (settingsRow.offsets_minutes as number[] | null)?.filter(
                (n) => typeof n === "number" && n >= 15 && n <= 10080
            ) ?? []
        )
    ).sort((a, b) => b - a);

    if (offsets.length === 0) {
        return { scanned: 0, sent: 0, skipped: 0 };
    }

    const sentCutoff = new Date();
    sentCutoff.setMonth(sentCutoff.getMonth() - 6);

    const { data: rows, error: fetchError } = await admin
        .from("job_invitations")
        .select(
            `
            id,
            job_designation,
            industry,
            interview_mode,
            given_time_slots,
            selected_time_slot,
            confirmed_time,
            meeting_link,
            interview_address,
            map_link,
            confirmed_at,
            interview_confirmed,
            invitation_canceled,
            canceled_at,
            status,
            pipeline_status,
            current_round_number,
            mis_rescheduled,
            mis_reschedule_data,
            sent_at,
            candidate:candidates!inner(first_name, last_name, email, user_id),
            company:companies!inner(company_name),
            interview_rounds(
                id,
                round_number,
                round_label,
                status,
                outcome,
                interview_mode,
                interview_confirmed,
                given_time_slots,
                selected_time_slot,
                confirmed_time,
                meeting_link,
                interview_address,
                map_link,
                confirmed_at,
                sent_at,
                round_canceled,
                mis_rescheduled,
                mis_reschedule_data
            )
        `
        )
        .eq("invitation_canceled", false)
        .gte("sent_at", sentCutoff.toISOString());

    if (fetchError || !rows) {
        await logError({
            source: "processInterviewReminders:fetch",
            errorType: "APIError",
            message: fetchError?.message ?? "no rows",
        });
        return { scanned: 0, sent: 0, skipped: 0 };
    }

    const invitations = rows as unknown as InvitationRow[];
    let scanned = 0;
    let sent = 0;
    let skipped = 0;

    const horizonEnd = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

    // Batch load all timezones instead of per-row queries (90% query reduction)
    const userIds = invitations.map(row => row.candidate.user_id);
    const timezoneMap = await getUserTimezoneBatch(userIds);

    for (const row of invitations) {
        const inv = asCalendarInvitation(row);
        const rounds = inv.interview_rounds ?? [];
        const tz = timezoneMap.get(row.candidate.user_id) || "UTC";

        const targets: Array<{
            targetKey: string;
            round: InterviewRound | null;
            startUtc: Date;
            roundLabel: string | null;
            displayDate: string;
            displayTime: string;
        }> = [];

        if (rounds.length > 0) {
            for (const round of rounds) {
                if (!isRoundReminderEligible(round, inv.invitation_canceled)) continue;
                const slot = resolveReminderSlotForRound(inv, round);
                if (!slot) continue;
                const startUtc = wallSlotToUtc(slot.date, slot.time, tz);
                if (!startUtc || startUtc <= now || startUtc > horizonEnd) continue;
                targets.push({
                    targetKey: `round:${round.id}`,
                    round,
                    startUtc,
                    roundLabel: round.round_label || `Round ${round.round_number}`,
                    displayDate: slot.date,
                    displayTime: slot.time,
                });
            }
        } else if (inv.interview_confirmed) {
            const slot = resolveReminderSlotForInvitation(inv);
            if (!slot) continue;
            const startUtc = wallSlotToUtc(slot.date, slot.time, tz);
            if (!startUtc || startUtc <= now || startUtc > horizonEnd) continue;
            targets.push({
                targetKey: `inv:${inv.id}`,
                round: null,
                startUtc,
                roundLabel: null,
                displayDate: slot.date,
                displayTime: slot.time,
            });
        }

        for (const t of targets) {
            scanned++;
            for (const offsetMinutes of offsets) {
                const dueAt = new Date(t.startUtc.getTime() - offsetMinutes * 60 * 1000);
                if (now < dueAt) {
                    continue;
                }
                if (now >= t.startUtc) {
                    continue;
                }

                const scheduledIso = t.startUtc.toISOString();

                const { data: existing } = await admin
                    .from("interview_reminder_sent")
                    .select("id")
                    .eq("target_key", t.targetKey)
                    .eq("offset_minutes", offsetMinutes)
                    .eq("interview_scheduled_at", scheduledIso)
                    .maybeSingle();

                if (existing) {
                    skipped++;
                    continue;
                }

                const loc = locationForReminder(inv, t.round);
                const candidateName = `${row.candidate.first_name} ${row.candidate.last_name}`;

                const emailResult = await sendInterviewReminderEmail(
                    row.candidate.email,
                    candidateName,
                    row.company.company_name,
                    inv.job_designation,
                    t.displayDate,
                    t.displayTime,
                    loc.mode,
                    loc.text || "—",
                    inv.id,
                    offsetMinutes,
                    t.roundLabel,
                    tz
                );

                if (!emailResult.success) {
                    await logError({
                        source: "processInterviewReminders:email",
                        errorType: "APIError",
                        message: emailResult.error ?? "send failed",
                        metadata: { invitationId: inv.id, targetKey: t.targetKey, offsetMinutes },
                    });
                    skipped++;
                    continue;
                }

                const { error: insErr } = await admin.from("interview_reminder_sent").insert({
                    target_key: t.targetKey,
                    job_invitation_id: inv.id,
                    offset_minutes: offsetMinutes,
                    interview_scheduled_at: scheduledIso,
                });

                if (insErr) {
                    await logError({
                        source: "processInterviewReminders:insert",
                        errorType: "APIError",
                        message: insErr.message,
                        metadata: { invitationId: inv.id, targetKey: t.targetKey },
                    });
                    skipped++;
                    continue;
                }

                sent++;
                await logBusiness(
                    "interview_reminder_sent",
                    undefined,
                    "system",
                    "job_invitation",
                    inv.id,
                    { target_key: t.targetKey, offset_minutes: offsetMinutes }
                );
            }
        }
    }

    return { scanned, sent, skipped };
}
