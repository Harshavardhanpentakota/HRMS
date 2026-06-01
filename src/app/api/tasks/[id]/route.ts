import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task, User, Notification, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// PUT: Update task details
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const user = guard.user!;
    const updates: any = {};

    // 1. Role-based update filtration
    if (user.role === "Employee") {
      // Employees can only update task status
      if (body.status) {
        let finalStatus = body.status;
        
        // If employee tries to set status to "Completed", redirect it to "Review"
        // since employees must "submit task work" for approval.
        if (finalStatus === "Completed") {
          finalStatus = "Review";
        }
        
        updates.status = finalStatus;

        // If status changed, log and notify
        if (task.status !== finalStatus) {
          const actionText = finalStatus === "Review" 
            ? `submitted work for task "${task.title}"` 
            : `updated status of task "${task.title}" to ${finalStatus}`;

          await ActivityLog.create({
            actorId: user.id,
            action: actionText,
            category: "Task",
          });

          // Notify the creator of the task (Admin or Lead)
          await Notification.create({
            recipientId: task.assignedById,
            title: finalStatus === "Review" ? "Task Work Submitted" : "Task Status Updated",
            message: `${user.name} ${actionText}`,
            type: "Task Updated",
            link: "/tasks",
          });
        }
      }
    } else {
      // Admin and Team Lead can update anything
      if (body.title) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.project) updates.project = body.project;
      if (body.assigneeId) updates.assigneeId = body.assigneeId;
      if (body.priority) updates.priority = body.priority;
      if (body.dueDate) updates.dueDate = new Date(body.dueDate);
      if (body.status) {
        updates.status = body.status;

        // Log and Notify
        if (task.status !== body.status) {
          const actionText = `updated status of task "${task.title}" to ${body.status}`;
          
          await ActivityLog.create({
            actorId: user.id,
            action: actionText,
            category: "Task",
          });

          // Notify assignee
          await Notification.create({
            recipientId: task.assigneeId,
            title: "Task Status Updated",
            message: `Lead/Admin ${user.name} ${actionText}`,
            type: "Task Updated",
            link: "/tasks",
          });
        }
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate("assigneeId", "name email profilePicture designation")
      .populate("assignedById", "name email profilePicture");

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: "Task updated successfully!",
    });
  } catch (error: any) {
    console.error("Task PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove task
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await authGuard(["Admin", "Team Lead"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await params;
    await connectToDatabase();

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    await Task.findByIdAndDelete(id);

    // Log Activity
    await ActivityLog.create({
      actorId: guard.user!.id,
      action: `deleted task "${task.title}"`,
      category: "Task",
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully!",
    });
  } catch (error: any) {
    console.error("Task DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
