# MediSite — Dr. Mahmud ul Hasan Miju

A comprehensive personal website and clinic management system for **Dr. Mahmud ul Hasan Miju**, Assistant Registrar at Faridpur Medical College Hospital.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL.

---

## Features

### Public Website (Bilingual EN/বাংলা)
- **Home** — Hero with doctor photo, stats, areas of care, latest articles
- **About** — Biography, experience timeline, education, specialties
- **Blog** — Articles with categories, tags, search, social sharing, related posts, RSS feed
- **Appointments** — Online booking (multi-chamber, online/offline, dynamic scheduling)
- **Prescription View** — Public URL for each prescription with QR code + download

### Admin Panel (`/admin`)
- **Session login** with role-based access (Doctor / Attendant)
- **Dashboard** — Today's workflow queue, stats, revenue, follow-up tracking
- **Appointments** — Filters, export (CSV/Excel/PDF), Start Visit, reschedule, status lifecycle
- **Patient Records** — Sequential IDs, consultations, test reports, vitals chart, comparison
- **Prescription System** — Two-column form matching printed layout, medicine autocomplete, Bengali advices, investigation, print/email/WhatsApp/QR
- **Medicine Database** — 1600+ medicines, autocomplete, import/export, auto-learn
- **Blog Manager** — Markdown editor, categories, SEO fields, scheduling, revision history, view counts
- **Settings** — Site content, prescription config, appointment config, blog config, email (SMTP)
- **Users** — Multi-user with customizable permissions per attendant
- **Audit Log** — Full traceability of all actions with expandable details
- **Reports** — Top diagnoses, medicines, monthly trends (SVG charts)

### Prescription Features
- Two-column layout matching the doctor's paper prescription
- Medicine autocomplete with brand/generic, auto-fill form + dosage
- Investigation section with autocomplete + discount %
- Numbered advice chips (select/deselect)
- Pre-fill from last consultation
- Auto-learn: new medicines, advices, diagnoses, investigations
- Professional print with QR code (public prescription URL)
- Email and WhatsApp sharing
- Prescription templates (save/load)
- Revenue/fee tracking (duration-based)

### Appointment System
- Dynamic per-day weekly schedule + holidays
- Multiple chambers with individual schedules
- Online consultation option (Zoom/Google Meet)
- Slot capacity limit
- Status lifecycle: Pending → Confirmed (Start Visit) → Completed (Prescription)
- Reschedule functionality
- Public booking form with chamber details

### Role-Based Access Control
| Permission | Doctor | Attendant |
|-----------|--------|-----------|
| Write prescriptions | ✅ | ❌ |
| Edit consultations | ✅ | ❌ |
| Create patients | ✅ | ✅ |
| Add vitals | ✅ | ✅ |
| Add test reports | ✅ | ✅ |
| Confirm appointments | ✅ | ✅ |
| Print prescriptions | ✅ | ✅ |
| Collect fees | ✅ | ✅ |
| Manage settings | ✅ | ❌ |
| Manage blog | ✅ | ❌ |
| Manage medicines | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| Delete records | ✅ | ❌ |
| View reports | ✅ | ❌ |
| View audit log | ✅ | ❌ |

### QR-Based Mobile Upload
- Generate QR code for phone upload (test reports, attachments)
- Real-time SSE notification when upload completes
- 10-minute session, single-use, no login needed on phone

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL + Prisma ORM v7 |
| Auth | NextAuth.js v5 (Credentials) |
| Real-time | Server-Sent Events (SSE) |
| Email | Nodemailer (SMTP) |
| QR Code | qrcode (npm) |
| Deployment | Node.js (local or VPS) |

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm

### Setup

```bash
# Clone
git clone git@github.com:Shamsulhaq/medisite.git
cd medisite

# Install dependencies
npm install

# Configure environment
cp .env.production.example .env.local
# Edit .env.local with your database URL and secrets

# Create database
createdb drmahmud

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed demo data (optional)
npx tsx scripts/seed-demo-data.ts

# Start development
npm run dev
```

Open http://localhost:3000

### Default Admin Login
- Username: `admin`
- Password: `admin123`
- **Change immediately** after first login (Admin → Settings → Account)

---

## Environment Variables

See `.env.production.example` for all required variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/drmahmud"
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
```

---

## Project Structure

```
src/
├── app/
│   ├── (site)/          # Public website (blog, about, appointment booking)
│   ├── admin/           # Admin panel
│   │   ├── (dashboard)/ # Protected admin pages
│   │   ├── login/       # Login page
│   │   └── actions.ts   # Server actions
│   ├── api/             # API routes
│   ├── prescription/    # Public prescription view
│   └── upload/          # Mobile upload page
├── components/
│   ├── admin/           # Admin UI components
│   └── ui/              # Shared UI components
├── lib/
│   ├── auth.ts          # Auth utilities (password hashing, user CRUD)
│   ├── db.ts            # Prisma client
│   ├── store.ts         # Settings & blog data access
│   ├── patients.ts      # Patient data access
│   ├── appointments.ts  # Appointment data access
│   ├── medicines.ts     # Built-in medicine seed data
│   ├── medicine-db.ts   # Medicine database access (Prisma)
│   ├── investigations.ts # Investigation database
│   ├── availability.ts  # Appointment scheduling logic
│   ├── prescription-pdf.ts # Prescription HTML generation
│   ├── audit.ts         # Audit logging
│   ├── rbac.ts          # Role-based access control
│   ├── i18n.ts          # Bilingual support (EN/BN)
│   ├── qr.ts            # QR code generation
│   └── utils.ts         # Shared utilities
├── prisma/
│   └── schema.prisma    # Database schema
└── scripts/
    ├── seed-demo-data.ts    # Demo data seeder
    ├── scrape-medex.js      # Medicine data importer
    └── medex-bookmarklet.js # Browser-based medicine extractor
```

---

## Key Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npx prisma studio   # Database GUI
npx prisma migrate dev --name <name>  # Create migration
npx tsx scripts/seed-demo-data.ts     # Seed demo data
```

---

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/prescription/[token]` | View prescription (no auth) |
| GET | `/upload/[token]` | Mobile upload page (no auth) |
| POST | `/api/appointments` | Book appointment |
| POST | `/api/blog/view` | Increment view count |
| GET | `/blog/rss.xml` | RSS feed |
| GET | `/api/health` | Health check |

### Protected (requires auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/medicines?q=` | Medicine search |
| GET | `/api/admin/investigations?q=` | Investigation search |
| GET | `/api/admin/print-prescription?phone=` | Print prescription HTML |
| POST | `/api/admin/upload` | Upload file |
| POST | `/api/admin/upload-session` | Create upload session |
| GET | `/api/admin/upload-session/stream?token=` | SSE stream |
| POST | `/api/admin/send-prescription` | Email prescription |
| GET | `/api/admin/patients/search?q=` | Search patients |

---

## Deployment

### Local (Recommended for clinic use)
Run on the doctor's computer with PostgreSQL locally. No internet needed for daily operations.

```bash
npm run build
npm run start
```

Access at `http://localhost:3000`

### Production (VPS)
- Set up PostgreSQL on the server
- Configure environment variables
- Use PM2 or systemd for process management
- Set up Nginx as reverse proxy with SSL

---

## Security Notes

- Patient files stored in `data/secure-uploads/` (not publicly accessible)
- Served via authenticated API route only
- Passwords hashed with scrypt (64-byte key)
- Sessions via NextAuth (HTTP-only cookies)
- Upload sessions: single-use, time-limited (10 min)
- Public prescription URLs: permanent but require the random token
- Audit log tracks all write actions

---

## License

Private. All rights reserved.
