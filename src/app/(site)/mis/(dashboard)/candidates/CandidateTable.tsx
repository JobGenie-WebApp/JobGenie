"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CandidateProfileView } from "./CandidateProfileView";
import { cn, formatIndustry } from "@/lib/utils";

interface Candidate {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    industry: string;
    current_position: string;
    years_of_experience: number | null;
    approval_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

interface CandidateTableProps {
    candidates: Candidate[];
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

function getStatusBadge(status: 'pending' | 'approved' | 'rejected') {
    switch (status) {
        case 'approved':
            return (
                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Approved
                </Badge>
            );
        case 'rejected':
            return (
                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <XCircle className="mr-1 h-3 w-3" />
                    Rejected
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                </Badge>
            );
    }
}

export function CandidateTable({ candidates }: CandidateTableProps) {
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

    const pendingCount = candidates.filter(c => c.approval_status === 'pending').length;
    const approvedCount = candidates.filter(c => c.approval_status === 'approved').length;
    const rejectedCount = candidates.filter(c => c.approval_status === 'rejected').length;

    const filteredCandidates = candidates.filter(candidate => {
        if (filter === 'all') return true;
        return candidate.approval_status === filter;
    });

    const filterCards = [
        {
            id: 'pending' as FilterStatus,
            label: 'Pending Review',
            count: pendingCount,
            icon: Clock,
            color: 'amber',
        },
        {
            id: 'approved' as FilterStatus,
            label: 'Approved',
            count: approvedCount,
            icon: CheckCircle2,
            color: 'green',
        },
        {
            id: 'rejected' as FilterStatus,
            label: 'Rejected',
            count: rejectedCount,
            icon: XCircle,
            color: 'red',
        },
    ];

    const colorStyles: Record<string, { border: string; bg: string; text: string; activeBg: string }> = {
        amber: {
            border: 'border-amber-200 dark:border-amber-800',
            bg: 'hover:bg-amber-50 dark:hover:bg-amber-900/10',
            text: 'text-amber-500',
            activeBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-500',
        },
        green: {
            border: 'border-green-200 dark:border-green-800',
            bg: 'hover:bg-green-50 dark:hover:bg-green-900/10',
            text: 'text-green-500',
            activeBg: 'bg-green-50 dark:bg-green-900/20 border-green-500',
        },
        red: {
            border: 'border-red-200 dark:border-red-800',
            bg: 'hover:bg-red-50 dark:hover:bg-red-900/10',
            text: 'text-red-500',
            activeBg: 'bg-red-50 dark:bg-red-900/20 border-red-500',
        },
    };

    return (
        <div className="space-y-6">
            {/* Filter Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {filterCards.map((card) => {
                    const Icon = card.icon;
                    const colors = colorStyles[card.color];
                    const isActive = filter === card.id;

                    return (
                        <button
                            key={card.id}
                            onClick={() => setFilter(isActive ? 'all' : card.id)}
                            className={cn(
                                "rounded-lg border bg-card p-4 text-left transition-all cursor-pointer",
                                colors.border,
                                colors.bg,
                                isActive && colors.activeBg
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${colors.text}`} />
                                <h3 className="font-semibold">{card.label}</h3>
                            </div>
                            <p className="mt-2 text-3xl font-bold">{card.count}</p>
                        </button>
                    );
                })}
            </div>

            {/* Filter Info */}
            {filter !== 'all' && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {filteredCandidates.length} {filter} candidate{filteredCandidates.length !== 1 ? 's' : ''}
                    </p>
                    <button
                        onClick={() => setFilter('all')}
                        className="text-sm text-primary hover:underline"
                    >
                        Clear filter
                    </button>
                </div>
            )}

            {/* Candidates Table */}
            <div className="rounded-lg border bg-card">
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {filter === 'all' ? 'All Candidates' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Candidates`}
                    </h2>

                    {filteredCandidates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {filter === 'all'
                                ? 'No completed candidate profiles found.'
                                : `No ${filter} candidates found.`}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Industry</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Experience</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <tbody>
                                    {filteredCandidates.map((candidate) => (
                                        <TableRow
                                            key={candidate.id}
                                            className="border-b transition-colors duration-150 hover:bg-muted/60"
                                        >
                                            <TableCell className="font-medium">
                                                {candidate.first_name} {candidate.last_name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {candidate.email}
                                            </TableCell>
                                            <TableCell>{formatIndustry(candidate.industry)}</TableCell>
                                            <TableCell>{candidate.current_position}</TableCell>
                                            <TableCell>
                                                {candidate.years_of_experience
                                                    ? `${candidate.years_of_experience} years`
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(candidate.approval_status)}</TableCell>
                                            <TableCell className="text-right">
                                                <button
                                                    onClick={() => setSelectedCandidateId(candidate.id)}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    View Profile
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile View Dialog */}
            {selectedCandidateId && (
                <CandidateProfileView
                    candidateId={selectedCandidateId}
                    onClose={() => setSelectedCandidateId(null)}
                />
            )}
        </div>
    );
}
