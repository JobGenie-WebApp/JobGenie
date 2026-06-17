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
import {
    financeAcademicEducationSchema,
    financeProfessionalEducationSchema,
    type FinanceAcademicEducationData,
    type FinanceProfessionalEducationData,
    ACADEMIC_EDUCATION_STATUSES,
    PROFESSIONAL_EDUCATION_STATUSES
} from "@/lib/validations/profile-schema";
import {
    addFinanceAcademicEducation,
    updateFinanceAcademicEducation,
    addFinanceProfessionalEducation,
    updateFinanceProfessionalEducation,
} from "@/app/actions/finance-banking-mutations";
import { useToast } from "@/hooks/use-toast";
import { FinanceAcademicEducation, FinanceProfessionalEducation } from "@/types/profile-types";

interface FinanceEducationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    education?: FinanceAcademicEducation | FinanceProfessionalEducation | null;
    educationType: "academic" | "professional";
}

export function FinanceEducationDialog({
    open,
    onOpenChange,
    education,
    educationType
}: FinanceEducationDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!education;
    const isAcademic = educationType === "academic";

    const form = useForm<FinanceAcademicEducationData | FinanceProfessionalEducationData>({
        resolver: zodResolver(isAcademic ? financeAcademicEducationSchema : financeProfessionalEducationSchema),
        defaultValues: isAcademic
            ? {
                degreeDiploma: "",
                institution: "",
                status: "incomplete",
            }
            : {
                professionalQualification: "",
                institution: "",
                status: "incomplete",
            },
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open && education) {
            if (isAcademic) {
                const edu = education as FinanceAcademicEducation;
                form.reset({
                    degreeDiploma: edu.degree_diploma || "",
                    institution: edu.institution || "",
                    status: edu.status || "incomplete",
                });
            } else {
                const edu = education as FinanceProfessionalEducation;
                form.reset({
                    professionalQualification: edu.professional_qualification || "",
                    institution: edu.institution || "",
                    status: edu.status || "incomplete",
                });
            }
        } else if (open && !education) {
            if (isAcademic) {
                form.reset({
                    degreeDiploma: "",
                    institution: "",
                    status: "incomplete",
                });
            } else {
                form.reset({
                    professionalQualification: "",
                    institution: "",
                    status: "incomplete",
                });
            }
        }
    }, [open, education, educationType, form, isAcademic]);

    async function onSubmit(data: FinanceAcademicEducationData | FinanceProfessionalEducationData) {
        setIsSubmitting(true);
        try {
            let result;

            if (isAcademic) {
                result = isEditing
                    ? await updateFinanceAcademicEducation(education.id, data as FinanceAcademicEducationData)
                    : await addFinanceAcademicEducation(data as FinanceAcademicEducationData);
            } else {
                result = isEditing
                    ? await updateFinanceProfessionalEducation(education.id, data as FinanceProfessionalEducationData)
                    : await addFinanceProfessionalEducation(data as FinanceProfessionalEducationData);
            }

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Finance ${isAcademic ? "academic" : "professional"} education ${isEditing ? "updated" : "added"} successfully`,
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
            console.error(`Error ${isEditing ? "updating" : "adding"} finance education:`, error);
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
                    <DialogTitle>
                        {isEditing ? "Edit" : "Add"} {isAcademic ? "Academic" : "Professional"} Education
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update your finance education details"
                            : `Add ${isAcademic ? "academic" : "professional"} education to your finance profile`
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {isAcademic ? (
                            <FormField
                                control={form.control}
                                name="degreeDiploma"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Degree/Diploma *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Bachelor of Commerce in Accounting" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <FormField
                                control={form.control}
                                name="professionalQualification"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Professional Qualification *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. CFA, ACCA, CPA" {...field} />
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
