/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { companyUpdateSchema, type CompanyUpdateData, COMPANY_SIZES } from "@/lib/validations/company-update-schema";
import { updateCompanyInfo } from "@/app/actions/employer-profile";
import { useToast } from "@/hooks/use-toast";
import { CompanyProfile } from "@/app/actions/employer-profiles";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, Loader2, X, Plus, Info } from "lucide-react";

interface CompanyInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: CompanyProfile;
}

export function CompanyInfoDialog({ open, onOpenChange, company }: CompanyInfoDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewLogo, setPreviewLogo] = useState<string | null>(null);
    const [specialities, setSpecialities] = useState<string[]>([]);
    const [specialityInput, setSpecialityInput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<CompanyUpdateData>({
        resolver: zodResolver(companyUpdateSchema),
        defaultValues: {
            bio: "",
            description: "",
            company_size: "",
            website: "",
            headoffice_location: "",
            logo_url: "",
            specialities: [],
            map_link: "",
        },
    });

    // Reset form when dialog opens with company data
    useEffect(() => {
        if (open && company) {
            form.reset({
                bio: company.bio || "",
                description: company.description || "",
                company_size: company.company_size || "",
                website: company.website || "",
                headoffice_location: company.headoffice_location || "",
                logo_url: company.logo_url || "",
                specialities: company.specialities || [],
                map_link: company.map_link || "",
            });
            setPreviewLogo(company.logo_url);
            setSpecialities(company.specialities || []);
        }
    }, [open, company, form]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image file (JPEG, PNG, GIF, or WebP)",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please upload an image smaller than 5MB",
                variant: "destructive",
            });
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewLogo(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/employer/upload-company-logo", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to upload logo");
            }

            // Update form with new logo URL
            form.setValue("logo_url", data.data.url);

            toast({
                title: "Success",
                description: "Company logo uploaded successfully",
            });
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to upload logo",
                variant: "destructive",
            });
            // Revert preview
            setPreviewLogo(company.logo_url);
        } finally {
            setIsUploading(false);
        }
    };

    const addSpeciality = () => {
        const trimmed = specialityInput.trim();
        if (trimmed && !specialities.includes(trimmed)) {
            if (specialities.length >= 10) {
                toast({
                    title: "Maximum limit reached",
                    description: "You can add maximum 10 specialities",
                    variant: "destructive",
                });
                return;
            }
            const updated = [...specialities, trimmed];
            setSpecialities(updated);
            form.setValue("specialities", updated);
            setSpecialityInput("");
        }
    };

    const removeSpeciality = (index: number) => {
        const updated = specialities.filter((_, i) => i !== index);
        setSpecialities(updated);
        form.setValue("specialities", updated);
    };

    const handleSpecialityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSpeciality();
        }
    };

    async function onSubmit(data: CompanyUpdateData) {
        setIsSubmitting(true);
        try {
            // Clean up optional fields
            const formattedData = {
                bio: data.bio && data.bio.trim() !== ""
                    ? data.bio
                    : null,
                description: data.description,
                company_size: data.company_size,
                website: data.website && data.website.trim() !== ""
                    ? data.website
                    : null,
                headoffice_location: data.headoffice_location,
                logo_url: data.logo_url && data.logo_url.trim() !== ""
                    ? data.logo_url
                    : null,
                specialities: specialities,
                map_link: data.map_link && data.map_link.trim() !== ""
                    ? data.map_link
                    : null,
            };

            const result = await updateCompanyInfo(formattedData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Company information updated successfully",
                });
                onOpenChange(false);
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error updating company info:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const companyInitials = company.company_name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Company Information</DialogTitle>
                    <DialogDescription>
                        Update your company information and logo
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Company Logo Upload */}
                        <div className="flex flex-col items-center gap-4 py-4">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-lg rounded-lg">
                                <AvatarImage
                                    src={previewLogo || undefined}
                                    alt="Company logo"
                                    className="object-contain p-2"
                                />
                                <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary rounded-lg">
                                    {companyInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading || isSubmitting}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Change Company Logo
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG, GIF or WebP. Max 5MB.
                                </p>
                            </div>
                        </div>

                        {/* Company Bio */}
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Bio</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="A short tagline or bio for your company..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Company Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Description *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your company, its mission, and what makes it unique..."
                                            className="min-h-[120px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Company Size and Website */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="company_size"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Size *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select company size" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {COMPANY_SIZES.map((size) => (
                                                    <SelectItem key={size} value={size}>
                                                        {size} employees
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Head Office Location */}
                        <FormField
                            control={form.control}
                            name="headoffice_location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Head Office Location *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Colombo, Sri Lanka" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Specialities */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Company Specialities
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. Web Development, AI Solutions"
                                    value={specialityInput}
                                    onChange={(e) => setSpecialityInput(e.target.value)}
                                    onKeyDown={handleSpecialityKeyDown}
                                    disabled={isSubmitting}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={addSpeciality}
                                    disabled={isSubmitting || !specialityInput.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {specialities.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {specialities.map((speciality, index) => (
                                        <Badge key={index} variant="secondary" className="gap-1">
                                            {speciality}
                                            <button
                                                type="button"
                                                onClick={() => removeSpeciality(index)}
                                                className="ml-1 hover:text-destructive"
                                                disabled={isSubmitting}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Add up to 10 specialities. Press Enter or click + to add.
                            </p>
                        </div>

                        {/* Map Link */}
                        <FormField
                            control={form.control}
                            name="map_link"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2">
                                        <FormLabel>Map Link</FormLabel>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p className="text-sm">
                                                        <strong>How to get the embed URL:</strong>
                                                    </p>
                                                    <ol className="text-xs mt-2 space-y-1 list-decimal list-inside">
                                                        <li>Go to Google Maps</li>
                                                        <li>Search for your location</li>
                                                        <li>Click "Share" button</li>
                                                        <li>Click "Embed a map" tab</li>
                                                        <li>Copy the URL from iframe src</li>
                                                    </ol>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <FormControl>
                                        <Input
                                            placeholder="Paste Google Maps embed URL or full iframe code"
                                            {...field}
                                            onChange={(e) => {
                                                let value = e.target.value.trim();

                                                // Extract URL from iframe if user pastes full HTML
                                                if (value.includes('<iframe')) {
                                                    const srcMatch = value.match(/src=["']([^"']+)["']/);
                                                    if (srcMatch && srcMatch[1]) {
                                                        value = srcMatch[1];
                                                    }
                                                }

                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        You can paste either the embed URL or the full iframe code
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting || isUploading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || isUploading}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
