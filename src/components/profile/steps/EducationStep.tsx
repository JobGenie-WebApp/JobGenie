"use client";

import { GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormSection } from "../shared/FormSection";
import { DynamicList } from "../shared/DynamicList";
import { StepNavigation } from "../shared/StepNavigation";
import type { EducationData } from "@/lib/validations/profile-schema";
import { ACADEMIC_EDUCATION_STATUSES, PROFESSIONAL_EDUCATION_STATUSES, educationSchema } from "@/lib/validations/profile-schema";
import { useState } from "react";
import { z } from "zod";

interface EducationStepProps {
    educations: EducationData[];
    onChange: (educations: EducationData[]) => void;
    onNext: () => void;
    onPrevious: () => void;
}

const EDUCATION_TYPES = [
    { value: "academic", label: "Academic" },
    { value: "professional", label: "Professional" },
];



const emptyEducation: EducationData = {
    educationType: "academic",
    degreeDiploma: "",
    institution: "",
    status: "incomplete", // Changed to match schema
};

export function EducationStep({ educations, onChange, onNext, onPrevious }: EducationStepProps) {
    const handleAdd = () => {
        onChange([...educations, { ...emptyEducation }]);
    };

    const handleRemove = (index: number) => {
        onChange(educations.filter((_, i) => i !== index));
    };

    const handleUpdate = (index: number, field: keyof EducationData, value: unknown) => {
        const updated = [...educations];
        updated[index] = { ...updated[index], [field]: value };

        if (errors[`${index}.${field as string}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${index}.${field as string}`];
                return newErrors;
            });
        }

        onChange(updated);
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleNextStep = () => {
        // Filter out incomplete entries (must have BOTH institution and degreeDiploma)
        const nonEmptyEducations = educations.filter(
            (edu) => edu.institution.trim() !== "" && edu.degreeDiploma.trim() !== ""
        );

        // If items were removed, update the parent state
        if (nonEmptyEducations.length !== educations.length) {
            onChange(nonEmptyEducations);
        }

        const result = z.array(educationSchema).safeParse(nonEmptyEducations);
        if (result.success) {
            setErrors({});
            onNext();
        } else {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const pathKey = issue.path.join('.');
                newErrors[pathKey] = issue.message;
            });
            setErrors(newErrors);
        }
    };

    return (
        <div className="space-y-6">
            <FormSection
                title="Education"
                description="Add your academic and professional qualifications"
            >
                <DynamicList
                    items={educations}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    addLabel="Add Education"
                    emptyMessage="No education added yet. Click below to add your qualifications."
                    maxItems={100}
                    renderItem={(edu, index) => (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`educationType-${index}`}>Type</Label>
                                    <Select
                                        value={edu.educationType}
                                        onValueChange={(value) => handleUpdate(index, "educationType", value)}
                                    >
                                        <SelectTrigger id={`educationType-${index}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EDUCATION_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`status-${index}`}>Status</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={
                                                edu.educationType === "academic"
                                                    ? ACADEMIC_EDUCATION_STATUSES.some(s => s.value === edu.status)
                                                        ? edu.status
                                                        : "other"
                                                    : PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === edu.status)
                                                        ? edu.status
                                                        : "other"
                                            }
                                            onValueChange={(value) => {
                                                if (value !== "other") {
                                                    handleUpdate(index, "status", value);
                                                } else {
                                                    handleUpdate(index, "status", "");
                                                }
                                            }}
                                        >
                                            <SelectTrigger id={`status-${index}`} className={(edu.educationType === "academic" && !ACADEMIC_EDUCATION_STATUSES.some(s => s.value === edu.status)) || (edu.educationType === "professional" && !PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === edu.status)) ? "w-[40%]" : "w-full"}>
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {edu.educationType === "academic"
                                                    ? [
                                                        ...ACADEMIC_EDUCATION_STATUSES,
                                                        { value: "other", label: "Other (Please specify)" }
                                                    ].map((status) => (
                                                        <SelectItem key={status.value} value={status.value}>
                                                            {status.label}
                                                        </SelectItem>
                                                    ))
                                                    : [
                                                        ...PROFESSIONAL_EDUCATION_STATUSES,
                                                        { value: "other", label: "Other (Please specify)" }
                                                    ].map((status) => (
                                                        <SelectItem key={status.value} value={status.value}>
                                                            {status.label}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>

                                        {/* Show text input if custom value or 'other' is selected */}
                                        {(
                                            edu.educationType === "academic" && !ACADEMIC_EDUCATION_STATUSES.some(s => s.value === edu.status)
                                            ||
                                            edu.educationType === "professional" && !PROFESSIONAL_EDUCATION_STATUSES.some(s => s.value === edu.status)
                                        ) && (
                                                <Input
                                                    id={`status-custom-${index}`}
                                                    value={edu.status}
                                                    onChange={(e) => handleUpdate(index, "status", e.target.value)}
                                                    placeholder="Specify status..."
                                                    className="flex-1"
                                                />
                                            )}
                                    </div>
                                    {errors[`${index}.status`] && <p className="text-sm text-destructive">{errors[`${index}.status`]}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`degreeDiploma-${index}`}>
                                    Degree / Diploma <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id={`degreeDiploma-${index}`}
                                    value={edu.degreeDiploma}
                                    onChange={(e) => handleUpdate(index, "degreeDiploma", e.target.value)}
                                    placeholder="e.g., BSc in Computer Science"
                                />
                                {errors[`${index}.degreeDiploma`] && <p className="text-sm text-destructive">{errors[`${index}.degreeDiploma`]}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`institution-${index}`}>
                                    Institution <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id={`institution-${index}`}
                                    value={edu.institution}
                                    onChange={(e) => handleUpdate(index, "institution", e.target.value)}
                                    placeholder="e.g., University of Colombo"
                                />
                                {errors[`${index}.institution`] && <p className="text-sm text-destructive">{errors[`${index}.institution`]}</p>}
                            </div>
                        </div>
                    )}
                />
            </FormSection>

            <StepNavigation
                currentStep={4}
                totalSteps={10}
                onPrevious={onPrevious}
                onNext={handleNextStep}
            />
        </div>
    );
}
