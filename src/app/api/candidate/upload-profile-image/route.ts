import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the form data
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Invalid file type. Only images are allowed." },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: "File size exceeds 5MB limit" },
                { status: 400 }
            );
        }

        // Get candidate info
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

        // Create unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${candidate.id}-${Date.now()}.${fileExt}`;
        const filePath = `${candidate.id}/${fileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const adminClient = createAdminClient();
        const bucketName = "profile-images";

        // Ensure profile-images bucket exists before uploading
        const { data: buckets, error: listError } = await adminClient.storage.listBuckets();
        if (listError) {
            console.error("Error listing storage buckets:", listError);
        }

        const bucketExists = buckets?.find((b) => b.name === bucketName);
        if (!bucketExists) {
            const { error: createError } = await adminClient.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: MAX_FILE_SIZE,
                allowedMimeTypes: ALLOWED_FILE_TYPES,
            });

            if (createError) {
                console.error(`Failed to create bucket '${bucketName}':`, createError);
                return NextResponse.json(
                    { success: false, error: `Failed to create storage bucket '${bucketName}'` },
                    { status: 500 }
                );
            }
            console.log(`Created storage bucket: ${bucketName}`);
        }

        // Upload to Supabase Storage using admin client
        const { data: uploadData, error: uploadError } = await adminClient.storage
            .from(bucketName)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json(
                { success: false, error: "Failed to upload image" },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = adminClient.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
            return NextResponse.json(
                { success: false, error: "Failed to get image URL" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                url: urlData.publicUrl,
                path: filePath,
            },
        });
    } catch (error) {
        console.error("Error in profile image upload:", error);
        await logError({ source: "api/candidate/upload-profile-image:POST", errorType: "UploadError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
