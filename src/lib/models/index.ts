import mongoose, { Schema } from "mongoose";

// ==========================================
// 1. USER SCHEMA
// ==========================================
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "Team Lead", "Employee"],
      required: true,
      index: true,
    },
    phone: { type: String, default: "" },
    designation: { type: String, default: "" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    skills: [{ type: String }],
    joiningDate: { type: Date, default: Date.now },
    profilePicture: { type: String, default: "" },
    githubUsername: { type: String, default: "" },
    vercelUsername: { type: String, default: "" },
    discordUsername: { type: String, default: "" },
    clickupEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

// ==========================================
// 2. TEAM SCHEMA
// ==========================================
const TeamSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    leadId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// ==========================================
// 3. TASK SCHEMA
// ==========================================
const TaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    project: { type: String, required: true, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedById: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Review", "Completed"],
      default: "Todo",
      index: true,
    },
    dueDate: { type: Date, required: true, index: true },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// ==========================================
// 4. TASK COMMENT SCHEMA
// ==========================================
const TaskCommentSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

// ==========================================
// 5. LEAVE SCHEMA
// ==========================================
const LeaveSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    remarks: { type: String, default: "" },
    reviewedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// ==========================================
// 6. ANNOUNCEMENT SCHEMA
// ==========================================
const AnnouncementSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamVisibility: { type: Schema.Types.ObjectId, ref: "Team", default: null, index: true }, // null = company-wide
    pinned: { type: Boolean, default: false, index: true },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// ==========================================
// 7. TRAINING PROGRESS SCHEMA
// ==========================================
const TrainingProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    day: { type: Number, required: true, index: true },
    completed: { type: Boolean, default: false, index: true },
    notes: { type: String, default: "" },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ==========================================
// 8. NOTIFICATION SCHEMA
// ==========================================
const NotificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "Task Assigned",
        "Task Updated",
        "Leave Approved",
        "Leave Rejected",
        "Announcement Published",
        "New Note Published",
      ],
      required: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  }
);

// ==========================================
// 9. ACTIVITY LOG SCHEMA
// ==========================================
const ActivityLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ["Task", "Leave", "Announcement", "Training", "Team"],
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  }
);

// ==========================================
// 10. ATTENDANCE SCHEMA
// ==========================================
const AttendanceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true, index: true },
    checkInTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Present", "Late"],
      default: "Present",
    },
  },
  { timestamps: true }
);

// ==========================================
// 11. STANDOUT SCHEMA (Weekly Work Summary)
// ==========================================
const StandoutSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStartDate: { type: Date, required: true, index: true },
    summary: { type: String, required: true },
    accomplishments: { type: String, default: "" },
    challenges: { type: String, default: "" },
    plans: { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent re-compilation of models during next.js hot-reloads
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Team = mongoose.models.Team || mongoose.model("Team", TeamSchema);
export const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);
export const TaskComment = mongoose.models.TaskComment || mongoose.model("TaskComment", TaskCommentSchema);
export const Leave = mongoose.models.Leave || mongoose.model("Leave", LeaveSchema);
export const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
export const TrainingProgress = mongoose.models.TrainingProgress || mongoose.model("TrainingProgress", TrainingProgressSchema);
export const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
export const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
export const Standout = mongoose.models.Standout || mongoose.model("Standout", StandoutSchema);

