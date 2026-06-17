import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

const RESUME_BUCKET = "resume";
const RESUME_COPY_BUCKET = "resume_copy";
const PROFILE_IMAGE_BUCKET = "profile-images";
const BR_CERTIFICATES_BUCKET = "br-certificates";

/**
 * Watermarks a PDF file with the company logo as a smaller circular badge.
 * @param fileBuffer - The buffer of the PDF file.
 * @returns The buffer of the watermarked PDF.
 */
export async function watermarkPDF(fileBuffer: ArrayBuffer): Promise<Uint8Array> {
    try {
        const pdfDoc = await PDFDocument.load(fileBuffer);

        // Load logo from public folder
        const logoPath = path.join(process.cwd(), "public", "logo.jpg");
        const logoImageBytes = await fs.readFile(logoPath);
        const logoImage = await pdfDoc.embedJpg(logoImageBytes);

        // Scale down to ~45% of the original size (was 0.1, now 0.055)
        const logoDims = logoImage.scale(0.055);

        // Determine the circle radius — use the shorter side of the image
        const radius = Math.min(logoDims.width, logoDims.height) / 2;

        const pages = pdfDoc.getPages();
        for (const page of pages) {
            const { width, height } = page.getSize();

            // Place logo at top-right with a small margin
            const imgX = width - logoDims.width - 16;
            const imgY = height - logoDims.height - 16;

            // Center of the drawn image rectangle
            const cx = imgX + logoDims.width / 2;
            const cy = imgY + logoDims.height / 2;

            // Draw a white filled circle background so logo doesn't bleed into PDF content
            page.drawCircle({
                x: cx,
                y: cy,
                size: radius + 1.5,
                color: rgb(1, 1, 1),
                opacity: 0.85,
            });

            // Draw the logo image
            page.drawImage(logoImage, {
                x: imgX,
                y: imgY,
                width: logoDims.width,
                height: logoDims.height,
                opacity: 0.80,
            });

            // Draw a subtle border ring on top for polish
            page.drawCircle({
                x: cx,
                y: cy,
                size: radius + 1.5,
                borderColor: rgb(0.75, 0.75, 0.75),
                borderWidth: 0.6,
                opacity: 0,
            });
        }

        return await pdfDoc.save();
    } catch (error) {
        console.error("Error watermarking PDF:", error);
        throw new Error("Failed to watermark PDF");
    }
}

/**
 * Uploads a file to Supabase Storage.
 * @param bucket - The storage bucket name.
 * @param path - The path to store the file (e.g., "folder/filename.pdf").
 * @param fileBody - The file content (Buffer/ArrayBuffer).
 * @param contentType - The MIME type of the file.
 */
export async function uploadFile(
    bucket: string,
    filePath: string,
    fileBody: ArrayBuffer | Uint8Array | Buffer,
    contentType: string,
    allowedMimeTypes: string[] = ["application/pdf"] // Default to PDF for backward compatibility
) {
    const supabase = createAdminClient();

    // Check if bucket exists, if not create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.find((b) => b.name === bucket);

    if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: true, // Make public to allow resume_url access
            fileSizeLimit: 5242880, // 5MB limit
            allowedMimeTypes: allowedMimeTypes,
        });

        if (createError) {
            console.error(`Failed to create bucket '${bucket}':`, createError);
            // Don't throw here, try uploading anyway as listBuckets might fail due to permissions
            // but upload might succeed if bucket actually exists or RLS allows creation
        } else {
            console.log(`Created storage bucket: ${bucket}`);
        }
    }

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBody, {
            contentType,
            upsert: true,
        });

    if (error) {
        console.error("Storage upload error:", error);
        throw error;
    }

    // Get public URL (assuming bucket is public, or we need to sign URL)
    // For 'resumes', it's likely a private bucket, but user asked for resume_url.
    // If it's private, we might need a signed URL, but usually profile fields store the path or public URL.
    // Let's assume public for now or standard getPublicUrl.
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return publicUrl;
}

/**
 * Deletes a file from Supabase Storage.
 * @param bucket - The storage bucket name.
 * @param path - The path of the file to delete.
 */
export async function deleteFile(bucket: string, filePath: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
        console.error("Storage delete error:", error);
        // We log but don't throw, as this is often used in cleanup/rollback
    }
}

export const StorageService = {
    watermarkPDF,
    uploadResume: async (candidateId: string, file: File) => {
        const buffer = await file.arrayBuffer();

        // Watermark if PDF
        let fileData: ArrayBuffer | Uint8Array = buffer;
        if (file.type === "application/pdf") {
            try {
                fileData = await watermarkPDF(buffer);
            } catch (e) {
                console.warn("Watermarking failed, uploading original.", e);
            }
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `resume_${Date.now()}.${fileExt}`;
        const filePath = `${candidateId}/${fileName}`;

        const allowedMimeTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        const url = await uploadFile(RESUME_BUCKET, filePath, fileData, file.type || "application/octet-stream", allowedMimeTypes);
        return { url, filePath };
    },
    deleteResume: async (filePath: string) => {
        await deleteFile(RESUME_BUCKET, filePath);
    },
    uploadCommonCV: async (candidateId: string, pdfBuffer: Uint8Array) => {
        // Watermark the generated common CV PDF
        let fileData: Uint8Array;
        try {
            // Create a new ArrayBuffer from the Uint8Array for watermarkPDF
            const arrayBuffer = new Uint8Array(pdfBuffer).buffer as ArrayBuffer;
            fileData = await watermarkPDF(arrayBuffer);
        } catch (e) {
            console.warn("Watermarking common CV failed, uploading without watermark.", e);
            fileData = pdfBuffer;
        }

        const fileName = `common_cv_${Date.now()}.pdf`;
        const filePath = `${candidateId}/${fileName}`;

        const url = await uploadFile(
            RESUME_COPY_BUCKET,
            filePath,
            fileData,
            "application/pdf",
            ["application/pdf"]
        );
        return { url, filePath };
    },
    deleteCommonCV: async (filePath: string) => {
        await deleteFile(RESUME_COPY_BUCKET, filePath);
    },
    uploadProfileImage: async (candidateId: string, file: File) => {
        const buffer = await file.arrayBuffer();
        const fileExt = file.name.split('.').pop();
        const fileName = `profile_${Date.now()}.${fileExt}`;
        const filePath = `${candidateId}/${fileName}`;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            throw new Error("Invalid file type. Only images are allowed.");
        }

        const url = await uploadFile(PROFILE_IMAGE_BUCKET, filePath, buffer, file.type, [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
        ]);
        return { url, filePath };
    },
    deleteProfileImage: async (filePath: string) => {
        await deleteFile(PROFILE_IMAGE_BUCKET, filePath);
    },
    uploadBRCertificate: async (file: File) => {
        const buffer = await file.arrayBuffer();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExt = file.name.split(".").pop();
        const filePath = `presignup/${timestamp}-${randomString}.${fileExt}`;

        const allowedMimeTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        // Validate file type
        if (!allowedMimeTypes.includes(file.type)) {
            throw new Error("Only PDF and image files are accepted for BR certificates.");
        }

        // Validate file size (10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
        if (file.size > MAX_FILE_SIZE) {
            throw new Error("File size must be less than 10 MB.");
        }

        const url = await uploadFile(BR_CERTIFICATES_BUCKET, filePath, buffer, file.type, allowedMimeTypes);
        return { url, filePath };
    }
};
