/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { aboutSectionSchema, type AboutSectionFormData } from "@/lib/validations/profile";
import { updateAboutSection } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { CandidateProfile } from "@/types/profile-types";

interface AboutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: CandidateProfile;
}

export function AboutDialog({ open, onOpenChange, profile }: AboutDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AboutSectionFormData>({
        resolver: zodResolver(aboutSectionSchema),
        defaultValues: {
            professional_summary: "",
            years_of_experience: null,
            experience_level: undefined,
            expected_monthly_salary: null,
            notice_period: "",
            employment_type: undefined,
            availability_status: undefined,
        },
    });

    // Reset form when dialog opens with profile data
    useEffect(() => {
        if (open && profile) {
            form.reset({
                professional_summary: profile.professional_summary || "",
                years_of_experience: profile.years_of_experience,
                experience_level: profile.experience_level || undefined,
                expected_monthly_salary: profile.expected_monthly_salary ? Number(profile.expected_monthly_salary) : null,
                notice_period: profile.notice_period || "",
                employment_type: profile.employment_type || undefined,
                availability_status: profile.availability_status || undefined,
            });
        }
    }, [open, profile, form]);

    async function onSubmit(data: AboutSectionFormData) {
        setIsSubmitting(true);
        try {
            // Clean up optional fields
            const formattedData = {
                ...data,
                professional_summary: data.professional_summary && data.professional_summary.trim() !== ""
                    ? data.professional_summary
                    : undefined,
                notice_period: data.notice_period && data.notice_period.trim() !== ""
                    ? data.notice_period
                    : undefined,
            };

            const result = await updateAboutSection(formattedData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "About section updated successfully",
                });
                onOpenChange(false);
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error updating about section:", error);
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
                    <DialogTitle>Edit About Section</DialogTitle>
                    <DialogDescription>
                        Update your professional summary and career preferences
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="professional_summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Professional Summary</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Write a brief summary of your professional background and expertise..."
                                            rows={5}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="years_of_experience"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Years of Experience</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="e.g. 5"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    field.onChange(value === "" ? null : parseInt(value));
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="experience_level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Experience Level</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select level" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="entry">Entry</SelectItem>
                                                <SelectItem value="junior">Junior</SelectItem>
                                                <SelectItem value="mid">Mid</SelectItem>
                                                <SelectItem value="senior">Senior</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="expected_monthly_salary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expected Monthly Salary (LKR)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 150000"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    field.onChange(value === "" ? null : parseFloat(value));
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="notice_period"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notice Period</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 1 month, Immediate" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="employment_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employment Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="full_time">Full Time</SelectItem>
                                                <SelectItem value="part_time">Part Time</SelectItem>
                                                <SelectItem value="contract">Contract</SelectItem>
                                                <SelectItem value="internship">Internship</SelectItem>
                                                <SelectItem value="freelance">Freelance</SelectItem>
                                                <SelectItem value="volunteer">Volunteer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="availability_status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Availability Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="available">Available</SelectItem>
                                                <SelectItem value="open_to_opportunities">Open to Opportunities</SelectItem>
                                                <SelectItem value="not_looking">Not Looking</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
