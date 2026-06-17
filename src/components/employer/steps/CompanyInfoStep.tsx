"use client";

import { useState } from "react";
import { Building2, Info, ArrowRight, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BRCertificateUpload } from "../BRCertificateUpload";
import { useIndustries } from "@/hooks/useIndustries";
import { cn } from "@/lib/utils";

const inputCls = cn(
    "w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
    "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:bg-background transition-all",
);
const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

interface CompanyInfoStepProps {
    data: { companyName: string; businessRegistrationNo: string; industry: string; businessRegisteredAddress: string; brCertificateUrl: string; };
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
        <div className="rounded-2xl border border-border bg-card/80 p-6 space-y-5 shadow-sm">
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
                <p className="text-xs text-amber-300/90 leading-relaxed">
                    Company name & Business registration number must match your BR certificate exactly. Please verify before continuing.
                </p>
            </div>

            {/* Company Name */}
            <div>
                <label htmlFor="companyName" className={labelCls}>Company Name <span className="text-red-400/80">*</span></label>
                <input id="companyName" placeholder="Enter your company name" value={data.companyName}
                    onChange={e => set("companyName", e.target.value)}
                    className={cn(inputCls, errors.companyName && "border-red-500/50")} />
                {errors.companyName && <p className="mt-1.5 text-xs text-red-400">{errors.companyName}</p>}
            </div>

            {/* BR Number */}
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <label htmlFor="businessRegistrationNo" className={cn(labelCls, "mb-0")}>
                        Business Registration No <span className="text-red-400/80">*</span>
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
                {errors.businessRegistrationNo && <p className="mt-1.5 text-xs text-red-400">{errors.businessRegistrationNo}</p>}
            </div>

            {/* Industry */}
            <div>
                <label htmlFor="industry" className={labelCls}>Industry <span className="text-red-400/80">*</span></label>
                <Select value={data.industry} onValueChange={v => set("industry", v)} disabled={industriesLoading || industries.length === 0}>
                    <SelectTrigger className={cn(
                        "rounded-xl border border-border bg-muted/40 text-sm text-foreground h-[42px]",
                        "focus:ring-2 focus:ring-primary/40 focus:border-primary/60",
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
                {(industriesError || errors.industry) && <p className="mt-1.5 text-xs text-red-400">{industriesError || errors.industry}</p>}
            </div>

            {/* Address */}
            <div>
                <label htmlFor="businessRegisteredAddress" className={labelCls}>Business Registered Address <span className="text-red-400/80">*</span></label>
                <textarea id="businessRegisteredAddress" rows={3} placeholder="Enter business registered address"
                    value={data.businessRegisteredAddress} onChange={e => set("businessRegisteredAddress", e.target.value)}
                    className={cn(inputCls, "resize-none", errors.businessRegisteredAddress && "border-red-500/50")} />
                {errors.businessRegisteredAddress && <p className="mt-1.5 text-xs text-red-400">{errors.businessRegisteredAddress}</p>}
            </div>

            {/* BR Certificate */}
            <div>
                <label className={labelCls}>Business Registration Certificate <span className="text-red-400/80">*</span></label>
                <p className="text-xs text-muted-foreground/70 mb-3 leading-relaxed">
                    Upload your BR certificate. Our AI will automatically verify it matches your company details.
                </p>
                <BRCertificateUpload
                    onFileSelect={onFileSelect}
                    onVerificationComplete={onFileVerified}
                    companyName={data.companyName}
                    businessRegistrationNo={data.businessRegistrationNo}
                />
                {errors.brCertificate && <p className="mt-1.5 text-xs text-red-400">{errors.brCertificate}</p>}
            </div>

            {/* Next button */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={() => { if (validate()) onNext(); }}
                    disabled={!isVerified}
                    className={cn(
                        "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all",
                        "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.99]",
                        "shadow-lg shadow-primary/20",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                    )}
                >
                    Continue <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
