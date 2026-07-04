"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, CheckCircle2, AlertCircle, Calendar, Sparkles } from "lucide-react";

export default function AttendanceWidget() {
  const queryClient = useQueryClient();
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  // Live Clock effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Fetch attendance status for this week
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const res = await fetch("/api/attendance");
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
  });

  // 2. Mutation to perform Check-In
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check in");
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Successfully checked in!");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Check-in failed");
    },
  });

  if (isLoading) {
    return (
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-6 flex items-center justify-between animate-pulse">
        <div className="h-12 w-1/3 bg-zinc-900 rounded" />
        <div className="h-10 w-24 bg-zinc-900 rounded" />
      </div>
    );
  }

  const hasCheckedInToday = attendanceData?.hasCheckedInToday || false;
  const todayRecord = attendanceData?.todayRecord || null;
  const weekRecords = attendanceData?.weekRecords || [];

  // Business check for Sunday
  const today = new Date();
  const isSunday = today.getDay() === 0;

  // Calculate current week weekdays (Monday to Saturday)
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const mondayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);

  const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getWeekDaysStatus = () => {
    return DAYS_OF_WEEK.map((dayName, idx) => {
      // Date of this weekday
      const dayDate = new Date(
        mondayDate.getFullYear(),
        mondayDate.getMonth(),
        mondayDate.getDate() + idx
      );

      // Find record for this day
      const record = weekRecords.find(
        (rec: any) => new Date(rec.date).toDateString() === dayDate.toDateString()
      );

      const isToday = dayDate.toDateString() === today.toDateString();
      const isPast = dayDate < today && !isToday;

      let status: "Present" | "Late" | "Absent" | "Upcoming" | "Pending" = "Upcoming";

      if (record) {
        status = record.status === "Late" ? "Late" : "Present";
      } else if (isToday) {
        status = isSunday ? "Upcoming" : "Pending";
      } else if (isPast) {
        status = "Absent";
      }

      return {
        dayName,
        dateNum: dayDate.getDate(),
        status,
        checkInTime: record ? new Date(record.checkInTime) : null,
      };
    });
  };

  const weekDays = getWeekDaysStatus();

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 md:p-6 flex flex-col lg:flex-row items-stretch justify-between gap-6 relative overflow-hidden shadow-sm hover:shadow-violet-600/[0.02] transition-all">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl -z-10" />

      {/* Left panel: Clock & Trigger Button */}
      <div className="flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-r border-zinc-900/60 lg:pr-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Shift Attendance
          </span>
          <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white leading-none">
              {timeStr || "--:--:-- --"}
            </h2>
            <span className="text-[11px] text-zinc-500 font-semibold mt-1">
              {dateStr || "Loading date..."}
            </span>
          </div>
        </div>

        <div>
          {isSunday ? (
            <div className="flex items-center gap-2 text-zinc-500 bg-zinc-900/50 border border-zinc-800 px-4 py-2.5 rounded-lg text-xs font-semibold">
              <Calendar className="h-4 w-4" /> Check-in Unavailable (Sunday)
            </div>
          ) : hasCheckedInToday ? (
            <div className="flex flex-col items-start md:items-end gap-1">
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Checked In Today
              </div>
              {todayRecord && (
                <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
                  Logged at {new Date(todayRecord.checkInTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  ({todayRecord.status})
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
              className="px-5 py-2.5 bg-gradient-to-tr from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md shadow-violet-600/10 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <Clock className="h-4 w-4" />
              {checkInMutation.isPending ? "Checking in..." : "Check In Now"}
            </button>
          )}
        </div>
      </div>

      {/* Right panel: Monday to Saturday status visualizer */}
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">
          Weekly Attendance (Mon - Sat)
        </p>
        <div className="grid grid-cols-6 gap-2 sm:gap-3.5">
          {weekDays.map((day, index) => {
            let badgeBg = "bg-zinc-900/40 border-zinc-900 text-zinc-600";
            let statusDot = "bg-zinc-700";

            if (day.status === "Present") {
              badgeBg = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
              statusDot = "bg-emerald-500 shadow-sm shadow-emerald-500/40";
            } else if (day.status === "Late") {
              badgeBg = "bg-amber-500/10 border-amber-500/20 text-amber-400";
              statusDot = "bg-amber-500 shadow-sm shadow-amber-500/40";
            } else if (day.status === "Absent") {
              badgeBg = "bg-red-500/10 border-red-500/20 text-red-400";
              statusDot = "bg-red-500 shadow-sm shadow-red-500/40";
            } else if (day.status === "Pending") {
              badgeBg = "bg-violet-500/10 border-violet-500/20 text-violet-400";
              statusDot = "bg-violet-500 animate-pulse";
            }

            return (
              <div
                key={day.dayName}
                className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${badgeBg}`}
                title={
                  day.status === "Upcoming"
                    ? "Upcoming shift"
                    : day.status === "Pending"
                    ? "Check-in pending"
                    : `${day.status}${
                        day.checkInTime
                          ? ` at ${day.checkInTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : ""
                      }`
                }
              >
                <span className="text-[9px] uppercase tracking-wider font-bold block">
                  {day.dayName}
                </span>
                <span className="text-xs font-bold font-mono mt-1 block">
                  {day.dateNum}
                </span>
                <div className={`h-1.5 w-1.5 rounded-full mt-2 ${statusDot}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
