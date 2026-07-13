import type { BlockDefinition } from './types';

const EMPTY_LS = { en: '', bn: '' };

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'hero',
    label: 'Hero Section',
    icon: 'star',
    defaultProps: {
      badge: EMPTY_LS,
      heading: EMPTY_LS,
      subtext: EMPTY_LS,
      ctaPrimaryLabel: { en: 'Book Appointment', bn: 'অ্যাপয়েন্টমেন্ট নিন' },
      ctaPrimaryHref: '/appointment',
      ctaSecondaryLabel: { en: 'Learn More', bn: 'আরও জানুন' },
      ctaSecondaryHref: '/about',
      showPhoto: true,
    },
  },
  {
    type: 'stats',
    label: 'Stats Row',
    icon: 'chart',
    defaultProps: {
      items: [], // array of { value: string, label: LS }
    },
  },
  {
    type: 'featureGrid',
    label: 'Feature Grid',
    icon: 'grid',
    defaultProps: {
      heading: EMPTY_LS,
      subtitle: EMPTY_LS,
      items: [], // array of { icon: string, title: LS, description: LS }
    },
  },
  {
    type: 'richText',
    label: 'Rich Text',
    icon: 'document',
    defaultProps: {
      content: EMPTY_LS, // markdown
    },
  },
  {
    type: 'ctaBanner',
    label: 'CTA Banner',
    icon: 'megaphone',
    defaultProps: {
      heading: EMPTY_LS,
      subtitle: EMPTY_LS,
      buttonLabel: EMPTY_LS,
      buttonHref: '/appointment',
      variant: 'dark', // 'dark' | 'brand' | 'light'
    },
  },
  {
    type: 'blogPreview',
    label: 'Latest Articles',
    icon: 'document',
    defaultProps: {
      heading: EMPTY_LS,
      subtitle: EMPTY_LS,
      count: 3,
    },
  },
  {
    type: 'timeline',
    label: 'Timeline',
    icon: 'clock',
    defaultProps: {
      heading: EMPTY_LS,
      items: [], // array of { role: LS, place: LS, period: LS, description: LS }
    },
  },
  {
    type: 'contactCard',
    label: 'Contact Card',
    icon: 'phone',
    defaultProps: {
      heading: EMPTY_LS,
      items: [], // array of { icon: string, label: LS, value: string, href: string }
    },
  },
  {
    type: 'appointmentFormEmbed',
    label: 'Appointment Form',
    icon: 'calendar',
    defaultProps: {
      heading: EMPTY_LS,
      subtitle: EMPTY_LS,
      showSidebar: true,
    },
  },
  {
    type: 'imageText',
    label: 'Image + Text',
    icon: 'image',
    defaultProps: {
      image: '',
      heading: EMPTY_LS,
      text: EMPTY_LS,
      imagePosition: 'left',
    },
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: 'minus',
    defaultProps: {
      size: 'md', // 'sm' | 'md' | 'lg' | 'xl'
    },
  },
];

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find((d) => d.type === type);
}
