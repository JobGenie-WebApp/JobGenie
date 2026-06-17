"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, Building2, Briefcase, Calendar, TrendingUp, Activity,
    Printer, RefreshCw, Clock, CheckCircle, BarChart3, ChevronDown, ChevronUp,
    List,
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterDimension = "all" | "candidates" | "employers" | "companies" | "jobs" | "applications";
type PeriodPreset = "24h" | "7d" | "30d" | "all_time" | "custom";

interface TimeSeries { date: string; count: number }
interface NameValue { name: string; value: number }
interface DauEntry { date: string; candidates: number; employers: number; mis: number; total: number }
interface FunnelStep { step: string; count: number; pct: number }

interface CandidateRow {
    id: string; name: string; email: string; industry: string;
    experience_level: string; employment_type: string; approval_status: string;
    years_of_experience: number; availability_status: string;
    profile_completed: boolean; created_at: string; approved_at: string | null;
}
interface EmployerRow {
    id: string; name: string; email: string; designation: string;
    department: string; job_title: string; is_super_admin: boolean;
    profile_completed: boolean; company_name: string; company_status: string; created_at: string;
}
interface CompanyRow {
    id: string; company_name: string; industry: string; company_size: string;
    approval_status: string; profile_completed: boolean;
    business_registration_no: string; headoffice_location: string;
    employer_count: number; job_count: number; created_at: string; approved_at: string | null;
}
interface JobRow {
    id: string; job_title: string; company_name: string; industry: string;
    job_type: string; status: string; location: string; deadline: string | null;
    application_count: number; created_at: string; published_at: string | null;
}
interface ApplicationRow {
    id: string; candidate_name: string; candidate_email: string;
    company_name: string; job_designation: string; industry: string;
    status: string; pipeline_status: string; interview_confirmed: boolean;
    interview_mode: string; invitation_canceled: boolean;
    created_at: string; responded_at: string | null; confirmed_at: string | null;
}

interface PlatformEngagement {
    dailyActiveUsers: DauEntry[];
    topActions: { action: string; count: number }[];
    peakHours: { hour: number; count: number }[];
}

interface ReportData {
    // All view
    candidateRegistrations?: TimeSeries[];
    employerRegistrations?: TimeSeries[];
    companyRegistrations?: TimeSeries[];
    jobsPostedOverTime?: TimeSeries[];
    applicationsOverTime?: TimeSeries[];
    candidateApprovalStatus?: NameValue[];
    companyApprovalStatus?: NameValue[];
    jobStatusBreakdown?: NameValue[];
    registrationSource?: NameValue[];
    candidateCount?: number;
    employerCount?: number;
    companyCount?: number;
    jobCount?: number;
    applicationCount?: number;
    totalNewUsers?: number;
    funnel?: FunnelStep[];
    // Candidates view
    registrationsOverTime?: TimeSeries[];
    approvalStatus?: NameValue[];
    experienceLevel?: NameValue[];
    employmentType?: NameValue[];
    industryBreakdown?: NameValue[];
    avgDaysToApproval?: number | null;
    totalCandidates?: number;
    approvedCount?: number;
    pendingCount?: number;
    rejectedCount?: number;
    candidates?: CandidateRow[];
    // Employers view
    empPerCompany?: NameValue[];
    totalEmployers?: number;
    employers?: EmployerRow[];
    // Companies view
    sizeBreakdown?: NameValue[];
    totalCompanies?: number;
    companies?: CompanyRow[];
    // Jobs view
    postedOverTime?: TimeSeries[];
    statusBreakdown?: NameValue[];
    jobTypeBreakdown?: NameValue[];
    topCompanies?: { name: string; jobs: number }[];
    totalJobs?: number;
    jobs?: JobRow[];
    // Applications view
    totalApplications?: number;
    offersMade?: number;
    offersAccepted?: number;
    offerAcceptanceRate?: number;
    applications?: ApplicationRow[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#06b6d4", "#f97316"];
const AREA_COLORS = { candidates: "#3b82f6", employers: "#a855f7", mis: "#22c55e", total: "#f59e0b" };

const FILTER_TABS: { id: FilterDimension; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "Overview", icon: BarChart3 },
    { id: "candidates", label: "Candidates", icon: Users },
    { id: "employers", label: "Employers", icon: Building2 },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "applications", label: "Applications", icon: Calendar },
];

const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
    { id: "24h", label: "24h" },
    { id: "7d", label: "7 days" },
    { id: "30d", label: "30 days" },
    { id: "all_time", label: "All Time" },
    { id: "custom", label: "Custom" },
];

// ── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function usePagination<T>(items: T[], pageSize: number) {
    const [page, setPage] = useState(1);
    // Reset to page 1 whenever the item list length changes (e.g. search filter applied)
    useEffect(() => { setPage(1); }, [items.length]);
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const slice = items.slice((safePage - 1) * pageSize, safePage * pageSize);
    return { page: safePage, setPage, totalPages, slice, total: items.length };
}

function Pagination({
    page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
}: {
    page: number; totalPages: number; total: number; pageSize: number;
    onPageChange: (p: number) => void; onPageSizeChange: (n: number) => void;
}) {
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    const pages: (number | "…")[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push("…");
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push("…");
        pages.push(totalPages);
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border text-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span>Rows per page</span>
                <Select value={String(pageSize)} onValueChange={v => { onPageSizeChange(Number(v)); onPageChange(1); }}>
                    <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PAGE_SIZE_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                </Select>
                <span>{from}–{to} of {total}</span>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs"
                    onClick={() => onPageChange(1)} disabled={page === 1}>«</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs"
                    onClick={() => onPageChange(page - 1)} disabled={page === 1}>‹</Button>
                {pages.map((p, i) =>
                    p === "…" ? (
                        <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
                    ) : (
                        <Button key={p} variant={p === page ? "default" : "outline"} size="sm"
                            className="h-7 w-7 p-0 text-xs" onClick={() => onPageChange(p as number)}>
                            {p}
                        </Button>
                    )
                )}
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs"
                    onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>›</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs"
                    onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>»</Button>
            </div>
        </div>
    );
}

function fmt(dateStr: string | null | undefined) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusBadge(status: string) {
    const s = status?.toLowerCase();
    const variant =
        s === "approved" || s === "published" || s === "accepted" || s === "active" || s === "hired" ? "default" :
        s === "pending" || s === "draft" || s === "paused" ? "secondary" :
        s === "rejected" || s === "expired" || s === "declined" || s === "withdrawn" || s === "closed" ? "destructive" :
        "outline";
    return <Badge variant={variant} className="text-xs capitalize whitespace-nowrap">{status?.replace(/_/g, " ")}</Badge>;
}

// ── Small reusable components ────────────────────────────────────────────────

function KpiCard({ title, value, icon: Icon, color, bgColor, subtitle }: {
    title: string; value: number | string; icon: React.ElementType;
    color: string; bgColor: string; subtitle?: string;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    <div className={`p-2 rounded-lg ${bgColor}`}><Icon className={`h-4 w-4 ${color}`} /></div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold tracking-tight">{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function SectionHeader({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: number }) {
    return (
        <div className="flex items-center gap-2 mt-2 mb-3">
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{title}</span>
            {count !== undefined && <Badge variant="secondary" className="ml-1">{count}</Badge>}
        </div>
    );
}

function NoData() {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data for this period</div>;
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
    return (
        <th className={`py-2 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap ${right ? "text-right" : "text-left"}`}>
            {children}
        </th>
    );
}
function TD({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
    return (
        <td className={`py-2 px-3 text-sm ${right ? "text-right" : ""} ${className}`}>
            {children}
        </td>
    );
}

function TableWrap({ children, empty }: { children: React.ReactNode; empty?: boolean }) {
    if (empty) return <div className="text-center py-8 text-muted-foreground text-sm">No records for this period</div>;
    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
                {children}
            </table>
        </div>
    );
}

function DonutChart({ data }: { data: NameValue[] }) {
    if (!data || data.every(d => d.value === 0)) return <NoData />;
    return (
        <>
            <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                        {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-1">
                {data.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full inline-block flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-muted-foreground capitalize">{d.name.replace(/_/g, " ")}</span>
                        </div>
                        <span className="font-semibold">{d.value}</span>
                    </div>
                ))}
            </div>
        </>
    );
}

function SimpleAreaChart({ data, color = "#3b82f6" }: { data: TimeSeries[]; color?: string }) {
    if (!data || data.length === 0 || data.every(d => d.count === 0)) return <NoData />;
    return (
        <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id={`g-area`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--border)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="var(--border)" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke={color} fill="url(#g-area)" strokeWidth={2} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SimpleBarChart({ data, dataKey = "value", nameKey = "name", maxItems = 10 }: {
    data: any[]; dataKey?: string; nameKey?: string; maxItems?: number;
}) {
    const d = data.slice(0, maxItems);
    if (!d || d.length === 0) return <NoData />;
    return (
        <ResponsiveContainer width="100%" height={190}>
            <BarChart data={d} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} stroke="var(--border)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="var(--border)" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey={dataKey} radius={[3, 3, 0, 0]}>
                    {d.map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function FunnelView({ steps }: { steps: FunnelStep[] }) {
    const max = steps[0]?.count || 1;
    return (
        <div className="space-y-2 py-2">
            {steps.map((s, i) => (
                <div key={s.step} className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="font-medium">{s.step}</span>
                        <span className="text-muted-foreground">{s.count.toLocaleString()} <span className="text-primary font-bold">({s.pct}%)</span></span>
                    </div>
                    <div className="bg-muted rounded-full h-5 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.max((s.count / max) * 100, s.count > 0 ? 2 : 0)}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                    {i < steps.length - 1 && (
                        <div className="text-xs text-muted-foreground text-center">
                            ↓ {steps[i + 1].count > 0 && s.count > 0 ? `${Math.round((steps[i + 1].count / s.count) * 100)}% conversion` : "—"}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Filter Views ─────────────────────────────────────────────────────────────

function AllView({ data }: { data: ReportData }) {
    const allTS: TimeSeries[] = (data.candidateRegistrations || []).map((d, i) => ({
        date: d.date,
        count: d.count + (data.employerRegistrations?.[i]?.count || 0),
    }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard title="New Users" value={data.totalNewUsers ?? 0} icon={Users} color="text-blue-500" bgColor="bg-blue-500/10" subtitle="In period" />
                <KpiCard title="Candidates" value={data.candidateCount ?? 0} icon={Users} color="text-green-500" bgColor="bg-green-500/10" />
                <KpiCard title="Employers" value={data.employerCount ?? 0} icon={Building2} color="text-purple-500" bgColor="bg-purple-500/10" />
                <KpiCard title="Companies" value={data.companyCount ?? 0} icon={Building2} color="text-orange-500" bgColor="bg-orange-500/10" />
                <KpiCard title="Jobs Posted" value={data.jobCount ?? 0} icon={Briefcase} color="text-cyan-500" bgColor="bg-cyan-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="New User Registrations Over Time" description="Candidates + Employers combined">
                    <SimpleAreaChart data={allTS} color="#3b82f6" />
                </ChartCard>
                <ChartCard title="Registration Source">
                    <DonutChart data={data.registrationSource || []} />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ChartCard title="Candidate Approval Status">
                    <DonutChart data={data.candidateApprovalStatus || []} />
                </ChartCard>
                <ChartCard title="Company Approval Status">
                    <DonutChart data={data.companyApprovalStatus || []} />
                </ChartCard>
                <ChartCard title="Job Status Breakdown">
                    <DonutChart data={data.jobStatusBreakdown || []} />
                </ChartCard>
            </div>

            {data.funnel && data.funnel.length > 0 && (
                <ChartCard title="Application Pipeline Funnel" description="End-to-end recruitment conversion">
                    <FunnelView steps={data.funnel} />
                </ChartCard>
            )}

            {/* Summary table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><List className="h-4 w-4 text-primary" />Platform Summary</CardTitle>
                    <CardDescription>Aggregated counts for the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                    <TableWrap>
                        <thead className="bg-muted/50">
                            <tr><TH>Entity</TH><TH right>Total</TH><TH right>Approved / Active</TH><TH right>Pending</TH></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr className="hover:bg-muted/30">
                                <TD><span className="font-medium">Candidates</span></TD>
                                <TD right>{data.candidateCount ?? 0}</TD>
                                <TD right>{(data.candidateApprovalStatus?.find(s => s.name === "approved")?.value ?? 0)}</TD>
                                <TD right>{(data.candidateApprovalStatus?.find(s => s.name === "pending")?.value ?? 0)}</TD>
                            </tr>
                            <tr className="hover:bg-muted/30">
                                <TD><span className="font-medium">Companies</span></TD>
                                <TD right>{data.companyCount ?? 0}</TD>
                                <TD right>{(data.companyApprovalStatus?.find(s => s.name === "approved")?.value ?? 0)}</TD>
                                <TD right>{(data.companyApprovalStatus?.find(s => s.name === "pending")?.value ?? 0)}</TD>
                            </tr>
                            <tr className="hover:bg-muted/30">
                                <TD><span className="font-medium">Employers</span></TD>
                                <TD right>{data.employerCount ?? 0}</TD>
                                <TD right>—</TD>
                                <TD right>—</TD>
                            </tr>
                            <tr className="hover:bg-muted/30">
                                <TD><span className="font-medium">Jobs</span></TD>
                                <TD right>{data.jobCount ?? 0}</TD>
                                <TD right>{(data.jobStatusBreakdown?.find(s => s.name === "published")?.value ?? 0)}</TD>
                                <TD right>{(data.jobStatusBreakdown?.find(s => s.name === "draft")?.value ?? 0)}</TD>
                            </tr>
                            <tr className="hover:bg-muted/30">
                                <TD><span className="font-medium">Applications</span></TD>
                                <TD right>{data.applicationCount ?? 0}</TD>
                                <TD right>{(data.funnel?.[1]?.count ?? 0)}</TD>
                                <TD right>—</TD>
                            </tr>
                        </tbody>
                    </TableWrap>
                </CardContent>
            </Card>
        </div>
    );
}

function CandidatesView({ data }: { data: ReportData }) {
    const total = data.totalCandidates || 0;
    const approved = data.approvedCount || 0;
    const pending = data.pendingCount || 0;
    const rejected = data.rejectedCount || 0;
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(25);

    const filtered = (data.candidates || []).filter(c =>
        !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.industry?.toLowerCase().includes(search.toLowerCase())
    );
    const { page, setPage, totalPages, slice } = usePagination(filtered, pageSize);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total Registered" value={total} icon={Users} color="text-blue-500" bgColor="bg-blue-500/10" subtitle="In period" />
                <KpiCard title="Approved" value={approved} icon={CheckCircle} color="text-green-500" bgColor="bg-green-500/10"
                    subtitle={total > 0 ? `${Math.round((approved / total) * 100)}% rate` : undefined} />
                <KpiCard title="Pending Review" value={pending} icon={Clock} color="text-yellow-500" bgColor="bg-yellow-500/10" />
                <KpiCard title="Avg Days to Approval" value={data.avgDaysToApproval != null ? `${data.avgDaysToApproval}d` : "—"}
                    icon={TrendingUp} color="text-purple-500" bgColor="bg-purple-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Registrations Over Time">
                    <SimpleAreaChart data={data.registrationsOverTime || []} color={AREA_COLORS.candidates} />
                </ChartCard>
                <ChartCard title="Approval Status">
                    <DonutChart data={data.approvalStatus || []} />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartCard title="Registration Source">
                    <DonutChart data={data.registrationSource || []} />
                </ChartCard>
                <ChartCard title="Experience Level">
                    <SimpleBarChart data={data.experienceLevel || []} />
                </ChartCard>
                <ChartCard title="Employment Type">
                    <SimpleBarChart data={data.employmentType || []} />
                </ChartCard>
            </div>

            <ChartCard title="Top Industries">
                <SimpleBarChart data={data.industryBreakdown || []} />
            </ChartCard>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><List className="h-4 w-4 text-primary" />Approval Rate Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        { label: "Approved", value: approved, color: "text-green-400" },
                        { label: "Pending", value: pending, color: "text-yellow-400" },
                        { label: "Rejected", value: rejected, color: "text-red-400" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-semibold">{value} <span className={`${color} font-bold`}>({total > 0 ? Math.round((value / total) * 100) : 0}%)</span></span>
                            </div>
                            <Progress value={total > 0 ? (value / total) * 100 : 0} className="h-2" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Detail table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2"><List className="h-4 w-4 text-primary" />Candidate Details</CardTitle>
                            <CardDescription>{total} candidates registered in this period</CardDescription>
                        </div>
                        <Input placeholder="Search name, email, industry…" value={search}
                            onChange={e => setSearch(e.target.value)} className="h-8 w-56 text-xs" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <TableWrap empty={filtered.length === 0}>
                        <thead className="bg-muted/50">
                            <tr>
                                <TH>#</TH><TH>Name</TH><TH>Email</TH><TH>Industry</TH>
                                <TH>Experience</TH><TH>Employment Type</TH><TH>Status</TH>
                                <TH>Profile</TH><TH>Registered</TH><TH>Approved</TH>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {slice.map((c, i) => (
                                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                    <TD className="text-muted-foreground">{(page - 1) * pageSize + i + 1}</TD>
                                    <TD><span className="font-medium">{c.name}</span></TD>
                                    <TD className="text-muted-foreground">{c.email}</TD>
                                    <TD>{c.industry || "—"}</TD>
                                    <TD className="capitalize">{c.experience_level?.replace(/_/g, " ") || "—"}</TD>
                                    <TD className="capitalize">{c.employment_type?.replace(/_/g, " ") || "—"}</TD>
                                    <TD>{statusBadge(c.approval_status)}</TD>
                                    <TD>{c.profile_completed ? <Badge variant="default" className="text-xs">Complete</Badge> : <Badge variant="secondary" className="text-xs">Incomplete</Badge>}</TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(c.created_at)}</TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(c.approved_at)}</TD>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length}
                        pageSize={pageSize} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />
                </CardContent>
            </Card>
        </div>
    );
}

function EmployersView({ data }: { data: ReportData }) {
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(25);
    const filtered = (data.employers || []).filter(e =>
        !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.company_name?.toLowerCase().includes(search.toLowerCase())
    );
    const { page, setPage, totalPages, slice } = usePagination(filtered, pageSize);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard title="Total Employers Registered" value={data.totalEmployers ?? 0} icon={Users} color="text-purple-500" bgColor="bg-purple-500/10" subtitle="In period" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Employer Registrations Over Time">
                    <SimpleAreaChart data={data.registrationsOverTime || []} color={AREA_COLORS.employers} />
                </ChartCard>
                <ChartCard title="Company Approval Status">
                    <DonutChart data={data.approvalStatus || []} />
                </ChartCard>
            </div>

            <ChartCard title="Employers per Company Distribution">
                <SimpleBarChart data={data.empPerCompany || []} />
            </ChartCard>

            {/* Detail table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2"><List className="h-4 w-4 text-primary" />Employer Details</CardTitle>
                            <CardDescription>{data.totalEmployers ?? 0} employers registered in this period</CardDescription>
                        </div>
                        <Input placeholder="Search name, email, company…" value={search}
                            onChange={e => setSearch(e.target.value)} className="h-8 w-56 text-xs" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <TableWrap empty={filtered.length === 0}>
                        <thead className="bg-muted/50">
                            <tr>
                                <TH>#</TH><TH>Name</TH><TH>Email</TH><TH>Company</TH>
                                <TH>Job Title</TH><TH>Department</TH><TH>Company Status</TH>
                                <TH>Super Admin</TH><TH>Profile</TH><TH>Registered</TH>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {slice.map((e, i) => (
                                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                                    <TD className="text-muted-foreground">{(page - 1) * pageSize + i + 1}</TD>
                                    <TD><span className="font-medium">{e.name}</span></TD>
                                    <TD className="text-muted-foreground">{e.email}</TD>
                                    <TD className="font-medium">{e.company_name}</TD>
                                    <TD>{e.job_title || e.designation || "—"}</TD>
                                    <TD>{e.department || "—"}</TD>
                                    <TD>{statusBadge(e.company_status)}</TD>
                                    <TD>{e.is_super_admin ? <Badge className="text-xs">Yes</Badge> : <span className="text-muted-foreground text-xs">No</span>}</TD>
                                    <TD>{e.profile_completed ? <Badge variant="default" className="text-xs">Complete</Badge> : <Badge variant="secondary" className="text-xs">Incomplete</Badge>}</TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(e.created_at)}</TD>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length}
                        pageSize={pageSize} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />
                </CardContent>
            </Card>
        </div>
    );
}

function CompaniesView({ data }: { data: ReportData }) {
    const total = data.totalCompanies || 0;
    const approved = data.approvedCount || 0;
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(25);
    const filtered = (data.companies || []).filter(c =>
        !search || c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        c.industry?.toLowerCase().includes(search.toLowerCase()) ||
        c.business_registration_no?.toLowerCase().includes(search.toLowerCase())
    );
    const { page, setPage, totalPages, slice } = usePagination(filtered, pageSize);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total Companies" value={total} icon={Building2} color="text-orange-500" bgColor="bg-orange-500/10" subtitle="Registered in period" />
                <KpiCard title="Approved" value={approved} icon={CheckCircle} color="text-green-500" bgColor="bg-green-500/10"
                    subtitle={total > 0 ? `${Math.round((approved / total) * 100)}% rate` : undefined} />
                <KpiCard title="Pending" value={data.pendingCount ?? 0} icon={Clock} color="text-yellow-500" bgColor="bg-yellow-500/10" />
                <KpiCard title="Rejected" value={data.rejectedCount ?? 0} icon={Activity} color="text-red-500" bgColor="bg-red-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Company Registrations Over Time">
                    <SimpleAreaChart data={data.registrationsOverTime || []} color="#f97316" />
                </ChartCard>
                <ChartCard title="Approval Status">
                    <DonutChart data={data.approvalStatus || []} />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Companies by Industry">
                    <SimpleBarChart data={data.industryBreakdown || []} />
                </ChartCard>
                <ChartCard title="Company Size Distribution">
                    <SimpleBarChart data={data.sizeBreakdown || []} />
                </ChartCard>
            </div>

            {/* Detail table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2"><List className="h-4 w-4 text-primary" />Company Details</CardTitle>
                            <CardDescription>{total} companies registered in this period</CardDescription>
                        </div>
                        <Input placeholder="Search name, industry, BR no…" value={search}
                            onChange={e => setSearch(e.target.value)} className="h-8 w-56 text-xs" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <TableWrap empty={filtered.length === 0}>
                        <thead className="bg-muted/50">
                            <tr>
                                <TH>#</TH><TH>Company Name</TH><TH>BR No.</TH><TH>Industry</TH>
                                <TH>Size</TH><TH>Location</TH><TH right>Employers</TH>
                                <TH right>Jobs</TH><TH>Status</TH><TH>Profile</TH>
                                <TH>Registered</TH><TH>Approved</TH>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {slice.map((c, i) => (
                                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                    <TD className="text-muted-foreground">{(page - 1) * pageSize + i + 1}</TD>
                                    <TD><span className="font-medium">{c.company_name}</span></TD>
                                    <TD className="text-muted-foreground">{c.business_registration_no || "—"}</TD>
                                    <TD>{c.industry || "—"}</TD>
                                    <TD>{c.company_size || "—"}</TD>
                                    <TD>{c.headoffice_location || "—"}</TD>
                                    <TD right><span className="font-semibold">{c.employer_count}</span></TD>
                                    <TD right><span className="font-semibold">{c.job_count}</span></TD>
                                    <TD>{statusBadge(c.approval_status)}</TD>
                                    <TD>{c.profile_completed ? <Badge variant="default" className="text-xs">Complete</Badge> : <Badge variant="secondary" className="text-xs">Incomplete</Badge>}</TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(c.created_at)}</TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(c.approved_at)}</TD>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length}
                        pageSize={pageSize} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />
                </CardContent>
            </Card>
        </div>
    );
}

function JobsView({ data }: { data: ReportData }) {
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(25);
    const filtered = (data.jobs || []).filter(j =>
        !search || j.job_title.toLowerCase().includes(search.toLowerCase()) ||
        j.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        j.industry?.toLowerCase().includes(search.toLowerCase())
    );
    const { page, setPage, totalPages, slice } = usePagination(filtered, pageSize);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total Jobs" value={data.totalJobs ?? 0} icon={Briefcase} color="text-green-500" bgColor="bg-green-500/10" subtitle="In period" />
                <KpiCard title="Published" value={data.statusBreakdown?.find(s => s.name === "published")?.value ?? 0}
                    icon={CheckCircle} color="text-blue-500" bgColor="bg-blue-500/10" />
                <KpiCard title="Draft" value={data.statusBreakdown?.find(s => s.name === "draft")?.value ?? 0}
                    icon={Clock} color="text-yellow-500" bgColor="bg-yellow-500/10" />
                <KpiCard title="Closed / Archived" value={(data.statusBreakdown?.find(s => s.name === "closed")?.value ?? 0) + (data.statusBreakdown?.find(s => s.name === "archived")?.value ?? 0)}
                    icon={Activity} color="text-red-500" bgColor="bg-red-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Jobs Posted Over Time">
                    <SimpleAreaChart data={data.postedOverTime || []} color="#22c55e" />
                </ChartCard>
                <ChartCard title="Job Status Breakdown">
                    <DonutChart data={data.statusBreakdown || []} />
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Jobs by Industry">
                    <SimpleBarChart data={data.industryBreakdown || []} />
                </ChartCard>
                <ChartCard title="Jobs by Type">
                    <SimpleBarChart data={data.jobTypeBreakdown || []} />
                </ChartCard>
            </div>

            {(data.topCompanies || []).length > 0 && (
                <ChartCard title="Top Hiring Companies">
                    <TableWrap>
                        <thead className="bg-muted/50">
                            <tr><TH>#</TH><TH>Company</TH><TH right>Jobs Posted</TH></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {(data.topCompanies || []).map((c, i) => (
                                <tr key={c.name} className="hover:bg-muted/30">
                                    <TD className="text-muted-foreground">{i + 1}</TD>
                                    <TD><span className="font-medium">{c.name}</span></TD>
                                    <TD right><span className="font-bold text-primary">{c.jobs}</span></TD>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                </ChartCard>
            )}

            {/* Detail table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2"><List className="h-4 w-4 text-primary" />Job Details</CardTitle>
                            <CardDescription>{data.totalJobs ?? 0} jobs in this period</CardDescription>
                        </div>
                        <Input placeholder="Search title, company, industry…" value={search}
                            onChange={e => setSearch(e.target.value)} className="h-8 w-56 text-xs" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <TableWrap empty={filtered.length === 0}>
                        <thead className="bg-muted/50">
                            <tr>
                                <TH>#</TH><TH>Job Title</TH><TH>Company</TH><TH>Industry</TH>
                                <TH>Type</TH><TH>Status</TH><TH>Location</TH>
                                <TH right>Applications</TH><TH>Posted</TH><TH>Deadline</TH>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {slice.map((j, i) => (
                                <tr key={j.id} className="hover:bg-muted/30 transition-colors">
                                    <TD className="text-muted-foreground">{(page - 1) * pageSize + i + 1}</TD>
                                    <TD><span className="font-medium">{j.job_title}</span></TD>
                                    <TD>{j.company_name}</TD>
                                    <TD>{j.industry || "—"}</TD>
                                    <TD className="capitalize">{j.job_type?.replace(/_/g, " ") || "—"}</TD>
                                    <TD>{statusBadge(j.status)}</TD>
                                    <TD className="text-muted-foreground">{j.location || "—"}</TD>
                                    <TD right><span className="font-semibold text-primary">{j.application_count}</span></TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(j.created_at)}</TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(j.deadline)}</TD>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length}
                        pageSize={pageSize} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />
                </CardContent>
            </Card>
        </div>
    );
}

function ApplicationsView({ data }: { data: ReportData }) {
    const total = data.totalApplications || 0;
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(25);
    const filtered = (data.applications || []).filter(a =>
        !search || a.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
        a.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.job_designation?.toLowerCase().includes(search.toLowerCase())
    );
    const { page, setPage, totalPages, slice } = usePagination(filtered, pageSize);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Applications Sent" value={total} icon={Calendar} color="text-blue-500" bgColor="bg-blue-500/10" subtitle="In period" />
                <KpiCard title="Offers Made" value={data.offersMade ?? 0} icon={Briefcase} color="text-green-500" bgColor="bg-green-500/10" />
                <KpiCard title="Offers Accepted" value={data.offersAccepted ?? 0} icon={CheckCircle} color="text-emerald-500" bgColor="bg-emerald-500/10" />
                <KpiCard title="Offer Acceptance Rate" value={`${data.offerAcceptanceRate ?? 0}%`} icon={TrendingUp} color="text-purple-500" bgColor="bg-purple-500/10" />
            </div>

            <ChartCard title="Applications Over Time">
                <SimpleAreaChart data={data.applicationsOverTime || []} color="#3b82f6" />
            </ChartCard>

            {data.funnel && (
                <ChartCard title="Recruitment Pipeline Funnel" description="End-to-end conversion from application to offer accepted">
                    <FunnelView steps={data.funnel} />
                </ChartCard>
            )}

            <ChartCard title="Application Status Breakdown">
                <DonutChart data={data.statusBreakdown || []} />
            </ChartCard>

            {/* Detail table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2"><List className="h-4 w-4 text-primary" />Application Details</CardTitle>
                            <CardDescription>{total} applications in this period</CardDescription>
                        </div>
                        <Input placeholder="Search candidate, company, role…" value={search}
                            onChange={e => setSearch(e.target.value)} className="h-8 w-56 text-xs" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <TableWrap empty={filtered.length === 0}>
                        <thead className="bg-muted/50">
                            <tr>
                                <TH>#</TH><TH>Candidate</TH><TH>Email</TH><TH>Company</TH>
                                <TH>Role</TH><TH>Industry</TH><TH>Status</TH>
                                <TH>Pipeline</TH><TH>Interview</TH><TH>Mode</TH>
                                <TH>Applied</TH><TH>Responded</TH><TH>Confirmed</TH>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {slice.map((a, i) => (
                                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                                    <TD className="text-muted-foreground">{(page - 1) * pageSize + i + 1}</TD>
                                    <TD><span className="font-medium">{a.candidate_name}</span></TD>
                                    <TD className="text-muted-foreground">{a.candidate_email}</TD>
                                    <TD>{a.company_name}</TD>
                                    <TD>{a.job_designation || "—"}</TD>
                                    <TD>{a.industry || "—"}</TD>
                                    <TD>{statusBadge(a.status)}</TD>
                                    <TD>{statusBadge(a.pipeline_status)}</TD>
                                    <TD>{a.interview_confirmed
                                        ? <Badge variant="default" className="text-xs">Confirmed</Badge>
                                        : a.invitation_canceled
                                        ? <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                                        : <Badge variant="secondary" className="text-xs">Pending</Badge>}
                                    </TD>
                                    <TD className="capitalize text-muted-foreground">{a.interview_mode?.replace(/_/g, " ") || "—"}</TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(a.created_at)}</TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(a.responded_at)}</TD>
                                    <TD className="text-muted-foreground whitespace-nowrap">{fmt(a.confirmed_at)}</TD>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                    <Pagination page={page} totalPages={totalPages} total={filtered.length}
                        pageSize={pageSize} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />
                </CardContent>
            </Card>
        </div>
    );
}

function PlatformEngagementSection({ engagement }: { engagement: PlatformEngagement }) {
    const [expanded, setExpanded] = useState(true);
    return (
        <section>
            <button onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-2 text-base font-semibold mb-3 hover:text-primary transition-colors w-full text-left">
                <Activity className="h-4 w-4 text-primary" />
                Platform Engagement
                {expanded ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
            </button>

            {expanded && (
                <div className="space-y-4">
                    <ChartCard title="Daily Active Users by Role" description="Unique users per day within the period">
                        {engagement.dailyActiveUsers.every(d => d.total === 0) ? <NoData /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={engagement.dailyActiveUsers} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                    <defs>
                                        {(["candidates", "employers", "mis"] as const).map(k => (
                                            <linearGradient key={k} id={`dau-${k}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={AREA_COLORS[k]} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={AREA_COLORS[k]} stopOpacity={0} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--border)" />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="var(--border)" />
                                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="candidates" name="Candidates" stroke={AREA_COLORS.candidates} fill="url(#dau-candidates)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="employers" name="Employers" stroke={AREA_COLORS.employers} fill="url(#dau-employers)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="mis" name="MIS Staff" stroke={AREA_COLORS.mis} fill="url(#dau-mis)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ChartCard title="Top 10 Actions" description="Most common user actions">
                            {engagement.topActions.length === 0 ? <NoData /> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={engagement.topActions} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} stroke="var(--border)" />
                                        <YAxis dataKey="action" type="category" tick={{ fontSize: 9 }} width={130} stroke="var(--border)" />
                                        <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                                        <Bar dataKey="count" name="Events" radius={[0, 3, 3, 0]}>
                                            {engagement.topActions.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Peak Usage Hours (UTC)" description="When users are most active">
                            {engagement.peakHours.every(h => h.count === 0) ? <NoData /> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={engagement.peakHours} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="var(--border)" />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="var(--border)" />
                                        <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                                            labelFormatter={(h) => `${String(h).padStart(2, "0")}:00 UTC`} />
                                        <Bar dataKey="count" name="Events" radius={[3, 3, 0, 0]}>
                                            {engagement.peakHours.map((_, i) => <Cell key={i} fill={`hsl(${140 + i * 3} 70% 50%)`} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* Top actions detail table */}
                    {engagement.topActions.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2"><List className="h-4 w-4 text-primary" />Top Actions Detail</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <TableWrap>
                                    <thead className="bg-muted/50">
                                        <tr><TH>#</TH><TH>Action</TH><TH right>Event Count</TH><TH right>Share</TH></tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {engagement.topActions.map((a, i) => {
                                            const total = engagement.topActions.reduce((s, x) => s + x.count, 0);
                                            return (
                                                <tr key={a.action} className="hover:bg-muted/30">
                                                    <TD className="text-muted-foreground">{i + 1}</TD>
                                                    <TD><span className="font-medium font-mono text-xs">{a.action}</span></TD>
                                                    <TD right><span className="font-semibold">{a.count.toLocaleString()}</span></TD>
                                                    <TD right><span className="text-primary font-bold">{total > 0 ? Math.round((a.count / total) * 100) : 0}%</span></TD>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </TableWrap>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </section>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                        <CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-52 w-full" /></CardContent></Card>)}
            </div>
            <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ReportsClient() {
    const [filter, setFilter] = useState<FilterDimension>("all");
    const [period, setPeriod] = useState<PeriodPreset>("30d");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [data, setData] = useState<ReportData | null>(null);
    const [engagement, setEngagement] = useState<PlatformEngagement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (period === "custom" && (!dateFrom || !dateTo)) return;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ filter, period });
            if (period === "custom") { params.set("dateFrom", dateFrom); params.set("dateTo", dateTo); }
            const res = await fetch(`/api/mis/analytics/reports?${params}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                setEngagement(json.platformEngagement);
            } else {
                setError("Failed to load report data.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [filter, period, dateFrom, dateTo]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const activeFilterLabel = FILTER_TABS.find(t => t.id === filter)?.label ?? "Overview";
    const periodLabel = period === "custom" ? `${dateFrom} – ${dateTo}` : period === "all_time" ? "All Time" : PERIOD_PRESETS.find(p => p.id === period)?.label ?? period;

    return (
        <div className="space-y-6">
            {/* ── Toolbar (no-print) ──────────────────────────────────────── */}
            <div className="no-print space-y-3">
                <div className="flex flex-wrap gap-1">
                    {FILTER_TABS.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setFilter(id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                filter === id ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
                            <Icon className="h-3.5 w-3.5" />{label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                        {PERIOD_PRESETS.map(({ id, label }) => (
                            <button key={id} onClick={() => setPeriod(id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                    period === id ? "bg-primary/10 text-primary border-primary"
                                    : "border-border hover:bg-muted text-muted-foreground"}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {period === "custom" && (
                        <div className="flex items-center gap-2">
                            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
                            <span className="text-muted-foreground text-xs">to</span>
                            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
                        </div>
                    )}

                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Print header ────────────────────────────────────────────── */}
            <div className="hidden print:block mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold">JobGenie — Reports & Analytics</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Section: <strong>{activeFilterLabel}</strong> · Period: <strong>{periodLabel}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Generated {new Date().toLocaleString()}</p>
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
            )}

            {loading ? <LoadingSkeleton /> : data ? (
                <div className="space-y-8">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        {(() => { const tab = FILTER_TABS.find(t => t.id === filter); const Icon = tab?.icon ?? BarChart3; return <><Icon className="h-5 w-5 text-primary" />{tab?.label ?? "Overview"}</>; })()}
                        <Badge variant="secondary" className="ml-2 text-xs">{periodLabel}</Badge>
                    </div>

                    {filter === "all" && <AllView data={data} />}
                    {filter === "candidates" && <CandidatesView data={data} />}
                    {filter === "employers" && <EmployersView data={data} />}
                    {filter === "companies" && <CompaniesView data={data} />}
                    {filter === "jobs" && <JobsView data={data} />}
                    {filter === "applications" && <ApplicationsView data={data} />}

                    <Separator />
                    {engagement && <PlatformEngagementSection engagement={engagement} />}
                </div>
            ) : null}
        </div>
    );
}
