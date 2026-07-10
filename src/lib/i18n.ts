// -----------------------------------------------------------------------------
// Bilingual (English / Bangla) support (client-safe: no server-only imports).
//   - LocalizedString holds both languages: { en, bn }.
//   - t() resolves a LocalizedString (or plain string) for a locale, with
//     fallback to English so nothing ever renders blank.
//   - UI holds translations for fixed interface strings (buttons, labels).
// Server-only getLocale() lives in ./i18n-server.
// -----------------------------------------------------------------------------

export type Locale = "en" | "bn";
export const LOCALES: Locale[] = ["en", "bn"];
export const LOCALE_COOKIE = "locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  bn: "বাংলা",
};

export type LocalizedString = { en: string; bn: string };

export function ls(en: string, bn = ""): LocalizedString {
  return { en, bn };
}

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "bn";
}

/** Resolve a localized value for a locale, falling back to English. */
export function t(
  value: LocalizedString | string | undefined | null,
  locale: Locale
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const picked = value[locale];
  if (picked && picked.trim()) return picked;
  return value.en ?? "";
}

/** Coerce any value (legacy plain string or object) into a LocalizedString. */
export function toLS(value: unknown): LocalizedString {
  if (typeof value === "string") return { en: value, bn: "" };
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return {
      en: typeof v.en === "string" ? v.en : "",
      bn: typeof v.bn === "string" ? v.bn : "",
    };
  }
  return { en: "", bn: "" };
}

// Fixed interface strings used across public pages.
export const UI = {
  read: ls("Read →", "পড়ুন →"),
  viewAll: ls("View all →", "সব দেখুন →"),
  viewAllArticles: ls("View all articles →", "সব লেখা দেখুন →"),
  backToArticles: ls("← Back to all articles", "← সব লেখায় ফিরে যান"),
  minRead: ls("min read", "মিনিট পড়া"),
  by: ls("By", "লিখেছেন"),
  blogHeading: ls("Articles & Reflections", "লেখা ও ভাবনা"),
  blogIntro: ls(
    "Notes from the ward, patient education, and thoughts on medical practice.",
    "ওয়ার্ড থেকে নোট, রোগী-শিক্ষা এবং চিকিৎসা অনুশীলন নিয়ে ভাবনা।"
  ),
  noArticles: ls("No articles published yet. Check back soon.", "এখনও কোনো লেখা প্রকাশিত হয়নি। শীঘ্রই আবার দেখুন।"),
  aboutLabel: ls("About", "পরিচিতি"),
  biography: ls("Biography", "জীবনী"),
  experienceHeading: ls("Experience", "অভিজ্ঞতা"),
  educationHeading: ls("Education & Qualifications", "শিক্ষা ও যোগ্যতা"),
  areasOfCare: ls("Areas of Care", "সেবার ক্ষেত্রসমূহ"),
  chamberContact: ls("Chamber & Contact", "চেম্বার ও যোগাযোগ"),
  bookAppointment: ls("Book an Appointment", "অ্যাপয়েন্টমেন্ট নিন"),
  appointmentsLabel: ls("Appointments", "অ্যাপয়েন্টমেন্ট"),
  chamberInfo: ls("Chamber Information", "চেম্বারের তথ্য"),
  location: ls("Location", "অবস্থান"),
  hours: ls("Hours", "সময়"),
  phone: ls("Phone", "ফোন"),
  email: ls("Email", "ইমেইল"),
  forEmergencies: ls("For Emergencies", "জরুরি অবস্থার জন্য"),
  fullName: ls("Full Name", "পূর্ণ নাম"),
  preferredDate: ls("Preferred Date", "পছন্দের তারিখ"),
  preferredTime: ls("Preferred Time", "পছন্দের সময়"),
  selectTimeSlot: ls("Select a time slot", "একটি সময় নির্বাচন করুন"),
  reasonForVisit: ls("Reason for Visit", "আসার কারণ"),
  reasonPlaceholder: ls(
    "Briefly describe your symptoms or reason for the appointment (optional)",
    "আপনার উপসর্গ বা অ্যাপয়েন্টমেন্টের কারণ সংক্ষেপে লিখুন (ঐচ্ছিক)"
  ),
  requestAppointment: ls("Request Appointment", "অ্যাপয়েন্টমেন্টের অনুরোধ"),
  submitting: ls("Submitting...", "জমা হচ্ছে..."),
  requestReceived: ls("Request Received", "অনুরোধ গৃহীত হয়েছে"),
  bookAnother: ls("Book Another", "আরেকটি বুক করুন"),
  formNote: ls(
    "This is an appointment request. Our team will contact you to confirm the final date and time.",
    "এটি একটি অ্যাপয়েন্টমেন্ট অনুরোধ। চূড়ান্ত তারিখ ও সময় নিশ্চিত করতে আমাদের দল আপনার সাথে যোগাযোগ করবে।"
  ),
  bookingUnavailable: ls("Online booking is currently unavailable", "অনলাইন বুকিং বর্তমানে উপলব্ধ নয়"),
  bookingUnavailableMsg: ls(
    "Please contact the chamber directly to arrange an appointment.",
    "অনুগ্রহ করে অ্যাপয়েন্টমেন্টের জন্য সরাসরি চেম্বারে যোগাযোগ করুন।"
  ),
  quickLinks: ls("Quick Links", "দ্রুত লিঙ্ক"),
  contact: ls("Contact", "যোগাযোগ"),
  chamber: ls("Chamber", "চেম্বার"),
  allRightsReserved: ls("All rights reserved.", "সর্বস্বত্ব সংরক্ষিত।"),
};
