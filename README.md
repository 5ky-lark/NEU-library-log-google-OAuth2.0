# NEU Library Visitor Log

This system is built for academic purposes and is intended to be submitted to:
Prof. Jeremias C. Esperanza

## Live URLs
- Main App: https://www.neulibrarylog.online/
- Admin Login: https://www.neulibrarylog.online/admin/login

## Project Objective
This application digitizes library visitor operations by providing:
- Structured visitor check-in through Google authentication
- Role-aware visitor classification (`student`, `teacher`, `staff`)
- Admin analytics dashboard with date and dimension filters
- Registered account lifecycle operations (add, search, block/unblock, delete)
- Visit log reporting with export support

## Feature Set
- Google-based check-in flow (`google-user`)
- Google-based admin access (`google-admin`, allowlisted emails only)
- Dashboard filter presets (`all`, `today`, `week`, `month`, `custom`)
- Top 3 KPI cards for reasons and colleges
- Timezone-aware daily aggregation (default `Asia/Manila`)
- Registered Accounts with filtering and pagination
- Visit Logs with search, date filtering, pagination, and PDF export
- PDF export for both accounts and logs

## AI RAG Admin Chatbot (Gemini 3.1)
- A floating AI assistant is available on the admin side (lower-right corner) for quick data questions.
- The chatbot uses Google Gemini with default model `gemini-3.1-flash-lite-preview`.
- Backend route: `POST /api/admin-chat` (admin session required).
- Responses are grounded in MongoDB data from visitors and visit logs, then composed into natural answers.
- Common analytics questions are answered with deterministic DB-first logic before LLM fallback, including:
   - busiest hour/time periods
   - monthly visitor peaks
   - top reasons and top colleges
   - account totals (registered and blocked)
- Recent chat history is sent to support follow-up questions in context.
- Output text is sanitized for clean UI rendering.

Configuration:
- Required: `GEMINI_API_KEY`
- Optional: `GEMINI_MODEL` (defaults to `gemini-3.1-flash-lite-preview`)

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- NextAuth v4
- MongoDB + Mongoose
- Tailwind CSS
- Recharts
- jsPDF + jspdf-autotable

## Coding Structure

```text
NEU Library Visitor Log/
|-- scripts/
|   `-- seed.ts
|-- src/
|   |-- app/
|   |   |-- admin/
|   |   |   |-- (dashboard)/
|   |   |   |   |-- accounts/
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- dashboard/
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- logs/
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- visitors/
|   |   |   |   |   `-- page.tsx
|   |   |   |   `-- layout.tsx
|   |   |   |-- layout.tsx
|   |   |   `-- login/
|   |   |       `-- page.tsx
|   |   |-- api/
|   |   |   |-- auth/[...nextauth]/route.ts
|   |   |   |-- checkin/route.ts
|   |   |   |-- logs/route.ts
|   |   |   |-- stats/route.ts
|   |   |   `-- visitors/
|   |   |       |-- route.ts
|   |   |       `-- [id]/route.ts
|   |   |-- checkin-google/page.tsx
|   |   |-- welcome/page.tsx
|   |   |-- globals.css
|   |   |-- icon.png
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/
|   |   |-- ui/
|   |   |   |-- alert.tsx
|   |   |   |-- button.tsx
|   |   |   |-- card.tsx
|   |   |   |-- dialog.tsx
|   |   |   |-- input.tsx
|   |   |   |-- label.tsx
|   |   |   |-- select.tsx
|   |   |   `-- table.tsx
|   |   |-- admin-sidebar.tsx
|   |   |-- block-visitor-modal.tsx
|   |   |-- check-in-form.tsx
|   |   |-- date-range-picker.tsx
|   |   |-- pdf-export-button.tsx
|   |   |-- providers.tsx
|   |   |-- search-bar.tsx
|   |   `-- stats-cards.tsx
|   |-- lib/
|   |   |-- auth.ts
|   |   |-- branding.ts
|   |   |-- constants.ts
|   |   |-- db.ts
|   |   `-- utils.ts
|   |-- models/
|   |   |-- Admin.ts
|   |   |-- VisitLog.ts
|   |   `-- Visitor.ts
|   |-- types/
|   |   `-- next-auth.d.ts
|   `-- middleware.ts
|-- .env.example
|-- next.config.js
|-- package.json
`-- README.md
```

### Notes
- Route handlers are kept thin and focused on request/response behavior.
- Domain shape and persistence constraints are centralized in `src/models`.
- Cross-cutting configuration lives in `src/lib` (auth, db, constants).
- Reusable UI atoms are isolated in `src/components/ui`.
- Feature-level components remain in `src/components` to avoid duplication.

## Authentication and Authorization
- `google-user` provider: visitor check-in flow.
- `google-admin` provider: admin-only flow.
- Admin access control is enforced through:
   - `GOOGLE_ALLOWED_DOMAIN`
   - `ADMIN_GOOGLE_EMAILS`
- Admin route protection is applied via middleware and layout checks.

## Environment Variables
Create local `.env` based on `.env.example`.

Required:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ALLOWED_DOMAIN`
- `ADMIN_GOOGLE_EMAILS`

Optional (recommended):
- `MONGODB_URI_FALLBACK` (for networks blocking SRV DNS)
- `STATS_TIMEZONE` (default `Asia/Manila`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (admin seed credentials)
- `GEMINI_API_KEY` (enables AI admin assistant responses)
- `GEMINI_MODEL` (default `gemini-3.1-flash-lite-preview`)

Local note:
- Set `NEXTAUTH_URL=http://localhost:3000`

Production note:
- Set `NEXTAUTH_URL=https://www.neulibrarylog.online`

## Google OAuth Setup
Authorized redirect URIs:
- `http://localhost:3000/api/auth/callback/google-user`
- `http://localhost:3000/api/auth/callback/google-admin`
- `https://www.neulibrarylog.online/api/auth/callback/google-user`
- `https://www.neulibrarylog.online/api/auth/callback/google-admin`

## Local Development Setup
1. Install dependencies:

```bash
npm install
```

2. Configure `.env`.

3. Seed data:

```bash
npm run seed
```

4. Start dev server:

```bash
npm run dev
```

5. Open:
- `http://localhost:3000`
- `http://localhost:3000/admin/login`

## Seed Script Summary
File: `scripts/seed.ts`

Important:
- Seeded records are for demo, testing, and academic presentation purposes only.
- Seeded users and logs are synthetic/curated sample data and should not be treated as official production records.
- Before final deployment for real operations, replace seed-generated records with verified real data and disable demo seeding in operational environments.

The seed process:
- Connects to MongoDB (with fallback URI support)
- Upserts registered accounts from roster data
- Applies role overrides where configured
- Normalizes legacy role values (`faculty` to `teacher`)
- Generates randomized visit logs in configured timeframe
- Supports excluded emails for non-preassigned testing users

## High-Level API Endpoints
- `POST /api/checkin`
- `GET /api/stats`
- `GET /api/logs`
- `GET /api/visitors`
- `POST /api/visitors`
- `PATCH /api/visitors/:id`
- `DELETE /api/visitors/:id`

## Troubleshooting
- Local redirects to production:
   - Ensure local `NEXTAUTH_URL=http://localhost:3000`
- Mongo SRV DNS error `querySrv ECONNREFUSED`:
   - Set `MONGODB_URI_FALLBACK`
- Admin login denied:
   - Verify email exists in `ADMIN_GOOGLE_EMAILS`
- OAuth mismatch errors:
   - Recheck all callback URIs in Google Cloud Console

## NPM Scripts
- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run start` - run production build
- `npm run lint` - lint project
- `npm run seed` - run seed script

## Security Notes
- Never commit `.env` secrets.
- Rotate credentials immediately if exposed.
- Keep admin allowlist minimal and explicit.

## Favicon
Favicon source file:
- `src/app/icon.png`

## Academic Use Statement
This project is intended for academic purposes and submission requirements.

Submitted to:
Prof. Jeremias C. Esperanza
