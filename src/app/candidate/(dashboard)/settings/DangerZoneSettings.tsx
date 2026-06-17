"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function DangerZoneSettings() {
    const [deleting, setDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            const res = await fetch("/api/candidate/settings/delete-account", { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                const { createClient } = await import("@/lib/supabase/client");
                await createClient().auth.signOut();
                window.location.href = "/login";
            } else {
                toast.error(data.error || "Failed to delete account.");
            }
        } catch { toast.error("Something went wrong."); }
        finally { setDeleting(false); }
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

            {/* Delete account card */}
            <div className="rounded-2xl border border-destructive/20 bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Delete My Account</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Permanently delete your candidate account and all associated data. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={deleting} className="shrink-0">
                                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete Account"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete your candidate account, your profile, resumes, and all application history. You will be signed out immediately. <span className="font-medium text-foreground">This action cannot be undone.</span>
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
        </div>
    );
}
