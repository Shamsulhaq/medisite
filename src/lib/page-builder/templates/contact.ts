import type { PageTemplate } from './home';
import type { BlockInstance } from '../types';

// ---------------------------------------------------------------------------
// Contact page templates — uses ContactCard, RichText, AppointmentFormEmbed
// ---------------------------------------------------------------------------

const heroContactBlock: BlockInstance = {
  id: 'contact-hero-001',
  type: 'hero',
  visible: true,
  props: {
    badge: { en: 'Contact', bn: 'যোগাযোগ' },
    heading: { en: 'Get in Touch', bn: 'যোগাযোগ করুন' },
    subtext: {
      en: 'Have a question or want to book a visit? Reach out via phone, email, or fill in the appointment form below.',
      bn: 'কোনো প্রশ্ন আছে বা ভিজিট বুক করতে চান? ফোন, ইমেইল বা নিচের ফর্মের মাধ্যমে যোগাযোগ করুন।',
    },
    ctaPrimaryLabel: { en: '', bn: '' },
    ctaPrimaryHref: '',
    ctaSecondaryLabel: { en: '', bn: '' },
    ctaSecondaryHref: '',
    showPhoto: false,
  },
};

const contactCardBlock: BlockInstance = {
  id: 'contact-card-001',
  type: 'contactCard',
  visible: true,
  props: {
    heading: { en: 'Contact Information', bn: 'যোগাযোগের তথ্য' },
    items: [
      {
        icon: 'location',
        label: { en: 'Address', bn: 'ঠিকানা' },
        value: 'Faridpur Medical College Hospital, Faridpur, Bangladesh',
        href: '',
      },
      {
        icon: 'clock',
        label: { en: 'Chamber Hours', bn: 'চেম্বার সময়' },
        value: 'Saturday – Thursday, 6:00 PM – 9:00 PM',
        href: '',
      },
      {
        icon: 'phone',
        label: { en: 'Phone', bn: 'ফোন' },
        value: '+880 1XXX-XXXXXX',
        href: 'tel:+8801XXXXXXXXX',
      },
      {
        icon: 'mail',
        label: { en: 'Email', bn: 'ইমেইল' },
        value: 'doctor@example.com',
        href: 'mailto:doctor@example.com',
      },
    ],
  },
};

const richTextDirectionsBlock: BlockInstance = {
  id: 'contact-richtext-001',
  type: 'richText',
  visible: true,
  props: {
    content: {
      en: '## How to Find Us\n\nThe chamber is located inside Faridpur Medical College Hospital campus. Enter through the main gate, turn right past the outpatient building, and the chamber is on the ground floor of the east wing.\n\n**By Bus:** Faridpur town bus stand is 10 minutes away by auto-rickshaw.\n**By Train:** Faridpur Railway Station is approximately 15 minutes away.',
      bn: '## কিভাবে আসবেন\n\nচেম্বারটি ফরিদপুর মেডিকেল কলেজ হাসপাতাল ক্যাম্পাসের ভিতরে অবস্থিত। প্রধান গেট দিয়ে ঢুকে আউটডোর বিল্ডিং পার হয়ে ডানে ঘুরুন, পূর্ব পাশের ভবনের নিচতলায় চেম্বার।\n\n**বাসে:** ফরিদপুর টাউন বাস স্ট্যান্ড থেকে অটোরিকশায় ১০ মিনিট।\n**ট্রেনে:** ফরিদপুর রেলওয়ে স্টেশন থেকে প্রায় ১৫ মিনিট।',
    },
  },
};

const appointmentFormEmbedBlock: BlockInstance = {
  id: 'contact-apptform-001',
  type: 'appointmentFormEmbed',
  visible: true,
  props: {
    heading: { en: 'Book an Appointment', bn: 'অ্যাপয়েন্টমেন্ট নিন' },
    subtitle: {
      en: 'Select a date and time to request a visit.',
      bn: 'ভিজিটের অনুরোধের জন্য তারিখ ও সময় নির্বাচন করুন।',
    },
    showSidebar: false,
  },
};

const ctaBannerBlock: BlockInstance = {
  id: 'contact-cta-001',
  type: 'ctaBanner',
  visible: true,
  props: {
    heading: { en: 'Need Urgent Help?', bn: 'জরুরি সাহায্য দরকার?' },
    subtitle: {
      en: 'For emergencies, please visit the nearest emergency department or call directly.',
      bn: 'জরুরি অবস্থায় নিকটস্থ জরুরি বিভাগে যান অথবা সরাসরি কল করুন।',
    },
    buttonLabel: { en: 'Call Now', bn: 'এখনই কল করুন' },
    buttonHref: 'tel:+8801XXXXXXXXX',
    variant: 'brand',
  },
};

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export const CONTACT_TEMPLATES: PageTemplate[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Hero → Contact Card → Directions → CTA Banner — clear and informative.',
    blocks: [
      { ...heroContactBlock, id: 'standard-hero' },
      { ...contactCardBlock, id: 'standard-contact' },
      { ...richTextDirectionsBlock, id: 'standard-directions' },
      { ...ctaBannerBlock, id: 'standard-cta' },
    ],
  },
  {
    id: 'with-form',
    name: 'With Appointment Form',
    description: 'Hero → Contact Card → Appointment Form → CTA — contact + booking in one page.',
    blocks: [
      { ...heroContactBlock, id: 'form-hero' },
      { ...contactCardBlock, id: 'form-contact' },
      { ...appointmentFormEmbedBlock, id: 'form-appt' },
      { ...ctaBannerBlock, id: 'form-cta' },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Contact Card only — just the essentials.',
    blocks: [
      { ...contactCardBlock, id: 'minimal-contact' },
    ],
  },
  {
    id: 'full',
    name: 'Full Page',
    description: 'Hero → Contact Card → Directions → Appointment Form → CTA — everything included.',
    blocks: [
      { ...heroContactBlock, id: 'full-hero' },
      { ...contactCardBlock, id: 'full-contact' },
      { ...richTextDirectionsBlock, id: 'full-directions' },
      { ...appointmentFormEmbedBlock, id: 'full-appt' },
      { ...ctaBannerBlock, id: 'full-cta' },
    ],
  },
];
