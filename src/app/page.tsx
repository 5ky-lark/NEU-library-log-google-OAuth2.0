import { CheckInForm } from "@/components/check-in-form";
import Link from "next/link";
import Image from "next/image";
import { Library, ShieldCheck } from "lucide-react";
import { neuLogo, libraryHero } from "@/lib/branding";

export default function HomePage() {
  return (
    <main className="brand-stage relative min-h-screen overflow-hidden">
      <Image
        src={libraryHero}
        alt="NEU Library"
        fill
        className="object-cover opacity-25"
        priority
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-[#042515]/90 via-[#0a3d24]/80 to-[#2f8a5a]/55" />

      <div className="absolute inset-0 brand-grid opacity-35 pointer-events-none" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl animate-float-delayed" />
      </div>

      <div className="absolute top-6 right-6 z-20">
        <Link
          href="/admin/login"
          className="brand-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition hover:bg-white/20"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin Portal
        </Link>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-20 text-center">
        <section className="animate-fade-in text-white max-w-3xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-amber-100/30 bg-amber-100/10 px-4 py-2 text-sm text-amber-100">
            <Library className="h-4 w-4" />
            NEU Library Visitor Log
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Image
              src={neuLogo}
              alt="New Era University logo"
              width={72}
              height={72}
              className="rounded-2xl border border-amber-50/35 bg-white/90 p-1"
              priority
            />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-100/80">
                New Era University
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl text-amber-50 leading-tight">
                Welcome to NEU Library
              </h1>
            </div>
          </div>

          <p className="mt-7 mx-auto max-w-2xl text-base leading-relaxed text-emerald-50/85 md:text-xl">
            A secure visitor check-in desk for students, faculty, and staff. Sign in with your institutional Google account for fast access and role-based security.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs uppercase tracking-wider text-amber-100/85">
            <span className="brand-pill rounded-full px-3 py-1.5">Google Auth</span>
            <span className="brand-pill rounded-full px-3 py-1.5">Role Based Access</span>
            <span className="brand-pill rounded-full px-3 py-1.5">Admin Analytics</span>
          </div>
        </section>

        <div className="my-10 h-px w-full max-w-xl bg-gradient-to-r from-transparent via-amber-100/35 to-transparent" />

        <section className="animate-slide-up w-full flex justify-center">
          <CheckInForm />
        </section>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-[11px] text-amber-100/75">
          New Era University Library Management System
        </p>
      </div>
    </main>
  );
}
