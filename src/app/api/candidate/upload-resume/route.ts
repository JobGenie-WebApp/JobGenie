"use server";

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { logError } from "@/lib/logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["application/pdf"];

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
                { success: false, error: "Invalid file type. Only PDF files are allowed." },
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
        const { data: candidate, error: candidateError } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (candidateError || !candidate) {
            return NextResponse.json(
                { success: false, error: "Candidate profile not found" },
                { status: 404 }
            );
        }

        // Upload resume using StorageService (includes watermarking)
        const { url, filePath } = await StorageService.uploadResume(candidate.id, file);

        // Update candidate's resume_url in database
        const { error: updateError } = await supabase
            .from("candidates")
            .update({
                resume_url: url,
                updated_at: new Date().toISOString()
            })
            .eq("id", candidate.id);

        if (updateError) {
            console.error("Database update error:", updateError);
            return NextResponse.json(
                { success: false, error: "Failed to update resume information" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                url: url,
                path: filePath,
            },
        });
    } catch (error) {
        console.error("Error in resume upload:", error);
        await logError({ source: "api/candidate/upload-resume:POST", errorType: "UploadError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
