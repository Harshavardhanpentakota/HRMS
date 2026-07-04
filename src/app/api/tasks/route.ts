import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task, User, Notification, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";
import * as zod from "zod";

const createTaskSchema = zod.object({
  title: zod.string().min(3, "Title must be at least 3 characters"),
  description: zod.string().default(""),
  project: zod.string().min(2, "Project name must be at least 2 characters"),
  assigneeId: zod.string().min(1, "Assignee is required"),
  priority: zod.enum(["Low", "Medium", "High", "Critical"]),
  dueDate: zod.string().min(1, "Due date is required"),
});

// GET: Retrieve tasks based on role and filters
export async function GET(req: Request) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const priority = searchParams.get("priority") || "";
    const status = searchParams.get("status") || "";
    const project = searchParams.get("project") || "";

    const user = guard.user!;
    let query: any = {};

    // 1. RBAC Task Filtration
    if (user.role === "Employee") {
      query.assigneeId = user.id;
    } else if (user.role === "Team Lead") {
      // Team Leads see tasks of their assigned employees, or tasks they assigned
      const teamEmployees = await User.find({ leadId: user.id }).select("_id");
      const employeeIds = teamEmployees.map((emp) => emp._id);
      query.$or = [
        { assigneeId: { $in: employeeIds } },
        { assignedById: user.id },
      ];
    }
    // Admin has no filters and sees everything

    // 2. Search query mapping
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // 3. Category mapping
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (project) query.project = { $regex: project, $options: "i" };

    const tasks = await Task.find(query)
      .populate("assigneeId", "name email profilePicture designation")
      .populate("assignedById", "name email profilePicture")
      .sort({ dueDate: 1 })
      .lean();

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    console.error("Tasks GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new task (Admin & Team Lead only)
export async function POST(req: Request) {
  const guard = await authGuard(["Admin", "Team Lead"]);
  if (!guard.authorized) return guard.response;

  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = parsed.data;

    // Verify Assignee Exists
    const assignee = await User.findById(data.assigneeId);
    if (!assignee) {
      return NextResponse.json({ success: false, error: "Assignee user not found" }, { status: 404 });
    }

    // If Team Lead is assigning, ensure they can only assign to their team
    if (guard.user!.role === "Team Lead" && assignee.leadId?.toString() !== guard.user!.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Team Leads can only assign tasks to their team members" },
        { status: 403 }
      );
    }

    const newTask = await Task.create({
      ...data,
      dueDate: new Date(data.dueDate),
      assignedById: guard.user!.id,
      status: "Todo",
    });

    // Create Notification
    await Notification.create({
      recipientId: data.assigneeId,
      title: "New Task Assigned",
      message: `You have been assigned a new task: "${data.title}" by ${guard.user!.name}`,
      type: "Task Assigned",
      link: "/dashboard/tasks",
    });

    // Log Activity
    await ActivityLog.create({
      actorId: guard.user!.id,
      action: `assigned task "${data.title}" to ${assignee.name}`,
      category: "Task",
    });

    return NextResponse.json({
      success: true,
      task: newTask,
      message: "Task created successfully!",
    });
  } catch (error: any) {
    console.error("Tasks POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
