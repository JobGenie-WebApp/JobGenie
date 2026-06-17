import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadFile } from "@/lib/storage";
import { logError } from "@/lib/logger";

// Per-role bucket allowlist.
// Only buckets explicitly listed here are accessible by that role.
const ROLE_BUCKET_ALLOWLIST: Record<string, string[]> = {
    candidate: ["resume", "resume_copy", "profile-images"],
    employer: ["profile-images", "br-certificates", "uploads", "company-logos", "payment-proofs"],
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

        // Fetch the caller's role so we can enforce the allowlist
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

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const bucket = formData.get("bucket") as string || "uploads";
        const folder = formData.get("folder") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // ── EP-07: Bucket allowlist check ───────────────────────────────────
        const allowedBuckets = ROLE_BUCKET_ALLOWLIST[role] ?? [];
        if (!allowedBuckets.includes(bucket)) {
            return NextResponse.json(
                { error: `Role '${role}' is not permitted to upload to bucket '${bucket}'` },
                { status: 403 }
            );
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File size must be less than 10MB" },
                { status: 400 }
            );
        }

        // Generate unique file name
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExt = file.name.split(".").pop();
        const fileName = `${timestamp}-${randomString}.${fileExt}`;

        // Construct file path with folder if provided
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine allowed MIME types based on bucket
        let allowedMimeTypes: string[] = [];
        switch (bucket) {
            case "resume":
            case "resume_copy":
                allowedMimeTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
                break;
            case "profile-images":
                allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
                break;
            case "br-certificates":
                allowedMimeTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
                break;
            case "company-logos":
                allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
                break;
            case "payment-proofs":
                allowedMimeTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
                break;
            case "uploads":
            default:
                allowedMimeTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
                break;
        }

        // Upload using StorageService (which handles bucket creation)
        const url = await uploadFile(bucket, filePath, buffer, file.type, allowedMimeTypes);

        return NextResponse.json({
            success: true,
            url,
            fileName: filePath,
        });
    } catch (error) {
        console.error("Upload error:", error);
        await logError({ source: "api/upload:POST", errorType: "UploadError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
