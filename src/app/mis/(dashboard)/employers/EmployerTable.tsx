"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { CheckCircle2, Clock, Search, XCircle } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { EmployerApprovalActions } from "@/components/mis/EmployerApprovalActions";
import { EmployerProfileView } from "./EmployerProfileView";
import { formatIndustry } from "@/lib/utils";

interface Company {
    id: string;
    company_name: string;
    business_registration_no: string;
    industry: string;
    approval_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

interface EmployerTableProps {
    companies: Company[];
}

export function EmployerTable({ companies }: EmployerTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    const filteredCompanies = companies.filter((company) => {
        const matchesSearch =
            company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.business_registration_no.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || company.approval_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by company name or BR number..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>BR Number</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Registration Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {filteredCompanies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No companies found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCompanies.map((company) => (
                                <TableRow
                                    key={company.id}
                                    className="border-b transition-colors duration-150 hover:bg-muted/60 cursor-pointer"
                                    onClick={() => setSelectedCompanyId(company.id)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {company.company_name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {company.company_name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{company.business_registration_no}</TableCell>
                                    <TableCell>{formatIndustry(company.industry)}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {company.approval_status === "pending" && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                                    <Clock className="h-3 w-3" /> Pending
                                                </Badge>
                                            )}
                                            {company.approval_status === "approved" && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Approved
                                                </Badge>
                                            )}
                                            {company.approval_status === "rejected" && (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                                                    <XCircle className="h-3 w-3" /> Rejected
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <EmployerApprovalActions
                                            companyId={company.id}
                                            companyName={company.company_name}
                                            currentStatus={company.approval_status}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {selectedCompanyId && (
                <EmployerProfileView
                    companyId={selectedCompanyId}
                    onClose={() => setSelectedCompanyId(null)}
                />
            )}
        </div>
    );
}
