import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { PublicPageHero, PublicPageShell } from '@/components/public/PublicPageShell';
import { LegalNotice, LegalSection, legalBody } from '@/components/public/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | JobGenie',
  description: 'How JobGenie collects, uses, stores and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <PublicPageHero
        description="How we collect, use, store and protect the personal data you share with JobGenie."
        eyebrow="LEGAL"
        icon={ShieldCheck}
        title="Privacy Policy"
      />
      <div className="jg-container py-14">
        <div className={legalBody}>
          <LegalNotice />

          <LegalSection title="Who we are">
            <p>
              JobGenie is a recruitment platform operated by FutureFit PVT LTD. We connect candidates with
              employers, which means we process personal data for both groups.
            </p>
          </LegalSection>

          <LegalSection title="What we collect">
            <p>
              Account details you give us when you sign up, the contents of any CV or company profile you
              upload, the applications and invitations you send or receive, and technical data such as
              cookies and session information needed to keep you signed in.
            </p>
          </LegalSection>

          <LegalSection title="How we use it">
            <p>
              To operate your account, match candidates to roles, let employers review applications, send
              service notifications, and to keep the platform secure and free of fraudulent profiles.
            </p>
          </LegalSection>

          <LegalSection title="Your rights">
            <p>
              You can request access to your data, ask us to correct or delete it, or withdraw consent where
              processing relies on it. Cookie preferences can be changed at any time from our{' '}
              <a className="font-semibold text-[var(--jg-green)] hover:underline" href="/cookie-policy">
                Cookie Policy
              </a>{' '}
              page.
            </p>
          </LegalSection>

          <LegalSection title="Contact">
            <p>
              For any privacy question or to exercise the rights above, reach us through our{' '}
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
