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
  Users,
  Plus,
  X,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  Award,
  ChevronRight,
  Shield,
  UserPlus,
  AlertCircle,
} from "lucide-react";

// Form validation schemas
const teamFormSchema = zod.object({
  name: zod.string().min(3, "Team name must be at least 3 characters"),
  description: zod.string(),
  leadId: zod.string().min(1, "Team Lead is required"),
});

const memberFormSchema = zod.object({
  name: zod.string().min(3, "Name must be at least 3 characters"),
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
  role: zod.enum(["Team Lead", "Employee"]),
  designation: zod.string().min(2, "Designation must be at least 2 characters"),
  phone: zod.string(),
  teamId: zod.string().optional().nullable(),
  leadId: zod.string().optional().nullable(),
  skillsInput: zod.string(),
});


type TeamFormValues = zod.infer<typeof teamFormSchema>;
type MemberFormValues = zod.infer<typeof memberFormSchema>;

export default function TeamPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const currentUser = session?.user;

  // Modals visibility state
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isMemberOpen, setIsMemberOpen] = useState(false);

  const isAdmin = currentUser?.role === "Admin";

  // Form: Create Team
  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: "", description: "", leadId: "" },
  });

  // Form: Create Member
  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "password123", // default temporary password
      role: "Employee",
      designation: "",
      phone: "",
      teamId: null,
      leadId: null,
      skillsInput: "",
    },
  });

  // Query: Get all teams
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      return res.json();
    },
    enabled: !!session,
  });

  // Query: Get team roster members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["teamMembersList"],
    queryFn: async () => {
      const res = await fetch("/api/team/members");
      return res.json();
    },
    enabled: !!session,
  });

  // Mutation: Create Team
  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormValues) => {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["teams"] });
        queryClient.invalidateQueries({ queryKey: ["teamMembersList"] });
        setIsTeamOpen(false);
        teamForm.reset();
      } else {
        toast.error(data.error);
      }
    },
  });

  // Mutation: Create Member
  const createMemberMutation = useMutation({
    mutationFn: async (data: MemberFormValues) => {
      const res = await fetch("/api/team/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["teamMembersList"] });
        setIsMemberOpen(false);
        memberForm.reset();
      } else {
        toast.error(data.error);
      }
    },
  });

  const handleCreateTeam = (values: TeamFormValues) => {
    createTeamMutation.mutate(values);
  };

  const handleCreateMember = (values: MemberFormValues) => {
    createMemberMutation.mutate(values);
  };

  const teams = teamsData?.teams || [];
  const members = membersData?.members || [];

  // Filter Team Leads (for dropdown select)
  const teamLeads = members.filter((m: any) => m.role === "Team Lead");

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
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Team Space</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isAdmin 
              ? "Organization console for managing corporate squads and user roles."
              : "Roster directory and teammate profiles."}
          </p>
        </div>

        {/* Admin only operational deck */}
        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsTeamOpen(true)}
              className="px-3.5 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Users className="h-4 w-4" /> Create Team
            </button>
            <button
              onClick={() => setIsMemberOpen(true)}
              className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow shadow-violet-600/10 cursor-pointer active:scale-98"
            >
              <UserPlus className="h-4 w-4" /> Add Member
            </button>
          </div>
        )}
      </div>

      {/* Directory Grid */}
      {membersLoading || teamsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-950/20 border border-zinc-900 border-dashed rounded-2xl text-center">
          <AlertCircle className="h-10 w-10 text-zinc-700 mb-3" />
          <h3 className="text-sm font-semibold text-white">No teammates recorded</h3>
          <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
            Members registered under the organization will display here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((member: any) => {
            const team = teams.find((t: any) => t._id === member.teamId);
            return (
              <div
                key={member._id}
                className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex flex-col gap-4 relative shadow hover:shadow-violet-600/5 group"
              >
                {/* Header details with profile and badge */}
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} sizeClass="h-11 w-11 text-xs" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors truncate">
                      {member.name}
                    </h3>
                    <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                      {member.designation || "Roster Member"}
                    </span>
                  </div>
                </div>

                {/* Team Info / Meta */}
                <div className="p-3 bg-zinc-900/30 border border-zinc-900/60 rounded-lg flex flex-col gap-1.5 text-[10px] text-zinc-400 font-medium">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Role: <strong className={`font-mono border px-1 rounded ${getRoleBadgeColor(member.role)}`}>{member.role}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Team: <strong className="text-zinc-300">{team ? team.name : "Unassigned"}</strong></span>
                  </div>
                </div>

                {/* Tags skills list */}
                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 border-t border-zinc-900 pt-3">
                    {member.skills.slice(0, 3).map((sk: string) => (
                      <span
                        key={sk}
                        className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="text-[8px] text-zinc-600 self-center">+{member.skills.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Action button details */}
                <a
                  href={`mailto:${member.email}`}
                  className="w-full mt-2.5 py-2 border border-zinc-900 bg-zinc-950 hover:bg-zinc-900/50 text-[10px] font-semibold text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" /> Email Teammate
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TEAM MODAL (Admin only) */}
      {isAdmin && isTeamOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Create Squad / Team</h3>
              <button
                onClick={() => setIsTeamOpen(false)}
                className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={teamForm.handleSubmit(handleCreateTeam)} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Team Name</label>
                <input
                  type="text"
                  {...teamForm.register("name")}
                  placeholder="e.g., Frontend Engineering"
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                />
                {teamForm.formState.errors.name && (
                  <p className="text-[10px] text-red-500 mt-1">{teamForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Squad Lead Assignment</label>
                <select
                  {...teamForm.register("leadId")}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Team Lead...</option>
                  {teamLeads.map((m: any) => (
                    <option key={m._id} value={m._id}>
                      👤 {m.name} ({m.designation})
                    </option>
                  ))}
                </select>
                {teamForm.formState.errors.leadId && (
                  <p className="text-[10px] text-red-500 mt-1">{teamForm.formState.errors.leadId.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Squad Description</label>
                <textarea
                  rows={3}
                  {...teamForm.register("description")}
                  placeholder="Describe sprint deliverables and visual context..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
                <button
                  type="button"
                  onClick={() => setIsTeamOpen(false)}
                  className="px-3.5 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeamMutation.isPending}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  {createTeamMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MEMBER MODAL (Admin only) */}
      {isAdmin && isMemberOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[95vh]">
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Create Teammate Account</h3>
              <button
                onClick={() => setIsMemberOpen(false)}
                className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={memberForm.handleSubmit(handleCreateMember)} className="overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Full Name</label>
                  <input
                    type="text"
                    {...memberForm.register("name")}
                    placeholder="e.g., Alex Carter"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                  />
                  {memberForm.formState.errors.name && (
                    <p className="text-[10px] text-red-500 mt-1">{memberForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Phone Number</label>
                  <input
                    type="text"
                    {...memberForm.register("phone")}
                    placeholder="e.g., +91 98765 43213"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Email Address</label>
                  <input
                    type="email"
                    {...memberForm.register("email")}
                    placeholder="e.g., alex.c@cificap.com"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                  />
                  {memberForm.formState.errors.email && (
                    <p className="text-[10px] text-red-500 mt-1">{memberForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Password (Default)</label>
                  <input
                    type="text"
                    {...memberForm.register("password")}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  {memberForm.formState.errors.password && (
                    <p className="text-[10px] text-red-500 mt-1">{memberForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Designation</label>
                  <input
                    type="text"
                    {...memberForm.register("designation")}
                    placeholder="e.g., Senior Frontend Engineer"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                  />
                  {memberForm.formState.errors.designation && (
                    <p className="text-[10px] text-red-500 mt-1">{memberForm.formState.errors.designation.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Roster Role</label>
                  <select
                    {...memberForm.register("role")}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="Employee">Employee (Teammate)</option>
                    <option value="Team Lead">Team Lead (Manager)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Squad / Team link</label>
                  <select
                    {...memberForm.register("teamId")}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">Unassigned (Select squad)...</option>
                    {teams.map((t: any) => (
                      <option key={t._id} value={t._id}>
                        👥 Squad: {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Team Lead / Manager</label>
                  <select
                    {...memberForm.register("leadId")}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">No manager (Select lead)...</option>
                    {teamLeads.map((lead: any) => (
                      <option key={lead._id} value={lead._id}>
                        👤 Manager: {lead.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Teammate Skills (comma separated)</label>
                <input
                  type="text"
                  {...memberForm.register("skillsInput")}
                  placeholder="e.g., React, TypeScript, Next.js"
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
                <button
                  type="button"
                  onClick={() => setIsMemberOpen(false)}
                  className="px-3.5 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMemberMutation.isPending}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 animate-pulse"
                >
                  {createMemberMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Teammate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
