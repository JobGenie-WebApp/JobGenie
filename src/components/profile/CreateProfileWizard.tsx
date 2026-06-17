"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CVUpload } from "./CVUpload";
import { IndustryStep } from "./steps/IndustryStep";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { ExperienceStep } from "./steps/ExperienceStep";
import { EducationStep } from "./steps/EducationStep";
import { AwardsStep } from "./steps/AwardsStep";
import { ProjectsStep } from "./steps/ProjectsStep";
import { FinanceEducationStep } from "./steps/FinanceEducationStep";
import { BankingEducationStep } from "./steps/BankingEducationStep";
import { SummaryStep } from "./steps/SummaryStep";
import { completeFullProfile, completeFullProfileWithCV } from "@/app/actions/profile";
import { IT_INDUSTRIES, BANKING_FINANCE_INDUSTRIES } from "@/lib/validations/profile-schema";
import type {
    CompleteProfileData,
    WorkExperienceData,
    EducationData,
    AwardData,
    ProjectData,
    CertificateData,
    FinanceAcademicEducationData,
    FinanceProfessionalEducationData,
    BankingAcademicEducationData,
    BankingProfessionalEducationData,
    BankingSpecializedTrainingData,
    CVExtractionResult,
    BasicInfoData,
} from "@/lib/validations/profile-schema";
import { CertificatesStep } from "./steps";

interface CreateProfileWizardProps {
    userId: string;
    initialData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address?: string;
        country?: string;
        industry?: string;
    };
}

/** Gemini may return YYYY-MM-DD; <input type="month"> only accepts YYYY-MM. */
function cvExtractedDateToMonthValue(value: string | null | undefined): string {
    if (!value) return "";
    const m = String(value).trim().match(/^(\d{4})-(\d{2})(?:-\d{2})?/);
    return m ? `${m[1]}-${m[2]}` : "";
}

type Step = {
    id: string;
    title: string;
    visible: boolean;
};

export function CreateProfileWizard({ userId, initialData }: CreateProfileWizardProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [industry, setIndustry] = useState<string>(initialData.industry || "");
    const [cvUploaded, setCvUploaded] = useState(false);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        alternativePhone: "",
        address: initialData.address || "",
        country: initialData.country || "",
        currentPosition: "",
        yearsOfExperience: 0,
        experienceLevel: "entry",
        expectedMonthlySalary: 0,
        availabilityStatus: "available",
        noticePeriod: "immediate",
        employmentType: "full_time",
        expectedPositions: [],
    });
    const [professionalSummary, setProfessionalSummary] = useState("");
    const [workExperiences, setWorkExperiences] = useState<WorkExperienceData[]>([]);
    const [educations, setEducations] = useState<EducationData[]>([]);
    const [awards, setAwards] = useState<AwardData[]>([]);
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [certificates, setCertificates] = useState<CertificateData[]>([]);
    // Finance education
    const [financeAcademicEducation, setFinanceAcademicEducation] = useState<FinanceAcademicEducationData[]>([]);
    const [financeProfessionalEducation, setFinanceProfessionalEducation] = useState<FinanceProfessionalEducationData[]>([]);

    // Banking education  
    const [bankingAcademicEducation, setBankingAcademicEducation] = useState<BankingAcademicEducationData[]>([]);
    const [bankingProfessionalEducation, setBankingProfessionalEducation] = useState<BankingProfessionalEducationData[]>([]);
    const [bankingSpecializedTraining, setBankingSpecializedTraining] = useState<BankingSpecializedTrainingData[]>([]);

    // Determine visible steps based on industry
    const isITIndustry = IT_INDUSTRIES.includes(industry as typeof IT_INDUSTRIES[number]);
    const isFinanceIndustry = industry === "finance_investment";
    const isBankingIndustry = industry === "banking";

    const steps: Step[] = [
        { id: "industry", title: "Industry & CV", visible: true },
        { id: "basic", title: "Basic Info", visible: true },
        { id: "experience", title: "Experience", visible: true },
        // Standard education only for IT and other industries (not Finance/Banking)
        { id: "education", title: "Education", visible: !isFinanceIndustry && !isBankingIndustry },
        // Industry-specific education replaces standard education
        { id: "financeEducation", title: "Education", visible: isFinanceIndustry },
        { id: "bankingEducation", title: "Education", visible: isBankingIndustry },
        { id: "projects", title: "Projects", visible: isITIndustry },
        { id: "certificates", title: "Certificates", visible: isITIndustry },
        { id: "awards", title: "Awards", visible: true },
        { id: "summary", title: "Summary", visible: true },
    ].filter((step) => step.visible);

    const totalSteps = steps.length;
    const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

    const handleCVExtracted = useCallback((data: CVExtractionResult) => {
        setCvUploaded(true);

        // Populate form fields from extracted data (excluding name and email as they come from registration)
        if (data.phone) setBasicInfo((prev) => ({ ...prev, phone: data.phone! }));
        if (data.address) setBasicInfo((prev) => ({ ...prev, address: data.address! }));
        if (data.currentPosition) setBasicInfo((prev) => ({ ...prev, currentPosition: data.currentPosition! }));
        if (data.yearsOfExperience) setBasicInfo((prev) => ({ ...prev, yearsOfExperience: data.yearsOfExperience! }));
        if (data.professionalSummary) setProfessionalSummary(data.professionalSummary);

        // Work experiences
        if (data.workExperiences?.length) {
            setWorkExperiences(
                data.workExperiences.map((exp) => ({
                    jobTitle: exp.jobTitle || "",
                    company: exp.company || "",
                    employmentType: "full_time" as const,
                    locationType: "onsite" as const,
                    startDate: cvExtractedDateToMonthValue(exp.startDate),
                    endDate: exp.endDate ? cvExtractedDateToMonthValue(exp.endDate) || null : null,
                    description: exp.description || "",
                    isCurrent: exp.isCurrent || false,
                }))
            );
        }

        // Educations - Map to standard educations AND industry-specific states
        if (data.educations?.length) {
            const academicEdus: FinanceAcademicEducationData[] = [];
            const professionalEdus: FinanceProfessionalEducationData[] = [];
            const standardEdus: EducationData[] = [];

            data.educations.forEach((edu) => {
                const status = (edu.status?.toLowerCase() === "complete" || edu.status?.toLowerCase() === "completed")
                    ? "general" as const
                    : "incomplete" as const;

                const type = (edu.educationType?.toLowerCase() === "professional") ? "professional" as const : "academic" as const;

                // For standard education list (used by IT/Other)
                standardEdus.push({
                    educationType: type,
                    degreeDiploma: type === "professional" ? (edu.professionalQualification || edu.degreeDiploma || "") : (edu.degreeDiploma || ""),
                    institution: edu.institution || "",
                    status
                });

                if (type === "academic") {
                    academicEdus.push({
                        degreeDiploma: edu.degreeDiploma || "",
                        institution: edu.institution || "",
                        status
                    });
                } else {
                    professionalEdus.push({
                        professionalQualification: edu.professionalQualification || edu.degreeDiploma || "",
                        institution: edu.institution || "",
                        status
                    });
                }
            });

            // Standard education (IT and other industries)
            setEducations(standardEdus);

            // Finance industry
            setFinanceAcademicEducation(academicEdus);
            setFinanceProfessionalEducation(professionalEdus);

            // Banking industry
            setBankingAcademicEducation(academicEdus);
            setBankingProfessionalEducation(professionalEdus);
        }

        // Certificates (for IT)
        if (data.certificates?.length) {
            setCertificates(
                data.certificates.map((cert) => ({
                    certificateName: cert.certificateName || "",
                    issuingAuthority: cert.issuingAuthority || "",
                    issueDate: cert.issueDate || "",
                }))
            );
        }

        // Projects (for IT)
        if (data.projects?.length) {
            setProjects(
                data.projects.map((proj) => ({
                    projectName: proj.projectName || "",
                    description: proj.description || "",
                    demoUrl: proj.demoUrl || "",
                    isCurrent: false,
                }))
            );
        }

        // Awards/Achievements
        if (data.awards?.length) {
            setAwards(
                data.awards.map((award) => ({
                    natureOfAward: award.awardName || "",
                    offeredBy: award.offeredBy || "",
                    description: award.description || "",
                }))
            );
        }

        // Move to next step
        setCurrentStep(1);
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((prev) => prev + 1);
            setError(null);
        }
    }, [currentStep, totalSteps]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
            setError(null);
        }
    }, [currentStep]);

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Strip out any incomplete education rows before submission (safety net)
            // They must have BOTH institution and degree/qualification
            const cleanedEducations = educations.filter(
                (edu) => edu.institution.trim() !== "" && edu.degreeDiploma.trim() !== ""
            );

            const cleanedFinanceAcademic = financeAcademicEducation.filter(
                (edu) => edu.institution.trim() !== "" && edu.degreeDiploma.trim() !== ""
            );

            const cleanedFinanceProf = financeProfessionalEducation.filter(
                (edu) => edu.institution.trim() !== "" && edu.professionalQualification.trim() !== ""
            );

            const cleanedBankingAcademic = bankingAcademicEducation.filter(
                (edu) => edu.institution.trim() !== "" && edu.degreeDiploma.trim() !== ""
            );

            const cleanedBankingProf = bankingProfessionalEducation.filter(
                (edu) => edu.institution.trim() !== "" && edu.professionalQualification.trim() !== ""
            );

            const cleanedBankingSpecial = bankingSpecializedTraining.filter(
                (edu) => edu.issuingAuthority.trim() !== "" && edu.certificateName.trim() !== ""
            );

            // If not IT/Other industry, standard educations shouldn't be submitted
            const finalEducations = (isFinanceIndustry || isBankingIndustry) ? [] : cleanedEducations;

            const profileData: CompleteProfileData = {
                industry: industry as CompleteProfileData["industry"],
                basicInfo,
                professionalSummary,
                workExperiences,
                educations: finalEducations,
                awards,
                projects: isITIndustry ? projects : undefined,
                certificates: isITIndustry ? certificates : undefined,
                financeAcademicEducation: isFinanceIndustry ? cleanedFinanceAcademic : undefined,
                financeProfessionalEducation: isFinanceIndustry ? cleanedFinanceProf : undefined,
                bankingAcademicEducation: isBankingIndustry ? cleanedBankingAcademic : undefined,
                bankingProfessionalEducation: isBankingIndustry ? cleanedBankingProf : undefined,
                bankingSpecializedTraining: isBankingIndustry ? cleanedBankingSpecial : undefined,
            };

            const formData = new FormData();
            formData.append("profileData", JSON.stringify(profileData));

            if (cvFile) {
                formData.append("cvFile", cvFile);
            }

            if (profileImageFile) {
                formData.append("profileImageFile", profileImageFile);
            }

            // Show progress toast
            if (cvFile) {
                toast.info("Uploading your CV and generating standardized format...", {
                    duration: 5000,
                });
            } else {
                toast.info("Creating your profile...");
            }

            // Use the new action that handles CV upload and transaction
            const result = await completeFullProfileWithCV(formData);

            if (result.success) {
                toast.success(result.message || "Profile completed successfully!");
                setTimeout(() => {
                    window.location.href = "/candidate/dashboard";
                }, 1000);
            } else {
                // Display field-specific errors
                if (result.errors && Object.keys(result.errors).length > 0) {
                    // Show each field error
                    Object.entries(result.errors).forEach(([field, messages]) => {
                        const errorMessage = Array.isArray(messages) ? messages.join(", ") : messages;
                        toast.error(`${field}: ${errorMessage}`);
                    });
                } else {
                    // Fallback to generic message
                    toast.error(result.message || "Failed to complete profile. Please try again.");
                }
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            console.error("Profile submission error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [
        userId, industry, basicInfo, professionalSummary, workExperiences,
        educations, awards, projects, certificates, financeAcademicEducation,
        financeProfessionalEducation, bankingAcademicEducation, bankingProfessionalEducation,
        bankingSpecializedTraining, isITIndustry, isFinanceIndustry, isBankingIndustry,
        bankingSpecializedTraining, isITIndustry, isFinanceIndustry, isBankingIndustry,
        cvFile, profileImageFile, router
    ]);

    const renderStep = () => {
        const stepId = steps[currentStep]?.id;

        switch (stepId) {
            case "industry":
                return (
                    <IndustryStep
                        industry={industry}
                        onIndustryChange={setIndustry}
                        onCVExtracted={handleCVExtracted}
                        onFileSelect={setCvFile}
                        onSkipCV={() => setCurrentStep(1)}
                        onNext={handleNext}
                    />
                );
            case "basic":
                return (
                    <BasicInfoStep
                        data={basicInfo}
                        onChange={setBasicInfo}
                        onImageSelect={setProfileImageFile}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        industry={industry}
                    />
                );
            case "experience":
                return (
                    <ExperienceStep
                        experiences={workExperiences}
                        onChange={setWorkExperiences}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                );
            case "education":
                return (
                    <EducationStep
                        educations={educations}
                        onChange={setEducations}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                );
            case "awards":
                return (
                    <AwardsStep
                        awards={awards}
                        onChange={setAwards}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                );
            case "projects":
                return (
                    <ProjectsStep
                        projects={projects}
                        onChange={setProjects}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                );
            case "certificates":
                return (
                    <CertificatesStep
                        certificates={certificates}
                        onChange={setCertificates}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                );
            case "financeEducation":
                return (
                    <FinanceEducationStep
                        academicEducation={financeAcademicEducation}
                        professionalEducation={financeProfessionalEducation}
                        onAcademicChange={setFinanceAcademicEducation}
                        onProfessionalChange={setFinanceProfessionalEducation}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                );
            case "bankingEducation":
                return (
                    <BankingEducationStep
                        academicEducation={bankingAcademicEducation}
                        professionalEducation={bankingProfessionalEducation}
                        specializedTraining={bankingSpecializedTraining}
                        onAcademicChange={setBankingAcademicEducation}
                        onProfessionalChange={setBankingProfessionalEducation}
                        onSpecializedChange={setBankingSpecializedTraining}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                );
            case "summary":
                return (
                    <SummaryStep
                        industry={industry}
                        basicInfo={basicInfo}
                        professionalSummary={professionalSummary}
                        onSummaryChange={setProfessionalSummary}
                        workExperiences={workExperiences}
                        educations={educations}
                        awards={awards}
                        projects={isITIndustry ? projects : undefined}
                        certificates={isITIndustry ? certificates : undefined}
                        financeAcademicEducation={isFinanceIndustry ? financeAcademicEducation : undefined}
                        financeProfessionalEducation={isFinanceIndustry ? financeProfessionalEducation : undefined}
                        bankingAcademicEducation={isBankingIndustry ? bankingAcademicEducation : undefined}
                        bankingProfessionalEducation={isBankingIndustry ? bankingProfessionalEducation : undefined}
                        bankingSpecializedTraining={isBankingIndustry ? bankingSpecializedTraining : undefined}
                        onSubmit={handleSubmit}
                        onPrevious={handlePrevious}
                        isLoading={isLoading}
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
                        <CardTitle className="text-base">
                            {steps[currentStep]?.title}
                        </CardTitle>
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

            {/* Error Message */}
            {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Current Step Content */}
            {renderStep()}
        </div>
    );
}
