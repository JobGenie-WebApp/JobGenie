"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Building, Globe, MapPin, Phone, FileText, CheckCircle2, XCircle, RotateCcw, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { approveCompanyProfile, rejectCompanyProfile, revokeCompanyApproval } from "@/app/actions/employer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatIndustry } from "@/lib/utils";

interface AdminData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    job_title?: string;
}

interface CompanyData {
    id: string;
    company_name: string;
    business_registration_no: string;
    industry: string;
    business_registered_address: string;
    br_certificate_url: string;
    logo_url?: string;
    description?: string;
    phone: string;
    website?: string;
    company_size?: string;
    specialities: string[];
    map_link?: string;
    approval_status: string;
    rejection_reason?: string;
    admin: AdminData;
}

interface EmployerProfileViewProps {
    companyId: string;
    onClose: () => void;
}

export function EmployerProfileView({ companyId, onClose }: EmployerProfileViewProps) {
    const [company, setCompany] = useState<CompanyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchCompany() {
            try {
                const response = await fetch(`/api/mis/companies/${companyId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCompany(data);
                }
            } catch (error) {
                console.error("Error fetching company:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchCompany();
    }, [companyId]);

    const handleApprove = async () => {
        setIsSubmitting(true);
        const result = await approveCompanyProfile(companyId);

        if (result.success) {
            toast.success(result.message);
            router.refresh();
            onClose();
        } else {
            toast.error(result.message);
        }
        setIsSubmitting(false);
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }

        setIsSubmitting(true);
        const result = await rejectCompanyProfile(companyId, rejectionReason);

        if (result.success) {
            toast.success(result.message);
            setShowRejectForm(false);
            router.refresh();
            onClose();
        } else {
            toast.error(result.message);
        }
        setIsSubmitting(false);
    };

    const handleRevoke = async () => {
        setIsSubmitting(true);
        const result = await revokeCompanyApproval(companyId);

        if (result.success) {
            toast.success(result.message);
            router.refresh();
            onClose();
        } else {
            toast.error(result.message);
        }
        setIsSubmitting(false);
    };

    return (
        <Sheet open={true} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-2xl w-full flex flex-col h-full p-0">
                <SheetHeader className="px-6 pt-6 pb-3 shrink-0">
                    <SheetTitle>Company Profile</SheetTitle>
                    <SheetDescription>
                        Review company details and business registration before approval
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center flex-1">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !company ? (
                    <div className="flex items-center justify-center flex-1">
                        <p className="text-muted-foreground">Failed to load company profile</p>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 overflow-auto">
                            <div className="space-y-6 px-6 pb-4">
                                {/* Basic Information */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Company Information</h3>
                                    </div>

                                    {/* Company Logo & Name */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <Avatar className="h-20 w-20 border-2 border-border">
                                            <AvatarImage src={company.logo_url || undefined} alt={company.company_name} />
                                            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                                                {company.company_name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-xl">{company.company_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="font-normal">
                                                    {formatIndustry(company.industry)}
                                                </Badge>
                                                {company.company_size && (
                                                    <span className="text-sm text-muted-foreground">
                                                        • {company.company_size} Employees
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Business Reg. No</p>
                                            <p className="font-medium font-mono">{company.business_registration_no}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Phone</p>
                                            <p className="font-medium">{company.phone}</p>
                                        </div>
                                        {company.website && (
                                            <div className="col-span-2">
                                                <p className="text-muted-foreground">Website</p>
                                                <a
                                                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-primary hover:underline flex items-center gap-1"
                                                >
                                                    {company.website} <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground">Registered Address</p>
                                            <p className="font-medium">{company.business_registered_address}</p>
                                        </div>

                                        {/* Certificate Download */}
                                        <div className="col-span-2 mt-2">
                                            <p className="text-muted-foreground mb-1">Business Registration Certificate</p>
                                            <Button variant="default" size="sm" asChild className="h-9 w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                                                <a href={company.br_certificate_url} target="_blank" rel="noopener noreferrer">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View Registration Certificate
                                                </a>
                                            </Button>
                                        </div>
                                    </div>

                                    {company.description && (
                                        <div className="mt-4">
                                            <p className="text-muted-foreground text-sm mb-1">Description</p>
                                            <p className="text-sm leading-relaxed">{company.description}</p>
                                        </div>
                                    )}

                                    {company.specialities && company.specialities.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-muted-foreground text-sm mb-2">Specialties</p>
                                            <div className="flex flex-wrap gap-2">
                                                {company.specialities.map((spec, idx) => (
                                                    <Badge key={idx} variant="outline">{spec}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <Separator />

                                {/* Admin Information */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Super Admin Contact</h3>
                                    </div>

                                    {company.admin ? (
                                        <div className="bg-muted/30 p-4 rounded-lg text-sm border">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-muted-foreground">Name</p>
                                                    <p className="font-medium">{company.admin.first_name} {company.admin.last_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Job Title</p>
                                                    <p className="font-medium">{company.admin.job_title || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Email</p>
                                                    <p className="font-medium">{company.admin.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Phone</p>
                                                    <p className="font-medium">{company.admin.phone || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm italic">Admin information not available</p>
                                    )}
                                </section>

                                {/* Rejection Reason (if rejected) */}
                                {company.approval_status === 'rejected' && company.rejection_reason && (
                                    <>
                                        <Separator />
                                        <section>
                                            <h3 className="text-lg font-semibold mb-2 text-red-600">Previous Rejection Reason</h3>
                                            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-900">
                                                <p className="text-sm">{company.rejection_reason}</p>
                                            </div>
                                        </section>
                                    </>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Action Buttons - Fixed at bottom */}
                        <div className="border-t px-6 py-4 bg-background shrink-0">
                            {!showRejectForm ? (
                                <div className="space-y-3">
                                    {/* Revoke Button - Only shown for approved/rejected companies */}
                                    {(company.approval_status === 'approved' || company.approval_status === 'rejected') && (
                                        <Button
                                            onClick={handleRevoke}
                                            disabled={isSubmitting}
                                            variant="outline"
                                            className="w-full h-11 font-medium border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-500 dark:hover:bg-amber-950"
                                            size="lg"
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Revoke & Reset to Pending
                                        </Button>
                                    )}

                                    {/* Approve/Reject Buttons */}
                                    <div className="flex gap-3">
                                        {company.approval_status !== 'approved' && (
                                            <Button
                                                onClick={handleApprove}
                                                disabled={isSubmitting}
                                                className="flex-1 h-11 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 font-medium"
                                                size="lg"
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Approve Company
                                            </Button>
                                        )}
                                        {company.approval_status !== 'rejected' && (
                                            <Button
                                                onClick={() => setShowRejectForm(true)}
                                                disabled={isSubmitting}
                                                variant="destructive"
                                                className="flex-1 h-11 font-medium"
                                                size="lg"
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject Company
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="reject-reason" className="text-sm font-medium">Rejection Reason</Label>
                                        <Textarea
                                            id="reject-reason"
                                            placeholder="Provide a detailed reason for rejection..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={3}
                                            className="mt-1.5 resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleReject}
                                            disabled={isSubmitting || !rejectionReason.trim()}
                                            variant="destructive"
                                            className="flex-1 h-11 font-medium"
                                            size="lg"
                                        >
                                            {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowRejectForm(false);
                                                setRejectionReason("");
                                            }}
                                            disabled={isSubmitting}
                                            variant="outline"
                                            className="flex-1 h-11 font-medium"
                                            size="lg"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )
                }
            </SheetContent >
        </Sheet >
    );
}
