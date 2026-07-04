"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/hooks/use-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Menu,
  Bell,
  Search,
  Moon,
  Sun,
  Check,
  Calendar,
  Sparkles,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const {
    toggleSidebar,
    setCommandPaletteOpen,
    theme,
    toggleTheme,
  } = useUIStore();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications using TanStack Query
  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      return res.json();
    },
    refetchInterval: 30000, // Refresh notifications every 30 seconds
    enabled: !!session,
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  // Mutation to mark a single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif._id);
    }
    setNotifDropdownOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  // Convert pathname to readable breadcrumbs
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Cificap";
    return segments
      .map((segment) => {
        const word = segment.charAt(0).toUpperCase() + segment.slice(1);
        return word === "Dashboard" ? "Dashboard" : word;
      })
      .join(" / ");
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
      {/* Left section: mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-muted-foreground hover:text-foreground p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
          <span>Workspace</span>
          <span className="text-muted-foreground/45">/</span>
          <span className="text-foreground font-medium">{getBreadcrumbs()}</span>
        </div>
      </div>

      {/* Right section: commands search bar, theme toggler, notification bell */}
      <div className="flex items-center gap-4 relative">
        {/* Command Search Bar Shortcut Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-secondary/60 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border/80 transition-all cursor-pointer w-56 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-normal text-[11px]">Search commands...</span>
          </div>
          <kbd className="inline-flex items-center h-4.5 select-none pointer-events-none px-1 bg-background border border-border text-muted-foreground rounded text-[9px] font-mono font-medium">
            Ctrl K
          </kbd>
        </button>

        {/* Mobile Search Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="md:hidden text-muted-foreground hover:text-foreground p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          title="Toggle UI Theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-400" />}
        </button>

        {/* Notifications Hub Dropdown container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="text-muted-foreground hover:text-foreground p-2 hover:bg-secondary rounded-lg transition-colors relative cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 flex items-center justify-center bg-violet-600 text-[9px] font-bold text-white rounded-full border border-background shadow shadow-violet-500/25">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-xl overflow-hidden shadow-2xl z-50 flex flex-col">
              {/* Dropdown Header */}
              <div className="px-4 py-3 border-b border-border bg-secondary/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                    <Inbox className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <span className="text-[11px]">All caught up! No notifications.</span>
                  </div>
                ) : (
                  notifications.map((notif: any) => (
                    <button
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left px-4 py-3 hover:bg-secondary flex gap-3 transition-colors ${
                        !notif.isRead ? "bg-violet-500/5" : ""
                      }`}
                    >
                      <div className="mt-0.5">
                        <AlertCircle className={`h-4 w-4 ${!notif.isRead ? "text-violet-400" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground leading-tight">
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-muted-foreground/60 block mt-1">
                          {new Date(notif.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <div className="h-2 w-2 rounded-full bg-violet-600 self-center" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
