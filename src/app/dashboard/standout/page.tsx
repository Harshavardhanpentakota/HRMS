"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import {
  Star,
  Plus,
  Loader2,
  Calendar,
  FileText,
  AlertCircle,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Users,
  Trophy,
  Activity,
  ArrowRight,
} from "lucide-react";

// Form Validation Schema
const standoutFormSchema = zod.object({
  weekStartDate: zod.string().min(1, "Week start date is required"),
  summary: zod.string().min(10, "Weekly summary must be at least 10 characters long"),
  accomplishments: zod.string().optional(),
  challenges: zod.string().optional(),
  plans: zod.string().optional(),
});

type StandoutFormValues = zod.infer<typeof standoutFormSchema>;

export default function StandoutPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const user = session?.user;

  const [activeTab, setActiveTab] = useState<"submit" | "history" | "team">("submit");
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [selectedWeekFilter, setSelectedWeekFilter] = useState("all");

  const isLeadOrAdmin = user?.role === "Admin" || user?.role === "Team Lead";

  // Helper to format Date to YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StandoutFormValues>({
    resolver: zodResolver(standoutFormSchema),
    defaultValues: {
      weekStartDate: getTodayString(),
      summary: "",
      accomplishments: "",
      challenges: "",
      plans: "",
    },
  });

  const selectedDate = watch("weekStartDate");

  // Query: Get standouts
  const { data: standoutsData, isLoading: standoutsLoading } = useQuery({
    queryKey: ["standouts"],
    queryFn: async () => {
      const res = await fetch("/api/standout");
      return res.json();
    },
    enabled: !!session,
  });

  const standouts = standoutsData?.standouts || [];

  // Filter standouts for user history vs team
  const myStandouts = standouts.filter((s: any) => s.userId?._id === user?.id);
  const teamStandouts = standouts.filter((s: any) => s.userId?._id !== user?.id);

  // Helper to normalize date to Monday
  const getMonday = (dStr: string) => {
    if (!dStr) return null;
    const d = new Date(dStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  };

  const getWeekRangeLabel = (dateInput: string | Date) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `Week of ${monday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} to ${sunday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  // Find if current selected date already has a summary submitted
  const selectedMonday = getMonday(selectedDate);
  const existingSummaryForWeek = standouts.find((s: any) => {
    if (!selectedMonday) return false;
    const sDate = new Date(s.weekStartDate);
    sDate.setHours(0, 0, 0, 0);
    return sDate.getTime() === selectedMonday.getTime() && s.userId?._id === user?.id;
  });

  // Load existing details into form helper
  const handleLoadExisting = () => {
    if (existingSummaryForWeek) {
      setValue("summary", existingSummaryForWeek.summary || "");
      setValue("accomplishments", existingSummaryForWeek.accomplishments || "");
      setValue("challenges", existingSummaryForWeek.challenges || "");
      setValue("plans", existingSummaryForWeek.plans || "");
      toast.success("Loaded existing entry details for editing.");
    }
  };

  // Mutation: Submit standout
  const submitStandoutMutation = useMutation({
    mutationFn: async (data: StandoutFormValues) => {
      const res = await fetch("/api/standout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["standouts"] });
        reset({
          weekStartDate: selectedDate, // keep the date
          summary: "",
          accomplishments: "",
          challenges: "",
          plans: "",
        });
      } else {
        toast.error(data.error);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Something went wrong.");
    },
  });

  const onSubmit = (values: StandoutFormValues) => {
    submitStandoutMutation.mutate(values);
  };

  // Toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedSummaryId(expandedSummaryId === id ? null : id);
  };

  // Filter team standouts
  const filteredTeamStandouts = teamStandouts.filter((s: any) => {
    const matchesSearch =
      s.userId?.name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      s.userId?.designation?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      s.userId?.email?.toLowerCase().includes(teamSearch.toLowerCase());

    const mon = new Date(s.weekStartDate);
    const weekLabel = mon.toLocaleDateString();
    const matchesWeek = selectedWeekFilter === "all" || weekLabel === selectedWeekFilter;

    return matchesSearch && matchesWeek;
  });

  // Get list of unique weeks for filters
  const uniqueWeeks = Array.from(
    new Set(standouts.map((s: any) => new Date(s.weekStartDate).toLocaleDateString()))
  ).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime()) as string[];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-zinc-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Star className="h-5 w-5 text-violet-500 fill-violet-500/10" /> Weekly Work Standout
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Submit your weekly achievements, summaries, challenges, and plan deliverables to keep the team aligned.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <FileText className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Your Total Submissions</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{myStandouts.length}</h3>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">This Week's Status</p>
            <h3 className="text-sm font-bold mt-1 text-white">
              {myStandouts.some((s: any) => {
                const now = getMonday(new Date().toLocaleDateString());
                const sDate = new Date(s.weekStartDate);
                return now && sDate.getTime() === now.getTime();
              }) ? (
                <span className="text-emerald-400 flex items-center gap-1">Submitted</span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">Pending Submission</span>
              )}
            </h3>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            {isLeadOrAdmin ? (
              <Users className="h-5 w-5 text-indigo-400" />
            ) : (
              <Activity className="h-5 w-5 text-indigo-400" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              {isLeadOrAdmin ? "Team Submissions Count" : "Last Submission Date"}
            </p>
            <h3 className="text-sm font-bold text-white mt-0.5">
              {isLeadOrAdmin ? (
                teamStandouts.length
              ) : myStandouts.length > 0 ? (
                new Date(myStandouts[0].createdAt).toLocaleDateString()
              ) : (
                "Never"
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 gap-6">
        <button
          onClick={() => setActiveTab("submit")}
          className={`pb-3 text-xs font-semibold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "submit"
              ? "border-violet-600 text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Submit Summary
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 text-xs font-semibold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "history"
              ? "border-violet-600 text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          My History ({myStandouts.length})
        </button>
        {isLeadOrAdmin && (
          <button
            onClick={() => setActiveTab("team")}
            className={`pb-3 text-xs font-semibold tracking-wide transition-all border-b-2 cursor-pointer ${
              activeTab === "team"
                ? "border-violet-600 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Team Summaries ({teamStandouts.length})
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === "submit" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-xl p-6 shadow space-y-4">
              <div className="border-b border-zinc-900 pb-3 mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-violet-400" /> Weekly Summary Details
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {selectedDate ? getWeekRangeLabel(selectedDate) : ""}
                </span>
              </div>

              {existingSummaryForWeek && (
                <div className="bg-violet-950/20 border border-violet-900/40 p-3.5 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="flex gap-2 text-violet-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-violet-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">Existing Summary Found</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        You have already submitted a summary for this week. Submitting will update the record.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadExisting}
                    className="bg-violet-900/40 hover:bg-violet-900/70 border border-violet-850 px-2.5 py-1 rounded text-[10px] text-white font-medium cursor-pointer transition-colors"
                  >
                    Edit Current Entry
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Select Week Start Date</label>
                  <input
                    type="date"
                    {...register("weekStartDate")}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch (err) {}
                    }}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 cursor-pointer"
                  />
                  {errors.weekStartDate && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.weekStartDate.message}</p>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-1 italic">
                    Note: Your summary will be grouped into the week containing this date.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">
                    Weekly Work Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    {...register("summary")}
                    placeholder="High level overview of what you worked on this week. Be descriptive..."
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 resize-none placeholder-zinc-600"
                  />
                  {errors.summary && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.summary.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Key Accomplishments (Optional)</label>
                  <textarea
                    rows={3}
                    {...register("accomplishments")}
                    placeholder="List bullet points of items resolved, merged code, features delivered, etc..."
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 resize-none placeholder-zinc-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Challenges & Obstacles (Optional)</label>
                  <textarea
                    rows={3}
                    {...register("challenges")}
                    placeholder="Mention code blockers, external dependencies delayed, or specific issues..."
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 resize-none placeholder-zinc-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Plans for Next Week (Optional)</label>
                  <textarea
                    rows={3}
                    {...register("plans")}
                    placeholder="Provide short bullets of your planned tasks or deliverables for next week..."
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 resize-none placeholder-zinc-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitStandoutMutation.isPending}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-2.5 text-xs font-semibold shadow shadow-violet-600/10 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  {submitStandoutMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : existingSummaryForWeek ? (
                    "Update Weekly Standout"
                  ) : (
                    "Submit Weekly Standout"
                  )}
                </button>
              </form>
            </div>

            {/* Sidebar Guide */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow h-fit space-y-4">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Star className="h-4.5 w-4.5 text-violet-400" /> Standout Guidelines
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Standouts help engineering leads and managers understand weekly outputs without asking in chat. Keep these suggestions in mind:
              </p>
              <ul className="text-[10px] text-zinc-400 space-y-2 list-disc pl-4">
                <li>
                  <strong className="text-zinc-300">Summarize clearly:</strong> High level overview of project context.
                </li>
                <li>
                  <strong className="text-zinc-300">Share achievements:</strong> Document merged pull requests or closed issues.
                </li>
                <li>
                  <strong className="text-zinc-300">Flag obstacles:</strong> Don't keep challenges hidden; listing blockers allows leads to help unblock you.
                </li>
                <li>
                  <strong className="text-zinc-300">Set future roadmap:</strong> Detail what you intend to focus on next.
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {standoutsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
              </div>
            ) : myStandouts.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-12 text-center text-xs text-zinc-500 shadow">
                <FileText className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                <p className="font-semibold text-zinc-400">No submissions recorded yet</p>
                <p className="text-zinc-500 text-[11px] mt-1">Submit your first Weekly Standout from the form tab.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myStandouts.map((item: any) => (
                  <div key={item._id} className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
                    {/* Header */}
                    <div
                      onClick={() => toggleExpand(item._id)}
                      className="px-5 py-4 border-b border-zinc-900/60 bg-zinc-950/40 flex items-center justify-between cursor-pointer hover:bg-zinc-900/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-violet-400">
                          <Calendar className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{getWeekRangeLabel(item.weekStartDate)}</h4>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">
                            Submitted on {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded transition-colors">
                          {expandedSummaryId === item._id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`px-5 transition-all duration-200 overflow-hidden ${
                      expandedSummaryId === item._id ? "py-5 border-t border-zinc-900 max-h-[1000px]" : "max-h-0"
                    }`}>
                      <div className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block">
                            Weekly Overview
                          </span>
                          <p className="text-zinc-300 leading-relaxed font-sans text-xs bg-zinc-900/30 border border-zinc-900/60 p-3 rounded-lg">
                            {item.summary}
                          </p>
                        </div>

                        {item.accomplishments && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide block">
                              Key Accomplishments
                            </span>
                            <p className="text-zinc-300 leading-relaxed font-sans text-xs bg-emerald-950/5 border border-emerald-900/10 p-3 rounded-lg whitespace-pre-line">
                              {item.accomplishments}
                            </p>
                          </div>
                        )}

                        {item.challenges && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide block">
                              Challenges & Blockers
                            </span>
                            <p className="text-zinc-300 leading-relaxed font-sans text-xs bg-amber-950/5 border border-amber-900/10 p-3 rounded-lg whitespace-pre-line">
                              {item.challenges}
                            </p>
                          </div>
                        )}

                        {item.plans && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide block">
                              Next Week Plans
                            </span>
                            <p className="text-zinc-300 leading-relaxed font-sans text-xs bg-indigo-950/5 border border-indigo-900/10 p-3 rounded-lg whitespace-pre-line">
                              {item.plans}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "team" && isLeadOrAdmin && (
          <div className="space-y-5">
            {/* Filter Bar */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search team member or role..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 placeholder-zinc-650"
                />
              </div>

              <div className="flex items-center gap-2 text-xs w-full md:w-auto">
                <span className="text-zinc-500 whitespace-nowrap">Filter Week:</span>
                <select
                  value={selectedWeekFilter}
                  onChange={(e) => setSelectedWeekFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 cursor-pointer w-full md:w-auto min-w-[150px]"
                >
                  <option value="all">All Weeks</option>
                  {uniqueWeeks.map((wkStr) => (
                    <option key={wkStr} value={wkStr}>
                      {getWeekRangeLabel(wkStr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submissions List */}
            {standoutsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
              </div>
            ) : filteredTeamStandouts.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-12 text-center text-xs text-zinc-500 shadow">
                <Users className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                <p className="font-semibold text-zinc-400">No team submissions match filter criteria</p>
                <p className="text-zinc-500 text-[11px] mt-1">Try resetting search string or selecting another week.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTeamStandouts.map((item: any) => (
                  <div key={item._id} className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
                    {/* Collapsible Card Header */}
                    <div
                      onClick={() => toggleExpand(item._id)}
                      className="px-5 py-4.5 border-b border-zinc-900/60 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={item.userId?.name || "Employee"}
                          sizeClass="h-9 w-9 text-xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white leading-none">{item.userId?.name}</h4>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded">
                              {item.userId?.designation || "Software Engineer"}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 block mt-1">
                            {getWeekRangeLabel(item.weekStartDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="text-[10px] text-zinc-500">
                          Submitted on {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <button className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded transition-colors">
                          {expandedSummaryId === item._id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Card Content body */}
                    <div className={`px-5 transition-all duration-200 overflow-hidden ${
                      expandedSummaryId === item._id ? "py-5 border-t border-zinc-900 max-h-[1000px]" : "max-h-0"
                    }`}>
                      <div className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block">
                            Weekly Summary
                          </span>
                          <p className="text-zinc-300 leading-relaxed font-sans text-xs bg-zinc-900/30 border border-zinc-900/60 p-3 rounded-lg">
                            {item.summary}
                          </p>
                        </div>

                        {item.accomplishments && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide block">
                              Key Accomplishments
                            </span>
                            <p className="text-zinc-300 leading-relaxed font-sans text-xs bg-emerald-950/5 border border-emerald-900/10 p-3 rounded-lg whitespace-pre-line">
                              {item.accomplishments}
                            </p>
                          </div>
                        )}

                        {item.challenges && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide block">
                              Challenges & Blockers
                            </span>
                            <p className="text-zinc-300 leading-relaxed font-sans text-xs bg-amber-950/5 border border-amber-900/10 p-3 rounded-lg whitespace-pre-line">
                              {item.challenges}
                            </p>
                          </div>
                        )}

                        {item.plans && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide block">
                              Next Week Plans
                            </span>
                            <p className="text-zinc-300 leading-relaxed font-sans text-xs bg-indigo-950/5 border border-indigo-900/10 p-3 rounded-lg whitespace-pre-line">
                              {item.plans}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
