import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";
import bcrypt from "bcryptjs";
import * as zod from "zod";

const createUserSchema = zod.object({
  name: zod.string().min(3, "Name must be at least 3 characters"),
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
  role: zod.enum(["Team Lead", "Employee"]),
  designation: zod.string().min(2, "Designation must be at least 2 characters"),
  phone: zod.string().default(""),
  teamId: zod.string().optional().nullable(),
  leadId: zod.string().optional().nullable(),
  skillsInput: zod.string().default(""),
});

// POST: Create a new Lead/Employee (Admin only)
export async function POST(req: Request) {
  const guard = await authGuard(["Admin"]);
  if (!guard.authorized) return guard.response;

  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = parsed.data;

    // Check email uniqueness
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email address already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Parse skills
    const skills = data.skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    const newUser = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role,
      designation: data.designation,
      phone: data.phone,
      teamId: data.teamId || null,
      leadId: data.leadId || null,
      skills,
      joiningDate: new Date(),
    });

    // Log Activity
    await ActivityLog.create({
      actorId: guard.user!.id,
      action: `created ${data.role.toLowerCase()} account for ${data.name} (${data.designation})`,
      category: "Team",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      message: `${data.role} account created successfully!`,
    });
  } catch (error: any) {
    console.error("User creation POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
