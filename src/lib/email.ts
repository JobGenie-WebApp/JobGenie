import { resend, EMAIL_FROM } from "./resend";

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate verification code expiry time (15 minutes from now) as a UTC ISO string.
 */
export function getVerificationExpiry(): { isoString: string; timestamp: number } {
    const expiryDate = new Date(Date.now() + 15 * 60 * 1000);
    return {
        isoString: expiryDate.toISOString(),
        timestamp: expiryDate.getTime(),
    };
}

/**
 * Generate JobGenie themed HTML email template
 */
function getVerificationEmailTemplate(firstName: string, code: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - JobGenie</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                                JobGenie
                            </h1>
                            <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                                Find Your Perfect Career Match
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1f2937;">
                                Verify Your Email
                            </h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Hi <strong>${firstName}</strong>,
                            </p>
                            <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Thank you for registering with JobGenie! Please use the verification code below to complete your registration:
                            </p>
                            
                            <!-- Verification Code Box -->
                            <div style="text-align: center; margin: 32px 0;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 24px 48px;">
                                    <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #16a34a; text-transform: uppercase; letter-spacing: 1px;">
                                        Your Verification Code
                                    </p>
                                    <p style="margin: 0; font-size: 40px; font-weight: 700; color: #15803d; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                        ${code}
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Expiry Notice -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 14px; color: #92400e;">
                                    <strong>⏰ Important:</strong> This code will expire in <strong>15 minutes</strong>.
                                </p>
                            </div>
                            
                            <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                If you didn't create an account with JobGenie, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                                Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color: #22c55e; text-decoration: none;">support@jobgenie.biz</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} JobGenie. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Security Notice -->
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 24px;">
                    <tr>
                        <td style="text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                                🔒 This is an automated message from JobGenie. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Send verification email using Resend
 */
export async function sendVerificationEmail(
    email: string,
    code: string,
    firstName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log(`[DEV] Verification code for ${email}: ${code}`);
            console.log("[DEV] Resend not configured. Set RESEND_API_KEY in .env to send actual emails.");
            return { success: true };
        }

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_FROM}>`,
            to: email,
            subject: "Verify Your Email - JobGenie",
            html: getVerificationEmailTemplate(firstName, code),
        });

        if (error) {
            console.error("Email sending error:", error);
            return {
                success: false,
                error: "Failed to send verification email",
            };
        }

        console.log(`[EMAIL] Verification email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error("Email sending error:", error);
        return {
            success: false,
            error: "Failed to send verification email",
        };
    }
}

/**
 * Mask email for display (e.g., j***@example.com)
 */
export function maskEmail(email: string): string {
    const [localPart, domain] = email.split("@");
    if (!domain) return email;
    if (localPart.length <= 2) {
        return `${localPart[0]}***@${domain}`;
    }
    return `${localPart[0]}${localPart[1]}***@${domain}`;
}

// ============================================
// MIS INVITATION SYSTEM
// ============================================

/**
 * Generate invitation token expiry (N days from now) as a UTC ISO string.
 * Column is timestamptz — always store UTC; compare with `new Date(stored).getTime() < Date.now()`.
 */
export function getInvitationExpiry(): { isoString: string; timestamp: number } {
    const expiryDays = parseInt(process.env.MIS_INVITATION_EXPIRY_DAYS || "7");
    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    return {
        isoString: expiryDate.toISOString(),
        timestamp: expiryDate.getTime(),
    };
}

/**
 * Generate invitation token (64 characters, URL-safe)
 */
export function generateInvitationToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Get base URL for the application (supports both localhost and production)
 */
export function getBaseUrl(): string {
    // Production URL from environment variable
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Localhost fallback
    return 'http://localhost:3000';
}

/**
 * Send MIS invitation email with temporary password
 */
export async function sendMISInvitationEmail(
    email: string,
    firstName: string,
    token: string,
    tempPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();
        const setupUrl = `${baseUrl}/mis/setup-password?token=${token}`;
        const expiryDays = parseInt(process.env.MIS_INVITATION_EXPIRY_DAYS || "7");

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] MIS Invitation Email`);
            console.log(`====================================`);
            console.log(`To: ${email}`);
            console.log(`Name: ${firstName}`);
            console.log(`Setup URL: ${setupUrl}`);
            console.log(`Token: ${token}`);
            console.log(`Temporary Password: ${tempPassword}`);
            console.log(`Expires in: ${expiryDays} days`);
            console.log(`====================================\n`);
            console.log("[DEV] Resend not configured. Set RESEND_API_KEY in .env to send actual emails.");
            return { success: true };
        }

        const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Management Information System</p>
</td></tr>
<tr><td style="padding:40px;">
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;">You've Been Invited!</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${firstName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">You have been invited to join the JobGenie MIS as an administrator.</p>
<div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border:2px solid #f59e0b;border-radius:12px;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#92400e;">🔑 YOUR TEMPORARY PASSWORD</p>
<p style="margin:0;font-size:28px;font-weight:700;color:#78350f;letter-spacing:2px;font-family:'Courier New',monospace;">${tempPassword}</p>
<p style="margin:12px 0 0;font-size:12px;color:#92400e;"><strong>Important:</strong> You will need this password to set up your new password.</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${setupUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">Set Up Your Account</a>
</div>
<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b7280;text-align:center;">Or copy this link: <a href="${setupUrl}" style="color:#3b82f6;">${setupUrl}</a></p>
<div style="background-color:#fee2e2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#991b1b;"><strong>⏰ Important:</strong> This invitation expires in <strong>${expiryDays} days</strong>.</p>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#3b82f6;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie MIS <${EMAIL_FROM}>`,
            to: email,
            subject: "You've been invited to JobGenie MIS",
            html: html,
        });

        if (error) {
            console.error("MIS invitation email error:", error);
            return {
                success: false,
                error: "Failed to send invitation email",
            };
        }

        console.log(`[EMAIL] MIS invitation sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error("MIS invitation email error:", error);
        return {
            success: false,
            error: "Failed to send invitation email",
        };
    }
}

// ============================================
// EMPLOYER INVITATION SYSTEM
// ============================================

/**
 * Send Employer sub-admin invitation email with temporary password
 */
export async function sendEmployerInvitationEmail(
    email: string,
    firstName: string,
    token: string,
    tempPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();
        const setupUrl = `${baseUrl}/employer/setup-password?token=${token}`;
        const expiryDays = parseInt(process.env.MIS_INVITATION_EXPIRY_DAYS || "7");

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Employer Invitation Email`);
            console.log(`====================================`);
            console.log(`To: ${email}`);
            console.log(`Name: ${firstName}`);
            console.log(`Setup URL: ${setupUrl}`);
            console.log(`Token: ${token}`);
            console.log(`Temporary Password: ${tempPassword}`);
            console.log(`Expires in: ${expiryDays} days`);
            console.log(`====================================\n`);
            console.log("[DEV] Resend not configured. Set RESEND_API_KEY in .env to send actual emails.");
            return { success: true };
        }

        const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8f9fa;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 0;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);border-radius:16px 16px 0 0;">
<h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;">JobGenie</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Find Your Perfect Career Match</p>
</td></tr>
<tr><td style="padding:40px;">
<h2 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1f2937;">You've Been Invited!</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">Hi <strong>${firstName}</strong>,</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">You have been invited to join your company's JobGenie employer account as an administrator.</p>
<div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border:2px solid #f59e0b;border-radius:12px;padding:20px;margin:24px 0;">
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#92400e;">🔑 YOUR TEMPORARY PASSWORD</p>
<p style="margin:0;font-size:28px;font-weight:700;color:#78350f;letter-spacing:2px;font-family:'Courier New',monospace;">${tempPassword}</p>
<p style="margin:12px 0 0;font-size:12px;color:#92400e;"><strong>Important:</strong> You will need this password to set up your new password.</p>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${setupUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">Set Up Your Account</a>
</div>
<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b7280;text-align:center;">Or copy this link: <a href="${setupUrl}" style="color:#22c55e;">${setupUrl}</a></p>
<div style="background-color:#fee2e2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="margin:0;font-size:14px;color:#991b1b;"><strong>⏰ Important:</strong> This invitation expires in <strong>${expiryDays} days</strong>.</p>
</div>
</td></tr>
<tr><td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color:#22c55e;">support@jobgenie.biz</a></p>
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobGenie. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

        const { error } = await resend.emails.send({
            from: `JobGenie Employer <${EMAIL_FROM}>`,
            to: email,
            subject: "You've been invited to JobGenie Employer Account",
            html: html,
        });

        if (error) {
            console.error("Employer invitation email error:", error);
            return {
                success: false,
                error: "Failed to send invitation email",
            };
        }

        console.log(`[EMAIL] Employer invitation sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error("Employer invitation email error:", error);
        return {
            success: false,
            error: "Failed to send invitation email",
        };
    }
}

// ============================================
// CANDIDATE APPROVAL/REJECTION EMAILS
// ============================================

/**
 * Generate approval email template for candidates
 */
function getApprovalEmailTemplate(firstName: string, loginUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile Approved - JobGenie</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                                JobGenie
                            </h1>
                            <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                                Find Your Perfect Career Match
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
                                    <span style="font-size: 40px;">🎉</span>
                                </div>
                            </div>
                            
                            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1f2937; text-align: center;">
                                Congratulations! Profile Approved
                            </h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Hi <strong>${firstName}</strong>,
                            </p>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Great news! Your JobGenie profile has been <strong>approved</strong> by our MIS team. You now have full access to all features of the platform.
                            </p>
                            
                            <!-- Success Notice -->
                            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 14px; color: #166534;">
                                    <strong>✓ What's Next:</strong> You can now browse jobs, submit applications, and connect with employers.
                                </p>
                            </div>
                            
                            <!-- Login Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
                                    Login to Your Account
                                </a>
                            </div>
                            
                            <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                                Or copy this link: <a href="${loginUrl}" style="color: #22c55e; word-break: break-all;">${loginUrl}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                                Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color: #22c55e; text-decoration: none;">support@jobgenie.biz</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} JobGenie. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Security Notice -->
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 24px;">
                    <tr>
                        <td style="text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                                🔒 This is an automated message from JobGenie. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Generate rejection email template for candidates
 */
function getRejectionEmailTemplate(firstName: string, rejectionReason: string, loginUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile Requires Updates - JobGenie</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                                JobGenie
                            </h1>
                            <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                                Find Your Perfect Career Match
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
                                    <span style="font-size: 40px;">📝</span>
                                </div>
                            </div>
                            
                            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1f2937; text-align: center;">
                                Profile Needs Improvement
                            </h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Hi <strong>${firstName}</strong>,
                            </p>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Thank you for submitting your profile on JobGenie. Our MIS team has reviewed your profile and found that it requires some updates before approval.
                            </p>
                            
                            <!-- Rejection Reason -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 20px; margin: 24px 0;">
                                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #92400e;">
                                    📌 Feedback from MIS Team:
                                </p>
                                <p style="margin: 0; font-size: 15px; color: #78350f; line-height: 1.6;">
                                    ${rejectionReason}
                                </p>
                            </div>
                            
                            <!-- Action Notice -->
                            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 14px; color: #1e40af;">
                                    <strong>💡 Next Steps:</strong> Please log in and update your profile based on the feedback above. Once updated, our team will review it again.
                                </p>
                            </div>
                            
                            <!-- Login Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">
                                    Update Your Profile
                                </a>
                            </div>
                            
                            <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                                Or copy this link: <a href="${loginUrl}" style="color: #f59e0b; word-break: break-all;">${loginUrl}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                                Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color: #f59e0b; text-decoration: none;">support@jobgenie.biz</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} JobGenie. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Security Notice -->
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 24px;">
                    <tr>
                        <td style="text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                                🔒 This is an automated message from JobGenie. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Send approval email to candidate
 */
export async function sendApprovalEmail(
    email: string,
    firstName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();
        const loginUrl = `${baseUrl}/login`;

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Candidate Approval Email`);
            console.log(`====================================`);
            console.log(`To: ${email}`);
            console.log(`Name: ${firstName}`);
            console.log(`Login URL: ${loginUrl}`);
            console.log(`====================================\n`);
            console.log("[DEV] Resend not configured. Set RESEND_API_KEY in .env to send actual emails.");
            return { success: true };
        }

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_FROM}>`,
            to: email,
            subject: "🎉 Profile Approved - JobGenie",
            html: getApprovalEmailTemplate(firstName, loginUrl),
        });

        if (error) {
            console.error("Approval email sending error:", error);
            return {
                success: false,
                error: "Failed to send approval email",
            };
        }

        console.log(`[EMAIL] Approval email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error("Approval email sending error:", error);
        return {
            success: false,
            error: "Failed to send approval email",
        };
    }
}

/**
 * Send rejection email to candidate
 */
export async function sendRejectionEmail(
    email: string,
    firstName: string,
    rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();
        const loginUrl = `${baseUrl}/login`;

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Candidate Rejection Email`);
            console.log(`====================================`);
            console.log(`To: ${email}`);
            console.log(`Name: ${firstName}`);
            console.log(`Rejection Reason: ${rejectionReason}`);
            console.log(`Login URL: ${loginUrl}`);
            console.log(`====================================\n`);
            console.log("[DEV] Resend not configured. Set RESEND_API_KEY in .env to send actual emails.");
            return { success: true };
        }

        const { error } = await resend.emails.send({
            from: `JobGenie <${EMAIL_FROM}>`,
            to: email,
            subject: "Profile Update Required - JobGenie",
            html: getRejectionEmailTemplate(firstName, rejectionReason, loginUrl),
        });

        if (error) {
            console.error("Rejection email sending error:", error);
            return {
                success: false,
                error: "Failed to send rejection email",
            };
        }

        console.log(`[EMAIL] Rejection email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error("Rejection email sending error:", error);
        return {
            success: false,
            error: "Failed to send rejection email",
        };
    }
}

// ============================================
// PASSWORD RESET EMAILS
// ============================================

/**
 * Generate password reset email HTML template
 */
function getPasswordResetEmailTemplate(firstName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - JobGenie</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                                JobGenie
                            </h1>
                            <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                                Find Your Perfect Career Match
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
                                    <span style="font-size: 40px;">🔑</span>
                                </div>
                            </div>

                            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1f2937; text-align: center;">
                                Reset Your Password
                            </h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Hi <strong>${firstName}</strong>,
                            </p>
                            <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                We received a request to reset your password. Click the button below to create a new password. This link will expire in <strong>1 hour</strong>.
                            </p>

                            <!-- Reset Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
                                    Reset My Password
                                </a>
                            </div>

                            <!-- URL fallback -->
                            <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                                Or copy this link: <a href="${resetUrl}" style="color: #22c55e; word-break: break-all;">${resetUrl}</a>
                            </p>

                            <!-- Expiry & Security Notice -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 14px; color: #92400e;">
                                    <strong>⏰ This link expires in 1 hour.</strong> If you didn&apos;t request a password reset, you can safely ignore this email — your password will not change.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                                Need help? Contact us at <a href="mailto:support@jobgenie.biz" style="color: #22c55e; text-decoration: none;">support@jobgenie.biz</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} JobGenie. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Security Notice -->
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 24px;">
                    <tr>
                        <td style="text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                                🔒 This is an automated message from JobGenie. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Password Reset Email`);
            console.log(`====================================`);
            console.log(`To: ${email}`);
            console.log(`Name: ${firstName}`);
            console.log(`Reset URL: ${resetUrl}`);
            console.log(`Token: ${token}`);
            console.log(`Expires: 1 hour from now`);
            console.log(`====================================\n`);
            console.log("[DEV] Resend not configured. Set RESEND_API_KEY in .env to send actual emails.");
            return { success: true };
        }

        console.log(`[DEBUG] Attempting to send password reset email...`);
        console.log(`[DEBUG] From: JobGenie <${EMAIL_FROM}>`);
        console.log(`[DEBUG] To: ${email}`);
        console.log(`[DEBUG] Resend API Key present: ${!!process.env.RESEND_API_KEY}`);

        const result = await resend.emails.send({
            from: `JobGenie <${EMAIL_FROM}>`,
            to: email,
            subject: "🔑 Reset Your Password - JobGenie",
            html: getPasswordResetEmailTemplate(firstName, resetUrl),
        });

        console.log(`[DEBUG] Resend API response:`, JSON.stringify(result, null, 2));

        if (result.error) {
            console.error("Password reset email error:", result.error);
            return {
                success: false,
                error: "Failed to send password reset email",
            };
        }

        console.log(`[EMAIL] ✅ Password reset email sent successfully to ${email}`);
        console.log(`[EMAIL] Email ID: ${result.data?.id}`);
        return { success: true };
    } catch (error) {
        console.error("Password reset email error:", error);
        return {
            success: false,
            error: "Failed to send password reset email",
        };
    }
}


