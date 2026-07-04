import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Standout, User, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";
import * as zod from "zod";

const standoutSchema = zod.object({
  weekStartDate: zod.string().min(1, "Week start date is required"),
  summary: zod.string().min(10, "Weekly work summary must be at least 10 characters"),
  accomplishments: zod.string().optional().default(""),
  challenges: zod.string().optional().default(""),
  plans: zod.string().optional().default(""),
});

export async function GET() {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const currentUser = guard.user!;
    let standouts: any[] = [];

    if (currentUser.role === "Employee") {
      // Employees see only their own weekly summaries
      standouts = await Standout.find({ userId: currentUser.id })
        .populate("userId", "name email designation profilePicture")
        .sort({ weekStartDate: -1 })
        .lean();
    } else if (currentUser.role === "Team Lead") {
      // Team Leads see their own summaries and their team members' summaries
      const teamEmployees = await User.find({ leadId: currentUser.id }).select("_id");
      const employeeIds = teamEmployees.map((emp) => emp._id);
      
      standouts = await Standout.find({
        $or: [
          { userId: currentUser.id },
          { userId: { $in: employeeIds } }
        ]
      })
        .populate("userId", "name email designation profilePicture")
        .sort({ weekStartDate: -1 })
        .lean();
    } else if (currentUser.role === "Admin") {
      // Admins see all weekly summaries
      standouts = await Standout.find({})
        .populate("userId", "name email designation profilePicture")
        .sort({ weekStartDate: -1 })
        .lean();
    }

    return NextResponse.json({ success: true, standouts });
  } catch (error: any) {
    console.error("Standouts GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    const body = await req.json();
    const parsed = standoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = parsed.data;
    const date = new Date(data.weekStartDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid week start date formatting" },
        { status: 400 }
      );
    }

    // Normalize date to the Monday of that week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const currentUser = guard.user!;

    // Upsert standout weekly summary for the user and week
    const existing = await Standout.findOne({
      userId: currentUser.id,
      weekStartDate: monday,
    });

    let result;
    let isUpdate = false;

    if (existing) {
      existing.summary = data.summary;
      existing.accomplishments = data.accomplishments;
      existing.challenges = data.challenges;
      existing.plans = data.plans;
      result = await existing.save();
      isUpdate = true;
    } else {
      result = await Standout.create({
        userId: currentUser.id,
        weekStartDate: monday,
        summary: data.summary,
        accomplishments: data.accomplishments,
        challenges: data.challenges,
        plans: data.plans,
      });
    }

    // Log Activity
    await ActivityLog.create({
      actorId: currentUser.id,
      action: `${isUpdate ? "updated" : "submitted"} weekly work summary for the week of ${monday.toLocaleDateString()}`,
      category: "Task",
    });

    return NextResponse.json({
      success: true,
      standout: result,
      message: `Weekly work summary successfully ${isUpdate ? "updated" : "submitted"}!`,
    });
  } catch (error: any) {
    console.error("Standouts POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
