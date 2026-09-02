"use client";

import { User, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { FormSection } from "../shared/FormSection";
import { StepNavigation } from "../shared/StepNavigation";
import type { BasicInfoData } from "@/lib/validations/profile-schema";
import { basicInfoSchema } from "@/lib/validations/profile-schema";
import { useJobDesignations, uniqueDesignationsByName } from "@/hooks/useJobDesignations";
import type { CountryOption } from "@/lib/countries";
import { currencySelectOptions, DEFAULT_CURRENCY } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

interface BasicInfoStepProps {
    data: BasicInfoData;
    onChange: (data: BasicInfoData) => void;
    onNext: () => void;
    onPrevious: () => void;
    onImageSelect: (file: File | null) => void;
    industry?: string; // Selected industry from previous step
    countries: CountryOption[]; // From the `countries` table, loaded server-side by the page
}

const EXPERIENCE_LEVELS = [
    { value: "entry", label: "Entry Level" },
    { value: "junior", label: "Junior" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior" },
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

/** Sentinel for the Select only - what gets stored is "<n> days". */
const CUSTOM_NOTICE = "__custom__";
const customNoticeDays = (value?: string) => value?.match(/^(\d+) days$/)?.[1] ?? "";

const EMPLOYMENT_TYPES = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
];

// Ordered lowest to highest qualification
const QUALIFICATION_OPTIONS = [
    { value: "vocational_training", label: "Vocational Training" },
    { value: "certificate", label: "Certificate" },
    { value: "professional_certification", label: "Professional Certification" },
    { value: "diploma", label: "Diploma" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "bachelors_degree", label: "Bachelor's Degree" },
    { value: "post_graduate", label: "Post Graduate" },
    { value: "masters_degree", label: "Master's Degree" },
    { value: "doctorate_phd", label: "Doctorate/PhD" },
    { value: "no_formal_education", label: "No Formal Education" },
];

/**
 * Dial-code picker + local number, composing the single E.164 string the schema stores.
 * Same shape as the registration form's contact field.
 */
function PhoneField({
    id, countries, value, onChange, placeholder,
}: {
    id: string;
    countries: CountryOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const dialOptions = useMemo(
        () => countries.filter((c) => c.calling_code).map((c) => ({
            value: c.code, label: `${c.flag_emoji} ${c.calling_code}`, keywords: c.name,
        })),
        [countries],
    );

    // The flag follows whatever number is stored (so a CV-extracted phone shows the right one);
    // an explicit pick only matters where one dial code covers several countries (+1).
    const [picked, setPicked] = useState<string | null>(null);
    const derived = countries
        .filter((c) => c.calling_code && value.startsWith(c.calling_code))
        .sort((a, b) => b.calling_code!.length - a.calling_code!.length)[0];
    const dialCountry = picked ?? derived?.code ?? "";
    const dial = countries.find((c) => c.code === dialCountry)?.calling_code ?? "";
    const local = dial && value.startsWith(dial) ? value.slice(dial.length) : value.replace(/^\+/, "");

    return (
        <div className="flex gap-2">
            <Combobox
                options={dialOptions}
                value={dialCountry}
                onValueChange={(code) => {
                    setPicked(code);
                    onChange((countries.find((c) => c.code === code)?.calling_code ?? "") + local);
                }}
                placeholder="Code"
                searchPlaceholder="Country or code..."
                emptyMessage="No country found."
                className="w-32 shrink-0 px-3"
            />
            <Input
                id={id}
                type="tel"
                inputMode="tel"
                maxLength={14}
                value={local}
                onChange={(e) => onChange(dial + e.target.value.replace(/\D/g, ""))}
                placeholder={placeholder}
                className="flex-1"
            />
        </div>
    );
}

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

export function BasicInfoStep({ data, onChange, onNext, onPrevious, onImageSelect, industry, countries }: BasicInfoStepProps) {
    const canLoadDesignations = Boolean(industry);

    // Job titles match the industry chosen on the previous step (resolved server-side from `industries`)
    const { jobDesignations, loading: loadingDesignations, error: designationsError } = useJobDesignations(industry);

    const designationOptions = uniqueDesignationsByName(jobDesignations);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Anything the preset list does not cover ("45 days") is custom; the flag also has to survive
    // the moment right after picking "Custom", when the stored value is still empty.
    const [customNotice, setCustomNotice] = useState(
        () => Boolean(data.noticePeriod) && !NOTICE_PERIODS.some((p) => p.value === data.noticePeriod),
    );

    const currencies = useMemo(currencySelectOptions, []);

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

    const handleImageRemove = () => {
        if (data.profileImageUrl?.startsWith("blob:")) URL.revokeObjectURL(data.profileImageUrl);
        updateField("profileImageUrl", "");
        onImageSelect(null);
        // The file input keeps the old filename otherwise, and re-picking it fires no change event.
        const input = document.getElementById("profileImage") as HTMLInputElement | null;
        if (input) input.value = "";
    };

    return (
        <div className="space-y-6">
            <FormSection
                title="Personal Information"
                description="Your basic details"
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
                                Upload your professional image (Up to 5MB)
                            </p>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="profileImage"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full max-w-xs"
                                />
                                {data.profileImageUrl && (
                                    <Button type="button" variant="ghost" size="sm" onClick={handleImageRemove}>
                                        <X className="h-4 w-4 mr-1" />
                                        Remove
                                    </Button>
                                )}
                            </div>
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
                        <FormField label="Contact Number" id="phone" required error={errors.phone}>
                            <PhoneField
                                id="phone"
                                countries={countries}
                                value={data.phone}
                                onChange={(v) => updateField("phone", v)}
                                placeholder="771234567"
                            />
                        </FormField>
                    </div>

                    <FormField label="Optional Contact Number" id="alternativePhone" error={errors.alternativePhone}>
                        <PhoneField
                            id="alternativePhone"
                            countries={countries}
                            value={data.alternativePhone}
                            onChange={(v) => updateField("alternativePhone", v)}
                            placeholder="771234567 (Optional)"
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
                        <Combobox
                            id="country"
                            options={countries.map((c) => ({ value: c.name, label: `${c.flag_emoji} ${c.name}` }))}
                            value={data.country}
                            onValueChange={(value) => {
                                // Seed the dial code from the country, but only while no number is typed yet.
                                const callingCode = countries.find((c) => c.name === value)?.calling_code;
                                onChange({ ...data, country: value, ...(callingCode && !data.phone && { phone: callingCode }) });
                            }}
                            placeholder="Select country"
                            searchPlaceholder="Search countries..."
                            emptyMessage="No country found."
                        />
                    </FormField>
                </div>
            </FormSection>

            <FormSection
                title="Professional Details"
                description="Your current role"
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
                                <SelectTrigger id="experienceLevel" className="w-full">
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
                            <SelectTrigger id="highestQualification" className="w-full">
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
            >
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Availability" id="availabilityStatus" error={errors.availabilityStatus}>
                            <Select
                                value={data.availabilityStatus}
                                onValueChange={(value) => updateField("availabilityStatus", value as BasicInfoData["availabilityStatus"])}
                            >
                                <SelectTrigger id="availabilityStatus" className="w-full">
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
                            <div className="space-y-2">
                                <Select
                                    value={customNotice ? CUSTOM_NOTICE : data.noticePeriod}
                                    onValueChange={(value) => {
                                        setCustomNotice(value === CUSTOM_NOTICE);
                                        updateField("noticePeriod", value === CUSTOM_NOTICE ? "" : value);
                                    }}
                                >
                                    <SelectTrigger id="noticePeriod" className="w-full">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NOTICE_PERIODS.map((period) => (
                                            <SelectItem key={period.value} value={period.value}>
                                                {period.label}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value={CUSTOM_NOTICE}>Custom (days)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {customNotice && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={customNoticeDays(data.noticePeriod)}
                                            onChange={(e) => {
                                                const days = e.target.value.replace(/\D/g, "").slice(0, 3);
                                                updateField("noticePeriod", days ? `${days} days` : "");
                                            }}
                                            placeholder="e.g., 45"
                                            className="w-32"
                                            autoFocus
                                        />
                                        <span className="text-sm text-muted-foreground">days</span>
                                    </div>
                                )}
                            </div>
                        </FormField>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Employment Type" id="employmentType" error={errors.employmentType}>
                            <Select
                                value={data.employmentType}
                                onValueChange={(value) => updateField("employmentType", value as BasicInfoData["employmentType"])}
                            >
                                <SelectTrigger id="employmentType" className="w-full">
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
                        <FormField label="Expected Monthly Salary" id="expectedMonthlySalary" error={errors.expectedMonthlySalary}>
                            <div className="flex gap-2">
                                <Combobox
                                    options={currencies}
                                    value={data.expectedSalaryCurrency || DEFAULT_CURRENCY}
                                    onValueChange={(value) => updateField("expectedSalaryCurrency", value)}
                                    placeholder="Currency"
                                    searchPlaceholder="Search currencies..."
                                    emptyMessage="No currency found."
                                    className="w-32 shrink-0 px-3"
                                />
                                <MoneyInput
                                    id="expectedMonthlySalary"
                                    value={data.expectedMonthlySalary || ""}
                                    onChange={(v) => updateField("expectedMonthlySalary", parseInt(v) || 0)}
                                    placeholder="e.g., 150,000"
                                    className="flex-1"
                                />
                            </div>
                        </FormField>
                    </div>

                    {/* Expected Job Positions */}
                    <FormField
                        label={
                            <>
                                Expected Job Roles
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
