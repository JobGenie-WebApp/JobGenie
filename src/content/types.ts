export type CTA = {
  label: string;
  href: string;
};

export type SiteBrand = {
  prefix: string;
  suffix: string;
};

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
    trustLabel: string;
    lampLabel: string;
    genieImageAlt: string;
    wishCards: {
      eyebrow: string;
      title: string;
      note: string;
    }[];
  };
  heroDashboard: {
    title: string;
    liveLabel: string;
    columns: {
      title: string;
      count: string;
      people: {
        initials: string;
        name: string;
        match: string;
      }[];
    }[];
  };
  trustStrip: {
    label: string;
    items: string[];
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
  highlights: {
    eyebrow: string;
    title: string;
    description: string;
    points: string[];
  }[];
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
  brand: SiteBrand;
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

export type SiteContent = {
  landing: LandingContent;
  navigation: SiteNavigationContent;
  footer: SiteFooterContent;
};
