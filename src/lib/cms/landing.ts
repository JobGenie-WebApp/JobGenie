import 'server-only';

import type {
  CTA,
  LandingContent,
  LandingFeatureClassName,
  LandingFeatureIcon,
  LandingFeatureVisual,
  LandingStepIcon,
  SiteContent,
  SiteFooterContent,
  SiteNavigationContent,
} from './types';
import {
  fallbackFooterContent,
  fallbackLandingContent,
  fallbackNavigationContent,
  fallbackSiteContent,
} from './fallback';

const featureIcons: LandingFeatureIcon[] = ['wand', 'fingerprint', 'calendar', 'chart', 'message'];
const featureClassNames: LandingFeatureClassName[] = ['', 'is-wide', 'is-wide is-green'];
const featureVisuals: LandingFeatureVisual[] = ['match', 'verify', 'calendar', 'chart', 'team'];
const stepIcons: LandingStepIcon[] = ['file', 'search', 'check', 'briefcase', 'users', 'zap'];

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function select<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function group(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : {};
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function cta(value: unknown, fallback: CTA): CTA {
  const data = group(value);
  return {
    label: text(data.label, fallback.label),
    href: text(data.href, fallback.href),
  };
}

function labelRows(value: unknown, fallback: string[]): string[] {
  const labels = rows(value).map((item, index) => text(item.label, fallback[index] ?? ''));
  return labels.length ? labels : fallback;
}

function normalizeLanding(raw: unknown): LandingContent {
  const data = group(raw);
  const fallback = fallbackLandingContent;
  const hero = group(data.hero);
  const trustStrip = group(data.trustStrip);
  const features = group(data.features);
  const journeys = group(data.journeys);
  const testimonial = group(data.testimonial);
  const portals = group(data.portals);
  const ctaGroup = group(data.cta);
  const featureCards = rows(features.cards).map((card, index) => {
    const fallbackCard = fallback.features.cards[index] ?? fallback.features.cards[0];
    return {
      icon: select(card.icon, featureIcons, fallbackCard.icon),
      eyebrow: text(card.eyebrow, fallbackCard.eyebrow),
      title: text(card.title, fallbackCard.title),
      text: text(card.text, fallbackCard.text),
      className: select(card.className, featureClassNames, fallbackCard.className),
      visual: select(card.visual, featureVisuals, fallbackCard.visual),
    };
  });
  const stats = rows(testimonial.stats).map((stat, index) => {
    const fallbackStat = fallback.testimonial.stats[index] ?? fallback.testimonial.stats[0];
    return {
      value: text(stat.value, fallbackStat.value),
      label: text(stat.label, fallbackStat.label),
    };
  });

  return {
    hero: {
      kicker: text(hero.kicker, fallback.hero.kicker),
      title: text(hero.title, fallback.hero.title),
      emphasizedTitle: text(hero.emphasizedTitle, fallback.hero.emphasizedTitle),
      description: text(hero.description, fallback.hero.description),
      primaryCta: cta(hero.primaryCta, fallback.hero.primaryCta),
      secondaryCta: cta(hero.secondaryCta, fallback.hero.secondaryCta),
      trustLabel: text(hero.trustLabel, fallback.hero.trustLabel),
    },
    trustStrip: {
      label: text(trustStrip.label, fallback.trustStrip.label),
      items: labelRows(trustStrip.items, fallback.trustStrip.items),
    },
    features: {
      kicker: text(features.kicker, fallback.features.kicker),
      title: text(features.title, fallback.features.title),
      emphasizedTitle: text(features.emphasizedTitle, fallback.features.emphasizedTitle),
      description: text(features.description, fallback.features.description),
      cards: featureCards.length ? featureCards : fallback.features.cards,
    },
    journeys: {
      kicker: text(journeys.kicker, fallback.journeys.kicker),
      title: text(journeys.title, fallback.journeys.title),
      emphasizedTitle: text(journeys.emphasizedTitle, fallback.journeys.emphasizedTitle),
      candidateLabel: text(journeys.candidateLabel, fallback.journeys.candidateLabel),
      employerLabel: text(journeys.employerLabel, fallback.journeys.employerLabel),
      candidate: normalizeSteps(journeys.candidate, fallback.journeys.candidate),
      employer: normalizeSteps(journeys.employer, fallback.journeys.employer),
    },
    testimonial: {
      quote: text(testimonial.quote, fallback.testimonial.quote),
      authorInitials: text(testimonial.authorInitials, fallback.testimonial.authorInitials),
      authorName: text(testimonial.authorName, fallback.testimonial.authorName),
      authorRole: text(testimonial.authorRole, fallback.testimonial.authorRole),
      stats: stats.length ? stats : fallback.testimonial.stats,
    },
    portals: {
      kicker: text(portals.kicker, fallback.portals.kicker),
      title: text(portals.title, fallback.portals.title),
      emphasizedTitle: text(portals.emphasizedTitle, fallback.portals.emphasizedTitle),
      description: text(portals.description, fallback.portals.description),
      candidateLabel: text(portals.candidateLabel, fallback.portals.candidateLabel),
      employerLabel: text(portals.employerLabel, fallback.portals.employerLabel),
      employerHeading: text(portals.employerHeading, fallback.portals.employerHeading),
      candidateHeading: text(portals.candidateHeading, fallback.portals.candidateHeading),
    },
    cta: {
      kicker: text(ctaGroup.kicker, fallback.cta.kicker),
      title: text(ctaGroup.title, fallback.cta.title),
      emphasizedTitle: text(ctaGroup.emphasizedTitle, fallback.cta.emphasizedTitle),
      description: text(ctaGroup.description, fallback.cta.description),
      primaryCta: cta(ctaGroup.primaryCta, fallback.cta.primaryCta),
      secondaryCta: cta(ctaGroup.secondaryCta, fallback.cta.secondaryCta),
      trustNote: text(ctaGroup.trustNote, fallback.cta.trustNote),
    },
  };
}

function normalizeSteps(value: unknown, fallback: LandingContent['journeys']['candidate']) {
  const normalized = rows(value).map((step, index) => {
    const fallbackStep = fallback[index] ?? fallback[0];
    return {
      number: text(step.number, fallbackStep.number),
      title: text(step.title, fallbackStep.title),
      text: text(step.text, fallbackStep.text),
      icon: select(step.icon, stepIcons, fallbackStep.icon),
    };
  });
  return normalized.length ? normalized : fallback;
}

function normalizeNavigation(raw: unknown): SiteNavigationContent {
  const data = group(raw);
  const fallback = fallbackNavigationContent;
  const links = rows(data.links).map((link, index) => {
    const fallbackLink = fallback.links[index] ?? fallback.links[0];
    return {
      href: text(link.href, fallbackLink.href),
      id: text(link.id, fallbackLink.id),
      label: text(link.label, fallbackLink.label),
    };
  });

  return {
    links: links.length ? links : fallback.links,
    signIn: cta(data.signIn, fallback.signIn),
    getStarted: cta(data.getStarted, fallback.getStarted),
  };
}

function normalizeFooter(raw: unknown): SiteFooterContent {
  const data = group(raw);
  const fallback = fallbackFooterContent;
  const columns = rows(data.columns).map((column, columnIndex) => {
    const fallbackColumn = fallback.columns[columnIndex] ?? fallback.columns[0];
    const links = rows(column.links).map((link, linkIndex) => {
      const fallbackLink = fallbackColumn.links[linkIndex] ?? fallbackColumn.links[0];
      return cta(link, fallbackLink);
    });
    return {
      title: text(column.title, fallbackColumn.title),
      links: links.length ? links : fallbackColumn.links,
    };
  });
  const socialLinks = rows(data.socialLinks).map((link, index) =>
    cta(link, fallback.socialLinks[index] ?? fallback.socialLinks[0]),
  );

  return {
    brandDescription: text(data.brandDescription, fallback.brandDescription),
    columns: columns.length ? columns : fallback.columns,
    socialLinks: socialLinks.length ? socialLinks : fallback.socialLinks,
    legalLine: text(data.legalLine, fallback.legalLine),
    versionLabel: text(data.versionLabel, fallback.versionLabel),
    statusLabel: text(data.statusLabel, fallback.statusLabel),
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!process.env.PAYLOAD_DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    return fallbackSiteContent;
  }

  try {
    const [{ getPayload }, { default: config }] = await Promise.all([
      import('payload'),
      import('@payload-config'),
    ]);
    const payload = await getPayload({ config });
    const [landing, navigation, footer] = await Promise.all([
      payload.findGlobal({ slug: 'landing-page', depth: 0, draft: false, overrideAccess: false }),
      payload.findGlobal({ slug: 'site-navigation', depth: 0, draft: false, overrideAccess: false }),
      payload.findGlobal({ slug: 'site-footer', depth: 0, draft: false, overrideAccess: false }),
    ]);

    return {
      landing: normalizeLanding(landing),
      navigation: normalizeNavigation(navigation),
      footer: normalizeFooter(footer),
    };
  } catch (error) {
    console.warn('Payload CMS content unavailable; using JobGenie fallback content.', error);
    return fallbackSiteContent;
  }
}
