"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "react-qr-code";
import {
    CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle,
    Upload, FileText, ExternalLink, RefreshCw, Eye, DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────────────

interface BankDetails {
    id: string; bank_name: string; account_name: string; account_number: string;
    branch: string | null; bank_code: string | null; swift_code: string | null;
}
interface PaymentProof {
    id: string; status: string; file_url: string; file_name: string;
    uploaded_at: string; reviewed_at: string | null; review_notes: string | null;
}
interface PaymentRequest {
    id: string; amount: number; currency: string; description: string;
    due_date: string | null; status: string; bank_transfer_reference: string | null;
    created_at: string; updated_at: string;
    payment_types: { id: string; code: string; label: string } | null;
    payment_proofs: PaymentProof[];
}
interface Summary {
    total_paid: number; pending_amount: number; overdue_amount: number; currency: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
    pending_payment: "Pending Payment",
    under_review: "Under Review",
    verified: "Verified",
    rejected: "Rejected",
    cancelled: "Cancelled",
};
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending_payment: "secondary",
    under_review: "outline",
    verified: "default",
    rejected: "destructive",
    cancelled: "outline",
};

function StatusBadge({ status }: { status: string }) {
    return <Badge variant={STATUS_VARIANTS[status] ?? "outline"}>{STATUS_LABELS[status] ?? status}</Badge>;
}

function fmtAmount(amount: number, currency = "LKR") {
    return `${currency} ${Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(p: PaymentRequest) {
    return p.due_date && new Date(p.due_date) < new Date() && p.status === "pending_payment";
}

// ── Main Component ─────────────────────────────────────────────────────────

export function PaymentsClient() {
    const [activeTab, setActiveTab] = useState<"pending" | "under_review" | "history" | "outstanding">("pending");
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [bankDetails, setBankDetails] = useState<BankDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;
    const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);

    const statusMap: Record<typeof activeTab, string | undefined> = {
        pending: "pending_payment",
        under_review: "under_review",
        history: undefined,
        outstanding: "pending_payment",
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL("/api/employer/payments", window.location.origin);
            url.searchParams.set("page", String(page));
            url.searchParams.set("limit", String(limit));
            const status = statusMap[activeTab];
            if (status) url.searchParams.set("status", status);
            if (activeTab === "history") url.searchParams.set("status", "verified,rejected,cancelled");
            const res = await fetch(url.toString());
            const json = await res.json();
            if (json.success) {
                let data: PaymentRequest[] = json.data;
                if (activeTab === "outstanding") data = data.filter(isOverdue);
                setPayments(data);
                setTotal(json.pagination?.total ?? data.length);
                if (json.summary) setSummary(json.summary);
            }
        } finally {
            setLoading(false);
        }
    }, [activeTab, page]);

    const loadBankDetails = useCallback(async () => {
        const res = await fetch("/api/employer/bank-details");
        const json = await res.json();
        if (json.success) setBankDetails(json.data);
    }, []);

    useEffect(() => { loadBankDetails(); }, [loadBankDetails]);
    useEffect(() => { setPage(1); }, [activeTab]);
    useEffect(() => { load(); }, [load]);

    const totalPages = Math.ceil(total / limit);

    const tabs = [
        { key: "pending", label: "Pending Payment", icon: Clock },
        { key: "under_review", label: "Under Review", icon: Eye },
        { key: "history", label: "History", icon: CheckCircle2 },
        { key: "outstanding", label: "Outstanding", icon: AlertTriangle },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard title="Total Paid" value={summary ? fmtAmount(summary.total_paid, summary.currency) : "—"} icon={DollarSign} color="text-green-600" bg="bg-green-50" />
                <SummaryCard title="Pending Amount" value={summary ? fmtAmount(summary.pending_amount, summary.currency) : "—"} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
                <SummaryCard title="Overdue Amount" value={summary ? fmtAmount(summary.overdue_amount, summary.currency) : "—"} icon={AlertTriangle} color="text-red-600" bg="bg-red-50" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b overflow-x-auto">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                            activeTab === key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Icon className="h-4 w-4" />{label}
                    </button>
                ))}
                <Button variant="ghost" size="sm" className="ml-auto mb-1" onClick={load}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
            ) : payments.length === 0 ? (
                <div className="rounded-xl border bg-muted/30 py-16 text-center">
                    <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No payments found in this category.</p>
                </div>
            ) : (activeTab === "pending" || activeTab === "outstanding") ? (
                <div className="space-y-4">
                    {payments.map((p) => (
                        <PaymentCard
                            key={p.id}
                            payment={p}
                            bankDetails={bankDetails}
                            onUpload={() => { setSelectedPayment(p); setShowUploadDialog(true); }}
                            onView={() => { setSelectedPayment(p); setShowDetailDialog(true); }}
                        />
                    ))}
                </div>
            ) : (
                <PaymentTable
                    payments={payments}
                    onView={(p) => { setSelectedPayment(p); setShowDetailDialog(true); }}
                    onUpload={activeTab === "under_review" ? undefined : (p) => { setSelectedPayment(p); setShowUploadDialog(true); }}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}</span>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
                        <span className="px-3 py-1 border rounded-md bg-muted">{page} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            {selectedPayment && showUploadDialog && (
                <UploadProofDialog
                    open={showUploadDialog}
                    payment={selectedPayment}
                    onClose={() => setShowUploadDialog(false)}
                    onUploaded={() => { load(); setShowUploadDialog(false); }}
                />
            )}
            {selectedPayment && showDetailDialog && (
                <PaymentDetailDialog
                    open={showDetailDialog}
                    payment={selectedPayment}
                    onClose={() => setShowDetailDialog(false)}
                    onUpload={() => { setShowDetailDialog(false); setShowUploadDialog(true); }}
                />
            )}
        </div>
    );
}

// ── Summary Card ──────────────────────────────────────────────────────────

function SummaryCard({ title, value, icon: Icon, color, bg }: {
    title: string; value: string; icon: React.ElementType; color: string; bg: string;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    <div className={`p-2 rounded-lg ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-xl font-bold tracking-tight">{value}</div>
            </CardContent>
        </Card>
    );
}

// ── Payment Card (for pending/outstanding) ────────────────────────────────

function PaymentCard({ payment, bankDetails, onUpload, onView }: {
    payment: PaymentRequest;
    bankDetails: BankDetails[];
    onUpload: () => void;
    onView: () => void;
}) {
    const overdue = isOverdue(payment);
    const [showQR, setShowQR] = useState<string | null>(null);

    return (
        <Card className={overdue ? "border-red-300 bg-red-50/30" : ""}>
            <CardContent className="pt-5 space-y-4">
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{payment.payment_types?.label ?? "Payment"}</Badge>
                            <StatusBadge status={payment.status} />
                            {overdue && <Badge variant="destructive">Overdue</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{payment.description}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{fmtAmount(Number(payment.amount), payment.currency)}</div>
                        {payment.due_date && (
                            <div className={`text-xs mt-0.5 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                Due {fmtDate(payment.due_date)}
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Bank Details + QR */}
                {bankDetails.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pay to any of these accounts:</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {bankDetails.map((bank) => {
                                const qrValue = [
                                    `Bank: ${bank.bank_name}`,
                                    `Account Name: ${bank.account_name}`,
                                    `Account No: ${bank.account_number}`,
                                    bank.branch ? `Branch: ${bank.branch}` : null,
                                    bank.bank_code ? `Bank Code: ${bank.bank_code}` : null,
                                    bank.swift_code ? `SWIFT: ${bank.swift_code}` : null,
                                    `Amount: ${fmtAmount(Number(payment.amount), payment.currency)}`,
                                    `Ref: ${payment.id}`,
                                ].filter(Boolean).join("\n");

                                return (
                                    <div key={bank.id} className="rounded-lg border bg-card p-3 space-y-2">
                                        <div className="text-sm font-semibold">{bank.bank_name}</div>
                                        <div className="text-sm text-muted-foreground space-y-0.5">
                                            <div>{bank.account_name}</div>
                                            <div className="font-mono font-medium text-foreground">{bank.account_number}</div>
                                            {bank.branch && <div className="text-xs">{bank.branch}</div>}
                                            {bank.bank_code && <div className="text-xs">Code: {bank.bank_code}</div>}
                                            {bank.swift_code && <div className="text-xs">SWIFT: {bank.swift_code}</div>}
                                        </div>
                                        <button
                                            onClick={() => setShowQR(showQR === bank.id ? null : bank.id)}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            {showQR === bank.id ? "Hide QR" : "Show QR Code"}
                                        </button>
                                        {showQR === bank.id && (
                                            <div className="flex justify-center pt-1">
                                                <QRCode value={qrValue} size={140} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={onView}>
                        <Eye className="h-4 w-4 mr-1" />Details
                    </Button>
                    <Button size="sm" onClick={onUpload}>
                        <Upload className="h-4 w-4 mr-1" />Upload Payment Slip
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Payment Table (for under_review / history) ────────────────────────────

function PaymentTable({ payments, onView, onUpload }: {
    payments: PaymentRequest[];
    onView: (p: PaymentRequest) => void;
    onUpload?: (p: PaymentRequest) => void;
}) {
    return (
        <div className="rounded-lg border bg-card overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-muted/50 border-b">
                    <tr>
                        {["Date", "Type", "Amount", "Due Date", "Status", "Proof", "Actions"].map((h) => (
                            <th key={h} className="py-2 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {payments.map((p) => {
                        const latestProof = p.payment_proofs?.slice().sort((a, b) =>
                            new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
                        )[0];
                        return (
                            <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                                <td className="py-2 px-3 text-sm">{fmtDate(p.created_at)}</td>
                                <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{p.payment_types?.label ?? "—"}</Badge></td>
                                <td className="py-2 px-3 text-sm font-medium">{fmtAmount(Number(p.amount), p.currency)}</td>
                                <td className="py-2 px-3 text-sm">{p.due_date ? fmtDate(p.due_date) : "—"}</td>
                                <td className="py-2 px-3"><StatusBadge status={p.status} /></td>
                                <td className="py-2 px-3">
                                    {latestProof ? (
                                        <a href={latestProof.file_url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                            <FileText className="h-3 w-3" />{latestProof.file_name.slice(0, 18)}…
                                        </a>
                                    ) : <span className="text-xs text-muted-foreground">None</span>}
                                </td>
                                <td className="py-2 px-3">
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => onView(p)}><Eye className="h-3.5 w-3.5" /></Button>
                                        {onUpload && p.status === "rejected" && (
                                            <Button variant="ghost" size="sm" onClick={() => onUpload(p)}>
                                                <Upload className="h-3.5 w-3.5 text-amber-600" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ── Upload Proof Dialog ───────────────────────────────────────────────────

function UploadProofDialog({ open, payment, onClose, onUploaded }: {
    open: boolean; payment: PaymentRequest; onClose: () => void; onUploaded: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [bankRef, setBankRef] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<string | null>(null);

    const handleFile = (f: File | null) => {
        setFile(f);
        setError("");
        if (f && f.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(f);
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) { setError("Please select a file."); return; }
        setError("");
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            if (bankRef.trim()) formData.append("bank_transfer_reference", bankRef.trim());
            const res = await fetch(`/api/employer/payments/${payment.id}/upload-proof`, {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            if (!res.ok) { setError(json.error ?? "Upload failed"); return; }
            onUploaded();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Payment Slip</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2 text-sm">
                    {error && <div className="text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</div>}

                    <div className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
                        <div className="font-medium">{payment.payment_types?.label}</div>
                        <div className="text-xl font-bold">{fmtAmount(Number(payment.amount), payment.currency)}</div>
                        {payment.due_date && <div className="text-xs text-muted-foreground">Due {fmtDate(payment.due_date)}</div>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Bank Transfer Reference (optional)</Label>
                        <Input
                            placeholder="e.g. TXN12345678"
                            value={bankRef}
                            onChange={(e) => setBankRef(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Payment Slip *</Label>
                        <div
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null); }}
                            onClick={() => document.getElementById("proof-file-input")?.click()}
                        >
                            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            {file ? (
                                <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">Drop file here or click to browse</p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP — max 10 MB</p>
                                </>
                            )}
                        </div>
                        <input
                            id="proof-file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    {preview && (
                        <img src={preview} alt="preview" className="rounded border max-h-48 object-contain w-full" />
                    )}
                    {file && file.type === "application/pdf" && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground rounded border px-3 py-2">
                            <FileText className="h-4 w-4" />{file.name}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !file}>
                        {submitting ? "Uploading…" : "Submit Proof"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Payment Detail Dialog ─────────────────────────────────────────────────

function PaymentDetailDialog({ open, payment, onClose, onUpload }: {
    open: boolean; payment: PaymentRequest; onClose: () => void; onUpload: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Payment Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline">{payment.payment_types?.label}</Badge></div>
                        <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={payment.status} /></div>
                        <div><span className="text-muted-foreground">Amount:</span> <strong>{fmtAmount(Number(payment.amount), payment.currency)}</strong></div>
                        <div><span className="text-muted-foreground">Due:</span> {payment.due_date ? fmtDate(payment.due_date) : "—"}</div>
                        <div className="col-span-2"><span className="text-muted-foreground">Description:</span> {payment.description}</div>
                        {payment.bank_transfer_reference && (
                            <div className="col-span-2"><span className="text-muted-foreground">Bank Ref:</span> <span className="font-mono">{payment.bank_transfer_reference}</span></div>
                        )}
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold mb-3">Submitted Proofs ({payment.payment_proofs?.length ?? 0})</h4>
                        {!payment.payment_proofs?.length ? (
                            <p className="text-muted-foreground">No proofs submitted yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {[...payment.payment_proofs].sort((a, b) =>
                                    new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
                                ).map((proof) => (
                                    <div key={proof.id} className="rounded-lg border p-3 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <a href={proof.file_url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-blue-600 hover:underline font-medium">
                                                <FileText className="h-4 w-4" />{proof.file_name}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                            <Badge variant={proof.status === "approved" ? "default" : proof.status === "rejected" ? "destructive" : "secondary"}>
                                                {proof.status}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Uploaded {fmtDate(proof.uploaded_at)}</div>
                                        {proof.review_notes && (
                                            <div className="text-xs italic text-muted-foreground">Note: {proof.review_notes}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    {(payment.status === "pending_payment" || payment.status === "rejected") && (
                        <Button onClick={() => { onClose(); onUpload(); }}>
                            <Upload className="h-4 w-4 mr-1" />Upload Slip
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
