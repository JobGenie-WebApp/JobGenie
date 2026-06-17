import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const candidateId = "b6d7c6e9-ac8f-4147-ad34-d938cfcb7c38";
    
    console.log("Testing query for candidate:", candidateId);
    
    const { data, error } = await supabase
        .from('job_invitations')
        .select(`
            id,
            industry,
            job_designation,
            message,
            given_time_slots,
            alternative_dates,
            status,
            interview_confirmed,
            pipeline_status,
            current_round_number,
            invitation_canceled,
            mis_rescheduled,
            canceled_by,
            cancellation_reason,
            canceled_at,
            sent_at,
            viewed_at,
            job_offers(id, status),
            employer:employers(id, user_id),
            company:companies(company_name, logo_url, industry, headoffice_location)
        `)
        .eq('candidate_id', candidateId);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data length:", data.length);
        console.log("Data:", JSON.stringify(data, null, 2));
    }
}

test();
