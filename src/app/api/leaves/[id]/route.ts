import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Leave, Notification, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// PUT: Review a leave request (Approve/Reject)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await authGuard(["Admin", "Team Lead"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await params;
    const { status, remarks } = await req.json();

    if (!status || !["Approved", "Rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status parameter" }, { status: 400 });
    }

    await connectToDatabase();
    const leave = await Leave.findById(id);

    if (!leave) {
      return NextResponse.json({ success: false, error: "Leave request not found" }, { status: 404 });
    }

    leave.status = status;
    leave.remarks = remarks || "";
    leave.reviewedById = guard.user!.id;
    await leave.save();

    // Notify employee of approval/rejection
    const notifType = status === "Approved" ? "Leave Approved" : "Leave Rejected";
    await Notification.create({
      recipientId: leave.employeeId,
      title: `Leave Application ${status}`,
      message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} has been ${status.toLowerCase()} by ${guard.user!.name}. Remarks: "${remarks || 'None'}"`,
      type: notifType,
      link: "/leaves",
    });

    // Log Activity
    await ActivityLog.create({
      actorId: guard.user!.id,
      action: `${status.toLowerCase()} leave request for user ${leave.employeeId}`,
      category: "Leave",
    });

    return NextResponse.json({
      success: true,
      leave,
      message: `Leave application successfully ${status.toLowerCase()}!`,
    });
  } catch (error: any) {
    console.error("Leave PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
