import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TaskComment, Task, Notification, ActivityLog } from "@/lib/models";
import { authGuard } from "@/lib/auth-guard";

// GET: Fetch all comments for a specific task
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await params;
    await connectToDatabase();

    const comments = await TaskComment.find({ taskId: id })
      .populate("authorId", "name role profilePicture designation")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error("Comments GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add a new comment to a task
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await authGuard();
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await params;
    const { content } = await req.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ success: false, error: "Comment content cannot be empty" }, { status: 400 });
    }

    await connectToDatabase();
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const newComment = await TaskComment.create({
      taskId: id,
      authorId: guard.user!.id,
      content,
    });

    const populatedComment = await TaskComment.findById(newComment._id).populate(
      "authorId",
      "name role profilePicture designation"
    );

    // Notify other users on the task
    const recipientId = 
      guard.user!.id === task.assigneeId.toString()
        ? task.assignedById
        : task.assigneeId;

    await Notification.create({
      recipientId,
      title: "New Comment on Task",
      message: `${guard.user!.name} commented on "${task.title}": "${content.slice(0, 40)}..."`,
      type: "Task Updated",
      link: `/dashboard/tasks`,
    });

    return NextResponse.json({
      success: true,
      comment: populatedComment,
      message: "Comment added successfully!",
    });
  } catch (error: any) {
    console.error("Comment POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
