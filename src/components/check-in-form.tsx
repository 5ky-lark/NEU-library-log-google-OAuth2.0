"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { AlertCircle } from "lucide-react";

export function CheckInForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    // Sign out first so role changes are explicit when the same account switches modes.
    await signOut({ redirect: false });

    const result = await signIn("google-user", {
      redirect: false,
      callbackUrl: "/checkin-google",
    });

    if (result?.url) {
      window.location.href = result.url;
    } else if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up stagger-2">
      {/* Error Alert */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-200 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Error</p>
              <p className="text-sm mt-1 text-red-300/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="brand-card rounded-3xl overflow-hidden">
        <div className="p-8">
          <p className="text-center text-white/80 text-sm mb-6">
            Sign in with your NEU Google account to continue.
          </p>

          {/* Google Sign-In */}
          <button
            type="button"
            className="w-full h-12 rounded-xl bg-white/[0.08] border border-amber-100/22 text-white hover:bg-white/[0.14] transition-all duration-200 flex items-center justify-center gap-3 font-medium active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGoogleSignIn}
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
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>

          <p className="text-center text-[11px] text-amber-100/65 mt-4">
            Use your institutional email account
          </p>
        </div>
      </div>
    </div>
  );
}
