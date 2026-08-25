"use client";

import { useState } from "react";
import { FileCheck2, Loader2, Sparkles, User } from "lucide-react";
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

// Descriptions come in as free text that candidates usually already bulleted
// ("- did x\n* did y"), so split it back into real list items instead of one blob.
const BULLET_CHARS = "-*+\u2022\u00b7\u25cf\u25cb\u25e6\u25aa\u25ab\u2023\u2043\u2219\u203a\u00bb";
const LEADING_BULLETS = new RegExp(`^\\s*(?:[${BULLET_CHARS}]\\s*)+`);
const SPLIT_BULLETS = new RegExp(`\\r?\\n|(?:^|\\s)[${BULLET_CHARS.slice(3)}]\\s+`);

function toBullets(text?: string | null): string[] {
    return (text ?? "")
        .split(SPLIT_BULLETS)
        .map((line) => line.replace(LEADING_BULLETS, "").trim())
        .filter(Boolean);
}

function Bullets({ text }: { text?: string | null }) {
    const items = toBullets(text);
    if (items.length === 0) return null;
    if (items.length === 1) return <p className="mt-1 text-muted-foreground">{items[0]}</p>;
    return (
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground marker:text-muted-foreground/60">
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    );
}

// Optional fields still get a row - a blank slot reads as "did I forget this?", so say it plainly.
function Field({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
            <dd className={cn("min-w-0 flex-1", value ? "text-foreground" : "text-muted-foreground/70")}>
                {value || "Not provided"}
            </dd>
        </div>
    );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
    return (
        <section className="border-t pt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
                <span className="ml-1 font-normal opacity-70">({count})</span>
            </h4>
            {count > 0 ? children : <p className="text-muted-foreground">No {title.toLowerCase()} added</p>}
        </section>
    );
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

    const noticePeriodLabels: Record<string, string> = {
        immediate: "Immediate",
        "1_week": "1 week",
        "2_weeks": "2 weeks",
        "1_month": "1 month",
        "2_months": "2 months",
        "3_months": "3+ months",
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

    // Several roles at one employer read as one career step, so group them under the
    // company. Both the groups and the roles inside stay latest-first from the sort above.
    const experienceByCompany = validWorkExperiences.reduce<{ company: string; roles: WorkExperienceData[] }[]>((groups, exp) => {
        const company = exp.company?.trim() || "Not specified";
        const group = groups.find((g) => g.company.toLowerCase() === company.toLowerCase());
        if (group) group.roles.push(exp);
        else groups.push({ company, roles: [exp] });
        return groups;
    }, []);

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

    const location = [basicInfo.address, basicInfo.country].filter(Boolean).join(", ");

    // Projects and certificates only apply to IT candidates - the wizard hides those steps
    // for everyone else, so the summary must not ask finance candidates for them either.
    const isITIndustry = (IT_INDUSTRIES as readonly string[]).includes(industry);

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
                <CardContent className="space-y-4 text-sm">
                    {/* Basic Info Summary - profileImageUrl is the object URL BasicInfoStep made
                        for the picked file, so the picture shows before it is ever uploaded. */}
                    <div className="flex items-center gap-4">
                        {basicInfo.profileImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- blob: URL, not an optimizable asset
                            <img
                                src={basicInfo.profileImageUrl}
                                alt=""
                                className="h-16 w-16 shrink-0 rounded-full border-2 border-primary/20 object-cover"
                            />
                        ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 bg-muted">
                                <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                        <div>
                            <p className="text-base font-semibold text-foreground">
                                {basicInfo.firstName} {basicInfo.lastName}
                            </p>
                            <p className="text-muted-foreground">
                                {basicInfo.currentPosition}
                                {basicInfo.yearsOfExperience ? ` \u2022 ${basicInfo.yearsOfExperience} years experience` : ""}
                            </p>
                            {!basicInfo.profileImageUrl && (
                                <p className="text-xs text-muted-foreground/70">No profile picture added</p>
                            )}
                        </div>
                    </div>

                    <dl className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                        <Field label="Email" value={basicInfo.email} />
                        <Field label="Phone" value={basicInfo.phone} />
                        <Field label="Alternative phone" value={basicInfo.alternativePhone} />
                        <Field label="Location" value={location} />
                        <Field label="Industry" value={industryLabel} />
                        <Field label="Experience level" value={experienceLevelLabels[basicInfo.experienceLevel] || basicInfo.experienceLevel} />
                        <Field label="Employment type" value={employmentTypeLabels[basicInfo.employmentType] || basicInfo.employmentType} />
                        <Field label="Availability" value={availabilityLabels[basicInfo.availabilityStatus] || basicInfo.availabilityStatus} />
                        <Field label="Notice period" value={noticePeriodLabels[basicInfo.noticePeriod ?? ""] || basicInfo.noticePeriod} />
                        <Field
                            label="Expected salary"
                            value={basicInfo.expectedMonthlySalary ? `${basicInfo.expectedMonthlySalary.toLocaleString()} / month` : ""}
                        />
                        <Field
                            label="Qualification"
                            value={basicInfo.highestQualification ? qualificationLabels[basicInfo.highestQualification] || basicInfo.highestQualification : ""}
                        />
                    </dl>

                    {(basicInfo.expectedPositions ?? []).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-muted-foreground">Expected positions:</span>
                            {(basicInfo.expectedPositions ?? []).map((pos, i) => (
                                <Badge key={i} variant="outline" className="text-xs font-normal">{pos}</Badge>
                            ))}
                        </div>
                    )}

                    {/* Experience Summary \u2014 grouped by company, latest role first */}
                    <Section title="Experience" count={validWorkExperiences.length}>
                        <ul className="space-y-4">
                            {experienceByCompany.map((group, i) => (
                                <li key={i}>
                                    <p className="font-medium text-foreground">{group.company}</p>
                                    <ol className="mt-1.5 space-y-2.5 border-l pl-3">
                                        {group.roles.map((exp, j) => (
                                            <li key={j} className="relative">
                                                <span className="absolute -left-[15px] top-2 h-1.5 w-1.5 rounded-full bg-primary/60" aria-hidden />
                                                <p className="font-medium text-foreground">{exp.jobTitle}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {exp.startDate ? `${exp.startDate} \u2013 ${exp.isCurrent ? "Present" : exp.endDate || "..."}` : "Date not specified"}
                                                    {exp.location ? ` \u2022 ${exp.location}` : ""}
                                                    {exp.employmentType ? ` \u2022 ${employmentTypeLabels[exp.employmentType] || exp.employmentType}` : ""}
                                                </p>
                                                <Bullets text={exp.description} />
                                            </li>
                                        ))}
                                    </ol>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    {/* Education Summary */}
                    <Section title="Education" count={validEducations.length}>
                        <ul className="space-y-2">
                            {validEducations.map((edu, i) => (
                                <li key={i}>
                                    <p className="font-medium text-foreground">{edu.degreeDiploma}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {[edu.institution, edu.status].filter(Boolean).join(" \u2022 ")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    {/* Awards */}
                    <Section title="Awards" count={validAwards.length}>
                        <ul className="space-y-2">
                            {validAwards.map((award, i) => (
                                <li key={i}>
                                    <p className="font-medium text-foreground">{award.natureOfAward}</p>
                                    {award.offeredBy && (
                                        <p className="text-xs text-muted-foreground">Awarded by {award.offeredBy}</p>
                                    )}
                                    <Bullets text={award.description} />
                                </li>
                            ))}
                        </ul>
                    </Section>

                    {/* IT Specific */}
                    {isITIndustry && (
                        <Section title="Projects" count={validProjects.length}>
                            <ul className="space-y-2">
                                {validProjects.map((proj, i) => (
                                    <li key={i}>
                                        <p className="font-medium text-foreground">{proj.projectName}</p>
                                        {proj.demoUrl && (
                                            <p className="truncate text-xs text-muted-foreground">Demo: {proj.demoUrl}</p>
                                        )}
                                        <Bullets text={proj.description} />
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {isITIndustry && (
                        <Section title="Certificates" count={validCertificates.length}>
                            <ul className="space-y-2">
                                {validCertificates.map((cert, i) => (
                                    <li key={i}>
                                        <p className="font-medium text-foreground">{cert.certificateName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {[
                                                cert.issuingAuthority ? `Issued by ${cert.issuingAuthority}` : "",
                                                cert.issueDate || "",
                                                cert.expiryDate ? `Expires ${cert.expiryDate}` : "",
                                            ].filter(Boolean).join(" \u2022 ")}
                                        </p>
                                        {cert.credentialUrl && (
                                            <p className="truncate text-xs text-muted-foreground">Credential: {cert.credentialUrl}</p>
                                        )}
                                        <Bullets text={cert.description} />
                                    </li>
                                ))}
                            </ul>
                        </Section>
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
                            into a div and the textarea itself renders transparent. Both sit in the
                            same grid cell, which keeps them the same size as it grows. The mirror is
                            painted *over* the textarea: dark mode gives inputs an opaque background
                            (globals.css), which would otherwise hide a mirror sitting behind. */}
                        <div className="grid">
                            <Textarea
                                id="professionalSummary"
                                value={professionalSummary}
                                onChange={(e) => onSummaryChange(e.target.value)}
                                placeholder="Write a compelling professional summary (minimum 50 characters)..."
                                rows={5}
                                aria-invalid={overLimitBy > 0}
                                aria-describedby="professionalSummaryCount"
                                className="col-start-1 row-start-1 text-transparent caret-foreground selection:bg-primary/30"
                            />
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
