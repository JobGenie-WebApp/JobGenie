export type CTA = {
  label: string;
  href: string;
};

export type LandingFeatureVisual = 'match' | 'verify' | 'calendar' | 'chart' | 'team';
export type LandingFeatureClassName = '' | 'is-wide' | 'is-wide is-green';

export type LandingFeatureIcon =
  | 'wand'
  | 'fingerprint'
  | 'calendar'
  | 'chart'
  | 'message';

export type LandingStepIcon =
  | 'file'
  | 'search'
  | 'check'
  | 'briefcase'
  | 'users'
  | 'zap';

export type LandingContent = {
  hero: {
    kicker: string;
    title: string;
    emphasizedTitle: string;
    description: string;
    primaryCta: CTA;
    secondaryCta: CTA;
    trustLabel: string;
  };
  trustStrip: {
    label: string;
    items: string[];
  };
  features: {
    kicker: string;
    title: string;
    emphasizedTitle: string;
    description: string;
    cards: {
      icon: LandingFeatureIcon;
      eyebrow: string;
      title: string;
      text: string;
      className: LandingFeatureClassName;
      visual: LandingFeatureVisual;
    }[];
  };
  journeys: {
    kicker: string;
    title: string;
    emphasizedTitle: string;
    candidateLabel: string;
    employerLabel: string;
    candidate: {
      number: string;
      title: string;
      text: string;
      icon: LandingStepIcon;
    }[];
    employer: {
      number: string;
      title: string;
      text: string;
      icon: LandingStepIcon;
    }[];
  };
  testimonial: {
    quote: string;
    authorInitials: string;
    authorName: string;
    authorRole: string;
    stats: {
      value: string;
      label: string;
    }[];
  };
  portals: {
    kicker: string;
    title: string;
    emphasizedTitle: string;
    description: string;
    candidateLabel: string;
    employerLabel: string;
    employerHeading: string;
    candidateHeading: string;
  };
  cta: {
    kicker: string;
    title: string;
    emphasizedTitle: string;
    description: string;
    primaryCta: CTA;
    secondaryCta: CTA;
    trustNote: string;
  };
};

export type SiteNavigationContent = {
  links: {
    href: string;
    id: string;
    label: string;
  }[];
  signIn: CTA;
  getStarted: CTA;
};

export type SiteFooterContent = {
  brandDescription: string;
  columns: {
    title: string;
    links: CTA[];
  }[];
  socialLinks: CTA[];
  legalLine: string;
  versionLabel: string;
  statusLabel: string;
};
