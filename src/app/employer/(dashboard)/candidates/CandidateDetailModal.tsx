"use client";

import { useEffect, useState, useRef } from "react";
import { X, Loader2, User, Briefcase, GraduationCap, Award, FolderGit2, BadgeCheck as CertIcon, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InviteCandidateButton } from "@/components/employer/InviteCandidateButton";
import { formatIndustry, sortEducations, formatPhoneNumber } from "@/lib/utils";
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
    employment_type?: string;
    expected_monthly_salary?: number;
    availability_status?: string;
    notice_period?: string;
    professional_summary?: string;
    membership_no?: string;
    resume_url?: string;
    profile_image_url?: string;
    qualifications: string[];
    highest_qualification?: string;
    work_experiences: Array<{
        job_title: string;
        company: string;
        start_date: string;
        end_date?: string;
        is_current: boolean;
        description?: string;
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

interface CandidateDetailModalProps {
    candidateId: string;
    selectedIndustry?: string;
    selectedDesignation?: string;
    isInvited?: boolean;
    isHiredElsewhere?: boolean;
    // Invitation journey fields — used to disable Cancel Invitation once accepted
    invitationStatus?: string | null;
    invitationPipelineStatus?: string | null;
    invitationInterviewConfirmed?: boolean;
    invitationCurrentRound?: number | null;
    invitationMisRescheduled?: boolean;
    onClose: () => void;
}

function formatQualification(qual: string): string {
    return qual.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function CandidateDetailModal({ candidateId, selectedIndustry, selectedDesignation, isInvited = false, isHiredElsewhere = false, invitationStatus, invitationPipelineStatus, invitationInterviewConfirmed, invitationCurrentRound, invitationMisRescheduled, onClose }: CandidateDetailModalProps) {
    const [candidate, setCandidate] = useState<CandidateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCVViewer, setShowCVViewer] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        async function fetchCandidate() {
            try {
                const response = await fetch(`/api/employer/candidates/${candidateId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCandidate(data);
                } else {
                    console.error("Failed to fetch candidate");
                }
            } catch (error) {
                console.error("Error fetching candidate:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchCandidate();
    }, [candidateId]);

    return (
        <Sheet open={true} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-4xl w-full flex flex-col h-full p-0">
                <SheetHeader className="px-6 pt-6 pb-3 shrink-0">
                    <SheetTitle>Candidate Profile</SheetTitle>
                    <SheetDescription>
                        Complete profile details of the candidate
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
                    <ScrollArea className="flex-1 overflow-auto">
                        <div className="space-y-6 px-6 pb-6">
                            {/* Candidate Header */}
                            <section className="pt-2">
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    <Avatar className="h-24 w-24 shrink-0">
                                        <AvatarImage src={candidate.profile_image_url} alt={`${candidate.first_name} ${candidate.last_name}`} />
                                        <AvatarFallback className="text-2xl">
                                            {candidate.first_name[0]}{candidate.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <h2 className="text-2xl font-bold">
                                                {candidate.first_name} {candidate.last_name}
                                            </h2>
                                            <p className="text-muted-foreground">
                                                {candidate.current_position}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                                                    {candidate.email}
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{formatPhoneNumber(candidate.phone)}</span>
                                            </div>
                                            {candidate.alternative_phone && (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span>{formatPhoneNumber(candidate.alternative_phone)} (Alt)</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{candidate.address}</span>
                                            </div>
                                            {candidate.membership_no && (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span>Member: {candidate.membership_no}</span>
                                                </div>
                                            )}
                                        </div>
                                        {candidate.resume_url && (
                                            <div className="pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowCVViewer(true)}
                                                    className="inline-flex items-center gap-2"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    View CV
                                                </Button>
                                            </div>
                                        )}
                                    </div>
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
                                    {/* Industry Removed */}
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
                                    {candidate.employment_type && (
                                        <div>
                                            <p className="text-muted-foreground">Employment Type</p>
                                            <p className="font-medium capitalize">{candidate.employment_type.replace('_', ' ')}</p>
                                        </div>
                                    )}
                                    {candidate.expected_monthly_salary && (
                                        <div>
                                            <p className="text-muted-foreground">Expected Salary</p>
                                            <p className="font-medium">LKR {candidate.expected_monthly_salary.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {candidate.availability_status && (
                                        <div>
                                            <p className="text-muted-foreground">Availability</p>
                                            <p className="font-medium capitalize">{candidate.availability_status.replace(/_/g, ' ')}</p>
                                        </div>
                                    )}
                                    {candidate.notice_period && (
                                        <div>
                                            <p className="text-muted-foreground">Notice Period</p>
                                            <p className="font-medium">{candidate.notice_period}</p>
                                        </div>
                                    )}
                                    {candidate.country && (
                                        <div>
                                            <p className="text-muted-foreground">Country</p>
                                            <p className="font-medium">{candidate.country}</p>
                                        </div>
                                    )}
                                    {candidate.highest_qualification && (
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground">Highest Qualification</p>
                                            <p className="font-medium capitalize">{candidate.highest_qualification.replace(/_/g, ' ')}</p>
                                        </div>
                                    )}
                                    {candidate.qualifications && candidate.qualifications.length > 0 && (
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground mb-2">Qualifications</p>
                                            <div className="flex flex-wrap gap-2">
                                                {candidate.qualifications.map((qual, idx) => (
                                                    <Badge key={idx} variant="outline">
                                                        {formatQualification(qual)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {candidate.professional_summary && (
                                    <div className="mt-4">
                                        <p className="text-muted-foreground text-sm mb-1">Professional Summary</p>
                                        <p className="text-sm">{candidate.professional_summary}</p>
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
                                        <div className="space-y-4">
                                            {candidate.work_experiences.map((exp, idx) => (
                                                <div key={idx} className="text-sm">
                                                    <p className="font-medium">{exp.job_title}</p>
                                                    <p className="text-muted-foreground">{exp.company}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatUTCDate(exp.start_date, "MMM yyyy")} -{' '}
                                                        {exp.is_current ? 'Present' : formatUTCDate(exp.end_date!, "MMM yyyy")}
                                                    </p>
                                                    {exp.description && (
                                                        <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>
                                                    )}
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
                                        <div className="space-y-3">
                                            {sortEducations(candidate.educations).map((edu, idx) => (
                                                <div key={idx} className="text-sm">
                                                    <p className="font-medium">{edu.degree_diploma}</p>
                                                    <p className="text-muted-foreground">{edu.institution}</p>
                                                    <Badge variant="outline" className="text-xs mt-1 capitalize">{edu.status.replace('_', ' ')}</Badge>
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

                            {/* Invitation Section */}
                            <Separator />
                            <section className="pb-4">
                                <InviteCandidateButton
                                    candidateId={candidateId}
                                    suggestedIndustry={selectedIndustry}
                                    suggestedDesignation={selectedDesignation}
                                    isInvited={isInvited}
                                    isHiredElsewhere={isHiredElsewhere}
                                    invitationStatus={invitationStatus}
                                    invitationPipelineStatus={invitationPipelineStatus}
                                    invitationInterviewConfirmed={invitationInterviewConfirmed}
                                    invitationCurrentRound={invitationCurrentRound}
                                    invitationMisRescheduled={invitationMisRescheduled}
                                />
                            </section>
                        </div>
                    </ScrollArea>
                )}
            </SheetContent>

            {/* CV Viewer Dialog */}
            {candidate && showCVViewer && candidate.resume_url && (
                <Dialog open={showCVViewer} onOpenChange={setShowCVViewer}>
                    <DialogContent className="max-w-[95vw] md:max-w-[85vw] lg:max-w-[75vw] xl:max-w-[65vw] h-[95vh] flex flex-col p-4 sm:p-6">
                        <DialogHeader>
                            <DialogTitle>Candidate CV - {candidate.first_name} {candidate.last_name}</DialogTitle>
                            <DialogDescription>
                                Viewing resume document. Use the scrollbar on the right to navigate.
                            </DialogDescription>
                        </DialogHeader>
                        <div
                            className="flex-1 overflow-hidden rounded-md border relative"
                            onContextMenu={(e) => e.preventDefault()}
                            onMouseDown={(e) => {
                                if (e.button === 2) {
                                    e.preventDefault();
                                    return false;
                                }
                            }}
                            style={{ userSelect: 'none' }}
                        >
                            {/* Watermark Overlay */}
                            <div
                                className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
                                style={{
                                    background: 'repeating-linear-gradient(45deg, transparent, transparent 200px, rgba(0,0,0,0.02) 200px, rgba(0,0,0,0.02) 400px)'
                                }}
                            >
                                <div className="text-6xl font-bold text-gray-300 opacity-20 rotate-[-45deg] select-none">
                                    CONFIDENTIAL
                                </div>
                            </div>

                            {/* Content Blocking Overlay - Leaves space for scrollbar on right */}
                            <div
                                className="absolute inset-0 right-[24px] z-[5]"
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
                                style={{
                                    cursor: 'default'
                                }}
                            />


                            <iframe
                                ref={iframeRef}
                                src={(candidate.resume_url?.toLowerCase().includes('.doc') || candidate.resume_url?.toLowerCase().includes('.docx'))
                                    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(candidate.resume_url)}`
                                    : `${candidate.resume_url}#toolbar=0&navpanes=0&view=FitH`}
                                className="w-full h-full relative z-0"
                                title="Candidate Resume"
                                style={{
                                    border: 'none',
                                    userSelect: 'none'
                                }}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
                                onMouseDown={(e) => {
                                    if (e.button === 2) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return false;
                                    }
                                }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </Sheet>
    );
}
