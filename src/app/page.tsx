import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LandingExperience } from '@/components/landing/LandingExperience';

export default function Home() {
  return (
    <div className="landing-page jobgenie-home">
      <Header />
      <LandingExperience />
      <Footer />
    </div>
  );
}
