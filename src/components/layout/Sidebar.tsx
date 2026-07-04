"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/hooks/use-ui";
import Avatar from "@/components/ui/Avatar";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Megaphone,
  GraduationCap,
  Users,
  User,
  LogOut,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Star,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const user = session?.user;

  // Define navigation links
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/dashboard/standout", label: "Weekly Standout", icon: Star },
    { href: "/dashboard/leaves", label: "Leaves", icon: Calendar },
    { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
    { href: "/dashboard/training", label: "Training Sessions", icon: GraduationCap },
    { href: "/dashboard/team", label: "Team Space", icon: Users },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ];


  // Helper to determine active link
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "Team Lead":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between transform transition-transform duration-300 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand/Top section */}
        <div>
          <div className="h-16 border-b border-zinc-900 flex items-center justify-between px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow shadow-violet-500/25 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                CIFICAP
              </span>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-zinc-400 hover:text-white p-1 hover:bg-zinc-900 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-3 mb-2">
              WORKSPACE
            </p>
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    active
                      ? "bg-violet-600 text-white shadow shadow-violet-600/10"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${
                      active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile details at bottom */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/40">
          <div className="flex flex-col gap-3.5">
            {/* User Details Capsule */}
            {user && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/30 border border-zinc-900/60">
                <Avatar name={user.name || "User"} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate leading-none mb-1">
                    {user.name}
                  </p>
                  <span
                    className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-mono border ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            {/* Logout control */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/5 border border-zinc-900/60 hover:border-red-500/20 rounded-lg transition-all active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
