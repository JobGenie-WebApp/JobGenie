import { LandingExperience } from '@/components/landing/LandingExperience';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import type { SiteContent } from '@/content/types';

/**
 * The landing page composition, shared by `/` (published content, read-only)
 * and the MIS landing editor (draft content, wrapped in an EditableProvider).
 * It carries no CMS logic itself, so the public page ships none.
 */
export function SiteHome({ content }: { content: SiteContent }) {
    return (
        <div className="landing-page jobgenie-home">
            <Header navigation={content.navigation} />
            <LandingExperience content={content.landing} />
            <Footer brand={content.navigation.brand} content={content.footer} />
        </div>
    );
}
