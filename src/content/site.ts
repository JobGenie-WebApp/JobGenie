import type { LandingContent, SiteContent, SiteFooterContent, SiteNavigationContent } from './types';

export const landingContent: LandingContent = {
  hero: {
    kicker: '',
    title: 'Hire the best',
    emphasizedTitle: 'Hired by the best',
    description:
      'The best teams are looking for the best talent. The best talent is looking for the best team. I’m here to grant your wish! ',
    trustLabel: 'Trusted by modern hiring teams',
    lampLabel: 'Rub the lamp',
    genieImageAlt: 'The JobGenie presenting hiring opportunities',
    wishCards: [
      { eyebrow: 'SKILLS MATCH', title: 'Product Designer', note: '94% match' },
      { eyebrow: 'TOP TALENT PICKED', title: 'Screening passed', note: 'Ready to interview' },
    ],
  },
  heroDashboard: {
    title: 'Progress Tracker',
    liveLabel: 'LIVE',
    columns: [
      {
        title: 'New Applicants',
        count: '08',
        people: [
          { initials: 'AM', name: 'Arawinda Marasinghe', match: '96% match' },
          { initials: 'DK', name: 'Dinuka Karunarathne', match: '93% match' },
          { initials: 'SL', name: 'Sara Liyanage', match: '90% match' },
        ],
      },
      {
        title: 'Shortlisted',
        count: '05',
        people: [
          { initials: 'NR', name: 'Nimashi Herath', match: '89% match' },
          { initials: 'JT', name: 'Janaka Perera', match: '86% match' },
        ],
      },
      {
        title: 'Interview Completed',
        count: '03',
        people: [
          { initials: 'KM', name: 'Kavi Mendis', match: '82% match' },
          { initials: 'RB', name: 'Ravi Peris', match: '79% match' },
        ],
      },
      {
        title: 'It is a match',
        count: '02',
        people: [{ initials: 'EP', name: 'Natasha Fernando', match: '75% match' }],
      },
    ],
  },
  trustStrip: {
    label: 'BUILT FOR MODERN RECRUITMENT',
    items: ['Verified talent', 'Intelligent matching', 'Clear pipelines', 'Faster decisions'],
  },
  journeys: {
    kicker: '',
    title: 'Ready, Steady,',
    emphasizedTitle: 'Hire!',
    candidateLabel: "For Candidate",
    employerLabel: "For Companies",
    candidate: [
      {
        number: '01',
        title: 'Create your profile',
        text: 'Upload your CV, verify your profile, and kickstart your job search!',
        icon: 'file',
      },
      {
        number: '02',
        title: 'Get your skill score',
        text: 'Our smart AI matches your CV with jobs that fit your skills. View your personalised opportunities and apply.',
        icon: 'search',
      },
      {
        number: '03',
        title: 'Follow your progress',
        text: 'Get real time updates from every recruiter, on a single dashboard. Save time. Spot the perfect match.',
        icon: 'check',
      },
    ],
    employer: [
      {
        number: '01',
        title: 'Register and Post Jobs ',
        text: 'Create your company profile, verify your profile, and kickstart your skill search!',
        icon: 'briefcase',
      },
      {
        number: '02',
        title: 'Review & Select',
        text: 'Let our smart AI pair your job requirements with the perfect applicant. Review profiles effortlessly and connect with your next great hire in real time.',
        icon: 'users',
      },
      {
        number: '03',
        title: 'Interview and Job Offer',
        text: 'Share interview schedules with top talent, compare team feedback, and view candidate scores. Hire the right talent, right away.',
        icon: 'check',
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
  highlights: [
    {
      eyebrow: 'SMART MATCHING',
      title: 'Looking for a job or the best talent? We’ve got your best match!',
      description:
        'Our smart AI system handles the initial sorting, but a human professional reviews every CV before moving forward.',
      points: [
        'Skills-first reviews',
        'Fast screening for thousands of CVs',
        'Instant updates on your next stage',
      ],
    },
    {
      eyebrow: 'CLEAR PROGRESS',
      title: 'Curious where your application stands? View your progress every step of the way.',
      description:
        'Your personalised dashboard keeps you completely in the loop. See how well your skills match the role and watch your CV move forward in real time.',
      points: ['Real-time updates', 'Efficient workflows', 'Multi-recruiter view'],
    },
    {
      eyebrow: 'VERIFIED TRUST',
      title: 'Having second thoughts about credibility? Don’t worry. We’ve done all the research for you.',
      description:
        'No fake profiles, no hidden surprises. We verify both employers and job seekers at creation, vetting every user to ensure a community built on trust.',
      points: ['Prevents scams', 'Creates aspiration', 'Saves time'],
    },
  ],
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

export const navigationContent: SiteNavigationContent = {
  brand: { prefix: '', suffix: '' },
  links: [
    { href: '/', id: 'home', label: 'Home' },
    { href: '/about-us', id: 'about-us', label: 'About Us' },
    { href: '/opportunities', id: 'opportunities', label: 'Our Opportunities' },
    { href: '/top-employers', id: 'top-employers', label: 'Our Top Employers' },
    { href: '/talent-pool', id: 'talent-pool', label: 'Our Talent Pool' },
    { href: '/explore-genie', id: 'explore-genie', label: 'Explore Genie' },
  ],
  signIn: { label: "Let's Sign In", href: '/login' },
  getStarted: { label: 'Get Started', href: '/signup' },
};

export const footerContent: SiteFooterContent = {
  brandDescription:
    'The recruitment operating system for teams who value clarity, speed, and accountability.',
  columns: [
    {
      title: 'Product',
      links: [
        { label: 'Opportunities', href: '/opportunities' },
        { label: 'Top Employers', href: '/top-employers' },
        { label: 'Talent Pool', href: '/talent-pool' },
        { label: 'Explore Genie', href: '/explore-genie' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about-us' },
        { label: 'Contact Us', href: '/contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookie-policy' },
        { label: 'GDPR', href: '/gdpr' },
        { label: 'PDPA', href: '/pdpa' },
      ],
    },
  ],
  socialLinks: [
    { label: 'Twitter', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'GitHub', href: '#' },
  ],
  legalLine: 'FutureFit PVT LTD. All rights reserved.',
  versionLabel: '',
  statusLabel: '',
};

export const siteContent: SiteContent = {
  landing: landingContent,
  navigation: navigationContent,
  footer: footerContent,
};
