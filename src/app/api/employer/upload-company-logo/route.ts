"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
    try {
        // Use regular client for authentication
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

        // Use admin client for database and storage operations
        const adminClient = createAdminClient();

        // Get employer and company info
        const { data: employer, error: employerError } = await adminClient
            .from("employers")
            .select("company_id, companies!inner(logo_url)")
            .eq("user_id", user.id)
            .single();

        if (employerError || !employer) {
            console.error("Employer fetch error:", employerError);
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        const company = (employer as Record<string, unknown>).companies as { logo_url?: string | null } | null;
        const oldLogoUrl = company?.logo_url;

        // Create unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${employer.company_id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Just the filename

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Delete old logo if exists (using admin client)
        if (oldLogoUrl) {
            try {
                // Extract filename from URL
                const urlParts = oldLogoUrl.split('/');
                const oldFileName = urlParts[urlParts.length - 1];

                console.log("Attempting to delete old logo:", oldFileName);
                const { error: deleteError } = await adminClient.storage
                    .from("company-logos")
                    .remove([oldFileName]);

                if (deleteError) {
                    console.error("Error deleting old logo:", deleteError);
                }
            } catch (error) {
                console.error("Error in delete operation:", error);
                // Continue with upload even if deletion fails
            }
        }

        // Ensure the company-logos bucket exists before uploading
        const bucketName = "company-logos";
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

        // Upload to Supabase Storage using admin client (bypasses RLS)
        console.log("Uploading new logo:", filePath);
        const { data: uploadData, error: uploadError } = await adminClient.storage
            .from(bucketName)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json(
                { success: false, error: `Failed to upload logo: ${uploadError.message}` },
                { status: 500 }
            );
        }

        console.log("Upload successful:", uploadData);

        // Get public URL
        const { data: urlData } = adminClient.storage
            .from("company-logos")
            .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
            return NextResponse.json(
                { success: false, error: "Failed to get logo URL" },
                { status: 500 }
            );
        }

        console.log("Public URL generated:", urlData.publicUrl);

        return NextResponse.json({
            success: true,
            data: {
                url: urlData.publicUrl,
                path: filePath,
            },
        });
    } catch (error) {
        console.error("Error in company logo upload:", error);
        await logError({ source: "api/employer/upload-company-logo:POST", errorType: "UploadError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
