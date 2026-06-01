import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// GET: Fetch user notifications
export async function GET() {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const notifications = await Notification.find({ recipientId: guard.user!.id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipientId: guard.user!.id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Mark notification(s) as read
export async function PUT(req: Request) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    const { id, all } = await req.json();
    await connectToDatabase();

    if (all) {
      // Mark all as read
      await Notification.updateMany(
        { recipientId: guard.user!.id, isRead: false },
        { $set: { isRead: true } }
      );
    } else if (id) {
      // Mark specific notification as read
      await Notification.updateOne(
        { _id: id, recipientId: guard.user!.id },
        { $set: { isRead: true } }
      );
    } else {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Notification updated successfully.",
    });
  } catch (error: any) {
    console.error("Notifications PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
