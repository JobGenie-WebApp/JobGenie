import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-consent/CookieSettingsButton";

export const metadata: Metadata = {
  title: "Cookie Policy — JobGenie",
  description:
    "How JobGenie uses cookies, the categories of cookies we use, and how to manage your preferences.",
};

const categories = [
  {
    name: "Strictly necessary",
    consent: "Always active",
    purpose:
      "Authentication and session management (Supabase), security, and remembering interface state such as the sidebar. The site cannot function without these.",
  },
  {
    name: "Analytics",
    consent: "Optional — off until you accept",
    purpose:
      "Vercel Analytics and Speed Insights, which give us aggregated, anonymous data about how the site is used so we can improve performance and usability.",
  },
  {
    name: "Marketing",
    consent: "Optional — off until you accept",
    purpose:
      "Reserved for delivering more relevant content and measuring campaign performance. No marketing cookies are currently active.",
  },
];

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Cookie Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Cookies are small text files stored on your device when you visit a website.
          They help the site work correctly and let us understand how it is being used.
          JobGenie only stores non-essential cookies (such as analytics) after you have
          given consent.
        </p>
        <p>
          You can change or withdraw your consent at any time using the button below or
          the &ldquo;Customize&rdquo; option in the cookie banner.
        </p>
      </section>

      <section className="mt-10" id="gdpr">
        <h2 className="text-xl font-semibold text-foreground">
          Categories of cookies we use
        </h2>
        <div className="mt-4 space-y-3">
          {categories.map((cat) => (
            <div key={cat.name} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {cat.consent}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {cat.purpose}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Managing your preferences</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Use the button below to review or update which cookie categories you allow. You
          can also control cookies through your browser settings, though disabling
          necessary cookies may break parts of the site.
        </p>
        <div className="mt-4">
          <CookieSettingsButton />
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        For more information, see our{" "}
        <Link
          href="/privacy"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
