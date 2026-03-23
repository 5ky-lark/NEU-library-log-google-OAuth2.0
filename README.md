# NEU Library Visitor Log

A web-based library visitor management and analytics system with AI RAG Admin Chatbot.

This project is for academic submission to Prof. Jeremias C. Esperanza.

## Live Application
| Surface | URL |
|---|---|
| Main App | https://www.neulibrarylog.online/ |
| Admin Login | https://www.neulibrarylog.online/admin/login |

## Overview
The system digitizes library visitor operations through authenticated check-in, role-aware records, and an admin analytics dashboard.

Core goals:
- Streamline visitor check-in with Google OAuth
- Classify visitor roles (`student`, `teacher`, `staff`)
- Track trends by reason, college, and date range
- Manage account lifecycle (create, search, block/unblock, delete)
- Export records for reporting

## Feature Highlights
- Google visitor check-in flow (`google-user`)
- Admin-only dashboard access (`google-admin`, allowlisted emails)
- Dashboard filters (`all`, `today`, `week`, `month`, `custom`)
- KPI cards and trend visualizations
- Registered accounts table with filtering and pagination
- Visit logs with search, date filtering, pagination, and PDF export
- PDF export for both visitor accounts and logs

## AI RAG Admin Chatbot (Gemini 3.1)
The admin side includes a floating AI assistant for natural-language analytics questions.

| Item | Details |
|---|---|
| Endpoint | `POST /api/admin-chat` |
| Access | Admin session required |
| Model | `gemini-3.1-flash-lite-preview` (default) |
| Required Env | `GEMINI_API_KEY` |
| Optional Env | `GEMINI_MODEL` |

How it works:
- Grounds responses in MongoDB visitor and visit log data
- Uses deterministic DB-first logic for common analytics (busiest hour, top reason, top college, monthly peak, account totals)
- Falls back to Gemini for broader or open-ended queries
- Includes recent chat history for follow-up context
- Sanitizes output for clean UI rendering

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- NextAuth v4
- MongoDB + Mongoose
- Tailwind CSS
- Recharts
- jsPDF + jspdf-autotable

## Project Structure
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

Architecture notes:
- Route handlers stay focused on request and response behavior
- Data models and constraints are centralized in `src/models`
- Shared auth/db/constants utilities are in `src/lib`
- Reusable UI atoms are in `src/components/ui`

## Authentication and Authorization
- `google-user`: visitor check-in provider
- `google-admin`: admin provider
- Admin access is restricted by `GOOGLE_ALLOWED_DOMAIN` and `ADMIN_GOOGLE_EMAILS`
- Middleware and admin layouts enforce route protection

## Environment Variables
Create `.env` from `.env.example`.

Required:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ALLOWED_DOMAIN`
- `ADMIN_GOOGLE_EMAILS`

Optional (recommended):
- `MONGODB_URI_FALLBACK` for SRV DNS fallback
- `STATS_TIMEZONE` (default `Asia/Manila`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` for seeding
- `GEMINI_API_KEY` to enable admin AI assistant
- `GEMINI_MODEL` to override the default Gemini model

Runtime notes:
- Local: `NEXTAUTH_URL=http://localhost:3000`
- Production: `NEXTAUTH_URL=https://www.neulibrarylog.online`

## Google OAuth Setup
Add these redirect URIs in Google Cloud Console:
- `http://localhost:3000/api/auth/callback/google-user`
- `http://localhost:3000/api/auth/callback/google-admin`
- `https://www.neulibrarylog.online/api/auth/callback/google-user`
- `https://www.neulibrarylog.online/api/auth/callback/google-admin`

## Quick Start (Local)
1. Install dependencies.

```bash
npm install
```

2. Configure `.env`.

3. Seed data.

```bash
npm run seed
```

4. Run the app.

```bash
npm run dev
```

5. Open:
- `http://localhost:3000`
- `http://localhost:3000/admin/login`

## Seed Script Summary
Source: `scripts/seed.ts`

The seed process:
- Connects to MongoDB (supports fallback URI)
- Upserts visitor accounts from roster data
- Applies configured role overrides
- Normalizes legacy role value `faculty` to `teacher`
- Generates randomized visit logs in the configured timeframe
- Supports excluded emails for testing

Seed data notice:
- Seeded records are synthetic and for demo/testing/academic presentation use only
- Replace with verified operational data before real deployment

## API Endpoints
| Method | Route |
|---|---|
| POST | `/api/checkin` |
| GET | `/api/stats` |
| GET | `/api/logs` |
| GET | `/api/visitors` |
| POST | `/api/visitors` |
| PATCH | `/api/visitors/:id` |
| DELETE | `/api/visitors/:id` |

## Troubleshooting
- Redirecting to production while local: ensure `NEXTAUTH_URL=http://localhost:3000`
- Mongo SRV DNS `querySrv ECONNREFUSED`: set `MONGODB_URI_FALLBACK`
- Admin login denied: confirm user email exists in `ADMIN_GOOGLE_EMAILS`
- OAuth mismatch: verify callback URIs in Google Cloud Console

## NPM Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run lint` | Run lint checks |
| `npm run seed` | Seed database |

## Security
- Never commit secrets from `.env`
- Rotate exposed credentials immediately
- Keep the admin allowlist minimal and explicit

## Favicon
Source file: `src/app/icon.png`

## Academic Use Statement
This project is intended for academic submission requirements.

Submitted to Prof. Jeremias C. Esperanza.
