"use client";

import { useState } from "react";
import { Trash2, Building2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function DangerZoneSettings({ isSuperAdmin }: { isSuperAdmin: boolean }) {
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deactivatingCompany, setDeactivatingCompany] = useState(false);

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            const res = await fetch("/api/employer/settings/delete-account", { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                const { createClient } = await import("@/lib/supabase/client");
                await createClient().auth.signOut();
                window.location.href = "/login";
            } else if (data.code === "LAST_SUPER_ADMIN") {
                toast.error("You are the only super admin. Deactivate the company or transfer ownership first.");
            } else {
                toast.error(data.error || "Failed to delete account.");
            }
        } catch { toast.error("Something went wrong."); }
        finally { setDeletingAccount(false); }
    };

    const handleDeactivateCompany = async () => {
        setDeactivatingCompany(true);
        try {
            const res = await fetch("/api/employer/settings/deactivate-company", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast.success("Company deactivated.");
                const { createClient } = await import("@/lib/supabase/client");
                await createClient().auth.signOut();
                window.location.href = "/login";
            } else {
                toast.error(data.error || "Failed to deactivate company.");
            }
        } catch { toast.error("Something went wrong."); }
        finally { setDeactivatingCompany(false); }
    };

    return (
        <div className="space-y-4">
            {/* Warning banner */}
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                    Actions in this section are permanent and cannot be undone. Proceed with caution.
                </p>
            </div>

            {/* Delete My Account */}
            <div className="rounded-2xl border border-destructive/20 bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Delete My Account</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Permanently delete your employer account. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={deletingAccount} className="shrink-0">
                                {deletingAccount ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete Account"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete your employer account and remove all your data. You will be signed out immediately. <span className="font-medium text-foreground">This action cannot be undone.</span>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAccount}
                                    className="bg-destructive hover:bg-destructive/90">
                                    Yes, delete my account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Deactivate Company — super admin only */}
            {isSuperAdmin && (
                <div className="rounded-2xl border border-destructive/20 bg-card p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                                <Building2 className="h-4 w-4 text-destructive" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Deactivate Company</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Hide company profile, revoke all sub-admin access, and unpublish all active job posts.
                                </p>
                            </div>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={deactivatingCompany} className="shrink-0">
                                    {deactivatingCompany ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Deactivate"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Deactivate your company?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will hide your company profile from candidates, revoke all sub-admin access, and unpublish active job posts. You will be signed out. <span className="font-medium text-foreground">This action affects your entire company.</span>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeactivateCompany}
                                        className="bg-destructive hover:bg-destructive/90">
                                        Yes, deactivate company
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}
        </div>
    );
}
