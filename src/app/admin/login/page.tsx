"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { neuLogo } from "@/lib/branding";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";
  const oauthError = searchParams.get("error");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!oauthError) return;

    if (oauthError === "AccessDenied") {
      setError("This Google account is not authorized for admin access.");
      return;
    }

    setError("Google login failed. Please try again.");
  }, [oauthError]);

  const handleGoogleAdminLogin = async () => {
    setError("");
    setLoading(true);

    // For OAuth providers, let NextAuth handle redirects natively.
    await signIn("google-admin", {
      callbackUrl,
    });

    setLoading(false);
  };

  return (
    <main className="brand-stage relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-24 w-[460px] h-[460px] bg-amber-200/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[560px] h-[560px] bg-emerald-900/45 rounded-full blur-[90px] animate-float-delayed" />
      </div>
      <div className="absolute inset-0 brand-grid opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Back link */}
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Back to Check-In
          </Link>
        </div>

        {/* Login card */}
        <div className="brand-card rounded-3xl overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-2xl border border-amber-100/40 bg-white/90 p-1">
                <Image
                  src={neuLogo}
                  alt="New Era University"
                  width={56}
                  height={56}
                  className="rounded-xl"
                />
              </div>
              <h1 className="text-2xl text-amber-50">Admin Login</h1>
              <p className="mt-1 text-sm text-amber-50/75">
                Sign in to access the admin dashboard
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-amber-100/70">
                NEU Library Visitor Log
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-2.5 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <p className="text-center text-sm text-amber-100/80 mb-6">
              Use your authorized NEU Google account to continue.
            </p>

            <button
              type="button"
              className="w-full h-12 rounded-xl bg-white/[0.08] border border-amber-100/22 text-white hover:bg-white/[0.14] transition-all duration-200 flex items-center justify-center gap-3 font-medium active:scale-[0.98] disabled:opacity-60"
              onClick={handleGoogleAdminLogin}
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? "Redirecting..." : "Sign in with Google (Admin)"}
            </button>

            <p className="text-center text-[11px] text-amber-100/65 mt-4">
              Only configured admin Google accounts can access this area.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="animate-spin h-6 w-6 text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-white/40 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
