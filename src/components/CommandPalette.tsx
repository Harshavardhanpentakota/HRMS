"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/hooks/use-ui";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Megaphone,
  GraduationCap,
  Users,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

export default function CommandPalette() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    theme,
    toggleTheme,
  } = useUIStore();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle Command Palette on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch("");
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const handleNavigate = (path: string) => {
    router.push(path);
    setCommandPaletteOpen(false);
  };

  // Define commands list
  const commands = [
    {
      id: "dashboard",
      title: "Go to Dashboard",
      icon: LayoutDashboard,
      action: () => handleNavigate("/dashboard"),
      category: "Navigation",
    },
    {
      id: "tasks",
      title: "View Task board",
      icon: CheckSquare,
      action: () => handleNavigate("/dashboard/tasks"),
      category: "Navigation",
    },
    {
      id: "leaves",
      title: "View Leave history / Apply",
      icon: Calendar,
      action: () => handleNavigate("/dashboard/leaves"),
      category: "Navigation",
    },
    {
      id: "announcements",
      title: "Read Announcements",
      icon: Megaphone,
      action: () => handleNavigate("/dashboard/announcements"),
      category: "Navigation",
    },
    {
      id: "training",
      title: "Training Sessions",
      icon: GraduationCap,
      action: () => handleNavigate("/dashboard/training"),
      category: "Navigation",
    },
    {
      id: "team",
      title: "View Team members",
      icon: Users,
      action: () => handleNavigate("/dashboard/team"),
      category: "Navigation",
    },
    {
      id: "profile",
      title: "My User Profile",
      icon: User,
      action: () => handleNavigate("/dashboard/profile"),
      category: "Navigation",
    },

    {
      id: "theme",
      title: `Toggle Theme (Current: ${theme.toUpperCase()})`,
      icon: theme === "dark" ? Sun : Moon,
      action: () => {
        toggleTheme();
        setCommandPaletteOpen(false);
      },
      category: "Settings",
    },
    {
      id: "signout",
      title: "Log Out of Session",
      icon: LogOut,
      action: () => {
        signOut({ callbackUrl: "/login" });
        setCommandPaletteOpen(false);
      },
      category: "Session",
    },
  ];

  // Filtering based on search query
  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div
      onClick={() => setCommandPaletteOpen(false)}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col scale-[1.01] transition-transform duration-100"
      >
        {/* Search header */}
        <div className="flex items-center px-4 border-b border-zinc-800 bg-zinc-900/20">
          <Search className="h-5 w-5 text-zinc-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or page search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full py-4 bg-transparent border-none text-white text-sm focus:outline-none placeholder-zinc-500"
          />
          <kbd className="hidden sm:inline-flex items-center h-5 select-none pointer-events-none px-1.5 font-mono text-[10px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Action list */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No matching commands or navigation paths found.
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-3 py-3 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isSelected
                      ? "bg-violet-600 text-white"
                      : "text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${isSelected ? "text-white" : "text-zinc-500"}`} />
                    <span className="font-medium">{cmd.title}</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected ? "bg-violet-500 text-violet-100" : "bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-900/10 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <div className="flex gap-4">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>Cificap Platform Workspace</span>
        </div>
      </div>
    </div>
  );
}
