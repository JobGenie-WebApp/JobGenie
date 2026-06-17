"use client";

import { useState, useEffect } from "react";
import { Users, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { CandidateDetailModal } from "./CandidateDetailModal";
import { cn, formatIndustry } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { resolveIndustryIdsForProfile } from "@/lib/job-designations-resolve";
import {
    getInvitationJourneyDisplay,
    journeyVariantToEmployerBadgeProps,
} from "@/lib/invitation-journey-status";

interface Candidate {
    id: string;
    first_name: string;
    last_name: string;
    industry: string;
    current_position: string;
    years_of_experience: number | null;
    experience_level: string | null;
    employment_type: string | null;
    availability_status: string | null;
    highest_qualification: string | null;
    expected_monthly_salary: number | null;
    qualifications: string[];
    expected_positions: string[];  // Positions the candidate is targeting
    invited: boolean;  // Track if candidate has been invited by this company
    isHiredElsewhere: boolean;  // Candidate hired by a different company
    // Invitation journey fields (present when invited=true)
    invitationStatus?: string | null;
    invitationPipelineStatus?: string | null;
    invitationInterviewConfirmed?: boolean;
    invitationCurrentRound?: number | null;
    invitationMisRescheduled?: boolean;
}

interface Industry {
    industry_id: number;
    industry_name: string;
}

interface JobDesignation {
    designation_id: number;
    designation_name: string;
    industry_id: number;
    level_id: number;
}

interface CandidateTableProps {
    candidates: Candidate[];
    industries: Industry[];
}

function formatExperienceLevel(level: string | null): string {
    if (!level) return 'N/A';
    return level.charAt(0).toUpperCase() + level.slice(1).replace('_', ' ');
}

function formatEmploymentType(type: string | null): string {
    if (!type) return 'N/A';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatAvailabilityStatus(status: string | null): string {
    if (!status) return 'N/A';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getHighestQualification(qualifications: string[]): string {
    if (!qualifications || qualifications.length === 0) return 'N/A';

    // Priority order (highest to lowest)
    const priority = [
        'doctorate_phd',
        'masters_degree',
        'post_graduate',
        'bachelors_degree',
        'professional_certification',
        'undergraduate',
        'diploma',
        'certificate',
        'vocational_training',
        'no_formal_education'
    ];

    for (const qual of priority) {
        if (qualifications.includes(qual)) {
            return qual.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
    }

    return qualifications[0].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function CandidateTable({ candidates, industries }: CandidateTableProps) {
    const [selectedIndustryId, setSelectedIndustryId] = useState<string>("");
    const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [jobDesignations, setJobDesignations] = useState<JobDesignation[]>([]);
    const [loadingDesignations, setLoadingDesignations] = useState(false);

    // Optional filters
    const [expectedSalaryStr, setExpectedSalaryStr] = useState<string>("");
    const [selectedExperience, setSelectedExperience] = useState<string>("_all");
    const [selectedQualification, setSelectedQualification] = useState<string>("_all");
    const [showOptionalFilters, setShowOptionalFilters] = useState(false);

    // Fetch job designations when industry is selected
    useEffect(() => {
        if (selectedIndustryId) {
            setLoadingDesignations(true);
            fetch(`/api/job-designations?industryId=${selectedIndustryId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setJobDesignations(data.data || []);
                    } else {
                        console.error("Failed to fetch job designations:", data.error);
                        setJobDesignations([]);
                    }
                })
                .catch(error => {
                    console.error("Error fetching job designations:", error);
                    setJobDesignations([]);
                })
                .finally(() => {
                    setLoadingDesignations(false);
                });
        } else {
            setJobDesignations([]);
        }
    }, [selectedIndustryId]);

    // Get the selected industry name for filtering candidates
    const selectedIndustryName = industries.find(
        ind => ind.industry_id.toString() === selectedIndustryId
    )?.industry_name || "";

    // Reset job designation when industry changes
    const handleIndustryChange = (industryId: string) => {
        setSelectedIndustryId(industryId);
        setSelectedDesignations([]); // Reset designations when industry changes
    };

    // Use database enum values for optional dropdowns
    const EXPERIENCE_LEVELS = [
        "entry",
        "junior",
        "mid",
        "senior",
        "lead",
        "principal"
    ];

    const QUALIFICATIONS = [
        "doctorate_phd",
        "masters_degree",
        "post_graduate",
        "bachelors_degree",
        "professional_certification",
        "undergraduate",
        "diploma",
        "certificate",
        "vocational_training",
        "no_formal_education"
    ];

    // Filter candidates by industry + expected_positions (mandatory) and optional filters.
    // Candidates appear in results only if the searched designation
    // is listed in their expected_positions array.
    const filteredCandidates = (selectedIndustryId && selectedDesignations.length > 0)
        ? candidates.filter(candidate => {
            const candidateIndustryIds = resolveIndustryIdsForProfile(candidate.industry, industries);
            
            // 1. Mandatory filters
            const hasMatchingDesignation = selectedDesignations.some(desig => 
                (candidate.expected_positions ?? []).includes(desig)
            );
            
            const matchMandatory = candidateIndustryIds.includes(parseInt(selectedIndustryId, 10)) && hasMatchingDesignation;
            if (!matchMandatory) return false;

            // 2. Optional filters
            if (expectedSalaryStr) {
                const maxSal = parseInt(expectedSalaryStr, 10);
                if (!isNaN(maxSal) && candidate.expected_monthly_salary && candidate.expected_monthly_salary > maxSal) {
                    return false;
                }
            }

            if (selectedExperience && selectedExperience !== "_all") {
                if (candidate.experience_level !== selectedExperience) return false;
            }

            if (selectedQualification && selectedQualification !== "_all") {
                if (candidate.highest_qualification !== selectedQualification) return false;
            }

            return true;
        })
        : [];

    const hasSearched = selectedIndustryId !== "" && selectedDesignations.length > 0;

    return (
        <div className="space-y-6">
            {/* Search/Filter Section */}
            <Card variant="glass" className="gap-0 rounded-3xl border-primary/10 p-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-1">Search Candidates</h2>
                        <p className="text-sm text-muted-foreground">
                            Select an industry and job designation to find candidates who are targeting that role
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Industry Filter */}
                        <div className="space-y-2">
                            <label htmlFor="industry-filter" className="text-sm font-medium block">
                                1. Select Industry
                            </label>
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <Select value={selectedIndustryId} onValueChange={handleIndustryChange}>
                                    <SelectTrigger id="industry-filter" className="w-full" suppressHydrationWarning>
                                        <SelectValue placeholder="Choose an industry..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {industries.map((industry) => (
                                            <SelectItem key={industry.industry_id} value={industry.industry_id.toString()}>
                                                {industry.industry_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Job Designation Filter */}
                        <div className="space-y-2">
                            <label htmlFor="designation-filter" className="text-sm font-medium block">
                                2. Select Job Designation
                            </label>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="w-full" id="designation-filter">
                                    <MultiCombobox
                                        options={jobDesignations.map((designation) => ({
                                            value: designation.designation_name,
                                            label: designation.designation_name,
                                        }))}
                                        values={selectedDesignations}
                                        onValuesChange={setSelectedDesignations}
                                        placeholder={
                                            selectedIndustryId
                                                ? "Choose job designations..."
                                                : "Select industry first..."
                                        }
                                        searchPlaceholder="Search designations..."
                                        emptyMessage={
                                            selectedIndustryId
                                                ? "No designations found."
                                                : "Select an industry to load designations."
                                        }
                                        disabled={!selectedIndustryId || loadingDesignations}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Optional Filters */}
                    <div className="pt-4 mt-4 border-t border-border/50">
                        <button
                            onClick={() => setShowOptionalFilters(!showOptionalFilters)}
                            className="flex items-center justify-between w-full mb-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <span>Optional Filters</span>
                            {showOptionalFilters ? (
                                <ChevronUp className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <ChevronDown className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                        {showOptionalFilters && (
                            <div className="grid gap-4 sm:grid-cols-3">
                            {/* Max Expected Salary Filter */}
                            <div className="space-y-2">
                                <label htmlFor="salary-filter" className="text-sm font-medium block">
                                    Max Expected Salary (LKR)
                                </label>
                                <Input
                                    id="salary-filter"
                                    type="number"
                                    placeholder="e.g. 150000"
                                    value={expectedSalaryStr}
                                    onChange={(e) => setExpectedSalaryStr(e.target.value)}
                                />
                            </div>

                            {/* Experience Filter */}
                            <div className="space-y-2">
                                <label htmlFor="experience-filter" className="text-sm font-medium block">
                                    Experience Level
                                </label>
                                <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                                    <SelectTrigger id="experience-filter" className="w-full">
                                        <SelectValue placeholder="Any Experience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_all">Any Experience</SelectItem>
                                        {EXPERIENCE_LEVELS.map((exp) => (
                                            <SelectItem key={exp} value={exp}>
                                                {formatExperienceLevel(exp)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Qualification Filter */}
                            <div className="space-y-2">
                                <label htmlFor="qualification-filter" className="text-sm font-medium block">
                                    Highest Qualification
                                </label>
                                <Select value={selectedQualification} onValueChange={setSelectedQualification}>
                                    <SelectTrigger id="qualification-filter" className="w-full">
                                        <SelectValue placeholder="Any Qualification" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_all">Any Qualification</SelectItem>
                                        {QUALIFICATIONS.map((qual) => (
                                            <SelectItem key={qual} value={qual}>
                                                {qual.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        )}
                    </div>

                    {/* Clear Search Button */}
                    {(selectedIndustryId || selectedDesignations.length > 0) && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setSelectedIndustryId("");
                                    setSelectedDesignations([]);
                                    setExpectedSalaryStr("");
                                    setSelectedExperience("_all");
                                    setSelectedQualification("_all");
                                }}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Candidates Table - Only shown after search */}
            {hasSearched && (
                <Card variant="glass" className="gap-0 overflow-hidden rounded-3xl border-primary/10">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <h3 className="text-lg font-semibold">
                                    Search Results
                                </h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {filteredCandidates.length} {filteredCandidates.length === 1 ? 'candidate' : 'candidates'} found
                            </p>
                        </div>

                        {filteredCandidates.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No candidates are targeting the selected position(s).
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Candidate Name</TableHead>
                                            <TableHead>Experience</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Highest Qualification</TableHead>
                                            <TableHead>Employment Type</TableHead>
                                            <TableHead>Availability</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <tbody>
                                        {filteredCandidates.map((candidate) => (
                                            <TableRow
                                                key={candidate.id}
                                                className="cursor-pointer border-b transition-colors duration-150 hover:bg-muted/60"
                                                onClick={() => setSelectedCandidateId(candidate.id)}
                                            >
                                                <TableCell className="font-medium">
                                                    {candidate.first_name} {candidate.last_name}
                                                </TableCell>
                                                <TableCell>
                                                    {candidate.years_of_experience !== null
                                                        ? `${candidate.years_of_experience} ${candidate.years_of_experience === 1 ? 'year' : 'years'}`
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {formatExperienceLevel(candidate.experience_level)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {candidate.highest_qualification ? candidate.highest_qualification.replace(/_/g, ' ') : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {formatEmploymentType(candidate.employment_type)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            candidate.availability_status === 'available' && "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400",
                                                            candidate.availability_status === 'open_to_opportunities' && "border-primary/35 bg-primary/10 text-primary dark:border-primary/45 dark:bg-primary/15 dark:text-primary",
                                                            candidate.availability_status === 'not_looking' && "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                                                        )}
                                                    >
                                                        {formatAvailabilityStatus(candidate.availability_status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {candidate.invited ? (
                                                        (() => {
                                                            const journeyDisplay = getInvitationJourneyDisplay({
                                                                status: candidate.invitationStatus || 'pending',
                                                                invitation_canceled: false,
                                                                interview_confirmed: candidate.invitationInterviewConfirmed || false,
                                                                mis_rescheduled: candidate.invitationMisRescheduled || false,
                                                                pipeline_status: candidate.invitationPipelineStatus || null,
                                                                current_round_number: candidate.invitationCurrentRound || null,
                                                            });
                                                            const badgeProps = journeyVariantToEmployerBadgeProps(journeyDisplay.variant);
                                                            return (
                                                                <Badge variant={badgeProps.variant} className={badgeProps.className}>
                                                                    {journeyDisplay.label}
                                                                </Badge>
                                                            );
                                                        })()
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Not Invited</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCandidateId(candidate.id);
                                                        }}
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        View Details
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Candidate Detail Modal */}
            {selectedCandidateId && (
                <CandidateDetailModal
                    candidateId={selectedCandidateId}
                    selectedIndustry={selectedIndustryName}
                    selectedDesignation={selectedDesignations.join(', ')}
                    isInvited={filteredCandidates.find(c => c.id === selectedCandidateId)?.invited || false}
                    isHiredElsewhere={filteredCandidates.find(c => c.id === selectedCandidateId)?.isHiredElsewhere || false}
                    invitationStatus={filteredCandidates.find(c => c.id === selectedCandidateId)?.invitationStatus ?? null}
                    invitationPipelineStatus={filteredCandidates.find(c => c.id === selectedCandidateId)?.invitationPipelineStatus ?? null}
                    invitationInterviewConfirmed={filteredCandidates.find(c => c.id === selectedCandidateId)?.invitationInterviewConfirmed ?? false}
                    invitationCurrentRound={filteredCandidates.find(c => c.id === selectedCandidateId)?.invitationCurrentRound ?? null}
                    invitationMisRescheduled={filteredCandidates.find(c => c.id === selectedCandidateId)?.invitationMisRescheduled ?? false}
                    onClose={() => setSelectedCandidateId(null)}
                />
            )}
        </div>
    );
}
