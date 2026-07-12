import type { Field, GlobalConfig } from 'payload';

import { canPublishCMS } from '../access.ts';

const ctaFields: Field[] = [
  { name: 'label', type: 'text', required: true },
  { name: 'href', type: 'text', required: true },
];

const featureIconOptions = [
  { label: 'Wand', value: 'wand' },
  { label: 'Fingerprint', value: 'fingerprint' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Chart', value: 'chart' },
  { label: 'Message', value: 'message' },
];

const stepIconOptions = [
  { label: 'File', value: 'file' },
  { label: 'Search', value: 'search' },
  { label: 'Check', value: 'check' },
  { label: 'Briefcase', value: 'briefcase' },
  { label: 'Users', value: 'users' },
  { label: 'Zap', value: 'zap' },
];

const stepFields: Field[] = [
  { name: 'number', type: 'text', required: true },
  { name: 'title', type: 'text', required: true },
  { name: 'text', type: 'textarea', required: true },
  {
    name: 'icon',
    type: 'select',
    required: true,
    options: stepIconOptions,
  },
];

export const LandingPage: GlobalConfig = {
  slug: 'landing-page',
  label: 'Landing Page',
  admin: {
    group: 'JobGenie CMS',
  },
  access: {
    read: () => true,
    update: canPublishCMS,
  },
  versions: {
    drafts: true,
    max: 20,
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'kicker', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'emphasizedTitle', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'primaryCta', type: 'group', fields: ctaFields },
        { name: 'secondaryCta', type: 'group', fields: ctaFields },
        { name: 'trustLabel', type: 'text', required: true },
      ],
    },
    {
      name: 'trustStrip',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'items',
          type: 'array',
          minRows: 4,
          maxRows: 4,
          fields: [{ name: 'label', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'features',
      type: 'group',
      fields: [
        { name: 'kicker', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'emphasizedTitle', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        {
          name: 'cards',
          type: 'array',
          minRows: 5,
          maxRows: 5,
          fields: [
            { name: 'eyebrow', type: 'text', required: true },
            { name: 'title', type: 'text', required: true },
            { name: 'text', type: 'textarea', required: true },
            {
              name: 'icon',
              type: 'select',
              required: true,
              options: featureIconOptions,
            },
            {
              name: 'visual',
              type: 'select',
              required: true,
              options: [
                { label: 'Match', value: 'match' },
                { label: 'Verify', value: 'verify' },
                { label: 'Calendar', value: 'calendar' },
                { label: 'Chart', value: 'chart' },
                { label: 'Team', value: 'team' },
              ],
            },
            {
              name: 'className',
              type: 'select',
              defaultValue: '',
              options: [
                { label: 'Default', value: '' },
                { label: 'Wide', value: 'is-wide' },
                { label: 'Wide Green', value: 'is-wide is-green' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'journeys',
      type: 'group',
      fields: [
        { name: 'kicker', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'emphasizedTitle', type: 'text', required: true },
        { name: 'candidateLabel', type: 'text', required: true },
        { name: 'employerLabel', type: 'text', required: true },
        { name: 'candidate', type: 'array', minRows: 3, maxRows: 3, fields: stepFields },
        { name: 'employer', type: 'array', minRows: 3, maxRows: 3, fields: stepFields },
      ],
    },
    {
      name: 'testimonial',
      type: 'group',
      fields: [
        { name: 'quote', type: 'textarea', required: true },
        { name: 'authorInitials', type: 'text', required: true },
        { name: 'authorName', type: 'text', required: true },
        { name: 'authorRole', type: 'text', required: true },
        {
          name: 'stats',
          type: 'array',
          minRows: 3,
          maxRows: 3,
          fields: [
            { name: 'value', type: 'text', required: true },
            { name: 'label', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'portals',
      type: 'group',
      fields: [
        { name: 'kicker', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'emphasizedTitle', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'candidateLabel', type: 'text', required: true },
        { name: 'employerLabel', type: 'text', required: true },
        { name: 'employerHeading', type: 'text', required: true },
        { name: 'candidateHeading', type: 'text', required: true },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'kicker', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'emphasizedTitle', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'primaryCta', type: 'group', fields: ctaFields },
        { name: 'secondaryCta', type: 'group', fields: ctaFields },
        { name: 'trustNote', type: 'text', required: true },
      ],
    },
  ],
};
