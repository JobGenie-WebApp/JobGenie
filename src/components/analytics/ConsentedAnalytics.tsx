"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useCookieConsent } from "@/components/providers/CookieConsentProvider";

/**
 * Only mounts Vercel Analytics + Speed Insights once the user has granted
 * analytics consent. Until then the scripts are never loaded, so no analytics
 * requests fire before consent (GDPR/ePrivacy compliant).
 */
export function ConsentedAnalytics() {
  const { isLoaded, consent } = useCookieConsent();

  if (!isLoaded || !consent?.analytics) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
