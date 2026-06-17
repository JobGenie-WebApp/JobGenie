"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CompanyDetailsStep } from "./steps/CompanyDetailsStep";
import { EmployerDetailsStep } from "./steps/EmployerDetailsStep";
import { completeEmployerProfile, type ProfileData } from "@/app/actions/employer-profile";
import { createClient } from "@/lib/supabase/client";

interface EmployerProfileWizardProps {
    initialData: ProfileData;
    isSuperAdmin: boolean;
}

export function EmployerProfileWizard({ initialData, isSuperAdmin }: EmployerProfileWizardProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Company Data
    const [companyData, setCompanyData] = useState({
        description: initialData.company.description || "",
        company_size: initialData.company.company_size || "",
        website: initialData.company.website || "",
        headoffice_location: initialData.company.headoffice_location || "",
        logo_url: initialData.company.logo_url || "",
    });

    // Step 2: Employer Data
    const [employerData, setEmployerData] = useState({
        department: initialData.employer.department || "",
        address: initialData.employer.address || "",
        phone: initialData.employer.phone || "",
    });

    // File states (will be uploaded during submission)
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);

    // Only super admins see company details step
    const steps = isSuperAdmin
        ? [
            { id: "company", title: "Company Details" },
            { id: "employer", title: "Your Details" },
        ]
        : [
            { id: "employer", title: "Your Details" },
        ];

    const totalSteps = steps.length;
    const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

    const handleNext = useCallback(() => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    }, [currentStep, totalSteps]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    }, [currentStep]);

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);

        try {
            // Get current user from Supabase
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Session expired. Please log in again.");
                router.push("/employer/login");
                return;
            }

            let uploadedLogoUrl = "";

            // Step 1: Upload company logo if provided
            if (companyLogoFile) {
                toast.info("Uploading company logo...");

                const logoFormData = new FormData();
                logoFormData.append("file", companyLogoFile);
                logoFormData.append("bucket", "company-logos");

                const logoResponse = await fetch("/api/upload", {
                    method: "POST",
                    body: logoFormData,
                });

                if (!logoResponse.ok) {
                    throw new Error("Failed to upload company logo");
                }

                const logoData = await logoResponse.json();
                uploadedLogoUrl = logoData.url;
            }

            // Step 2: Update profiles with uploaded URLs
            // Only update company data if user is super admin
            const updatedCompanyData = isSuperAdmin ? {
                description: companyData.description,
                company_size: companyData.company_size as "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+",
                website: companyData.website || "",
                headoffice_location: companyData.headoffice_location,
                logo_url: uploadedLogoUrl || companyData.logo_url || "",
            } : null;

            const updatedEmployerData = {
                department: employerData.department || "",
                address: employerData.address || "",
                phone: employerData.phone || "",
            };

            const result = await completeEmployerProfile(updatedCompanyData, updatedEmployerData);

            if (result.success) {
                toast.success(result.message);
                // Redirect to dashboard
                setTimeout(() => {
                    router.push("/employer/dashboard");
                    router.refresh();
                }, 1000);
            } else {
                // Profile update failed - clean up uploaded files
                if (uploadedLogoUrl) {
                    await fetch("/api/delete-file", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileUrl: uploadedLogoUrl }),
                    });
                }

                // Display field-specific errors
                if (result.errors && Object.keys(result.errors).length > 0) {
                    Object.entries(result.errors).forEach(([field, messages]) => {
                        const errorMessage = Array.isArray(messages) ? messages.join(", ") : messages;
                        toast.error(`${field}: ${errorMessage}`);
                    });
                } else {
                    toast.error(result.message);
                }
            }
        } catch (err) {
            console.error("Profile completion error:", err);
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [companyData, employerData, companyLogoFile, initialData.employer.id, router, isSuperAdmin]);

    const renderStep = () => {
        const stepId = steps[currentStep]?.id;

        switch (stepId) {
            case "company":
                return (
                    <CompanyDetailsStep
                        data={companyData}
                        onChange={setCompanyData}
                        onFileSelect={setCompanyLogoFile}
                        onNext={handleNext}
                        companyName={initialData.company.company_name}
                    />
                );
            case "employer":
                return (
                    <EmployerDetailsStep
                        data={employerData}
                        onChange={setEmployerData}
                        onPrevious={handlePrevious}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        employerName={`${initialData.employer.first_name} ${initialData.employer.last_name}`}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress Header */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{steps[currentStep]?.title}</CardTitle>
                        <span className="text-sm text-muted-foreground">
                            Step {currentStep + 1} of {totalSteps}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="pb-4">
                    <Progress value={progress} className="h-2" />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        {steps.map((step, index) => (
                            <span
                                key={step.id}
                                className={index <= currentStep ? "text-primary font-medium" : ""}
                            >
                                {index + 1}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Current Step Content */}
            {renderStep()}
        </div>
    );
}
