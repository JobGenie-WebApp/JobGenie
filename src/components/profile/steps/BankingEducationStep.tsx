"use client";

import { GraduationCap, Award, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormSection } from "../shared/FormSection";
import { DynamicList } from "../shared/DynamicList";
import { StepNavigation } from "../shared/StepNavigation";
import type { BankingAcademicEducationData, BankingProfessionalEducationData, BankingSpecializedTrainingData } from "@/lib/validations/profile-schema";
import { ACADEMIC_EDUCATION_STATUSES, PROFESSIONAL_EDUCATION_STATUSES, bankingAcademicEducationSchema, bankingProfessionalEducationSchema, bankingSpecializedTrainingSchema } from "@/lib/validations/profile-schema";
import { useState } from "react";
import { z } from "zod";

interface BankingEducationStepProps {
    academicEducation: BankingAcademicEducationData[];
    professionalEducation: BankingProfessionalEducationData[];
    specializedTraining: BankingSpecializedTrainingData[];
    onAcademicChange: (data: BankingAcademicEducationData[]) => void;
    onProfessionalChange: (data: BankingProfessionalEducationData[]) => void;
    onSpecializedChange: (data: BankingSpecializedTrainingData[]) => void;
    onNext: () => void;
    onPrevious: () => void;
}



export function BankingEducationStep({
    academicEducation,
    professionalEducation,
    specializedTraining,
    onAcademicChange,
    onProfessionalChange,
    onSpecializedChange,
    onNext,
    onPrevious,
}: BankingEducationStepProps) {
    // Handlers remain the same...
    const handleAddAcademic = () => {
        onAcademicChange([
            ...academicEducation,
            { degreeDiploma: "", institution: "", status: "incomplete" },
        ]);
    };

    const handleRemoveAcademic = (index: number) => {
        onAcademicChange(academicEducation.filter((_, i) => i !== index));
    };

    const handleUpdateAcademic = (index: number, field: keyof BankingAcademicEducationData, value: unknown) => {
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

    const handleUpdateProfessional = (index: number, field: keyof BankingProfessionalEducationData, value: unknown) => {
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

    const handleAddSpecialized = () => {
        onSpecializedChange([
            ...specializedTraining,
            { certificateName: "", issuingAuthority: "", certificateIssueMonth: "", status: "incomplete" },
        ]);
    };

    const handleRemoveSpecialized = (index: number) => {
        onSpecializedChange(specializedTraining.filter((_, i) => i !== index));
    };

    const handleUpdateSpecialized = (index: number, field: keyof BankingSpecializedTrainingData, value: unknown) => {
        const updated = [...specializedTraining];
        updated[index] = { ...updated[index], [field]: value };
        if (specializedErrors[`${index}.${field as string}`]) {
            setSpecializedErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${index}.${field as string}`];
                return newErrors;
            });
        }
        onSpecializedChange(updated);
    };

    const [academicErrors, setAcademicErrors] = useState<Record<string, string>>({});
    const [professionalErrors, setProfessionalErrors] = useState<Record<string, string>>({});
    const [specializedErrors, setSpecializedErrors] = useState<Record<string, string>>({});

    const handleNextStep = () => {
        // Filter out incomplete entries
        const nonEmptyAcademic = academicEducation.filter(
            (edu) => edu.institution.trim() !== "" && edu.degreeDiploma.trim() !== ""
        );
        const nonEmptyProfessional = professionalEducation.filter(
            (edu) => edu.institution.trim() !== "" && edu.professionalQualification.trim() !== ""
        );
        const nonEmptySpecialized = specializedTraining.filter(
            (edu) => edu.issuingAuthority.trim() !== "" && edu.certificateName.trim() !== ""
        );

        if (nonEmptyAcademic.length !== academicEducation.length) {
            onAcademicChange(nonEmptyAcademic);
        }
        if (nonEmptyProfessional.length !== professionalEducation.length) {
            onProfessionalChange(nonEmptyProfessional);
        }
        if (nonEmptySpecialized.length !== specializedTraining.length) {
            onSpecializedChange(nonEmptySpecialized);
        }

        const academicResult = z.array(bankingAcademicEducationSchema).safeParse(nonEmptyAcademic);
        const professionalResult = z.array(bankingProfessionalEducationSchema).safeParse(nonEmptyProfessional);
        const specializedResult = z.array(bankingSpecializedTrainingSchema).safeParse(nonEmptySpecialized);

        if (academicResult.success && professionalResult.success && specializedResult.success) {
            setAcademicErrors({});
            setProfessionalErrors({});
            setSpecializedErrors({});
            onNext();
        } else {
            const newAcademicErrors: Record<string, string> = {};
            if (!academicResult.success) {
                academicResult.error.issues.forEach(issue => {
                    newAcademicErrors[issue.path.join('.')] = issue.message;
                });
            }
            setAcademicErrors(newAcademicErrors);

            const newProfessionalErrors: Record<string, string> = {};
            if (!professionalResult.success) {
                professionalResult.error.issues.forEach(issue => {
                    newProfessionalErrors[issue.path.join('.')] = issue.message;
                });
            }
            setProfessionalErrors(newProfessionalErrors);

            const newSpecializedErrors: Record<string, string> = {};
            if (!specializedResult.success) {
                specializedResult.error.issues.forEach(issue => {
                    newSpecializedErrors[issue.path.join('.')] = issue.message;
                });
            }
            setSpecializedErrors(newSpecializedErrors);
        }
    };

    return (
        <div className="space-y-6">
            {/* Academic Education Section */}
            <FormSection
                title="Academic Education"
                description="Degree/Diploma/Postgraduate Diploma – Banking and Finance"
                icon={<GraduationCap className="h-5 w-5" />}
            >
                <DynamicList
                    items={academicEducation}
                    onAdd={handleAddAcademic}
                    onRemove={handleRemoveAcademic}
                    addLabel="Add Academic Education"
                    emptyMessage="No academic education added yet."
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
                                        placeholder="e.g., BSc in Banking and Finance"
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
                description="Professional Banking Programs / Specialist Diplomas / International Professional Qualifications"
                icon={<Award className="h-5 w-5" />}
            >
                <DynamicList
                    items={professionalEducation}
                    onAdd={handleAddProfessional}
                    onRemove={handleRemoveProfessional}
                    addLabel="Add Professional Education"
                    emptyMessage="No professional education added yet."
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
                                        placeholder="e.g., CIMA, ACIB, CIB"
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
                                        placeholder="e.g., CIMA, Institute of Bankers"
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

            {/* Specialized Training Section */}
            <FormSection
                title="Specialized Banking Training / Certificates"
                description="Certificates, Training Programs, and Specialized Banking Qualifications"
                icon={<FileText className="h-5 w-5" />}
            >
                <DynamicList
                    items={specializedTraining}
                    onAdd={handleAddSpecialized}
                    onRemove={handleRemoveSpecialized}
                    addLabel="Add Specialized Training"
                    emptyMessage="No specialized training added yet."
                    maxItems={100}
                    renderItem={(training, index) => (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`certificateName-${index}`}>
                                        Certificate / Training Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`certificateName-${index}`}
                                        placeholder="e.g., Credit Risk Management Certificate"
                                        value={training.certificateName}
                                        onChange={(e) => handleUpdateSpecialized(index, "certificateName", e.target.value)}
                                    />
                                    {specializedErrors[`${index}.certificateName`] && <p className="text-sm text-destructive">{specializedErrors[`${index}.certificateName`]}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`issuingAuthority-${index}`}>
                                        Issuing Authority / Institution <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`issuingAuthority-${index}`}
                                        placeholder="e.g., Institute of Banking Studies"
                                        value={training.issuingAuthority}
                                        onChange={(e) => handleUpdateSpecialized(index, "issuingAuthority", e.target.value)}
                                    />
                                    {specializedErrors[`${index}.issuingAuthority`] && <p className="text-sm text-destructive">{specializedErrors[`${index}.issuingAuthority`]}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`certificateIssueMonth-${index}`}>
                                        Issue / Completion Month
                                    </Label>
                                    <Input
                                        id={`certificateIssueMonth-${index}`}
                                        type="month"
                                        value={training.certificateIssueMonth}
                                        onChange={(e) => handleUpdateSpecialized(index, "certificateIssueMonth", e.target.value)}
                                    />
                                    {specializedErrors[`${index}.certificateIssueMonth`] && <p className="text-sm text-destructive">{specializedErrors[`${index}.certificateIssueMonth`]}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`trainStatus-${index}`}>
                                        Status <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === training.status) ? training.status : "other"}
                                            onValueChange={(value) => {
                                                if (value !== "other") {
                                                    handleUpdateSpecialized(index, "status", value);
                                                } else {
                                                    handleUpdateSpecialized(index, "status", "");
                                                }
                                            }}
                                        >
                                            <SelectTrigger id={`trainStatus-${index}`} className={!PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === training.status) ? "w-[40%]" : "w-full"}>
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

                                        {(!PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === training.status)) && (
                                            <Input
                                                id={`trainStatus-custom-${index}`}
                                                value={training.status}
                                                onChange={(e) => handleUpdateSpecialized(index, "status", e.target.value)}
                                                placeholder="Specify status..."
                                                className="flex-1"
                                            />
                                        )}
                                    </div>
                                    {specializedErrors[`${index}.status`] && <p className="text-sm text-destructive">{specializedErrors[`${index}.status`]}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                />
            </FormSection>

            <StepNavigation
                currentStep={4}
                totalSteps={7}
                onPrevious={onPrevious}
                onNext={handleNextStep}
            />
        </div>
    );
}
