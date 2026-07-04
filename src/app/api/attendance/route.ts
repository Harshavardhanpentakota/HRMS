import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Attendance, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// GET: Fetch today's check-in status and the current week's check-in history (Monday to Saturday)
export async function GET() {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const now = new Date();
    
    // Normalize today to start of day
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Check if user checked in today
    const todayRecord = await Attendance.findOne({
      userId: guard.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    // 2. Fetch current week's history (Monday to Saturday)
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 5, 23, 59, 59, 999);

    const weekRecords = await Attendance.find({
      userId: guard.user.id,
      date: { $gte: startOfWeek, $lte: endOfWeek },
    })
      .sort({ date: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      hasCheckedInToday: !!todayRecord,
      todayRecord,
      weekRecords,
    });
  } catch (error: any) {
    console.error("Attendance GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Register today's check-in
export async function POST() {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const now = new Date();

    // 1. Business Rule: Check-in only allowed Monday to Saturday
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (day === 0) {
      return NextResponse.json(
        { success: false, error: "Check-in is only allowed from Monday to Saturday." },
        { status: 400 }
      );
    }

    // 2. Normalize today's date range
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 3. Ensure they haven't checked in yet today
    const existing = await Attendance.findOne({
      userId: guard.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "You have already checked in for today." },
        { status: 400 }
      );
    }

    // 4. Determine status (Late if after 10:00 AM)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 10 || (hours === 10 && minutes > 0);
    const status = isLate ? "Late" : "Present";

    // 5. Create Attendance record
    const attendance = await Attendance.create({
      userId: guard.user.id,
      date: startOfDay,
      checkInTime: now,
      status,
    });

    // 6. Log entry to ActivityLog
    await ActivityLog.create({
      actorId: guard.user.id,
      action: `checked in for today (Status: ${status})`,
      category: "Team",
    });

    return NextResponse.json({
      success: true,
      attendance,
      message: `Checked in successfully! Status: ${status}`,
    });
  } catch (error: any) {
    console.error("Attendance POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
