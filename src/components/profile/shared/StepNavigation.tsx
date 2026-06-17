"use client";

import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepNavigationProps {
    currentStep: number;
    totalSteps: number;
    onPrevious: () => void;
    onNext: () => void;
    onSave?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
    isLoading?: boolean;
    nextLabel?: string;
    canProceed?: boolean;
}

export function StepNavigation({
    currentStep,
    totalSteps,
    onPrevious,
    onNext,
    onSave,
    isFirstStep = false,
    isLastStep = false,
    isLoading = false,
    nextLabel,
    canProceed = true,
}: StepNavigationProps) {
    return (
        <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
            </div>
            <div className="flex gap-2">
                {!isFirstStep && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onPrevious}
                        disabled={isLoading}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                )}
                {onSave && !isLastStep && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onSave}
                        disabled={isLoading}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                    </Button>
                )}
                <Button
                    type="button"
                    onClick={onNext}
                    disabled={isLoading || !canProceed}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isLastStep ? "Saving..." : "Processing..."}
                        </>
                    ) : (
                        <>
                            {nextLabel || (isLastStep ? "Complete Profile" : "Next")}
                            {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
