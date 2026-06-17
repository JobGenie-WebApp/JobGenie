"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyInfoStep } from "./steps/CompanyInfoStep";
import { EmployerProfileStep } from "./steps/EmployerProfileStep";
import { registerEmployer, type ActionState } from "@/app/actions/auth";

const steps = [
    { id: "company", title: "Company Info", description: "Business details & BR verification" },
    { id: "profile", title: "Your Profile", description: "Admin account credentials" },
];

export function EmployerSignupWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isCertificateVerified, setIsCertificateVerified] = useState(false);

    const [companyData, setCompanyData] = useState({
        companyName: "", businessRegistrationNo: "", industry: "",
        businessRegisteredAddress: "", brCertificateUrl: "",
    });
    const [brCertificateFile, setBrCertificateFile] = useState<File | null>(null);
    const [employerData, setEmployerData] = useState({
        firstName: "", lastName: "", phone: "", email: "",
        password: "", confirmPassword: "", jobTitle: "",
    });

    useEffect(() => {
        const sc = localStorage.getItem("employer-company-data");
        if (sc) { try { setCompanyData(JSON.parse(sc)); } catch {} }
        const se = localStorage.getItem("employer-profile-data");
        if (se) { try { setEmployerData(JSON.parse(se)); } catch {} }
        const ss = localStorage.getItem("employer-wizard-step");
        if (ss) { try { setCurrentStep(JSON.parse(ss)); } catch {} }
    }, []);

    useEffect(() => { localStorage.setItem("employer-company-data", JSON.stringify(companyData)); }, [companyData]);
    useEffect(() => { localStorage.setItem("employer-profile-data", JSON.stringify(employerData)); }, [employerData]);
    useEffect(() => { localStorage.setItem("employer-wizard-step", JSON.stringify(currentStep)); }, [currentStep]);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) setCurrentStep(p => p + 1);
    }, [currentStep]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 0) setCurrentStep(p => p - 1);
    }, [currentStep]);

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);
        try {
            let uploadedCertificateUrl = "";
            if (brCertificateFile) {
                toast.info("Uploading business registration certificate…");
                const fd = new FormData();
                fd.append("file", brCertificateFile);
                fd.append("bucket", "br-certificates");
                const res = await fetch("/api/upload-presignup", { method: "POST", body: fd });
                if (!res.ok) throw new Error("Failed to upload BR certificate");
                uploadedCertificateUrl = (await res.json()).url;
            } else {
                toast.error("BR certificate file is missing");
                setIsLoading(false);
                return;
            }

            const formData = new FormData();
            Object.entries(companyData).forEach(([k, v]) => formData.append(k, v));
            formData.set("brCertificateUrl", uploadedCertificateUrl);
            Object.entries(employerData).forEach(([k, v]) => formData.append(k, v));

            const result = await registerEmployer(null, formData);
            if (result.success) {
                ["employer-company-data", "employer-profile-data", "employer-wizard-step"].forEach(k => localStorage.removeItem(k));
                toast.success(result.message || "Registration successful!");
                if (result.redirectTo) setTimeout(() => router.push(result.redirectTo!), 1000);
            } else {
                if (uploadedCertificateUrl) {
                    fetch("/api/delete-presignup-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileUrl: uploadedCertificateUrl }) }).catch(() => {});
                }
                if (result.errors && Object.keys(result.errors).length > 0) {
                    Object.entries(result.errors).forEach(([field, messages]) => {
                        toast.error(`${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`);
                    });
                } else {
                    toast.error(result.message || "Registration failed. Please try again.");
                }
            }
        } catch {
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [companyData, employerData, brCertificateFile, router]);

    return (
        <div className="space-y-5">
            {/* Step indicator */}
            <div className="rounded-2xl border border-border bg-card/60 p-5">
                <div className="flex items-center gap-0">
                    {steps.map((step, i) => {
                        const done = i < currentStep;
                        const active = i === currentStep;
                        return (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 transition-all",
                                        done  && "bg-primary ring-primary/30 text-primary-foreground",
                                        active && "bg-primary/15 ring-primary/40 text-primary",
                                        !done && !active && "bg-muted ring-border text-muted-foreground/50",
                                    )}>
                                        {done ? <Check className="h-4 w-4" /> : i + 1}
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className={cn("text-xs font-semibold", active ? "text-foreground" : done ? "text-primary" : "text-muted-foreground/60")}>{step.title}</p>
                                        <p className={cn("text-[11px]", active ? "text-muted-foreground" : "text-muted-foreground/50")}>{step.description}</p>
                                    </div>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="flex-1 mx-4 h-px">
                                        <div className={cn("h-full transition-all", done ? "bg-primary/40" : "bg-border")} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step content */}
            {currentStep === 0 && (
                <CompanyInfoStep
                    data={companyData}
                    onChange={setCompanyData}
                    onNext={handleNext}
                    onFileVerified={setIsCertificateVerified}
                    onFileSelect={setBrCertificateFile}
                    isVerified={isCertificateVerified}
                />
            )}
            {currentStep === 1 && (
                <EmployerProfileStep
                    data={employerData}
                    onChange={setEmployerData}
                    onPrevious={handlePrevious}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
}
