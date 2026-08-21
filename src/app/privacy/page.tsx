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
        description="How JobGenie handles and protects candidate and company information."
        eyebrow="LEGAL"
        icon={ShieldCheck}
        title="Privacy Policy"
      />
      <div className="jg-container py-14">
        <div className={legalBody}>
          <LegalNotice />

          <LegalSection title="1. Information We Collect">
            <p>
              We collect the information you choose to share with us when you create a company or candidate
              profile. This includes your contact details, resume or CV, work history, educational background,
              portfolio links, and career preferences.
            </p>
          </LegalSection>

          <LegalSection title="2. How We Use Your Information">
            <p>
              Your details are used strictly for recruitment purposes. We use your profile to:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Match your skills with current and future job openings.</li>
              <li>Share your application with relevant hiring teams and employers.</li>
              <li>Contact you about job opportunities, application updates, or other relevant alerts.</li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Who Sees Your Profile">
            <p>
              Your privacy is important to us. Your profile and resume are only visible to authorised hiring
              managers and recruiters evaluating talent. We guarantee that your personal data will not be sold
              or shared with third parties for commercial purposes.
            </p>
          </LegalSection>

          <LegalSection title="4. Your Rights and Control Over Your Data">
            <p>
              You are always in control of your information. At any time, you can:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Access or request a copy of the details we hold about you.</li>
              <li>Update or correct your resume, experience, or contact information.</li>
              <li>Request deletion of your profile and personal data from our system.</li>
            </ul>
          </LegalSection>
        </div>
      </div>
    </PublicPageShell>
  );
}
