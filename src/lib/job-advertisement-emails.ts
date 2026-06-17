import { getResend, EMAIL_JOBS_FROM } from "./resend";

// ============================================
// Shared email header/footer helpers
// ============================================

function emailHeader(title: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - JobGenie</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Employer Portal</p>
</td></tr>
<tr><td style="padding:40px;">`;
}

function emailFooter(): string {
    return `</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#22c55e;text-decoration:none;">support@jobgenie.biz</a>
</p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ============================================
// Email 1: Job published / re-published after extension
// ============================================

interface JobPublishedParams {
    to: string;
    firstName: string;
    jobTitle: string;
    expiresAt: Date;
    jobUrl: string;
}

function getJobPublishedTemplate({ firstName, jobTitle, expiresAt, jobUrl }: JobPublishedParams): string {
    const expiryStr = expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    return `${emailHeader("Job Advertisement Published")}
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">📢</span>
</div>
</div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Your Job Ad is Now Live!</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${firstName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">
Great news! Your payment has been verified and your job advertisement <strong>"${jobTitle}"</strong> is now published and visible to candidates.
</p>
<div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#166534;">
<strong>📅 Advertisement Validity:</strong> This ad will remain active until <strong>${expiryStr}</strong>. You can extend it before it expires.
</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${jobUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">
View Job Advertisement
</a>
</div>
${emailFooter()}`;
}

export async function sendJobPublishedEmail(params: JobPublishedParams): Promise<void> {
    try {
        const resend = getResend();
        await resend.emails.send({
            from: EMAIL_JOBS_FROM,
            to: params.to,
            subject: `Your Job Ad "${params.jobTitle}" is Now Live - JobGenie`,
            html: getJobPublishedTemplate(params),
        });
    } catch (err) {
        console.error("[job-advertisement-emails] sendJobPublishedEmail failed:", err);
    }
}

// ============================================
// Email 2: Payment proof rejected for job ad
// ============================================

interface PaymentRejectedJobParams {
    to: string;
    firstName: string;
    jobTitle: string;
    reason?: string;
}

function getPaymentRejectedJobTemplate({ firstName, jobTitle, reason }: PaymentRejectedJobParams): string {
    return `${emailHeader("Payment Proof Rejected")}
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">❌</span>
</div>
</div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Payment Proof Rejected</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${firstName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">
Unfortunately, your payment proof for the job advertisement <strong>"${jobTitle}"</strong> has been rejected by our team.
</p>
${reason ? `<div style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#991b1b;"><strong>Reason:</strong> ${reason}</p>
</div>` : ""}
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">
Please log in to the Employer Portal, navigate to <strong>Payments</strong>, and re-upload a valid payment proof to proceed.
</p>
${emailFooter()}`;
}

export async function sendPaymentRejectedJobEmail(params: PaymentRejectedJobParams): Promise<void> {
    try {
        const resend = getResend();
        await resend.emails.send({
            from: EMAIL_JOBS_FROM,
            to: params.to,
            subject: `Payment Proof Rejected for "${params.jobTitle}" - Action Required`,
            html: getPaymentRejectedJobTemplate(params),
        });
    } catch (err) {
        console.error("[job-advertisement-emails] sendPaymentRejectedJobEmail failed:", err);
    }
}

// ============================================
// Email 3: Job ad expired
// ============================================

interface JobExpiredParams {
    to: string;
    firstName: string;
    jobTitle: string;
    extendUrl: string;
}

function getJobExpiredTemplate({ firstName, jobTitle, extendUrl }: JobExpiredParams): string {
    return `${emailHeader("Job Advertisement Expired")}
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">⏰</span>
</div>
</div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Your Job Ad Has Expired</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${firstName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">
Your job advertisement <strong>"${jobTitle}"</strong> has expired and is no longer visible to candidates.
</p>
<div style="background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#92400e;">
<strong>Want to continue receiving applications?</strong> Extend your ad to make it live again.
</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${extendUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">
Extend Advertisement
</a>
</div>
${emailFooter()}`;
}

export async function sendJobExpiredEmail(params: JobExpiredParams): Promise<void> {
    try {
        const resend = getResend();
        await resend.emails.send({
            from: EMAIL_JOBS_FROM,
            to: params.to,
            subject: `Your Job Ad "${params.jobTitle}" Has Expired - Extend Now`,
            html: getJobExpiredTemplate(params),
        });
    } catch (err) {
        console.error("[job-advertisement-emails] sendJobExpiredEmail failed:", err);
    }
}

// ============================================
// Email 4: Application confirmation to candidate
// ============================================

interface ApplicationReceivedParams {
    to: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
    applicationsUrl: string;
}

function getApplicationReceivedTemplate({ candidateName, jobTitle, companyName, applicationsUrl }: ApplicationReceivedParams): string {
    return `${emailHeader("Application Submitted")}
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">✅</span>
</div>
</div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">Application Submitted!</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${candidateName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">
Your application for <strong>"${jobTitle}"</strong> at <strong>${companyName}</strong> has been successfully submitted.
</p>
<div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#166534;">
We'll notify you once the employer reviews your application.
</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${applicationsUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">
View My Applications
</a>
</div>
${emailFooter()}`;
}

export async function sendApplicationReceivedEmail(params: ApplicationReceivedParams): Promise<void> {
    try {
        const resend = getResend();
        await resend.emails.send({
            from: EMAIL_JOBS_FROM,
            to: params.to,
            subject: `Application Submitted for "${params.jobTitle}" - JobGenie`,
            html: getApplicationReceivedTemplate(params),
        });
    } catch (err) {
        console.error("[job-advertisement-emails] sendApplicationReceivedEmail failed:", err);
    }
}

// ============================================
// Email 5: New application notification to employer
// ============================================

interface NewApplicationParams {
    to: string;
    employerName: string;
    jobTitle: string;
    candidateName: string;
    applicationUrl: string;
}

function getNewApplicationTemplate({ employerName, jobTitle, candidateName, applicationUrl }: NewApplicationParams): string {
    return `${emailHeader("New Application Received")}
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-radius:50%;width:80px;height:80px;line-height:80px;">
<span style="font-size:40px;">📝</span>
</div>
</div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;text-align:center;">New Application Received</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${employerName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">
<strong>${candidateName}</strong> has applied for your job advertisement <strong>"${jobTitle}"</strong>.
</p>
<div style="text-align:center;margin:32px 0;">
<a href="${applicationUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">
Review Application
</a>
</div>
${emailFooter()}`;
}

export async function sendNewApplicationEmail(params: NewApplicationParams): Promise<void> {
    try {
        const resend = getResend();
        await resend.emails.send({
            from: EMAIL_JOBS_FROM,
            to: params.to,
            subject: `New Application for "${params.jobTitle}" from ${params.candidateName} - JobGenie`,
            html: getNewApplicationTemplate(params),
        });
    } catch (err) {
        console.error("[job-advertisement-emails] sendNewApplicationEmail failed:", err);
    }
}
