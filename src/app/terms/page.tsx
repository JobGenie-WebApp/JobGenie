import type { Metadata } from 'next';
import { ScrollText } from 'lucide-react';
import { PublicPageHero, PublicPageShell } from '@/components/public/PublicPageShell';
import { LegalNotice, LegalSection, legalBody } from '@/components/public/LegalPage';

export const metadata: Metadata = {
  title: 'Terms & Conditions | JobGenie',
  description: 'The terms that govern your use of the JobGenie platform.',
};

export default function TermsPage() {
  return (
    <PublicPageShell>
      <PublicPageHero
        description="The rules for using JobGenie as a job seeker or employer."
        eyebrow="LEGAL"
        icon={ScrollText}
        title="Terms & Conditions"
      />
      <div className="jg-container py-14">
        <div className={legalBody}>
          <LegalNotice />

          <LegalSection title="1. Who Can Use This Site">
            <p>
              Our platform is designed to connect job seekers with career opportunities. To create a candidate
              profile, you must be of legal working age under Sri Lankan law. If you represent a company, it
              should have a workforce of at least 50 employees.
            </p>
          </LegalSection>

          <LegalSection title="2. Accuracy of Your Information">
            <p>
              We count on you to keep your information authentic. All information you provide must be true,
              accurate, and up to date.
            </p>
          </LegalSection>

          <LegalSection title="3. No Guarantee of Placement">
            <p>
              Joining our candidate pool or submitting an application makes your profile available for relevant
              roles, but it does not guarantee an interview, job placement, or job offer.
            </p>
          </LegalSection>

          <LegalSection title="4. Employer Rules">
            <p>
              We protect our candidates&apos; privacy. Employers and recruiters may only use applicant details to
              evaluate candidates for job roles. Using candidate data for marketing or any other unrelated
              purpose is strictly forbidden.
            </p>
          </LegalSection>

          <LegalSection title="5. Content and Ownership">
            <p>
              You retain full ownership of your resume and portfolio materials. By uploading them, you give us
              permission to store, process, and present your profile to relevant hiring teams for recruitment
              purposes.
            </p>
          </LegalSection>

          <LegalSection title="6. Updates to These Terms">
            <p>
              We may occasionally update these terms or our privacy practices to reflect improvements to the
              platform. Continued use of JobGenie after an update means you accept the revised terms.
            </p>
          </LegalSection>
        </div>
      </div>
    </PublicPageShell>
  );
}
