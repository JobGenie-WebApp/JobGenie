// @ts-nocheck
// Interview Reminders Edge Function
// Processes and sends interview reminder emails based on MIS settings
// Designed to be called by pg_cron every 15 minutes

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOOKAHEAD_DAYS = 30;

interface InterviewRound {
  id: string;
  round_number: number;
  round_label: string | null;
  status: string;
  outcome: string | null;
  interview_mode: string | null;
  interview_confirmed: boolean;
  given_time_slots: unknown;
  selected_time_slot: unknown;
  confirmed_time: string | null;
  meeting_link: string | null;
  interview_address: string | null;
  map_link: string | null;
  confirmed_at: string | null;
  sent_at: string | null;
  round_canceled: boolean;
  mis_rescheduled: boolean;
  mis_reschedule_data: unknown;
}

interface InvitationRow {
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
  mis_reschedule_data: unknown;
  sent_at: string;
  candidate: {
    first_name: string;
    last_name: string;
    email: string;
    user_id: string;
  };
  company: { company_name: string };
  interview_rounds: InterviewRound[] | null;
}

// Helper to parse time slot from various formats
function resolveReminderSlot(
  inv: InvitationRow,
  round: InterviewRound | null
): { date: string; time: string } | null {
  const rescheduleData = round?.mis_reschedule_data ?? inv.mis_reschedule_data;
  
  if (rescheduleData && typeof rescheduleData === "object") {
    const data = rescheduleData as any;
    if (data.new_date && data.new_time) {
      return { date: data.new_date, time: data.new_time };
    }
  }

  const confirmedTime = round?.confirmed_time ?? inv.confirmed_time;
  if (confirmedTime) {
    const dt = new Date(confirmedTime);
    const date = dt.toISOString().split("T")[0];
    const time = dt.toTimeString().slice(0, 5);
    return { date, time };
  }

  const selectedSlot = round?.selected_time_slot ?? inv.selected_time_slot;
  if (selectedSlot && typeof selectedSlot === "object") {
    const slot = selectedSlot as any;
    if (slot.date && slot.time) {
      return { date: slot.date, time: slot.time };
    }
  }

  return null;
}

// Convert wall time to UTC
function wallSlotToUtc(date: string, time: string, tz: string): Date | null {
  try {
    // Simple UTC conversion assuming ISO date and HH:MM time format
    const dateTime = `${date}T${time}:00`;
    return new Date(dateTime);
  } catch {
    return null;
  }
}

// Check if round is eligible for reminders
function isRoundReminderEligible(
  round: InterviewRound,
  invitationCanceled: boolean
): boolean {
  if (invitationCanceled || round.round_canceled) return false;
  if (round.outcome === "pass" || round.outcome === "fail") return false;
  if (!round.interview_confirmed) return false;
  return true;
}

// Get location text for reminder
function locationForReminder(
  inv: InvitationRow,
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

// Send email via Resend
async function sendReminderEmail(
  to: string,
  candidateName: string,
  companyName: string,
  jobDesignation: string,
  date: string,
  time: string,
  mode: string,
  location: string,
  invitationId: string,
  offsetMinutes: number,
  roundLabel: string | null,
  timezone: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM") || "noreply@jobgenie.com";
  const appUrl = Deno.env.get("APP_URL") || "https://jobgenie.com";

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not set, skipping email send");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const hours = Math.floor(offsetMinutes / 60);
  const mins = offsetMinutes % 60;
  let timeWindow = "";
  if (hours > 0 && mins > 0) {
    timeWindow = `${hours} hour${hours > 1 ? "s" : ""} and ${mins} minute${mins > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    timeWindow = `${hours} hour${hours > 1 ? "s" : ""}`;
  } else {
    timeWindow = `${mins} minute${mins > 1 ? "s" : ""}`;
  }

  const subject = `Reminder: Interview ${roundLabel ? `(${roundLabel})` : ""} in ${timeWindow} - ${jobDesignation}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Interview Reminder</h2>
      <p>Hi ${candidateName},</p>
      
      <p>This is a friendly reminder that your interview with <strong>${companyName}</strong> is scheduled in <strong>${timeWindow}</strong>.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #555;">Interview Details</h3>
        <p><strong>Position:</strong> ${jobDesignation}</p>
        ${roundLabel ? `<p><strong>Round:</strong> ${roundLabel}</p>` : ""}
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time} (${timezone})</p>
        <p><strong>Mode:</strong> ${mode === "physical" ? "In-Person" : "Online"}</p>
        ${location ? `<p><strong>${mode === "physical" ? "Address" : "Meeting Link"}:</strong> ${mode === "online" ? `<a href="${location}">${location}</a>` : location}</p>` : ""}
      </div>
      
      <p>Please make sure you're prepared and on time. Good luck!</p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #888;">
        You can view your interview details at: <a href="${appUrl}/candidate/invitations/${invitationId}">${appUrl}/candidate/invitations/${invitationId}</a>
      </p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Resend API error: ${error}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Main handler
Deno.serve(async (req) => {
  try {
    // Verify authorization using custom header (not Authorization to avoid Supabase JWT validation)
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    if (!cronSecret || cronSecretHeader !== cronSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // Get reminder settings
    const { data: settingsRow, error: settingsError } = await supabase
      .from("mis_interview_reminder_settings")
      .select("enabled, offsets_minutes")
      .eq("id", 1)
      .maybeSingle();

    if (settingsError) {
      console.error("Settings fetch error:", settingsError);
      return new Response(
        JSON.stringify({ error: "Settings fetch failed", scanned: 0, sent: 0, skipped: 0 }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!settingsRow?.enabled) {
      return new Response(
        JSON.stringify({ success: true, message: "Reminders disabled", scanned: 0, sent: 0, skipped: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const offsets = Array.from(
      new Set(
        (settingsRow.offsets_minutes as number[] | null)?.filter(
          (n) => typeof n === "number" && n >= 15 && n <= 10080
        ) ?? []
      )
    ).sort((a, b) => b - a);

    if (offsets.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No offsets configured", scanned: 0, sent: 0, skipped: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch eligible invitations (last 6 months)
    const sentCutoff = new Date();
    sentCutoff.setMonth(sentCutoff.getMonth() - 6);

    const { data: rows, error: fetchError } = await supabase
      .from("job_invitations")
      .select(`
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
      `)
      .eq("invitation_canceled", false)
      .gte("sent_at", sentCutoff.toISOString());

    if (fetchError || !rows) {
      console.error("Invitations fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Fetch failed", scanned: 0, sent: 0, skipped: 0 }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const invitations = rows as unknown as InvitationRow[];
    let scanned = 0;
    let sent = 0;
    let skipped = 0;

    const horizonEnd = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

    // Batch load timezones
    const userIds = invitations.map(row => row.candidate.user_id);
    const { data: timezoneRows } = await supabase
      .from("users")
      .select("id, timezone")
      .in("id", userIds);
    
    const timezoneMap = new Map<string, string>();
    timezoneRows?.forEach(row => {
      timezoneMap.set(row.id, row.timezone || "UTC");
    });

    // Process each invitation
    for (const inv of invitations) {
      const rounds = inv.interview_rounds ?? [];
      const tz = timezoneMap.get(inv.candidate.user_id) || "UTC";

      const targets: Array<{
        targetKey: string;
        round: InterviewRound | null;
        startUtc: Date;
        roundLabel: string | null;
        displayDate: string;
        displayTime: string;
      }> = [];

      // Process rounds if they exist
      if (rounds.length > 0) {
        for (const round of rounds) {
          if (!isRoundReminderEligible(round, inv.invitation_canceled)) continue;
          const slot = resolveReminderSlot(inv, round);
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
        // Process initial invitation
        const slot = resolveReminderSlot(inv, null);
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

      // Process each target interview
      for (const t of targets) {
        scanned++;
        for (const offsetMinutes of offsets) {
          const dueAt = new Date(t.startUtc.getTime() - offsetMinutes * 60 * 1000);
          
          // Skip if not yet due or already past
          if (now < dueAt || now >= t.startUtc) {
            continue;
          }

          const scheduledIso = t.startUtc.toISOString();

          // Check if already sent
          const { data: existing } = await supabase
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

          // Send reminder email
          const loc = locationForReminder(inv, t.round);
          const candidateName = `${inv.candidate.first_name} ${inv.candidate.last_name}`;

          const emailResult = await sendReminderEmail(
            inv.candidate.email,
            candidateName,
            inv.company.company_name,
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
            console.error("Email send failed:", emailResult.error);
            skipped++;
            continue;
          }

          // Record as sent
          const { error: insErr } = await supabase
            .from("interview_reminder_sent")
            .insert({
              target_key: t.targetKey,
              job_invitation_id: inv.id,
              offset_minutes: offsetMinutes,
              interview_scheduled_at: scheduledIso,
            });

          if (insErr) {
            console.error("Insert error:", insErr);
            skipped++;
            continue;
          }

          sent++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, scanned, sent, skipped }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
