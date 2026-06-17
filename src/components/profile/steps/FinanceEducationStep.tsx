"use client";

import { GraduationCap, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormSection } from "../shared/FormSection";
import { DynamicList } from "../shared/DynamicList";
import { StepNavigation } from "../shared/StepNavigation";
import type { FinanceAcademicEducationData, FinanceProfessionalEducationData } from "@/lib/validations/profile-schema";
import { ACADEMIC_EDUCATION_STATUSES, PROFESSIONAL_EDUCATION_STATUSES, financeAcademicEducationSchema, financeProfessionalEducationSchema } from "@/lib/validations/profile-schema";
import { useState } from "react";
import { z } from "zod";

interface FinanceEducationStepProps {
    academicEducation: FinanceAcademicEducationData[];
    professionalEducation: FinanceProfessionalEducationData[];
    onAcademicChange: (data: FinanceAcademicEducationData[]) => void;
    onProfessionalChange: (data: FinanceProfessionalEducationData[]) => void;
    onNext: () => void;
    onPrevious: () => void;
}



export function FinanceEducationStep({
    academicEducation,
    professionalEducation,
    onAcademicChange,
    onProfessionalChange,
    onNext,
    onPrevious,
}: FinanceEducationStepProps) {
    const handleAddAcademic = () => {
        onAcademicChange([
            ...academicEducation,
            { degreeDiploma: "", institution: "", status: "incomplete" },
        ]);
    };

    const handleRemoveAcademic = (index: number) => {
        onAcademicChange(academicEducation.filter((_, i) => i !== index));
    };

    const handleUpdateAcademic = (index: number, field: keyof FinanceAcademicEducationData, value: unknown) => {
        const updated = [...academicEducation];
        updated[index] = { ...updated[index], [field]: value };
        if (academicErrors[`${index}.${field as string}`]) {
            setAcademicErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${index}.${field as string}`];
                return newErrors;
            });
        }
        onAcademicChange(updated);
    };

    const handleAddProfessional = () => {
        onProfessionalChange([
            ...professionalEducation,
            { professionalQualification: "", institution: "", status: "incomplete" },
        ]);
    };

    const handleRemoveProfessional = (index: number) => {
        onProfessionalChange(professionalEducation.filter((_, i) => i !== index));
    };

    const handleUpdateProfessional = (index: number, field: keyof FinanceProfessionalEducationData, value: unknown) => {
        const updated = [...professionalEducation];
        updated[index] = { ...updated[index], [field]: value };
        if (professionalErrors[`${index}.${field as string}`]) {
            setProfessionalErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${index}.${field as string}`];
                return newErrors;
            });
        }
        onProfessionalChange(updated);
    };

    const [academicErrors, setAcademicErrors] = useState<Record<string, string>>({});
    const [professionalErrors, setProfessionalErrors] = useState<Record<string, string>>({});

    const handleNextStep = () => {
        // Filter out incomplete entries
        const nonEmptyAcademic = academicEducation.filter(
            (edu) => edu.institution.trim() !== "" && edu.degreeDiploma.trim() !== ""
        );
        const nonEmptyProfessional = professionalEducation.filter(
            (edu) => edu.institution.trim() !== "" && edu.professionalQualification.trim() !== ""
        );

        if (nonEmptyAcademic.length !== academicEducation.length) {
            onAcademicChange(nonEmptyAcademic);
        }
        if (nonEmptyProfessional.length !== professionalEducation.length) {
            onProfessionalChange(nonEmptyProfessional);
        }

        const academicResult = z.array(financeAcademicEducationSchema).safeParse(nonEmptyAcademic);
        const professionalResult = z.array(financeProfessionalEducationSchema).safeParse(nonEmptyProfessional);

        if (academicResult.success && professionalResult.success) {
            setAcademicErrors({});
            setProfessionalErrors({});
            onNext();
        } else {
            const newAcademicErrors: Record<string, string> = {};
            if (!academicResult.success) {
                academicResult.error.issues.forEach(issue => {
                    const pathKey = issue.path.join('.');
                    newAcademicErrors[pathKey] = issue.message;
                });
            }
            setAcademicErrors(newAcademicErrors);

            const newProfessionalErrors: Record<string, string> = {};
            if (!professionalResult.success) {
                professionalResult.error.issues.forEach(issue => {
                    const pathKey = issue.path.join('.');
                    newProfessionalErrors[pathKey] = issue.message;
                });
            }
            setProfessionalErrors(newProfessionalErrors);
        }
    };

    return (
        <div className="space-y-6">
            {/* Academic Education Section */}
            <FormSection
                title="Academic Education"
                description="Degree/Diploma/Postgraduate Diploma – Accounting and Finance"
                icon={<GraduationCap className="h-5 w-5" />}
            >
                <DynamicList
                    items={academicEducation}
                    onAdd={handleAddAcademic}
                    onRemove={handleRemoveAcademic}
                    addLabel="Add Academic Education"
                    emptyMessage="No academic education added yet. Click below to add your qualifications."
                    maxItems={100}
                    renderItem={(edu, index) => (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`degreeDiploma-${index}`}>
                                        Degree/Diploma <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`degreeDiploma-${index}`}
                                        placeholder="e.g., BSc in Accounting and Finance"
                                        value={edu.degreeDiploma}
                                        onChange={(e) => handleUpdateAcademic(index, "degreeDiploma", e.target.value)}
                                    />
                                    {academicErrors[`${index}.degreeDiploma`] && <p className="text-sm text-destructive">{academicErrors[`${index}.degreeDiploma`]}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`institution-${index}`}>
                                        Institution <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`institution-${index}`}
                                        placeholder="e.g., University of Colombo"
                                        value={edu.institution}
                                        onChange={(e) => handleUpdateAcademic(index, "institution", e.target.value)}
                                    />
                                    {academicErrors[`${index}.institution`] && <p className="text-sm text-destructive">{academicErrors[`${index}.institution`]}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`status-${index}`}>
                                        Status <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={ACADEMIC_EDUCATION_STATUSES.some(s => s.value === edu.status) ? edu.status : "other"}
                                            onValueChange={(value) => {
                                                if (value !== "other") {
                                                    handleUpdateAcademic(index, "status", value);
                                                } else {
                                                    handleUpdateAcademic(index, "status", "");
                                                }
                                            }}
                                        >
                                            <SelectTrigger id={`status-${index}`} className={!ACADEMIC_EDUCATION_STATUSES.some(s => s.value === edu.status) ? "w-[40%]" : "w-full"}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[...ACADEMIC_EDUCATION_STATUSES, { value: "other", label: "Other (Please specify)" }].map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {(!ACADEMIC_EDUCATION_STATUSES.some(s => s.value === edu.status)) && (
                                            <Input
                                                id={`status-custom-${index}`}
                                                value={edu.status}
                                                onChange={(e) => handleUpdateAcademic(index, "status", e.target.value)}
                                                placeholder="Specify status..."
                                                className="flex-1"
                                            />
                                        )}
                                    </div>
                                    {academicErrors[`${index}.status`] && <p className="text-sm text-destructive">{academicErrors[`${index}.status`]}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                />
            </FormSection>

            {/* Professional Education Section */}
            <FormSection
                title="Professional Education"
                description="Professional Qualifications / Professional Programs / Specialized Programs"
                icon={<Award className="h-5 w-5" />}
            >
                <DynamicList
                    items={professionalEducation}
                    onAdd={handleAddProfessional}
                    onRemove={handleRemoveProfessional}
                    addLabel="Add Professional Education"
                    emptyMessage="No professional education added yet. Click below to add your qualifications."
                    maxItems={100}
                    renderItem={(edu, index) => (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`professionalQualification-${index}`}>
                                        Professional Qualification <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`professionalQualification-${index}`}
                                        placeholder="e.g., ACCA, CFA, CPA"
                                        value={edu.professionalQualification}
                                        onChange={(e) => handleUpdateProfessional(index, "professionalQualification", e.target.value)}
                                    />
                                    {professionalErrors[`${index}.professionalQualification`] && <p className="text-sm text-destructive">{professionalErrors[`${index}.professionalQualification`]}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`profInstitution-${index}`}>
                                        Institution <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`profInstitution-${index}`}
                                        placeholder="e.g., ACCA, CFA Institute"
                                        value={edu.institution}
                                        onChange={(e) => handleUpdateProfessional(index, "institution", e.target.value)}
                                    />
                                    {professionalErrors[`${index}.institution`] && <p className="text-sm text-destructive">{professionalErrors[`${index}.institution`]}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`profStatus-${index}`}>
                                        Status <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === edu.status) ? edu.status : "other"}
                                            onValueChange={(value) => {
                                                if (value !== "other") {
                                                    handleUpdateProfessional(index, "status", value);
                                                } else {
                                                    handleUpdateProfessional(index, "status", "");
                                                }
                                            }}
                                        >
                                            <SelectTrigger id={`profStatus-${index}`} className={!PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === edu.status) ? "w-[40%]" : "w-full"}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[...PROFESSIONAL_EDUCATION_STATUSES, { value: "other", label: "Other (Please specify)" }].map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {(!PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === edu.status)) && (
                                            <Input
                                                id={`profStatus-custom-${index}`}
                                                value={edu.status}
                                                onChange={(e) => handleUpdateProfessional(index, "status", e.target.value)}
                                                placeholder="Specify status..."
                                                className="flex-1"
                                            />
                                        )}
                                    </div>
                                    {professionalErrors[`${index}.status`] && <p className="text-sm text-destructive">{professionalErrors[`${index}.status`]}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                />
            </FormSection>

            <StepNavigation
                currentStep={4}
                totalSteps={8}
                onPrevious={onPrevious}
                onNext={handleNextStep}
            />
        </div>
    );
}
