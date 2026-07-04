import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Announcement, User, Notification, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";
import * as zod from "zod";

const createAnnouncementSchema = zod.object({
  title: zod.string().min(3, "Title must be at least 3 characters"),
  content: zod.string().min(5, "Content must be at least 5 characters"),
  teamVisibility: zod.string().nullable().default(null), // null = company-wide
  pinned: zod.boolean().default(false),
});

// GET: Retrieve announcements
export async function GET(req: Request) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const user = guard.user!;
    let query: any = {};

    // 1. RBAC visibility boundaries
    if (user.role !== "Admin") {
      // Non-admins see company-wide announcements or team-specific announcements matching their team
      query.$or = [
        { teamVisibility: null },
        { teamVisibility: user.teamId || null },
      ];
    }
    // Admin sees all announcements

    // 2. Search query mapping
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const announcements = await Announcement.find(query)
      .populate("authorId", "name role profilePicture")
      .populate("teamVisibility", "name")
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    console.error("Announcements GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Publish announcement (Admin & Team Lead only)
export async function POST(req: Request) {
  const guard = await authGuard(["Admin", "Team Lead"]);
  if (!guard.authorized) return guard.response;

  try {
    const body = await req.json();
    const parsed = createAnnouncementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = parsed.data;

    // Security check: Team Lead can only publish to their own team
    if (guard.user!.role === "Team Lead") {
      if (!data.teamVisibility || data.teamVisibility !== guard.user!.teamId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Team Leads can only publish announcements for their own team" },
          { status: 403 }
        );
      }
    }

    const newAnnouncement = await Announcement.create({
      ...data,
      authorId: guard.user!.id,
    });

    // Create notifications for targeted members
    let recipientsQuery: any = {};
    if (data.teamVisibility) {
      recipientsQuery = { teamId: data.teamVisibility };
    } else {
      // Company-wide announcement notifies everyone except the author
      recipientsQuery = { _id: { $ne: guard.user!.id } };
    }

    const membersToNotify = await User.find(recipientsQuery).select("_id");
    const notifications = membersToNotify.map((member) => ({
      recipientId: member._id,
      title: data.pinned ? "📌 Critical Announcement published" : "📢 New Announcement published",
      message: `"${data.title}" was published by ${guard.user!.name}`,
      type: "Announcement Published",
      link: "/dashboard/announcements",
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Log Activity
    await ActivityLog.create({
      actorId: guard.user!.id,
      action: `published an announcement: "${data.title}"`,
      category: "Announcement",
    });

    return NextResponse.json({
      success: true,
      announcement: newAnnouncement,
      message: "Announcement published successfully!",
    });
  } catch (error: any) {
    console.error("Announcement POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
