import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const BUCKET_NAME = "cover-images";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Invalid file type. Only images are allowed." },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: "File size exceeds 5MB limit" },
                { status: 400 }
            );
        }

        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return NextResponse.json(
                { success: false, error: "Candidate profile not found" },
                { status: 404 }
            );
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${candidate.id}-${Date.now()}.${fileExt}`;
        const filePath = `${candidate.id}/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const adminClient = createAdminClient();

        // Ensure the bucket exists before uploading (idempotent safety net)
        const { data: buckets, error: listError } = await adminClient.storage.listBuckets();
        if (listError) {
            console.error("Error listing storage buckets:", listError);
        }
        const bucketExists = buckets?.find((b) => b.name === BUCKET_NAME);
        if (!bucketExists) {
            const { error: createError } = await adminClient.storage.createBucket(BUCKET_NAME, {
                public: true,
                fileSizeLimit: MAX_FILE_SIZE,
                allowedMimeTypes: ALLOWED_FILE_TYPES,
            });
            if (createError) {
                console.error(`Failed to create bucket '${BUCKET_NAME}':`, createError);
                return NextResponse.json(
                    { success: false, error: `Failed to create storage bucket '${BUCKET_NAME}'` },
                    { status: 500 }
                );
            }
        }

        const { error: uploadError } = await adminClient.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, { contentType: file.type, upsert: true });

        if (uploadError) {
            console.error("Cover upload error:", uploadError);
            return NextResponse.json({ success: false, error: "Failed to upload image" }, { status: 500 });
        }

        const { data: urlData } = adminClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        if (!urlData?.publicUrl) {
            return NextResponse.json({ success: false, error: "Failed to get image URL" }, { status: 500 });
        }

        // Persist the cover image URL on the candidate record
        const { error: updateError } = await adminClient
            .from("candidates")
            .update({ cover_image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
            .eq("id", candidate.id);

        if (updateError) {
            console.error("Failed to persist cover image url:", updateError);
            return NextResponse.json({ success: false, error: "Failed to save cover image" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: { url: urlData.publicUrl, path: filePath },
        });
    } catch (error) {
        console.error("Error in cover image upload:", error);
        await logError({ source: "api/candidate/upload-cover-image:POST", errorType: "UploadError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
    }
}

/** Removing a cover just clears the column - the header falls back to the branded default. */
export async function DELETE() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return NextResponse.json({ success: false, error: "Candidate profile not found" }, { status: 404 });
        }

        const adminClient = createAdminClient();

        const { error: updateError } = await adminClient
            .from("candidates")
            .update({ cover_image_url: null, updated_at: new Date().toISOString() })
            .eq("id", candidate.id);

        if (updateError) {
            console.error("Failed to clear cover image url:", updateError);
            return NextResponse.json({ success: false, error: "Failed to remove cover image" }, { status: 500 });
        }

        // Best effort: drop the candidate's stored covers (uploads are timestamped, so this also
        // clears the ones earlier changes left behind). A failure here is not worth failing on -
        // the profile already shows the default.
        const { data: stored } = await adminClient.storage.from(BUCKET_NAME).list(candidate.id);
        if (stored?.length) {
            const { error: removeError } = await adminClient.storage
                .from(BUCKET_NAME)
                .remove(stored.map((f) => `${candidate.id}/${f.name}`));
            if (removeError) console.error("Failed to delete stored cover images:", removeError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing cover image:", error);
        await logError({ source: "api/candidate/upload-cover-image:DELETE", errorType: "UploadError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
    }
}
