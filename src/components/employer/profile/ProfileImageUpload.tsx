"use client";

import { Upload, Image as ImageIcon, X } from "lucide-react";
import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProfileImageUploadProps {
    onImageSelect: (file: File | null) => void;
    currentImageUrl?: string;
}

export function ProfileImageUpload({ onImageSelect, currentImageUrl }: ProfileImageUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = useCallback(
        (selectedFile: File) => {
            // Validate file type
            const validTypes = ["image/jpeg", "image/jpg", "image/png"];
            if (!validTypes.includes(selectedFile.type)) {
                toast.error("Invalid file type. Please upload a JPG or PNG image.");
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (selectedFile.size > maxSize) {
                toast.error("File size must be less than 5MB.");
                return;
            }

            setFile(selectedFile);

            // Generate preview (don't upload yet)
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);

            // Pass file to parent (will be uploaded during submission)
            onImageSelect(selectedFile);
        },
        [onImageSelect]
    );

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

    const handleRemove = () => {
        setFile(null);
        setPreview(null);
        onImageSelect(null);
    };

    return (
        <div className="space-y-4">
            {!preview ? (
                <Card
                    className={`border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                        }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <CardContent className="flex flex-col items-center justify-center py-10">
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Upload Profile Picture</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                            Drag and drop your image here, or click to browse
                        </p>
                        <input
                            type="file"
                            id="profile-image"
                            className="hidden"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => {
                                const selectedFile = e.target.files?.[0];
                                if (selectedFile) {
                                    handleFileChange(selectedFile);
                                }
                            }}
                        />
                        <label htmlFor="profile-image">
                            <Button variant="outline" asChild>
                                <span className="cursor-pointer">Choose Image</span>
                            </Button>
                        </label>
                        <p className="text-xs text-muted-foreground mt-4">
                            Supported formats: JPG, PNG (Max size: 5MB)
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-6">
                        <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                                <img
                                    src={preview}
                                    alt="Profile preview"
                                    className="w-32 h-32 object-cover rounded-full border-2"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file?.name || "Current image"}</p>
                                {file && (
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemove}
                                    className="mt-2"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
