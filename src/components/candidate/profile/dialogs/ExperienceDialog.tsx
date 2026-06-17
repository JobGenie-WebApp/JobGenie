/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { experienceSchema, type ExperienceFormData } from "@/lib/validations/profile";
import { addExperience, updateExperience } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { WorkExperience } from "@/types/profile-types";

interface ExperienceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    experience?: WorkExperience | null;
}

export function ExperienceDialog({ open, onOpenChange, experience }: ExperienceDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!experience;

    // @ts-expect-error - react-hook-form type definition conflicts (harmless)
    const form = useForm<ExperienceFormData>({
        resolver: zodResolver(experienceSchema),
        defaultValues: {
            job_title: "",
            company: "",
            employment_type: "full_time",
            location: "",
            start_date: "",
            end_date: "",
            is_current: false,
            description: "",
        },
    });

    // Helper to convert date from YYYY-MM-DD to YYYY-MM for month input
    const formatDateForMonthInput = (dateString: string | null) => {
        if (!dateString) return "";
        // If already in YYYY-MM format, return as is
        if (dateString.match(/^\d{4}-\d{2}$/)) return dateString;
        // If in YYYY-MM-DD format, extract YYYY-MM
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString.substring(0, 7);
        }
        return "";
    };

    // Reset form when dialog opens with experience data
    useEffect(() => {
        if (open && experience) {
            form.reset({
                job_title: experience.job_title || "",
                company: experience.company || "",
                employment_type: (experience.employment_type || "full_time") as any,
                location: experience.location || "",
                location_type: experience.location_type as any,
                start_date: formatDateForMonthInput(experience.start_date),
                end_date: formatDateForMonthInput(experience.end_date),
                is_current: experience.is_current || false,
                description: experience.description || "",
            } as any);
        } else if (open && !experience) {
            // Reset to empty when adding new
            form.reset({
                job_title: "",
                company: "",
                employment_type: "full_time" as any,
                location: "",
                location_type: undefined as any,
                start_date: "",
                end_date: "",
                is_current: false,
                description: "",
            } as any);
        }
    }, [open, experience, form]);

    const isCurrent = form.watch("is_current");

    async function onSubmit(data: ExperienceFormData) {
        setIsSubmitting(true);
        try {
            // Convert YYYY-MM dates to YYYY-MM-01 for PostgreSQL date type
            const formattedData = {
                ...data,
                start_date: data.start_date ? `${data.start_date}-01` : data.start_date,
                end_date: data.end_date ? `${data.end_date}-01` : data.end_date,
            };

            const result = isEditing
                ? await updateExperience(experience.id, formattedData)
                : await addExperience(formattedData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Experience ${isEditing ? "updated" : "added"} successfully`,
                });
                onOpenChange(false);
                form.reset();
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(`Error ${isEditing ? "updating" : "adding"} experience:`, error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Experience" : "Add Experience"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update your work experience details" : "Add a new work experience to your profile"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="job_title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Job Title *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Software Engineer" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Google" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="employment_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employment Type *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="full_time">Full Time</SelectItem>
                                                <SelectItem value="part_time">Part Time</SelectItem>
                                                <SelectItem value="contract">Contract</SelectItem>
                                                <SelectItem value="freelance">Freelance</SelectItem>
                                                <SelectItem value="internship">Internship</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="location_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="on_site">On-site</SelectItem>
                                                <SelectItem value="remote">Remote</SelectItem>
                                                <SelectItem value="hybrid">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. San Francisco, CA" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_current"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>I currently work here</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date *</FormLabel>
                                        <FormControl>
                                            <Input type="month" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {!isCurrent && (
                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
                                            <FormControl>
                                                <Input type="month" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your responsibilities and achievements..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
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
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add Experience"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
