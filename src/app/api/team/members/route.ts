import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// GET: Fetch team roster members based on role privileges
export async function GET() {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const currentUser = guard.user!;
    let members = [];

    if (currentUser.role === "Admin") {
      // Admins see everyone to manage assignment
      members = await User.find({})
        .select("name email role profilePicture designation teamId")
        .sort({ name: 1 })
        .lean();
    } else if (currentUser.role === "Team Lead") {
      // Team Leads see employees assigned to them (leadId is current Lead)
      members = await User.find({
        $or: [{ leadId: currentUser.id }, { _id: currentUser.id }],
      })
        .select("name email role profilePicture designation teamId")
        .sort({ name: 1 })
        .lean();
    } else {
      // Employees see people in the same team
      if (currentUser.teamId) {
        members = await User.find({ teamId: currentUser.teamId })
          .select("name email role profilePicture designation teamId")
          .sort({ name: 1 })
          .lean();
      } else {
        // Fallback: see themselves
        members = await User.find({ _id: currentUser.id })
          .select("name email role profilePicture designation teamId")
          .lean();
      }
    }

    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    console.error("Team members GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
