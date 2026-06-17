"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { completeProfile, type ProfileActionState } from "@/app/actions/profile";
import { cn } from "@/lib/utils";

interface CreateProfileFormProps {
    userId: string;
    initialData: {
        industry: string;
        currentPosition: string;
        yearsOfExperience: number;
        experienceLevel: string;
        professionalSummary: string;
        expectedMonthlySalary: string;
        availabilityStatus: string;
        noticePeriod: string;
        employmentType: string;
        qualifications: string[];
        country: string;
    };
}

const INDUSTRIES = [
    "Information Technology",
    "Healthcare",
    "Finance & Banking",
    "Education",
    "Manufacturing",
    "Retail",
    "Construction",
    "Hospitality",
    "Media & Entertainment",
    "Telecommunications",
    "Government",
    "Non-Profit",
    "Other",
];

const EXPERIENCE_LEVELS = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "junior", label: "Junior (2-4 years)" },
    { value: "mid", label: "Mid Level (4-7 years)" },
    { value: "senior", label: "Senior (7-10 years)" },
    { value: "lead", label: "Lead/Manager (10+ years)" },
    { value: "principal", label: "Principal/Director" },
];

const AVAILABILITY_STATUSES = [
    { value: "available", label: "Actively Looking" },
    { value: "open_to_opportunities", label: "Open to Opportunities" },
    { value: "not_looking", label: "Not Currently Looking" },
];

const NOTICE_PERIODS = [
    { value: "immediate", label: "Immediate" },
    { value: "1_week", label: "1 Week" },
    { value: "2_weeks", label: "2 Weeks" },
    { value: "1_month", label: "1 Month" },
    { value: "2_months", label: "2 Months" },
    { value: "3_months", label: "3+ Months" },
];

const EMPLOYMENT_TYPES = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
];

const QUALIFICATIONS = [
    { value: "high_school", label: "High School" },
    { value: "diploma", label: "Diploma" },
    { value: "associate_degree", label: "Associate Degree" },
    { value: "bachelors_degree", label: "Bachelor's Degree" },
    { value: "masters_degree", label: "Master's Degree" },
    { value: "doctorate_phd", label: "Doctorate/PhD" },
    { value: "professional_certification", label: "Professional Certification" },
];

const COUNTRIES = [
    "Sri Lanka",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "India",
    "Singapore",
    "United Arab Emirates",
    "Germany",
    "Other",
];

function FormField({
    label,
    id,
    error,
    required,
    children,
}: {
    label: string;
    id: string;
    error?: string[];
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {children}
            {error && error.length > 0 && (
                <p className="text-sm text-destructive">{error[0]}</p>
            )}
        </div>
    );
}

export function CreateProfileForm({ userId, initialData }: CreateProfileFormProps) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState<ProfileActionState | null, FormData>(
        completeProfile,
        null
    );

    // Local state for controlled components
    const [industry, setIndustry] = useState(initialData.industry);
    const [experienceLevel, setExperienceLevel] = useState(initialData.experienceLevel);
    const [availabilityStatus, setAvailabilityStatus] = useState(initialData.availabilityStatus);
    const [noticePeriod, setNoticePeriod] = useState(initialData.noticePeriod);
    const [employmentType, setEmploymentType] = useState(initialData.employmentType);
    const [selectedQualifications, setSelectedQualifications] = useState<string[]>(initialData.qualifications);
    const [country, setCountry] = useState(initialData.country);

    // Calculate progress
    const fields = [
        industry,
        initialData.currentPosition,
        initialData.professionalSummary,
        experienceLevel,
        country,
    ];
    const filledFields = fields.filter((f) => f && f.length > 0).length;
    const progress = Math.round((filledFields / fields.length) * 100);

    // Handle redirect on success
    useEffect(() => {
        if (state?.success && state.redirectTo) {
            const timer = setTimeout(() => {
                router.push(state.redirectTo!);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [state, router]);

    const toggleQualification = (value: string) => {
        setSelectedQualifications((prev) =>
            prev.includes(value)
                ? prev.filter((q) => q !== value)
                : [...prev, value]
        );
    };

    return (
        <form action={formAction} className="space-y-6">
            {/* Progress Bar */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Profile Completion</CardTitle>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                </CardHeader>
                <CardContent className="pb-4">
                    <Progress value={progress} className="h-2" />
                </CardContent>
            </Card>

            {/* Success/Error Message */}
            {state?.message && (
                <div
                    className={cn(
                        "rounded-lg p-4 text-sm flex items-center gap-3",
                        state.success
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-destructive/10 text-destructive"
                    )}
                >
                    {state.success && <CheckCircle2 className="h-5 w-5" />}
                    {state.message}
                </div>
            )}

            {/* Professional Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                    <CardDescription>
                        Tell us about your current role and experience
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Industry" id="industry" error={state?.errors?.industry} required>
                            <Select
                                name="industry"
                                value={industry}
                                onValueChange={setIndustry}
                            >
                                <SelectTrigger id="industry">
                                    <SelectValue placeholder="Select your industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDUSTRIES.map((ind) => (
                                        <SelectItem key={ind} value={ind}>
                                            {ind}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Current Position" id="currentPosition" error={state?.errors?.currentPosition} required>
                            <Input
                                id="currentPosition"
                                name="currentPosition"
                                placeholder="e.g., Software Engineer"
                                defaultValue={initialData.currentPosition}
                            />
                        </FormField>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Years of Experience" id="yearsOfExperience">
                            <Input
                                id="yearsOfExperience"
                                name="yearsOfExperience"
                                type="number"
                                min="0"
                                max="50"
                                defaultValue={initialData.yearsOfExperience}
                            />
                        </FormField>

                        <FormField label="Experience Level" id="experienceLevel">
                            <Select
                                name="experienceLevel"
                                value={experienceLevel}
                                onValueChange={setExperienceLevel}
                            >
                                <SelectTrigger id="experienceLevel">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EXPERIENCE_LEVELS.map((level) => (
                                        <SelectItem key={level.value} value={level.value}>
                                            {level.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>

                    <FormField label="Professional Summary" id="professionalSummary" error={state?.errors?.professionalSummary} required>
                        <Textarea
                            id="professionalSummary"
                            name="professionalSummary"
                            placeholder="Write a brief summary about yourself, your skills, and career goals (minimum 50 characters)"
                            rows={4}
                            defaultValue={initialData.professionalSummary}
                        />
                    </FormField>
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Job Preferences</CardTitle>
                    <CardDescription>
                        Let employers know your preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Availability Status" id="availabilityStatus">
                            <Select
                                name="availabilityStatus"
                                value={availabilityStatus}
                                onValueChange={setAvailabilityStatus}
                            >
                                <SelectTrigger id="availabilityStatus">
                                    <SelectValue placeholder="Select availability" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AVAILABILITY_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Notice Period" id="noticePeriod">
                            <Select
                                name="noticePeriod"
                                value={noticePeriod}
                                onValueChange={setNoticePeriod}
                            >
                                <SelectTrigger id="noticePeriod">
                                    <SelectValue placeholder="Select notice period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {NOTICE_PERIODS.map((period) => (
                                        <SelectItem key={period.value} value={period.value}>
                                            {period.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Preferred Employment Type" id="employmentType">
                            <Select
                                name="employmentType"
                                value={employmentType}
                                onValueChange={setEmploymentType}
                            >
                                <SelectTrigger id="employmentType">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EMPLOYMENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Expected Monthly Salary (LKR)" id="expectedMonthlySalary">
                            <Input
                                id="expectedMonthlySalary"
                                name="expectedMonthlySalary"
                                type="number"
                                min="0"
                                placeholder="e.g., 150000"
                                defaultValue={initialData.expectedMonthlySalary}
                            />
                        </FormField>
                    </div>

                    <FormField label="Country" id="country">
                        <Select
                            name="country"
                            value={country}
                            onValueChange={setCountry}
                        >
                            <SelectTrigger id="country">
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                </CardContent>
            </Card>

            {/* Qualifications */}
            <Card>
                <CardHeader>
                    <CardTitle>Qualifications</CardTitle>
                    <CardDescription>
                        Select your highest qualifications (multiple selections allowed)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <input
                        type="hidden"
                        name="qualifications"
                        value={JSON.stringify(selectedQualifications)}
                    />
                    <div className="flex flex-wrap gap-2">
                        {QUALIFICATIONS.map((qual) => (
                            <button
                                key={qual.value}
                                type="button"
                                onClick={() => toggleQualification(qual.value)}
                                className={cn(
                                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                                    selectedQualifications.includes(qual.value)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80"
                                )}
                            >
                                {qual.label}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isPending} className="min-w-[200px]">
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Complete Profile"
                    )}
                </Button>
            </div>
        </form>
    );
}
