"use client";

import { useEffect, useState } from "react";
import { X, Loader2, User, Briefcase, GraduationCap, Award, FolderGit2, BadgeCheck as CertIcon, CheckCircle2, XCircle, RotateCcw, FileText } from "lucide-react";
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
import { approveCandidateProfile, rejectCandidateProfile, revokeCandidateApproval } from "@/app/actions/candidate";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatIndustry, sortEducations } from "@/lib/utils";
import { formatUTCDate } from "@/lib/date-utils";

interface CandidateData {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    alternative_phone?: string;
    address: string;
    country?: string;
    industry: string;
    current_position: string;
    years_of_experience: number;
    experience_level: string;
    expected_monthly_salary?: number;
    availability_status?: string;
    notice_period?: string;
    professional_summary?: string;
    approval_status: string;
    rejection_reason?: string;
    membership_no?: string;
    resume_url?: string;
    profile_image_url?: string;
    work_experiences: Array<{
        job_title: string;
        company: string;
        start_date: string;
        end_date?: string;
        is_current: boolean;
    }>;
    educations: Array<{
        degree_diploma: string;
        institution: string;
        status: string;
    }>;
    awards: Array<{
        nature_of_award: string;
        offered_by: string;
    }>;
    projects: Array<{
        project_name: string;
        description: string;
    }>;
    certificates: Array<{
        certificate_name: string;
        issuing_authority: string;
    }>;
}

interface CandidateProfileViewProps {
    candidateId: string;
    onClose: () => void;
}

export function CandidateProfileView({ candidateId, onClose }: CandidateProfileViewProps) {
    const [candidate, setCandidate] = useState<CandidateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchCandidate() {
            try {
                const response = await fetch(`/api/mis/candidates/${candidateId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCandidate(data);
                }
            } catch (error) {
                console.error("Error fetching candidate:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchCandidate();
    }, [candidateId]);

    const handleApprove = async () => {
        setIsSubmitting(true);
        const result = await approveCandidateProfile(candidateId);

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
        const result = await rejectCandidateProfile(candidateId, rejectionReason);

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
        const result = await revokeCandidateApproval(candidateId);

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
                    <SheetTitle>Candidate Profile</SheetTitle>
                    <SheetDescription>
                        Review complete profile before approval or rejection
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center flex-1">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !candidate ? (
                    <div className="flex items-center justify-center flex-1">
                        <p className="text-muted-foreground">Failed to load candidate profile</p>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 overflow-auto">
                            <div className="space-y-6 px-6 pb-4">
                                {/* Basic Information */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Basic Information</h3>
                                    </div>

                                    {/* Profile Image */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <Avatar className="h-20 w-20 border-2 border-border">
                                            <AvatarImage src={candidate.profile_image_url || undefined} alt={`${candidate.first_name} ${candidate.last_name}`} />
                                            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                                                {candidate.first_name[0]}{candidate.last_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-base">{candidate.first_name} {candidate.last_name}</p>
                                            {candidate.membership_no && (
                                                <p className="text-sm text-muted-foreground font-mono">Member: {candidate.membership_no}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Email</p>
                                            <p className="font-medium">{candidate.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Phone</p>
                                            <p className="font-medium">{candidate.phone}</p>
                                        </div>
                                        {candidate.alternative_phone && (
                                            <div>
                                                <p className="text-muted-foreground">Alt. Phone</p>
                                                <p className="font-medium">{candidate.alternative_phone}</p>
                                            </div>
                                        )}
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground">Address</p>
                                            <p className="font-medium">{candidate.address}</p>
                                        </div>
                                        {candidate.country && (
                                            <div>
                                                <p className="text-muted-foreground">Country</p>
                                                <p className="font-medium">{candidate.country}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <Separator />

                                {/* Professional Information */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Professional Details</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Industry</p>
                                            <p className="font-medium">{formatIndustry(candidate.industry)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Current Position</p>
                                            <p className="font-medium">{candidate.current_position}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Experience</p>
                                            <p className="font-medium">
                                                {candidate.years_of_experience} years ({candidate.experience_level})
                                            </p>
                                        </div>
                                        {candidate.expected_monthly_salary && (
                                            <div>
                                                <p className="text-muted-foreground">Expected Salary</p>
                                                <p className="font-medium">LKR {candidate.expected_monthly_salary.toLocaleString()}</p>
                                            </div>
                                        )}
                                        {candidate.availability_status && (
                                            <div>
                                                <p className="text-muted-foreground">Availability</p>
                                                <p className="font-medium">{candidate.availability_status}</p>
                                            </div>
                                        )}
                                        {candidate.notice_period && (
                                            <div>
                                                <p className="text-muted-foreground">Notice Period</p>
                                                <p className="font-medium">{candidate.notice_period}</p>
                                            </div>
                                        )}
                                        {candidate.resume_url && (
                                            <div className="col-span-2 my-4">
                                                <p className="text-muted-foreground mb-1">Resume</p>
                                                <Button variant="default" size="sm" asChild className="h-9 bg-green-500">
                                                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        View Candidate Resume
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {candidate.professional_summary && (
                                        <div className="mt-3">
                                            <p className="text-muted-foreground text-sm">Professional Summary</p>
                                            <p className="text-sm mt-1">{candidate.professional_summary}</p>
                                        </div>
                                    )}
                                </section>

                                {/* Work Experience */}
                                {candidate.work_experiences.length > 0 && (
                                    <>
                                        <Separator />
                                        <section>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Briefcase className="h-5 w-5 text-primary" />
                                                <h3 className="text-lg font-semibold">Work Experience</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {candidate.work_experiences.map((exp, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <p className="font-medium">{exp.job_title}</p>
                                                        <p className="text-muted-foreground">{exp.company}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatUTCDate(exp.start_date, "MMM yyyy")} -{' '}
                                                            {exp.is_current ? 'Present' : formatUTCDate(exp.end_date!, "MMM yyyy")}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </>
                                )}

                                {/* Education */}
                                {candidate.educations.length > 0 && (
                                    <>
                                        <Separator />
                                        <section>
                                            <div className="flex items-center gap-2 mb-3">
                                                <GraduationCap className="h-5 w-5 text-primary" />
                                                <h3 className="text-lg font-semibold">Education</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {sortEducations(candidate.educations).map((edu, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <p className="font-medium">{edu.degree_diploma}</p>
                                                        <p className="text-muted-foreground">{edu.institution}</p>
                                                        <Badge variant="outline" className="text-xs mt-1">{edu.status}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </>
                                )}

                                {/* Awards */}
                                {candidate.awards.length > 0 && (
                                    <>
                                        <Separator />
                                        <section>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Award className="h-5 w-5 text-primary" />
                                                <h3 className="text-lg font-semibold">Awards & Achievements</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {candidate.awards.map((award, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <p className="font-medium">{award.nature_of_award}</p>
                                                        <p className="text-muted-foreground">{award.offered_by}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </>
                                )}

                                {/* Projects */}
                                {candidate.projects.length > 0 && (
                                    <>
                                        <Separator />
                                        <section>
                                            <div className="flex items-center gap-2 mb-3">
                                                <FolderGit2 className="h-5 w-5 text-primary" />
                                                <h3 className="text-lg font-semibold">Projects</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {candidate.projects.map((project, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <p className="font-medium">{project.project_name}</p>
                                                        <p className="text-muted-foreground text-xs">{project.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </>
                                )}

                                {/* Certificates */}
                                {candidate.certificates.length > 0 && (
                                    <>
                                        <Separator />
                                        <section>
                                            <div className="flex items-center gap-2 mb-3">
                                                <CertIcon className="h-5 w-5 text-primary" />
                                                <h3 className="text-lg font-semibold">Certifications</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {candidate.certificates.map((cert, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <p className="font-medium">{cert.certificate_name}</p>
                                                        <p className="text-muted-foreground">{cert.issuing_authority}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </>
                                )}

                                {/* Rejection Reason (if rejected) */}
                                {candidate.approval_status === 'rejected' && candidate.rejection_reason && (
                                    <>
                                        <Separator />
                                        <section>
                                            <h3 className="text-lg font-semibold mb-2 text-red-600">Previous Rejection Reason</h3>
                                            <p className="text-sm text-muted-foreground">{candidate.rejection_reason}</p>
                                        </section>
                                    </>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Action Buttons - Fixed at bottom */}
                        <div className="border-t px-6 py-4 bg-background shrink-0">
                            {!showRejectForm ? (
                                <div className="space-y-3">
                                    {/* Revoke Button - Only shown for approved/rejected candidates */}
                                    {(candidate.approval_status === 'approved' || candidate.approval_status === 'rejected') && (
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
                                        {candidate.approval_status !== 'approved' && (
                                            <Button
                                                onClick={handleApprove}
                                                disabled={isSubmitting}
                                                className="flex-1 h-11 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 font-medium"
                                                size="lg"
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Approve Profile
                                            </Button>
                                        )}
                                        {candidate.approval_status !== 'rejected' && (
                                            <Button
                                                onClick={() => setShowRejectForm(true)}
                                                disabled={isSubmitting}
                                                variant="destructive"
                                                className="flex-1 h-11 font-medium"
                                                size="lg"
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject Profile
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
