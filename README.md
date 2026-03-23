# NEU Library Visitor Log

This project is for academic purposes and is submitted to Prof. Jeremias C. Esperanza.

Seeded data in this project is synthetic and intended for demo, testing, and academic presentation only. It does not represent official institutional records.

## Live App
- Main: https://www.neulibrarylog.online
- Admin login: https://www.neulibrarylog.online/admin/login

## What It Does
- Visitor check-in via Google (`google-user`)
- Admin sign-in via Google (`google-admin`) with allowlisted emails
- Role-aware records (`student`, `teacher`, `employee`)
- Dashboard analytics by date, reason, college, and role
- Registered accounts management: add, search, filter, block/unblock, delete
- Visit logs search, date filtering, pagination, and PDF export
- AI assistant (RAG-style + Gemini fallback) for admin analytics Q&A

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- NextAuth v4
- MongoDB + Mongoose
- Tailwind CSS + Recharts
- jsPDF + jspdf-autotable

## Quick Start
1. Install dependencies.

```bash
npm install
```

2. Create `.env` from `.env.example` and fill required values.

3. (Optional) Seed sample data.

```bash
npm run seed
```

4. Start development server.

```bash
npm run dev
```

5. Open:
- http://localhost:3000
- http://localhost:3000/admin/login

## Environment Variables
Required:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ALLOWED_DOMAIN`
- `ADMIN_GOOGLE_EMAILS`

Optional:
- `MONGODB_URI_FALLBACK` (fallback when SRV DNS is blocked)
- `STATS_TIMEZONE` (default: `Asia/Manila`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seed helper)
- `GEMINI_API_KEY` (enable admin AI assistant)
- `GEMINI_MODEL` (override default Gemini model)

Runtime values:
- Local: `NEXTAUTH_URL=http://localhost:3000`
- Production: `NEXTAUTH_URL=https://www.neulibrarylog.online`

## Google OAuth Setup
Use the OAuth client tied to `GOOGLE_CLIENT_ID` and add:

Authorized JavaScript origins:
- http://localhost:3000
- https://www.neulibrarylog.online
- https://neulibrarylog.online
- https://neu-library-visitor-log.vercel.app

Authorized redirect URIs:
- http://localhost:3000/api/auth/callback/google-user
- http://localhost:3000/api/auth/callback/google-admin
- https://www.neulibrarylog.online/api/auth/callback/google-user
- https://www.neulibrarylog.online/api/auth/callback/google-admin
- https://neulibrarylog.online/api/auth/callback/google-user
- https://neulibrarylog.online/api/auth/callback/google-admin
- https://neu-library-visitor-log.vercel.app/api/auth/callback/google-user
- https://neu-library-visitor-log.vercel.app/api/auth/callback/google-admin

Note: Google requires exact redirect URI matching. Include `www` and non-`www` if both are used.

## API Summary
- `POST /api/checkin`
- `GET /api/stats`
- `GET /api/logs`
- `GET /api/visitors`
- `POST /api/visitors`
- `PATCH /api/visitors/:id`
- `DELETE /api/visitors/:id`
- `POST /api/admin-chat`

## Project Structure
```text
src/
	app/
		api/            # Route handlers
		admin/          # Admin pages and dashboard
		checkin-google/ # Post-login check-in form
		welcome/        # Success page
	components/       # Shared UI and feature components
	lib/              # Auth, DB, constants, branding helpers
	models/           # Mongoose schemas and indexes
	types/            # Type declarations
scripts/
	seed.ts           # Seed script
```

## NPM Scripts
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint checks
- `npm run seed` - seed database

## Troubleshooting
- OAuth `redirect_uri_mismatch`: verify exact callback URI in Google Cloud and `NEXTAUTH_URL` in runtime env
- Local redirects to prod: ensure local `NEXTAUTH_URL=http://localhost:3000`
- Admin access denied: confirm email is in `ADMIN_GOOGLE_EMAILS`
- Mongo SRV DNS errors: set `MONGODB_URI_FALLBACK`

## Security Notes
- Never commit `.env` secrets
- Rotate exposed keys/secrets immediately
- Keep `ADMIN_GOOGLE_EMAILS` minimal and explicit

## Academic Note
Prepared for academic submission.
