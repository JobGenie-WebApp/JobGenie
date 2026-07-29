import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LandingExperience } from '@/components/landing/LandingExperience';
import { siteContent } from '@/content/site';

export default function Home() {
  return (
    <div className="landing-page jobgenie-home">
      <Header navigation={siteContent.navigation} />
      <LandingExperience content={siteContent.landing} />
      <Footer content={siteContent.footer} />
    </div>
  );
}
