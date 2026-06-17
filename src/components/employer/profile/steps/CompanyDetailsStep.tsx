"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { CompanyLogoUpload } from "../CompanyLogoUpload";
import { COMPANY_SIZES } from "@/lib/validations/employer-profile-schema";

interface CompanyDetailsStepProps {
    data: {
        description: string;
        company_size: string;
        website: string;
        headoffice_location: string;
        logo_url: string;
    };
    onChange: (data: CompanyDetailsStepProps["data"]) => void;
    onFileSelect: (file: File | null) => void; // Separate file handler
    onNext: () => void;
    companyName: string; // For display
}

export function CompanyDetailsStep({ data, onChange, onFileSelect, onNext, companyName }: CompanyDetailsStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof typeof data, value: string) => {
        onChange({ ...data, [field]: value });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!data.description || data.description.trim().length < 50) {
            newErrors.description = "Company description must be at least 50 characters";
        }

        if (!data.company_size) {
            newErrors.company_size = "Please select a company size";
        }

        if (data.website && !/^https?:\/\/.+/.test(data.website)) {
            newErrors.website = "Please enter a valid website URL (include http:// or https://)";
        }

        if (!data.headoffice_location || data.headoffice_location.trim().length < 5) {
            newErrors.headoffice_location = "Head office location must be at least 5 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) {
            onNext();
        }
    };

    return (
        <Card>
            <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                        <h2 className="text-xl font-semibold">Complete Company Profile</h2>
                        <p className="text-sm text-muted-foreground">{companyName}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Company Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Company Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Tell us about your company, your mission, values, and what makes you unique..."
                            value={data.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className={errors.description ? "border-destructive" : ""}
                            rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                            {data.description.length} / 2000 characters (minimum 50)
                        </p>
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description}</p>
                        )}
                    </div>

                    {/* Company Size */}
                    <div className="space-y-2">
                        <Label htmlFor="company_size">
                            Company Size <span className="text-destructive">*</span>
                        </Label>
                        <Select value={data.company_size} onValueChange={(value) => handleChange("company_size", value)}>
                            <SelectTrigger className={errors.company_size ? "border-destructive" : ""}>
                                <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMPANY_SIZES.map((size) => (
                                    <SelectItem key={size} value={size}>
                                        {size} employees
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.company_size && (
                            <p className="text-sm text-destructive">{errors.company_size}</p>
                        )}
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                        <Label htmlFor="website">Company Website</Label>
                        <Input
                            id="website"
                            type="url"
                            placeholder="https://www.yourcompany.com"
                            value={data.website}
                            onChange={(e) => handleChange("website", e.target.value)}
                            className={errors.website ? "border-destructive" : ""}
                        />
                        {errors.website && (
                            <p className="text-sm text-destructive">{errors.website}</p>
                        )}
                    </div>

                    {/* Head Office Location */}
                    <div className="space-y-2">
                        <Label htmlFor="headoffice_location">
                            Head Office Location <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="headoffice_location"
                            placeholder="City, Country"
                            value={data.headoffice_location}
                            onChange={(e) => handleChange("headoffice_location", e.target.value)}
                            className={errors.headoffice_location ? "border-destructive" : ""}
                        />
                        {errors.headoffice_location && (
                            <p className="text-sm text-destructive">{errors.headoffice_location}</p>
                        )}
                    </div>

                    {/* Company Logo */}
                    <div className="space-y-2">
                        <Label>Company Logo</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Upload your company logo to be displayed on job postings
                        </p>
                        <CompanyLogoUpload
                            onLogoSelect={onFileSelect}
                            currentLogoUrl={data.logo_url}
                        />
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-end pt-4">
                    <Button onClick={handleNext} className="min-w-24">
                        Next
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
