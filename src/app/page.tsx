import { SiteHome } from '@/components/landing/SiteHome';
import { siteContent } from '@/content/site';

export default function Home() {
  return <SiteHome content={siteContent} />;
}
