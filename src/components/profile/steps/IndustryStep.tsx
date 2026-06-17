"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CVUpload } from "../CVUpload";
import { INDUSTRY_OPTIONS } from "@/lib/validations/profile-schema";
import type { CVExtractionResult } from "@/lib/validations/profile-schema";
import { cn } from "@/lib/utils";

interface IndustryStepProps {
    industry: string;
    onIndustryChange: (industry: string) => void;
    onCVExtracted: (data: CVExtractionResult) => void;
    onFileSelect: (file: File | null) => void;
    onSkipCV: () => void;
    onNext: () => void;
}

export function IndustryStep({
    industry,
    onIndustryChange,
    onCVExtracted,
    onFileSelect,
    onSkipCV,
    onNext,
}: IndustryStepProps) {
    const [showCVUpload, setShowCVUpload] = useState(false);

    const handleIndustrySelect = (value: string) => {
        onIndustryChange(value);
    };

    const handleContinue = () => {
        if (industry) {
            setShowCVUpload(true);
        }
    };

    if (showCVUpload) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Upload Your CV
                        </CardTitle>
                        <CardDescription>
                            Upload your CV to auto-fill your profile, or skip to enter manually
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CVUpload
                            onExtracted={onCVExtracted}
                            onFileSelect={onFileSelect}
                            onSkip={onSkipCV}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-start">
                    <Button
                        variant="ghost"
                        onClick={() => setShowCVUpload(false)}
                    >
                        Back to Industry Selection
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Select Your Industry
                </CardTitle>
                <CardDescription>
                    Choose the industry that best matches your profession. This will customize your profile sections.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <RadioGroup
                    value={industry}
                    onValueChange={handleIndustrySelect}
                    className="grid gap-3 md:grid-cols-2"
                >
                    {INDUSTRY_OPTIONS.map((option) => (
                        <Label
                            key={option.value}
                            htmlFor={option.value}
                            className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                                industry === option.value
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                            )}
                        >
                            <RadioGroupItem value={option.value} id={option.value} />
                            <span className="font-medium">{option.label}</span>
                        </Label>
                    ))}
                </RadioGroup>

                <div className="flex justify-end pt-4 border-t">
                    <Button
                        onClick={handleContinue}
                        disabled={!industry}
                    >
                        Continue
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
