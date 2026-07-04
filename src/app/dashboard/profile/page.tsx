"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import {
  User as UserIcon,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  Sparkles,
  Tag,
  Loader2,
  CheckCircle,
  Clock,
  Activity,
  Award,
} from "lucide-react";

// Form validation schema
const profileSchema = zod.object({
  name: zod.string().min(3, "Name must be at least 3 characters"),
  phone: zod.string(),
  skillsInput: zod.string(),
  githubUsername: zod.string(),
  vercelUsername: zod.string(),
  discordUsername: zod.string(),
  clickupEmail: zod.string(),
});

type ProfileFormValues = zod.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const user = session?.user;

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      skillsInput: "",
      githubUsername: "",
      vercelUsername: "",
      discordUsername: "",
      clickupEmail: "",
    },
  });

  // Query: Get full user details and metrics
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      // We will create a small endpoint to fetch user data with metrics
      const res = await fetch("/api/profile/me");
      return res.json();
    },
    enabled: !!session,
  });

  // Pre-fill form when user details are retrieved
  React.useEffect(() => {
    if (userData?.user) {
      setValue("name", userData.user.name);
      setValue("phone", userData.user.phone || "");
      setValue("skillsInput", userData.user.skills?.join(", ") || "");
      setValue("githubUsername", userData.user.githubUsername || "");
      setValue("vercelUsername", userData.user.vercelUsername || "");
      setValue("discordUsername", userData.user.discordUsername || "");
      setValue("clickupEmail", userData.user.clickupEmail || "");
    }
  }, [userData, setValue]);

  // Mutation: Update Profile details
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const skills = values.skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          skills,
          githubUsername: values.githubUsername,
          vercelUsername: values.vercelUsername,
          discordUsername: values.discordUsername,
          clickupEmail: values.clickupEmail,
        }),
      });
      return res.json();
    },
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Profile details updated successfully!");
        // Invalidate profile query to refresh data
        queryClient.invalidateQueries({ queryKey: ["profile"] });

        // Update active session cookie details
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            phone: data.user.phone,
          },
        });
      } else {
        toast.error(data.error);
      }
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  const profile = userData?.user || user;
  const stats = userData?.stats || { openTasks: 0, completedTasks: 0, totalLeaves: 0 };

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
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Title Header */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-xl font-bold text-white tracking-tight">My Profile Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Customize your workspace portfolio details and track active productivity stats.
        </p>
      </div>

      {userLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Avatar and Quick Stats */}
          <div className="space-y-6">
            {/* Roster Profile Card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 text-center flex flex-col items-center gap-4 shadow">
              <Avatar name={profile?.name || "User"} sizeClass="h-24 w-24 text-xl" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white leading-tight">{profile?.name}</h3>
                <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-mono border mt-1.5 uppercase tracking-wide font-semibold ${getRoleBadgeColor(profile?.role)}`}>
                  {profile?.role}
                </span>
              </div>
            </div>

            {/* Handles Card */}
            {(profile?.githubUsername || profile?.vercelUsername || profile?.discordUsername || profile?.clickupEmail) && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block border-b border-zinc-900 pb-2">
                  Collaboration Handles
                </span>
                <div className="space-y-2 text-xs text-zinc-400">
                  {profile?.githubUsername && (
                    <div className="flex justify-between items-center">
                      <span>GitHub:</span>
                      <strong className="text-white font-mono">{profile.githubUsername}</strong>
                    </div>
                  )}
                  {profile?.vercelUsername && (
                    <div className="flex justify-between items-center">
                      <span>Vercel:</span>
                      <strong className="text-white font-mono">{profile.vercelUsername}</strong>
                    </div>
                  )}
                  {profile?.discordUsername && (
                    <div className="flex justify-between items-center">
                      <span>Discord:</span>
                      <strong className="text-white font-mono">{profile.discordUsername}</strong>
                    </div>
                  )}
                  {profile?.clickupEmail && (
                    <div className="flex justify-between items-center">
                      <span>ClickUp:</span>
                      <strong className="text-white font-mono">{profile.clickupEmail}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metrics block */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow space-y-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block border-b border-zinc-900 pb-2">
                Task & Activity Metrics
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-lg flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[9px] text-zinc-500 block">Open Tasks</span>
                    <strong className="text-white text-sm mt-0.5 block">{stats.openTasks}</strong>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[9px] text-zinc-500 block">Completed</span>
                    <strong className="text-white text-sm mt-0.5 block">{stats.completedTasks}</strong>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-lg flex items-center gap-2 col-span-2">
                  <Calendar className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                  <div>
                    <span className="text-[9px] text-zinc-500 block">Leaves Taken</span>
                    <strong className="text-white text-sm mt-0.5 block">{stats.totalLeaves} days</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Information Forms */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 shadow">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs">
                <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-3 mb-4">
                  Profile Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block">Full Name</label>
                    <input
                      type="text"
                      {...register("name")}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                    {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block">Phone Number</label>
                    <input
                      type="text"
                      {...register("phone")}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 block">Email Address (Read-Only)</label>
                    <div className="w-full bg-zinc-900/50 border border-zinc-900 text-zinc-500 px-3 py-2 rounded-lg font-semibold flex items-center gap-2 select-none">
                      <Mail className="h-4 w-4 text-zinc-600" /> {profile?.email}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 block">Designation (Read-Only)</label>
                    <div className="w-full bg-zinc-900/50 border border-zinc-900 text-zinc-500 px-3 py-2 rounded-lg font-semibold flex items-center gap-2 select-none">
                      <Briefcase className="h-4 w-4 text-zinc-600" /> {profile?.designation || "Engineer"}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-bold text-white block border-b border-zinc-900 pb-3 mt-6 mb-4">
                  Internship & Collaboration Profiles
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block">GitHub Username</label>
                    <input
                      type="text"
                      {...register("githubUsername")}
                      placeholder="e.g., narendramodi-cificap"
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block">Vercel Username/Email</label>
                    <input
                      type="text"
                      {...register("vercelUsername")}
                      placeholder="e.g., narendramodi.cificap@gmail.com"
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block">Discord Username</label>
                    <input
                      type="text"
                      {...register("discordUsername")}
                      placeholder="e.g., narendramodicificap"
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block">ClickUp Email ID</label>
                    <input
                      type="text"
                      {...register("clickupEmail")}
                      placeholder="e.g., narendramodi.cificap@gmail.com"
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Professional Skills (comma separated)</label>
                  <input
                    type="text"
                    {...register("skillsInput")}
                    placeholder="e.g., React, TypeScript, Next.js"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {profile?.skills && profile.skills.map((sk: string) => (
                      <span
                        key={sk}
                        className="text-[9px] bg-violet-600/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-semibold"
                      >
                        <Award className="h-2.5 w-2.5 text-violet-500" /> {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Submitting Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900 mt-5">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow shadow-violet-600/10 flex items-center gap-1.5"
                  >
                    {updateProfileMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
