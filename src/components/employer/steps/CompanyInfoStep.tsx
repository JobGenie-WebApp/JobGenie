"use client";

import { useState } from "react";
import { Building2, Info, ArrowRight, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BRCertificateUpload } from "../BRCertificateUpload";
import { useIndustries } from "@/hooks/useIndustries";
import { cn } from "@/lib/utils";

const inputCls = cn(
    "min-h-12 w-full rounded-xl border border-border/80 bg-background/70 px-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground/60 sm:text-sm",
    "outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/10",
);
const labelCls = "mb-2 block text-sm font-semibold text-foreground";

interface CompanyInfoStepProps {
    data: { companyName: string; businessRegistrationNo: string; industry: string; industryId: string; businessRegisteredAddress: string; brCertificateUrl: string; };
    onChange: (data: CompanyInfoStepProps["data"]) => void;
    onNext: () => void;
    onFileVerified: (verified: boolean) => void;
    onFileSelect: (file: File) => void;
    isVerified: boolean;
}

export function CompanyInfoStep({ data, onChange, onNext, onFileVerified, onFileSelect, isVerified }: CompanyInfoStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { industries, loading: industriesLoading, error: industriesError } = useIndustries();

    const set = (field: keyof typeof data, value: string) => {
        onChange({ ...data, [field]: value });
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const setIndustry = (industryName: string) => {
        const selectedIndustry = industries.find((industry) => industry.industry_name === industryName);
        onChange({
            ...data,
            industry: industryName,
            industryId: selectedIndustry ? String(selectedIndustry.industry_id) : "",
        });
        if (errors.industry) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.industry;
                return next;
            });
        }
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!data.companyName.trim()) e.companyName = "Company name is required";
        if (!data.businessRegistrationNo.trim()) {
            e.businessRegistrationNo = "Business registration number is required";
        } else if (!/^(PV|PB|GR|HP)\s*\d+$/i.test(data.businessRegistrationNo.trim())) {
            e.businessRegistrationNo = "Invalid format. Must be PV/PB/GR/HP followed by numbers (e.g., PV 12345678)";
        }
        if (!data.industry) e.industry = "Please select an industry";
        if (!data.businessRegisteredAddress.trim()) e.businessRegisteredAddress = "Business address is required";
        if (!isVerified) e.brCertificate = "Please upload and verify your BR certificate";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-card/95 p-5 shadow-[0_16px_50px_-36px_rgba(0,0,0,.5)] ring-1 ring-primary/[0.04] sm:p-7">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/15 ring-1 ring-primary/25 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-foreground">Company Information</h2>
                    <p className="text-xs text-muted-foreground">Step 1 of 2 — Business details</p>
                </div>
            </div>

            {/* Warning notice */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                    Company name & Business registration number must match your BR certificate exactly. Please verify before continuing.
                </p>
            </div>

            {/* Company Name */}
            <div>
                <label htmlFor="companyName" className={labelCls}>Company Name <span className="text-destructive">*</span></label>
                <input id="companyName" placeholder="Enter your company name" value={data.companyName}
                    onChange={e => set("companyName", e.target.value)}
                    className={cn(inputCls, errors.companyName && "border-red-500/50")} />
                {errors.companyName && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.companyName}</p>}
            </div>

            {/* BR Number */}
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <label htmlFor="businessRegistrationNo" className={cn(labelCls, "mb-0")}>
                        Business Registration No <span className="text-destructive">*</span>
                    </label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help hover:text-foreground transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs p-4">
                                <p className="font-semibold text-sm mb-2 text-primary">BR Number Format</p>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <p><span className="font-bold text-foreground">PV</span> — Private Limited Company</p>
                                    <p><span className="font-bold text-foreground">PB</span> — Public Limited Company</p>
                                    <p><span className="font-bold text-foreground">GR</span> — Guarantee Company</p>
                                    <p><span className="font-bold text-foreground">HP</span> — Hybrid/Other types</p>
                                    <p className="mt-2 pt-2 border-t border-border">Example: <span className="font-mono text-primary">PV 12345678</span></p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <input id="businessRegistrationNo" placeholder="e.g., PV 12345678"
                    value={data.businessRegistrationNo} onChange={e => set("businessRegistrationNo", e.target.value)}
                    className={cn(inputCls, errors.businessRegistrationNo && "border-red-500/50")} />
                {errors.businessRegistrationNo && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.businessRegistrationNo}</p>}
            </div>

            {/* Industry */}
            <div>
                <label htmlFor="industry" className={labelCls}>Industry <span className="text-destructive">*</span></label>
                <Select value={data.industry} onValueChange={setIndustry} disabled={industriesLoading || industries.length === 0}>
                    <SelectTrigger id="industry" className={cn(
                        "h-12 w-full rounded-xl border border-border/80 bg-background/70 px-4 text-base text-foreground shadow-sm data-[size=default]:h-12 sm:text-sm",
                        "focus:border-primary/60 focus:ring-4 focus:ring-primary/10",
                        !data.industry && "[&>span]:text-muted-foreground/60",
                        errors.industry && "border-red-500/50",
                    )}>
                        <SelectValue placeholder={industriesLoading ? "Loading…" : "Select industry"} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                        {industriesLoading && <SelectItem value="loading" disabled>Loading industries…</SelectItem>}
                        {!industriesLoading && industries.length === 0 && <SelectItem value="none" disabled>No industries available</SelectItem>}
                        {industries.map(ind => (
                            <SelectItem key={ind.industry_id} value={ind.industry_name}>{ind.industry_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {(industriesError || errors.industry) && <p className="mt-1.5 text-xs text-destructive" role="alert">{industriesError || errors.industry}</p>}
            </div>

            {/* Address */}
            <div>
                <label htmlFor="businessRegisteredAddress" className={labelCls}>Business Registered Address <span className="text-destructive">*</span></label>
                <input id="businessRegisteredAddress" placeholder="Enter business registered address"
                    value={data.businessRegisteredAddress} onChange={e => set("businessRegisteredAddress", e.target.value)}
                    className={cn(inputCls, errors.businessRegisteredAddress && "border-red-500/50")} />
                {errors.businessRegisteredAddress && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.businessRegisteredAddress}</p>}
            </div>

            {/* BR Certificate */}
            <div>
                <label className={labelCls}>Business Registration Certificate <span className="text-destructive">*</span></label>
                <p className="text-xs text-muted-foreground/70 mb-3 leading-relaxed">
                    Upload your BR certificate. Our AI will automatically verify it matches your company details.
                </p>
                <BRCertificateUpload
                    onFileSelect={onFileSelect}
                    onVerificationComplete={onFileVerified}
                    companyName={data.companyName}
                    businessRegistrationNo={data.businessRegistrationNo}
                />
                {errors.brCertificate && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.brCertificate}</p>}
            </div>

            {/* Next button */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={() => { if (validate()) onNext(); }}
                    disabled={!isVerified}
                    className={cn(
                        "flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground",
                        "shadow-lg shadow-primary/20 transition-[filter,transform,box-shadow] duration-200 hover:brightness-105 active:scale-[0.99]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                    )}
                >
                    Continue <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
