import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Leave, User, Notification, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";
import * as zod from "zod";

const createLeaveSchema = zod.object({
  startDate: zod.string().min(1, "Start date is required"),
  endDate: zod.string().min(1, "End date is required"),
  reason: zod.string().min(5, "Reason must be at least 5 characters"),
});

// GET: Fetch leave logs
export async function GET() {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const currentUser = guard.user!;
    let query: any = {};

    // 1. RBAC Leaves Filtration
    if (currentUser.role === "Employee") {
      query.employeeId = currentUser.id;
    } else if (currentUser.role === "Team Lead") {
      // Team Leads see leaves of their assigned team members
      const teamEmployees = await User.find({ leadId: currentUser.id }).select("_id");
      const employeeIds = teamEmployees.map((emp) => emp._id);
      query.employeeId = { $in: employeeIds };
    }
    // Admin has no query limitations and sees all leaves

    const leaves = await Leave.find(query)
      .populate("employeeId", "name email profilePicture designation")
      .populate("reviewedById", "name role")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, leaves });
  } catch (error: any) {
    console.error("Leaves GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Apply for a leave
export async function POST(req: Request) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    const body = await req.json();
    const parsed = createLeaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = parsed.data;

    const newLeave = await Leave.create({
      employeeId: guard.user!.id,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
      status: "Pending",
    });

    // Notify the user's specific Team Lead (if they have one) or Admin
    const applicant = await User.findById(guard.user!.id);
    const recipientId = applicant.leadId || null;

    if (recipientId) {
      // Notify Lead
      await Notification.create({
        recipientId,
        title: "Leave Application Submitted",
        message: `${guard.user!.name} applied for leave from ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}`,
        type: "Leave Approved", // General category helper
        link: "/dashboard/leaves",
      });
    }

    // Log Activity
    await ActivityLog.create({
      actorId: guard.user!.id,
      action: `applied for leave starting ${new Date(data.startDate).toLocaleDateString()}`,
      category: "Leave",
    });

    return NextResponse.json({
      success: true,
      leave: newLeave,
      message: "Leave application submitted successfully!",
    });
  } catch (error: any) {
    console.error("Leaves POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
