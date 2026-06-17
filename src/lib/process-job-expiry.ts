import { createAdminClient } from "@/lib/supabase/admin";
import { sendJobExpiredEmail } from "@/lib/job-advertisement-emails";

interface ExpiryResult {
    expired_count: number;
    notified_count: number;
}

/**
 * Finds all published/paused jobs whose expires_at has passed and marks them expired.
 * Notifies affected employers via notification + email.
 */
export async function processJobExpiry(): Promise<ExpiryResult> {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Fetch expired jobs with employer contact info
    const { data: jobs, error } = await admin
        .from("jobs")
        .select(`
            id,
            job_title,
            employer:employers!jobs_employer_id_fkey(
                user_id,
                first_name,
                email
            ),
            company:companies!jobs_company_id_fkey(company_name)
        `)
        .in("status", ["published", "paused"])
        .eq("is_deleted", false)
        .lt("expires_at", now);

    if (error || !jobs || jobs.length === 0) {
        return { expired_count: 0, notified_count: 0 };
    }

    const jobIds = jobs.map((j) => j.id);

    // Bulk update to expired
    await admin
        .from("jobs")
        .update({ status: "expired", updated_at: now })
        .in("id", jobIds);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    let notifiedCount = 0;

    for (const job of jobs) {
        const employerArr = job.employer as unknown as { user_id: string; first_name: string; email: string }[];
        const employer = Array.isArray(employerArr) ? employerArr[0] : null;
        if (!employer) continue;

        const extendUrl = `${baseUrl}/employer/jobs/${job.id}`;

        // In-app notification
        await admin.from("notifications").insert({
            user_id: employer.user_id,
            type: "job_expired",
            title: "Job Advertisement Expired",
            body: `Your job advertisement "${job.job_title}" has expired. Extend it to continue receiving applications.`,
            data: { job_id: job.id, job_title: job.job_title, extend_url: extendUrl },
        });

        // Email notification
        if (employer.email) {
            await sendJobExpiredEmail({
                to: employer.email,
                firstName: employer.first_name,
                jobTitle: job.job_title,
                extendUrl,
            });
        }

        notifiedCount++;
    }

    return { expired_count: jobs.length, notified_count: notifiedCount };
}
