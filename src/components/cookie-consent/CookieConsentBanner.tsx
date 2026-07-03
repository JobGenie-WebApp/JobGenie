"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/providers/CookieConsentProvider";

export function CookieConsentBanner() {
  const { isLoaded, showBanner, acceptAll, rejectAll, openPreferences } =
    useCookieConsent();

  return (
    <AnimatePresence>
      {isLoaded && showBanner && (
        <motion.div
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
          className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 hidden shrink-0 rounded-lg bg-primary/10 p-2 text-primary sm:inline-flex">
                <Cookie className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  We value your privacy
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  We use cookies to enhance your experience, analyze site usage, and
                  assist in our efforts. By clicking &ldquo;Accept All&rdquo;, you consent
                  to our use of cookies.{" "}
                  <Link
                    href="/cookie-policy"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Learn more
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto lg:shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={openPreferences}
                className="sm:min-w-[110px]"
              >
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="sm:min-w-[130px]"
              >
                Necessary Only
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={acceptAll}
                className="sm:min-w-[110px]"
              >
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
