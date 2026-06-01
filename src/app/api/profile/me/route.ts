import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, Task, Leave } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// GET: Fetch current user profile metrics
export async function GET() {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const userId = guard.user!.id;

    // 1. Fetch User details
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });
    }

    // 2. Fetch parallel stats
    const [openTasks, completedTasks, approvedLeaves] = await Promise.all([
      Task.countDocuments({ assigneeId: userId, status: { $ne: "Completed" } }),
      Task.countDocuments({ assigneeId: userId, status: "Completed" }),
      Leave.find({ employeeId: userId, status: "Approved" }).select("startDate endDate"),
    ]);

    // Sum days
    let totalLeaves = 0;
    approvedLeaves.forEach((lv) => {
      const diff = new Date(lv.endDate).getTime() - new Date(lv.startDate).getTime();
      totalLeaves += Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    });

    return NextResponse.json({
      success: true,
      user,
      stats: {
        openTasks,
        completedTasks,
        totalLeaves,
      },
    });
  } catch (error: any) {
    console.error("Profile/me GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
