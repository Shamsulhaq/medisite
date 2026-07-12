// -----------------------------------------------------------------------------
// Shared data types for the CMS. Natural-language display fields use
// LocalizedString ({ en, bn }); non-linguistic values stay plain strings.
// -----------------------------------------------------------------------------

import type { Locale, LocalizedString } from "./i18n";

type LS = LocalizedString;

export type Stat = { label: LS; value: string };

export type Specialty = {
  title: LS;
  description: LS;
  icon: string; // one of the Icon component names
};

export type Education = {
  degree: LS;
  institution: LS;
  year: string;
};

export type Experience = {
  role: LS;
  place: LS;
  period: LS;
  description: LS;
};

export type MenuItem = { href: string; label: LS };

export type TimeRange = { start: string; end: string }; // "HH:MM" 24-hour
export type DayAvailability = { enabled: boolean; ranges: TimeRange[] };
export type Availability = {
  slotMinutes: number; // length of each appointment slot
  maxPerSlot: number; // max patients per slot (default 10)
  week: DayAvailability[]; // 7 entries, index 0 = Sunday … 6 = Saturday
  holidays: string[]; // specific off-days, "YYYY-MM-DD"
};

export type Chamber = {
  id: string;
  name: string;
  address: string;
  phone: string;
  mapUrl: string; // Google Maps or similar link
  description: string; // any notes shown to patients
  photo: string; // uploaded image URL
  availability: Availability;
};

export type OnlineConfig = {
  enabled: boolean;
  platform: string; // e.g. "Zoom", "Google Meet"
  instructions: string; // shown to the patient after booking
  availability: Availability;
};

export type AppointmentConfig = {
  chambers: Chamber[]; // in-person locations
  online: OnlineConfig; // online consultation option
};

export type EmailConfig = {
  enabled: boolean;
  host: string; // SMTP host
  port: number;
  secure: boolean; // true for 465, false for 587
  user: string;
  pass: string; // app password
  from: string; // e.g. "Dr. Mahmud <noreply@drmahmud.com>"
};

export type PrescriptionConfig = {
  // Printed prescription header (doctor info shown at top)
  header: {
    leftLines: string[]; // Bengali lines (e.g. doctor name, qualifications, specialty in Bangla)
    rightLines: string[]; // English lines (e.g. name, degrees, department, hospital)
    contactLines: string[]; // phone, email, chamber number, BMDC reg etc.
  };
  // Printed prescription footer
  footer: {
    leftText: string; // e.g. "Patient ID: shown automatically"
    centerText: string; // e.g. "Generated digitally"
    rightText: string; // e.g. doctor signature label
  };
  // Pre-configured items
  predefinedAdvices: string[];
  predefinedDiagnoses: string[];
  timingOptions: string[];
  followUpOptions: string[];
};

export type Contact = {
  email: string;
  phone: string;
  address: LS;
  chamberHours: LS;
};

export type Socials = {
  facebook: string;
  linkedin: string;
  twitter: string;
};

export type HomeText = {
  heroBadge: LS;
  ctaPrimaryLabel: LS;
  ctaSecondaryLabel: LS;
  areasHeading: LS;
  areasSubtitle: LS;
  latestHeading: LS;
  latestSubtitle: LS;
  bottomCtaHeading: LS;
  bottomCtaSubtitle: LS;
};

export type Messages = {
  appointmentIntro: LS;
  appointmentSuccess: LS;
  emergencyNotice: LS;
  footerDisclaimer: LS;
};

export type PrescriptionTemplateMedicine = {
  name: string;
  generic: string;
  type: "generic" | "brand";
  form: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  specialNote: string;
};

export type PrescriptionTemplate = {
  id: string;
  name: string;
  medicines: PrescriptionTemplateMedicine[];
  advices: string[];
};

export type BlogConfig = {
  categories: string[]; // predefined categories
  defaultDisclaimer: string; // global medical disclaimer
};

export type SiteSettings = {
  // Metadata / SEO
  siteTitle: LS;
  metaDescription: LS;
  metaKeywords: string[];
  // Branding
  logoText: LS;
  logoSubtitle: LS;
  // Language + features
  defaultLanguage: Locale;
  appointmentsEnabled: boolean;
  // Fee structure
  feeStructure: {
    firstVisit: number;
    within7Days: number;
    within30Days: number;
    after30Days: number;
  };
  // Doctor profile
  doctor: {
    name: LS;
    title: LS;
    department: LS;
    hospital: LS;
    location: LS;
    tagline: LS;
    intro: LS;
    bio: LS; // multiline, paragraphs separated by blank lines
    initials?: string;
    photo?: string; // uploaded image URL
  };
  contact: Contact;
  socials: Socials;
  // Home page text
  home: HomeText;
  messages: Messages;
  // Lists
  menu: MenuItem[];
  stats: Stat[];
  specialties: Specialty[];
  education: Education[];
  experience: Experience[];
  // Appointment configuration
  timeSlots: string[]; // legacy fixed slots (kept for backward compatibility)
  availability: Availability; // legacy single schedule (kept for migration)
  appointment: AppointmentConfig;
  email: EmailConfig;
  prescription: PrescriptionConfig;
  prescriptionTemplates: PrescriptionTemplate[];
  // Blog configuration
  blog: BlogConfig;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: LS;
  excerpt: LS;
  date: string; // YYYY-MM-DD
  readingMinutes: number;
  tags: string[];
  body: LS; // markdown, per language
  coverImage?: string;
  published: boolean;
  updatedAt: string; // ISO timestamp
  category: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  reviewedBy: string;
  reviewedDate: string;
  references: string;
  disclaimer: string;
  scheduledDate: string;
  viewCount: number;
};

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type AppointmentMode = "online" | "offline";

export type Appointment = {
  id: string;
  name: string;
  email: string;
  phone: string;
  mode: AppointmentMode;
  location: string; // chamber name, or "Online"
  date: string; // preferred date (YYYY-MM-DD)
  time: string; // preferred time slot
  reason: string;
  status: AppointmentStatus;
  createdAt: string; // ISO timestamp
};

export type AppointmentInput = Omit<
  Appointment,
  "id" | "status" | "createdAt"
>;

export type AdminUser = {
  id: string;
  username: string;
  salt: string;
  hash: string;
  role: "DOCTOR" | "ATTENDANT";
  displayName: string;
  active: boolean;
  permissions: Record<string, boolean>;
};
