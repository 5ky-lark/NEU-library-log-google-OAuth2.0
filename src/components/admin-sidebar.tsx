"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Library,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { neuLogo } from "@/lib/branding";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/logs", label: "Visit Logs", icon: FileText },
  { href: "/admin/accounts", label: "Registered Accounts", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 h-screen shrink-0 bg-[#072214] flex flex-col border-r border-amber-100/10 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-amber-100/10">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl border border-amber-100/35 bg-white/90 p-1">
            <Image
              src={neuLogo}
              alt="NEU"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
          <div>
            <span className="font-semibold text-amber-50 text-[15px] block leading-tight">
              NEU Library
            </span>
            <span className="text-[11px] text-amber-100/55 block">
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-amber-100/40">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-amber-300/16 text-amber-100"
                    : "text-amber-100/65 hover:text-amber-100 hover:bg-amber-100/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? "text-amber-100" : "text-amber-100/40"
                  )}
                />
                {label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-100 shadow-glow" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-amber-100/10 space-y-1">
        <Link href="/">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-100/70 hover:text-amber-100 hover:bg-amber-100/10 transition-all duration-200">
            <ExternalLink className="h-[18px] w-[18px] text-amber-100/45" />
            Check-In Page
          </div>
        </Link>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
