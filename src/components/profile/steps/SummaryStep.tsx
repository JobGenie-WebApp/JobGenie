"use client";

import { useState } from "react";
import { FileCheck2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormSection } from "../shared/FormSection";
import { StepNavigation } from "../shared/StepNavigation";
import { generateProfessionalSummary } from "@/app/actions/extract-cv";
import { cn } from "@/lib/utils";
import { INDUSTRY_OPTIONS, IT_INDUSTRIES } from "@/lib/validations/profile-schema";
import type {
    BasicInfoData,
    WorkExperienceData,
    EducationData,
    AwardData,
    ProjectData,
    CertificateData,
} from "@/lib/validations/profile-schema";

const SUMMARY_MAX_LENGTH = 1000;

interface SummaryStepProps {
    industry: string;
    basicInfo: BasicInfoData;
    professionalSummary: string;
    onSummaryChange: (summary: string) => void;
    workExperiences: WorkExperienceData[];
    educations: EducationData[];
    awards: AwardData[];
    projects?: ProjectData[];
    certificates?: CertificateData[];
    onSubmit: () => void;
    onPrevious: () => void;
    isLoading: boolean;
}

export function SummaryStep({
    industry,
    basicInfo,
    professionalSummary,
    onSummaryChange,
    workExperiences,
    educations,
    awards,
    projects,
    certificates,
    onSubmit,
    onPrevious,
    isLoading,
}: SummaryStepProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const industryLabel = INDUSTRY_OPTIONS.find((i) => i.value === industry)?.label || industry;

    const experienceLevelLabels: Record<string, string> = {
        entry: "Entry",
        junior: "Junior",
        mid: "Mid",
        senior: "Senior",
        lead: "Lead",
        principal: "Principal",
    };

    const availabilityLabels: Record<string, string> = {
        available: "Available",
        open_to_opportunities: "Open to opportunities",
        not_looking: "Not looking",
    };

    const employmentTypeLabels: Record<string, string> = {
        full_time: "Full time",
        part_time: "Part time",
        contract: "Contract",
        internship: "Internship",
        freelance: "Freelance",
        volunteer: "Volunteer",
    };

    const qualificationLabels: Record<string, string> = {
        bachelors_degree: "Bachelor's Degree",
        masters_degree: "Master's Degree",
        doctorate_phd: "Doctorate / PhD",
        undergraduate: "Undergraduate",
        post_graduate: "Post Graduate",
        diploma: "Diploma",
        certificate: "Certificate",
        professional_certification: "Professional Certification",
        vocational_training: "Vocational Training",
        no_formal_education: "No Formal Education",
    };

    const handleGenerateSummary = async () => {
        setIsGenerating(true);
        setGenerationError(null);

        try {
            // No banking skills anymore - removed

            const result = await generateProfessionalSummary(
                workExperiences.map((exp) => ({
                    jobTitle: exp.jobTitle,
                    company: exp.company,
                    description: exp.description,
                })),
                [], // skills array - empty now
                basicInfo.currentPosition,
                basicInfo.yearsOfExperience,
                industryLabel
            );

            if (result.success && result.summary) {
                onSummaryChange(result.summary);
            } else {
                setGenerationError(result.error || "Failed to generate summary");
            }
        } catch (error) {
            setGenerationError("An error occurred while generating summary");
            console.error("Summary generation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Matches professionalSummary in profile-schema: min 50, max 1000. Without the upper bound the
    // candidate only found out they were over the limit when the server action rejected the submit.
    const canSubmit = professionalSummary.length >= 50 && professionalSummary.length <= SUMMARY_MAX_LENGTH;
    const overLimitBy = professionalSummary.length - SUMMARY_MAX_LENGTH;

    const validWorkExperiences = [...workExperiences]
        .filter(e => e.jobTitle || e.company)
        .sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateB - dateA;
        });
    const validEducations = [...educations].filter(e => e.degreeDiploma || e.institution).reverse();
    const validAwards = [...awards].filter(a => a.natureOfAward).reverse();
    const validProjects = [...(projects || [])].filter(p => p.projectName).reverse();
    const validCertificates = [...(certificates || [])]
        .filter(c => c.certificateName)
        .sort((a, b) => {
            const dateA = a.issueDate ? new Date(a.issueDate).getTime() : 0;
            const dateB = b.issueDate ? new Date(b.issueDate).getTime() : 0;
            return dateB - dateA;
        });
    return (
        <div className="space-y-6">
            {/* Profile Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCheck2 className="h-5 w-5" />
                        Profile Summary
                    </CardTitle>
                    <CardDescription>
                        Review your profile information before submitting
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Basic Info Summary */}
                    <div>
                        <h4 className="font-medium mb-2">Personal Information</h4>
                        <div className="grid gap-2 text-sm text-muted-foreground">
                            <p><span className="font-medium text-foreground">{basicInfo.firstName} {basicInfo.lastName}</span></p>
                            <p>{basicInfo.email} • {basicInfo.phone}{basicInfo.alternativePhone ? ` • ${basicInfo.alternativePhone}` : ""}</p>
                            <p>{basicInfo.currentPosition} • {basicInfo.yearsOfExperience} years experience</p>
                            {basicInfo.address && <p>{basicInfo.address}</p>}
                            {basicInfo.country && <p>{basicInfo.country}</p>}
                            <p>Industry: <Badge variant="secondary">{industryLabel}</Badge></p>
                            <p>
                                Experience level: {experienceLevelLabels[basicInfo.experienceLevel] || basicInfo.experienceLevel}
                                {basicInfo.employmentType ? ` • ${employmentTypeLabels[basicInfo.employmentType] || basicInfo.employmentType}` : ""}
                            </p>
                            {basicInfo.expectedMonthlySalary != null && (
                                <p>Expected salary: {basicInfo.expectedMonthlySalary.toLocaleString()} / month</p>
                            )}
                            <p>
                                Availability: {availabilityLabels[basicInfo.availabilityStatus] || basicInfo.availabilityStatus}
                                {basicInfo.noticePeriod ? ` • Notice period: ${basicInfo.noticePeriod}` : ""}
                            </p>
                            {basicInfo.highestQualification && (
                                <p>Highest qualification: {qualificationLabels[basicInfo.highestQualification] || basicInfo.highestQualification}</p>
                            )}
                            {(basicInfo.expectedPositions ?? []).length > 0 && (
                                <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-foreground font-medium">Expected Positions:</span>
                                    {(basicInfo.expectedPositions ?? []).map((pos, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">{pos}</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Experience Summary */}
                    {validWorkExperiences.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">Experience ({validWorkExperiences.length})</h4>
                            <ul className="text-sm text-muted-foreground space-y-3">
                                {validWorkExperiences.map((exp, i) => (
                                    <li key={i}>
                                        <div className="font-medium text-foreground">• {exp.jobTitle}{exp.company ? ` at ${exp.company}` : ''}</div>
                                        <div>
                                            {exp.startDate ? `${exp.startDate} to ${exp.isCurrent ? 'Present' : exp.endDate || '...'}` : 'Date not specified'}
                                            {exp.location ? ` • ${exp.location}` : ''}
                                            {exp.employmentType ? ` • ${employmentTypeLabels[exp.employmentType] || exp.employmentType}` : ''}
                                        </div>
                                        {exp.description && <div className="text-sm text-muted-foreground">{exp.description}</div>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Education Summary */}
                    {validEducations.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">Education ({validEducations.length})</h4>
                            <ul className="text-sm text-muted-foreground space-y-3">
                                {validEducations.map((edu, i) => (
                                    <li key={i}>
                                        <div className="font-medium text-foreground">• {edu.degreeDiploma}</div>
                                        <div>
                                            {edu.institution ? ` ${edu.institution}` : ''}
                                            {edu.status ? ` • ${edu.status}` : ''}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Awards */}
                    {validAwards.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">Awards ({validAwards.length})</h4>
                            <ul className="text-sm text-muted-foreground space-y-3">
                                {validAwards.map((award, i) => (
                                    <li key={i}>
                                        <div className="font-medium text-foreground">• {award.natureOfAward}</div>
                                        <div>
                                            {award.offeredBy ? `Awarded by ${award.offeredBy}` : ''}
                                        </div>
                                        {award.description && <div className="text-sm text-muted-foreground">{award.description}</div>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* IT Specific */}
                    {validProjects.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">Projects ({validProjects.length})</h4>
                            <ul className="text-sm text-muted-foreground space-y-3">
                                {validProjects.map((proj, i) => (
                                    <li key={i}>
                                        <div className="font-medium text-foreground">• {proj.projectName}</div>
                                        {proj.demoUrl && <div>Demo: {proj.demoUrl}</div>}
                                        {proj.description && <div className="text-sm text-muted-foreground">{proj.description}</div>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {validCertificates.length > 0 && (IT_INDUSTRIES as readonly string[]).includes(industry) && (
                        <div>
                            <h4 className="font-medium mb-2">Certificates ({validCertificates.length})</h4>
                            <ul className="text-sm text-muted-foreground space-y-3">
                                {validCertificates.map((cert, i) => (
                                    <li key={i}>
                                        <div className="font-medium text-foreground">• {cert.certificateName}</div>
                                        <div>
                                            {cert.issuingAuthority ? `Issued by ${cert.issuingAuthority}` : ''}
                                            {cert.issueDate ? ` • ${cert.issueDate}` : ''}
                                            {cert.expiryDate ? ` • Expires ${cert.expiryDate}` : ''}
                                        </div>
                                        {cert.credentialUrl && <div className="text-sm text-muted-foreground">Credential: {cert.credentialUrl}</div>}
                                        {cert.description && <div className="text-sm text-muted-foreground">{cert.description}</div>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </CardContent>
            </Card>

            {/* Professional Summary */}
            <FormSection
                title="Professional Summary"
                description="Write a compelling summary or let AI generate one based on your profile"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="professionalSummary">
                                Summary <span className="text-destructive">*</span>
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateSummary}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate with AI
                                    </>
                                )}
                            </Button>
                        </div>
                        {/* A <textarea> cannot colour part of its own value, so the text is mirrored
                            into the div behind it and the textarea itself renders transparent. Both
                            sit in the same grid cell, which keeps them the same size as it grows. */}
                        <div className="grid">
                            <div
                                aria-hidden
                                className="pointer-events-none col-start-1 row-start-1 rounded-md border border-transparent px-3 py-2 text-base break-words whitespace-pre-wrap md:text-sm"
                            >
                                {professionalSummary.slice(0, SUMMARY_MAX_LENGTH)}
                                <span className="bg-destructive/15 text-destructive">
                                    {professionalSummary.slice(SUMMARY_MAX_LENGTH)}
                                </span>
                                {/* stops the mirror collapsing below the textarea on a trailing newline */}
                                {"\u200b"}
                            </div>
                            <Textarea
                                id="professionalSummary"
                                value={professionalSummary}
                                onChange={(e) => onSummaryChange(e.target.value)}
                                placeholder="Write a compelling professional summary (minimum 50 characters)..."
                                rows={5}
                                aria-invalid={overLimitBy > 0}
                                aria-describedby="professionalSummaryCount"
                                className="col-start-1 row-start-1 bg-transparent text-transparent caret-foreground selection:bg-primary/30 dark:bg-transparent"
                            />
                        </div>
                        <p
                            id="professionalSummaryCount"
                            className={cn("text-xs", overLimitBy > 0 ? "text-destructive" : "text-muted-foreground")}
                        >
                            {professionalSummary.length}/{SUMMARY_MAX_LENGTH} characters (minimum 50)
                            {overLimitBy > 0 && ` \u2014 ${overLimitBy} over the limit, please shorten it`}
                        </p>
                        {generationError && (
                            <p className="text-sm text-destructive">{generationError}</p>
                        )}
                    </div>
                </div>
            </FormSection>

            <StepNavigation
                currentStep={11}
                totalSteps={11}
                onPrevious={onPrevious}
                onNext={onSubmit}
                isLastStep
                isLoading={isLoading}
                canProceed={canSubmit}
            />
        </div>
    );
}
