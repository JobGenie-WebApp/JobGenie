"use client";

import { Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSection } from "../shared/FormSection";
import { DynamicList } from "../shared/DynamicList";
import { StepNavigation } from "../shared/StepNavigation";
import type { AwardData } from "@/lib/validations/profile-schema";
import { awardSchema } from "@/lib/validations/profile-schema";
import { useState } from "react";
import { z } from "zod";

interface AwardsStepProps {
    awards: AwardData[];
    onChange: (awards: AwardData[]) => void;
    onNext: () => void;
    onPrevious: () => void;
}

const emptyAward: AwardData = {
    natureOfAward: "",
    offeredBy: "",
    description: "",
};

export function AwardsStep({ awards, onChange, onNext, onPrevious }: AwardsStepProps) {
    const handleAdd = () => {
        onChange([...awards, { ...emptyAward }]);
    };

    const handleRemove = (index: number) => {
        onChange(awards.filter((_, i) => i !== index));
    };

    const handleUpdate = (index: number, field: keyof AwardData, value: string) => {
        const updated = [...awards];
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
        const result = z.array(awardSchema).safeParse(awards);
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
                title="Awards & Achievements"
                description="Highlight your recognitions and accomplishments (optional)"
            >
                <DynamicList
                    items={awards}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    addLabel="Add Award"
                    emptyMessage="No awards added yet. This section is optional."
                    maxItems={100}
                    renderItem={(award, index) => (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`natureOfAward-${index}`}>
                                    Award Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id={`natureOfAward-${index}`}
                                    value={award.natureOfAward}
                                    onChange={(e) => handleUpdate(index, "natureOfAward", e.target.value)}
                                    placeholder="e.g., Employee of the Year"
                                />
                                {errors[`${index}.natureOfAward`] && <p className="text-sm text-destructive">{errors[`${index}.natureOfAward`]}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`offeredBy-${index}`}>Offered By</Label>
                                <Input
                                    id={`offeredBy-${index}`}
                                    value={award.offeredBy || ""}
                                    onChange={(e) => handleUpdate(index, "offeredBy", e.target.value)}
                                    placeholder="Organization or institution"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`description-${index}`}>Description</Label>
                                <Textarea
                                    id={`description-${index}`}
                                    value={award.description || ""}
                                    onChange={(e) => handleUpdate(index, "description", e.target.value)}
                                    placeholder="Brief description of the achievement"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}
                />
            </FormSection>

            <StepNavigation
                currentStep={5}
                totalSteps={10}
                onPrevious={onPrevious}
                onNext={handleNextStep}
            />
        </div>
    );
}
