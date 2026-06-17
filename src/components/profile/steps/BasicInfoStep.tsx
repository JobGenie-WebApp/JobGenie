"use client";

import { User, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { FormSection } from "../shared/FormSection";
import { StepNavigation } from "../shared/StepNavigation";
import type { BasicInfoData } from "@/lib/validations/profile-schema";
import { basicInfoSchema } from "@/lib/validations/profile-schema";
import { useJobDesignations, uniqueDesignationsByName } from "@/hooks/useJobDesignations";
import { useState } from "react";

interface BasicInfoStepProps {
    data: BasicInfoData;
    onChange: (data: BasicInfoData) => void;
    onNext: () => void;
    onPrevious: () => void;
    onImageSelect: (file: File | null) => void;
    industry?: string; // Selected industry from previous step
}

const EXPERIENCE_LEVELS = [
    { value: "entry", label: "Entry Level" },
    { value: "junior", label: "Junior" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior" },
    { value: "lead", label: "Lead" },
    { value: "principal", label: "Principal" },
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

const COUNTRIES = [
    "Sri Lanka", "United States", "United Kingdom", "Canada",
    "Australia", "India", "Singapore", "United Arab Emirates", "Germany", "Other",
];

const QUALIFICATION_OPTIONS = [
    { value: "bachelors_degree", label: "Bachelor's Degree" },
    { value: "masters_degree", label: "Master's Degree" },
    { value: "doctorate_phd", label: "Doctorate/PhD" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "post_graduate", label: "Post Graduate" },
    { value: "diploma", label: "Diploma" },
    { value: "certificate", label: "Certificate" },
    { value: "professional_certification", label: "Professional Certification" },
    { value: "vocational_training", label: "Vocational Training" },
    { value: "no_formal_education", label: "No Formal Education" },
];

function FormField({
    label, id, required, children, error,
}: {
    label: React.ReactNode; id: string; required?: boolean; children: React.ReactNode; error?: string;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label}{required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {children}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

export function BasicInfoStep({ data, onChange, onNext, onPrevious, onImageSelect, industry }: BasicInfoStepProps) {
    const canLoadDesignations = Boolean(industry);

    // Job titles match the industry chosen on the previous step (resolved server-side from `industries`)
    const { jobDesignations, loading: loadingDesignations, error: designationsError } = useJobDesignations(industry);

    const designationOptions = uniqueDesignationsByName(jobDesignations);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateField = <K extends keyof BasicInfoData>(key: K, value: BasicInfoData[K]) => {
        onChange({ ...data, [key]: value });
        // Clear error for this field when user types
        if (errors[key]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const handleNextStep = () => {
        const result = basicInfoSchema.safeParse(data);
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("File size must be less than 5MB");
                return;
            }
            if (!file.type.startsWith("image/")) {
                alert("Please upload an image file");
                return;
            }

            // Create object URL for preview
            const objectUrl = URL.createObjectURL(file);
            updateField("profileImageUrl", objectUrl);
            onImageSelect(file);
        }
    };

    return (
        <div className="space-y-6">
            <FormSection
                title="Personal Information"
                description="Your basic contact details"
            >
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="First Name" id="firstName" required error={errors.firstName}>
                            <Input
                                id="firstName"
                                value={data.firstName}
                                onChange={(e) => updateField("firstName", e.target.value)}
                                placeholder="John"
                                readOnly
                                className="bg-muted cursor-not-allowed"
                            />
                        </FormField>
                        <FormField label="Last Name" id="lastName" required error={errors.lastName}>
                            <Input
                                id="lastName"
                                value={data.lastName}
                                onChange={(e) => updateField("lastName", e.target.value)}
                                placeholder="Doe"
                                readOnly
                                className="bg-muted cursor-not-allowed"
                            />
                        </FormField>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="shrink-0">
                            {data.profileImageUrl ? (
                                <img
                                    src={data.profileImageUrl}
                                    alt="Profile Preview"
                                    className="h-24 w-24 rounded-full object-cover border-2 border-primary/20"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted border-2 border-dashed border-muted-foreground/25">
                                    <User className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="profileImage" className="text-base font-medium">Profile Picture</Label>
                            <p className="text-sm text-muted-foreground pb-2">
                                Upload a professional picture (Max 5MB)
                            </p>
                            <Input
                                id="profileImage"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full max-w-xs"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Email" id="email" required error={errors.email}>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                placeholder="john@example.com"
                                readOnly
                                className="bg-muted cursor-not-allowed"
                            />
                        </FormField>
                        <FormField label={<>Phone <span className="text-xs text-muted-foreground font-normal ml-1">( Format: +94XXXXXXXXX )</span></>} id="phone" required error={errors.phone}>
                            <Input
                                id="phone"
                                value={data.phone}
                                maxLength={15}
                                onChange={(e) => updateField("phone", e.target.value)}
                                placeholder="+94771234567"
                            />
                        </FormField>
                    </div>

                    <FormField label={<>Alternative Phone <span className="text-xs text-muted-foreground font-normal ml-1">( Format: +94XXXXXXXXX )</span></>} id="alternativePhone" error={errors.alternativePhone}>
                        <Input
                            id="alternativePhone"
                            value={data.alternativePhone}
                            maxLength={15}
                            onChange={(e) => updateField("alternativePhone", e.target.value)}
                            placeholder="+94771234567 (Optional)"
                        />
                    </FormField>

                    <FormField label="Address" id="address" required error={errors.address}>
                        <Textarea
                            id="address"
                            value={data.address}
                            onChange={(e) => updateField("address", e.target.value)}
                            placeholder="Your full address"
                            rows={2}
                        />
                    </FormField>

                    <FormField label="Country" id="country" error={errors.country}>
                        <Select
                            value={data.country}
                            onValueChange={(value) => updateField("country", value)}
                        >
                            <SelectTrigger id="country">
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map((country) => (
                                    <SelectItem key={country} value={country}>
                                        {country}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>
            </FormSection>

            <FormSection
                title="Professional Details"
                description="Your current role and experience"
            >
                <div className="space-y-4">
                    <FormField label="Current Position" id="currentPosition" required error={errors.currentPosition}>
                        {!canLoadDesignations ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Select your industry in the previous step (Industry &amp; CV) to see job titles for that sector.
                                </p>
                                <Input
                                    id="currentPosition"
                                    value={data.currentPosition}
                                    onChange={(e) => updateField("currentPosition", e.target.value)}
                                    placeholder="e.g., Software Engineer"
                                />
                            </div>
                        ) : loadingDesignations ? (
                            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading job designations...
                            </div>
                        ) : designationsError ? (
                            <div className="space-y-2">
                                <p className="text-sm text-destructive">
                                    Failed to load job designations. You can enter manually.
                                </p>
                                <Input
                                    id="currentPosition"
                                    value={data.currentPosition}
                                    onChange={(e) => updateField("currentPosition", e.target.value)}
                                    placeholder="e.g., Software Engineer"
                                />
                            </div>
                        ) : (
                            <Combobox
                                options={designationOptions.map((designation) => ({
                                    value: designation.designation_name,
                                    label: designation.designation_name,
                                }))}
                                value={data.currentPosition}
                                onValueChange={(value) => updateField("currentPosition", value)}
                                placeholder="Select your current position"
                                searchPlaceholder="Search job titles..."
                                emptyMessage="No job title found for your industry."
                            />
                        )}
                    </FormField>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Years of Experience" id="yearsOfExperience" error={errors.yearsOfExperience}>
                            <Input
                                id="yearsOfExperience"
                                type="number"
                                min="0"
                                max="50"
                                step="1"
                                value={data.yearsOfExperience || ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Only accept integers (no decimals)
                                    if (value === "" || /^\d+$/.test(value)) {
                                        updateField("yearsOfExperience", value === "" ? 0 : parseInt(value));
                                    }
                                }}
                                placeholder="Enter years"
                            />
                        </FormField>
                        <FormField label="Current Experience Level" id="experienceLevel" error={errors.experienceLevel}>
                            <Select
                                value={data.experienceLevel}
                                onValueChange={(value) => updateField("experienceLevel", value as BasicInfoData["experienceLevel"])}
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

                    <FormField label="Highest Qualification" id="highestQualification" error={errors.highestQualification}>
                        <Select
                            value={data.highestQualification}
                            onValueChange={(value) => updateField("highestQualification", value as BasicInfoData["highestQualification"])}
                        >
                            <SelectTrigger id="highestQualification">
                                <SelectValue placeholder="Select highest qualification" />
                            </SelectTrigger>
                            <SelectContent>
                                {QUALIFICATION_OPTIONS.map((qualification) => (
                                    <SelectItem key={qualification.value} value={qualification.value}>
                                        {qualification.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>
            </FormSection>

            <FormSection
                title="Job Preferences"
                description="Your availability and expectations"
            >
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Availability Status" id="availabilityStatus" error={errors.availabilityStatus}>
                            <Select
                                value={data.availabilityStatus}
                                onValueChange={(value) => updateField("availabilityStatus", value as BasicInfoData["availabilityStatus"])}
                            >
                                <SelectTrigger id="availabilityStatus">
                                    <SelectValue placeholder="Select status" />
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
                        <FormField label="Notice Period" id="noticePeriod" error={errors.noticePeriod}>
                            <Select
                                value={data.noticePeriod}
                                onValueChange={(value) => updateField("noticePeriod", value)}
                            >
                                <SelectTrigger id="noticePeriod">
                                    <SelectValue placeholder="Select period" />
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
                        <FormField label="Employment Type" id="employmentType" error={errors.employmentType}>
                            <Select
                                value={data.employmentType}
                                onValueChange={(value) => updateField("employmentType", value as BasicInfoData["employmentType"])}
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
                        <FormField label="Expected Monthly Salary (LKR)" id="expectedMonthlySalary" error={errors.expectedMonthlySalary}>
                            <Input
                                id="expectedMonthlySalary"
                                type="number"
                                min="0"
                                value={data.expectedMonthlySalary || ""}
                                onChange={(e) => updateField("expectedMonthlySalary", parseInt(e.target.value) || 0)}
                                placeholder="e.g., 150000"
                            />
                        </FormField>
                    </div>

                    {/* Expected Job Positions */}
                    <FormField
                        label={
                            <>
                                Expected Job Positions
                                <span className="text-xs text-muted-foreground font-normal ml-1">
                                    (Up to 3)
                                </span>
                            </>
                        }
                        id="expectedPositions"
                        required
                        error={errors["expectedPositions"]}
                    >
                        <div className="space-y-2">
                            {/* Selected position tags */}
                            {(data.expectedPositions ?? []).length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {(data.expectedPositions ?? []).map((pos, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                                        >
                                            {pos}
                                            <button
                                                type="button"
                                                aria-label={`Remove ${pos}`}
                                                onClick={() => {
                                                    const updated = (data.expectedPositions ?? []).filter((_, i) => i !== idx);
                                                    updateField("expectedPositions", updated);
                                                }}
                                                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Combobox to add positions */}
                            {(data.expectedPositions ?? []).length >= 3 ? (
                                <p className="text-xs text-muted-foreground py-2">
                                    Maximum of 3 positions reached. Remove one to add another.
                                </p>
                            ) : !canLoadDesignations ? (
                                <Input
                                    id="expectedPositions"
                                    placeholder="Type a position and press Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const val = (e.target as HTMLInputElement).value.trim();
                                            if (val && !(data.expectedPositions ?? []).includes(val)) {
                                                updateField("expectedPositions", [...(data.expectedPositions ?? []), val]);
                                                (e.target as HTMLInputElement).value = "";
                                            }
                                        }
                                    }}
                                />
                            ) : loadingDesignations ? (
                                <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading job designations...
                                </div>
                            ) : designationsError ? (
                                <Input
                                    id="expectedPositions"
                                    placeholder="Type a position and press Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const val = (e.target as HTMLInputElement).value.trim();
                                            if (val && !(data.expectedPositions ?? []).includes(val)) {
                                                updateField("expectedPositions", [...(data.expectedPositions ?? []), val]);
                                                (e.target as HTMLInputElement).value = "";
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <Combobox
                                    options={designationOptions
                                        .filter((d) => !(data.expectedPositions ?? []).includes(d.designation_name))
                                        .map((designation) => ({
                                            value: designation.designation_name,
                                            label: designation.designation_name,
                                        }))}
                                    value=""
                                    onValueChange={(value) => {
                                        if (value && !(data.expectedPositions ?? []).includes(value)) {
                                            updateField("expectedPositions", [...(data.expectedPositions ?? []), value]);
                                        }
                                    }}
                                    placeholder="Search and select a position"
                                    searchPlaceholder="Search job titles..."
                                    emptyMessage="No job title found for your industry."
                                />
                            )}
                        </div>
                    </FormField>
                </div>
            </FormSection>

            <StepNavigation
                currentStep={2}
                totalSteps={10}
                onPrevious={onPrevious}
                onNext={handleNextStep}
                canProceed={true}
            />
        </div >
    );
}
