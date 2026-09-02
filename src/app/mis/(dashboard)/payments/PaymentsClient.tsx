"use client";

import { useState, useEffect, useCallback } from "react";
import { formatLabel } from "@/lib/utils";
import {
    CreditCard, Building2, User, Calendar, DollarSign, Eye, CheckCircle2,
    XCircle, Clock, RefreshCw, Plus, Pencil, Trash2, AlertTriangle, FileText,
    ExternalLink, Settings2, Receipt, ShieldAlert, Loader2, Briefcase,
    ChevronDown, ChevronRight, UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/ui/date-field";

// ── Types ──────────────────────────────────────────────────────────────────

interface PaymentType {
    id: string; code: string; label: string; description: string | null;
    is_active: boolean; sort_order: number;
}
interface BankDetails {
    id: string; bank_name: string; account_name: string; account_number: string;
    branch: string | null; bank_code: string | null; swift_code: string | null;
    sort_order: number; is_active: boolean;
}
interface PaymentPricing {
    id: string; amount: number; currency: string; is_active: boolean;
    effective_from: string; payment_types: { id: string; code: string; label: string };
}
interface PaymentRequest {
    id: string; company_id: string; employer_id: string | null;
    reference_job_id: string | null;
    amount: number; currency: string; description: string; due_date: string | null;
    status: string; payment_method: string | null; bank_transfer_reference: string | null;
    created_at: string; updated_at: string;
    companies: { id: string; company_name: string; industry: string } | null;
    employers: { id: string; first_name: string; last_name: string; email: string; designation: string | null } | null;
    payment_types: { id: string; code: string; label: string } | null;
    reference_job: { id: string; job_title: string; status: string; mis_pause_locked: boolean } | null;
    reference_invitation_id: string | null;
    reference_invitation: {
        id: string; job_id: string | null;
        candidate: { first_name: string; last_name: string } | null;
        job_offer: { salary_amount: number | null; salary_currency: string | null; salary_period: string | null; job_title: string } | null;
    } | null;
    payment_proofs: {
        id: string; status: string; uploaded_at: string; file_url: string; file_name: string;
        reviewed_at: string | null; review_notes: string | null;
    }[];
}

interface ComplianceFlag {
    id: string; job_id: string; status: string; reason: string; flagged_at: string;
    payment_request_id: string | null; flagged_proof_id: string | null;
    employer_doc_url: string | null; employer_doc_name: string | null;
    employer_note: string | null; resubmitted_at: string | null;
    resolution_notes: string | null; resolved_at: string | null;
    job: { id: string; job_title: string; status: string; company_id: string; company: { id: string; company_name: string } | null } | null;
}
interface Stats {
    total_revenue: number; currency: string;
    pending_count: number; pending_amount: number;
    under_review_count: number; rejected_count: number; overdue_count: number;
    by_type: { label: string; count: number; amount: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending_payment: "secondary",
    under_review: "outline",
    verified: "default",
    rejected: "destructive",
    cancelled: "outline",
};
const STATUS_LABELS: Record<string, string> = {
    pending_payment: "Pending Payment",
    under_review: "Under Review",
    verified: "Verified",
    rejected: "Rejected",
    cancelled: "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
    return <Badge variant={STATUS_VARIANTS[status] ?? "outline"}>{STATUS_LABELS[status] ?? status}</Badge>;
}

function TH({ children }: { children: React.ReactNode }) {
    return <th className="py-2 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap text-left">{children}</th>;
}
function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <td className={`py-2 px-3 text-sm ${className}`}>{children}</td>;
}

function fmtAmount(amount: number, currency = "LKR") {
    return `${currency} ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Main Component ────────────────────────────────────────────────────────

export type PaymentsTabKey = "payments" | "placements" | "compliance" | "configuration";

export function PaymentsClient({ initialTab = "payments" }: { initialTab?: PaymentsTabKey }) {
    const [activeTab, setActiveTab] = useState<PaymentsTabKey>(initialTab);

    return (
        <div className="space-y-6">
            {/* Tab bar */}
            <div className="flex gap-1 border-b">
                {(["payments", "placements", "compliance", "configuration"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                            activeTab === t
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {t === "payments" ? (
                            <span className="flex items-center gap-2"><Receipt className="h-4 w-4" />Payments</span>
                        ) : t === "placements" ? (
                            <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" />Placements</span>
                        ) : t === "compliance" ? (
                            <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Compliance</span>
                        ) : (
                            <span className="flex items-center gap-2"><Settings2 className="h-4 w-4" />Configuration</span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === "payments" ? <PaymentsTab />
                : activeTab === "placements" ? <PlacementsTab />
                : activeTab === "compliance" ? <ComplianceTab />
                : <ConfigurationTab />}
        </div>
    );
}

// ── Payments Tab ──────────────────────────────────────────────────────────

function PaymentsTab() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [jobSearch, setJobSearch] = useState("");
    const [amountMin, setAmountMin] = useState("");
    const [amountMax, setAmountMax] = useState("");
    const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [reviewPayment, setReviewPayment] = useState<PaymentRequest | null>(null);

    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await fetch("/api/mis/payments/stats");
            const json = await res.json();
            if (json.success) setStats(json.data);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const loadPayments = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL("/api/mis/payments", window.location.origin);
            url.searchParams.set("page", String(page));
            url.searchParams.set("limit", String(limit));
            if (search) url.searchParams.set("search", search);
            if (statusFilter && statusFilter !== "all") url.searchParams.set("status", statusFilter);
            if (typeFilter && typeFilter !== "all") url.searchParams.set("type", typeFilter);
            if (dateFrom) url.searchParams.set("dateFrom", dateFrom);
            if (dateTo) url.searchParams.set("dateTo", dateTo);
            if (jobSearch) url.searchParams.set("jobSearch", jobSearch);
            if (amountMin) url.searchParams.set("amountMin", amountMin);
            if (amountMax) url.searchParams.set("amountMax", amountMax);
            const res = await fetch(url.toString());
            const json = await res.json();
            if (json.success) {
                setPayments(json.data);
                setTotal(json.pagination.total);
            }
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, typeFilter, dateFrom, dateTo, jobSearch, amountMin, amountMax]);

    const loadPaymentTypes = useCallback(async () => {
        const res = await fetch("/api/mis/payment-types");
        const json = await res.json();
        if (json.success) setPaymentTypes(json.data);
    }, []);

    useEffect(() => { loadStats(); loadPaymentTypes(); }, [loadStats, loadPaymentTypes]);
    useEffect(() => { loadPayments(); }, [loadPayments]);

    const totalPages = Math.ceil(total / limit);

    const exportCSV = () => {
        const headers = ["ID", "Company", "Employer", "Type", "Amount", "Currency", "Due Date", "Status", "Created"];
        const rows = payments.map((p) => [
            p.id,
            p.companies?.company_name ?? "",
            p.employers ? `${p.employers.first_name} ${p.employers.last_name}` : "",
            p.payment_types?.label ?? "",
            p.amount,
            p.currency,
            p.due_date ?? "",
            p.status,
            p.created_at.slice(0, 10),
        ]);
        const csv = [headers, ...rows].map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}><CardContent className="pt-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
                    ))
                ) : stats ? (
                    <>
                        <KpiCard title="Total Revenue" value={fmtAmount(stats.total_revenue)} icon={DollarSign} color="text-primary" bgColor="bg-primary/10" />
                        <KpiCard title="Pending Payment" value={`${stats.pending_count} · ${fmtAmount(stats.pending_amount)}`} icon={Clock} color="text-amber-600" bgColor="bg-amber-50" />
                        <KpiCard title="Under Review" value={String(stats.under_review_count)} icon={Eye} color="text-primary" bgColor="bg-primary/10" />
                        <KpiCard title="Overdue" value={String(stats.overdue_count)} icon={AlertTriangle} color="text-red-600" bgColor="bg-red-50" />
                    </>
                ) : null}
            </div>

            {/* Header + Filter bar */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Payment Requests</h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportCSV}>Export CSV</Button>
                        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                            <Plus className="h-4 w-4 mr-1" />Create Request
                        </Button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Input
                        placeholder="Search company…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-48"
                    />
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending_payment">Pending Payment</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Payment Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {paymentTypes.map((pt) => (
                                <SelectItem key={pt.id} value={pt.code}>{pt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DateField value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder="From" clearable className="w-36" />
                    <DateField value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder="To" clearable className="w-36" />
                    <Input
                        placeholder="Search job title…"
                        value={jobSearch}
                        onChange={(e) => { setJobSearch(e.target.value); setPage(1); }}
                        className="w-44"
                    />
                    <MoneyInput
                        placeholder="Min amount"
                        value={amountMin}
                        onChange={(v) => { setAmountMin(v); setPage(1); }}
                        className="w-28"
                    />
                    <MoneyInput
                        placeholder="Max amount"
                        value={amountMax}
                        onChange={(v) => { setAmountMax(v); setPage(1); }}
                        className="w-28"
                    />
                    <Button variant="ghost" size="sm" onClick={() => { loadPayments(); loadStats(); }}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-card overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <TH>Company</TH>
                            <TH>Employer</TH>
                            <TH>For</TH>
                            <TH>Type</TH>
                            <TH>Amount</TH>
                            <TH>Due Date</TH>
                            <TH>Status</TH>
                            <TH>Proof</TH>
                            <TH>Actions</TH>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b">
                                    {Array.from({ length: 9 }).map((__, j) => (
                                        <TD key={j}><Skeleton className="h-4 w-full" /></TD>
                                    ))}
                                </tr>
                            ))
                        ) : payments.length === 0 ? (
                            <tr><td colSpan={9} className="py-10 text-center text-muted-foreground text-sm">No payment requests found</td></tr>
                        ) : (
                            payments.map((p) => {
                                const latestProof = p.payment_proofs?.slice().sort((a, b) =>
                                    new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
                                )[0];
                                return (
                                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <TD>
                                            <div className="font-medium text-sm">{p.companies?.company_name ?? "—"}</div>
                                            <div className="text-xs text-muted-foreground">{p.companies?.industry ?? ""}</div>
                                        </TD>
                                        <TD>
                                            {p.employers ? (
                                                <div>
                                                    <div className="text-sm">{p.employers.first_name} {p.employers.last_name}</div>
                                                    <div className="text-xs text-muted-foreground">{p.employers.designation ?? ""}</div>
                                                </div>
                                            ) : "—"}
                                        </TD>
                                        <TD>
                                            {p.reference_invitation ? (
                                                <div>
                                                    <div className="text-sm">
                                                        {p.reference_invitation.candidate
                                                            ? `${p.reference_invitation.candidate.first_name} ${p.reference_invitation.candidate.last_name}`
                                                            : "—"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {p.reference_invitation.job_offer?.job_title ?? p.reference_job?.job_title ?? ""}
                                                    </div>
                                                </div>
                                            ) : p.reference_job ? (
                                                <div className="text-sm">{p.reference_job.job_title}</div>
                                            ) : "—"}
                                        </TD>
                                        <TD>
                                            <Badge variant="outline" className="text-xs">{p.payment_types?.label ?? "—"}</Badge>
                                        </TD>
                                        <TD className="font-medium">{fmtAmount(Number(p.amount), p.currency)}</TD>
                                        <TD>
                                            {p.due_date ? (
                                                <span className={new Date(p.due_date) < new Date() && p.status === "pending_payment" ? "text-red-600 font-medium" : ""}>
                                                    {fmtDate(p.due_date)}
                                                </span>
                                            ) : "—"}
                                        </TD>
                                        <TD><StatusBadge status={p.status} /></TD>
                                        <TD>
                                            {latestProof ? (
                                                <a href={`/api/payments/proofs/${latestProof.id}`} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                                                    <FileText className="h-3 w-3" />{latestProof.file_name.slice(0, 16)}…
                                                </a>
                                            ) : <span className="text-xs text-muted-foreground">None</span>}
                                        </TD>
                                        <TD>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedPayment(p); setShowDetailDialog(true); }}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                {p.status === "under_review" && (
                                                    <Button variant="ghost" size="sm" onClick={() => { setReviewPayment(p); setShowReviewDialog(true); }}>
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TD>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}</span>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
                        <span className="px-3 py-1 border rounded-md bg-muted">{page} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
                        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <CreatePaymentRequestDialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onCreated={() => { loadPayments(); loadStats(); }}
                paymentTypes={paymentTypes.filter(pt => pt.is_active)}
            />
            {selectedPayment && (
                <PaymentDetailDialog
                    open={showDetailDialog}
                    payment={selectedPayment}
                    onClose={() => setShowDetailDialog(false)}
                    onChanged={() => { loadPayments(); loadStats(); }}
                />
            )}
            {reviewPayment && (
                <ReviewProofDialog
                    open={showReviewDialog}
                    payment={reviewPayment}
                    onClose={() => setShowReviewDialog(false)}
                    onReviewed={() => { loadPayments(); loadStats(); setShowReviewDialog(false); }}
                />
            )}
        </div>
    );
}

// ── Placements Tab ────────────────────────────────────────────────────────
// The hired-candidate register, grouped by company. Every hire sits next to the
// hiring fee it generated, so an unbilled placement cannot go unnoticed.

interface PlacementHire {
    invitation_id: string;
    company_id: string;
    candidate: { first_name: string; last_name: string; email: string } | null;
    employer: { first_name: string; last_name: string; email: string } | null;
    job: { id: string; job_title: string } | null;
    hired_at: string | null;
    salary_amount: number | null;
    salary_currency: string;
    salary_period: string;
    expected_fee: number | null;
    payment_request: { id: string; amount: number; currency: string; status: string; due_date: string | null } | null;
    billed: boolean;
}
interface PlacementGroup {
    company_id: string;
    company_name: string;
    industry: string | null;
    hire_count: number;
    total_fees: number;
    outstanding: number;
    unbilled_count: number;
    currency: string;
    hires: PlacementHire[];
}
interface PlacementSummary {
    hiring_fee_percentage: number;
    total_hires: number;
    total_companies: number;
    unbilled_hires: number;
    outstanding: number;
}

function PlacementsTab() {
    const [groups, setGroups] = useState<PlacementGroup[]>([]);
    const [summary, setSummary] = useState<PlacementSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [unbilledOnly, setUnbilledOnly] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [creating, setCreating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "50" });
            if (search) params.set("search", search);
            if (unbilledOnly) params.set("billed", "false");
            if (dateFrom) params.set("dateFrom", dateFrom);
            if (dateTo) params.set("dateTo", dateTo);
            const res = await fetch(`/api/mis/placements?${params}`);
            const json = await res.json();
            if (json.success) {
                setGroups(json.data);
                setSummary(json.summary);
                // Expand automatically when something needs attention.
                setExpanded(new Set(
                    (json.data as PlacementGroup[]).filter((g) => g.unbilled_count > 0).map((g) => g.company_id)
                ));
            }
        } finally {
            setLoading(false);
        }
    }, [search, unbilledOnly, dateFrom, dateTo]);

    useEffect(() => { load(); }, [load]);

    async function createFee(hire: PlacementHire) {
        setCreating(hire.invitation_id);
        setError(null);
        try {
            const res = await fetch("/api/mis/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_id: hire.company_id,
                    payment_type_code: "hiring_fee",
                    reference_invitation_id: hire.invitation_id,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Failed to create hiring fee");
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create hiring fee");
        } finally {
            setCreating(null);
        }
    }

    function toggle(companyId: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(companyId)) next.delete(companyId);
            else next.add(companyId);
            return next;
        });
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Companies Hiring" value={summary ? String(summary.total_companies) : "—"}
                    icon={Building2} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-950" />
                <KpiCard title="Total Hires" value={summary ? String(summary.total_hires) : "—"}
                    icon={UserCheck} color="text-green-600" bgColor="bg-green-50 dark:bg-green-950" />
                <KpiCard title="Not Billed" value={summary ? String(summary.unbilled_hires) : "—"}
                    icon={AlertTriangle} color="text-red-600" bgColor="bg-red-50 dark:bg-red-950" />
                <KpiCard title="Outstanding" value={summary ? fmtAmount(summary.outstanding) : "—"}
                    icon={DollarSign} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-950" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Input placeholder="Search company…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
                <DateField value={dateFrom} onChange={setDateFrom} placeholder="Hired from" clearable className="w-36" />
                <DateField value={dateTo} onChange={setDateTo} placeholder="Hired to" clearable className="w-36" />
                <Button variant={unbilledOnly ? "default" : "outline"} size="sm" onClick={() => setUnbilledOnly((v) => !v)}>
                    <AlertTriangle className="h-4 w-4 mr-1" />Not billed only
                </Button>
                <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
                {summary && (
                    <span className="text-xs text-muted-foreground ml-auto">
                        Hiring fee: {summary.hiring_fee_percentage}% of monthly salary
                    </span>
                )}
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="rounded-lg border bg-card divide-y">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4"><Skeleton className="h-6 w-full" /></div>
                    ))
                ) : groups.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">No hired candidates found</div>
                ) : (
                    groups.map((g) => (
                        <div key={g.company_id}>
                            <button
                                onClick={() => toggle(g.company_id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                            >
                                {expanded.has(g.company_id)
                                    ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm truncate">{g.company_name}</div>
                                    <div className="text-xs text-muted-foreground">{g.industry ?? ""}</div>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {g.hire_count} {g.hire_count === 1 ? "hire" : "hires"}
                                </span>
                                <span className="text-sm font-medium whitespace-nowrap">{fmtAmount(g.total_fees, g.currency)}</span>
                                {g.unbilled_count > 0 ? (
                                    <Badge variant="destructive" className="whitespace-nowrap">{g.unbilled_count} not billed</Badge>
                                ) : g.outstanding > 0 ? (
                                    <Badge variant="secondary" className="whitespace-nowrap">{fmtAmount(g.outstanding, g.currency)} pending</Badge>
                                ) : (
                                    <Badge variant="default" className="whitespace-nowrap">Settled</Badge>
                                )}
                            </button>

                            {expanded.has(g.company_id) && (
                                <div className="overflow-x-auto border-t bg-muted/20">
                                    <table className="w-full text-left">
                                        <thead className="border-b">
                                            <tr>
                                                <TH>Candidate</TH>
                                                <TH>Job</TH>
                                                <TH>Hired On</TH>
                                                <TH>Offered Salary</TH>
                                                <TH>Hiring Fee</TH>
                                                <TH>Payment</TH>
                                                <TH>Due</TH>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {g.hires.map((h) => (
                                                <tr key={h.invitation_id} className="border-b last:border-0">
                                                    <TD>
                                                        <div className="text-sm">
                                                            {h.candidate ? `${h.candidate.first_name} ${h.candidate.last_name}` : "—"}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{h.candidate?.email ?? ""}</div>
                                                    </TD>
                                                    <TD>{h.job?.job_title ?? "—"}</TD>
                                                    <TD>{h.hired_at ? fmtDate(h.hired_at) : "—"}</TD>
                                                    <TD>
                                                        {h.salary_amount != null
                                                            ? `${fmtAmount(h.salary_amount, h.salary_currency)} / ${h.salary_period}`
                                                            : "—"}
                                                    </TD>
                                                    <TD className="font-medium">
                                                        {h.payment_request
                                                            ? fmtAmount(Number(h.payment_request.amount), h.payment_request.currency)
                                                            : h.expected_fee != null
                                                                ? <span className="text-muted-foreground">{fmtAmount(h.expected_fee, h.salary_currency)} (expected)</span>
                                                                : "—"}
                                                    </TD>
                                                    <TD>
                                                        {h.payment_request ? (
                                                            <StatusBadge status={h.payment_request.status} />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="destructive">Not billed</Badge>
                                                                <Button
                                                                    size="sm" variant="outline"
                                                                    disabled={creating === h.invitation_id}
                                                                    onClick={() => createFee(h)}
                                                                >
                                                                    {creating === h.invitation_id
                                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        : <><Plus className="h-3.5 w-3.5 mr-1" />Create fee</>}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TD>
                                                    <TD>
                                                        {h.payment_request?.due_date ? (
                                                            <span className={
                                                                new Date(h.payment_request.due_date) < new Date()
                                                                    && h.payment_request.status === "pending_payment"
                                                                    ? "text-red-600 font-medium" : ""
                                                            }>
                                                                {fmtDate(h.payment_request.due_date)}
                                                            </span>
                                                        ) : "—"}
                                                    </TD>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────────

function KpiCard({ title, value, icon: Icon, color, bgColor }: {
    title: string; value: string; icon: React.ElementType; color: string; bgColor: string;
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
                <div className="text-xl font-bold tracking-tight truncate">{value}</div>
            </CardContent>
        </Card>
    );
}

// ── Create Payment Request Dialog ─────────────────────────────────────────

function CreatePaymentRequestDialog({
    open, onClose, onCreated, paymentTypes,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    paymentTypes: PaymentType[];
}) {
    const [companySearch, setCompanySearch] = useState("");
    const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [employers, setEmployers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
    const [form, setForm] = useState({
        employer_id: "", payment_type_code: "", amount: "", description: "", due_date: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(async () => {
            const res = await fetch(`/api/mis/payments?search=${encodeURIComponent(companySearch)}&limit=10`);
            const json = await res.json();
            if (json.success) {
                const unique = new Map<string, { id: string; company_name: string }>();
                (json.data as PaymentRequest[]).forEach((p) => {
                    if (p.companies) unique.set(p.companies.id, p.companies);
                });
                setCompanies(Array.from(unique.values()));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [companySearch, open]);

    useEffect(() => {
        if (!selectedCompany) { setEmployers([]); return; }
        fetch(`/api/mis/payments?companyId=${selectedCompany}&limit=100`).then(r => r.json()).then(json => {
            if (json.success) {
                const unique = new Map<string, { id: string; first_name: string; last_name: string }>();
                (json.data as PaymentRequest[]).forEach((p) => {
                    if (p.employers) unique.set(p.employers.id, p.employers);
                });
                setEmployers(Array.from(unique.values()));
            }
        });
    }, [selectedCompany]);

    const handleSubmit = async () => {
        setError("");
        if (!selectedCompany || !form.payment_type_code) {
            setError("Company and payment type are required.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/mis/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_id: selectedCompany,
                    employer_id: form.employer_id || undefined,
                    payment_type_code: form.payment_type_code,
                    amount: form.amount ? Number(form.amount) : undefined,
                    description: form.description || undefined,
                    due_date: form.due_date || undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Failed to create"); return; }
            onCreated();
            onClose();
            setForm({ employer_id: "", payment_type_code: "", amount: "", description: "", due_date: "" });
            setSelectedCompany("");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Payment Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    {error && <div className="text-sm text-destructive rounded border border-destructive/30 bg-destructive/10 px-3 py-2">{error}</div>}
                    <div className="space-y-1.5">
                        <Label>Search Company</Label>
                        <Input placeholder="Type company name…" value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} />
                        {companies.length > 0 && (
                            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    {employers.length > 0 && (
                        <div className="space-y-1.5">
                            <Label>Employer (optional)</Label>
                            <Select value={form.employer_id} onValueChange={(v) => setForm(f => ({ ...f, employer_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select employer" /></SelectTrigger>
                                <SelectContent>
                                    {employers.map((e) => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label>Payment Type *</Label>
                        <Select value={form.payment_type_code} onValueChange={(v) => setForm(f => ({ ...f, payment_type_code: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                                {paymentTypes.map((pt) => <SelectItem key={pt.id} value={pt.code}>{pt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Amount (LKR) — leave blank to use pricing</Label>
                            <MoneyInput placeholder="0.00" value={form.amount} onChange={(v) => setForm(f => ({ ...f, amount: v }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Due Date (optional)</Label>
                            <DateField value={form.due_date} onChange={(v) => setForm(f => ({ ...f, due_date: v }))} placeholder="Select due date" clearable />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Description (optional)</Label>
                        <Textarea placeholder="Additional details…" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Creating…" : "Create Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Payment Detail Dialog ─────────────────────────────────────────────────

function PaymentDetailDialog({ open, payment, onClose, onChanged }: {
    open: boolean; payment: PaymentRequest; onClose: () => void; onChanged?: () => void;
}) {
    const [showFlag, setShowFlag] = useState(false);
    const [flagReason, setFlagReason] = useState("");
    const [flagging, setFlagging] = useState(false);
    const [flagError, setFlagError] = useState("");

    const [reviewNotes, setReviewNotes] = useState("");
    const [reviewing, setReviewing] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [showReject, setShowReject] = useState(false);

    const job = payment.reference_job;

    const submitReview = async (action: "approve" | "reject") => {
        if (action === "reject" && !reviewNotes.trim()) {
            setReviewError("Please provide a reason for rejection.");
            return;
        }
        setReviewError("");
        setReviewing(true);
        try {
            const res = await fetch(`/api/mis/payments/${payment.id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, review_notes: reviewNotes.trim() || undefined }),
            });
            const json = await res.json();
            if (!res.ok) { setReviewError(json.error ?? "Review failed"); return; }
            onChanged?.();
            onClose();
        } finally {
            setReviewing(false);
        }
    };
    const canFlag = !!job && ["published", "paused"].includes(job.status) && !job.mis_pause_locked;
    const latestProofId = payment.payment_proofs?.slice().sort((a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )[0]?.id;

    const submitFlag = async () => {
        if (!job) return;
        if (!flagReason.trim()) { setFlagError("Please provide a reason."); return; }
        setFlagError("");
        setFlagging(true);
        try {
            const res = await fetch(`/api/mis/jobs/${job.id}/compliance-pause`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: flagReason.trim(), payment_request_id: payment.id, proof_id: latestProofId }),
            });
            const data = await res.json();
            if (!res.ok) { setFlagError(data.error || "Failed to flag"); return; }
            onChanged?.();
            onClose();
        } finally {
            setFlagging(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Payment Request Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Company:</span> <span className="font-medium">{payment.companies?.company_name}</span></div>
                        <div><span className="text-muted-foreground">Employer:</span> <span className="font-medium">{payment.employers ? `${payment.employers.first_name} ${payment.employers.last_name}` : "—"}</span></div>
                        <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline">{payment.payment_types?.label}</Badge></div>
                        <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={payment.status} /></div>
                        <div><span className="text-muted-foreground">Amount:</span> <span className="font-bold">{fmtAmount(Number(payment.amount), payment.currency)}</span></div>
                        <div><span className="text-muted-foreground">Due Date:</span> {payment.due_date ? fmtDate(payment.due_date) : "—"}</div>
                        {payment.payment_method && (
                            <div><span className="text-muted-foreground">Method:</span> {payment.payment_method === "online_payment" ? "Online payment" : "Bank transfer"}</div>
                        )}
                        {job && (
                            <div>
                                <span className="text-muted-foreground">Job:</span>{" "}
                                <a href={`/mis/jobs/${job.id}`} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                                    {job.job_title}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}
                        <div className="col-span-2"><span className="text-muted-foreground">Description:</span> {payment.description}</div>
                        {payment.bank_transfer_reference && (
                            <div className="col-span-2"><span className="text-muted-foreground">Bank Ref:</span> {payment.bank_transfer_reference}</div>
                        )}
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Payment Proofs ({payment.payment_proofs?.length ?? 0})</h4>
                        {!payment.payment_proofs?.length ? (
                            <p className="text-sm text-muted-foreground">No proofs submitted yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {[...payment.payment_proofs].sort((a, b) =>
                                    new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
                                ).map((proof) => (
                                    <div key={proof.id} className="rounded-lg border p-3 text-sm space-y-1">
                                        <div className="flex items-center justify-between">
                                            <a href={`/api/payments/proofs/${proof.id}`} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                                                <FileText className="h-4 w-4" />{proof.file_name}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                            <Badge variant={proof.status === "approved" ? "default" : proof.status === "rejected" ? "destructive" : "secondary"}>
                                                {formatLabel(proof.status)}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Uploaded {fmtDate(proof.uploaded_at)}
                                            {proof.reviewed_at && ` · Reviewed ${fmtDate(proof.reviewed_at)}`}
                                        </div>
                                        {proof.review_notes && (
                                            <div className="text-xs text-muted-foreground italic">Note: {proof.review_notes}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Approve / reject the submitted payment proof (MIS only) */}
                    {payment.status === "under_review" && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Review Payment</h4>
                                {reviewError && <p className="text-xs text-destructive">{reviewError}</p>}
                                {!showReject ? (
                                    <div className="flex justify-end gap-2">
                                        <Button variant="destructive" size="sm" onClick={() => { setReviewError(""); setShowReject(true); }} disabled={reviewing}>
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                        <Button size="sm" onClick={() => submitReview("approve")} disabled={reviewing}>
                                            {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                                            Approve
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Reason for rejection (required)</Label>
                                        <Textarea
                                            placeholder="Reason shown to the employer (e.g. the bank slip could not be verified)…"
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            rows={2}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => { setShowReject(false); setReviewNotes(""); setReviewError(""); }} disabled={reviewing}>
                                                Cancel
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => submitReview("reject")} disabled={reviewing || !reviewNotes.trim()}>
                                                {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                                Confirm Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Flag fake document → pause job (MIS only) */}
                    {job && (
                        <>
                            <Separator />
                            <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                                    <ShieldAlert className="h-4 w-4" /> Document compliance
                                </div>
                                {job.mis_pause_locked ? (
                                    <p className="text-xs text-red-700 mt-1">This job is already paused for a compliance review. Manage it in the Compliance tab.</p>
                                ) : !canFlag ? (
                                    <p className="text-xs text-muted-foreground mt-1">Flagging is available only while the job is live (published or paused).</p>
                                ) : !showFlag ? (
                                    <div className="mt-2">
                                        <Button variant="destructive" size="sm" onClick={() => setShowFlag(true)}>
                                            Flag fake document &amp; pause job
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="mt-2 space-y-2">
                                        {flagError && <p className="text-xs text-destructive">{flagError}</p>}
                                        <Textarea
                                            placeholder="Reason shown to the employer (e.g. the bank slip could not be verified)"
                                            value={flagReason}
                                            onChange={(e) => setFlagReason(e.target.value)}
                                            rows={2}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setShowFlag(false)} disabled={flagging}>Cancel</Button>
                                            <Button variant="destructive" size="sm" onClick={submitFlag} disabled={flagging || !flagReason.trim()}>
                                                {flagging ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                                Pause job
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Review Proof Dialog ───────────────────────────────────────────────────

function ReviewProofDialog({ open, payment, onClose, onReviewed }: {
    open: boolean; payment: PaymentRequest; onClose: () => void; onReviewed: () => void;
}) {
    const [reviewNotes, setReviewNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const latestProof = payment.payment_proofs?.slice().sort((a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )[0];

    const handleAction = async (action: "approve" | "reject") => {
        if (action === "reject" && !reviewNotes.trim()) {
            setError("Please provide a reason for rejection.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const res = await fetch(`/api/mis/payments/${payment.id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, review_notes: reviewNotes || undefined }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Review failed"); return; }
            onReviewed();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Review Payment Proof</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2 text-sm">
                    {error && <div className="text-sm text-destructive rounded border border-destructive/30 bg-destructive/10 px-3 py-2">{error}</div>}
                    <div className="space-y-1">
                        <div><span className="text-muted-foreground">Company:</span> <strong>{payment.companies?.company_name}</strong></div>
                        <div><span className="text-muted-foreground">Amount:</span> <strong>{fmtAmount(Number(payment.amount), payment.currency)}</strong></div>
                        <div><span className="text-muted-foreground">Type:</span> {payment.payment_types?.label}</div>
                    </div>
                    {latestProof ? (
                        <div className="rounded-lg border p-3 space-y-2">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Submitted Proof</div>
                            <a href={`/api/payments/proofs/${latestProof.id}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-primary hover:underline font-medium">
                                <FileText className="h-4 w-4" />{latestProof.file_name}
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <div className="text-xs text-muted-foreground">Uploaded {fmtDate(latestProof.uploaded_at)}</div>
                            {/* Image preview for image files */}
                            {latestProof.file_name.match(/\.(jpg|jpeg|png|webp)$/i) && (
                                <img src={`/api/payments/proofs/${latestProof.id}`} alt="payment proof" className="rounded border max-h-48 object-contain w-full" />
                            )}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No proof file found.</p>
                    )}
                    <div className="space-y-1.5">
                        <Label>Review Notes {<span className="text-muted-foreground">(required for rejection)</span>}</Label>
                        <Textarea
                            placeholder="Add notes or rejection reason…"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={() => handleAction("reject")} disabled={submitting}>
                        <XCircle className="h-4 w-4 mr-1" />Reject
                    </Button>
                    <Button onClick={() => handleAction("approve")} disabled={submitting}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Compliance Tab ────────────────────────────────────────────────────────

const FLAG_STATUS_LABELS: Record<string, string> = {
    paused: "Paused — awaiting document",
    resubmitted: "Resubmitted — review needed",
    resolved: "Resolved (republished)",
    dismissed: "Dismissed (kept paused)",
};

function ComplianceTab() {
    const [flags, setFlags] = useState<ComplianceFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("open");
    const [jobSearch, setJobSearch] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL("/api/mis/jobs/compliance", window.location.origin);
            if (statusFilter && !["open", "all"].includes(statusFilter)) url.searchParams.set("status", statusFilter);
            if (jobSearch) url.searchParams.set("jobSearch", jobSearch);
            const res = await fetch(url.toString());
            const json = await res.json();
            if (json.success) {
                let data: ComplianceFlag[] = json.data;
                if (statusFilter === "open") data = data.filter((f) => ["paused", "resubmitted"].includes(f.status));
                setFlags(data);
            }
        } finally {
            setLoading(false);
        }
    }, [statusFilter, jobSearch]);

    useEffect(() => { load(); }, [load]);

    const resolve = async (flag: ComplianceFlag, action: "republish" | "reject") => {
        if (!flag.job) return;
        if (action === "republish" && !confirm(`Republish "${flag.job.job_title}"?`)) return;
        const notes = action === "reject"
            ? prompt("Why was this replacement document rejected?")?.trim()
            : undefined;
        if (action === "reject" && (!notes || notes.length < 3)) return;
        setBusyId(flag.id);
        try {
            const res = await fetch(`/api/mis/jobs/${flag.job.id}/compliance-resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, notes }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || "Failed"); return; }
            await load();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold mr-auto">Document Compliance</h2>
                <Input placeholder="Search job title…" value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} className="w-48" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="open">Open (action needed)</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="resubmitted">Resubmitted</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : flags.length === 0 ? (
                <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No compliance flags.</CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {flags.map((flag) => {
                        const open = ["paused", "resubmitted"].includes(flag.status);
                        return (
                            <Card key={flag.id} className={open ? "border-red-200" : ""}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">{flag.job?.job_title ?? "Job"}</span>
                                                <Badge variant={open ? "destructive" : "secondary"}>{FLAG_STATUS_LABELS[flag.status] ?? flag.status}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {flag.job?.company?.company_name ?? "—"} · Flagged {fmtDate(flag.flagged_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-sm"><span className="text-muted-foreground">Reason:</span> {flag.reason}</div>

                                    {flag.status === "resubmitted" && (
                                        <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                                            <div className="font-medium">Employer resubmission</div>
                                            {flag.employer_doc_url && (
                                                <a href={flag.employer_doc_url} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                                                    <FileText className="h-3.5 w-3.5" />{flag.employer_doc_name ?? "View document"}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                            {flag.employer_note && <p className="text-xs text-muted-foreground">Note: {flag.employer_note}</p>}
                                            {flag.resubmitted_at && <p className="text-xs text-muted-foreground">Submitted {fmtDate(flag.resubmitted_at)}</p>}
                                        </div>
                                    )}

                                    {flag.status === "paused" && (
                                        <p className="text-xs text-muted-foreground">Waiting for the employer to submit a corrected document.</p>
                                    )}

                                    {flag.resolution_notes && (
                                        <p className="text-xs text-muted-foreground italic">Resolution: {flag.resolution_notes}</p>
                                    )}

                                    {open && (
                                        <div className="flex justify-end gap-2">
                                            {flag.status === "resubmitted" && (
                                                <Button variant="outline" size="sm" disabled={busyId === flag.id} onClick={() => resolve(flag, "reject")}>
                                                    Request another document
                                                </Button>
                                            )}
                                            <Button size="sm" disabled={busyId === flag.id} onClick={() => resolve(flag, "republish")}>
                                                {busyId === flag.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                                                Republish
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Configuration Tab ─────────────────────────────────────────────────────

function ConfigurationTab() {
    return (
        <div className="space-y-8">
            <JobAdPricingManager />
            <Separator />
            <HiringFeeSettingsManager />
            <Separator />
            <BankDetailsManager />
            <Separator />
            <PaymentTypesManager />
        </div>
    );
}

// ── Hiring Fee Settings ───────────────────────────────────────────────────
// MIS sets the percentage of the offered monthly salary charged as the hiring fee.

function HiringFeeSettingsManager() {
    const [percentage, setPercentage] = useState("");
    const [dueDays, setDueDays] = useState("");
    const [saved, setSaved] = useState<{ pct: string; days: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/mis/payment-settings");
            const json = await res.json();
            if (json.success) {
                const pct = String(json.data.hiring_fee_percentage ?? "");
                const days = String(json.data.hiring_fee_due_days ?? "");
                setPercentage(pct);
                setDueDays(days);
                setSaved({ pct, days });
            }
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const dirty = saved === null || percentage !== saved.pct || dueDays !== saved.days;

    const save = async () => {
        const pct = Number(percentage);
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) { setError("Enter a percentage between 0 and 100."); return; }
        const days = Number(dueDays);
        if (!Number.isInteger(days) || days < 1 || days > 365) { setError("Enter payment terms between 1 and 365 days."); return; }
        setError("");
        setSaving(true);
        try {
            const res = await fetch("/api/mis/payment-settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hiring_fee_percentage: pct, hiring_fee_due_days: days }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Failed to save"); return; }
            const next = {
                pct: String(json.data.hiring_fee_percentage),
                days: String(json.data.hiring_fee_due_days),
            };
            setSaved(next);
            setPercentage(next.pct);
            setDueDays(next.days);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-base font-semibold">Hiring Fee</h3>
                <p className="text-sm text-muted-foreground">Percentage of the offered monthly salary charged to the employer when a candidate is hired, and how long they have to pay it.</p>
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</div>}
            {loading ? (
                <Skeleton className="h-20 w-full" />
            ) : (
                <div className="rounded-lg border p-4 space-y-3 max-w-md">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Current: </span>
                        <span className="font-semibold">{saved !== null ? `${saved.pct}%, due in ${saved.days} days` : "—"}</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="space-y-1 flex-1">
                            <Label className="text-xs">Percentage (%)</Label>
                            <Input type="number" min="0" max="100" step="0.01" value={percentage} onChange={(e) => setPercentage(e.target.value)} />
                        </div>
                        <div className="space-y-1 flex-1">
                            <Label className="text-xs">Payment terms (days)</Label>
                            <Input type="number" min="1" max="365" step="1" value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
                        </div>
                        <Button size="sm" onClick={save} disabled={saving || !dirty}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">e.g. 50 → fee is half of the offered monthly salary. Applied the moment a candidate accepts an offer, with the due date set that many days later.</p>
                </div>
            )}
        </div>
    );
}

// ── Job Advertisement Pricing ─────────────────────────────────────────────
// Dedicated, prominent control for the two prices employers pay: publishing a
// new job ad and extending one. These are the amounts shown on the employer's
// payment screen before publish/extend.

const JOB_AD_PRICE_ROWS: { code: string; label: string; hint: string }[] = [
    { code: "JOB_AD_PUBLISH", label: "New Job Advertisement", hint: "Charged before a job ad is published" },
    { code: "JOB_AD_EXTEND", label: "Extend Job Advertisement", hint: "Charged when an expired ad is extended" },
];

function JobAdPricingManager() {
    const [types, setTypes] = useState<PaymentType[]>([]);
    const [pricing, setPricing] = useState<PaymentPricing[]>([]);
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState<Record<string, { amount: string; currency: string }>>({});
    const [savingCode, setSavingCode] = useState<string | null>(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [t, p] = await Promise.all([fetch("/api/mis/payment-types"), fetch("/api/mis/payment-pricing")]);
            const [tj, pj] = await Promise.all([t.json(), p.json()]);
            if (tj.success) setTypes(tj.data);
            if (pj.success) setPricing(pj.data);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const typeFor = (code: string) => types.find((t) => t.code === code);
    const priceFor = (typeId?: string) => pricing.find((p) => p.payment_types?.id === typeId && p.is_active);

    const save = async (code: string) => {
        const type = typeFor(code);
        if (!type) { setError(`Payment type "${code}" is missing. Please contact an administrator.`); return; }
        const current = priceFor(type.id);
        const draft = drafts[code] ?? { amount: current ? String(current.amount) : "", currency: current?.currency ?? "LKR" };
        if (draft.amount === "" || Number(draft.amount) < 0) { setError("Enter a valid amount."); return; }
        setError("");
        setSavingCode(code);
        try {
            const res = await fetch("/api/mis/payment-pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_type_id: type.id, amount: Number(draft.amount), currency: draft.currency || "LKR" }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Failed to set price"); return; }
            setDrafts((d) => { const n = { ...d }; delete n[code]; return n; });
            await load();
        } finally {
            setSavingCode(null);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-base font-semibold">Job Advertisement Pricing</h3>
                <p className="text-sm text-muted-foreground">Set the amount employers pay to publish and extend job ads. This price is shown on the payment screen before publishing.</p>
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</div>}
            {loading ? (
                <Skeleton className="h-28 w-full" />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {JOB_AD_PRICE_ROWS.map((row) => {
                        const type = typeFor(row.code);
                        const current = priceFor(type?.id);
                        const draft = drafts[row.code];
                        const amountVal = draft?.amount ?? (current ? String(current.amount) : "");
                        const currencyVal = draft?.currency ?? current?.currency ?? "LKR";
                        const setDraft = (patch: Partial<{ amount: string; currency: string }>) =>
                            setDrafts((d) => ({ ...d, [row.code]: { amount: amountVal, currency: currencyVal, ...patch } }));
                        return (
                            <div key={row.code} className="rounded-lg border p-4 space-y-3">
                                <div>
                                    <div className="font-medium">{row.label}</div>
                                    <div className="text-xs text-muted-foreground">{row.hint}</div>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Current: </span>
                                    {current ? <span className="font-semibold">{fmtAmount(Number(current.amount), current.currency)}</span> : <span className="text-amber-600">Not set</span>}
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Currency</Label>
                                        <Input className="w-20" value={currencyVal} onChange={(e) => setDraft({ currency: e.target.value })} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <Label className="text-xs">Amount</Label>
                                        <MoneyInput placeholder="0.00" value={amountVal} onChange={(v) => setDraft({ amount: v })} />
                                    </div>
                                    <Button size="sm" onClick={() => save(row.code)} disabled={savingCode === row.code || !type}>
                                        {savingCode === row.code ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                    </Button>
                                </div>
                                {!type && <p className="text-xs text-amber-600">Payment type not found.</p>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Bank Details Manager ──────────────────────────────────────────────────

function BankDetailsManager() {
    const [banks, setBanks] = useState<BankDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ bank_name: "", account_name: "", account_number: "", branch: "", bank_code: "", swift_code: "", sort_order: "0" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/mis/bank-details");
        const json = await res.json();
        if (json.success) setBanks(json.data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const openAdd = () => {
        setEditId(null);
        setForm({ bank_name: "", account_name: "", account_number: "", branch: "", bank_code: "", swift_code: "", sort_order: "0" });
        setError("");
        setShowForm(true);
    };

    const openEdit = (b: BankDetails) => {
        setEditId(b.id);
        setForm({ bank_name: b.bank_name, account_name: b.account_name, account_number: b.account_number, branch: b.branch ?? "", bank_code: b.bank_code ?? "", swift_code: b.swift_code ?? "", sort_order: String(b.sort_order) });
        setError("");
        setShowForm(true);
    };

    const handleSubmit = async () => {
        setError("");
        if (!form.bank_name || !form.account_name || !form.account_number) {
            setError("Bank name, account name, and account number are required.");
            return;
        }
        setSubmitting(true);
        try {
            const payload = { ...form, sort_order: Number(form.sort_order), branch: form.branch || undefined, bank_code: form.bank_code || undefined, swift_code: form.swift_code || undefined };
            const res = editId
                ? await fetch(`/api/mis/bank-details/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                : await fetch("/api/mis/bank-details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Failed to save"); return; }
            setShowForm(false);
            load();
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (id: string, is_active: boolean) => {
        await fetch(`/api/mis/bank-details/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active }) });
        load();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold">Bank Accounts</h3>
                    <p className="text-sm text-muted-foreground">Employers see active bank accounts when paying</p>
                </div>
                <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Bank Account</Button>
            </div>
            {loading ? <Skeleton className="h-20 w-full" /> : banks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bank accounts configured yet.</p>
            ) : (
                <div className="rounded-lg border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <TH>Bank</TH><TH>Account Name</TH><TH>Account No.</TH><TH>Branch</TH><TH>Status</TH><TH>Actions</TH>
                            </tr>
                        </thead>
                        <tbody>
                            {banks.map((b) => (
                                <tr key={b.id} className="border-b hover:bg-muted/20">
                                    <TD className="font-medium">{b.bank_name}</TD>
                                    <TD>{b.account_name}</TD>
                                    <TD className="font-mono text-xs">{b.account_number}</TD>
                                    <TD>{b.branch ?? "—"}</TD>
                                    <TD><Badge variant={b.is_active ? "default" : "secondary"}>{b.is_active ? "Active" : "Inactive"}</Badge></TD>
                                    <TD>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => toggleActive(b.id, !b.is_active)}>
                                                {b.is_active ? <XCircle className="h-3.5 w-3.5 text-red-500" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                                            </Button>
                                        </div>
                                    </TD>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={showForm} onOpenChange={(v) => !v && setShowForm(false)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editId ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</div>}
                        <div className="space-y-1.5"><Label>Bank Name *</Label><Input value={form.bank_name} onChange={(e) => setForm(f => ({ ...f, bank_name: e.target.value }))} /></div>
                        <div className="space-y-1.5"><Label>Account Name *</Label><Input value={form.account_name} onChange={(e) => setForm(f => ({ ...f, account_name: e.target.value }))} /></div>
                        <div className="space-y-1.5"><Label>Account Number *</Label><Input value={form.account_number} onChange={(e) => setForm(f => ({ ...f, account_number: e.target.value }))} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Branch</Label><Input value={form.branch} onChange={(e) => setForm(f => ({ ...f, branch: e.target.value }))} /></div>
                            <div className="space-y-1.5"><Label>Bank Code</Label><Input value={form.bank_code} onChange={(e) => setForm(f => ({ ...f, bank_code: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>SWIFT Code</Label><Input value={form.swift_code} onChange={(e) => setForm(f => ({ ...f, swift_code: e.target.value }))} /></div>
                            <div className="space-y-1.5"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Payment Types Manager ─────────────────────────────────────────────────

function PaymentTypesManager() {
    const [types, setTypes] = useState<PaymentType[]>([]);
    const [pricing, setPricing] = useState<PaymentPricing[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTypeForm, setShowTypeForm] = useState(false);
    const [editType, setEditType] = useState<PaymentType | null>(null);
    const [typeForm, setTypeForm] = useState({ code: "", label: "", description: "", sort_order: "0" });
    const [showPricingForm, setShowPricingForm] = useState(false);
    const [pricingTypeId, setPricingTypeId] = useState("");
    const [pricingAmount, setPricingAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const [typesRes, pricingRes] = await Promise.all([
            fetch("/api/mis/payment-types"),
            fetch("/api/mis/payment-pricing"),
        ]);
        const [tj, pj] = await Promise.all([typesRes.json(), pricingRes.json()]);
        if (tj.success) setTypes(tj.data);
        if (pj.success) setPricing(pj.data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const getActivePrice = (typeId: string) => {
        return pricing.find((p) => p.payment_types?.id === typeId && p.is_active);
    };

    const handleTypeSubmit = async () => {
        setError("");
        if (!typeForm.code || !typeForm.label) { setError("Code and label are required."); return; }
        setSubmitting(true);
        try {
            const payload = { ...typeForm, sort_order: Number(typeForm.sort_order) };
            const res = editType
                ? await fetch(`/api/mis/payment-types/${editType.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                : await fetch("/api/mis/payment-types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Failed to save"); return; }
            setShowTypeForm(false);
            load();
        } finally {
            setSubmitting(false);
        }
    };

    const handlePricingSubmit = async () => {
        setError("");
        if (!pricingTypeId || !pricingAmount) { setError("Select a type and enter an amount."); return; }
        setSubmitting(true);
        try {
            const res = await fetch("/api/mis/payment-pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_type_id: pricingTypeId, amount: Number(pricingAmount) }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Failed to set price"); return; }
            setShowPricingForm(false);
            setPricingAmount("");
            load();
        } finally {
            setSubmitting(false);
        }
    };

    const toggleTypeActive = async (id: string, is_active: boolean) => {
        await fetch(`/api/mis/payment-types/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active }) });
        load();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold">Payment Types &amp; Pricing</h3>
                    <p className="text-sm text-muted-foreground">Add new payment types and set prices per type</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setPricingTypeId(""); setPricingAmount(""); setError(""); setShowPricingForm(true); }}>
                        <DollarSign className="h-4 w-4 mr-1" />Set Price
                    </Button>
                    <Button size="sm" onClick={() => { setEditType(null); setTypeForm({ code: "", label: "", description: "", sort_order: "0" }); setError(""); setShowTypeForm(true); }}>
                        <Plus className="h-4 w-4 mr-1" />Add Type
                    </Button>
                </div>
            </div>
            {loading ? <Skeleton className="h-20 w-full" /> : types.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment types configured.</p>
            ) : (
                <div className="rounded-lg border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b">
                            <tr><TH>Code</TH><TH>Label</TH><TH>Current Price</TH><TH>Status</TH><TH>Actions</TH></tr>
                        </thead>
                        <tbody>
                            {types.map((t) => {
                                const price = getActivePrice(t.id);
                                return (
                                    <tr key={t.id} className="border-b hover:bg-muted/20">
                                        <TD className="font-mono text-xs">{t.code}</TD>
                                        <TD className="font-medium">{t.label}</TD>
                                        <TD>{price ? fmtAmount(price.amount, price.currency) : <span className="text-muted-foreground text-xs">Not set</span>}</TD>
                                        <TD><Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Active" : "Inactive"}</Badge></TD>
                                        <TD>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => { setEditType(t); setTypeForm({ code: t.code, label: t.label, description: t.description ?? "", sort_order: String(t.sort_order) }); setError(""); setShowTypeForm(true); }}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => toggleTypeActive(t.id, !t.is_active)}>
                                                    {t.is_active ? <XCircle className="h-3.5 w-3.5 text-red-500" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                                                </Button>
                                            </div>
                                        </TD>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Type Dialog */}
            <Dialog open={showTypeForm} onOpenChange={(v) => !v && setShowTypeForm(false)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editType ? "Edit Payment Type" : "Add Payment Type"}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</div>}
                        <div className="space-y-1.5"><Label>Code * <span className="text-xs text-muted-foreground">(e.g. training_fee)</span></Label><Input value={typeForm.code} onChange={(e) => setTypeForm(f => ({ ...f, code: e.target.value }))} disabled={!!editType} /></div>
                        <div className="space-y-1.5"><Label>Label *</Label><Input value={typeForm.label} onChange={(e) => setTypeForm(f => ({ ...f, label: e.target.value }))} /></div>
                        <div className="space-y-1.5"><Label>Description</Label><Textarea value={typeForm.description} onChange={(e) => setTypeForm(f => ({ ...f, description: e.target.value }))} /></div>
                        <div className="space-y-1.5"><Label>Sort Order</Label><Input type="number" value={typeForm.sort_order} onChange={(e) => setTypeForm(f => ({ ...f, sort_order: e.target.value }))} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTypeForm(false)}>Cancel</Button>
                        <Button onClick={handleTypeSubmit} disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Set Price Dialog */}
            <Dialog open={showPricingForm} onOpenChange={(v) => !v && setShowPricingForm(false)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Set Pricing</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</div>}
                        <div className="space-y-1.5">
                            <Label>Payment Type *</Label>
                            <Select value={pricingTypeId} onValueChange={setPricingTypeId}>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    {types.filter(t => t.is_active).map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Amount (LKR) *</Label>
                            <MoneyInput placeholder="0.00" value={pricingAmount} onChange={setPricingAmount} />
                        </div>
                        <p className="text-xs text-muted-foreground">Setting a new price deactivates the previous pricing for this type.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPricingForm(false)}>Cancel</Button>
                        <Button onClick={handlePricingSubmit} disabled={submitting}>{submitting ? "Saving…" : "Set Price"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
