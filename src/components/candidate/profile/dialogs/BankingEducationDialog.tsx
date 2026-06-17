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
    bankingAcademicEducationSchema,
    bankingProfessionalEducationSchema,
    bankingSpecializedTrainingSchema,
    type BankingAcademicEducationData,
    type BankingProfessionalEducationData,
    type BankingSpecializedTrainingData,
    ACADEMIC_EDUCATION_STATUSES,
    PROFESSIONAL_EDUCATION_STATUSES
} from "@/lib/validations/profile-schema";
import {
    addBankingAcademicEducation,
    updateBankingAcademicEducation,
    addBankingProfessionalEducation,
    updateBankingProfessionalEducation,
    addBankingSpecializedTraining,
    updateBankingSpecializedTraining,
} from "@/app/actions/finance-banking-mutations";
import { useToast } from "@/hooks/use-toast";
import {
    BankingAcademicEducation,
    BankingProfessionalEducation,
    BankingSpecializedTraining
} from "@/types/profile-types";

interface BankingEducationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    education?: BankingAcademicEducation | BankingProfessionalEducation | BankingSpecializedTraining | null;
    educationType: "academic" | "professional" | "training";
}

export function BankingEducationDialog({
    open,
    onOpenChange,
    education,
    educationType
}: BankingEducationDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!education;
    const isAcademic = educationType === "academic";
    const isProfessional = educationType === "professional";
    const isTraining = educationType === "training";

    const getSchema = () => {
        if (isAcademic) return bankingAcademicEducationSchema;
        if (isProfessional) return bankingProfessionalEducationSchema;
        return bankingSpecializedTrainingSchema;
    };

    const form = useForm<BankingAcademicEducationData | BankingProfessionalEducationData | BankingSpecializedTrainingData>({
        resolver: zodResolver(getSchema()),
        defaultValues: isAcademic
            ? {
                degreeDiploma: "",
                institution: "",
                status: "incomplete",
            }
            : isProfessional
                ? {
                    professionalQualification: "",
                    institution: "",
                    status: "incomplete",
                }
                : {
                    certificateName: "",
                    issuingAuthority: "",
                    certificateIssueMonth: "",
                    status: "incomplete",
                },
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open && education) {
            if (isAcademic) {
                const edu = education as BankingAcademicEducation;
                form.reset({
                    degreeDiploma: edu.degree_diploma || "",
                    institution: edu.institution || "",
                    status: edu.status || "incomplete",
                });
            } else if (isProfessional) {
                const edu = education as BankingProfessionalEducation;
                form.reset({
                    professionalQualification: edu.professional_qualification || "",
                    institution: edu.institution || "",
                    status: edu.status || "incomplete",
                });
            } else {
                const edu = education as BankingSpecializedTraining;
                form.reset({
                    certificateName: edu.certificate_name || "",
                    issuingAuthority: edu.issuing_authority || "",
                    certificateIssueMonth: edu.certificate_issue_month || "",
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
            } else if (isProfessional) {
                form.reset({
                    professionalQualification: "",
                    institution: "",
                    status: "incomplete",
                });
            } else {
                form.reset({
                    certificateName: "",
                    issuingAuthority: "",
                    certificateIssueMonth: "",
                    status: "incomplete",
                });
            }
        }
    }, [open, education, educationType, form, isAcademic, isProfessional]);

    async function onSubmit(data: BankingAcademicEducationData | BankingProfessionalEducationData | BankingSpecializedTrainingData) {
        setIsSubmitting(true);
        try {
            let result;

            if (isAcademic) {
                result = isEditing
                    ? await updateBankingAcademicEducation(education.id, data as BankingAcademicEducationData)
                    : await addBankingAcademicEducation(data as BankingAcademicEducationData);
            } else if (isProfessional) {
                result = isEditing
                    ? await updateBankingProfessionalEducation(education.id, data as BankingProfessionalEducationData)
                    : await addBankingProfessionalEducation(data as BankingProfessionalEducationData);
            } else {
                result = isEditing
                    ? await updateBankingSpecializedTraining(education.id, data as BankingSpecializedTrainingData)
                    : await addBankingSpecializedTraining(data as BankingSpecializedTrainingData);
            }

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Banking ${isAcademic ? "academic" : isProfessional ? "professional" : "training"} education ${isEditing ? "updated" : "added"} successfully`,
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
            console.error(`Error ${isEditing ? "updating" : "adding"} banking education:`, error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const getTitle = () => {
        if (isAcademic) return "Academic";
        if (isProfessional) return "Professional";
        return "Specialized Training";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit" : "Add"} {getTitle()} Education
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update your banking education details"
                            : `Add ${getTitle().toLowerCase()} education to your banking profile`
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {isAcademic && (
                            <FormField
                                control={form.control}
                                name="degreeDiploma"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Degree/Diploma *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Bachelor of Banking and Finance" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {isProfessional && (
                            <FormField
                                control={form.control}
                                name="professionalQualification"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Professional Qualification *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Certified Banking Professional" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {isTraining && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="certificateName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Certificate/Training Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Risk Management Certificate" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="issuingAuthority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Issuing Authority/Institution *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Central Bank" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="certificateIssueMonth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Issue Month</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="month"
                                                    placeholder="YYYY-MM"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {!isTraining && (
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
                        )}

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
