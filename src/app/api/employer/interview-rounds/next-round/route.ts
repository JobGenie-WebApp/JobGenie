import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { sendInterviewInvitationEmail } from "@/lib/interview-emails";
import { getUserTimezoneByEmail } from "@/lib/user-timezone";
import { validateUpload } from "@/lib/storage";

const ASSESSMENT_BUCKET = "assessment-attachments";
const MAX_ASSESSMENT_FILE_SIZE = 10 * 1024 * 1024;
const ASSESSMENT_FILE_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
];

// POST /api/employer/interview-rounds/next-round
// Create the next interview round after a candidate has been advanced
export async function POST(request: Request) {
    try {
        const authClient = await createClient();
        const contentType = request.headers.get("content-type") || "";
        let body: Record<string, unknown>;
        let assessmentAttachment: File | null = null;

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const payload = formData.get("payload");
            if (typeof payload !== "string") {
                return NextResponse.json({ success: false, error: "Round details are required" }, { status: 400 });
            }
            try {
                body = JSON.parse(payload) as Record<string, unknown>;
            } catch {
                return NextResponse.json({ success: false, error: "Invalid round details" }, { status: 400 });
            }
            const attachment = formData.get("assessment_attachment");
            assessmentAttachment = attachment instanceof File && attachment.size > 0 ? attachment : null;
        } else {
            body = await request.json() as Record<string, unknown>;
        }

        const {
            previous_round_id,
            round_label,
            interview_mode,
            meeting_link,
            interview_address,
            map_link,
            time_slots,
            assessment_delivery_mode,
            assessment_deadline,
            assessment_start_at,
            assessment_end_at,
            assessment_link,
        } = body;

        const isAssessment = interview_mode === "assessment";
        const isPhysical = interview_mode === "physical" || (isAssessment && assessment_delivery_mode === "physical");

        // Validation
        if (typeof previous_round_id !== "string" || !previous_round_id) {
            return NextResponse.json(
                { success: false, error: "Previous round ID is required" },
                { status: 400 }
            );
        }

        if (!["online", "physical", "assessment"].includes(String(interview_mode))) {
            return NextResponse.json({ success: false, error: "Invalid interview mode" }, { status: 400 });
        }

        if (!isAssessment && (!Array.isArray(time_slots) || time_slots.length === 0 || time_slots.length > 3)) {
            return NextResponse.json(
                { success: false, error: "Invalid time slots (must be 1-3)" },
                { status: 400 }
            );
        }

        // Validate time slots
        for (const slot of Array.isArray(time_slots) ? time_slots : []) {
            if (!slot || typeof slot !== "object") {
                return NextResponse.json(
                    { success: false, error: "Incomplete time slot data" },
                    { status: 400 }
                );
            }
            const value = slot as Record<string, unknown>;
            if (
                typeof value.date !== "string" || !value.date
                || typeof value.time !== "string" || !value.time
                || typeof value.order !== "number" || value.order < 1
            ) {
                return NextResponse.json(
                    { success: false, error: "Incomplete time slot data" },
                    { status: 400 }
                );
            }
        }

        if (isPhysical && (typeof interview_address !== "string" || !interview_address.trim())) {
            return NextResponse.json({ success: false, error: "A physical address is required" }, { status: 400 });
        }

        for (const [label, value] of [["Meeting link", meeting_link], ["Map link", map_link], ["Assessment link", assessment_link]] as const) {
            if (value && (typeof value !== "string" || !isHttpUrl(value))) {
                return NextResponse.json({ success: false, error: `${label} must be a valid http(s) URL` }, { status: 400 });
            }
        }

        let parsedAssessmentDeadline: string | null = null;
        let parsedAssessmentStartAt: string | null = null;
        let parsedAssessmentEndAt: string | null = null;
        if (isAssessment) {
            if (assessment_delivery_mode !== "online" && assessment_delivery_mode !== "physical") {
                return NextResponse.json({ success: false, error: "Assessment delivery mode is required" }, { status: 400 });
            }
            if (assessment_delivery_mode === "online") {
                const deadline = new Date(String(assessment_deadline || ""));
                if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
                    return NextResponse.json({ success: false, error: "Assessment deadline must be in the future" }, { status: 400 });
                }
                parsedAssessmentDeadline = deadline.toISOString();
            } else {
                const startAt = new Date(String(assessment_start_at || ""));
                const endAt = new Date(String(assessment_end_at || ""));
                if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
                    return NextResponse.json({ success: false, error: "Assessment start time must be in the future" }, { status: 400 });
                }
                if (Number.isNaN(endAt.getTime()) || endAt <= startAt) {
                    return NextResponse.json({ success: false, error: "Assessment end time must be after the start time" }, { status: 400 });
                }
                parsedAssessmentStartAt = startAt.toISOString();
                parsedAssessmentEndAt = endAt.toISOString();
            }
            if (assessmentAttachment) {
                try {
                    validateUpload(assessmentAttachment, ASSESSMENT_FILE_TYPES, MAX_ASSESSMENT_FILE_SIZE);
                } catch (error) {
                    return NextResponse.json(
                        { success: false, error: error instanceof Error ? error.message : "Invalid assessment attachment" },
                        { status: 400 },
                    );
                }
            }
        } else if (assessmentAttachment) {
            return NextResponse.json({ success: false, error: "Attachments are only supported for assessment rounds" }, { status: 400 });
        }

        // Get the current user
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();

        // Get employer record
        const { data: employer, error: employerError } = await supabase
            .from('employers')
            .select('id, company_id, first_name, last_name')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        // Get the previous round and verify permissions
        const { data: previousRound, error: roundError } = await supabase
            .from('interview_rounds')
            .select(`
                id,
                invitation_id,
                round_number,
                outcome,
                invitation:job_invitations!inner(
                    id,
                    company_id,
                    candidate_id,
                    industry,
                    job_designation,
                    current_round_number,
                    pipeline_status,
                    candidate:candidates(
                        first_name,
                        last_name,
                        email
                    )
                )
            `)
            .eq('id', previous_round_id)
            .single();

        if (roundError || !previousRound) {
            return NextResponse.json(
                { success: false, error: "Previous interview round not found" },
                { status: 404 }
            );
        }

        const invitation = previousRound.invitation as unknown as { id: string; company_id: string; candidate_id: string; industry: string; job_designation: string; current_round_number: number; pipeline_status: string; candidate: { first_name: string; last_name: string; email: string }[] };

        // Verify the round belongs to this company
        if (invitation.company_id !== employer.company_id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized access to this interview" },
                { status: 403 }
            );
        }

        // Verify the previous round outcome is 'advance'
        if (previousRound.outcome !== 'advance') {
            return NextResponse.json(
                { success: false, error: "Can only create next round when previous round outcome is 'advance'" },
                { status: 400 }
            );
        }

        // Check if next round already exists
        const nextRoundNumber = previousRound.round_number + 1;
        const { data: existingRound } = await supabase
            .from('interview_rounds')
            .select('id')
            .eq('invitation_id', invitation.id)
            .eq('round_number', nextRoundNumber)
            .maybeSingle();

        if (existingRound) {
            return NextResponse.json(
                { success: false, error: "Next round already exists" },
                { status: 409 }
            );
        }

        const typedTimeSlots = Array.isArray(time_slots) ? time_slots as { date: string; time: string; order: number }[] : [];
        const alternativeDates = isAssessment ? [] : calculateAlternativeDatesArray(typedTimeSlots);
        let assessmentAttachmentPath: string | null = null;
        let assessmentAttachmentName: string | null = null;

        if (isAssessment && assessmentAttachment) {
            const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
            if (bucketListError) {
                console.error("Error listing assessment storage buckets:", bucketListError);
                return NextResponse.json({ success: false, error: "Failed to prepare attachment storage" }, { status: 500 });
            }
            if (!buckets?.some(bucket => bucket.name === ASSESSMENT_BUCKET)) {
                const { error: bucketError } = await supabase.storage.createBucket(ASSESSMENT_BUCKET, {
                    public: false,
                    fileSizeLimit: MAX_ASSESSMENT_FILE_SIZE,
                    allowedMimeTypes: ASSESSMENT_FILE_TYPES,
                });
                if (bucketError) {
                    console.error("Error creating assessment storage bucket:", bucketError);
                    return NextResponse.json({ success: false, error: "Failed to prepare attachment storage" }, { status: 500 });
                }
            }

            assessmentAttachmentName = assessmentAttachment.name.slice(0, 255);
            const safeName = assessmentAttachment.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-160);
            assessmentAttachmentPath = `${employer.company_id}/${invitation.id}/${crypto.randomUUID()}-${safeName}`;
            const { error: uploadError } = await supabase.storage
                .from(ASSESSMENT_BUCKET)
                .upload(assessmentAttachmentPath, Buffer.from(await assessmentAttachment.arrayBuffer()), {
                    contentType: assessmentAttachment.type,
                    upsert: false,
                });
            if (uploadError) {
                console.error("Error uploading assessment attachment:", uploadError);
                return NextResponse.json({ success: false, error: "Failed to upload assessment attachment" }, { status: 500 });
            }
        }

        // Create the next interview round
        const now = new Date().toISOString();
        const { data: newRound, error: createError } = await supabase
            .from('interview_rounds')
            .insert({
                invitation_id: invitation.id,
                round_number: nextRoundNumber,
                round_label: round_label || `Round ${nextRoundNumber}`,
                status: isAssessment ? 'confirmed' : 'pending',
                interview_mode,
                interview_confirmed: isAssessment,
                confirmed_at: isAssessment ? now : null,
                meeting_link: interview_mode === 'online' ? (meeting_link || null) : null,
                interview_address: isPhysical ? interview_address : null,
                map_link: isPhysical ? (map_link || null) : null,
                given_time_slots: typedTimeSlots,
                alternative_dates: alternativeDates,
                assessment_delivery_mode: isAssessment ? assessment_delivery_mode : null,
                assessment_deadline: parsedAssessmentDeadline,
                assessment_start_at: parsedAssessmentStartAt,
                assessment_end_at: parsedAssessmentEndAt,
                assessment_link: isAssessment ? (assessment_link || null) : null,
                assessment_attachment_path: assessmentAttachmentPath,
                assessment_attachment_name: assessmentAttachmentName,
                sent_at: now
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating next round:', createError);
            if (assessmentAttachmentPath) {
                await supabase.storage.from(ASSESSMENT_BUCKET).remove([assessmentAttachmentPath]);
            }
            return NextResponse.json(
                { success: false, error: "Failed to create next interview round" },
                { status: 500 }
            );
        }

        // Note: The database trigger will automatically update job_invitations.current_round_number
        // when the interview_round is created (see migration 20260419000000_fix_invitation_round_sync.sql)
        // But we'll also do it explicitly here for redundancy and immediate confirmation
        
        const { data: updateData, error: updateError } = await supabase
            .from('job_invitations')
            .update({
                current_round_number: nextRoundNumber,
                pipeline_status: 'active'
            })
            .eq('id', invitation.id)
            .select('id, current_round_number, pipeline_status')
            .single();

        if (updateError) {
            console.error('ERROR: Failed to update invitation current_round_number:', {
                invitation_id: invitation.id,
                nextRoundNumber,
                error: updateError
            });
            // This is critical - log but don't fail since trigger should handle it
        } else {
            console.log('SUCCESS: Invitation updated:', {
                invitation_id: updateData.id,
                current_round_number: updateData.current_round_number,
                pipeline_status: updateData.pipeline_status,
                expected_round: nextRoundNumber
            });
            
            // Verify the update actually worked
            if (updateData.current_round_number !== nextRoundNumber) {
                console.warn('WARNING: current_round_number mismatch!', {
                    expected: nextRoundNumber,
                    actual: updateData.current_round_number
                });
            }
        }

        // Get company info for email
        const { data: company } = await supabase
            .from('companies')
            .select('company_name')
            .eq('id', employer.company_id)
            .single();

        // Send email notification to candidate
        const candidate = invitation.candidate?.[0] ?? null;
        if (candidate && company) {
            const recipientTz = await getUserTimezoneByEmail(candidate.email);
            sendInterviewInvitationEmail(
                candidate.email,
                candidate.first_name,
                company.company_name,
                `${invitation.job_designation} - ${round_label || `Round ${nextRoundNumber}`}`,
                typedTimeSlots,
                invitation.id,
                recipientTz,
                isAssessment ? {
                    deadline: parsedAssessmentDeadline,
                    startAt: parsedAssessmentStartAt,
                    endAt: parsedAssessmentEndAt,
                    deliveryMode: assessment_delivery_mode as "online" | "physical",
                    assessmentLink: typeof assessment_link === "string" ? assessment_link : null,
                    attachmentName: assessmentAttachmentName,
                    address: typeof interview_address === "string" ? interview_address : null,
                    mapLink: typeof map_link === "string" ? map_link : null,
                } : undefined,
            ).catch(err => console.error('Email send error:', err));
        }

        await logBusiness(
            "next_interview_round_created",
            user.id,
            "employer",
            "interview_round",
            newRound.id,
            { 
                invitation_id: invitation.id, 
                round_number: nextRoundNumber,
                candidate_id: invitation.candidate_id,
                interview_mode,
            }
        );

        return NextResponse.json({
            success: true,
            message: "Next interview round created successfully",
            data: {
                round_id: newRound.id,
                round_number: nextRoundNumber,
                round_label: newRound.round_label,
                invitation_id: invitation.id
            }
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/employer/interview-rounds/next-round:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Calculate 3 working days after the latest time slot
function calculateAlternativeDatesArray(timeSlots: { date: string }[]): { date: string; time: string | null; order: number; is_alternative: boolean }[] {
    if (!timeSlots || timeSlots.length === 0) return [];

    const latestMs = Math.max(
        ...timeSlots.map((s) => Date.parse(`${s.date}T00:00:00Z`))
    );
    const cursor = new Date(latestMs);
    const alternatives: { date: string; time: string | null; order: number; is_alternative: boolean }[] = [];
    let workingDaysAdded = 0;

    while (workingDaysAdded < 3) {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        const dayOfWeek = cursor.getUTCDay();

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            alternatives.push({
                date: cursor.toISOString().split('T')[0],
                time: null,
                order: timeSlots.length + workingDaysAdded + 1,
                is_alternative: true
            });
            workingDaysAdded++;
        }
    }

    return alternatives;
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
