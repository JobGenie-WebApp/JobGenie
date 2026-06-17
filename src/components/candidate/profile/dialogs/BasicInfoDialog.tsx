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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { basicInfoSchema, type BasicInfoFormData } from "@/lib/validations/profile";
import { updateBasicInfo } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { CandidateProfile } from "@/types/profile-types";
import { Upload, Loader2, X } from "lucide-react";
import { useJobDesignations, uniqueDesignationsByName } from "@/hooks/useJobDesignations";
import { Combobox } from "@/components/ui/combobox";

interface BasicInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: CandidateProfile;
    onProfileUpdated?: () => void;
}

export function BasicInfoDialog({ open, onOpenChange, profile, onProfileUpdated }: BasicInfoDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [expectedPositions, setExpectedPositions] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canLoadDesignations = Boolean(profile?.industry);

    const { jobDesignations, loading: loadingDesignations, error: designationsError } = useJobDesignations(
        profile?.industry
    );
    const designationOptions = uniqueDesignationsByName(jobDesignations);

    const form = useForm<BasicInfoFormData>({
        resolver: zodResolver(basicInfoSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            nicPassport: "",
            phone: "",
            alternative_phone: "",
            country: "",
            current_position: "",
            highest_qualification: undefined,
            profile_image_url: "",
        },
    });

    // Reset form when dialog opens with profile data
    useEffect(() => {
        if (open && profile) {
            form.reset({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                nicPassport: profile.nicPassport || "",
                phone: profile.phone || "",
                alternative_phone: profile.alternative_phone || "",
                country: profile.country || "",
                current_position: profile.current_position || "",
                highest_qualification: profile.highest_qualification || undefined,
                profile_image_url: profile.profile_image_url || "",
                expected_positions: profile.expected_positions ?? [],
            });
            setExpectedPositions(profile.expected_positions ?? []);
            setPreviewImage(profile.profile_image_url);
        }
    }, [open, profile, form]);

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
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/candidate/upload-profile-image", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to upload image");
            }

            // Update form with new image URL
            form.setValue("profile_image_url", data.data.url);

            toast({
                title: "Success",
                description: "Profile picture uploaded successfully",
            });
        } catch (error) {
            console.error("Error uploading image:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to upload image",
                variant: "destructive",
            });
            // Revert preview
            setPreviewImage(profile.profile_image_url);
        } finally {
            setIsUploading(false);
        }
    };

    async function onSubmit(data: BasicInfoFormData) {
        setIsSubmitting(true);
        try {
            // Clean up optional fields
            const formattedData = {
                ...data,
                alternative_phone: data.alternative_phone && data.alternative_phone.trim() !== ""
                    ? data.alternative_phone
                    : undefined,
                country: data.country && data.country.trim() !== ""
                    ? data.country
                    : undefined,
                expected_positions: expectedPositions,
            };

            const result = await updateBasicInfo(formattedData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Basic information updated successfully",
                });
                onOpenChange(false);
                router.refresh();
                onProfileUpdated?.();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error updating basic info:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Basic Information</DialogTitle>
                    <DialogDescription>
                        Update your basic information and profile picture
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col items-center gap-4 py-4">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                                <AvatarImage src={previewImage || undefined} alt="Profile picture" />
                                <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                                    {initials}
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
                                            Change Profile Picture
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG, GIF or WebP. Max 5MB.
                                </p>
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="first_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="last_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* NIC/Passport and Phone Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nicPassport"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NIC/Passport *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 199012345678 or N1234567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone * <span className="text-xs text-muted-foreground font-normal ml-1">( Format: +94XXXXXXXXX )</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="+94771234567" maxLength={15} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="alternative_phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alternative Phone <span className="text-xs text-muted-foreground font-normal ml-1">( Format: +94XXXXXXXXX )</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="+94771234567 (Optional)" maxLength={15} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="current_position"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Position *</FormLabel>
                                    {!canLoadDesignations ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                Set your industry on your profile to see suggested job titles, or type your position below.
                                            </p>
                                            <FormControl>
                                                <Input placeholder="e.g. Senior Software Engineer" {...field} />
                                            </FormControl>
                                        </div>
                                    ) : loadingDesignations ? (
                                        <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground border rounded-md">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading job designations...
                                        </div>
                                    ) : designationsError ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-destructive">
                                                Failed to load job designations. You can enter manually.
                                            </p>
                                            <FormControl>
                                                <Input placeholder="e.g. Senior Software Engineer" {...field} />
                                            </FormControl>
                                        </div>
                                    ) : (
                                        <FormControl>
                                            <Combobox
                                                options={designationOptions.map((designation) => ({
                                                    value: designation.designation_name,
                                                    label: designation.designation_name,
                                                }))}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Select your current position"
                                                searchPlaceholder="Search job titles..."
                                                emptyMessage="No job title found for your industry."
                                            />
                                        </FormControl>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Expected Job Positions */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Expected Job Positions *
                                <span className="text-xs text-muted-foreground font-normal ml-1">(Up to 3)</span>
                            </label>

                            {/* Selected pills */}
                            {expectedPositions.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {expectedPositions.map((pos, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                                        >
                                            {pos}
                                            <button
                                                type="button"
                                                aria-label={`Remove ${pos}`}
                                                onClick={() => setExpectedPositions(prev => prev.filter((_, i) => i !== idx))}
                                                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Combobox / limit message */}
                            {expectedPositions.length >= 3 ? (
                                <p className="text-xs text-muted-foreground py-1">
                                    Maximum of 3 positions reached. Remove one to add another.
                                </p>
                            ) : !canLoadDesignations ? (
                                <Input
                                    placeholder="Type a position and press Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const val = (e.target as HTMLInputElement).value.trim();
                                            if (val && !expectedPositions.includes(val)) {
                                                setExpectedPositions((prev) => [...prev, val]);
                                                (e.target as HTMLInputElement).value = "";
                                            }
                                        }
                                    }}
                                />
                            ) : loadingDesignations ? (
                                <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground border rounded-md">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading job designations...
                                </div>
                            ) : designationsError ? (
                                <Input
                                    placeholder="Type a position and press Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const val = (e.target as HTMLInputElement).value.trim();
                                            if (val && !expectedPositions.includes(val)) {
                                                setExpectedPositions((prev) => [...prev, val]);
                                                (e.target as HTMLInputElement).value = "";
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <Combobox
                                    options={designationOptions
                                        .filter((d) => !expectedPositions.includes(d.designation_name))
                                        .map((d) => ({
                                            value: d.designation_name,
                                            label: d.designation_name,
                                        }))}
                                    value=""
                                    onValueChange={(value) => {
                                        if (value && !expectedPositions.includes(value)) {
                                            setExpectedPositions((prev) => [...prev, value]);
                                        }
                                    }}
                                    placeholder="Search and select a position"
                                    searchPlaceholder="Search job titles..."
                                    emptyMessage="No job title found for your industry."
                                />
                            )}
                            {/* Show validation error if submitted with empty */}
                            {expectedPositions.length === 0 && (
                                <p className="text-xs text-destructive">At least one expected position is required</p>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="highest_qualification"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Highest Qualification</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select highest qualification" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="bachelors_degree">Bachelor&apos;s Degree</SelectItem>
                                            <SelectItem value="masters_degree">Master&apos;s Degree</SelectItem>
                                            <SelectItem value="doctorate_phd">Doctorate/PhD</SelectItem>
                                            <SelectItem value="undergraduate">Undergraduate</SelectItem>
                                            <SelectItem value="post_graduate">Post Graduate</SelectItem>
                                            <SelectItem value="diploma">Diploma</SelectItem>
                                            <SelectItem value="certificate">Certificate</SelectItem>
                                            <SelectItem value="professional_certification">Professional Certification</SelectItem>
                                            <SelectItem value="vocational_training">Vocational Training</SelectItem>
                                            <SelectItem value="no_formal_education">No Formal Education</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Country</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Sri Lanka" {...field} />
                                    </FormControl>
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
