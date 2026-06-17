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
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { educationSchema, type EducationFormData, ACADEMIC_EDUCATION_STATUSES, PROFESSIONAL_EDUCATION_STATUSES } from "@/lib/validations/profile-schema";
import { addEducation, updateEducation } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { Education } from "@/types/profile-types";

interface EducationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    education?: Education | null;
    educationType: "academic" | "professional";
}

export function EducationDialog({ open, onOpenChange, education, educationType }: EducationDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!education;

    const form = useForm<EducationFormData>({
        resolver: zodResolver(educationSchema),
        defaultValues: {
            education_type: educationType,
            degree_diploma: "",
            professional_qualification: "",
            institution: "",
            status: "incomplete",
        },
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open && education) {
            form.reset({
                education_type: education.education_type,
                degree_diploma: education.degree_diploma || "",
                professional_qualification: education.professional_qualification || "",
                institution: education.institution || "",
                status: education.status || "incomplete",
            });
        } else if (open && !education) {
            form.reset({
                education_type: educationType,
                degree_diploma: "",
                professional_qualification: "",
                institution: "",
                status: "incomplete",
            });
        }
    }, [open, education, educationType, form]);

    async function onSubmit(data: EducationFormData) {
        setIsSubmitting(true);
        try {
            // Clean up optional fields
            const formattedData = {
                ...data,
                degree_diploma: data.degree_diploma && data.degree_diploma.trim() !== ""
                    ? data.degree_diploma
                    : undefined,
                professional_qualification: data.professional_qualification && data.professional_qualification.trim() !== ""
                    ? data.professional_qualification
                    : undefined,
            };

            const result = isEditing
                ? await updateEducation(education.id, formattedData)
                : await addEducation(formattedData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Education ${isEditing ? "updated" : "added"} successfully`,
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
            console.error(`Error ${isEditing ? "updating" : "adding"} education:`, error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const isAcademic = educationType === "academic";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit" : "Add"} {isAcademic ? "Academic" : "Professional"} Education
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update your education details" : `Add ${isAcademic ? "academic" : "professional"} education to your profile`}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {isAcademic ? (
                            <FormField
                                control={form.control}
                                name="degree_diploma"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Degree/Diploma *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Bachelor of Science" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <FormField
                                control={form.control}
                                name="professional_qualification"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Professional Qualification *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. CPA, ACCA" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="institution"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Institution *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. University of Example" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status *</FormLabel>
                                    <div className="flex gap-2">
                                        <Select
                                            onValueChange={(val) => {
                                                if (val !== "other") {
                                                    field.onChange(val);
                                                } else {
                                                    field.onChange("");
                                                }
                                            }}
                                            value={
                                                isAcademic
                                                    ? ACADEMIC_EDUCATION_STATUSES.some(s => s.value === field.value) ? field.value : "other"
                                                    : PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === field.value) ? field.value : "other"
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger className={(isAcademic && !ACADEMIC_EDUCATION_STATUSES.some(s => s.value === field.value)) || (!isAcademic && !PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === field.value)) ? "w-[40%]" : "w-full"}>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(isAcademic ? ACADEMIC_EDUCATION_STATUSES : PROFESSIONAL_EDUCATION_STATUSES).map((status) => (
                                                    <SelectItem key={status.value} value={status.value}>
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="other">Other (Please specify)</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {((isAcademic && !ACADEMIC_EDUCATION_STATUSES.some(s => s.value === field.value)) || (!isAcademic && !PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === field.value))) && (
                                            <Input
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Specify status..."
                                                className="flex-1"
                                            />
                                        )}
                                    </div>
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
                                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
