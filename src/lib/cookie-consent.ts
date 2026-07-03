/**
 * Cookie consent core logic.
 *
 * Consent is stored purely in a first-party cookie (no DB, no localStorage) so
 * it can be read on both the client and — if ever needed — the server.
 *
 * Categories:
 *  - necessary : always on (auth/session, sidebar state). Cannot be turned off.
 *  - analytics : Vercel Analytics + Speed Insights.
 *  - marketing : future-ready placeholder (no scripts gated yet).
 */

export const CONSENT_COOKIE_NAME = "jobgenie-cookie-consent";
export const CONSENT_VERSION = 1;
/** 1 year, in seconds. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export interface ConsentState {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** Unix ms when the choice was recorded. */
  timestamp: number;
}

/** Optional categories the user can toggle (necessary is always granted). */
export type ConsentChoice = Pick<ConsentState, "analytics" | "marketing">;

export const acceptAllChoice = (): ConsentChoice => ({
  analytics: true,
  marketing: true,
});

export const rejectAllChoice = (): ConsentChoice => ({
  analytics: false,
  marketing: false,
});

function makeState(choice: ConsentChoice): ConsentState {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    timestamp: Date.now(),
  };
}

/**
 * Read the consent cookie. Returns null when absent, unparseable, or from an
 * older version (so we can re-prompt when the policy changes).
 */
export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!match) return null;

  try {
    const raw = decodeURIComponent(match.slice(CONSENT_COOKIE_NAME.length + 1));
    const parsed = JSON.parse(raw) as Partial<ConsentState>;

    if (parsed.version !== CONSENT_VERSION) return null;

    return {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : Date.now(),
    };
  } catch {
    return null;
  }
}

/** Persist the given choice to the consent cookie and return the stored state. */
export function writeConsent(choice: ConsentChoice): ConsentState {
  const state = makeState(choice);

  if (typeof document !== "undefined") {
    const value = encodeURIComponent(JSON.stringify(state));
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
  }

  return state;
}
