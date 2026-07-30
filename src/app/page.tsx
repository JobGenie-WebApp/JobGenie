import { SiteHome } from '@/components/landing/SiteHome';
import { getSiteContent } from '@/lib/cms/site-content';

export default async function Home() {
  return <SiteHome content={await getSiteContent()} />;
}
