# NEU Library Visitor Log

A visitor check-in and management system for NEU Library.

## GitHub Repository

- Repository URL: https://github.com/your-username/your-repository

## Live Application

- Production URL: https://neulibrarylog.online

## Vercel Deployment Notes

Set these environment variables in Vercel Project Settings:

- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production domain)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ALLOWED_DOMAIN` (recommended: `neu.edu.ph`)
- `ADMIN_GOOGLE_EMAILS` (for admin Google accounts)

In Google Cloud Console, add Authorized redirect URIs for both providers:

- `https://your-domain.vercel.app/api/auth/callback/google-user`
- `https://your-domain.vercel.app/api/auth/callback/google-admin`

Also add local URIs for development if needed:

- `http://localhost:3000/api/auth/callback/google-user`
- `http://localhost:3000/api/auth/callback/google-admin`

## Features

- **Visitor Check-In**: RFID tap or Google Sign-In (institutional email)
- **Visit Reason**: Reading, researching, use of computer, meeting, other
- **Welcome Message**: Displays name, program, and "Welcome to NEU Library!"
- **Admin Dashboard**: Statistics by day, week, month, or custom date range
- **Admin Filters**: Filter statistics by reason, college, and employee status (teacher/staff)
- **Visitor Management**: Add visitors, block/unblock, search
- **Visit Logs**: Filter by name, program, reason, date range
- **PDF Export**: Export visitors and logs to PDF

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- MongoDB + Mongoose
- NextAuth.js (Google OAuth + Credentials for admin)
- Tailwind CSS
- Recharts
- jsPDF

## Setup

1. Copy `.env.example` to `.env.local` and fill in your values:
   - `MONGODB_URI` - MongoDB connection string
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `GOOGLE_ALLOWED_DOMAIN` - Allowed Google Workspace domain (default: `neu.edu.ph`)
   - `ADMIN_GOOGLE_EMAILS` - Comma-separated admin Google emails (default includes `jcesperanza@neu.edu.ph`)

2. Install dependencies:
   ```bash
   npm install
   ```

3. Seed the admin account and sample visitors:
   ```bash
   npm run seed
   ```
   Default admin: `admin@neu.edu.ph` / `admin123`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) for the check-in page.
   Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for admin login.

## Visitor Flow

1. Visitor taps RFID or clicks "Sign in with Google"
2. Selects reason for visit
3. Sees welcome message including: "Welcome to NEU Library!", then redirected back to check-in

## Admin Flow

1. Log in at `/admin/login`
2. **Dashboard**: View statistics by day/week/custom range in cards and charts
3. Filter statistics by reason, college, and employee status
4. **Visitors**: Add visitors, search, block/unblock, export PDF
5. **Visit Logs**: Search, filter by date, export PDF

## Role-Based Access Control (RBAC)

- `google-user` sign-in grants `user` role for regular library check-in.
- `google-admin` sign-in grants `admin` role only if the account is listed in `ADMIN_GOOGLE_EMAILS`.
- Admin routes and APIs require `admin` role in the session token.
- The same email can safely switch roles by choosing the correct login entry point.
