import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

// This endpoint is intentionally unauthenticated.
// It is ONLY used during the employer signup flow to clean up an orphaned
// BR certificate when registration fails BEFORE a user account is created.
//
// Security controls applied to compensate for the lack of auth:
//   1. Bucket is hard-coded to "br-certificates" — cannot be overridden.
//   2. File path MUST start with "presignup/" — cannot delete any other files.
//   3. Only Supabase Storage public URL format is accepted.

const BUCKET = "br-certificates";
const REQUIRED_FOLDER_PREFIX = "presignup/";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileUrl } = body as { fileUrl?: string };

        if (!fileUrl) {
            return NextResponse.json(
                { error: "fileUrl is required" },
                { status: 400 }
            );
        }

        // Parse bucket and file path from the Supabase public URL
        // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[filepath]
        const urlParts = fileUrl.split("/storage/v1/object/public/");
        if (urlParts.length !== 2) {
            return NextResponse.json(
                { error: "Invalid file URL format" },
                { status: 400 }
            );
        }

        const [parsedBucket, ...filePathParts] = urlParts[1].split("/");
        const filePath = filePathParts.join("/");

        // Guard 1: Must be the BR certificates bucket
        if (parsedBucket !== BUCKET) {
            return NextResponse.json(
                { error: "This endpoint only deletes BR certificate files." },
                { status: 403 }
            );
        }

        // Guard 2: Must be in the presignup/ subfolder (files uploaded before account creation)
        if (!filePath.startsWith(REQUIRED_FOLDER_PREFIX)) {
            return NextResponse.json(
                { error: "This endpoint only deletes pre-signup files." },
                { status: 403 }
            );
        }

        const adminClient = createAdminClient();
        const { error: deleteError } = await adminClient.storage
            .from(BUCKET)
            .remove([filePath]);

        if (deleteError) {
            console.error("Presignup file cleanup error:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete file." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Presignup file cleaned up successfully.",
        });
    } catch (error) {
        console.error("Delete presignup file error:", error);
        await logError({
            source: "api/delete-presignup-file:POST",
            errorType: "PresignupDeleteError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "An unexpected error occurred." },
            { status: 500 }
        );
    }
}
