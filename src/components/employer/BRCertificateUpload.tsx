"use client";

import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BRCertificateUploadProps {
    onFileSelect: (file: File) => void;
    onVerificationComplete: (verified: boolean) => void;
    companyName: string;
    businessRegistrationNo: string;
}

export function BRCertificateUpload({
    onFileSelect,
    onVerificationComplete,
    companyName,
    businessRegistrationNo,
}: BRCertificateUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "verified" | "failed">("idle");
    const [verificationMessage, setVerificationMessage] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = useCallback(
        async (selectedFile: File) => {
            // Validate file type
            const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
            if (!validTypes.includes(selectedFile.type)) {
                toast.error("Invalid file type. Please upload a PDF or image file (JPG, PNG).");
                return;
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (selectedFile.size > maxSize) {
                toast.error("File size must be less than 10MB.");
                return;
            }

            setFile(selectedFile);

            // Generate preview for images
            if (selectedFile.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFilePreview(e.target?.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setFilePreview(null);
            }

            // Upload file and verify
            await uploadAndVerify(selectedFile);
        },
        [companyName, businessRegistrationNo]
    );

    const uploadAndVerify = async (fileToUpload: File) => {
        if (!companyName || !businessRegistrationNo) {
            toast.error("Please fill in company name and registration number first.");
            return;
        }

        setIsUploading(true);
        setVerificationStatus("idle");

        try {
            // Convert file to base64 for verification (don't upload yet)
            setIsVerifying(true);
            setVerificationStatus("verifying");

            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target?.result as string;
                const base64Data = base64.split(",")[1]; // Remove data:image/... prefix

                try {
                    // Call verification API (without uploading)
                    const verifyResponse = await fetch("/api/verify-br-certificate", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            fileBase64: base64Data,
                            mimeType: fileToUpload.type,
                            companyName,
                            businessRegistrationNo,
                        }),
                    });

                    const verificationResult = await verifyResponse.json();

                    setIsVerifying(false);
                    setIsUploading(false);

                    if (verificationResult.success) {
                        setVerificationStatus("verified");
                        setVerificationMessage(verificationResult.message);
                        toast.success("Certificate verified successfully!");
                        // Pass the file itself (not URL) - it will be uploaded during registration
                        onFileSelect(fileToUpload);
                        onVerificationComplete(true);
                    } else {
                        setVerificationStatus("failed");
                        setVerificationMessage(verificationResult.message);
                        toast.error("Certificate verification failed");
                        onVerificationComplete(false);
                    }
                } catch (error) {
                    console.error("Verification error:", error);
                    setIsVerifying(false);
                    setIsUploading(false);
                    setVerificationStatus("failed");
                    setVerificationMessage("An error occurred during verification.");
                    toast.error("Failed to verify certificate. Please try again.");
                    onVerificationComplete(false);
                }
            };

            reader.onerror = () => {
                setIsUploading(false);
                setIsVerifying(false);
                toast.error("Failed to read file. Please try again.");
            };

            reader.readAsDataURL(fileToUpload);
        } catch (error) {
            console.error("Verification error:", error);
            toast.error("Failed to verify certificate. Please try again.");
            setVerificationStatus("failed");
            setVerificationMessage("An error occurred during verification.");
            onVerificationComplete(false);
            setIsUploading(false);
            setIsVerifying(false);
        }
    };

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);

            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) {
                handleFileChange(droppedFile);
            }
        },
        [handleFileChange]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleRetry = () => {
        if (file) {
            uploadAndVerify(file);
        }
    };

    return (
        <div className="space-y-4">
            {!file ? (
                <Card
                    className={`border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                        }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <CardContent className="flex flex-col items-center justify-center py-10">
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Upload Business Registration Certificate</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                            Drag and drop your BR certificate here, or click to browse
                        </p>
                        <input
                            type="file"
                            id="br-certificate"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                                const selectedFile = e.target.files?.[0];
                                if (selectedFile) {
                                    handleFileChange(selectedFile);
                                }
                            }}
                            disabled={isUploading}
                        />
                        <label htmlFor="br-certificate">
                            <Button variant="outline" asChild disabled={isUploading}>
                                <span className="cursor-pointer">Choose File</span>
                            </Button>
                        </label>
                        <p className="text-xs text-muted-foreground mt-4">
                            Supported formats: PDF, JPG, PNG (Max size: 10MB)
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                {filePreview ? (
                                    <img
                                        src={filePreview}
                                        alt="Certificate preview"
                                        className="w-20 h-20 object-cover rounded border"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-muted rounded border flex items-center justify-center">
                                        <FileText className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>

                                {/* Verification Status */}
                                <div className="mt-3">
                                    {(isUploading || isVerifying) && (
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm">
                                                {isUploading ? "Uploading..." : "Verifying with AI..."}
                                            </span>
                                        </div>
                                    )}

                                    {verificationStatus === "verified" && (
                                        <div className="flex items-start gap-2 text-green-600">
                                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm">
                                                <p className="font-medium">Verified Successfully</p>
                                                <p className="text-xs text-green-600/80">{verificationMessage}</p>
                                            </div>
                                        </div>
                                    )}

                                    {verificationStatus === "failed" && (
                                        <div className="flex items-start gap-2 text-destructive">
                                            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm w-full">
                                                <p className="font-medium mb-2">Verification Failed</p>
                                                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-xs">
                                                    <pre className="whitespace-pre-line font-sans text-destructive/90 leading-relaxed">
                                                        {verificationMessage}
                                                    </pre>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRetry}
                                                    className="mt-3"
                                                >
                                                    Retry Verification
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFile(null);
                                    setFilePreview(null);
                                    setVerificationStatus("idle");
                                    setVerificationMessage("");
                                    onVerificationComplete(false);
                                }}
                                disabled={isUploading || isVerifying}
                            >
                                Remove
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
