What it is
  
  MediSite — a bilingual (English/বাংলা) personal website + clinic management system for a doctor: public site (home, about, blog,
  appointment booking, public prescription view) plus an admin panel (patients, consultations/prescriptions, appointments, blog,
  medicines, settings, users, audit log, reports, backup).
  
  Core stack
  
  ┌────────────────┬─────────────────────────────────────────────────┬───────────────┐
  │ Layer          │ Technology                                      │ Version       │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ Framework      │ Next.js (App Router, Turbopack)                 │ 16.2.10       │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ UI runtime     │ React                                           │ 19.2.4        │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ Language       │ TypeScript                                      │ 5.x           │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ Styling        │ Tailwind CSS (v4 via @tailwindcss/postcss)      │ 4             │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ Database       │ PostgreSQL                                      │ —             │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ ORM            │ Prisma + @prisma/adapter-pg driver adapter + pg │ 7.8.0 / pg 8  │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ Auth           │ NextAuth / Auth.js (Credentials)                │ 5.0.0-beta.31 │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ Email          │ Nodemailer (SMTP)                               │ 7             │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ QR codes       │ qrcode                                          │ 1.5           │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ Backup/restore │ adm-zip (read) + archiver v8 (write)            │ —             │
  ├────────────────┼─────────────────────────────────────────────────┼───────────────┤
  │ Lint           │ ESLint 9 + eslint-config-next                   │ —             │
  └────────────────┴─────────────────────────────────────────────────┴───────────────┘
  
  Build & scripts
  
  "dev":         "next dev",
  "build":       "prisma generate && next build",
  "start":       "next start",
  "lint":        "eslint",
  "postinstall": "prisma generate"
  
  - prisma generate runs on both postinstall and build so the generated client can't go stale (added after it caused build/type
  failures).
  - Prisma config is in prisma.config.ts, which loads .env.local then .env (matching Next's env precedence, so the CLI and app resolve
  the same DATABASE_URL).
  - Node.js 20+ / PostgreSQL required.
  
  Database (Prisma, 12 models)
  
  User, AuditLog, Setting (single JSON blob for all site/prescription/appointment config), BlogPost, BlogRevision, Patient,
  Consultation, TestReport, UploadSession, Appointment, Medicine (~1,600 seeded), Investigation. Migrations live in prisma/migrations/
   (apply with prisma migrate deploy).
  
  Architecture
  
  - App Router with route groups: app/(site) (public), app/admin/(dashboard) (protected), app/admin/login, plus app/api/* route
  handlers and public app/uploads/[...path], app/prescription/[token], app/upload/[token].
  - Server Components fetch through a data-access layer in src/lib/* (patients.ts, appointments.ts, store.ts, medicine-db.ts, etc.);
  Server Actions in app/admin/*-actions.ts handle mutations.
  - RBAC: two roles (Doctor / Attendant) enforced via lib/rbac.ts + lib/auth.ts; passwords hashed with scrypt.
  - Bilingual content via lib/i18n.ts (localized strings stored as { en, bn } JSON).
  - Files: served from disk via route handlers (/uploads/[...path] for public assets, authenticated /api/admin/files for patient files)
  rather than the static public/ dir, so runtime uploads work in production; stored under data/ (gitignored, must be a persistent
  volume).
  - Real-time: Server-Sent Events for QR mobile-upload notifications.
  
  Deployment
  
  Single-instance PM2 on a VPS, behind nginx + Cloudflare. Rate limiting is in-memory (per-process, right-sized for one instance).
  
  Notable systems (built/hardened recently)
  
  - Shared UI components (single source of truth, reused across consultation + template + appointment flows): MedicineInput,
  DiagnosisAutocomplete, InvestigationAutocomplete, AdviceSelector, and SlotPicker + useSlotAvailability.
  - Appointments: dynamic per-weekday schedules, multi-chamber + online, 15-min slots, per-slot capacity, per-day patient caps;
  identical slot availability across public booking, admin create, and reschedule.
  - Self-learning prescription templates keyed by diagnosis + patient age group, plus a manual template editor in settings.
  - Server-side pagination (DB take/skip + filters) on patients, appointments, blog, medicines.
  - Rate limiting on public endpoints only (login 5/30min, booking 2/min + 20/day, blog view 30/min, QR upload 50/10min).
  - Resilient getSettings() (falls back to defaults if DB is unavailable) so error pages/builds don't crash.
