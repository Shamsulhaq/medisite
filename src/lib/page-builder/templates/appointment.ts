import type { PageTemplate } from './home';
import type { BlockInstance } from '../types';

// ---------------------------------------------------------------------------
// Appointment page templates
// ---------------------------------------------------------------------------

const heroAppointmentBlock: BlockInstance = {
  id: 'appt-hero-001',
  type: 'hero',
  visible: true,
  props: {
    badge: { en: 'Appointments', bn: 'অ্যাপয়েন্টমেন্ট' },
    heading: { en: 'Book an Appointment', bn: 'অ্যাপয়েন্টমেন্ট নিন' },
    subtext: {
      en: 'Fill in the form below to request an appointment. You will receive a confirmation from our team.',
      bn: 'অ্যাপয়েন্টমেন্টের অনুরোধ করতে নিচের ফর্মটি পূরণ করুন। আমাদের দল থেকে আপনি একটি নিশ্চিতকরণ পাবেন।',
    },
    ctaPrimaryLabel: { en: '', bn: '' },
    ctaPrimaryHref: '',
    ctaSecondaryLabel: { en: '', bn: '' },
    ctaSecondaryHref: '',
    showPhoto: false,
  },
};

const appointmentFormBlock: BlockInstance = {
  id: 'appt-form-001',
  type: 'appointmentFormEmbed',
  visible: true,
  props: {
    heading: { en: 'Request an Appointment', bn: 'অ্যাপয়েন্টমেন্টের অনুরোধ' },
    subtitle: {
      en: 'Select a chamber, date and time slot that works for you.',
      bn: 'আপনার সুবিধামত চেম্বার, তারিখ ও সময় নির্বাচন করুন।',
    },
    showSidebar: true,
  },
};

const appointmentFormNoSidebarBlock: BlockInstance = {
  id: 'appt-form-nosidebar-001',
  type: 'appointmentFormEmbed',
  visible: true,
  props: {
    heading: { en: 'Book an Appointment', bn: 'অ্যাপয়েন্টমেন্ট নিন' },
    subtitle: {
      en: 'Fill in the form to request an appointment.',
      bn: 'অ্যাপয়েন্টমেন্টের অনুরোধ করতে ফর্মটি পূরণ করুন।',
    },
    showSidebar: false,
  },
};

const appointmentRichTextBlock: BlockInstance = {
  id: 'appt-richtext-001',
  type: 'richText',
  visible: true,
  props: {
    content: {
      en: '## How to Book\n\nSelect your preferred chamber and date, then choose an available time slot. After submitting, our team will confirm your appointment via phone or SMS.\n\n**Please note:** This form is for non-urgent appointment requests only. If you are experiencing a medical emergency, please go to the nearest emergency department immediately.',
      bn: '## কিভাবে বুক করবেন\n\nআপনার পছন্দের চেম্বার ও তারিখ নির্বাচন করুন, তারপর একটি উপলব্ধ সময় বেছে নিন। জমা দেওয়ার পর আমাদের দল ফোন বা এসএমএসের মাধ্যমে আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত করবে।\n\n**দয়া করে মনে রাখুন:** এই ফর্মটি শুধুমাত্র জরুরি নয় এমন অ্যাপয়েন্টমেন্টের জন্য। জরুরি অবস্থায় নিকটস্থ জরুরি বিভাগে যান।',
    },
  },
};

const contactCardBlock: BlockInstance = {
  id: 'appt-contact-001',
  type: 'contactCard',
  visible: true,
  props: {
    heading: { en: 'Chamber Information', bn: 'চেম্বার তথ্য' },
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

const servicesFeatureGridBlock: BlockInstance = {
  id: 'appt-services-001',
  type: 'featureGrid',
  visible: true,
  props: {
    heading: { en: 'Services Available', bn: 'উপলব্ধ সেবাসমূহ' },
    subtitle: {
      en: 'What you can expect during your visit.',
      bn: 'আপনার ভিজিটের সময় যা আশা করতে পারেন।',
    },
    items: [
      {
        icon: 'stethoscope',
        title: { en: 'General Consultation', bn: 'সাধারণ পরামর্শ' },
        description: {
          en: 'Comprehensive clinical assessment and treatment plan.',
          bn: 'ব্যাপক ক্লিনিক্যাল মূল্যায়ন ও চিকিৎসা পরিকল্পনা।',
        },
      },
      {
        icon: 'clipboard',
        title: { en: 'Follow-up Visits', bn: 'ফলো-আপ ভিজিট' },
        description: {
          en: 'Review of test results, progress monitoring, and medication adjustment.',
          bn: 'পরীক্ষার ফলাফল পর্যালোচনা, অগ্রগতি পর্যবেক্ষণ ও ওষুধ সমন্বয়।',
        },
      },
      {
        icon: 'shield',
        title: { en: 'Preventive Checkup', bn: 'প্রতিরোধমূলক চেকআপ' },
        description: {
          en: 'Health screening, risk assessment, and lifestyle guidance.',
          bn: 'স্বাস্থ্য পরীক্ষা, ঝুঁকি মূল্যায়ন ও জীবনযাত্রা সংক্রান্ত পরামর্শ।',
        },
      },
      {
        icon: 'monitor',
        title: { en: 'Online Consultation', bn: 'অনলাইন পরামর্শ' },
        description: {
          en: 'Video consultation from the comfort of your home.',
          bn: 'ঘরে বসে ভিডিও পরামর্শ।',
        },
      },
    ],
  },
};

const ctaBannerBlock: BlockInstance = {
  id: 'appt-cta-001',
  type: 'ctaBanner',
  visible: true,
  props: {
    heading: { en: 'For Emergencies', bn: 'জরুরি অবস্থায়' },
    subtitle: {
      en: 'This form is for non-urgent requests only. For emergencies, visit the nearest emergency department or call emergency services.',
      bn: 'এই ফর্মটি শুধুমাত্র জরুরি নয় এমন অনুরোধের জন্য। জরুরি অবস্থায় নিকটস্থ জরুরি বিভাগে যান।',
    },
    buttonLabel: { en: 'Call Now', bn: 'এখনই কল করুন' },
    buttonHref: 'tel:+8801XXXXXXXXX',
    variant: 'brand',
  },
};

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export const APPOINTMENT_TEMPLATES: PageTemplate[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Hero → Appointment Form (with sidebar) — the default layout.',
    blocks: [
      { ...heroAppointmentBlock, id: 'standard-hero' },
      { ...appointmentFormBlock, id: 'standard-form' },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Appointment Form only (no sidebar) — straight to the point.',
    blocks: [
      { ...appointmentFormNoSidebarBlock, id: 'minimal-form' },
    ],
  },
  {
    id: 'informative',
    name: 'Informative',
    description: 'Hero → Instructions → Appointment Form → Contact Card — context before the form.',
    blocks: [
      { ...heroAppointmentBlock, id: 'informative-hero' },
      { ...appointmentRichTextBlock, id: 'informative-richtext' },
      { ...appointmentFormBlock, id: 'informative-form' },
      { ...contactCardBlock, id: 'informative-contact' },
    ],
  },
  {
    id: 'fullPage',
    name: 'Full Page',
    description: 'Hero → Services Grid → Appointment Form → CTA Banner — comprehensive page.',
    blocks: [
      { ...heroAppointmentBlock, id: 'fullpage-hero' },
      { ...servicesFeatureGridBlock, id: 'fullpage-services' },
      { ...appointmentFormBlock, id: 'fullpage-form' },
      { ...ctaBannerBlock, id: 'fullpage-cta' },
    ],
  },
];
