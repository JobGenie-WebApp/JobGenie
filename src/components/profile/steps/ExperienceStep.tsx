"use client";

import { Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "../shared/FormSection";
import { DynamicList } from "../shared/DynamicList";
import { StepNavigation } from "../shared/StepNavigation";
import type { WorkExperienceData } from "@/lib/validations/profile-schema";
import { workExperienceSchema } from "@/lib/validations/profile-schema";
import { useState } from "react";
import { z } from "zod";

interface ExperienceStepProps {
    experiences: WorkExperienceData[];
    onChange: (experiences: WorkExperienceData[]) => void;
    onNext: () => void;
    onPrevious: () => void;
}

const EMPLOYMENT_TYPES = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
];

const LOCATION_TYPES = [
    { value: "onsite", label: "On-site" },
    { value: "remote", label: "Remote" },
    { value: "hybrid", label: "Hybrid" },
];

const emptyExperience: WorkExperienceData = {
    jobTitle: "",
    company: "",
    employmentType: "full_time",
    location: "",
    locationType: "onsite",
    startDate: "",
    endDate: null,
    description: "",
    isCurrent: false,
};

export function ExperienceStep({ experiences, onChange, onNext, onPrevious }: ExperienceStepProps) {
    const handleAdd = () => {
        onChange([...experiences, { ...emptyExperience }]);
    };

    const handleRemove = (index: number) => {
        onChange(experiences.filter((_, i) => i !== index));
    };

    const handleUpdate = (index: number, field: keyof WorkExperienceData, value: unknown) => {
        const updated = [...experiences];
        updated[index] = { ...updated[index], [field]: value };

        // Clear error if present
        if (errors[`${index}.${field as string}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${index}.${field as string}`];
                return newErrors;
            });
        }

        // Clear end date if current is toggled on
        if (field === "isCurrent" && value === true) {
            updated[index].endDate = null;
        }

        onChange(updated);
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleNextStep = () => {
        const result = z.array(workExperienceSchema).safeParse(experiences);
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
                title="Work Experience"
                description="Add your work history, starting with the most recent position"
            >
                <DynamicList
                    items={experiences}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    addLabel="Add Experience"
                    emptyMessage="No work experience added yet. Click below to add your first position."
                    maxItems={100}
                    renderItem={(exp, index) => (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`jobTitle-${index}`}>
                                        Job Title <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`jobTitle-${index}`}
                                        value={exp.jobTitle}
                                        onChange={(e) => handleUpdate(index, "jobTitle", e.target.value)}
                                        placeholder="e.g., Senior Developer"
                                    />
                                    {errors[`${index}.jobTitle`] && <p className="text-sm text-destructive">{errors[`${index}.jobTitle`]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`company-${index}`}>
                                        Company <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`company-${index}`}
                                        value={exp.company}
                                        onChange={(e) => handleUpdate(index, "company", e.target.value)}
                                        placeholder="Company name"
                                    />
                                    {errors[`${index}.company`] && <p className="text-sm text-destructive">{errors[`${index}.company`]}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`employmentType-${index}`}>Employment Type</Label>
                                    <Select
                                        value={exp.employmentType}
                                        onValueChange={(value) => handleUpdate(index, "employmentType", value)}
                                    >
                                        <SelectTrigger id={`employmentType-${index}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EMPLOYMENT_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`locationType-${index}`}>Location Type</Label>
                                    <Select
                                        value={exp.locationType}
                                        onValueChange={(value) => handleUpdate(index, "locationType", value)}
                                    >
                                        <SelectTrigger id={`locationType-${index}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LOCATION_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`location-${index}`}>Location</Label>
                                <Input
                                    id={`location-${index}`}
                                    value={exp.location || ""}
                                    onChange={(e) => handleUpdate(index, "location", e.target.value)}
                                    placeholder="e.g., Colombo, Sri Lanka"
                                />
                                {errors[`${index}.location`] && <p className="text-sm text-destructive">{errors[`${index}.location`]}</p>}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`startDate-${index}`}>Start Month</Label>
                                    <Input
                                        id={`startDate-${index}`}
                                        type="month"
                                        value={exp.startDate || ""}
                                        onChange={(e) => handleUpdate(index, "startDate", e.target.value)}
                                    />
                                    {errors[`${index}.startDate`] && <p className="text-sm text-destructive">{errors[`${index}.startDate`]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`endDate-${index}`}>End Month</Label>
                                    <Input
                                        id={`endDate-${index}`}
                                        type="month"
                                        value={exp.endDate || ""}
                                        onChange={(e) => handleUpdate(index, "endDate", e.target.value)}
                                        disabled={exp.isCurrent}
                                    />
                                    {errors[`${index}.endDate`] && <p className="text-sm text-destructive">{errors[`${index}.endDate`]}</p>}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`isCurrent-${index}`}
                                    checked={exp.isCurrent}
                                    onCheckedChange={(checked) => handleUpdate(index, "isCurrent", checked)}
                                />
                                <Label htmlFor={`isCurrent-${index}`}>I currently work here</Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`description-${index}`}>Description</Label>
                                <Textarea
                                    id={`description-${index}`}
                                    value={exp.description || ""}
                                    onChange={(e) => handleUpdate(index, "description", e.target.value)}
                                    placeholder="Describe your responsibilities and achievements"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                />
            </FormSection>

            <StepNavigation
                currentStep={3}
                totalSteps={10}
                onPrevious={onPrevious}
                onNext={handleNextStep}
            />
        </div>
    );
}
