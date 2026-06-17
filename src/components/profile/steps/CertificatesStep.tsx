"use client";

import { Medal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSection } from "../shared/FormSection";
import { DynamicList } from "../shared/DynamicList";
import { StepNavigation } from "../shared/StepNavigation";
import type { CertificateData } from "@/lib/validations/profile-schema";
import { certificateSchema } from "@/lib/validations/profile-schema";
import { useState } from "react";
import { z } from "zod";

interface CertificatesStepProps {
    certificates: CertificateData[];
    onChange: (certificates: CertificateData[]) => void;
    onNext: () => void;
    onPrevious: () => void;
}

const emptyCertificate: CertificateData = {
    certificateName: "",
    issuingAuthority: "",
    issueDate: "",
    expiryDate: null,
    credentialId: "",
    credentialUrl: "",
    description: "",
};

export function CertificatesStep({ certificates, onChange, onNext, onPrevious }: CertificatesStepProps) {
    const handleAdd = () => {
        onChange([...certificates, { ...emptyCertificate }]);
    };

    const handleRemove = (index: number) => {
        onChange(certificates.filter((_, i) => i !== index));
    };

    const handleUpdate = (index: number, field: keyof CertificateData, value: unknown) => {
        const updated = [...certificates];
        updated[index] = { ...updated[index], [field]: value };

        if (errors[`${index}.${field as string}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${index}.${field as string}`];
                return newErrors;
            });
        }

        onChange(updated);
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleNextStep = () => {
        const result = z.array(certificateSchema).safeParse(certificates);
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

    return (
        <div className="space-y-6">
            <FormSection
                title="Certifications"
                description="Add your professional certifications (AWS, Azure, Google, etc.)"
            >
                <DynamicList
                    items={certificates}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    addLabel="Add Certificate"
                    emptyMessage="No certificates added yet. Add your professional certifications."
                    maxItems={100}
                    renderItem={(cert, index) => (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`certificateName-${index}`}>
                                        Certificate Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`certificateName-${index}`}
                                        value={cert.certificateName}
                                        onChange={(e) => handleUpdate(index, "certificateName", e.target.value)}
                                        placeholder="e.g., AWS Solutions Architect"
                                    />
                                    {errors[`${index}.certificateName`] && <p className="text-sm text-destructive">{errors[`${index}.certificateName`]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`issuingAuthority-${index}`}>Issuing Authority</Label>
                                    <Input
                                        id={`issuingAuthority-${index}`}
                                        value={cert.issuingAuthority || ""}
                                        onChange={(e) => handleUpdate(index, "issuingAuthority", e.target.value)}
                                        placeholder="e.g., Amazon Web Services"
                                    />
                                    {errors[`${index}.issuingAuthority`] && <p className="text-sm text-destructive">{errors[`${index}.issuingAuthority`]}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`issueDate-${index}`}>Issue Date</Label>
                                    <Input
                                        id={`issueDate-${index}`}
                                        type="date"
                                        value={cert.issueDate || ""}
                                        onChange={(e) => handleUpdate(index, "issueDate", e.target.value)}
                                    />
                                    {errors[`${index}.issueDate`] && <p className="text-sm text-destructive">{errors[`${index}.issueDate`]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`expiryDate-${index}`}>Expiry Date</Label>
                                    <Input
                                        id={`expiryDate-${index}`}
                                        type="date"
                                        value={cert.expiryDate || ""}
                                        onChange={(e) => handleUpdate(index, "expiryDate", e.target.value)}
                                    />
                                    {errors[`${index}.expiryDate`] && <p className="text-sm text-destructive">{errors[`${index}.expiryDate`]}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`credentialId-${index}`}>Credential ID</Label>
                                    <Input
                                        id={`credentialId-${index}`}
                                        value={cert.credentialId || ""}
                                        onChange={(e) => handleUpdate(index, "credentialId", e.target.value)}
                                        placeholder="Certificate ID"
                                    />
                                    {errors[`${index}.credentialId`] && <p className="text-sm text-destructive">{errors[`${index}.credentialId`]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`credentialUrl-${index}`}>Credential URL</Label>
                                    <Input
                                        id={`credentialUrl-${index}`}
                                        value={cert.credentialUrl || ""}
                                        onChange={(e) => handleUpdate(index, "credentialUrl", e.target.value)}
                                        placeholder="https://verify.example.com/..."
                                    />
                                    {errors[`${index}.credentialUrl`] && <p className="text-sm text-destructive">{errors[`${index}.credentialUrl`]}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`description-${index}`}>Description</Label>
                                <Textarea
                                    id={`description-${index}`}
                                    value={cert.description || ""}
                                    onChange={(e) => handleUpdate(index, "description", e.target.value)}
                                    placeholder="Brief description (optional)"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}
                />
            </FormSection>

            <StepNavigation
                currentStep={7}
                totalSteps={10}
                onPrevious={onPrevious}
                onNext={handleNextStep}
            />
        </div>
    );
}
