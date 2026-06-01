"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";

import {
  Megaphone,
  Pin,
  Eye,
  Plus,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  Users,
  EyeOff,
  User as UserIcon,
  Search,
} from "lucide-react";

// Form validation schema
const annFormSchema = zod.object({
  title: zod.string().min(3, "Title must be at least 3 characters"),
  content: zod.string().min(5, "Content must be at least 5 characters"),
  teamVisibility: zod.string().nullable(),
  pinned: zod.boolean(),
});

type AnnFormValues = zod.infer<typeof annFormSchema>;

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const user = session?.user;

  // Visual filter state
  const [search, setSearch] = useState("");
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isPublisher = user?.role === "Admin" || user?.role === "Team Lead";

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnFormValues>({
    resolver: zodResolver(annFormSchema),
    defaultValues: {
      title: "",
      content: "",
      teamVisibility: null,
      pinned: false,
    },
  });

  // Query: Get announcements
  const { data: annData, isLoading: annLoading } = useQuery({
    queryKey: ["announcements", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await fetch(`/api/announcements?${params.toString()}`);
      return res.json();
    },
    enabled: !!session,
  });

  // Query: Get teams (for publishers to target)
  const { data: teamsData } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/team"); // we will create /api/team route in team module
      return res.json();
    },
    enabled: isPublisher && !!session,
  });

  // Mutation: Publish announcement
  const publishAnnMutation = useMutation({
    mutationFn: async (data: AnnFormValues) => {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
        setIsPublishOpen(false);
        reset();
      } else {
        toast.error(data.error);
      }
    },
  });

  // Mutation: Mark announcement as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/announcements/${id}/read`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const handlePublish = (values: AnnFormValues) => {
    // If Team Lead, force visibility to their own team
    if (user?.role === "Team Lead") {
      values.teamVisibility = user.teamId || null;
    }
    publishAnnMutation.mutate(values);
  };

  const handleExpand = (ann: any) => {
    if (expandedId === ann._id) {
      setExpandedId(null);
    } else {
      setExpandedId(ann._id);
      // If user hasn't read it yet, call the read-tracking API
      const hasRead = ann.readBy?.includes(user?.id);
      if (!hasRead) {
        markReadMutation.mutate(ann._id);
      }
    }
  };

  const announcements = annData?.announcements || [];
  const teams = teamsData?.teams || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-full">
      {/* Title block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Announcements</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Broadcast core guidelines, sync updates, and check tracking status metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-600 transition-all placeholder-zinc-500"
            />
          </div>

          {/* Publisher action */}
          {isPublisher && (
            <button
              onClick={() => setIsPublishOpen(true)}
              className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow shadow-violet-600/10 cursor-pointer active:scale-98"
            >
              <Plus className="h-4 w-4" /> Publish Post
            </button>
          )}
        </div>
      </div>

      {/* Main announcements feed */}
      {annLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-950/20 border border-zinc-900/60 border-dashed rounded-2xl text-center">
          <AlertCircle className="h-10 w-10 text-zinc-700 mb-3" />
          <h3 className="text-sm font-semibold text-white">No active announcements</h3>
          <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
            Check back later! Announcements published by Leads or Admins will appear in this timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann: any) => {
            const isExpanded = expandedId === ann._id;
            const hasRead = ann.readBy?.includes(user?.id);
            const totalReads = ann.readBy?.length || 0;

            return (
              <div
                key={ann._id}
                onClick={() => handleExpand(ann)}
                className={`bg-zinc-950 border p-5 rounded-xl cursor-pointer transition-all relative flex flex-col gap-4 shadow hover:shadow-violet-600/5 ${
                  ann.pinned
                    ? "border-violet-600/30 bg-violet-950/5 hover:border-violet-600/50"
                    : "border-zinc-900 hover:border-zinc-800"
                }`}
              >
                {/* Top header details */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={ann.authorId?.name || "Author"}
                      sizeClass="h-8.5 w-8.5 text-[10px]"
                    />

                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {ann.authorId?.name}
                        {ann.pinned && (
                          <span className="bg-violet-600/20 text-violet-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-violet-500/20 flex items-center gap-0.5 uppercase tracking-wide">
                            <Pin className="h-2 w-2" /> PINNED
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                        <span>{ann.authorId?.role}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visibility & Read Badges */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                      {ann.teamVisibility ? `👥 Team: ${ann.teamVisibility.name}` : "🌐 Company-Wide"}
                    </span>
                    {!hasRead && (
                      <span className="h-2 w-2 rounded-full bg-violet-600" title="Unread" />
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">
                    {ann.title}
                  </h3>
                  <p className={`text-xs text-zinc-400 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                    {ann.content}
                  </p>
                </div>

                {/* Collapsed/Expanded timeline features */}
                {isExpanded && (
                  <div className="pt-4 border-t border-zinc-900/60 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[10px] text-zinc-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-zinc-500" /> Read by {totalReads} members
                      </span>
                    </div>
                    <span>Click to collapse details</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PUBLISH MODAL (Guarded) */}
      {isPublishOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Publish Announcement</h3>
              <button
                onClick={() => setIsPublishOpen(false)}
                className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handlePublish)} className="overflow-y-auto p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Title</label>
                <input
                  type="text"
                  {...register("title")}
                  placeholder="e.g., Spring Hackathon Announcement"
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                />
                {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title.message}</p>}
              </div>

              {/* Visibility and pinning properties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Team Visibility</label>
                  {user?.role === "Team Lead" ? (
                    <div className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2.5 text-zinc-500 font-semibold select-none">
                      👤 My Assigned Team Only
                    </div>
                  ) : (
                    <select
                      {...register("teamVisibility")}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="">Company-Wide (All Employees)</option>
                      {teams.map((t: any) => (
                        <option key={t._id} value={t._id}>
                          👥 Team: {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Pin to top</label>
                  <select
                    {...register("pinned")}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="false">Regular Post</option>
                    <option value="true">📌 Critical Pin (High Priority)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Content</label>
                <textarea
                  rows={6}
                  {...register("content")}
                  placeholder="Provide structured, detailed information for the team..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none resize-none"
                />
                {errors.content && <p className="text-[10px] text-red-500 mt-1">{errors.content.message}</p>}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
                <button
                  type="button"
                  onClick={() => setIsPublishOpen(false)}
                  className="px-3.5 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishAnnMutation.isPending}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  {publishAnnMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
