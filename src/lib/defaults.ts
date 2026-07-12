// -----------------------------------------------------------------------------
// Default content used to seed the data store on first run. Everything is
// editable from the admin panel afterwards. Bangla is provided for the most
// visible strings; where Bangla is empty the site falls back to English.
// Placeholders that need real info are marked with "TODO:".
// -----------------------------------------------------------------------------

import type { BlogPost, SiteSettings } from "./types";
import { ls } from "./i18n";
import { defaultAvailability, defaultAppointmentConfig } from "./availability";

export const defaultSettings: SiteSettings = {
  siteTitle: ls("Dr. Mahmud ul Hasan Miju", "ডা. মাহমুদ উল হাসান মিজু"),
  metaDescription: ls(
    "Dr. Mahmud ul Hasan Miju is an Assistant Registrar at Faridpur Medical College Hospital, committed to compassionate, evidence-based patient care.",
    "ডা. মাহমুদ উল হাসান মিজু ফরিদপুর মেডিকেল কলেজ হাসপাতালের একজন সহকারী রেজিস্ট্রার, সহানুভূতিশীল ও প্রমাণভিত্তিক রোগীসেবায় প্রতিশ্রুতিবদ্ধ।"
  ),
  metaKeywords: [
    "Dr. Mahmud ul Hasan Miju",
    "doctor",
    "physician",
    "Faridpur Medical College Hospital",
    "Faridpur",
    "appointment",
    "medicine",
  ],
  logoText: ls("Dr. Mahmud ul Hasan Miju", "ডা. মাহমুদ উল হাসান মিজু"),
  logoSubtitle: ls(
    "Assistant Registrar, Faridpur Medical College Hospital",
    "সহকারী রেজিস্ট্রার, ফরিদপুর মেডিকেল কলেজ হাসপাতাল"
  ),
  defaultLanguage: "en",
  appointmentsEnabled: true,
  feeStructure: {
    firstVisit: 500,
    within7Days: 300,
    within30Days: 200,
    after30Days: 500,
  },
  doctor: {
    name: ls("Dr. Mahmud ul Hasan Miju", "ডা. মাহমুদ উল হাসান মিজু"),
    title: ls("Assistant Registrar", "সহকারী রেজিস্ট্রার"),
    department: ls("Department of Medicine", "মেডিসিন বিভাগ"),
    hospital: ls(
      "Faridpur Medical College Hospital",
      "ফরিদপুর মেডিকেল কলেজ হাসপাতাল"
    ),
    location: ls("Faridpur, Bangladesh", "ফরিদপুর, বাংলাদেশ"),
    tagline: ls(
      "Committed to compassionate, evidence-based patient care.",
      "সহানুভূতিশীল, প্রমাণভিত্তিক রোগীসেবায় প্রতিশ্রুতিবদ্ধ।"
    ),
    intro: ls(
      "I am a physician serving as Assistant Registrar at Faridpur Medical College Hospital. My focus is on delivering quality clinical care, supporting medical education, and sharing knowledge that helps patients and colleagues alike.",
      "আমি ফরিদপুর মেডিকেল কলেজ হাসপাতালে সহকারী রেজিস্ট্রার হিসেবে কর্মরত একজন চিকিৎসক। মানসম্পন্ন চিকিৎসা সেবা প্রদান, চিকিৎসা শিক্ষায় সহায়তা এবং রোগী ও সহকর্মীদের জন্য উপকারী জ্ঞান ভাগ করে নেওয়াই আমার লক্ষ্য।"
    ),
    bio: ls(
      "Dr. Mahmud ul Hasan Miju is an Assistant Registrar at Faridpur Medical College Hospital, one of the leading tertiary care and teaching hospitals in the Faridpur region of Bangladesh.\n\nIn his role he is involved in day-to-day patient management, supervision of junior doctors and interns, ward rounds, and clinical decision-making alongside senior consultants. He is passionate about bedside teaching and continuous professional development.\n\nBeyond clinical duties, Dr. Mahmud writes about his experiences in the wards, public health in Bangladesh, and practical guidance for patients and their families.",
      "ডা. মাহমুদ উল হাসান মিজু ফরিদপুর মেডিকেল কলেজ হাসপাতালের একজন সহকারী রেজিস্ট্রার, যা বাংলাদেশের ফরিদপুর অঞ্চলের অন্যতম প্রধান টারশিয়ারি ও শিক্ষা হাসপাতাল।\n\nতাঁর দায়িত্বের মধ্যে রয়েছে দৈনন্দিন রোগী ব্যবস্থাপনা, জুনিয়র চিকিৎসক ও ইন্টার্নদের তত্ত্বাবধান, ওয়ার্ড রাউন্ড এবং সিনিয়র কনসালট্যান্টদের সাথে ক্লিনিক্যাল সিদ্ধান্ত গ্রহণ। তিনি বেডসাইড শিক্ষাদান ও ক্রমাগত পেশাগত উন্নয়নে আগ্রহী।"
    ),
    initials: "",
    photo: "",
  },
  contact: {
    email: "info@drmahmudmiju.com", // TODO: real email
    phone: "+880 1XXX-XXXXXX", // TODO: real phone
    address: ls(
      "Faridpur Medical College Hospital, Faridpur, Bangladesh",
      "ফরিদপুর মেডিকেল কলেজ হাসপাতাল, ফরিদপুর, বাংলাদেশ"
    ),
    chamberHours: ls(
      "Saturday – Thursday, 6:00 PM – 9:00 PM",
      "শনিবার – বৃহস্পতিবার, সন্ধ্যা ৬টা – রাত ৯টা"
    ),
  },
  socials: { facebook: "", linkedin: "", twitter: "" },
  home: {
    heroBadge: ls(
      "Assistant Registrar · Faridpur Medical College Hospital",
      "সহকারী রেজিস্ট্রার · ফরিদপুর মেডিকেল কলেজ হাসপাতাল"
    ),
    ctaPrimaryLabel: ls("Book an Appointment", "অ্যাপয়েন্টমেন্ট নিন"),
    ctaSecondaryLabel: ls("Learn More", "আরও জানুন"),
    areasHeading: ls("Areas of Care", "সেবার ক্ষেত্রসমূহ"),
    areasSubtitle: ls(
      "Providing comprehensive medical care with a patient-first approach.",
      "রোগী-কেন্দ্রিক দৃষ্টিভঙ্গিতে ব্যাপক চিকিৎসা সেবা প্রদান।"
    ),
    latestHeading: ls("Latest Articles", "সাম্প্রতিক লেখা"),
    latestSubtitle: ls(
      "Notes from the ward and guidance for patients.",
      "ওয়ার্ড থেকে নোট ও রোগীদের জন্য পরামর্শ।"
    ),
    bottomCtaHeading: ls("Need to see a doctor?", "ডাক্তার দেখাতে চান?"),
    bottomCtaSubtitle: ls(
      "Request an appointment online — it only takes a minute.",
      "অনলাইনে অ্যাপয়েন্টমেন্টের অনুরোধ করুন — মাত্র এক মিনিট।"
    ),
  },
  messages: {
    appointmentIntro: ls(
      "Fill in the form below to request an appointment. You will receive a confirmation from our team.",
      "অ্যাপয়েন্টমেন্টের অনুরোধ করতে নিচের ফর্মটি পূরণ করুন। আমাদের দল থেকে আপনি একটি নিশ্চিতকরণ পাবেন।"
    ),
    appointmentSuccess: ls(
      "Your appointment request has been received. We will contact you to confirm.",
      "আপনার অ্যাপয়েন্টমেন্টের অনুরোধ গ্রহণ করা হয়েছে। নিশ্চিত করতে আমরা আপনার সাথে যোগাযোগ করব।"
    ),
    emergencyNotice: ls(
      "This form is for non-urgent appointment requests only. If you are experiencing a medical emergency, please go to the nearest emergency department or call your local emergency services immediately.",
      "এই ফর্মটি শুধুমাত্র জরুরি নয় এমন অ্যাপয়েন্টমেন্টের জন্য। আপনি যদি চিকিৎসা জরুরি অবস্থায় থাকেন, অনুগ্রহ করে নিকটস্থ জরুরি বিভাগে যান বা অবিলম্বে স্থানীয় জরুরি সেবায় কল করুন।"
    ),
    footerDisclaimer: ls(
      "This website is for informational purposes and does not replace professional medical advice.",
      "এই ওয়েবসাইটটি তথ্যের উদ্দেশ্যে এবং পেশাদার চিকিৎসা পরামর্শের বিকল্প নয়।"
    ),
  },
  menu: [
    { href: "/", label: ls("Home", "হোম") },
    { href: "/about", label: ls("About", "পরিচিতি") },
    { href: "/blog", label: ls("Blog", "ব্লগ") },
    { href: "/appointment", label: ls("Book Appointment", "অ্যাপয়েন্টমেন্ট") },
  ],
  stats: [
    { value: "8+", label: ls("Years of Experience", "বছরের অভিজ্ঞতা") },
    { value: "10,000+", label: ls("Patients Cared For", "রোগীর সেবা") },
    { value: "3", label: ls("Published Articles", "প্রকাশিত লেখা") },
    { value: "FMCH", label: ls("Hospital", "হাসপাতাল") },
  ],
  specialties: [
    {
      icon: "stethoscope",
      title: ls("General Medicine", "সাধারণ মেডিসিন"),
      description: ls(
        "Diagnosis and management of common and complex medical conditions in adults, including infectious, metabolic, and chronic diseases.",
        "সংক্রামক, বিপাকীয় ও দীর্ঘমেয়াদি রোগসহ প্রাপ্তবয়স্কদের সাধারণ ও জটিল রোগ নির্ণয় ও ব্যবস্থাপনা।"
      ),
    },
    {
      icon: "bed",
      title: ls("Inpatient & Ward Care", "ভর্তি ও ওয়ার্ড সেবা"),
      description: ls(
        "Comprehensive inpatient management, ward rounds, and coordination of multidisciplinary care for admitted patients.",
        "ভর্তি রোগীদের জন্য ব্যাপক ব্যবস্থাপনা, ওয়ার্ড রাউন্ড এবং বহু-বিভাগীয় সেবার সমন্বয়।"
      ),
    },
    {
      icon: "shield",
      title: ls("Preventive Health", "প্রতিরোধমূলক স্বাস্থ্য"),
      description: ls(
        "Guidance on lifestyle, screening, and preventive strategies to reduce the burden of chronic illness.",
        "দীর্ঘমেয়াদি অসুস্থতার ঝুঁকি কমাতে জীবনযাত্রা, স্ক্রিনিং ও প্রতিরোধমূলক কৌশল নিয়ে পরামর্শ।"
      ),
    },
    {
      icon: "book",
      title: ls("Medical Education", "চিকিৎসা শিক্ষা"),
      description: ls(
        "Teaching and mentoring of interns and junior doctors, with a focus on evidence-based clinical practice.",
        "প্রমাণভিত্তিক ক্লিনিক্যাল অনুশীলনের উপর জোর দিয়ে ইন্টার্ন ও জুনিয়র চিকিৎসকদের শিক্ষাদান ও পরামর্শ।"
      ),
    },
  ],
  education: [
    {
      degree: ls(
        "MBBS (Bachelor of Medicine, Bachelor of Surgery)",
        "এমবিবিএস"
      ),
      institution: ls("Medical College", "মেডিকেল কলেজ"),
      year: "20XX",
    },
    {
      degree: ls("FCPS / MD (Medicine)", "এফসিপিএস / এমডি (মেডিসিন)"),
      institution: ls(
        "Bangladesh College of Physicians and Surgeons",
        "বাংলাদেশ কলেজ অব ফিজিশিয়ান্স অ্যান্ড সার্জনস"
      ),
      year: "20XX",
    },
  ],
  experience: [
    {
      role: ls("Assistant Registrar", "সহকারী রেজিস্ট্রার"),
      place: ls(
        "Faridpur Medical College Hospital",
        "ফরিদপুর মেডিকেল কলেজ হাসপাতাল"
      ),
      period: ls("Present", "বর্তমান"),
      description: ls(
        "Patient management, supervision of junior doctors, ward rounds, and clinical teaching.",
        "রোগী ব্যবস্থাপনা, জুনিয়র চিকিৎসকদের তত্ত্বাবধান, ওয়ার্ড রাউন্ড ও ক্লিনিক্যাল শিক্ষাদান।"
      ),
    },
    {
      role: ls("Indoor Medical Officer / Registrar", "ইনডোর মেডিকেল অফিসার / রেজিস্ট্রার"),
      place: ls(
        "Faridpur Medical College Hospital",
        "ফরিদপুর মেডিকেল কলেজ হাসপাতাল"
      ),
      period: ls("Previous", "পূর্ববর্তী"),
      description: ls(
        "Provided round-the-clock inpatient care and emergency management.",
        "সার্বক্ষণিক ভর্তি রোগীর সেবা ও জরুরি ব্যবস্থাপনা প্রদান।"
      ),
    },
    {
      role: ls("Medical Officer", "মেডিকেল অফিসার"),
      place: ls("Upazila Health Complex", "উপজেলা স্বাস্থ্য কমপ্লেক্স"),
      period: ls("Earlier", "পূর্বে"),
      description: ls(
        "Delivered primary and emergency care to the community at the upazila level.",
        "উপজেলা পর্যায়ে সম্প্রদায়ের জন্য প্রাথমিক ও জরুরি সেবা প্রদান।"
      ),
    },
  ],
  timeSlots: [
    "06:00 PM",
    "06:30 PM",
    "07:00 PM",
    "07:30 PM",
    "08:00 PM",
    "08:30 PM",
  ],
  availability: defaultAvailability,
  appointment: defaultAppointmentConfig,
  email: {
    enabled: false,
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    from: "",
  },
  prescription: {
    header: {
      leftLines: [
        "ডা. মাহমুদ উল হাসান মিজু",
        "এমবিবিএস",
        "সহকারী রেজিস্ট্রার",
        "ফরিদপুর মেডিকেল কলেজ হাসপাতাল",
      ],
      rightLines: [
        "Dr. Mahmud ul Hasan Miju",
        "MBBS",
        "Assistant Registrar",
        "Faridpur Medical College Hospital",
      ],
      contactLines: [
        "Phone: +880 1XXX-XXXXXX",
        "Email: info@drmahmudmiju.com",
      ],
    },
    footer: {
      leftText: "",
      centerText: "Generated digitally",
      rightText: "",
    },
    predefinedAdvices: [
      "ঠাণ্ডা, ধুলাবালি এড়িয়ে চলবেন",
      "সময়মত ঔষধ সেবন করুন",
      "চিনি ও মিষ্টি জাতীয় খাবার পরিহার করুন",
      "লাল মাংস, লবণ, চর্বি যুক্ত খাবার নিষেধ",
      "প্রচুর পানি পান করুন",
      "পর্যাপ্ত বিশ্রাম নিন",
      "নিয়মিত হাঁটুন / ব্যায়াম করুন",
      "ধূমপান / তামাক পরিহার করুন",
      "রক্তচাপ নিয়মিত মাপুন",
      "ওজন নিয়ন্ত্রণে রাখুন",
    ],
    predefinedDiagnoses: [
      "B. Asthma",
      "Allergic Rhinitis (AR)",
      "Sinusitis",
      "HTN (Hypertension)",
      "DM (Diabetes Mellitus)",
      "GERD",
      "UTI",
      "COPD",
      "IBS",
      "Pneumonia",
      "Bronchitis",
      "Pharyngitis",
      "Tonsillitis",
      "Peptic Ulcer Disease",
      "Thyroid Disorder",
      "Migraine",
      "Tension Headache",
      "Vertigo (BPPV)",
      "Anemia",
      "Dyslipidemia",
      "Osteoarthritis",
      "Rheumatoid Arthritis",
      "CKD",
      "Heart Failure",
      "Atrial Fibrillation",
    ],
    timingOptions: [
      "খাওয়ার আগে",
      "খাওয়ার পরে",
      "খালি পেটে",
      "ঘুমানোর আগে",
      "সকালে",
      "রাতে",
      "প্রয়োজনে",
      "ব্যবহারের পর কুলি করবেন",
      "উভয় নাসারন্ধ্রে",
      "Before meal",
      "After meal",
      "Empty stomach",
      "At bedtime",
      "As needed",
    ],
    followUpOptions: [
      "৭ দিন পর",
      "১৪ দিন পর",
      "১ মাস পর",
      "২ মাস পর",
      "৩ মাস পর",
      "৪ সপ্তাহ পর",
      "৬ সপ্তাহ পর",
      "প্রয়োজনে",
      "After 7 days",
      "After 1 month",
      "After 3 months",
    ],
  },
  prescriptionTemplates: [],
  blog: {
    categories: ["Patient Education", "Health Tips", "Clinical Notes", "Research", "Preventive Health", "News"],
    defaultDisclaimer: "This content is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider.",
  },
};

export const defaultPosts: BlogPost[] = [
  {
    id: "seed-1",
    slug: "a-day-in-the-medicine-ward",
    title: ls("A Day in the Medicine Ward", "মেডিসিন ওয়ার্ডে একটি দিন"),
    excerpt: ls(
      "What a typical day looks like for an Assistant Registrar — from early morning rounds to late-night admissions.",
      "একজন সহকারী রেজিস্ট্রারের একটি সাধারণ দিন কেমন — ভোরের রাউন্ড থেকে গভীর রাতের ভর্তি পর্যন্ত।"
    ),
    date: "2026-06-12",
    readingMinutes: 5,
    tags: ["Ward Life", "Clinical Care"],
    coverImage: "",
    published: true,
    updatedAt: "2026-06-12T08:00:00.000Z",
    category: "Clinical Notes",
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    reviewedBy: "",
    reviewedDate: "",
    references: "",
    disclaimer: "",
    scheduledDate: "",
    viewCount: 0,
    body: ls(
      `A day in the medicine ward begins long before the sun is fully up. As an Assistant Registrar at Faridpur Medical College Hospital, my morning starts with reviewing overnight events, checking on critically ill patients, and preparing for the day's rounds.

## Morning Rounds

Rounds are the heart of inpatient medicine. Together with interns and junior doctors, we move bed to bed — reviewing progress, adjusting treatment, and explaining plans to patients and their families.

## The Value of Communication

Much of good medicine is good communication. Taking a moment to explain a diagnosis in plain language is as important as any prescription.

> The good physician treats the disease; the great physician treats the patient who has the disease.

By evening, the pace rarely slows. New admissions arrive, and the cycle continues. It is demanding work — but deeply meaningful.`,
      `মেডিসিন ওয়ার্ডে দিন শুরু হয় সূর্য ওঠার অনেক আগেই। ফরিদপুর মেডিকেল কলেজ হাসপাতালের সহকারী রেজিস্ট্রার হিসেবে আমার সকাল শুরু হয় রাতের ঘটনাগুলো পর্যালোচনা, সংকটাপন্ন রোগীদের দেখা এবং দিনের রাউন্ডের প্রস্তুতির মধ্য দিয়ে।

## সকালের রাউন্ড

রাউন্ড হলো ভর্তি রোগীর চিকিৎসার প্রাণ। ইন্টার্ন ও জুনিয়র চিকিৎসকদের সাথে আমরা বেড থেকে বেডে যাই — অগ্রগতি পর্যালোচনা করি, চিকিৎসা সমন্বয় করি এবং রোগী ও তাদের পরিবারকে পরিকল্পনা বুঝিয়ে বলি।

## যোগাযোগের গুরুত্ব

ভালো চিকিৎসার অনেকটাই ভালো যোগাযোগ। সহজ ভাষায় রোগ ব্যাখ্যা করা যেকোনো প্রেসক্রিপশনের মতোই গুরুত্বপূর্ণ।

> ভালো চিকিৎসক রোগের চিকিৎসা করেন; মহান চিকিৎসক সেই রোগীর চিকিৎসা করেন যার রোগ হয়েছে।`
    ),
  },
  {
    id: "seed-2",
    slug: "understanding-hypertension",
    title: ls(
      "Understanding Hypertension: A Guide for Patients",
      "উচ্চ রক্তচাপ বোঝা: রোগীদের জন্য একটি নির্দেশিকা"
    ),
    excerpt: ls(
      "High blood pressure is common and often silent. Here is what every patient should know about controlling it.",
      "উচ্চ রক্তচাপ সাধারণ এবং প্রায়ই নীরব। এটি নিয়ন্ত্রণ সম্পর্কে প্রতিটি রোগীর যা জানা উচিত।"
    ),
    date: "2026-05-20",
    readingMinutes: 6,
    tags: ["Patient Education", "Preventive Health"],
    coverImage: "",
    published: true,
    updatedAt: "2026-05-20T08:00:00.000Z",
    category: "Patient Education",
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    reviewedBy: "",
    reviewedDate: "",
    references: "",
    disclaimer: "",
    scheduledDate: "",
    viewCount: 0,
    body: ls(
      `Hypertension, or high blood pressure, is one of the most common conditions I see. It often has no symptoms, which is why it is sometimes called the **silent killer**.

## Why It Matters

Left uncontrolled, high blood pressure increases the risk of stroke, heart attack, and kidney disease.

## Simple Steps You Can Take

- Reduce salt in your diet.
- Stay physically active — even a daily walk helps.
- Maintain a healthy weight.
- Take prescribed medication regularly, even when you feel well.

If you have been diagnosed with hypertension, please do not stop your medication on your own.`,
      `উচ্চ রক্তচাপ আমার দেখা সবচেয়ে সাধারণ সমস্যাগুলোর একটি। এর প্রায়ই কোনো উপসর্গ থাকে না, তাই একে কখনও কখনও **নীরব ঘাতক** বলা হয়।

## কেন এটি গুরুত্বপূর্ণ

অনিয়ন্ত্রিত থাকলে উচ্চ রক্তচাপ স্ট্রোক, হার্ট অ্যাটাক ও কিডনি রোগের ঝুঁকি বাড়ায়।

## সহজ কিছু পদক্ষেপ

- খাবারে লবণ কমান।
- শারীরিকভাবে সক্রিয় থাকুন — প্রতিদিন হাঁটাও সহায়ক।
- স্বাস্থ্যকর ওজন বজায় রাখুন।
- ভালো বোধ করলেও নিয়মিত নির্ধারিত ওষুধ খান।

উচ্চ রক্তচাপ ধরা পড়লে অনুগ্রহ করে নিজে থেকে ওষুধ বন্ধ করবেন না।`
    ),
  },
  {
    id: "seed-3",
    slug: "mentoring-the-next-generation",
    title: ls(
      "Mentoring the Next Generation of Doctors",
      "পরবর্তী প্রজন্মের চিকিৎসকদের গড়ে তোলা"
    ),
    excerpt: ls(
      "Reflections on teaching interns and junior doctors, and why mentorship matters.",
      "ইন্টার্ন ও জুনিয়র চিকিৎসকদের শেখানো এবং মেন্টরশিপ কেন গুরুত্বপূর্ণ তা নিয়ে ভাবনা।"
    ),
    date: "2026-04-08",
    readingMinutes: 4,
    tags: ["Medical Education", "Mentorship"],
    coverImage: "",
    published: true,
    updatedAt: "2026-04-08T08:00:00.000Z",
    category: "Clinical Notes",
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    reviewedBy: "",
    reviewedDate: "",
    references: "",
    disclaimer: "",
    scheduledDate: "",
    viewCount: 0,
    body: ls(
      `One of the most rewarding parts of my role is working with interns and junior doctors. They bring energy and fresh questions that keep all of us sharp.

## Learning by Doing

Medicine is learned at the bedside. I try to give trainees responsibility while providing a safety net.

Investing in the next generation of physicians is an investment in the health of our entire community.`,
      `আমার কাজের অন্যতম আনন্দদায়ক দিক হলো ইন্টার্ন ও জুনিয়র চিকিৎসকদের সাথে কাজ করা। তারা এমন উদ্যম ও নতুন প্রশ্ন নিয়ে আসে যা আমাদের সবাইকে সজাগ রাখে।

## করে শেখা

চিকিৎসা শেখা হয় রোগীর পাশে। আমি প্রশিক্ষণার্থীদের দায়িত্ব দেওয়ার চেষ্টা করি, পাশাপাশি একটি নিরাপত্তা বলয়ও রাখি।

পরবর্তী প্রজন্মের চিকিৎসকদের জন্য বিনিয়োগ মানে আমাদের পুরো সম্প্রদায়ের স্বাস্থ্যে বিনিয়োগ।`
    ),
  },
];
