"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { COLLEGES, VISIT_REASONS } from "@/lib/constants";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { neuLogo } from "@/lib/branding";

const USER_ROLES = ["student", "teacher", "staff"] as const;

type UserRoleOption = (typeof USER_ROLES)[number];

export default function CheckInGooglePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reason, setReason] = useState<string>("reading");
  const [college, setCollege] = useState("");
  const [userRole, setUserRole] = useState<UserRoleOption | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = session?.user?.email;
    if (!email) return;

    setError(null);
    setBlockedReason(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reason,
          name: session.user?.name,
          college,
          program: college,
          userRole,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.error === "blocked") {
          setBlockedReason(
            data.blockedReason || "You are not allowed to use the library."
          );
        } else {
          setError(data.error || "Check-in failed");
        }
        setLoading(false);
        return;
      }

      router.push(
        `/welcome?name=${encodeURIComponent(data.visitor.name)}&program=${encodeURIComponent(data.visitor.program)}&image=${encodeURIComponent(session.user?.image || "")}`
      );
    } catch {
      setError("Check-in failed. Please try again.");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="brand-stage min-h-screen flex items-center justify-center">
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

  if (!session?.user?.email) {
    return null;
  }

  return (
    <main className="brand-stage relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-amber-300/15 rounded-full blur-[100px] animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-900/50 rounded-full blur-[100px] animate-float-delayed" />
      </div>
      <div className="absolute inset-0 brand-grid opacity-35 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-4 animate-slide-up">
        {/* Alerts */}
        {blockedReason && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-200 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 text-red-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Access Denied</p>
                <p className="text-sm mt-1 text-red-300/80">
                  {blockedReason} Please contact the admin.
                </p>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-200 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 text-red-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Error</p>
                <p className="text-sm mt-1 text-red-300/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="brand-card rounded-3xl overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl border border-amber-100/35 bg-white/90 p-1">
                <Image
                  src={neuLogo}
                  alt="New Era University"
                  width={50}
                  height={50}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="text-center mb-6">
              {session.user.image && (
                <div className="mb-3 flex justify-center">
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "Profile"}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full border-2 border-amber-200/60 object-cover"
                  />
                </div>
              )}
              <h2 className="text-xl font-semibold text-white">
                Complete Check-In
              </h2>
              <p className="text-sm text-white/40 mt-1">
                Signed in as{" "}
                <span className="text-white/60">{session.user.email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  I am a
                </label>
                <select
                  className="w-full h-12 rounded-xl bg-white/[0.08] border border-amber-100/20 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-200/40 transition-all duration-200 [&>option]:bg-[#0d3f25] [&>option]:text-white"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRoleOption | "")}
                  disabled={loading}
                  required
                >
                  <option value="">Select your role</option>
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  College
                </label>
                <select
                  className="w-full h-12 rounded-xl bg-white/[0.08] border border-amber-100/20 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-200/40 transition-all duration-200 [&>option]:bg-[#0d3f25] [&>option]:text-white"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select your college</option>
                  {COLLEGES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  Reason for Visit
                </label>
                <select
                  className="w-full h-12 rounded-xl bg-white/[0.08] border border-amber-100/20 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-200/40 transition-all duration-200 [&>option]:bg-[#0d3f25] [&>option]:text-white"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                >
                  {VISIT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-emerald-950 font-extrabold hover:from-amber-300 hover:to-yellow-200 transition-all duration-200 shadow-lg shadow-amber-300/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                disabled={loading || !college || !userRole}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Checking in...
                  </span>
                ) : (
                  "Complete Check-In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
