import { resend, EMAIL_JOBS_FROM } from "./resend";
import { getBaseUrl } from "./email";
import { formatUTCDate, formatUTCTime } from "./date-utils";

/**
 * Send interview invitation email to candidate
 */
export async function sendInterviewInvitationEmail(
    candidateEmail: string,
    candidateName: string,
    companyName: string,
    jobDesignation: string,
    timeSlots: Array<{ date: string; time: string }>,
    invitationId: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();
        const invitationUrl = `${baseUrl}/candidate/invitations/${invitationId}`;

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Interview Invitation Email`);
            console.log(`====================================`);
            console.log(`To: ${candidateEmail}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Company: ${companyName}`);
            console.log(`Position: ${jobDesignation}`);
            console.log(`Invitation URL: ${invitationUrl}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        // Create deep link with login redirect
        const invitationDetailUrl = `${baseUrl}/candidate/invitations/${invitationId}`;
        const loginRedirectUrl = `${baseUrl}/login?returnUrl=${encodeURIComponent(invitationDetailUrl)}`;

        const timeSlotsHTML = timeSlots.map((slot, idx) => `
            <div style="display:flex;align-items:center;gap:8px;padding:12px;background:#f9fafb;border-radius:8px;margin-bottom:8px;">
                <span style="font-weight:600;color:#22c55e;min-width:30px;">${idx + 1}.</span>
                <span style="color:#1f2937;">${formatUTCDate(slot.date, "EEEE, MMMM d, yyyy", recipientTimezone)} at ${formatUTCTime(slot.date, slot.time, "HH:mm", recipientTimezone)}</span>
            </div>
        `).join('');

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Find Your Perfect Career Match</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">📧</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Invitation</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${candidateName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Great news! <strong>${companyName}</strong> is interested in interviewing you for the <strong>${jobDesignation}</strong> position.</p>
<div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#166534;">📅 Proposed Time Slots:</p>
${timeSlotsHTML}
</div>
<p style="margin:24px 0;font-size:16px;line-height:1.6;color:#4b5563;">Please review the invitation and select your preferred time slot.</p>
<div style="text-align:center;margin:32px 0;">
<a href="${loginRedirectUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Invitation</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#22c55e;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: candidateEmail,
            subject: `Interview Invitation from ${companyName} - JobGenie`,
            html,
        });

        if (error) {
            console.error("Interview invitation email error:", error);
            return { success: false, error: "Failed to send invitation email" };
        }

        console.log(`[EMAIL] Interview invitation sent to ${candidateEmail}`);
        return { success: true };
    } catch (error) {
        console.error("Interview invitation email error:", error);
        return { success: false, error: "Failed to send invitation email" };
    }
}

/**
 * Send interview confirmed email to candidate
 */
export async function sendInterviewConfirmedEmail(
    candidateEmail: string,
    candidateName: string,
    companyName: string,
    jobDesignation: string,
    interviewDate: string,
    interviewTime: string,
    interviewMode: string,
    meetingLinkOrAddress: string,
    invitationId: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Interview Confirmed Email`);
            console.log(`====================================`);
            console.log(`To: ${candidateEmail}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Company: ${companyName}`);
            console.log(`Date: ${interviewDate} at ${interviewTime}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        // Create deep link with login redirect
        const invitationDetailUrl = `${baseUrl}/candidate/invitations/${invitationId}`;
        const loginRedirectUrl = `${baseUrl}/login?returnUrl=${encodeURIComponent(invitationDetailUrl)}`;

        const locationHTML = interviewMode === 'online'
            ? `<p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>📹 Online Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#166534;">Meeting Link: <a href="${meetingLinkOrAddress}" style="color:#22c55e;">${meetingLinkOrAddress}</a></p>`
            : `<p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>📍 Physical Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#166534;">Address: ${meetingLinkOrAddress}</p>`;

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Find Your Perfect Career Match</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">✅</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Confirmed!</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${candidateName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Your interview with <strong>${companyName}</strong> for the <strong>${jobDesignation}</strong> position has been confirmed!</p>
<div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#166534;">📅 Interview Details:</p>
<p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>Date:</strong> ${formatUTCDate(interviewDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0 0 16px;font-size:14px;color:#166534;"><strong>Time:</strong> ${formatUTCTime(interviewDate, interviewTime, "HH:mm", recipientTimezone)}</p>
${locationHTML}
</div>
<div style="background-color:#dbeafe;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#1e40af;"><strong>💡 Tip:</strong> Add this interview to your calendar and prepare your questions in advance. Good luck!</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${loginRedirectUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Details</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#22c55e;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: candidateEmail,
            subject: `Interview Confirmed with ${companyName} - JobGenie`,
            html,
        });

        if (error) {
            console.error("Interview confirmed email error:", error);
            return { success: false, error: "Failed to send confirmation email" };
        }

        console.log(`[EMAIL] Interview confirmed email sent to ${candidateEmail}`);
        return { success: true };
    } catch (error) {
        console.error("Interview confirmed email error:", error);
        return { success: false, error: "Failed to send confirmation email" };
    }
}

function formatOffsetLabel(offsetMinutes: number): string {
    if (offsetMinutes % 1440 === 0 && offsetMinutes >= 1440) {
        const d = offsetMinutes / 1440;
        return d === 1 ? "24 hours" : `${d} days`;
    }
    if (offsetMinutes % 60 === 0 && offsetMinutes >= 60) {
        const h = offsetMinutes / 60;
        return h === 1 ? "1 hour" : `${h} hours`;
    }
    return `${offsetMinutes} minutes`;
}

/**
 * MIS-configured reminder before a confirmed interview (candidate only).
 */
export async function sendInterviewReminderEmail(
    candidateEmail: string,
    candidateName: string,
    companyName: string,
    jobDesignation: string,
    interviewDate: string,
    interviewTime: string,
    interviewMode: string,
    meetingLinkOrAddress: string,
    invitationId: string,
    offsetMinutes: number,
    roundLabel: string | null,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();
        const offsetLabel = formatOffsetLabel(offsetMinutes);
        const roundLine = roundLabel
            ? `<p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>Round:</strong> ${roundLabel}</p>`
            : "";

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Interview Reminder Email (${offsetLabel} before)`);
            console.log(`====================================`);
            console.log(`To: ${candidateEmail}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Company: ${companyName}`);
            console.log(`When: ${interviewDate} at ${interviewTime}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        const invitationDetailUrl = `${baseUrl}/candidate/invitations/${invitationId}`;
        const loginRedirectUrl = `${baseUrl}/login?returnUrl=${encodeURIComponent(invitationDetailUrl)}`;

        const locationHTML =
            interviewMode === "online"
                ? `<p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>Online</strong> — <a href="${meetingLinkOrAddress}" style="color:#22c55e;">Join link</a></p>`
                : `<p style="margin:0;font-size:14px;color:#166534;"><strong>Location:</strong> ${meetingLinkOrAddress}</p>`;

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Interview reminder</p>
</td></tr>
<tr><td style="padding:40px;">
<h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#1f2937;text-align:center;">Your interview is coming up</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${candidateName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">This is a friendly reminder: your interview with <strong>${companyName}</strong> for <strong>${jobDesignation}</strong> starts in about <strong>${offsetLabel}</strong>.</p>
<div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#166534;">Scheduled time</p>
<p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>Date:</strong> ${formatUTCDate(interviewDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0 0 12px;font-size:14px;color:#166534;"><strong>Time:</strong> ${formatUTCTime(interviewDate, interviewTime, "HH:mm", recipientTimezone)}</p>
${roundLine}
${locationHTML}
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${loginRedirectUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View invitation</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#22c55e;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: candidateEmail,
            subject: `Reminder: Interview with ${companyName} — JobGenie`,
            html,
        });

        if (error) {
            console.error("Interview reminder email error:", error);
            return { success: false, error: "Failed to send reminder email" };
        }

        console.log(`[EMAIL] Interview reminder (${offsetLabel}) sent to ${candidateEmail}`);
        return { success: true };
    } catch (error) {
        console.error("Interview reminder email error:", error);
        return { success: false, error: "Failed to send reminder email" };
    }
}

/**
 * Send cancellation notification to employer when candidate cancels
 */
export async function sendCandidateCancellationEmail(
    employerEmail: string,
    employerName: string,
    candidateName: string,
    jobDesignation: string,
    interviewDate: string,
    interviewTime: string,
    cancellationReason: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Candidate Cancellation Email`);
            console.log(`====================================`);
            console.log(`To: ${employerEmail}`);
            console.log(`Employer: ${employerName}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Reason: ${cancellationReason}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Employer Portal</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">❌</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Canceled by Candidate</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${employerName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;"><strong>${candidateName}</strong> has canceled the scheduled interview for the <strong>${jobDesignation}</strong> position.</p>
<div style="background-color:#fee2e2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#991b1b;">Interview Details:</p>
<p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Date:</strong> ${formatUTCDate(interviewDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0;font-size:14px;color:#991b1b;"><strong>Time:</strong> ${formatUTCTime(interviewDate, interviewTime, "HH:mm", recipientTimezone)}</p>
</div>
<div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">Cancellation Reason:</p>
<p style="margin:0;font-size:15px;color:#78350f;line-height:1.6;">${cancellationReason}</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${baseUrl}/employer/invitations" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Invitations</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#22c55e;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: employerEmail,
            subject: `Interview Canceled by Candidate - JobGenie`,
            html,
        });

        if (error) {
            console.error("Candidate cancellation email error:", error);
            return { success: false, error: "Failed to send cancellation email" };
        }

        console.log(`[EMAIL] Candidate cancellation email sent to ${employerEmail}`);
        return { success: true };
    } catch (error) {
        console.error("Candidate cancellation email error:", error);
        return { success: false, error: "Failed to send cancellation email" };
    }
}

/**
 * Send cancellation notification to candidate when employer cancels
 */
export async function sendEmployerCancellationEmail(
    candidateEmail: string,
    candidateName: string,
    companyName: string,
    jobDesignation: string,
    interviewDate: string,
    interviewTime: string,
    cancellationReason: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Employer Cancellation Email`);
            console.log(`====================================`);
            console.log(`To: ${candidateEmail}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Company: ${companyName}`);
            console.log(`Reason: ${cancellationReason}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Find Your Perfect Career Match</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#fee2e2 0%,#fecaca 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">❌</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Canceled</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${candidateName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">We're sorry to inform you that <strong>${companyName}</strong> has canceled the scheduled interview for the <strong>${jobDesignation}</strong> position.</p>
<div style="background-color:#fee2e2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#991b1b;">Interview Details:</p>
<p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Date:</strong> ${formatUTCDate(interviewDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0;font-size:14px;color:#991b1b;"><strong>Time:</strong> ${formatUTCTime(interviewDate, interviewTime, "HH:mm", recipientTimezone)}</p>
</div>
<div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">Reason:</p>
<p style="margin:0;font-size:15px;color:#78350f;line-height:1.6;">${cancellationReason}</p>
</div>
<div style="background-color:#dbeafe;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#1e40af;"><strong>💙 We're Here for You:</strong> Don't be discouraged! Keep exploring other opportunities on JobGenie.</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${baseUrl}/candidate/invitations" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Invitations</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#22c55e;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: candidateEmail,
            subject: `Interview Canceled - JobGenie`,
            html,
        });

        if (error) {
            console.error("Employer cancellation email error:", error);
            return { success: false, error: "Failed to send cancellation email" };
        }

        console.log(`[EMAIL] Employer cancellation email sent to ${candidateEmail}`);
        return { success: true };
    } catch (error) {
        console.error("Employer cancellation email error:", error);
        return { success: false, error: "Failed to send cancellation email" };
    }
}

/**
 * Send MIS reschedule notification email to candidate  
 */
export async function sendMISRescheduleNotificationToCandidate(
    candidateEmail: string,
    candidateName: string,
    companyName: string,
    jobDesignation: string,
    newDate: string,
    newTime: string,
    interviewMode: string,
    meetingLinkOrAddress: string,
    invitationId: string,
    notes: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] MIS Reschedule Notification (Candidate)`);
            console.log(`====================================`);
            console.log(`To: ${candidateEmail}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Company: ${companyName}`);
            console.log(`New Date: ${newDate} at ${newTime}`);
            console.log(`Invitation Link: ${baseUrl}/login?returnUrl=${encodeURIComponent(`/candidate/invitations/${invitationId}`)}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        // Create deep link with login redirect
        const invitationDetailUrl = `${baseUrl}/candidate/invitations/${invitationId}`;
        const loginRedirectUrl = `${baseUrl}/login?returnUrl=${encodeURIComponent(invitationDetailUrl)}`;

        const locationHTML = interviewMode === 'online'
            ? `<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>📹 Online Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#1e40af;">Meeting Link: <a href="${meetingLinkOrAddress}" style="color:#3b82f6;">${meetingLinkOrAddress}</a></p>`
            : `<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>📍 Physical Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#1e40af;">Address: ${meetingLinkOrAddress}</p>`;

        const notesHTML = notes ? `
            <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">📝 Additional Notes:</p>
                <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${notes}</p>
            </div>` : '';

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Find Your Perfect Career Match</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">🔄</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Rescheduled</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${candidateName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Your interview with <strong>${companyName}</strong> for the <strong>${jobDesignation}</strong> position has been rescheduled by our MIS team.</p>
<div style="background-color:#dbeafe;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e40af;">📅 New Interview Details:</p>
<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>Date:</strong> ${formatUTCDate(newDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0 0 16px;font-size:14px;color:#1e40af;"><strong>Time:</strong> ${formatUTCTime(newDate, newTime, "HH:mm", recipientTimezone)}</p>
${locationHTML}
</div>
${notesHTML}
<div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#166534;"><strong>💡 Tip:</strong> Please review the updated details and prepare accordingly. Good luck!</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${loginRedirectUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Interview Details</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#3b82f6;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: candidateEmail,
            subject: `Interview Rescheduled - ${companyName} - JobGenie`,
            html,
        });

        if (error) {
            console.error("MIS reschedule candidate email error:", error);
            return { success: false, error: "Failed to send reschedule notification" };
        }

        console.log(`[EMAIL] MIS reschedule notification sent to candidate ${candidateEmail}`);
        return { success: true };
    } catch (error) {
        console.error("MIS reschedule candidate email error:", error);
        return { success: false, error: "Failed to send reschedule notification" };
    }
}

/**
 * Send MIS reschedule notification email to employer
 */
export async function sendMISRescheduleNotificationToEmployer(
    employerEmail: string,
    employerName: string,
    candidateName: string,
    jobDesignation: string,
    newDate: string,
    newTime: string,
    interviewMode: string,
    meetingLinkOrAddress: string,
    invitationId: string,
    notes: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] MIS Reschedule Notification (Employer)`);
            console.log(`====================================`);
            console.log(`To: ${employerEmail}`);
            console.log(`Employer: ${employerName}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`New Date: ${newDate} at ${newTime}`);
            console.log(`Invitation Link: ${baseUrl}/login?returnUrl=${encodeURIComponent(`/employer/invitations`)}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        // Create deep link with login redirect - employer invitations are viewed in a list/modal, not individual detail pages
        const invitationDetailUrl = `${baseUrl}/employer/invitations`;
        const loginRedirectUrl = `${baseUrl}/login?returnUrl=${encodeURIComponent(invitationDetailUrl)}`;

        const locationHTML = interviewMode === 'online'
            ? `<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>📹 Online Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#1e40af;">Meeting Link: <a href="${meetingLinkOrAddress}" style="color:#3b82f6;">${meetingLinkOrAddress}</a></p>`
            : `<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>📍 Physical Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#1e40af;">Address: ${meetingLinkOrAddress}</p>`;

        const notesHTML = notes ? `
            <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">📝 Additional Notes:</p>
                <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${notes}</p>
            </div>` : '';

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Employer Portal</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">🔄</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Rescheduled</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${employerName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">The interview with <strong>${candidateName}</strong> for the <strong>${jobDesignation}</strong> position has been rescheduled by our MIS team.</p>
<div style="background-color:#dbeafe;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e40af;">📅 New Interview Details:</p>
<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>Date:</strong> ${formatUTCDate(newDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0 0 16px;font-size:14px;color:#1e40af;"><strong>Time:</strong> ${formatUTCTime(newDate, newTime, "HH:mm", recipientTimezone)}</p>
${locationHTML}
</div>
${notesHTML}
<div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#166534;"><strong>💼 Note:</strong> The candidate has been notified about the updated schedule.</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${loginRedirectUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Interview Details</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#3b82f6;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: employerEmail,
            subject: `Interview Rescheduled - ${candidateName} - JobGenie`,
            html,
        });

        if (error) {
            console.error("MIS reschedule employer email error:", error);
            return { success: false, error: "Failed to send reschedule notification" };
        }

        console.log(`[EMAIL] MIS reschedule notification sent to employer ${employerEmail}`);
        return { success: true };
    } catch (error) {
        console.error("MIS reschedule employer email error:", error);
        return { success: false, error: "Failed to send reschedule notification" };
    }
}

/**
 * Send round cancellation notification to employer when candidate cancels a round
 */
export async function sendCandidateRoundCancellationEmail(
    employerEmail: string,
    employerName: string,
    candidateName: string,
    jobDesignation: string,
    roundLabel: string,
    interviewDate: string,
    interviewTime: string,
    cancellationReason: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Candidate Round Cancellation Email`);
            console.log(`====================================`);
            console.log(`To: ${employerEmail}`);
            console.log(`Employer: ${employerName}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Round: ${roundLabel}`);
            console.log(`Reason: ${cancellationReason}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Employer Portal</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#fee2e2 0%,#fecaca 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">❌</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Round Canceled</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${employerName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;"><strong>${candidateName}</strong> has canceled the <strong>${roundLabel}</strong> interview for the <strong>${jobDesignation}</strong> position.</p>
<div style="background-color:#fee2e2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#991b1b;">Canceled Round Details:</p>
<p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Round:</strong> ${roundLabel}</p>
<p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Date:</strong> ${formatUTCDate(interviewDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0;font-size:14px;color:#991b1b;"><strong>Time:</strong> ${formatUTCTime(interviewDate, interviewTime, "HH:mm", recipientTimezone)}</p>
</div>
<div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">Reason:</p>
<p style="margin:0;font-size:15px;color:#78350f;line-height:1.6;">${cancellationReason}</p>
</div>
<div style="background-color:#dbeafe;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#1e40af;"><strong>💡 Next Steps:</strong> Our MIS team may contact both parties to arrange a new interview date.</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${baseUrl}/employer/invitations" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Invitations</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#22c55e;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: employerEmail,
            subject: `Interview Round Canceled by Candidate - ${roundLabel} - JobGenie`,
            html,
        });

        if (error) {
            console.error("Candidate round cancellation email error:", error);
            return { success: false, error: "Failed to send cancellation email" };
        }

        console.log(`[EMAIL] Candidate round cancellation email sent to employer ${employerEmail}`);
        return { success: true };
    } catch (error) {
        console.error("Candidate round cancellation email error:", error);
        return { success: false, error: "Failed to send cancellation email" };
    }
}

/**
 * Send round cancellation notification to candidate when employer cancels a round
 */
export async function sendEmployerRoundCancellationEmail(
    candidateEmail: string,
    candidateName: string,
    companyName: string,
    jobDesignation: string,
    roundLabel: string,
    interviewDate: string,
    interviewTime: string,
    cancellationReason: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Employer Round Cancellation Email`);
            console.log(`====================================`);
            console.log(`To: ${candidateEmail}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Company: ${companyName}`);
            console.log(`Round: ${roundLabel}`);
            console.log(`Reason: ${cancellationReason}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Find Your Perfect Career Match</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#fee2e2 0%,#fecaca 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">❌</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Round Canceled</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${candidateName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">We're sorry to inform you that <strong>${companyName}</strong> has canceled the <strong>${roundLabel}</strong> interview for the <strong>${jobDesignation}</strong> position.</p>
<div style="background-color:#fee2e2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#991b1b;">Canceled Round Details:</p>
<p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Round:</strong> ${roundLabel}</p>
<p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Date:</strong> ${formatUTCDate(interviewDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0;font-size:14px;color:#991b1b;"><strong>Time:</strong> ${formatUTCTime(interviewDate, interviewTime, "HH:mm", recipientTimezone)}</p>
</div>
<div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">Reason:</p>
<p style="margin:0;font-size:15px;color:#78350f;line-height:1.6;">${cancellationReason}</p>
</div>
<div style="background-color:#dbeafe;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#1e40af;"><strong>💙 We're Here for You:</strong> Our MIS team may contact both parties to arrange a new interview date. Keep exploring other opportunities on JobGenie.</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${baseUrl}/candidate/invitations" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Invitations</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#22c55e;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: candidateEmail,
            subject: `Interview Round Canceled - ${roundLabel} - JobGenie`,
            html,
        });

        if (error) {
            console.error("Employer round cancellation email error:", error);
            return { success: false, error: "Failed to send cancellation email" };
        }

        console.log(`[EMAIL] Employer round cancellation email sent to candidate ${candidateEmail}`);
        return { success: true };
    } catch (error) {
        console.error("Employer round cancellation email error:", error);
        return { success: false, error: "Failed to send cancellation email" };
    }
}

/**
 * Send MIS round reschedule notification to candidate
 */
export async function sendMISRoundRescheduleNotificationToCandidate(
    candidateEmail: string,
    candidateName: string,
    companyName: string,
    jobDesignation: string,
    roundLabel: string,
    newDate: string,
    newTime: string,
    interviewMode: string,
    meetingLinkOrAddress: string,
    invitationId: string,
    notes: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] MIS Round Reschedule Notification (Candidate)`);
            console.log(`====================================`);
            console.log(`To: ${candidateEmail}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Company: ${companyName}`);
            console.log(`Round: ${roundLabel}`);
            console.log(`New Date: ${newDate} at ${newTime}`);
            console.log(`Invitation Link: ${baseUrl}/login?returnUrl=${encodeURIComponent(`/candidate/invitations/${invitationId}`)}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        const invitationDetailUrl = `${baseUrl}/candidate/invitations/${invitationId}`;
        const loginRedirectUrl = `${baseUrl}/login?returnUrl=${encodeURIComponent(invitationDetailUrl)}`;

        const locationHTML = interviewMode === 'online'
            ? `<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>📹 Online Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#1e40af;">Meeting Link: <a href="${meetingLinkOrAddress}" style="color:#3b82f6;">${meetingLinkOrAddress}</a></p>`
            : `<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>📍 Physical Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#1e40af;">Address: ${meetingLinkOrAddress}</p>`;

        const notesHTML = notes ? `
            <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">📝 Additional Notes:</p>
                <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${notes}</p>
            </div>` : '';

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Find Your Perfect Career Match</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">🔄</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Round Rescheduled</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${candidateName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Your <strong>${roundLabel}</strong> with <strong>${companyName}</strong> for the <strong>${jobDesignation}</strong> position has been rescheduled by our MIS team.</p>
<div style="background-color:#dbeafe;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e40af;">📅 New Round Details:</p>
<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>Round:</strong> ${roundLabel}</p>
<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>Date:</strong> ${formatUTCDate(newDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0 0 16px;font-size:14px;color:#1e40af;"><strong>Time:</strong> ${formatUTCTime(newDate, newTime, "HH:mm", recipientTimezone)}</p>
${locationHTML}
</div>
${notesHTML}
<div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#166534;"><strong>💡 Tip:</strong> Please review the updated details and prepare accordingly. Good luck!</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${loginRedirectUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Interview Details</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#3b82f6;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: candidateEmail,
            subject: `Interview Round Rescheduled - ${roundLabel} - JobGenie`,
            html,
        });

        if (error) {
            console.error("MIS round reschedule candidate email error:", error);
            return { success: false, error: "Failed to send reschedule notification" };
        }

        console.log(`[EMAIL] MIS round reschedule notification sent to candidate ${candidateEmail}`);
        return { success: true };
    } catch (error) {
        console.error("MIS round reschedule candidate email error:", error);
        return { success: false, error: "Failed to send reschedule notification" };
    }
}

/**
 * Send MIS round reschedule notification to employer
 */
export async function sendMISRoundRescheduleNotificationToEmployer(
    employerEmail: string,
    employerName: string,
    candidateName: string,
    jobDesignation: string,
    roundLabel: string,
    newDate: string,
    newTime: string,
    interviewMode: string,
    meetingLinkOrAddress: string,
    invitationId: string,
    notes: string,
    recipientTimezone?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();

        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] MIS Round Reschedule Notification (Employer)`);
            console.log(`====================================`);
            console.log(`To: ${employerEmail}`);
            console.log(`Employer: ${employerName}`);
            console.log(`Candidate: ${candidateName}`);
            console.log(`Round: ${roundLabel}`);
            console.log(`New Date: ${newDate} at ${newTime}`);
            console.log(`====================================\n`);
            return { success: true };
        }

        const invitationDetailUrl = `${baseUrl}/employer/invitations`;
        const loginRedirectUrl = `${baseUrl}/login?returnUrl=${encodeURIComponent(invitationDetailUrl)}`;

        const locationHTML = interviewMode === 'online'
            ? `<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>📹 Online Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#1e40af;">Meeting Link: <a href="${meetingLinkOrAddress}" style="color:#3b82f6;">${meetingLinkOrAddress}</a></p>`
            : `<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>📍 Physical Interview</strong></p>
               <p style="margin:0;font-size:14px;color:#1e40af;">Address: ${meetingLinkOrAddress}</p>`;

        const notesHTML = notes ? `
            <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">📝 Additional Notes:</p>
                <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${notes}</p>
            </div>` : '';

        const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Employer Portal</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">🔄</span>
</div></div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Interview Round Rescheduled</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${employerName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">The <strong>${roundLabel}</strong> with <strong>${candidateName}</strong> for the <strong>${jobDesignation}</strong> position has been rescheduled by our MIS team.</p>
<div style="background-color:#dbeafe;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e40af;">📅 New Round Details:</p>
<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>Round:</strong> ${roundLabel}</p>
<p style="margin:0 0 8px;font-size:14px;color:#1e40af;"><strong>Date:</strong> ${formatUTCDate(newDate, "EEEE, MMMM d, yyyy", recipientTimezone)}</p>
<p style="margin:0 0 16px;font-size:14px;color:#1e40af;"><strong>Time:</strong> ${formatUTCTime(newDate, newTime, "HH:mm", recipientTimezone)}</p>
${locationHTML}
</div>
${notesHTML}
<div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#166534;"><strong>💼 Note:</strong> The candidate has been notified about the updated schedule.</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${loginRedirectUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">View Interview Details</a>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#3b82f6;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table></td></tr>
</table></body></html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_JOBS_FROM}>`,
            to: employerEmail,
            subject: `Interview Round Rescheduled - ${candidateName} - ${roundLabel} - JobGenie`,
            html,
        });

        if (error) {
            console.error("MIS round reschedule employer email error:", error);
            return { success: false, error: "Failed to send reschedule notification" };
        }

        console.log(`[EMAIL] MIS round reschedule notification sent to employer ${employerEmail}`);
        return { success: true };
    } catch (error) {
        console.error("MIS round reschedule employer email error:", error);
        return { success: false, error: "Failed to send reschedule notification" };
    }
}

