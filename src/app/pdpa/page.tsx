import type { Metadata } from 'next';
import { FileLock2 } from 'lucide-react';
import { PublicPageHero, PublicPageShell } from '@/components/public/PublicPageShell';
import { LegalNotice, LegalSection, legalBody } from '@/components/public/LegalPage';

export const metadata: Metadata = {
  title: 'PDPA | JobGenie',
  description: "How JobGenie complies with Sri Lanka's Personal Data Protection Act.",
};

export default function PdpaPage() {
  return (
    <PublicPageShell>
      <PublicPageHero
        description="How we handle personal data under Sri Lanka's Personal Data Protection Act No. 9 of 2022."
        eyebrow="LEGAL"
        icon={FileLock2}
        title="PDPA"
      />
      <div className="jg-container py-14">
        <div className={legalBody}>
          <LegalNotice />

          <LegalSection title="Our role">
            <p>
              JobGenie acts as a data controller for the accounts we host. Employers reviewing candidate
              applications act as controllers for their own hiring decisions.
            </p>
          </LegalSection>

          <LegalSection title="Your rights">
            <p>
              You may request access to your personal data, ask for corrections, request erasure, withdraw
              consent, and object to processing. These mirror the rights described in our{' '}
              <a className="font-semibold text-[var(--jg-green)] hover:underline" href="/privacy">
                Privacy Policy
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="Retention">
            <p>
              Profiles and applications are kept for as long as your account is active. When you delete your
              account we remove or anonymise the associated personal data, except where we must retain records
              to meet a legal obligation.
            </p>
          </LegalSection>

          <LegalSection title="Contact">
            <p>
              PDPA requests and complaints can be raised through our{' '}
              <a className="font-semibold text-[var(--jg-green)] hover:underline" href="/contact">
                contact page
              </a>
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </PublicPageShell>
  );
}
