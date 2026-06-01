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
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Plus,
  Loader2,
  AlertCircle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Form Validation Schema
const leaveFormSchema = zod.object({
  startDate: zod.string().min(1, "Start date is required"),
  endDate: zod.string().min(1, "End date is required"),
  reason: zod.string().min(5, "Reason must be at least 5 characters"),
});

type LeaveFormValues = zod.infer<typeof leaveFormSchema>;

export default function LeavesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const user = session?.user;

  // Review states
  const [remarks, setRemarks] = useState<{ [id: string]: string }>({});
  const [currentDate, setCurrentDate] = useState(new Date());

  const isReviewer = user?.role === "Admin" || user?.role === "Team Lead";

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const selectedStartDate = watch("startDate");
  const selectedEndDate = watch("endDate");

  // Query: Get leaves
  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ["leaves"],
    queryFn: async () => {
      const res = await fetch("/api/leaves");
      return res.json();
    },
    enabled: !!session,
  });

  // Mutation: Apply for leave
  const applyLeaveMutation = useMutation({
    mutationFn: async (data: LeaveFormValues) => {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["leaves"] });
        reset();
      } else {
        toast.error(data.error);
      }
    },
  });

  // Mutation: Review leave (Approve/Reject)
  const reviewLeaveMutation = useMutation({
    mutationFn: async ({ id, status, remarks }: { id: string; status: "Approved" | "Rejected"; remarks: string }) => {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["leaves"] });
      } else {
        toast.error(data.error);
      }
    },
  });

  const handleApplyLeave = (values: LeaveFormValues) => {
    // Basic date validations
    if (new Date(values.startDate) > new Date(values.endDate)) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    applyLeaveMutation.mutate(values);
  };

  const handleReview = (id: string, status: "Approved" | "Rejected") => {
    const leaveRemarks = remarks[id] || "";
    reviewLeaveMutation.mutate({ id, status, remarks: leaveRemarks });
  };

  const leaves = leavesData?.leaves || [];

  // Filter leaves based on statuses
  const pendingRequests = leaves.filter((lv: any) => lv.status === "Pending");
  const approvedLeaves = leaves.filter((lv: any) => lv.status === "Approved");

  // Sum total leaves taken days
  const calculateApprovedDays = () => {
    let days = 0;
    approvedLeaves.forEach((lv: any) => {
      const diff = new Date(lv.endDate).getTime() - new Date(lv.startDate).getTime();
      days += Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    });
    return days;
  };

  // Construct Calendar grid
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Present month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);

  const formatDateToString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDateClick = (day: Date) => {
    if (!day) return;
    const dateStr = formatDateToString(day);

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setValue("startDate", dateStr);
      setValue("endDate", "");
    } else {
      const start = new Date(selectedStartDate);
      if (day < start) {
        setValue("startDate", dateStr);
      } else {
        setValue("endDate", dateStr);
      }
    }
  };

  const getDaySelectionState = (day: Date) => {
    if (!day) return { isStart: false, isEnd: false, isInRange: false };
    const dateStr = formatDateToString(day);

    const isStart = selectedStartDate === dateStr;
    const isEnd = selectedEndDate === dateStr;

    let isInRange = false;
    if (selectedStartDate && selectedEndDate) {
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      const current = new Date(dateStr);
      isInRange = current > start && current < end;
    }

    return { isStart, isEnd, isInRange };
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayLeaveLabel = (day: Date) => {
    if (!day) return null;
    const leaveOnDay = approvedLeaves.find((lv: any) => {
      const d = new Date(day);
      d.setHours(0, 0, 0, 0);
      const start = new Date(lv.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(lv.endDate);
      end.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
    return leaveOnDay;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner Title */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-xl font-bold text-white tracking-tight">Leave Management</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Apply for leaves, track review history, and coordinate team roster availability.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Approved Days</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{calculateApprovedDays()}</h3>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Pending Leaves</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{pendingRequests.length}</h3>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <FileText className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Total Submissions</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{leaves.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Submit Request and Roster Calendar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar Grid Section */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-violet-400" /> Roster Availability Calendar
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={prevMonth}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-900 rounded cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold text-white px-2">
                  {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-900 rounded cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Grid days layout */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 min-h-[220px]">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return (
                    <div
                      key={idx}
                      className="min-h-[44px] bg-transparent border border-transparent pointer-events-none"
                    />
                  );
                }

                const leaveOnDay = getDayLeaveLabel(day);
                const { isStart, isEnd, isInRange } = getDaySelectionState(day);

                let cellBgClass = "bg-zinc-950/20 hover:bg-zinc-900/60 border-zinc-900 hover:border-zinc-800 text-zinc-400";
                if (isStart || isEnd) {
                  cellBgClass = "bg-violet-600 border-violet-500 text-white font-bold shadow shadow-violet-500/25";
                } else if (isInRange) {
                  cellBgClass = "bg-violet-950/40 border-violet-900/50 text-violet-300";
                } else if (leaveOnDay) {
                  cellBgClass = "bg-rose-950/15 border-rose-900/30 hover:bg-rose-950/25";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={`min-h-[44px] border rounded-lg p-1.5 flex flex-col justify-between items-start transition-all relative cursor-pointer text-left w-full ${cellBgClass}`}
                  >
                    <span className={`text-[10px] font-semibold ${isStart || isEnd ? "text-white" : leaveOnDay ? "text-rose-400 font-bold" : "text-zinc-400"}`}>
                      {day.getDate()}
                    </span>

                    {leaveOnDay && !isStart && !isEnd && !isInRange && (
                      <span className="text-[7.5px] bg-rose-600/25 text-rose-300 px-1 py-0.2 rounded font-mono truncate max-w-full tracking-tighter" title={leaveOnDay.employeeId?.name}>
                        {leaveOnDay.employeeId?.name.split(" ")[0]}
                      </span>
                    )}

                    {(isStart || isEnd || isInRange) && (
                      <span className="text-[7.5px] bg-white/20 text-white px-1 py-0.2 rounded font-mono truncate max-w-full tracking-tighter">
                        {isStart ? "Start" : isEnd ? "End" : "Selected"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Roster Leaves logs History */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40">
              <span className="text-xs font-bold text-white">Roster Leave Logs</span>
            </div>
            <div className="overflow-x-auto">
              {leavesLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                </div>
              ) : leaves.length === 0 ? (
                <p className="text-xs text-zinc-500 py-12 text-center">No leave applications recorded in timeline.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950/40 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      {isReviewer && <th className="py-3 px-4">Applicant</th>}
                      <th className="py-3 px-4">Range</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    {leaves.map((lv: any) => (
                      <tr key={lv._id} className="hover:bg-zinc-900/10 transition-colors">
                        {isReviewer && (
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {lv.employeeId?.name}
                          </td>
                        )}
                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          {new Date(lv.startDate).toLocaleDateString()} - {new Date(lv.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 max-w-[150px] truncate" title={lv.reason}>
                          {lv.reason}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(lv.status)}`}>
                            {lv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-zinc-500 italic max-w-[150px] truncate" title={lv.remarks}>
                          {lv.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Apply Form or Review Controls */}
        <div className="space-y-6">
          {/* Apply Form Panel */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow">
            <span className="text-xs font-bold text-white flex items-center gap-2 mb-4">
              <Plus className="h-4.5 w-4.5 text-violet-400" /> Apply for Leave
            </span>

            <form onSubmit={handleSubmit(handleApplyLeave)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Start Date</label>
                <input
                  type="date"
                  {...register("startDate")}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 cursor-pointer"
                />
                {errors.startDate && <p className="text-[10px] text-red-500 mt-1">{errors.startDate.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">End Date</label>
                <input
                  type="date"
                  {...register("endDate")}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 cursor-pointer"
                />
                {errors.endDate && <p className="text-[10px] text-red-500 mt-1">{errors.endDate.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Reason</label>
                <textarea
                  rows={3}
                  {...register("reason")}
                  placeholder="Explain briefly, e.g., personal family commitments..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 resize-none"
                />
                {errors.reason && <p className="text-[10px] text-red-500 mt-1">{errors.reason.message}</p>}
              </div>

              <button
                type="submit"
                disabled={applyLeaveMutation.isPending}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-2.5 text-xs font-semibold shadow shadow-violet-600/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {applyLeaveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Apply Leave
              </button>
            </form>
          </div>

          {/* Pending Leave approvals (Reviewers only) */}
          {isReviewer && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow space-y-4">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-rose-400" /> Pending Approvals ({pendingRequests.length})
              </span>

              <div className="space-y-4 divide-y divide-zinc-900">
                {pendingRequests.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 text-center py-4">No pending leave requests found.</p>
                ) : (
                  pendingRequests.map((req: any, index: number) => (
                    <div key={req._id} className={`text-xs ${index > 0 ? "pt-4" : ""} space-y-3`}>
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={req.employeeId?.name || "Employee"}
                          sizeClass="h-8 w-8 text-[10px]"
                        />

                        <div className="min-w-0 flex-1">
                          <strong className="text-white text-[11px] block">{req.employeeId?.name}</strong>
                          <span className="text-[9px] text-zinc-500 block">{req.employeeId?.designation}</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-zinc-900/40 rounded border border-zinc-900/60 font-mono text-[9px] text-zinc-400 flex flex-col gap-1">
                        <span><strong>From:</strong> {new Date(req.startDate).toLocaleDateString()}</span>
                        <span><strong>To:</strong> {new Date(req.endDate).toLocaleDateString()}</span>
                        <span className="text-zinc-300 font-sans mt-1"><strong>Reason:</strong> "{req.reason}"</span>
                      </div>

                      {/* Review actions input & actions */}
                      <div className="space-y-2 pt-1.5">
                        <input
                          type="text"
                          placeholder="Fill in official remarks..."
                          value={remarks[req._id] || ""}
                          onChange={(e) => setRemarks({ ...remarks, [req._id]: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-zinc-600 focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleReview(req._id, "Approved")}
                            disabled={reviewLeaveMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded py-1.5 text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/10"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleReview(req._id, "Rejected")}
                            disabled={reviewLeaveMutation.isPending}
                            className="bg-red-600 hover:bg-red-500 text-white rounded py-1.5 text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 shadow-sm shadow-red-500/10"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
