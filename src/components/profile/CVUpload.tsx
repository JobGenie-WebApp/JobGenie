"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { extractCVData, type CVExtractionState } from "@/app/actions/extract-cv";
import type { CVExtractionResult } from "@/lib/validations/profile-schema";

interface CVUploadProps {
    onExtracted: (data: CVExtractionResult) => void;
    onFileSelect?: (file: File | null) => void;
    onSkip: () => void;
    isLoading?: boolean;
}

const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function CVUpload({ onExtracted, onFileSelect, onSkip, isLoading: parentLoading }: CVUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionResult, setExtractionResult] = useState<CVExtractionState | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return "Please upload a PDF or Word document";
        }
        if (file.size > MAX_FILE_SIZE) {
            return "File size must be less than 5MB";
        }
        return null;
    };

    const handleFile = useCallback(async (selectedFile: File) => {
        const error = validateFile(selectedFile);
        if (error) {
            setExtractionResult({ success: false, message: error });
            return;
        }

        setFile(selectedFile);
        if (onFileSelect) onFileSelect(selectedFile);
        setExtractionResult(null);
        setIsExtracting(true);
        setUploadProgress(0);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 100);

            // Convert file to base64
            const base64 = await fileToBase64(selectedFile);

            clearInterval(progressInterval);
            setUploadProgress(95);

            // Extract CV data
            const result = await extractCVData(base64, selectedFile.type);

            setUploadProgress(100);
            setExtractionResult(result);

            if (result.success && result.data) {
                // Delay to show completion
                setTimeout(() => {
                    onExtracted(result.data!);
                }, 500);
            }
        } catch (error) {
            console.error("File processing error:", error);
            setExtractionResult({
                success: false,
                message: "Failed to process file. Please try again.",
            });
        } finally {
            setIsExtracting(false);
        }
    }, [onExtracted]);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);

            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) {
                handleFile(droppedFile);
            }
        },
        [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                handleFile(selectedFile);
            }
        },
        [handleFile]
    );

    const clearFile = () => {
        setFile(null);
        if (onFileSelect) onFileSelect(null);
        setExtractionResult(null);
        setUploadProgress(0);
    };

    const isLoading = isExtracting || parentLoading;

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <Card
                className={cn(
                    "border-2 border-dashed transition-colors cursor-pointer",
                    isDragging && "border-primary bg-primary/5",
                    extractionResult?.success && "border-green-500 bg-green-50 dark:bg-green-900/10",
                    extractionResult && !extractionResult.success && "border-destructive bg-destructive/5"
                )}
            >
                <CardContent className="p-8">
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className="flex flex-col items-center justify-center text-center"
                    >
                        {!file && !isLoading && (
                            <>
                                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-muted p-4">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">Upload Your CV</h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Drag and drop your CV here, or click to browse
                                </p>
                                <p className="mb-4 text-xs text-muted-foreground">
                                    Supported formats: PDF, DOC, DOCX (Max 5MB)
                                </p>
                                <label htmlFor="cv-upload">
                                    <Button variant="outline" asChild>
                                        <span>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Select File
                                        </span>
                                    </Button>
                                </label>
                                <input
                                    id="cv-upload"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={handleInputChange}
                                />
                            </>
                        )}

                        {file && isLoading && (
                            <div className="w-full max-w-md space-y-4">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Extracting data with AI...
                                        </p>
                                    </div>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        )}

                        {file && !isLoading && extractionResult?.success && (
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                        Data extracted successfully!
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {file.name}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={clearFile}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {file && !isLoading && extractionResult && !extractionResult.success && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <X className="h-6 w-6 text-destructive" />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-destructive">
                                            {extractionResult.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {file.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={clearFile}>
                                        Try Again
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={onSkip}>
                                        Enter Manually
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Skip Option */}
            {!file && (
                <div className="text-center">
                    <p className="mb-2 text-sm text-muted-foreground">
                        Or enter your information manually
                    </p>
                    <Button variant="ghost" onClick={onSkip}>
                        Skip CV Upload
                    </Button>
                </div>
            )}
        </div>
    );
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix to get pure base64
            const base64 = result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
