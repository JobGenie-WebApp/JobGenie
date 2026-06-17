import { resend, EMAIL_JOBS_FROM } from "./resend";
import { getBaseUrl } from "./email";

/**
 * Generate approval email template for employers
 */
function getEmployerApprovalEmailTemplate(
    companyName: string,
    firstName: string,
    loginUrl: string
): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Company Profile Approved - JobGenie</title>
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
                                Employer Portal
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
                                    <span style="font-size: 40px;">🏢</span>
                                </div>
                            </div>
                            
                            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1f2937; text-align: center;">
                                Company Profile Approved
                            </h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Hi <strong>${firstName}</strong>,
                            </p>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Excellent news! The profile for <strong>${companyName}</strong> has been <strong>approved</strong> by our MIS team.
                            </p>
                            
                            <!-- Success Notice -->
                            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 14px; color: #166534;">
                                    <strong>✓ Full Access Granted:</strong> You can now post jobs, view applications, and manage your recruitment team.
                                </p>
                            </div>
                            
                            <!-- Login Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
                                    Access Employer Dashboard
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
 * Generate rejection email template for employers
 */
function getEmployerRejectionEmailTemplate(
    companyName: string,
    firstName: string,
    rejectionReason: string,
    loginUrl: string
): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Company Profile Requires Updates - JobGenie</title>
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
                                Employer Portal
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
                                    <span style="font-size: 40px;">⚠️</span>
                                </div>
                            </div>
                            
                            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1f2937; text-align: center;">
                                Profile Needs Attention
                            </h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Hi <strong>${firstName}</strong>,
                            </p>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Our MIS team has reviewed the profile for <strong>${companyName}</strong> and found that it requires some updates before we can approve it.
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
                                    <strong>💡 Next Steps:</strong> Please log in and update your company profile based on the feedback above. We'll review it again promptly.
                                </p>
                            </div>
                            
                            <!-- Login Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">
                                    Update Company Profile
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
 * Send approval email to employer
 */
export async function sendEmployerApprovalEmail(
    email: string,
    companyName: string,
    firstName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();
        const loginUrl = `${baseUrl}/employer/login`;

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Employer Approval Email`);
            console.log(`====================================`);
            console.log(`To: ${email}`);
            console.log(`Name: ${firstName}`);
            console.log(`Company: ${companyName}`);
            console.log(`Login URL: ${loginUrl}`);
            console.log(`====================================\n`);
            console.log("[DEV] Resend not configured. Set RESEND_API_KEY in .env to send actual emails.");
            return { success: true };
        }

        const { error } = await resend.emails.send({
            from: `JobGenie Employer Support <${EMAIL_JOBS_FROM}>`,
            to: email,
            subject: "🎉 Company Profile Approved - JobGenie",
            html: getEmployerApprovalEmailTemplate(companyName, firstName, loginUrl),
        });

        if (error) {
            console.error("Employer approval email sending error:", error);
            return {
                success: false,
                error: "Failed to send employer approval email",
            };
        }

        console.log(`[EMAIL] Employer approval email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error("Employer approval email sending error:", error);
        return {
            success: false,
            error: "Failed to send employer approval email",
        };
    }
}

/**
 * Send rejection email to employer
 */
export async function sendEmployerRejectionEmail(
    email: string,
    companyName: string,
    firstName: string,
    rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = getBaseUrl();
        const loginUrl = `${baseUrl}/employer/login`;

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.log(`\n====================================`);
            console.log(`[DEV] Employer Rejection Email`);
            console.log(`====================================`);
            console.log(`To: ${email}`);
            console.log(`Name: ${firstName}`);
            console.log(`Company: ${companyName}`);
            console.log(`Rejection Reason: ${rejectionReason}`);
            console.log(`Login URL: ${loginUrl}`);
            console.log(`====================================\n`);
            console.log("[DEV] Resend not configured. Set RESEND_API_KEY in .env to send actual emails.");
            return { success: true };
        }

        const { error } = await resend.emails.send({
            from: `JobGenie Employer Support <${EMAIL_JOBS_FROM}>`,
            to: email,
            subject: "Action Required: Company Profile Update - JobGenie",
            html: getEmployerRejectionEmailTemplate(companyName, firstName, rejectionReason, loginUrl),
        });

        if (error) {
            console.error("Employer rejection email sending error:", error);
            return {
                success: false,
                error: "Failed to send employer rejection email",
            };
        }

        console.log(`[EMAIL] Employer rejection email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error("Employer rejection email sending error:", error);
        return {
            success: false,
            error: "Failed to send employer rejection email",
        };
    }
}
