import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

// Per-role bucket allowlist (mirrors the upload allowlist).
const ROLE_BUCKET_ALLOWLIST: Record<string, string[]> = {
    candidate: ["resume", "resume_copy", "profile-images"],
    employer: ["profile-images", "br-certificates", "uploads", "company-logos"],
    mis: ["uploads"],
};

export async function POST(request: NextRequest) {
    try {
        // ── EP-07: Authentication gate ──────────────────────────────────────
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized – please sign in first" },
                { status: 401 }
            );
        }

        // Fetch the caller's role
        const adminClient = createAdminClient();
        const { data: userData } = await adminClient
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        const role = userData?.role as string | undefined;
        if (!role) {
            return NextResponse.json(
                { error: "User role not found" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { fileUrl } = body;

        if (!fileUrl) {
            return NextResponse.json(
                { error: "File URL is required" },
                { status: 400 }
            );
        }

        // Extract bucket and file path from URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[filepath]
        const urlParts = fileUrl.split("/storage/v1/object/public/");
        if (urlParts.length !== 2) {
            return NextResponse.json(
                { error: "Invalid file URL format" },
                { status: 400 }
            );
        }

        const [bucket, ...filePathParts] = urlParts[1].split("/");
        const filePath = filePathParts.join("/");

        // ── EP-07: Bucket allowlist check ───────────────────────────────────
        const allowedBuckets = ROLE_BUCKET_ALLOWLIST[role] ?? [];
        if (!allowedBuckets.includes(bucket)) {
            return NextResponse.json(
                { error: `Role '${role}' is not permitted to delete from bucket '${bucket}'` },
                { status: 403 }
            );
        }

        // Delete from Supabase Storage using admin client (after all auth/authz checks)
        const { error } = await adminClient.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error("Storage deletion error:", error);
            return NextResponse.json(
                { error: "Failed to delete file" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "File deleted successfully",
        });
    } catch (error) {
        console.error("Delete error:", error);
        await logError({ source: "api/delete-file:POST", errorType: "StorageError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

