"use client";

import { Button } from "@/components/ui/button";
import { OPEN_COOKIE_PREFERENCES_EVENT } from "@/components/providers/CookieConsentProvider";

/**
 * Reopens the cookie preferences modal from anywhere (e.g. the Cookie Policy
 * page or footer) via a window custom event, so the button can live inside a
 * server component without needing the consent context directly.
 */
export function CookieSettingsButton({
  children = "Manage Cookie Preferences",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      className={className}
      onClick={() =>
        window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT))
      }
    >
      {children}
    </Button>
  );
}
