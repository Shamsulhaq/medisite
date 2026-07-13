// -----------------------------------------------------------------------------
// Data store for site settings + blog posts — backed by PostgreSQL via Prisma.
// Maintains the same external API as the previous JSON-file-based version.
// -----------------------------------------------------------------------------

import crypto from "crypto";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import type {
  BlogPost,
  SiteSettings,
  Stat,
  Specialty,
  Education,
  Experience,
  MenuItem,
  PrescriptionTemplate,
  PrescriptionTemplateMedicine,
} from "./types";
import { toLS, isLocale, type LocalizedString } from "./i18n";
import { defaultSettings, defaultPosts } from "./defaults";
import { normalizeAvailability, normalizeAppointmentConfig } from "./availability";

// ---- Settings normalization ------------------------------------------------

function normalizeFeeStructure(raw: unknown): SiteSettings["feeStructure"] {
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
    prescriptionTemplates: Array.isArray(s.prescriptionTemplates)
      ? (s.prescriptionTemplates as unknown[]).map(normalizePrescriptionTemplate)
      : [],
    prescriptionLayout: s.prescriptionLayout ? s.prescriptionLayout as import("./prescription-layout").PrescriptionLayout : undefined,
    appearance: s.appearance ? s.appearance as import("./types").SiteAppearance : undefined,
    blog: normalizeBlogConfig(s.blog),
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

function normalizeBlogConfig(raw: unknown): import("./types").BlogConfig {
  const b = (raw ?? {}) as Record<string, unknown>;
  const d = defaultSettings.blog;
  return {
    categories: Array.isArray(b.categories) ? b.categories : d.categories,
    defaultDisclaimer: typeof b.defaultDisclaimer === "string" ? b.defaultDisclaimer : d.defaultDisclaimer,
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
    category: typeof raw.category === "string" ? raw.category : "",
    metaTitle: typeof raw.metaTitle === "string" ? raw.metaTitle : "",
    metaDescription: typeof raw.metaDescription === "string" ? raw.metaDescription : "",
    ogImage: typeof raw.ogImage === "string" ? raw.ogImage : "",
    reviewedBy: typeof raw.reviewedBy === "string" ? raw.reviewedBy : "",
    reviewedDate: typeof raw.reviewedDate === "string" ? raw.reviewedDate : "",
    references: typeof raw.references === "string" ? raw.references : "",
    disclaimer: typeof raw.disclaimer === "string" ? raw.disclaimer : "",
    scheduledDate: typeof raw.scheduledDate === "string" ? raw.scheduledDate : "",
    viewCount: typeof raw.viewCount === "number" ? raw.viewCount : 0,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---- Settings (PostgreSQL) -------------------------------------------------

export async function getSettings(): Promise<SiteSettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { id: "main" } });
    if (!row) {
      // First run — seed with defaults
      const normalized = normalizeSettings(defaultSettings);
      await prisma.setting.create({
        data: { id: "main", data: normalized as unknown as object },
      });
      return normalized;
    }
    return normalizeSettings(row.data);
  } catch (err) {
    // The database may be unreachable or not yet migrated — e.g. during a
    // build-time prerender of error pages (/_not-found), in a CI/CD build
    // stage without a live DB, or a transient outage. Site metadata and
    // public content have sane defaults, so degrade gracefully instead of
    // crashing the render/build. Writes (saveSettings) still surface errors.
    console.error(
      "[getSettings] database unavailable, falling back to default settings:",
      err instanceof Error ? err.message : err
    );
    return normalizeSettings(defaultSettings);
  }
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  const normalized = normalizeSettings(settings);
  await prisma.setting.upsert({
    where: { id: "main" },
    create: { id: "main", data: normalized as unknown as object },
    update: { data: normalized as unknown as object },
  });
}

// ---- Disease-based prescription templates (self-learning) ------------------

/** Normalize a stored template, tolerating older records without `diagnosis`. */
function normalizePrescriptionTemplate(raw: unknown): PrescriptionTemplate {
  const t = (raw ?? {}) as Record<string, unknown>;
  const medicines = Array.isArray(t.medicines)
    ? (t.medicines as unknown[]).map((m) => {
        const x = (m ?? {}) as Record<string, unknown>;
        const str = (v: unknown) => (typeof v === "string" ? v : "");
        return {
          name: str(x.name),
          generic: str(x.generic),
          type: x.type === "generic" ? "generic" : "brand",
          form: str(x.form),
          dosage: str(x.dosage),
          frequency: str(x.frequency),
          timing: str(x.timing),
          duration: str(x.duration),
          specialNote: str(x.specialNote),
        } as PrescriptionTemplateMedicine;
      })
    : [];
  const name = typeof t.name === "string" ? t.name : "";
  return {
    id: typeof t.id === "string" && t.id ? t.id : crypto.randomUUID(),
    name,
    // Fall back to the template name for legacy templates saved before the
    // diagnosis field existed.
    diagnosis: typeof t.diagnosis === "string" && t.diagnosis ? t.diagnosis : name,
    ageGroup: typeof t.ageGroup === "string" ? t.ageGroup : "",
    medicines,
    advices: Array.isArray(t.advices)
      ? (t.advices as unknown[]).filter((a): a is string => typeof a === "string")
      : [],
  };
}

/** Normalize a diagnosis string into a stable match key. */
export function diagnosisKey(diagnosis: string): string {
  return diagnosis.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Self-learning: remember what the doctor prescribed for a given diagnosis so
 * it can be auto-filled next time. Upserts (latest prescription wins) a
 * template keyed by the normalized diagnosis. No-op if there is no diagnosis
 * or no medicines to learn from.
 */
export async function learnPrescriptionTemplate(input: {
  diagnosis: string;
  ageGroup?: string;
  medicines: PrescriptionTemplateMedicine[];
  advices: string[];
}): Promise<void> {
  const diagnosis = input.diagnosis.trim();
  const ageGroup = (input.ageGroup ?? "").trim();
  const medicines = (input.medicines || []).filter((m) => m.name?.trim());
  if (!diagnosis || medicines.length === 0) return; // nothing worth learning

  const dKey = diagnosisKey(diagnosis);
  const settings = await getSettings();
  const templates = settings.prescriptionTemplates ?? [];

  const learned: PrescriptionTemplate = {
    id: crypto.randomUUID(),
    name: ageGroup ? `${diagnosis} (${ageGroup})` : diagnosis,
    diagnosis,
    ageGroup,
    medicines: medicines.map((m) => ({ ...m })),
    advices: (input.advices || []).filter((a) => a.trim()),
  };

  // Key by BOTH diagnosis and age group: same disease at a different age can
  // have a different prescription, so they are learned separately.
  const idx = templates.findIndex(
    (t) => diagnosisKey(t.diagnosis) === dKey && (t.ageGroup ?? "") === ageGroup
  );
  const next =
    idx >= 0
      ? templates.map((t, i) => (i === idx ? { ...learned, id: t.id } : t))
      : [...templates, learned];

  await saveSettings({ ...settings, prescriptionTemplates: next });
}

// ---- Blog posts (PostgreSQL) -----------------------------------------------

function dbPostToType(row: {
  id: string;
  slug: string;
  title: unknown;
  excerpt: unknown;
  body: unknown;
  date: string;
  readingMinutes: number;
  tags: string[];
  coverImage: string;
  published: boolean;
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
  updatedAt: Date;
}): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: toLS(row.title),
    excerpt: toLS(row.excerpt),
    body: toLS(row.body),
    date: row.date,
    readingMinutes: row.readingMinutes,
    tags: row.tags,
    coverImage: row.coverImage,
    published: row.published,
    updatedAt: row.updatedAt.toISOString(),
    category: row.category,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: row.ogImage,
    reviewedBy: row.reviewedBy,
    reviewedDate: row.reviewedDate,
    references: row.references,
    disclaimer: row.disclaimer,
    scheduledDate: row.scheduledDate,
    viewCount: row.viewCount,
  };
}

// Seed default posts on first run (when the table is empty). Extracted so both
// getPosts and getPostsPage trigger it, preserving the original first-run
// seeding behavior of the admin posts list.
async function seedDefaultPostsIfEmpty(): Promise<void> {
  const count = await prisma.blogPost.count();
  if (count > 0) return;
  const posts = defaultPosts.map(normalizePost);
  for (const p of posts) {
    await prisma.blogPost.create({
      data: {
        id: p.id,
        slug: p.slug,
        title: p.title as unknown as object,
        excerpt: p.excerpt as unknown as object,
        body: p.body as unknown as object,
        date: p.date,
        readingMinutes: p.readingMinutes,
        tags: p.tags,
        coverImage: p.coverImage ?? "",
        published: p.published,
      },
    });
  }
}

export async function getPosts(): Promise<BlogPost[]> {
  await seedDefaultPostsIfEmpty();
  const rows = await prisma.blogPost.findMany({ orderBy: { date: "desc" } });
  return rows.map(dbPostToType);
}

// ---- Paginated post list (scalable) ----------------------------------------
// DB-level pagination + filtering for the admin posts list, mirroring
// getPatientsPage in patients.ts — never loads every post just to render one
// page of the table.

export type PostStatusFilter = "all" | "published" | "draft";

export interface PostsQuery {
  page?: number;
  perPage?: number;
  q?: string;
  status?: PostStatusFilter;
}

export interface PostsPageResult {
  items: BlogPost[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function getPostsPage(
  query: PostsQuery = {}
): Promise<PostsPageResult> {
  await seedDefaultPostsIfEmpty();

  const page = Math.max(1, Math.floor(query.page ?? 1));
  const perPage = Math.min(100, Math.max(5, Math.floor(query.perPage ?? 20)));

  const and: Prisma.BlogPostWhereInput[] = [];
  const q = query.q?.trim();
  if (q) {
    // NOTE: title/excerpt/body are Json columns and cannot be text-searched at
    // the DB level. Server-side search can only target the string columns
    // `slug` and `category`.
    and.push({
      OR: [
        { slug: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (query.status === "published") {
    and.push({ published: true });
  } else if (query.status === "draft") {
    // "draft" covers all unpublished posts (both plain drafts and scheduled).
    and.push({ published: false });
  }
  const where: Prisma.BlogPostWhereInput = and.length ? { AND: and } : {};

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { date: "desc" }, // matches getPosts
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    items: rows.map(dbPostToType),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { date: "desc" },
  });
  return rows.map(dbPostToType);
}

export async function getPostById(id: string): Promise<BlogPost | undefined> {
  const row = await prisma.blogPost.findUnique({ where: { id } });
  if (!row) return undefined;
  return dbPostToType(row);
}

export async function getPostBySlug(
  slug: string
): Promise<BlogPost | undefined> {
  const row = await prisma.blogPost.findUnique({ where: { slug } });
  if (!row) return undefined;
  return dbPostToType(row);
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
  let candidate = slug || "post";
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) break;
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
  category?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  references?: string;
  disclaimer?: string;
  scheduledDate?: string;
};

function baseSlug(input: PostInput): string {
  return slugify(input.slug || input.title.en || input.title.bn || "post");
}

export async function createPost(input: PostInput): Promise<BlogPost> {
  const slug = await ensureUniqueSlug(baseSlug(input));
  const row = await prisma.blogPost.create({
    data: {
      slug,
      title: input.title as object,
      excerpt: input.excerpt as object,
      body: input.body as object,
      date: input.date,
      readingMinutes: input.readingMinutes,
      tags: input.tags,
      coverImage: input.coverImage ?? "",
      published: input.published,
      category: input.category ?? "",
      metaTitle: input.metaTitle ?? "",
      metaDescription: input.metaDescription ?? "",
      ogImage: input.ogImage ?? "",
      reviewedBy: input.reviewedBy ?? "",
      reviewedDate: input.reviewedDate ?? "",
      references: input.references ?? "",
      disclaimer: input.disclaimer ?? "",
      scheduledDate: input.scheduledDate ?? "",
    },
  });
  // Save revision
  await prisma.blogRevision.create({
    data: {
      postId: row.id,
      data: dbPostToType(row) as unknown as object,
    },
  });
  return dbPostToType(row);
}

export async function updatePost(
  id: string,
  input: PostInput
): Promise<BlogPost | undefined> {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return undefined;
  const slug = await ensureUniqueSlug(baseSlug(input), id);
  const row = await prisma.blogPost.update({
    where: { id },
    data: {
      slug,
      title: input.title as object,
      excerpt: input.excerpt as object,
      body: input.body as object,
      date: input.date,
      readingMinutes: input.readingMinutes,
      tags: input.tags,
      coverImage: input.coverImage ?? "",
      published: input.published,
      category: input.category ?? "",
      metaTitle: input.metaTitle ?? "",
      metaDescription: input.metaDescription ?? "",
      ogImage: input.ogImage ?? "",
      reviewedBy: input.reviewedBy ?? "",
      reviewedDate: input.reviewedDate ?? "",
      references: input.references ?? "",
      disclaimer: input.disclaimer ?? "",
      scheduledDate: input.scheduledDate ?? "",
    },
  });
  // Save revision
  await prisma.blogRevision.create({
    data: {
      postId: row.id,
      data: dbPostToType(row) as unknown as object,
    },
  });
  return dbPostToType(row);
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    await prisma.blogPost.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function incrementViewCount(slug: string): Promise<void> {
  try {
    await prisma.blogPost.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // silently fail if post not found
  }
}

export async function getRevisions(postId: string) {
  const rows = await prisma.blogRevision.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    postId: r.postId,
    data: r.data as unknown as BlogPost,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getRevision(id: string) {
  const row = await prisma.blogRevision.findUnique({ where: { id } });
  if (!row) return undefined;
  return {
    id: row.id,
    postId: row.postId,
    data: row.data as unknown as BlogPost,
    createdAt: row.createdAt.toISOString(),
  };
}
