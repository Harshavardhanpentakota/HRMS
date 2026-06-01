import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Announcement } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// POST: Mark announcement as read by the current user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await params;
    await connectToDatabase();

    await Announcement.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: guard.user!.id } }, // $addToSet guarantees uniqueness
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Announcement marked as read.",
    });
  } catch (error: any) {
    console.error("Announcement Read POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
