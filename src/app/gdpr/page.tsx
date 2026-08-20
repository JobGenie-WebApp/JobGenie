import type { Metadata } from 'next';
import { Globe } from 'lucide-react';
import { PublicPageHero, PublicPageShell } from '@/components/public/PublicPageShell';
import { LegalNotice, LegalSection, legalBody } from '@/components/public/LegalPage';

export const metadata: Metadata = {
  title: 'GDPR | JobGenie',
  description: 'How JobGenie supports the rights of data subjects under the GDPR.',
};

export default function GdprPage() {
  return (
    <PublicPageShell>
      <PublicPageHero
        description="How we support the rights of data subjects under the EU General Data Protection Regulation."
        eyebrow="LEGAL"
        icon={Globe}
        title="GDPR"
      />
      <div className="jg-container py-14">
        <div className={legalBody}>
          <LegalNotice />

          <LegalSection title="Scope">
            <p>
              Where the GDPR applies to your personal data, the rights below are available to you in addition
              to everything described in our{' '}
              <a className="font-semibold text-[var(--jg-green)] hover:underline" href="/privacy">
                Privacy Policy
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="Your rights">
            <p>
              Access to the data we hold about you, correction of anything inaccurate, erasure, restriction of
              processing, portability of the data you provided, and the right to object to processing based on
              legitimate interests.
            </p>
          </LegalSection>

          <LegalSection title="Lawful basis">
            <p>
              We process data to perform our contract with you as a platform user, to meet legal obligations,
              and on the basis of consent for optional cookies and marketing communications.
            </p>
          </LegalSection>

          <LegalSection title="Making a request">
            <p>
              Send GDPR requests through our{' '}
              <a className="font-semibold text-[var(--jg-green)] hover:underline" href="/contact">
                contact page
              </a>
              . We respond within one month and may ask you to verify your identity first.
            </p>
          </LegalSection>
        </div>
      </div>
    </PublicPageShell>
  );
}
