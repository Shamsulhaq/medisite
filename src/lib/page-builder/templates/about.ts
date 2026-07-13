import type { PageTemplate } from './home';
import type { BlockInstance } from '../types';

// ---------------------------------------------------------------------------
// About page templates — uses real default content from defaults.ts
// ---------------------------------------------------------------------------

const imageTextBlock: BlockInstance = {
  id: 'about-imagetext-001',
  type: 'imageText',
  visible: true,
  props: {
    image: '',
    heading: {
      en: 'Dr. Mahmud ul Hasan Miju',
      bn: 'ডা. মাহমুদ উল হাসান মিজু',
    },
    text: {
      en: 'Assistant Registrar, Department of Medicine\nFaridpur Medical College Hospital, Faridpur, Bangladesh',
      bn: 'সহকারী রেজিস্ট্রার, মেডিসিন বিভাগ\nফরিদপুর মেডিকেল কলেজ হাসপাতাল, ফরিদপুর, বাংলাদেশ',
    },
    imagePosition: 'left',
  },
};

const richTextBioBlock: BlockInstance = {
  id: 'about-richtext-001',
  type: 'richText',
  visible: true,
  props: {
    content: {
      en: 'Dr. Mahmud ul Hasan Miju is an Assistant Registrar at Faridpur Medical College Hospital, one of the leading tertiary care and teaching hospitals in the Faridpur region of Bangladesh.\n\nIn his role he is involved in day-to-day patient management, supervision of junior doctors and interns, ward rounds, and clinical decision-making alongside senior consultants. He is passionate about bedside teaching and continuous professional development.\n\nBeyond clinical duties, Dr. Mahmud writes about his experiences in the wards, public health in Bangladesh, and practical guidance for patients and their families.',
      bn: 'ডা. মাহমুদ উল হাসান মিজু ফরিদপুর মেডিকেল কলেজ হাসপাতালের একজন সহকারী রেজিস্ট্রার, যা বাংলাদেশের ফরিদপুর অঞ্চলের অন্যতম প্রধান টারশিয়ারি ও শিক্ষা হাসপাতাল।\n\nতাঁর দায়িত্বের মধ্যে রয়েছে দৈনন্দিন রোগী ব্যবস্থাপনা, জুনিয়র চিকিৎসক ও ইন্টার্নদের তত্ত্বাবধান, ওয়ার্ড রাউন্ড এবং সিনিয়র কনসালট্যান্টদের সাথে ক্লিনিক্যাল সিদ্ধান্ত গ্রহণ। তিনি বেডসাইড শিক্ষাদান ও ক্রমাগত পেশাগত উন্নয়নে আগ্রহী।',
    },
  },
};

const experienceTimelineBlock: BlockInstance = {
  id: 'about-timeline-exp-001',
  type: 'timeline',
  visible: true,
  props: {
    heading: { en: 'Professional Experience', bn: 'পেশাগত অভিজ্ঞতা' },
    items: [
      {
        role: { en: 'Assistant Registrar', bn: 'সহকারী রেজিস্ট্রার' },
        place: { en: 'Faridpur Medical College Hospital', bn: 'ফরিদপুর মেডিকেল কলেজ হাসপাতাল' },
        period: { en: 'Present', bn: 'বর্তমান' },
        description: {
          en: 'Patient management, supervision of junior doctors, ward rounds, and clinical teaching.',
          bn: 'রোগী ব্যবস্থাপনা, জুনিয়র চিকিৎসকদের তত্ত্বাবধান, ওয়ার্ড রাউন্ড ও ক্লিনিক্যাল শিক্ষাদান।',
        },
      },
      {
        role: { en: 'Indoor Medical Officer / Registrar', bn: 'ইনডোর মেডিকেল অফিসার / রেজিস্ট্রার' },
        place: { en: 'Faridpur Medical College Hospital', bn: 'ফরিদপুর মেডিকেল কলেজ হাসপাতাল' },
        period: { en: 'Previous', bn: 'পূর্ববর্তী' },
        description: {
          en: 'Provided round-the-clock inpatient care and emergency management.',
          bn: 'সার্বক্ষণিক ভর্তি রোগীর সেবা ও জরুরি ব্যবস্থাপনা প্রদান।',
        },
      },
      {
        role: { en: 'Medical Officer', bn: 'মেডিকেল অফিসার' },
        place: { en: 'Upazila Health Complex', bn: 'উপজেলা স্বাস্থ্য কমপ্লেক্স' },
        period: { en: 'Earlier', bn: 'পূর্বে' },
        description: {
          en: 'Delivered primary and emergency care to the community at the upazila level.',
          bn: 'উপজেলা পর্যায়ে সম্প্রদায়ের জন্য প্রাথমিক ও জরুরি সেবা প্রদান।',
        },
      },
    ],
  },
};

const educationTimelineBlock: BlockInstance = {
  id: 'about-timeline-edu-001',
  type: 'timeline',
  visible: true,
  props: {
    heading: { en: 'Education', bn: 'শিক্ষা' },
    items: [
      {
        role: { en: 'MBBS (Bachelor of Medicine, Bachelor of Surgery)', bn: 'এমবিবিএস' },
        place: { en: 'Medical College', bn: 'মেডিকেল কলেজ' },
        period: { en: '20XX', bn: '20XX' },
        description: { en: '', bn: '' },
      },
      {
        role: { en: 'FCPS / MD (Medicine)', bn: 'এফসিপিএস / এমডি (মেডিসিন)' },
        place: { en: 'Bangladesh College of Physicians and Surgeons', bn: 'বাংলাদেশ কলেজ অব ফিজিশিয়ান্স অ্যান্ড সার্জনস' },
        period: { en: '20XX', bn: '20XX' },
        description: { en: '', bn: '' },
      },
    ],
  },
};

const specialtiesFeatureGridBlock: BlockInstance = {
  id: 'about-features-001',
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
          en: 'Diagnosis and management of common and complex medical conditions in adults.',
          bn: 'প্রাপ্তবয়স্কদের সাধারণ ও জটিল রোগ নির্ণয় ও ব্যবস্থাপনা।',
        },
      },
      {
        icon: 'bed',
        title: { en: 'Inpatient & Ward Care', bn: 'ভর্তি ও ওয়ার্ড সেবা' },
        description: {
          en: 'Comprehensive inpatient management and multidisciplinary care coordination.',
          bn: 'ভর্তি রোগীদের ব্যাপক ব্যবস্থাপনা ও বহু-বিভাগীয় সেবার সমন্বয়।',
        },
      },
      {
        icon: 'shield',
        title: { en: 'Preventive Health', bn: 'প্রতিরোধমূলক স্বাস্থ্য' },
        description: {
          en: 'Lifestyle guidance, screening, and preventive strategies.',
          bn: 'জীবনযাত্রা, স্ক্রিনিং ও প্রতিরোধমূলক কৌশল নিয়ে পরামর্শ।',
        },
      },
      {
        icon: 'book',
        title: { en: 'Medical Education', bn: 'চিকিৎসা শিক্ষা' },
        description: {
          en: 'Teaching and mentoring of interns and junior doctors.',
          bn: 'ইন্টার্ন ও জুনিয়র চিকিৎসকদের শিক্ষাদান ও পরামর্শ।',
        },
      },
    ],
  },
};

const contactCardBlock: BlockInstance = {
  id: 'about-contact-001',
  type: 'contactCard',
  visible: true,
  props: {
    heading: { en: 'Chamber & Contact', bn: 'চেম্বার ও যোগাযোগ' },
    items: [
      {
        icon: 'location',
        label: { en: 'Address', bn: 'ঠিকানা' },
        value: 'Faridpur Medical College Hospital, Faridpur, Bangladesh',
        href: '',
      },
      {
        icon: 'clock',
        label: { en: 'Hours', bn: 'সময়' },
        value: 'Saturday – Thursday, 6:00 PM – 9:00 PM',
        href: '',
      },
      {
        icon: 'phone',
        label: { en: 'Phone', bn: 'ফোন' },
        value: '+880 1XXX-XXXXXX',
        href: 'tel:+8801XXXXXXXXX',
      },
    ],
  },
};

const heroAboutBlock: BlockInstance = {
  id: 'about-hero-001',
  type: 'hero',
  visible: true,
  props: {
    badge: { en: 'About', bn: 'পরিচিতি' },
    heading: { en: 'Dr. Mahmud ul Hasan Miju', bn: 'ডা. মাহমুদ উল হাসান মিজু' },
    subtext: {
      en: 'Assistant Registrar, Department of Medicine — Faridpur Medical College Hospital.',
      bn: 'সহকারী রেজিস্ট্রার, মেডিসিন বিভাগ — ফরিদপুর মেডিকেল কলেজ হাসপাতাল।',
    },
    ctaPrimaryLabel: { en: '', bn: '' },
    ctaPrimaryHref: '',
    ctaSecondaryLabel: { en: '', bn: '' },
    ctaSecondaryHref: '',
    showPhoto: true,
  },
};

const statsBlock: BlockInstance = {
  id: 'about-stats-001',
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

const ctaBannerBlock: BlockInstance = {
  id: 'about-cta-001',
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

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export const ABOUT_TEMPLATES: PageTemplate[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Image + Text → Bio → Experience Timeline → Specialties Grid → Contact Card.',
    blocks: [
      { ...imageTextBlock, id: 'professional-imagetext' },
      { ...richTextBioBlock, id: 'professional-bio' },
      { ...experienceTimelineBlock, id: 'professional-experience' },
      { ...specialtiesFeatureGridBlock, id: 'professional-specialties' },
      { ...contactCardBlock, id: 'professional-contact' },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Hero (name only, no CTA) → Bio → Contact Card — clean and concise.',
    blocks: [
      { ...heroAboutBlock, id: 'minimal-hero' },
      { ...richTextBioBlock, id: 'minimal-bio' },
      { ...contactCardBlock, id: 'minimal-contact' },
    ],
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Image + Text → Bio → Education → Experience → Specialties — credentials forward.',
    blocks: [
      { ...imageTextBlock, id: 'academic-imagetext' },
      { ...richTextBioBlock, id: 'academic-bio' },
      { ...educationTimelineBlock, id: 'academic-education' },
      { ...experienceTimelineBlock, id: 'academic-experience' },
      { ...specialtiesFeatureGridBlock, id: 'academic-specialties' },
    ],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Hero → Stats → Specialties Grid → Bio → CTA Banner — bold, data-driven.',
    blocks: [
      { ...heroAboutBlock, id: 'modern-hero' },
      { ...statsBlock, id: 'modern-stats' },
      { ...specialtiesFeatureGridBlock, id: 'modern-specialties' },
      { ...richTextBioBlock, id: 'modern-bio' },
      { ...ctaBannerBlock, id: 'modern-cta' },
    ],
  },
];
