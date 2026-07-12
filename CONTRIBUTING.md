# Contributing / Development Guide

## Architecture Decisions

### Data Access Pattern
- All database access goes through service modules in `src/lib/`
- Never use `prisma` directly in page components or route handlers
- Service modules: `store.ts`, `patients.ts`, `appointments.ts`, `medicine-db.ts`, `investigations.ts`, `audit.ts`

### Authentication
- **NextAuth.js v5** with Credentials provider
- Auth config: `src/auth.ts` + `src/auth.config.ts`
- Password utilities (hashing, verification): `src/lib/auth.ts`
- RBAC: `src/lib/rbac.ts` — `requirePermission()`, `checkPermission()`, `getCurrentUser()`

### Component Organization
- `src/components/admin/` — Admin-only components
- `src/components/ui/` — Shared reusable UI primitives
- `src/components/` — Public site components (Header, Footer, Markdown, etc.)

### State Management
- Server components fetch data directly
- Client components receive data via props from server parents
- Toast notifications: `useToast()` from `ToastProvider`
- No global client state library (no Redux/Zustand needed)

### Bilingual Content
- `LocalizedString = { en: string; bn: string }`
- `t(value, locale)` resolves for display
- Server: `getLocale()` from `src/lib/i18n-server.ts`
- Client: locale passed as prop from server layout

---

## Adding a New Feature

### 1. Database change
```bash
# Edit prisma/schema.prisma
# Then:
npx prisma migrate dev --name feature_name
npx prisma generate
```

### 2. Service layer
- Add functions to the appropriate `src/lib/*.ts` file
- Return typed objects, never raw Prisma types to consumers

### 3. Server actions
- Add to `src/app/admin/actions.ts` or `src/app/admin/patient-actions.ts`
- Always: check permissions, wrap in try/catch, return `{ ok, error? }`
- Always: call `logAudit()` on success

### 4. UI component
- Create in `src/components/admin/`
- Use toast for errors: `toast('error', message)`
- Use toast for success: `toast('success', message)`
- Never show raw errors to users

### 5. Page
- Create in `src/app/admin/(dashboard)/`
- Server component fetches data, passes to client components
- Add to AdminShell nav if needed (with permission check)

---

## Code Standards

### Error Handling
- Server actions: `try/catch`, return `{ ok: false, error: "Friendly message" }`
- Client: `toast('error', result.error || 'Something went wrong')`
- Never: `alert()`, raw error messages, unhandled promises

### Permission Checks
- UI: hide elements based on `permissions` prop
- Server: `await requirePermission('canWriteRx')` before any write
- Both: UI hides + server enforces (defense in depth)

### Audit Logging
- Every CREATE, UPDATE, DELETE must log
- Include: entity type, entity ID, relevant details (name, what changed)
- Login/logout events logged

### Button Hierarchy
- Primary (one per section): `bg-brand text-white font-semibold`
- Secondary: `border border-slate-300 text-ink font-medium`
- Destructive: `text-red-600 font-medium` (no background)

### Responsive Design
- Mobile-first
- Breakpoints: `sm:` (640), `md:` (768), `lg:` (1024)
- Touch targets: minimum 44px on mobile
- Sidebar: hidden on mobile, collapsible on desktop

---

## Key Patterns

### Medicine Autocomplete
- API: `/api/admin/medicines?q=`
- Sorts by relevance: exact match → shortest match → substring
- Brand names prioritized over generics
- Auto-learns new medicines on prescription save

### Prescription Print
- ALL print paths go through `/api/admin/print-prescription`
- Server generates HTML with QR code
- Client opens in new window + triggers print
- Consistent output everywhere (timeline, appointments, attendant)

### Appointment Lifecycle
```
Pending → [Start Visit] → Confirmed → [Prescription saved] → Completed
```
- Start Visit: attendant fills vitals, status → confirmed
- Prescription: doctor saves consultation, status → completed automatically
- No manual status dropdown — actions only

### Real-time (SSE)
- Used for: QR upload completion notification
- Endpoint: `/api/admin/upload-session/stream`
- Client: EventSource with fallback to polling
- Heartbeat every 15s, auto-cleanup on expiry

---

## Testing

```bash
npm run build          # Type check + compile
npx prisma studio     # Inspect database
curl http://localhost:3000/api/health  # Health check
```

---

## Deployment Checklist

- [ ] Set all env vars (see .env.production.example)
- [ ] Run `npx prisma migrate deploy`
- [ ] Change default admin password
- [ ] Set NEXT_PUBLIC_BASE_URL to production domain
- [ ] Configure SMTP for email features
- [ ] Set up SSL/HTTPS
- [ ] Set up daily PostgreSQL backup (pg_dump)
- [ ] Verify /api/health returns ok
