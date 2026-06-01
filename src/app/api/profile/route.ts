import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// PUT: Modify current authenticated user profile
export async function PUT(req: Request) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    const { name, phone, skills, githubUsername, vercelUsername, discordUsername, clickupEmail } = await req.json();
    await connectToDatabase();

    const updates: any = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (skills) updates.skills = skills;
    if (githubUsername !== undefined) updates.githubUsername = githubUsername;
    if (vercelUsername !== undefined) updates.vercelUsername = vercelUsername;
    if (discordUsername !== undefined) updates.discordUsername = discordUsername;
    if (clickupEmail !== undefined) updates.clickupEmail = clickupEmail;

    const updatedUser = await User.findByIdAndUpdate(
      guard.user!.id,
      { $set: updates },
      { new: true }
    );

    // Log Activity
    await ActivityLog.create({
      actorId: guard.user!.id,
      action: "updated their user profile details",
      category: "Team",
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully!",
    });
  } catch (error: any) {
    console.error("Profile PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
