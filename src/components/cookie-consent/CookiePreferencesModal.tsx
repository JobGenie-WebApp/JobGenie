"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/providers/CookieConsentProvider";
import { acceptAllChoice, rejectAllChoice } from "@/lib/cookie-consent";

interface CategoryRowProps {
  title: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (value: boolean) => void;
}

function CategoryRow({ title, description, checked, locked, onChange }: CategoryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">
        {locked ? (
          <span className="text-xs font-medium text-muted-foreground">Always on</span>
        ) : (
          <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
        )}
      </div>
    </div>
  );
}

export function CookiePreferencesModal() {
  const { consent, showPreferences, closePreferences, savePreferences } =
    useCookieConsent();

  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Sync toggles with the current stored consent whenever the modal opens.
  useEffect(() => {
    if (showPreferences) {
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
    }
  }, [showPreferences, consent]);

  return (
    <Dialog open={showPreferences} onOpenChange={(open) => !open && closePreferences()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie preferences</DialogTitle>
          <DialogDescription>
            Manage how JobGenie uses cookies. Necessary cookies keep the site working
            and cannot be turned off.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <CategoryRow
            title="Strictly necessary"
            description="Required for authentication, security, and core features such as saving your session."
            checked
            locked
          />
          <CategoryRow
            title="Analytics"
            description="Helps us understand how the site is used (Vercel Analytics & Speed Insights) so we can improve it."
            checked={analytics}
            onChange={setAnalytics}
          />
          <CategoryRow
            title="Marketing"
            description="Used to deliver more relevant content and measure campaign performance. Not currently active."
            checked={marketing}
            onChange={setMarketing}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => savePreferences(rejectAllChoice())}
          >
            Reject All
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => savePreferences(acceptAllChoice())}
            >
              Accept All
            </Button>
            <Button
              size="sm"
              onClick={() => savePreferences({ analytics, marketing })}
            >
              Save Preferences
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
