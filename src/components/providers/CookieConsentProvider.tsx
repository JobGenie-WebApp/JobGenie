"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type ConsentChoice,
  type ConsentState,
  acceptAllChoice,
  readConsent,
  rejectAllChoice,
  writeConsent,
} from "@/lib/cookie-consent";

/** Custom window event any component can dispatch to reopen the modal. */
export const OPEN_COOKIE_PREFERENCES_EVENT = "open-cookie-preferences";

interface CookieConsentContextValue {
  consent: ConsentState | null;
  /** True once the cookie has been read (avoids SSR/hydration flashes). */
  isLoaded: boolean;
  showBanner: boolean;
  showPreferences: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (choice: ConsentChoice) => void;
  openPreferences: () => void;
  closePreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Read existing consent on mount; show the banner if no valid choice exists.
  useEffect(() => {
    const existing = readConsent();
    setConsent(existing);
    setShowBanner(existing === null);
    setIsLoaded(true);
  }, []);

  const openPreferences = useCallback(() => setShowPreferences(true), []);
  const closePreferences = useCallback(() => setShowPreferences(false), []);

  // Let any part of the app (e.g. Cookie Policy page, footer button) reopen it.
  useEffect(() => {
    const handler = () => setShowPreferences(true);
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handler);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handler);
  }, []);

  const commit = useCallback((choice: ConsentChoice) => {
    const state = writeConsent(choice);
    setConsent(state);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  const acceptAll = useCallback(() => commit(acceptAllChoice()), [commit]);
  const rejectAll = useCallback(() => commit(rejectAllChoice()), [commit]);
  const savePreferences = useCallback((choice: ConsentChoice) => commit(choice), [commit]);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      isLoaded,
      showBanner,
      showPreferences,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
    }),
    [
      consent,
      isLoaded,
      showBanner,
      showPreferences,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return ctx;
}
