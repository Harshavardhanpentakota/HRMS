import React from "react";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  User,
  Task,
  Leave,
  Announcement,
  ActivityLog,
  TrainingProgress,
  Team,
} from "@/lib/models";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import {
  Users,
  CheckSquare,
  Calendar,
  Megaphone,
  Activity,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Clock,
  GraduationCap,
  Plus,
  Zap,
} from "lucide-react";

export const revalidate = 0; // Disable server-side page caching for real-time dashboards

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  await connectToDatabase();
  const user = session.user;

  // =========================================================================
  // ADMIN DASHBOARD PIPELINE
  // =========================================================================
  if (user.role === "Admin") {
    const [
      totalEmployees,
      totalLeads,
      openTasks,
      completedTasks,
      pendingLeaves,
      recentAnnouncements,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments({ role: "Employee" }),
      User.countDocuments({ role: "Team Lead" }),
      Task.countDocuments({ status: { $ne: "Completed" } }),
      Task.countDocuments({ status: "Completed" }),
      Leave.countDocuments({ status: "Pending" }),
      Announcement.find({}).sort({ createdAt: -1 }).limit(3).lean(),
      ActivityLog.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("actorId", "name profilePicture")
        .lean(),
    ]);

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Banner Welcome */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="h-6 w-6 text-violet-500" /> Welcome back, {user.name}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Platform administrator dashboard for Cificap Platform Services.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/team"
              className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow shadow-violet-500/10 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Manage Team
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4 relative overflow-hidden">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Employees
              </p>
              <h3 className="text-xl font-bold text-white mt-0.5">{totalEmployees}</h3>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4 relative overflow-hidden">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Team Leads
              </p>
              <h3 className="text-xl font-bold text-white mt-0.5">{totalLeads}</h3>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4 relative overflow-hidden">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Open Tasks
              </p>
              <h3 className="text-xl font-bold text-white mt-0.5">{openTasks}</h3>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4 relative overflow-hidden">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Completed
              </p>
              <h3 className="text-xl font-bold text-white mt-0.5">{completedTasks}</h3>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4 relative overflow-hidden">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Pending Leaves
              </p>
              <h3 className="text-xl font-bold text-white mt-0.5">{pendingLeaves}</h3>
            </div>
          </div>
        </div>

        {/* Dashboard Grid layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main activities feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent activities log */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
              <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-400" /> Recent Activities
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">No platform activities logged yet.</p>
                ) : (
                  recentActivities.map((act: any) => (
                    <div key={act._id} className="flex gap-3 text-xs leading-relaxed">
                      <Avatar name={act.actorId?.name || "Deleted User"} sizeClass="h-8 w-8 text-[10px]" />
                      <div className="flex-1">
                        <p className="text-zinc-300">
                          <strong className="text-white">{act.actorId?.name || "Deleted User"}</strong>{" "}
                          {act.action}
                        </p>
                        <span className="text-[10px] text-zinc-500 block mt-1">
                          {new Date(act.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Side pane: Recent Announcements */}
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
              <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-indigo-400" /> Recent Announcements
                </h2>
                <Link
                  href="/dashboard/announcements"
                  className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1"
                >
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-5 space-y-4 divide-y divide-zinc-900">
                {recentAnnouncements.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">No announcements published.</p>
                ) : (
                  recentAnnouncements.map((ann: any, index) => (
                    <div key={ann._id} className={`text-xs ${index > 0 ? "pt-4" : ""}`}>
                      <h4 className="font-semibold text-white truncate">{ann.title}</h4>
                      <p className="text-zinc-400 text-[11px] mt-1.5 line-clamp-2">
                        {ann.content.replace(/<[^>]*>/g, "")}
                      </p>
                      <span className="text-[9px] text-zinc-500 block mt-2">
                        {new Date(ann.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TEAM LEAD DASHBOARD PIPELINE
  // =========================================================================
  if (user.role === "Team Lead") {
    // A Team Lead accesses employees assigned to them (leadId is current Team Lead)
    const team = await Team.findOne({ leadId: user.id }).lean();
    const teamMembers = await User.find({ leadId: user.id }).select("name email profilePicture designation").lean();
    const memberIds = teamMembers.map((m) => m._id);

    const [
      teamTasks,
      pendingReviewsCount,
      pendingLeaves,
      recentTeamActivities,
    ] = await Promise.all([
      Task.find({ assigneeId: { $in: memberIds } })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate("assigneeId", "name profilePicture")
        .lean(),
      Task.countDocuments({ assigneeId: { $in: memberIds }, status: "Review" }),
      Leave.find({ employeeId: { $in: memberIds }, status: "Pending" })
        .populate("employeeId", "name profilePicture")
        .lean(),
      ActivityLog.find({ actorId: { $in: memberIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("actorId", "name profilePicture")
        .lean(),
    ]);

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Banner Welcome */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              👤 Hello, Lead {user.name}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Management workspace for team:{" "}
              <strong className="text-violet-400">{team?.name || "Assigned Team"}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tasks?create=true"
              className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow active:scale-95"
            >
              <Plus className="h-4 w-4" /> Create Task
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Team Members
              </p>
              <h3 className="text-xl font-bold text-white mt-0.5">{teamMembers.length}</h3>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Active Tasks
              </p>
              <h3 className="text-xl font-bold text-white mt-0.5">{teamTasks.length}</h3>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Pending Reviews
              </p>
              <h3 className="text-xl font-bold text-white mt-0.5">{pendingReviewsCount}</h3>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Pending Leaves
              </p>
              <h3 className="text-xl font-bold text-white mt-0.5">{pendingLeaves.length}</h3>
            </div>
          </div>
        </div>

        {/* Lead Dashboard sections grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: Team Tasks table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Tasks */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
              <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-violet-400" /> Active Team Tasks
                </h2>
                <Link href="/dashboard/tasks" className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1">
                  All Tasks <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-zinc-900">
                {teamTasks.length === 0 ? (
                  <p className="text-xs text-zinc-500 p-8 text-center">No active tasks assigned to this team.</p>
                ) : (
                  teamTasks.map((t: any) => (
                    <div key={t._id} className="p-4 flex items-center justify-between text-xs hover:bg-zinc-900/10">
                      <div className="min-w-0 flex-1 pr-4">
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
                          {t.project}
                        </span>
                        <h4 className="font-semibold text-white mt-2 truncate">{t.title}</h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            t.status === "Review"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : t.status === "In Progress"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-zinc-900 text-zinc-500 border-zinc-800"
                          }`}
                        >
                          {t.status}
                        </span>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Avatar name={t.assigneeId?.name || "Member"} sizeClass="h-6 w-6 text-[9px]" />
                          <span className="text-[10px] text-zinc-400 truncate">{t.assigneeId?.name}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Leave Requests */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
              <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-rose-400" /> Pending Leave Requests ({pendingLeaves.length})
                </h2>
              </div>
              <div className="divide-y divide-zinc-900">
                {pendingLeaves.length === 0 ? (
                  <p className="text-xs text-zinc-500 p-6 text-center">No pending leave approvals needed.</p>
                ) : (
                  pendingLeaves.map((lv: any) => (
                    <div key={lv._id} className="p-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <Avatar name={lv.employeeId?.name || "Employee"} sizeClass="h-8 w-8 text-[10px]" />
                        <div>
                          <strong className="text-white text-[11px] block">{lv.employeeId?.name}</strong>
                          <span className="text-[10px] text-zinc-400 mt-1 block">
                            Reason: {lv.reason}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          {new Date(lv.startDate).toLocaleDateString("en-US")} -{" "}
                          {new Date(lv.endDate).toLocaleDateString("en-US")}
                        </span>
                        <Link
                          href="/dashboard/leaves"
                          className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold mt-2 inline-block"
                        >
                          Review Now →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Side Pane: Team activities */}
          <div className="space-y-6">
            {/* Team Members List */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
              <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-400" /> Team Roster ({teamMembers.length})
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No roster members assigned.</p>
                ) : (
                  teamMembers.map((m: any) => (
                    <div key={m._id} className="flex items-center gap-3">
                      <Avatar name={m.name} sizeClass="h-8 w-8 text-[10px]" />
                      <div className="min-w-0 flex-1">
                        <strong className="text-white text-[11px] truncate block leading-none mb-1">
                          {m.name}
                        </strong>
                        <span className="text-[9px] text-zinc-500 truncate block">{m.designation}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Team Activities */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
              <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-400" /> Team Activities
                </h2>
              </div>
              <div className="p-4 space-y-3.5">
                {recentTeamActivities.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No recent team operations logged.</p>
                ) : (
                  recentTeamActivities.map((act: any) => (
                    <div key={act._id} className="flex gap-2.5 text-[11px] leading-relaxed">
                      <Avatar name={act.actorId?.name} sizeClass="h-6 w-6 text-[9px]" />
                      <div className="flex-1">
                        <span className="text-zinc-300">
                          <strong className="text-white">{act.actorId?.name}</strong> {act.action}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // EMPLOYEE DASHBOARD PIPELINE
  // =========================================================================
  const myTasks = await Task.find({ assigneeId: user.id }).sort({ dueDate: 1 }).lean();
  const openTasksCount = myTasks.filter((t) => t.status !== "Completed").length;
  const completedTasksCount = myTasks.filter((t) => t.status === "Completed").length;

  const upcomingDeadlines = myTasks
    .filter((t) => t.status !== "Completed")
    .slice(0, 3);

  const [
    myLeaves,
    latestAnnouncements,
    latestNotes,
  ] = await Promise.all([
    Leave.find({ employeeId: user.id }).sort({ createdAt: -1 }).limit(3).lean(),
    Announcement.find({
      $or: [{ teamVisibility: null }, { teamVisibility: user.teamId || null }],
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    TrainingProgress.countDocuments({ userId: user.id, completed: true }),
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            💻 Welcome to your Workspace, {user.name}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Designation: <strong className="text-zinc-300">{user.designation || "Engineer"}</strong>. 
            Keep track of your active deadlines and learnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/leaves"
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Calendar className="h-4 w-4 text-rose-400" /> Apply Leave
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Pending Tasks
            </p>
            <h3 className="text-xl font-bold text-white mt-0.5">{openTasksCount}</h3>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Completed Tasks
            </p>
            <h3 className="text-xl font-bold text-white mt-0.5">{completedTasksCount}</h3>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Announcements
            </p>
            <h3 className="text-xl font-bold text-white mt-0.5">{latestAnnouncements.length}</h3>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Training Modules
            </p>
            <h3 className="text-xl font-bold text-white mt-0.5">{latestNotes} / 12 Days</h3>
          </div>
        </div>
      </div>

      {/* Main Employee panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Tasks & Leave Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tasks / Upcoming Deadlines */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
              <h2 className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" /> My Upcoming Deadlines
              </h2>
              <Link href="/dashboard/tasks" className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1">
                View All Tasks <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-900">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-zinc-500 p-8 text-center">🎉 No pending deadlines! Great job.</p>
              ) : (
                upcomingDeadlines.map((t: any) => (
                  <div key={t._id} className="p-4 flex items-center justify-between text-xs hover:bg-zinc-900/10">
                    <div className="min-w-0 flex-1 pr-4">
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
                        {t.project}
                      </span>
                      <h4 className="font-semibold text-white mt-2 truncate">{t.title}</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          t.priority === "Critical"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : t.priority === "High"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-zinc-900 text-zinc-500 border-zinc-800"
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Due: {new Date(t.dueDate).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Leave Application History */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
              <h2 className="text-xs font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-rose-400" /> Recent Leave Applications
              </h2>
            </div>
            <div className="divide-y divide-zinc-900">
              {myLeaves.length === 0 ? (
                <p className="text-xs text-zinc-500 p-6 text-center">No leave requests submitted yet.</p>
              ) : (
                myLeaves.map((lv: any) => (
                  <div key={lv._id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white text-[11px] block">{lv.reason}</strong>
                      <span className="text-[9px] text-zinc-500 mt-1 block">
                        Dates: {new Date(lv.startDate).toLocaleDateString("en-US")} -{" "}
                        {new Date(lv.endDate).toLocaleDateString("en-US")}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-medium border ${
                          lv.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : lv.status === "Rejected"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {lv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Side Pane: Latest Announcements & Notes */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40">
              <h2 className="text-xs font-bold text-white flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-indigo-400" /> Announcements
              </h2>
            </div>
            <div className="p-4 space-y-4 divide-y divide-zinc-900">
              {latestAnnouncements.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No recent announcements.</p>
              ) : (
                latestAnnouncements.map((ann: any, idx) => (
                  <div key={ann._id} className={`text-xs ${idx > 0 ? "pt-4" : ""}`}>
                    {ann.pinned && (
                      <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">
                        PINNED
                      </span>
                    )}
                    <h4 className="font-semibold text-white mt-1 truncate">{ann.title}</h4>
                    <p className="text-zinc-400 text-[10px] mt-1 line-clamp-2">
                      {ann.content.replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Training Sessions quick links */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40">
              <h2 className="text-xs font-bold text-white flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-violet-400" /> Training Stepper Progress
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Completed:</span>
                <strong className="text-white font-mono">{latestNotes} / 12 Days</strong>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                  style={{ width: `${Math.round((latestNotes / 12) * 100)}%` }}
                />
              </div>
              <Link
                href="/dashboard/training"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg py-2 text-center text-xs font-semibold border border-zinc-800 hover:border-zinc-700 block transition-all mt-2.5"
              >
                Go to Training Sessions →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
