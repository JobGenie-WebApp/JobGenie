import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LandingExperience } from '@/components/landing/LandingExperience';
import { getSiteContent } from '@/lib/cms/landing';

export default async function Home() {
  const content = await getSiteContent();

  return (
    <div className="landing-page jobgenie-home">
      <Header navigation={content.navigation} />
      <LandingExperience content={content.landing} />
      <Footer content={content.footer} />
    </div>
  );
}
