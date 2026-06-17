"use client";

import { useState, useEffect, useCallback } from "react";
import {
    CreditCard, Building2, User, Calendar, DollarSign, Eye, CheckCircle2,
    XCircle, Clock, RefreshCw, Plus, Pencil, Trash2, AlertTriangle, FileText,
    ExternalLink, Settings2, Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    amount: number; currency: string; description: string; due_date: string | null;
    status: string; bank_transfer_reference: string | null;
    created_at: string; updated_at: string;
    companies: { id: string; company_name: string; industry: string } | null;
    employers: { id: string; first_name: string; last_name: string; email: string; designation: string | null } | null;
    payment_types: { id: string; code: string; label: string } | null;
    payment_proofs: {
        id: string; status: string; uploaded_at: string; file_url: string; file_name: string;
        reviewed_at: string | null; review_notes: string | null;
    }[];
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

export function PaymentsClient() {
    const [activeTab, setActiveTab] = useState<"payments" | "configuration">("payments");

    return (
        <div className="space-y-6">
            {/* Tab bar */}
            <div className="flex gap-1 border-b">
                {(["payments", "configuration"] as const).map((t) => (
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
                        ) : (
                            <span className="flex items-center gap-2"><Settings2 className="h-4 w-4" />Configuration</span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === "payments" ? <PaymentsTab /> : <ConfigurationTab />}
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
            const res = await fetch(url.toString());
            const json = await res.json();
            if (json.success) {
                setPayments(json.data);
                setTotal(json.pagination.total);
            }
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, typeFilter, dateFrom, dateTo]);

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
                        <KpiCard title="Total Revenue" value={fmtAmount(stats.total_revenue)} icon={DollarSign} color="text-green-600" bgColor="bg-green-50" />
                        <KpiCard title="Pending Payment" value={`${stats.pending_count} · ${fmtAmount(stats.pending_amount)}`} icon={Clock} color="text-amber-600" bgColor="bg-amber-50" />
                        <KpiCard title="Under Review" value={String(stats.under_review_count)} icon={Eye} color="text-blue-600" bgColor="bg-blue-50" />
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
                    <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-36" />
                    <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-36" />
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
                                    {Array.from({ length: 8 }).map((__, j) => (
                                        <TD key={j}><Skeleton className="h-4 w-full" /></TD>
                                    ))}
                                </tr>
                            ))
                        ) : payments.length === 0 ? (
                            <tr><td colSpan={8} className="py-10 text-center text-muted-foreground text-sm">No payment requests found</td></tr>
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
                                                <a href={latestProof.file_url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
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
                            <Input type="number" min="0" placeholder="0.00" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Due Date (optional)</Label>
                            <Input type="date" value={form.due_date} onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} />
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

function PaymentDetailDialog({ open, payment, onClose }: {
    open: boolean; payment: PaymentRequest; onClose: () => void;
}) {
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
                                            <a href={proof.file_url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-blue-600 hover:underline font-medium">
                                                <FileText className="h-4 w-4" />{proof.file_name}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                            <Badge variant={proof.status === "approved" ? "default" : proof.status === "rejected" ? "destructive" : "secondary"}>
                                                {proof.status}
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
                            <a href={latestProof.file_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline font-medium">
                                <FileText className="h-4 w-4" />{latestProof.file_name}
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <div className="text-xs text-muted-foreground">Uploaded {fmtDate(latestProof.uploaded_at)}</div>
                            {/* Image preview for image files */}
                            {latestProof.file_name.match(/\.(jpg|jpeg|png|webp)$/i) && (
                                <img src={latestProof.file_url} alt="payment proof" className="rounded border max-h-48 object-contain w-full" />
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

// ── Configuration Tab ─────────────────────────────────────────────────────

function ConfigurationTab() {
    return (
        <div className="space-y-8">
            <BankDetailsManager />
            <Separator />
            <PaymentTypesManager />
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
                            <Input type="number" min="0" placeholder="0.00" value={pricingAmount} onChange={(e) => setPricingAmount(e.target.value)} />
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
