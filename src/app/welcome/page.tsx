"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { neuLogo } from "@/lib/branding";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Visitor";
  const program = searchParams.get("program") || "\u2014";
  const profileImage = searchParams.get("image") || "";
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="brand-stage relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-900/50 rounded-full blur-[100px] animate-float-delayed" />
      </div>
      <div className="absolute inset-0 brand-grid opacity-35 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto animate-slide-up">
        {profileImage ? (
          <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-full border-2 border-emerald-200/60 bg-white/10 p-1">
            <Image
              src={profileImage}
              alt={`${name} profile photo`}
              width={62}
              height={62}
              className="h-[62px] w-[62px] rounded-full object-cover"
            />
          </div>
        ) : (
          <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-2xl border border-amber-100/40 bg-white/90 p-1">
            <Image
              src={neuLogo}
              alt="New Era University"
              width={56}
              height={56}
              className="rounded-xl"
            />
          </div>
        )}

        {/* Success icon */}
        <div className="relative inline-flex mb-8">
          <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <div className="absolute inset-0 h-20 w-20 rounded-full bg-emerald-500/10 animate-ping" />
        </div>

        {/* Welcome text */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Welcome,{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            {name}
          </span>
          !
        </h1>
        <p className="text-white/40 text-lg mb-8">{program}</p>

        {/* Info card */}
        <div className="rounded-2xl glass-card p-6 mb-8">
          <p className="text-emerald-300 font-semibold text-lg mb-2">
            Welcome to NEU Library!
          </p>
          <p className="text-white/80 font-medium text-lg mb-1">
            You have been checked in successfully
          </p>
          <p className="text-white/40 text-sm">
            Enjoy your time at the NEU Library
          </p>
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 text-white/30 text-sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>
            Returning to check-in in{" "}
            <span className="text-white/60 font-mono font-semibold">
              {countdown}s
            </span>
          </span>
        </div>
      </div>
    </main>
  );
}

function WelcomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="animate-spin h-6 w-6 text-emerald-400"
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

export default function WelcomePage() {
  return (
    <Suspense fallback={<WelcomeLoading />}>
      <WelcomeContent />
    </Suspense>
  );
}
