import type { LandingContent, SiteFooterContent, SiteNavigationContent } from './types';

export const fallbackLandingContent: LandingContent = {
  hero: {
    kicker: '',
    title: 'Hire the best,',
    emphasizedTitle: 'Hired by the best!',
    description:
      'Your Career Companion, guiding you through the job market. The best teams are looking for the best talent. The best talent is looking for the best team. I’m here to grant your wish! ',
    primaryCta: { label: 'Find your opportunity', href: '/candidate/signup' },
    secondaryCta: { label: 'Hire exceptional talent', href: '/employer/signup' },
    trustLabel: 'Trusted by modern hiring teams',
  },
  trustStrip: {
    label: 'BUILT FOR MODERN RECRUITMENT',
    items: ['Verified talent', 'Intelligent matching', 'Clear pipelines', 'Faster decisions'],
  },
  features: {
    kicker: 'ONE POWERFUL WORKSPACE',
    title: 'Less admin. More',
    emphasizedTitle: 'magic.',
    description:
      'Everything candidates and hiring teams need, beautifully orchestrated in one recruitment platform.',
    cards: [
      {
        icon: 'wand',
        eyebrow: 'AI MATCHING',
        title: 'The right match, without the guesswork.',
        text: 'Skills, experience and ambition are translated into clear match signals your team can trust.',
        className: 'is-wide is-green',
        visual: 'match',
      },
      {
        icon: 'fingerprint',
        eyebrow: 'TRUST LAYER',
        title: 'Verified from day one.',
        text: 'Build confidence with verified candidate and employer profiles.',
        className: '',
        visual: 'verify',
      },
      {
        icon: 'calendar',
        eyebrow: 'INTERVIEWS',
        title: 'From shortlist to scheduled.',
        text: 'Coordinate every round, reminder and response in one calm workspace.',
        className: '',
        visual: 'calendar',
      },
      {
        icon: 'chart',
        eyebrow: 'PIPELINE',
        title: 'See hiring momentum.',
        text: 'Live pipeline analytics reveal bottlenecks before they slow your team down.',
        className: '',
        visual: 'chart',
      },
      {
        icon: 'message',
        eyebrow: 'COLLABORATION',
        title: 'One source of truth for the whole team.',
        text: 'Notes, decisions, invitations and status updates stay connected to every candidate.',
        className: 'is-wide',
        visual: 'team',
      },
    ],
  },
  journeys: {
    kicker: 'YOUR WISH, IN MOTION',
    title: 'A better career story starts in',
    emphasizedTitle: 'three steps.',
    candidateLabel: "I'm a candidate",
    employerLabel: "I'm an employer",
    candidate: [
      {
        number: '01',
        title: 'Create your profile',
        text: 'Tell your story once. Your skills, CV and preferences become a polished professional profile.',
        icon: 'file',
      },
      {
        number: '02',
        title: 'Discover your matches',
        text: 'Search trusted opportunities and let JobGenie surface the roles that truly fit.',
        icon: 'search',
      },
      {
        number: '03',
        title: 'Track every step',
        text: 'Applications, interviews and offers stay organised in one clear timeline.',
        icon: 'check',
      },
    ],
    employer: [
      {
        number: '01',
        title: 'Publish the role',
        text: 'Create a trusted company profile and launch a polished job post in minutes.',
        icon: 'briefcase',
      },
      {
        number: '02',
        title: 'Meet top talent',
        text: 'Review verified candidates, AI match signals and team feedback side by side.',
        icon: 'users',
      },
      {
        number: '03',
        title: 'Make the hire',
        text: 'Coordinate interviews, decisions and offers without losing momentum.',
        icon: 'zap',
      },
    ],
  },
  testimonial: {
    quote:
      'JobGenie turned a scattered hiring process into one clear rhythm. We spend less time chasing updates and more time talking to the right people.',
    authorInitials: 'AS',
    authorName: 'Amaya Silva',
    authorRole: 'Head of People · Northstar Labs',
    stats: [
      { value: '3×', label: 'faster shortlisting' },
      { value: '96%', label: 'top match accuracy' },
      { value: '100%', label: 'pipeline visibility' },
    ],
  },
  portals: {
    kicker: 'DESIGNED FOR BOTH SIDES',
    title: 'One platform.',
    emphasizedTitle: 'Two brilliant experiences.',
    description: "Focused workspaces give everyone exactly what they need—and nothing they don't.",
    candidateLabel: 'Candidate portal',
    employerLabel: 'Employer portal',
    employerHeading: 'Your hiring overview',
    candidateHeading: 'Your career dashboard',
  },
  cta: {
    kicker: 'YOUR NEXT CHAPTER IS WAITING',
    title: 'Ready to make your career wish',
    emphasizedTitle: 'real?',
    description: 'Join JobGenie today—where ambitious talent and remarkable teams find each other.',
    primaryCta: { label: 'Find my next role', href: '/candidate/signup' },
    secondaryCta: { label: 'Start hiring', href: '/employer/signup' },
    trustNote: 'Verified profiles · Transparent hiring · Built for trust',
  },
};

export const fallbackNavigationContent: SiteNavigationContent = {
  links: [
    { href: '#features', id: 'features', label: 'Features' },
    { href: '#how-it-works', id: 'how-it-works', label: 'How it Works' },
    { href: '#testimonials', id: 'testimonials', label: 'Testimonials' },
    { href: '#portals', id: 'portals', label: 'Portals' },
  ],
  signIn: { label: 'Sign In', href: '/login' },
  getStarted: { label: 'Get Started', href: '/candidate/signup' },
};

export const fallbackFooterContent: SiteFooterContent = {
  brandDescription:
    'The recruitment operating system for teams who value clarity, speed, and accountability.',
  columns: [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Pricing', href: '#' },
        { label: 'Enterprise', href: '#' },
        { label: 'Changelog', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press', href: '#' },
        { label: 'Partners', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'API Reference', href: '#' },
        { label: 'Status', href: '#' },
        { label: 'Community', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookie-policy' },
        { label: 'GDPR', href: '/cookie-policy#gdpr' },
      ],
    },
  ],
  socialLinks: [
    { label: 'Twitter', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'GitHub', href: '#' },
  ],
  legalLine: 'JobGenie Technologies Ltd. All rights reserved.',
  versionLabel: 'TALENT OS v1.0',
  statusLabel: 'All systems operational',
};

export const fallbackSiteContent = {
  landing: fallbackLandingContent,
  navigation: fallbackNavigationContent,
  footer: fallbackFooterContent,
};
