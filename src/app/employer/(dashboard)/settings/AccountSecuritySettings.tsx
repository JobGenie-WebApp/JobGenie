"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Eye, EyeOff, KeyRound, Loader2, Mail, CalendarDays,
    ShieldCheck, LogOut, Copy, Check, User, BadgeCheck,
    Monitor, Smartphone, Tablet, Globe, Clock, RefreshCw,
    Trash2, AlertTriangle, Building2, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountInfo {
    email: string;
    created_at: string;
    approval_status: string;
    is_super_admin: boolean;
    company_name: string | null;
}

interface SessionInfo {
    id: string;
    isCurrent: boolean;
    browser: string;
    os: string;
    device: "Desktop" | "Mobile" | "Tablet";
    ip: string;
    last_active: string;
    created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PASSWORD_RULES = "Min 8 characters — uppercase, lowercase, number & special character.";

function formatDate(iso: string) {
    try { return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return "—"; }
}

function timeAgo(iso: string): string {
    try {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days}d ago`;
        return formatDate(iso);
    } catch { return "—"; }
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    approved: { label: "Approved", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    pending: { label: "Pending Approval", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const DeviceIcon = ({ device, className }: { device: string; className?: string }) => {
    if (device === "Mobile") return <Smartphone className={className} />;
    if (device === "Tablet") return <Tablet className={className} />;
    return <Monitor className={className} />;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PasswordInput({ id, name, label, hint, value, onChange, disabled }: {
    id: string; name: string; label: string; hint?: string;
    value: string; onChange: (v: string) => void; disabled: boolean;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
            <div className="relative">
                <Input id={id} name={name} type={show ? "text" : "password"}
                    value={value} onChange={(e) => onChange(e.target.value)}
                    disabled={disabled} className="pr-10"
                    autoComplete={name === "currentPassword" ? "current-password" : "new-password"} />
                <button type="button" tabIndex={-1} disabled={disabled}
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={show ? "Hide" : "Show"}>
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

// ─── Account Info Card ────────────────────────────────────────────────────────

function AccountInfoCard({ email, createdAt, approvalStatus, companyName, isSuperAdmin }: {
    email: string; createdAt: string; approvalStatus: string; companyName: string | null; isSuperAdmin: boolean;
}) {
    const [copied, setCopied] = useState(false);

    const copyEmail = async () => {
        try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 2000); }
        catch { toast.error("Failed to copy."); }
    };

    const statusKey = approvalStatus ?? "pending";
    const status = STATUS_MAP[statusKey] ?? { label: statusKey, color: "bg-muted text-muted-foreground border-border" };

    return (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">Account Information</h3>
                    <p className="text-xs text-muted-foreground">Your account details</p>
                </div>
            </div>

            <div className="space-y-2.5">
                {/* Email */}
                <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground">Email address</p>
                            <p className="text-sm font-medium truncate">{email}</p>
                        </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyEmail}>
                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                </div>

                {/* Company */}
                {companyName && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-4 py-3">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-[11px] text-muted-foreground">Company</p>
                            <p className="text-sm font-medium">{companyName}</p>
                        </div>
                    </div>
                )}

                {/* Role */}
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-4 py-3">
                    <Crown className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-2">
                        <div>
                            <p className="text-[11px] text-muted-foreground">Role</p>
                            <p className="text-sm font-medium">Employer</p>
                        </div>
                        {isSuperAdmin && (
                            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary leading-none">
                                Super Admin
                            </span>
                        )}
                    </div>
                </div>

                {/* Member since */}
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-4 py-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                        <p className="text-[11px] text-muted-foreground">Member since</p>
                        <p className="text-sm font-medium">{createdAt ? formatDate(createdAt) : "—"}</p>
                    </div>
                </div>

                {/* Company status */}
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-4 py-3">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                        <p className="text-[11px] text-muted-foreground">Company status</p>
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mt-0.5", status.color)}>
                            {status.label}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Active Sessions Card ─────────────────────────────────────────────────────

function ActiveSessionsCard() {
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [signingOutAll, setSigningOutAll] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/sessions");
            const data = await res.json();
            if (data.success) setSessions(data.sessions ?? []);
            else toast.error(data.error || "Failed to load sessions.");
        } catch { toast.error("Failed to load sessions."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const revokeSession = async (id: string) => {
        setRevoking(id);
        try {
            const res = await fetch(`/api/user/sessions/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) { toast.success("Session revoked."); setSessions(s => s.filter(x => x.id !== id)); }
            else toast.error(data.error || "Failed to revoke session.");
        } catch { toast.error("Failed to revoke session."); }
        finally { setRevoking(null); }
    };

    const signOutAll = async () => {
        setSigningOutAll(true);
        try {
            const res = await fetch("/api/user/sign-out-all", { method: "POST" });
            const data = await res.json();
            if (data.success) { toast.success("Signed out of all other devices."); await load(); }
            else toast.error(data.error || "Failed.");
        } catch { toast.error("Something went wrong."); }
        finally { setSigningOutAll(false); }
    };

    const otherCount = sessions.filter(s => !s.isCurrent).length;

    return (
        <div className="rounded-2xl border bg-card p-6 space-y-4 flex flex-col">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Active Sessions</h3>
                        <p className="text-xs text-muted-foreground">
                            {loading ? "Loading…" : `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={load} disabled={loading} aria-label="Refresh sessions">
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                </Button>
            </div>

            {!loading && sessions.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {otherCount > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={signingOutAll}
                                    className="gap-1.5 h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive flex-1">
                                    {signingOutAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                                    Sign out others ({otherCount})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Sign out {otherCount} other device{otherCount !== 1 ? "s" : ""}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        All other sessions will be revoked immediately. Your current session stays active.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={signOutAll} className="bg-destructive hover:bg-destructive/90">
                                        Sign out others
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={signingOutAll}
                                className="gap-1.5 h-8 text-xs border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground flex-1">
                                <LogOut className="h-3 w-3" />
                                Sign out all
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Sign out of all sessions?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Every active session — including this one — will be signed out. You will be redirected to the login page.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={async () => {
                                        setSigningOutAll(true);
                                        try {
                                            await fetch("/api/user/sign-out-all", { method: "POST" });
                                            const { createClient } = await import("@/lib/supabase/client");
                                            const supabase = createClient();
                                            await supabase.auth.signOut();
                                            window.location.href = "/login";
                                        } catch { toast.error("Something went wrong."); setSigningOutAll(false); }
                                    }}
                                    className="bg-destructive hover:bg-destructive/90">
                                    Sign out all sessions
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px] pr-0.5">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 animate-pulse">
                            <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 w-32 rounded bg-muted" />
                                <div className="h-3 w-44 rounded bg-muted" />
                            </div>
                        </div>
                    ))
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <AlertTriangle className="h-7 w-7 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No sessions found</p>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div key={session.id} className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                            session.isCurrent
                                ? "border-primary/30 bg-primary/5"
                                : "border-border bg-muted/20 hover:bg-muted/40"
                        )}>
                            <div className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                session.isCurrent ? "bg-primary/10" : "bg-muted"
                            )}>
                                <DeviceIcon device={session.device}
                                    className={cn("h-4 w-4", session.isCurrent ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-semibold truncate">{session.browser}</span>
                                    {session.isCurrent && (
                                        <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-1.5 py-px text-[10px] font-medium text-primary leading-none">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <Monitor className="h-2.5 w-2.5 shrink-0" />{session.os}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Globe className="h-2.5 w-2.5 shrink-0" />{session.ip}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Clock className="h-2.5 w-2.5 shrink-0" />{timeAgo(session.last_active)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon"
                                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        disabled={revoking === session.id}
                                        aria-label="Sign out this session">
                                        {revoking === session.id
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <LogOut className="h-3.5 w-3.5" />}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            {session.isCurrent ? "Sign out of this device?" : "Sign out this session?"}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            <span className="font-medium">{session.browser}</span> on <span className="font-medium">{session.os}</span> ({session.ip}) will be signed out immediately.
                                            {session.isCurrent && " You will be redirected to the login page."}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive hover:bg-destructive/90"
                                            onClick={async () => {
                                                if (session.isCurrent) {
                                                    setRevoking(session.id);
                                                    try {
                                                        const { createClient } = await import("@/lib/supabase/client");
                                                        await createClient().auth.signOut();
                                                        window.location.href = "/login";
                                                    } catch { toast.error("Failed to sign out."); setRevoking(null); }
                                                } else {
                                                    revokeSession(session.id);
                                                }
                                            }}>
                                            Sign out
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Change Password ──────────────────────────────────────────────────────────

function ChangePasswordCard() {
    const [current, setCurrent] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!current || !newPw || !confirm) { toast.error("All fields are required."); return; }
        if (newPw !== confirm) { toast.error("Passwords do not match."); return; }
        setSaving(true);
        try {
            const res = await fetch("/api/user/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: newPw, confirmPassword: confirm }) });
            const data = await res.json();
            if (data.error) toast.error(data.error);
            else { toast.success("Password changed successfully."); setCurrent(""); setNewPw(""); setConfirm(""); }
        } catch { toast.error("Something went wrong."); }
        finally { setSaving(false); }
    };

    return (
        <div className="rounded-2xl border bg-card p-6 space-y-5 lg:col-span-2">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">Change Password</h3>
                    <p className="text-xs text-muted-foreground">Update your account password</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PasswordInput id="currentPassword" name="currentPassword" label="Current Password" value={current} onChange={setCurrent} disabled={saving} />
                    <PasswordInput id="newPassword" name="newPassword" label="New Password" hint={PASSWORD_RULES} value={newPw} onChange={setNewPw} disabled={saving} />
                    <PasswordInput id="confirmPassword" name="confirmPassword" label="Confirm New Password" value={confirm} onChange={setConfirm} disabled={saving} />
                </div>
                <Button type="submit" disabled={saving} className="mt-5">
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : "Update Password"}
                </Button>
            </form>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AccountSecuritySettings({ email, createdAt, approvalStatus, companyName, isSuperAdmin }: {
    email: string; createdAt: string; approvalStatus: string; companyName: string | null; isSuperAdmin: boolean;
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AccountInfoCard email={email} createdAt={createdAt} approvalStatus={approvalStatus} companyName={companyName} isSuperAdmin={isSuperAdmin} />
            <ActiveSessionsCard />
            <ChangePasswordCard />
        </div>
    );
}
