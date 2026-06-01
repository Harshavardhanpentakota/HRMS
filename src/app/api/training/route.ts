import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, TrainingProgress, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// GET: Retrieve training progress
// For Employees: returns their 12 days progress list.
// For Admin/Leads: returns a list of all employees and their respective progress summaries.
export async function GET(req: Request) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    // 1. ADMIN OR LEAD VIEWING ROSTER
    if (guard.user!.role === "Admin" || (guard.user!.role === "Team Lead" && !targetUserId)) {
      // Find all employees
      const query: any = { role: "Employee" };
      if (guard.user!.role === "Team Lead") {
        query.leadId = guard.user!.id; // Limit Team Leads to their own team members
      }
      
      const employees = await User.find(query)
        .select("name email designation githubUsername vercelUsername discordUsername clickupEmail")
        .lean();

      // Aggregate progress for each employee
      const employeeProgressList = await Promise.all(
        employees.map(async (emp: any) => {
          let progress = await TrainingProgress.find({ userId: emp._id }).sort({ day: 1 }).lean();
          
          // Auto-generate 12 days if not yet present in DB
          if (progress.length < 12) {
            const tempProgress = [];
            for (let d = 1; d <= 12; d++) {
              let existing = progress.find((p: any) => p.day === d);
              if (!existing) {
                existing = await TrainingProgress.create({
                  userId: emp._id,
                  day: d,
                  completed: false,
                  notes: "",
                });
              }
              tempProgress.push(existing);
            }
            progress = tempProgress;
          }

          const completedCount = progress.filter((p: any) => p.completed).length;
          const percentage = Math.round((completedCount / 12) * 100);

          return {
            employee: emp,
            progress,
            completedCount,
            percentage,
          };
        })
      );

      return NextResponse.json({ success: true, roster: employeeProgressList });
    }

    // 2. VIEWING SPECIFIC USER (Admin targeting a specific employee)
    const activeUserId = targetUserId || guard.user!.id;
    let progress = await TrainingProgress.find({ userId: activeUserId }).sort({ day: 1 }).lean();

    // Auto-generate if empty
    if (progress.length < 12) {
      const tempProgress = [];
      for (let d = 1; d <= 12; d++) {
        let existing = progress.find((p: any) => p.day === d);
        if (!existing) {
          existing = await TrainingProgress.create({
            userId: activeUserId,
            day: d,
            completed: false,
            notes: "",
          });
        }
        tempProgress.push(existing);
      }
      progress = tempProgress;
    }

    return NextResponse.json({ success: true, progress });
  } catch (error: any) {
    console.error("Training GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update progress status & personal notes for a specific day
export async function PUT(req: Request) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const { day, completed, notes } = await req.json();

    if (day === undefined || day < 1 || day > 12) {
      return NextResponse.json({ success: false, error: "Invalid day parameter (1-12 required)" }, { status: 400 });
    }

    const userId = guard.user!.id;
    const completedAt = completed ? new Date() : null;

    const updatedProgress = await TrainingProgress.findOneAndUpdate(
      { userId, day },
      { $set: { completed, notes, completedAt } },
      { new: true, upsert: true }
    );

    // Log this action inside ActivityLog
    const completionText = completed ? "completed" : "undid completion of";
    await ActivityLog.create({
      actorId: userId,
      action: `marked Training Session Day ${day} as ${completed ? "Completed" : "In Progress"}`,
      category: "Training",
    });

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      message: `Day ${day} progress successfully updated!`,
    });
  } catch (error: any) {
    console.error("Training PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
