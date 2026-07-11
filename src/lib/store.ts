// -----------------------------------------------------------------------------
// JSON-file backed data store for editable site content (settings + blog posts).
// Reads normalize legacy plain-string fields into LocalizedString so older
// stored data keeps working after the bilingual migration.
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type {
  BlogPost,
  SiteSettings,
  Stat,
  Specialty,
  Education,
  Experience,
  MenuItem,
} from "./types";
import { toLS, isLocale, type LocalizedString } from "./i18n";
import { defaultSettings, defaultPosts } from "./defaults";
import { normalizeAvailability, normalizeAppointmentConfig } from "./availability";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDir();
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

async function writeJson<T>(file: string, value: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

// ---- Settings normalization ------------------------------------------------

function normalizeFeeStructure(raw: unknown): import("./types").SiteSettings["feeStructure"] {
  const d = defaultSettings.feeStructure;
  const f = (raw ?? {}) as Record<string, unknown>;
  return {
    firstVisit: typeof f.firstVisit === "number" ? f.firstVisit : d.firstVisit,
    within7Days: typeof f.within7Days === "number" ? f.within7Days : d.within7Days,
    within30Days: typeof f.within30Days === "number" ? f.within30Days : d.within30Days,
    after30Days: typeof f.after30Days === "number" ? f.after30Days : d.after30Days,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeSettings(raw: any): SiteSettings {
  const d = defaultSettings;
  const s = raw && typeof raw === "object" ? raw : {};
  const doctor = s.doctor ?? {};
  const contact = s.contact ?? {};
  const home = s.home ?? {};
  const messages = s.messages ?? {};

  const lsField = (v: unknown, fallback: LocalizedString) =>
    v === undefined ? fallback : toLS(v);

  return {
    siteTitle: lsField(s.siteTitle, d.siteTitle),
    metaDescription: lsField(s.metaDescription, d.metaDescription),
    metaKeywords: Array.isArray(s.metaKeywords)
      ? s.metaKeywords
      : d.metaKeywords,
    logoText: lsField(s.logoText, d.logoText),
    logoSubtitle: lsField(s.logoSubtitle, d.logoSubtitle),
    defaultLanguage: isLocale(s.defaultLanguage)
      ? s.defaultLanguage
      : d.defaultLanguage,
    appointmentsEnabled:
      typeof s.appointmentsEnabled === "boolean"
        ? s.appointmentsEnabled
        : d.appointmentsEnabled,
    feeStructure: normalizeFeeStructure(s.feeStructure),
    doctor: {
      name: lsField(doctor.name, d.doctor.name),
      title: lsField(doctor.title, d.doctor.title),
      department: lsField(doctor.department, d.doctor.department),
      hospital: lsField(doctor.hospital, d.doctor.hospital),
      location: lsField(doctor.location, d.doctor.location),
      tagline: lsField(doctor.tagline, d.doctor.tagline),
      intro: lsField(doctor.intro, d.doctor.intro),
      bio: lsField(doctor.bio, d.doctor.bio),
      initials: typeof doctor.initials === "string" ? doctor.initials : "",
      photo: typeof doctor.photo === "string" ? doctor.photo : "",
    },
    contact: {
      email: typeof contact.email === "string" ? contact.email : d.contact.email,
      phone: typeof contact.phone === "string" ? contact.phone : d.contact.phone,
      address: lsField(contact.address, d.contact.address),
      chamberHours: lsField(contact.chamberHours, d.contact.chamberHours),
    },
    socials: { ...d.socials, ...(s.socials ?? {}) },
    home: {
      heroBadge: lsField(home.heroBadge, d.home.heroBadge),
      ctaPrimaryLabel: lsField(home.ctaPrimaryLabel, d.home.ctaPrimaryLabel),
      ctaSecondaryLabel: lsField(
        home.ctaSecondaryLabel,
        d.home.ctaSecondaryLabel
      ),
      areasHeading: lsField(home.areasHeading, d.home.areasHeading),
      areasSubtitle: lsField(home.areasSubtitle, d.home.areasSubtitle),
      latestHeading: lsField(home.latestHeading, d.home.latestHeading),
      latestSubtitle: lsField(home.latestSubtitle, d.home.latestSubtitle),
      bottomCtaHeading: lsField(home.bottomCtaHeading, d.home.bottomCtaHeading),
      bottomCtaSubtitle: lsField(
        home.bottomCtaSubtitle,
        d.home.bottomCtaSubtitle
      ),
    },
    messages: {
      appointmentIntro: lsField(
        messages.appointmentIntro,
        d.messages.appointmentIntro
      ),
      appointmentSuccess: lsField(
        messages.appointmentSuccess,
        d.messages.appointmentSuccess
      ),
      emergencyNotice: lsField(
        messages.emergencyNotice,
        d.messages.emergencyNotice
      ),
      footerDisclaimer: lsField(
        messages.footerDisclaimer,
        d.messages.footerDisclaimer
      ),
    },
    menu: Array.isArray(s.menu)
      ? s.menu.map(
          (m: any): MenuItem => ({
            href: typeof m.href === "string" ? m.href : "/",
            label: toLS(m.label),
          })
        )
      : d.menu,
    stats: Array.isArray(s.stats)
      ? s.stats.map(
          (m: any): Stat => ({
            value: typeof m.value === "string" ? m.value : "",
            label: toLS(m.label),
          })
        )
      : d.stats,
    specialties: Array.isArray(s.specialties)
      ? s.specialties.map(
          (m: any): Specialty => ({
            icon: typeof m.icon === "string" ? m.icon : "stethoscope",
            title: toLS(m.title),
            description: toLS(m.description),
          })
        )
      : d.specialties,
    education: Array.isArray(s.education)
      ? s.education.map(
          (m: any): Education => ({
            degree: toLS(m.degree),
            institution: toLS(m.institution),
            year: typeof m.year === "string" ? m.year : "",
          })
        )
      : d.education,
    experience: Array.isArray(s.experience)
      ? s.experience.map(
          (m: any): Experience => ({
            role: toLS(m.role),
            place: toLS(m.place),
            period: toLS(m.period),
            description: toLS(m.description),
          })
        )
      : d.experience,
    timeSlots: Array.isArray(s.timeSlots) ? s.timeSlots : d.timeSlots,
    availability: normalizeAvailability(s.availability),
    appointment: normalizeAppointmentConfig(
      s.appointment,
      normalizeAvailability(s.availability)
    ),
    email: normalizeEmail(s.email),
    prescription: normalizePrescriptionConfig(s.prescription),
    prescriptionTemplates: Array.isArray(s.prescriptionTemplates) ? s.prescriptionTemplates : [],
  };
}

function normalizePrescriptionConfig(raw: unknown): import("./types").PrescriptionConfig {
  const p = (raw ?? {}) as Record<string, unknown>;
  const d = defaultSettings.prescription;
  const h = (p.header ?? {}) as Record<string, unknown>;
  const f = (p.footer ?? {}) as Record<string, unknown>;
  return {
    header: {
      leftLines: Array.isArray(h.leftLines) ? h.leftLines : d.header.leftLines,
      rightLines: Array.isArray(h.rightLines) ? h.rightLines : d.header.rightLines,
      contactLines: Array.isArray(h.contactLines) ? h.contactLines : d.header.contactLines,
    },
    footer: {
      leftText: typeof f.leftText === "string" ? f.leftText : d.footer.leftText,
      centerText: typeof f.centerText === "string" ? f.centerText : d.footer.centerText,
      rightText: typeof f.rightText === "string" ? f.rightText : d.footer.rightText,
    },
    predefinedAdvices: Array.isArray(p.predefinedAdvices) ? p.predefinedAdvices : d.predefinedAdvices,
    predefinedDiagnoses: Array.isArray(p.predefinedDiagnoses) ? p.predefinedDiagnoses : d.predefinedDiagnoses,
    timingOptions: Array.isArray(p.timingOptions) ? p.timingOptions : d.timingOptions,
    followUpOptions: Array.isArray(p.followUpOptions) ? p.followUpOptions : d.followUpOptions,
  };
}

function normalizeEmail(raw: unknown): import("./types").EmailConfig {
  const e = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled: Boolean(e.enabled),
    host: typeof e.host === "string" ? e.host : "",
    port: typeof e.port === "number" ? e.port : 587,
    secure: Boolean(e.secure),
    user: typeof e.user === "string" ? e.user : "",
    pass: typeof e.pass === "string" ? e.pass : "",
    from: typeof e.from === "string" ? e.from : "",
  };
}

function normalizePost(raw: any): BlogPost {
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    slug: String(raw.slug ?? ""),
    title: toLS(raw.title),
    excerpt: toLS(raw.excerpt),
    date: String(raw.date ?? new Date().toISOString().split("T")[0]),
    readingMinutes: Number(raw.readingMinutes) || 1,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    body: toLS(raw.body),
    coverImage: typeof raw.coverImage === "string" ? raw.coverImage : "",
    published: Boolean(raw.published),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---- Settings --------------------------------------------------------------

export async function getSettings(): Promise<SiteSettings> {
  const stored = await readJson<unknown>(SETTINGS_FILE, defaultSettings);
  return normalizeSettings(stored);
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await writeJson(SETTINGS_FILE, normalizeSettings(settings));
}

// ---- Blog posts ------------------------------------------------------------

export async function getPosts(): Promise<BlogPost[]> {
  const posts = await readJson<unknown[]>(POSTS_FILE, defaultPosts);
  const normalized = (Array.isArray(posts) ? posts : []).map(normalizePost);
  return normalized.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  return (await getPosts()).filter((p) => p.published);
}

export async function getPostById(id: string): Promise<BlogPost | undefined> {
  return (await getPosts()).find((p) => p.id === id);
}

export async function getPostBySlug(
  slug: string
): Promise<BlogPost | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureUniqueSlug(
  slug: string,
  ignoreId?: string
): Promise<string> {
  const posts = await getPosts();
  let candidate = slug || "post";
  let n = 2;
  while (posts.some((p) => p.slug === candidate && p.id !== ignoreId)) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

export type PostInput = {
  title: LocalizedString;
  slug?: string;
  excerpt: LocalizedString;
  date: string;
  readingMinutes: number;
  tags: string[];
  body: LocalizedString;
  coverImage?: string;
  published: boolean;
};

function baseSlug(input: PostInput): string {
  return slugify(input.slug || input.title.en || input.title.bn || "post");
}

export async function createPost(input: PostInput): Promise<BlogPost> {
  const posts = await getPosts();
  const slug = await ensureUniqueSlug(baseSlug(input));
  const post: BlogPost = {
    id: crypto.randomUUID(),
    slug,
    title: input.title,
    excerpt: input.excerpt,
    date: input.date,
    readingMinutes: input.readingMinutes,
    tags: input.tags,
    body: input.body,
    coverImage: input.coverImage ?? "",
    published: input.published,
    updatedAt: new Date().toISOString(),
  };
  posts.push(post);
  await writeJson(POSTS_FILE, posts);
  return post;
}

export async function updatePost(
  id: string,
  input: PostInput
): Promise<BlogPost | undefined> {
  const posts = await getPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const slug = await ensureUniqueSlug(baseSlug(input), id);
  const updated: BlogPost = {
    ...posts[idx],
    slug,
    title: input.title,
    excerpt: input.excerpt,
    date: input.date,
    readingMinutes: input.readingMinutes,
    tags: input.tags,
    body: input.body,
    coverImage: input.coverImage ?? "",
    published: input.published,
    updatedAt: new Date().toISOString(),
  };
  posts[idx] = updated;
  await writeJson(POSTS_FILE, posts);
  return updated;
}

export async function deletePost(id: string): Promise<boolean> {
  const posts = await getPosts();
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) return false;
  await writeJson(POSTS_FILE, next);
  return true;
}
