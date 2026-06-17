import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_VISIBILITY: Record<string, boolean> = {
    dashboard: true,
    "browse-jobs": true,
    applications: true,
    invitations: true,
    calendar: true,
    "my-profile": true,
    "my-resumes": true,
    settings: true,
};

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ success: true, visibility: DEFAULT_VISIBILITY });
        }

        const admin = createAdminClient();
        const { data: row } = await admin
            .from("mis_sidebar_visibility_settings")
            .select("visibility_config")
            .eq("portal_type", "candidate")
            .maybeSingle();

        const config = row?.visibility_config ?? {};
        const visibility = { ...DEFAULT_VISIBILITY };
        for (const key of Object.keys(DEFAULT_VISIBILITY)) {
            if (typeof config[key] === "boolean") {
                visibility[key] = config[key];
            }
        }

        return NextResponse.json({ success: true, visibility });
    } catch {
        return NextResponse.json({ success: true, visibility: DEFAULT_VISIBILITY });
    }
}
