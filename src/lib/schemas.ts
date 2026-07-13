/**
 * Zod validation schemas for server action inputs.
 *
 * Centralised here so both server actions and API routes
 * can share the same validation logic.
 */

import { z } from "zod";

// ---- Patient ----------------------------------------------------------------

/** Schema for creating/updating a patient record. */
export const patientInputSchema = z.object({
  name: z.string().trim().min(1, "Patient name is required."),
  phone: z.string().trim().min(1, "Phone number is required (used as identity)."),
  age: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  email: z.string().optional().default(""),
  address: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type PatientInput = z.infer<typeof patientInputSchema>;

// ---- Appointment Booking (Public) -------------------------------------------

/** Regex patterns matching the existing validateAppointment logic. */
const PHONE_RE = /^[0-9+\-() \s]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Schema for the public POST /api/appointments route. */
export const appointmentBookingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(100, "Name must be 100 characters or fewer."),
  phone: z
    .string()
    .trim()
    .regex(PHONE_RE, "Please enter a valid phone number."),
  email: z
    .string()
    .trim()
    .default("")
    .refine((val) => !val || EMAIL_RE.test(val), "Please enter a valid email address."),
  mode: z.enum(["online", "offline"], {
    message: "Please choose an appointment type.",
  }),
  chamberId: z.string().trim().optional().default(""),
  date: z
    .string()
    .min(1, "Please choose a preferred date.")
    .refine((val) => !Number.isNaN(Date.parse(val)), "The preferred date is invalid."),
  time: z.string().trim().min(1, "Please choose a preferred time."),
  reason: z
    .string()
    .trim()
    .max(1000, "Reason for visit is too long (max 1000 characters).")
    .optional()
    .default(""),
}).refine(
  (data) => !(data.mode === "offline" && !data.chamberId),
  { message: "Please choose a chamber.", path: ["chamberId"] }
);

export type AppointmentBookingInput = z.infer<typeof appointmentBookingSchema>;

// ---- Blog Post Input --------------------------------------------------------

/** Localised string object — at least one language must be provided. */
const localizedStringSchema = z.object({
  en: z.string().optional().default(""),
  bn: z.string().optional().default(""),
});

/** Schema for saving a blog post (create or update). */
export const postInputSchema = z.object({
  title: localizedStringSchema.refine(
    (t) => (t.en?.trim() || t.bn?.trim()),
    { message: "Title is required (at least one language)." }
  ),
  excerpt: localizedStringSchema,
  body: localizedStringSchema,
  slug: z.string().optional(),
  date: z.string().min(1, "Date is required."),
  readingMinutes: z.number().int().min(1).optional().default(4),
  tags: z.array(z.string()).default([]),
  category: z.string().optional().default(""),
  published: z.boolean().default(false),
  coverImage: z.string().optional().default(""),
  metaTitle: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),
  ogImage: z.string().optional().default(""),
  reviewedBy: z.string().optional().default(""),
  reviewedDate: z.string().optional().default(""),
  references: z.string().optional().default(""),
  disclaimer: z.string().optional().default(""),
  scheduledDate: z.string().optional().default(""),
});

export type PostInputValidated = z.infer<typeof postInputSchema>;

// ---- Settings ---------------------------------------------------------------

/** Minimal schema: settings must be a non-null object. */
export const settingsUpdateSchema = z
  .record(z.string(), z.unknown())
  .refine((val) => val !== null && typeof val === "object", {
    message: "Invalid settings payload.",
  });

// ---- Account Update ---------------------------------------------------------

/** Schema for the account update form action. */
export const accountUpdateSchema = z
  .object({
    username: z.string().trim().optional(),
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().optional().default(""),
    confirmPassword: z.string().optional().default(""),
  })
  .refine(
    (data) => {
      // If a new password is provided, it must be at least 6 chars
      if (data.newPassword && data.newPassword.length < 6) return false;
      return true;
    },
    { message: "New password must be at least 6 characters.", path: ["newPassword"] }
  )
  .refine(
    (data) => {
      // When both are provided, they must match
      if (data.newPassword || data.confirmPassword) {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    { message: "New password and confirmation do not match.", path: ["confirmPassword"] }
  )
  .refine(
    (data) => {
      // Username must be at least 3 chars if provided
      if (data.username && data.username.length < 3) return false;
      return true;
    },
    { message: "Username must be at least 3 characters.", path: ["username"] }
  );

export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
