import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Team, User, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";
import * as zod from "zod";

const createTeamSchema = zod.object({
  name: zod.string().min(3, "Team name must be at least 3 characters"),
  description: zod.string().default(""),
  leadId: zod.string().min(1, "Team Lead assignment is required"),
});

// GET: List all teams in the organization
export async function GET() {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const teams = await Team.find({})
      .populate("leadId", "name email profilePicture designation")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, teams });
  } catch (error: any) {
    console.error("Teams GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new team (Admin only)
export async function POST(req: Request) {
  const guard = await authGuard(["Admin"]);
  if (!guard.authorized) return guard.response;

  try {
    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = parsed.data;

    // Verify lead ID is actually a Team Lead
    const lead = await User.findById(data.leadId);
    if (!lead || lead.role !== "Team Lead") {
      return NextResponse.json(
        { success: false, error: "Selected user is not a valid Team Lead" },
        { status: 400 }
      );
    }

    const newTeam = await Team.create(data);

    // Update Team Lead's teamId link
    lead.teamId = newTeam._id;
    await lead.save();

    // Log Activity
    await ActivityLog.create({
      actorId: guard.user!.id,
      action: `created team "${data.name}" and assigned ${lead.name} as lead`,
      category: "Team",
    });

    return NextResponse.json({
      success: true,
      team: newTeam,
      message: "Team created successfully!",
    });
  } catch (error: any) {
    console.error("Team POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
