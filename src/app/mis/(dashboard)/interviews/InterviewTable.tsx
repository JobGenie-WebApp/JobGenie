"use client";

import { useState, useMemo, useEffect } from "react";
import { formatUTCTime, formatDate } from "@/lib/date-utils";
import { formatIndustry } from "@/lib/utils";
import {
    Table,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Video, MapPin, CheckCircle2, Clock, XCircle, Calendar } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Interview {
    id: string;
    industry: string;
    job_designation: string;
    interview_mode: "online" | "physical" | null;
    interview_confirmed: boolean;
    invitation_canceled: boolean;
    canceled_by: "candidate" | "employer" | null;
    sent_at: string;
    viewed_at: string | null;
    responded_at: string | null;
    selected_time_slot: { date: string; time: string } | null;
    mis_rescheduled?: boolean;
    mis_rescheduled_at?: string;
    mis_reschedule_data?: { date: string; time: string } | null;
    candidate: {
        first_name: string;
        last_name: string;
        email: string;
        profile_image_url: string | null;
    };
    employer: {
        first_name: string;
        last_name: string;
        company_id: string;
    };
    company: {
        company_name: string;
        logo_url: string | null;
    };
}

interface InterviewTableProps {
    interviews: Interview[];
    onViewDetails: (id: string) => void;
}

export function InterviewTable({ interviews, onViewDetails }: InterviewTableProps) {
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [modeFilter, setModeFilter] = useState<string>("all");
    const [companyFilter, setCompanyFilter] = useState<string>("all");
    const [jobRoleFilter, setJobRoleFilter] = useState<string>("all");
    const [cancelledByFilter, setCancelledByFilter] = useState<string>("all");

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredInterviews = useMemo(() => {
        return (interviews || []).filter((interview) => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                interview.candidate.first_name.toLowerCase().includes(searchLower) ||
                interview.candidate.last_name.toLowerCase().includes(searchLower) ||
                interview.company.company_name.toLowerCase().includes(searchLower) ||
                formatIndustry(interview.industry).toLowerCase().includes(searchLower) ||
                interview.job_designation.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // Status filter
            if (statusFilter !== "all") {
                if (statusFilter === "confirmed" && (!interview.interview_confirmed || interview.invitation_canceled)) {
                    return false;
                }
                if (statusFilter === "pending" && (interview.interview_confirmed || interview.invitation_canceled)) {
                    return false;
                }
                if (statusFilter === "cancelled" && !interview.invitation_canceled) {
                    return false;
                }
            }

            // Mode filter
            if (modeFilter !== "all" && interview.interview_mode !== modeFilter) {
                return false;
            }

            // Company filter
            if (companyFilter !== "all" && interview.company.company_name !== companyFilter) {
                return false;
            }

            // Job role filter
            if (jobRoleFilter !== "all" && interview.job_designation !== jobRoleFilter) {
                return false;
            }

            // Cancelled By filter
            if (cancelledByFilter !== "all") {
                if (cancelledByFilter === "candidate" && interview.canceled_by !== "candidate") {
                    return false;
                }
                if (cancelledByFilter === "employer" && interview.canceled_by !== "employer") {
                    return false;
                }
            }

            return true;
        });
    }, [interviews, searchQuery, statusFilter, modeFilter, companyFilter, jobRoleFilter, cancelledByFilter]);

    // Get unique companies and job roles for filter options
    const uniqueCompanies = useMemo(() => {
        const companies = new Set(interviews.map(i => i.company.company_name));
        return Array.from(companies).sort();
    }, [interviews]);

    const uniqueJobRoles = useMemo(() => {
        const roles = new Set(interviews.map(i => i.job_designation));
        return Array.from(roles).sort();
    }, [interviews]);

    const getStatusBadge = (interview: Interview) => {
        if (interview.mis_rescheduled) {
            return (
                <Badge className="bg-green-600 text-white gap-1">
                    <Calendar className="h-3 w-3" />
                    Rescheduled
                </Badge>
            );
        }
        if (interview.invitation_canceled) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Cancelled
                </Badge>
            );
        }
        if (interview.interview_confirmed) {
            return (
                <Badge variant="default" className="gap-1 bg-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmed
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                Pending
            </Badge>
        );
    };

    const getEngagementBadge = (interview: Interview) => {
        if (interview.responded_at) {
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Responded</Badge>;
        }
        if (interview.viewed_at) {
            return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Viewed</Badge>;
        }
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Sent</Badge>;
    };

    const getInterviewDateTime = (interview: Interview) => {
        // Prioritize MIS reschedule data if available and rescheduled
        if (interview.mis_rescheduled && interview.mis_reschedule_data) {
            return `${formatDate(interview.mis_reschedule_data.date)} at ${formatUTCTime(interview.mis_reschedule_data.date, interview.mis_reschedule_data.time)}`;
        }

        if (interview.selected_time_slot) {
            const slot = interview.selected_time_slot;
            return `${formatDate(slot.date)} at ${formatUTCTime(slot.date, slot.time)}`;
        }
        return "Not scheduled";
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by candidate, company, industry, or job role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {mounted && (
                    <div className="flex flex-wrap gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={modeFilter} onValueChange={setModeFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Modes</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="physical">Physical</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={companyFilter} onValueChange={setCompanyFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Company" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Companies</SelectItem>
                                {uniqueCompanies.map(company => (
                                    <SelectItem key={company} value={company}>
                                        {company}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={jobRoleFilter} onValueChange={setJobRoleFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Job Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Job Roles</SelectItem>
                                {uniqueJobRoles.map(role => (
                                    <SelectItem key={role} value={role}>
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={cancelledByFilter} onValueChange={setCancelledByFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Cancelled By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Cancelled By</SelectItem>
                                <SelectItem value="candidate">Candidate</SelectItem>
                                <SelectItem value="employer">Employer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
                Showing {filteredInterviews.length} of {interviews.length} interviews
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Interview Date/Time</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Engagement</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {filteredInterviews.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No interviews found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInterviews.map((interview) => (
                                <TableRow
                                    key={interview.id}
                                    className="cursor-pointer border-b transition-colors duration-150 hover:bg-muted/60"
                                    onClick={() => onViewDetails(interview.id)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={interview.candidate.profile_image_url || undefined} />
                                                <AvatarFallback>
                                                    {interview.candidate.first_name[0]}{interview.candidate.last_name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">
                                                    {interview.candidate.first_name} {interview.candidate.last_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {interview.candidate.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {interview.company.logo_url && (
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={interview.company.logo_url} />
                                                    <AvatarFallback>{interview.company.company_name[0]}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <span className="font-medium">{interview.company.company_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium text-sm">{interview.job_designation}</div>
                                            <div className="text-xs text-muted-foreground">{formatIndustry(interview.industry)}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{getInterviewDateTime(interview)}</div>
                                    </TableCell>
                                    <TableCell>
                                        {interview.interview_mode === "online" ? (
                                            <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                                                <Video className="h-3 w-3" />
                                                Online
                                            </Badge>
                                        ) : interview.interview_mode === "physical" ? (
                                            <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
                                                <MapPin className="h-3 w-3" />
                                                Physical
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{getEngagementBadge(interview)}</TableCell>
                                    <TableCell>{getStatusBadge(interview)}</TableCell>
                                    {/* <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewDetails(interview.id)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                        </Button>
                                    </TableCell> */}
                                </TableRow>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}
