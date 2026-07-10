# Medisite — Doctor's Personal Website + Practice Management CMS

Personal website and lightweight practice-management system for **Dr. Mahmud ul
Hasan Miju**, Assistant Registrar at Faridpur Medical College Hospital. Built
with Next.js (App Router), TypeScript, and Tailwind CSS.

## Features

### Bilingual (English / বাংলা)
- Every visitor can switch language from the header toggle; the choice is
  remembered in a cookie.
- All display text is a `{ en, bn }` pair. Missing Bangla safely falls back to
  English, so the site never renders blank.
- Fixed interface strings (buttons, labels) are translated in `src/lib/i18n.ts`;
  editable content is translated per-field in the admin (EN + বাংলা inputs).

### Public site
- **Home** — hero (with doctor photo), key stats, areas of care, latest articles.
- **About** — biography, experience timeline, education, and specialties.
- **Blog** — articles with cover images and inline images in the content.
- **Appointments** — online booking form (can be turned off site-wide).

### Admin panel (`/admin`)
- **Session login** — sign in at `/admin/login`. All `/admin/*` pages are
  protected; unauthorized visitors are redirected to the login page.
- **Image uploads** — upload the doctor's profile photo, blog cover images, and
  insert images anywhere inside blog content. Files are stored under
  `public/uploads`.
- **Site Settings** — edit *everything* on the public site, in both languages:
  - Metadata / SEO, branding, doctor profile, contact & socials
  - Home page headings/subtitles/buttons, messages
  - Navigation menu, Stats, Areas of Care, Education, Experience
  - Appointment time slots
  - **Default language** and **appointment booking on/off** toggle
- **Blog manager** — create, edit, publish/unpublish, and delete posts. Markdown
  editor with a toolbar, live preview, EN/বাংলা content tabs, cover image, and
  inline image upload.
- **Appointments manager** — view requests filtered by **Today / Upcoming /
  Past / All**, change status (pending / confirmed / cancelled), and delete.
- **Patient Records** — private patient files (behind admin auth): demographics,
  medical **history**, **prescriptions**, and **test report results**, each with
  optional file attachments (image or PDF).
- **Account** — change the admin username and password.

Content edits are live on the public site immediately after saving.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit the values (see below)
npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/admin for
the admin panel.

## Environment variables (`.env.local`)

```bash
# Secret used to sign admin session cookies (required for stable sessions).
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=your-long-random-secret

# Seed credentials for the first admin account (hashed into data/auth.json
# on first run). Change the password after logging in.
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Default login is **admin / admin123** — change it from **Admin → Settings →
Admin Account** right away.

## Data storage

All editable content is stored as JSON files under `data/` (created
automatically, git-ignored because it holds content and personal/medical data):

- `data/settings.json` — all site settings.
- `data/posts.json` — blog posts.
- `data/appointments.json` — appointment requests.
- `data/patients.json` — patient records (private).
- `data/auth.json` — admin credentials (password is scrypt-hashed).

Uploaded images/files live under `public/uploads/` (also git-ignored).

The defaults used to seed these files live in `src/lib/defaults.ts` and include
English **and** Bangla for the common strings. If you upgraded an existing
install, delete `data/settings.json` and `data/posts.json` to re-seed the
bundled bilingual defaults (otherwise older English-only content is kept and
Bangla simply falls back to English until you fill it in from the admin).

## How it works

- Passwords are hashed with scrypt; sessions are stateless, HMAC-signed
  cookies (`src/lib/auth.ts`).
- Blog content is markdown, rendered by a safe custom renderer
  (`src/components/Markdown.tsx`) that never injects raw HTML (no XSS).
- Public pages read from the store on each request so edits appear instantly.

## Build

```bash
npm run build
npm run start
```

## Production notes

This is a lightweight, single-admin CMS suitable for a personal site. Before a
public production deployment, consider:

- A real database instead of the JSON file store (needed for multi-instance /
  serverless hosting, where the local filesystem is not persistent).
- Spam protection (CAPTCHA / rate limiting) on the public booking endpoint.
- Email/SMS notifications for new appointment requests.
- A managed auth provider if you need multiple users or 2FA.
- **Patient records are sensitive medical data.** For real-world use, host on a
  server you control with HTTPS and encrypted storage/backups, restrict access,
  and ensure compliance with applicable privacy regulations. Uploaded files in
  `public/uploads` are publicly reachable by URL — move attachments behind an
  authenticated route before storing real patient documents.
