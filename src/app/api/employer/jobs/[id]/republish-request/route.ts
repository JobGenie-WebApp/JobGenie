import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// POST /api/employer/jobs/[id]/republish-request
// Body: multipart/form-data — file (corrected document), note (optional)
// The employer submits a corrected document against an MIS compliance pause and
// requests republication. The job stays paused & locked — only MIS can republish.
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: employer } = await admin.from("employers").select("id, company_id").eq("user_id", user.id).single();
        if (!employer) return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });

        const { id } = await params;
        const { data: job } = await admin
            .from("jobs")
            .select("id, status, job_title, company_id, mis_pause_locked, company:companies(company_name)")
            .eq("id", id)
            .eq("company_id", employer.company_id)
            .eq("is_deleted", false)
            .single();

        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
        if (!job.mis_pause_locked) {
            return NextResponse.json({ error: "This job is not pending a compliance document request" }, { status: 400 });
        }

        const { data: flag } = await admin
            .from("job_compliance_flags")
            .select("id, status")
            .eq("job_id", id)
            .in("status", ["paused", "resubmitted"])
            .order("flagged_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (!flag) return NextResponse.json({ error: "No open compliance flag for this job" }, { status: 404 });

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const note = (formData.get("note") as string | null)?.trim() || null;
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Only PDF, JPG, PNG, or WEBP files are allowed" }, { status: 400 });
        }
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
        }

        // Upload to the payment-proofs bucket (company_id first folder satisfies storage RLS).
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("bucket", "payment-proofs");
        uploadFormData.append("folder", `${employer.company_id}/compliance/${id}`);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const uploadRes = await fetch(`${baseUrl}/api/upload`, {
            method: "POST",
            body: uploadFormData,
            headers: { Cookie: request.headers.get("Cookie") ?? "" },
        });
        if (!uploadRes.ok) {
            const errBody = await uploadRes.json().catch(() => ({}));
            return NextResponse.json({ error: errBody.error ?? "File upload failed" }, { status: 500 });
        }
        const { url: fileUrl, fileName: filePath } = await uploadRes.json();

        const now = new Date().toISOString();
        await admin.from("job_compliance_flags").update({
            status: "resubmitted",
            employer_doc_url: fileUrl,
            employer_doc_path: filePath,
            employer_doc_name: file.name,
            employer_doc_type: file.type,
            employer_note: note,
            resubmitted_at: now,
        }).eq("id", flag.id);

        // Notify all MIS users to review the resubmission.
        const companyName = (job.company as unknown as { company_name?: string } | null)?.company_name ?? "A company";
        const { data: misUsers } = await admin.from("mis_user").select("user_id");
        if (misUsers?.length) {
            await admin.from("notifications").insert(misUsers.map((u) => ({
                user_id: u.user_id,
                type: "job_compliance_resubmitted",
                title: "Compliance Document Resubmitted",
                body: `${companyName} resubmitted a document for "${job.job_title}" and requested republication. Please review.`,
                data: { job_id: id, compliance_flag_id: flag.id },
            })));
        }

        await logBusiness("job_compliance_resubmitted", user.id, "employer", "job", id, { compliance_flag_id: flag.id });

        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/employer/jobs/[id]/republish-request:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
