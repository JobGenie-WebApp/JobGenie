"use client";

import { useState, useCallback, useEffect } from "react";
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
import { SummaryStep } from "./steps/SummaryStep";
import { completeFullProfile, completeFullProfileWithCV } from "@/app/actions/profile";
import {
    ACADEMIC_EDUCATION_STATUSES,
    IT_INDUSTRIES,
    PROFESSIONAL_EDUCATION_STATUSES,
} from "@/lib/validations/profile-schema";
import { CV_FIXED_VALUES } from "@/lib/cv-extraction-prompt";
import type {
    CompleteProfileData,
    WorkExperienceData,
    EducationData,
    AwardData,
    ProjectData,
    CertificateData,
    CVExtractionResult,
    BasicInfoData,
} from "@/lib/validations/profile-schema";
import { CertificatesStep } from "./steps";
import {
    cvExtractedDateToMonthValue,
    experienceLevelFromYears,
    latestJobTitle,
    matchFromList,
    normalizeLkPhone,
    pickOption,
    toIsoDate,
    totalYearsOfExperience,
} from "@/lib/cv-derive";

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
    /** Country names from the `countries` table, loaded by the page (server-side). */
    countries: string[];
}

type Step = {
    id: string;
    title: string;
    visible: boolean;
};

export function CreateProfileWizard({ userId, initialData, countries }: CreateProfileWizardProps) {
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

    // Determine visible steps based on industry
    const isITIndustry = IT_INDUSTRIES.includes(industry as typeof IT_INDUSTRIES[number]);

    const steps: Step[] = [
        { id: "industry", title: "Industry & CV", visible: true },
        { id: "basic", title: "Basic Info", visible: true },
        { id: "experience", title: "Experience", visible: true },
        // One education step for every industry - academic and professional qualifications.
        { id: "education", title: "Education", visible: true },
        { id: "projects", title: "Projects", visible: isITIndustry },
        { id: "certificates", title: "Certificates", visible: isITIndustry },
        { id: "awards", title: "Awards", visible: true },
        { id: "summary", title: "Summary", visible: true },
    ].filter((step) => step.visible);

    const totalSteps = steps.length;
    const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

    // Years of experience is a total of the whole work history, but the CV extraction below only
    // ever set it once - so every role the candidate added, corrected or re-dated afterwards went
    // uncounted. Re-derive it whenever the history changes, and leave a typed-in value alone when
    // there is nothing dated to derive from.
    useEffect(() => {
        const years = totalYearsOfExperience(workExperiences);
        if (!years) return;
        setBasicInfo((prev) =>
            prev.yearsOfExperience === years
                ? prev
                : { ...prev, yearsOfExperience: years, experienceLevel: experienceLevelFromYears(years) }
        );
    }, [workExperiences]);

    const handleCVExtracted = useCallback((data: CVExtractionResult) => {
        setCvUploaded(true);

        // Name and email stay as registered; everything else the CV can supply is filled in here.
        // Each value is normalised or checked against the wizard's own options first, so what lands
        // in state is something the field can actually hold - a phone the schema accepts, a country
        // and job title that exist in their lists, an enum the select can show.
        const extractedExps = data.workExperiences ?? [];
        const currentPosition = data.currentPosition || latestJobTitle(extractedExps);
        // Derived, and we know today's date where the model does not - so ours wins.
        const yearsOfExperience = totalYearsOfExperience(extractedExps) || data.yearsOfExperience || 0;
        const phone = normalizeLkPhone(data.phone);
        const alternativePhone = normalizeLkPhone(data.alternativePhone);
        const country = matchFromList(data.country, countries);
        const expectedPositions = (data.expectedPositions ?? [])
            .map((p) => (p || "").trim())
            .filter(Boolean)
            .slice(0, 3);

        setBasicInfo((prev) => ({
            ...prev,
            ...(phone && { phone }),
            ...(alternativePhone && { alternativePhone }),
            ...(data.address && { address: data.address }),
            ...(country && { country }),
            ...(currentPosition && { currentPosition }),
            ...(yearsOfExperience && {
                yearsOfExperience,
                experienceLevel: experienceLevelFromYears(yearsOfExperience),
            }),
            ...(data.highestQualification && {
                highestQualification: pickOption(
                    data.highestQualification,
                    CV_FIXED_VALUES.highestQualification,
                    "bachelors_degree"
                ) as BasicInfoData["highestQualification"],
            }),
            ...(data.noticePeriod && {
                noticePeriod: pickOption(data.noticePeriod, CV_FIXED_VALUES.noticePeriod, "immediate"),
            }),
            ...(data.expectedMonthlySalary && { expectedMonthlySalary: data.expectedMonthlySalary }),
            // expectedPositions is a required field the CV never states outright, so an empty
            // list here would block submission until the candidate noticed it themselves.
            ...(expectedPositions.length
                ? { expectedPositions }
                : currentPosition && { expectedPositions: [currentPosition] }),
        }));
        if (data.professionalSummary) setProfessionalSummary(data.professionalSummary);

        // Work experiences
        if (data.workExperiences?.length) {
            setWorkExperiences(
                data.workExperiences.map((exp) => ({
                    jobTitle: exp.jobTitle || "",
                    company: exp.company || "",
                    employmentType: pickOption(exp.employmentType, CV_FIXED_VALUES.employmentType, "full_time"),
                    location: exp.location || "",
                    locationType: pickOption(exp.locationType, CV_FIXED_VALUES.locationType, "onsite"),
                    startDate: cvExtractedDateToMonthValue(exp.startDate),
                    endDate: exp.endDate ? cvExtractedDateToMonthValue(exp.endDate) || null : null,
                    description: exp.description || "",
                    isCurrent: exp.isCurrent || false,
                }))
            );
        }

        // Educations - academic and professional, same list for every industry
        if (data.educations?.length) {
            setEducations(
                data.educations.map((edu) => {
                    const type = edu.educationType?.toLowerCase() === "professional" ? "professional" as const : "academic" as const;
                    // Statuses differ per type, and the academic list carries the degree class -
                    // check the model's answer against the list the Select will actually render.
                    const status = type === "professional"
                        ? pickOption(edu.status, PROFESSIONAL_EDUCATION_STATUSES.map((o) => o.value), "completed")
                        : pickOption(edu.status, ACADEMIC_EDUCATION_STATUSES.map((o) => o.value), "general");

                    return {
                        educationType: type,
                        degreeDiploma: type === "professional"
                            ? (edu.professionalQualification || edu.degreeDiploma || "")
                            : (edu.degreeDiploma || edu.professionalQualification || ""),
                        institution: edu.institution || "",
                        status,
                    };
                })
            );
        }

        // Certificates (for IT)
        if (data.certificates?.length) {
            setCertificates(
                data.certificates.map((cert) => ({
                    certificateName: cert.certificateName || "",
                    issuingAuthority: cert.issuingAuthority || "",
                    issueDate: toIsoDate(cert.issueDate),
                    expiryDate: toIsoDate(cert.expiryDate),
                    credentialId: cert.credentialId || "",
                    credentialUrl: cert.credentialUrl || "",
                    description: cert.description || "",
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
                    isCurrent: proj.isCurrent || false,
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
    }, [countries]);

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
            // Education rows need BOTH institution and qualification to save. Fully blank rows are
            // dropped silently, but a half-filled row means a CV-extracted qualification is about to
            // vanish without the candidate ever being told - surface those instead of deleting them.
            const incompleteSections: string[] = [];
            const keepComplete = <T,>(rows: T[], section: string, required: (row: T) => string[]) =>
                rows.filter((row) => {
                    const values = required(row).map((v) => (v || "").trim());
                    if (values.every((v) => v === "")) return false;
                    if (values.some((v) => v === "")) {
                        incompleteSections.push(section);
                        return false;
                    }
                    return true;
                });

            const cleanedEducations = keepComplete(educations, "Education",
                (e) => [e.institution, e.degreeDiploma]);

            if (incompleteSections.length > 0) {
                const sections = [...new Set(incompleteSections)].join(", ");
                const message = `Some ${sections} entries are missing a qualification name or an institution. Please complete or remove them before submitting.`;
                setError(message);
                toast.error(message);
                return;
            }

            const profileData: CompleteProfileData = {
                industry: industry as CompleteProfileData["industry"],
                basicInfo,
                professionalSummary,
                workExperiences,
                educations: cleanedEducations,
                awards,
                projects: isITIndustry ? projects : undefined,
                certificates: isITIndustry ? certificates : undefined,
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
        educations, awards, projects, certificates, isITIndustry,
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
                        countries={countries}
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
