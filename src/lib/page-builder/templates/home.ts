import type { BlockInstance } from '../types';

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  blocks: BlockInstance[];
}

// ---------------------------------------------------------------------------
// Shared block instances (reused across templates)
// All text values match the existing site content from src/lib/defaults.ts
// ---------------------------------------------------------------------------

const heroBlock: BlockInstance = {
  id: 'tpl-hero-001',
  type: 'hero',
  visible: true,
  props: {
    badge: {
      en: 'Assistant Registrar · Faridpur Medical College Hospital',
      bn: 'সহকারী রেজিস্ট্রার · ফরিদপুর মেডিকেল কলেজ হাসপাতাল',
    },
    heading: {
      en: 'Dr. Mahmud ul Hasan Miju',
      bn: 'ডা. মাহমুদ উল হাসান মিজু',
    },
    subtext: {
      en: 'I am a physician serving as Assistant Registrar at Faridpur Medical College Hospital. My focus is on delivering quality clinical care, supporting medical education, and sharing knowledge that helps patients and colleagues alike.',
      bn: 'আমি ফরিদপুর মেডিকেল কলেজ হাসপাতালে সহকারী রেজিস্ট্রার হিসেবে কর্মরত একজন চিকিৎসক। মানসম্পন্ন চিকিৎসা সেবা প্রদান, চিকিৎসা শিক্ষায় সহায়তা এবং রোগী ও সহকর্মীদের জন্য উপকারী জ্ঞান ভাগ করে নেওয়াই আমার লক্ষ্য।',
    },
    ctaPrimaryLabel: { en: 'Book an Appointment', bn: 'অ্যাপয়েন্টমেন্ট নিন' },
    ctaPrimaryHref: '/appointment',
    ctaSecondaryLabel: { en: 'Learn More', bn: 'আরও জানুন' },
    ctaSecondaryHref: '/about',
    showPhoto: true,
  },
};

const statsBlock: BlockInstance = {
  id: 'tpl-stats-001',
  type: 'stats',
  visible: true,
  props: {
    items: [
      { value: '8+', label: { en: 'Years of Experience', bn: 'বছরের অভিজ্ঞতা' } },
      { value: '10,000+', label: { en: 'Patients Cared For', bn: 'রোগীর সেবা' } },
      { value: '3', label: { en: 'Published Articles', bn: 'প্রকাশিত লেখা' } },
      { value: 'FMCH', label: { en: 'Hospital', bn: 'হাসপাতাল' } },
    ],
  },
};

const featureGridBlock: BlockInstance = {
  id: 'tpl-features-001',
  type: 'featureGrid',
  visible: true,
  props: {
    heading: { en: 'Areas of Care', bn: 'সেবার ক্ষেত্রসমূহ' },
    subtitle: {
      en: 'Providing comprehensive medical care with a patient-first approach.',
      bn: 'রোগী-কেন্দ্রিক দৃষ্টিভঙ্গিতে ব্যাপক চিকিৎসা সেবা প্রদান।',
    },
    items: [
      {
        icon: 'stethoscope',
        title: { en: 'General Medicine', bn: 'সাধারণ মেডিসিন' },
        description: {
          en: 'Diagnosis and management of common and complex medical conditions in adults, including infectious, metabolic, and chronic diseases.',
          bn: 'সংক্রামক, বিপাকীয় ও দীর্ঘমেয়াদি রোগসহ প্রাপ্তবয়স্কদের সাধারণ ও জটিল রোগ নির্ণয় ও ব্যবস্থাপনা।',
        },
      },
      {
        icon: 'bed',
        title: { en: 'Inpatient & Ward Care', bn: 'ভর্তি ও ওয়ার্ড সেবা' },
        description: {
          en: 'Comprehensive inpatient management, ward rounds, and coordination of multidisciplinary care for admitted patients.',
          bn: 'ভর্তি রোগীদের জন্য ব্যাপক ব্যবস্থাপনা, ওয়ার্ড রাউন্ড এবং বহু-বিভাগীয় সেবার সমন্বয়।',
        },
      },
      {
        icon: 'shield',
        title: { en: 'Preventive Health', bn: 'প্রতিরোধমূলক স্বাস্থ্য' },
        description: {
          en: 'Guidance on lifestyle, screening, and preventive strategies to reduce the burden of chronic illness.',
          bn: 'দীর্ঘমেয়াদি অসুস্থতার ঝুঁকি কমাতে জীবনযাত্রা, স্ক্রিনিং ও প্রতিরোধমূলক কৌশল নিয়ে পরামর্শ।',
        },
      },
      {
        icon: 'book',
        title: { en: 'Medical Education', bn: 'চিকিৎসা শিক্ষা' },
        description: {
          en: 'Teaching and mentoring of interns and junior doctors, with a focus on evidence-based clinical practice.',
          bn: 'প্রমাণভিত্তিক ক্লিনিক্যাল অনুশীলনের উপর জোর দিয়ে ইন্টার্ন ও জুনিয়র চিকিৎসকদের শিক্ষাদান ও পরামর্শ।',
        },
      },
    ],
  },
};

const blogPreviewBlock: BlockInstance = {
  id: 'tpl-blog-001',
  type: 'blogPreview',
  visible: true,
  props: {
    heading: { en: 'Latest Articles', bn: 'সাম্প্রতিক লেখা' },
    subtitle: {
      en: 'Notes from the ward and guidance for patients.',
      bn: 'ওয়ার্ড থেকে নোট ও রোগীদের জন্য পরামর্শ।',
    },
    count: 3,
  },
};

const ctaBannerBlock: BlockInstance = {
  id: 'tpl-cta-001',
  type: 'ctaBanner',
  visible: true,
  props: {
    heading: { en: 'Need to see a doctor?', bn: 'ডাক্তার দেখাতে চান?' },
    subtitle: {
      en: 'Request an appointment online — it only takes a minute.',
      bn: 'অনলাইনে অ্যাপয়েন্টমেন্টের অনুরোধ করুন — মাত্র এক মিনিট।',
    },
    buttonLabel: { en: 'Book an Appointment', bn: 'অ্যাপয়েন্টমেন্ট নিন' },
    buttonHref: '/appointment',
    variant: 'dark',
  },
};

const richTextBioBlock: BlockInstance = {
  id: 'tpl-richtext-001',
  type: 'richText',
  visible: true,
  props: {
    content: {
      en: 'Dr. Mahmud ul Hasan Miju is an Assistant Registrar at Faridpur Medical College Hospital, one of the leading tertiary care and teaching hospitals in the Faridpur region of Bangladesh.\n\nIn his role he is involved in day-to-day patient management, supervision of junior doctors and interns, ward rounds, and clinical decision-making alongside senior consultants. He is passionate about bedside teaching and continuous professional development.\n\nBeyond clinical duties, Dr. Mahmud writes about his experiences in the wards, public health in Bangladesh, and practical guidance for patients and their families.',
      bn: 'ডা. মাহমুদ উল হাসান মিজু ফরিদপুর মেডিকেল কলেজ হাসপাতালের একজন সহকারী রেজিস্ট্রার, যা বাংলাদেশের ফরিদপুর অঞ্চলের অন্যতম প্রধান টারশিয়ারি ও শিক্ষা হাসপাতাল।\n\nতাঁর দায়িত্বের মধ্যে রয়েছে দৈনন্দিন রোগী ব্যবস্থাপনা, জুনিয়র চিকিৎসক ও ইন্টার্নদের তত্ত্বাবধান, ওয়ার্ড রাউন্ড এবং সিনিয়র কনসালট্যান্টদের সাথে ক্লিনিক্যাল সিদ্ধান্ত গ্রহণ। তিনি বেডসাইড শিক্ষাদান ও ক্রমাগত পেশাগত উন্নয়নে আগ্রহী।',
    },
  },
};

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export const HOME_TEMPLATES: PageTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description:
      'Hero → Stats → Feature Grid → Blog Preview → CTA Banner — matches the current site layout.',
    blocks: [
      { ...heroBlock, id: 'classic-hero' },
      { ...statsBlock, id: 'classic-stats' },
      { ...featureGridBlock, id: 'classic-features' },
      { ...blogPreviewBlock, id: 'classic-blog' },
      { ...ctaBannerBlock, id: 'classic-cta' },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Hero → CTA Banner — clean and simple, just the essentials.',
    blocks: [
      { ...heroBlock, id: 'minimal-hero' },
      { ...ctaBannerBlock, id: 'minimal-cta' },
    ],
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description:
      'Hero → Rich Text (bio) → Stats → Feature Grid → CTA Banner — personal narrative-focused.',
    blocks: [
      { ...heroBlock, id: 'storyteller-hero' },
      { ...richTextBioBlock, id: 'storyteller-richtext' },
      { ...statsBlock, id: 'storyteller-stats' },
      { ...featureGridBlock, id: 'storyteller-features' },
      { ...ctaBannerBlock, id: 'storyteller-cta' },
    ],
  },
  {
    id: 'media',
    name: 'Media',
    description:
      'Hero → Feature Grid → Blog Preview → CTA Banner — content and articles forward.',
    blocks: [
      { ...heroBlock, id: 'media-hero' },
      { ...featureGridBlock, id: 'media-features' },
      { ...blogPreviewBlock, id: 'media-blog' },
      { ...ctaBannerBlock, id: 'media-cta' },
    ],
  },
];
