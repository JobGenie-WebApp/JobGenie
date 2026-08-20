import type { Metadata } from 'next';
import { ScrollText } from 'lucide-react';
import { PublicPageHero, PublicPageShell } from '@/components/public/PublicPageShell';
import { LegalNotice, LegalSection, legalBody } from '@/components/public/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service | JobGenie',
  description: 'The terms that govern your use of the JobGenie platform.',
};

export default function TermsPage() {
  return (
    <PublicPageShell>
      <PublicPageHero
        description="The rules that govern how candidates and employers use the JobGenie platform."
        eyebrow="LEGAL"
        icon={ScrollText}
        title="Terms of Service"
      />
      <div className="jg-container py-14">
        <div className={legalBody}>
          <LegalNotice />

          <LegalSection title="Using JobGenie">
            <p>
              You need an account to apply for roles or post them. You are responsible for the accuracy of
              what you publish and for keeping your login credentials secure.
            </p>
          </LegalSection>

          <LegalSection title="Candidate accounts">
            <p>
              Your profile and CV must describe you truthfully. You control which employers can progress your
              application, and you can withdraw an application at any time.
            </p>
          </LegalSection>

          <LegalSection title="Employer accounts">
            <p>
              Company profiles are verified before jobs go live. Listings must describe a genuine vacancy, and
              candidate data accessed through the platform may only be used for that hiring process.
            </p>
          </LegalSection>

          <LegalSection title="Acceptable use">
            <p>
              No fraudulent listings, scraping, impersonation, or attempts to interfere with the platform. We
              may suspend accounts that break these terms.
            </p>
          </LegalSection>

          <LegalSection title="Changes">
            <p>
              We may update these terms as the service evolves. Continued use after an update means you accept
              the revised terms.
            </p>
          </LegalSection>
        </div>
      </div>
    </PublicPageShell>
  );
}
