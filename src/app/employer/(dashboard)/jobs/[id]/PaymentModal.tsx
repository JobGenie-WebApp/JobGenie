"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface BankDetails {
    id: string; bank_name: string; account_name: string; account_number: string;
    branch: string | null; bank_code: string | null; swift_code: string | null;
}

type Mode = "publish" | "extend";

function fmtAmount(amount: number, currency = "LKR") {
    return `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

// Shared modal for paying to publish or extend a job advertisement.
// Flow: create the payment request (request-payment / extend), then upload the
// payment slip. The job then goes to "under_review" and is published by MIS on
// approval (same gating as before — this only replaces the redirect with a modal).
export function PaymentModal({
    open, mode, jobId, validityDays, onClose, onSuccess,
}: {
    open: boolean;
    mode: Mode;
    jobId: string;
    validityDays?: number;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const paymentType = mode === "publish" ? "JOB_AD_PUBLISH" : "JOB_AD_EXTEND";
    const title = mode === "publish" ? "Publish Advertisement" : "Extend Advertisement";
    const submitLabel = mode === "publish" ? "Save & Publish" : "Save & Extend";

    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState<number | null>(null);
    const [currency, setCurrency] = useState("LKR");
    const [priceConfigured, setPriceConfigured] = useState(true);
    const [banks, setBanks] = useState<BankDetails[]>([]);
    const [method, setMethod] = useState<"bank_transfer" | "online_payment">("bank_transfer");
    const [bankRef, setBankRef] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showQR, setShowQR] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [quoteRes, bankRes] = await Promise.all([
                    fetch(`/api/employer/payments/quote?type=${paymentType}`),
                    fetch(`/api/employer/bank-details`),
                ]);
                const quote = await quoteRes.json();
                const bankJson = await bankRes.json();
                if (cancelled) return;
                if (quoteRes.ok) {
                    setAmount(quote.data?.amount ?? 0);
                    setCurrency(quote.data?.currency ?? "LKR");
                    setPriceConfigured(quote.data?.configured ?? false);
                }
                if (bankRes.ok) setBanks(bankJson.data ?? []);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [paymentType]);

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

    async function handleSubmit() {
        if (!file) { setError("Please attach the payment slip."); return; }
        setError("");
        setSubmitting(true);
        try {
            // 1. Create (or reuse) the payment request.
            const createRes = await fetch(
                `/api/employer/jobs/${jobId}/${mode === "publish" ? "request-payment" : "extend"}`,
                {
                    method: "POST",
                    headers: mode === "extend" ? { "Content-Type": "application/json" } : undefined,
                    body: mode === "extend" ? JSON.stringify({ validity_days: validityDays ?? 30 }) : undefined,
                }
            );
            const createJson = await createRes.json();
            // 201 → new request; 409 → an active request already exists (reuse its id).
            const prId: string | undefined = createJson.payment_request_id;
            if (!createRes.ok && !(createRes.status === 409 && prId)) {
                setError(createJson.error ?? "Failed to create payment request");
                return;
            }
            if (!prId) { setError("Could not resolve the payment request"); return; }

            // 2. Upload the payment slip.
            const formData = new FormData();
            formData.append("file", file);
            formData.append("payment_method", method);
            if (bankRef.trim()) formData.append("bank_transfer_reference", bankRef.trim());
            const uploadRes = await fetch(`/api/employer/payments/${prId}/upload-proof`, {
                method: "POST",
                body: formData,
            });
            const uploadJson = await uploadRes.json();
            if (!uploadRes.ok) { setError(uploadJson.error ?? "Upload failed"); return; }

            toast.success("Payment slip submitted. Awaiting MIS confirmation.");
            onSuccess();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 py-2 text-sm">
                        {error && <div className="text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</div>}

                        {/* Amount */}
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Amount due</div>
                            <div className="text-2xl font-bold">{priceConfigured && amount != null ? fmtAmount(amount, currency) : "—"}</div>
                            {mode === "extend" && validityDays && (
                                <div className="text-xs text-muted-foreground mt-0.5">Extends the advertisement by {validityDays} days</div>
                            )}
                        </div>

                        {!priceConfigured && (
                            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                Pricing has not been set yet. Please contact JobGenie before submitting payment.
                            </div>
                        )}

                        {/* Payment method */}
                        <div className="space-y-2">
                            <Label>Payment method</Label>
                            <RadioGroup
                                value={method}
                                onValueChange={(v) => setMethod(v as "bank_transfer" | "online_payment")}
                                className="flex gap-4"
                            >
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <RadioGroupItem value="bank_transfer" id="pm-bank" />
                                    <span>Bank transfer</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                                    <RadioGroupItem value="online_payment" id="pm-online" disabled />
                                    <span>Online payment</span>
                                    <span className="text-xs text-muted-foreground italic">(Coming soon)</span>
                                </label>
                            </RadioGroup>
                        </div>

                        {/* Bank details */}
                        {method === "bank_transfer" && banks.length === 0 && (
                            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                Bank account details are not available yet. Please contact JobGenie for payment instructions before submitting.
                            </div>
                        )}
                        {method === "bank_transfer" && banks.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pay to any of these accounts:</p>
                                    <div className="grid gap-3">
                                        {banks.map((bank) => {
                                            const qrValue = [
                                                `Bank: ${bank.bank_name}`,
                                                `Account Name: ${bank.account_name}`,
                                                `Account No: ${bank.account_number}`,
                                                bank.branch ? `Branch: ${bank.branch}` : null,
                                                amount != null ? `Amount: ${fmtAmount(amount, currency)}` : null,
                                            ].filter(Boolean).join("\n");
                                            return (
                                                <div key={bank.id} className="rounded-lg border bg-card p-3 flex items-start justify-between gap-3">
                                                    <div className="space-y-2 min-w-0">
                                                        <div className="text-sm font-semibold">{bank.bank_name}</div>
                                                        <div className="text-sm text-muted-foreground space-y-0.5">
                                                            <div>{bank.account_name}</div>
                                                            <div className="font-mono font-medium text-foreground break-all">{bank.account_number}</div>
                                                            {bank.branch && <div className="text-xs">{bank.branch}</div>}
                                                            {bank.bank_code && <div className="text-xs">Code: {bank.bank_code}</div>}
                                                            {bank.swift_code && <div className="text-xs">SWIFT: {bank.swift_code}</div>}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowQR(showQR === bank.id ? null : bank.id)}
                                                            className="text-xs text-primary hover:underline"
                                                        >
                                                            {showQR === bank.id ? "Hide QR" : "Show QR Code"}
                                                        </button>
                                                    </div>
                                                    {showQR === bank.id && (
                                                        <div className="shrink-0">
                                                            <QRCode value={qrValue} size={120} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Bank reference */}
                        <div className="space-y-1.5">
                            <Label>Payment / transfer reference (optional)</Label>
                            <Input placeholder="e.g. TXN12345678" value={bankRef} onChange={(e) => setBankRef(e.target.value)} />
                        </div>

                        {/* File */}
                        <div className="space-y-1.5">
                            <Label>Payment slip *</Label>
                            <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null); }}
                                onClick={() => document.getElementById("pay-modal-file")?.click()}
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
                                id="pay-modal-file"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                            />
                        </div>

                        {preview && <img src={preview} alt="preview" className="rounded border max-h-48 object-contain w-full" />}
                        {file && file.type === "application/pdf" && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground rounded border px-3 py-2">
                                <FileText className="h-4 w-4" />{file.name}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || loading || !file || !priceConfigured}>
                        {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Submitting…</> : submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
