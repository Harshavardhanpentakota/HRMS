"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import {
  Search,
  Grid,
  List as ListIcon,
  Plus,
  Clock,
  User as UserIcon,
  AlertCircle,
  X,
  MessageSquare,
  ChevronRight,
  Loader2,
  Trash2,
  Paperclip,
} from "lucide-react";

// Form validation schema for creating tasks
const taskFormSchema = zod.object({
  title: zod.string().min(3, "Title must be at least 3 characters"),
  description: zod.string(),
  project: zod.string().min(2, "Project name must be at least 2 characters"),
  assigneeId: zod.string().min(1, "Assignee is required"),
  priority: zod.enum(["Low", "Medium", "High", "Critical"]),
  dueDate: zod.string().min(1, "Due date is required"),
});

type TaskFormValues = zod.infer<typeof taskFormSchema>;

export default function TasksPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const user = session?.user;

  // Layout & filtration state
  const [viewTab, setViewTab] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Drawer / Modal states
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isEditable = user?.role === "Admin" || user?.role === "Team Lead";

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      project: "",
      assigneeId: "",
      priority: "Medium",
      dueDate: "",
    },
  });

  // Query: Get tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", search, projectFilter, priorityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (projectFilter) params.append("project", projectFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      return res.json();
    },
    enabled: !!session,
  });

  // Query: Get assignees
  const { data: membersData } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch("/api/team/members");
      return res.json();
    },
    enabled: !!session,
  });

  // Query: Get comments for selected task
  const { data: commentsData } = useQuery({
    queryKey: ["comments", selectedTask?._id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${selectedTask._id}/comments`);
      return res.json();
    },
    enabled: !!selectedTask,
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        setIsCreateOpen(false);
        reset();
      } else {
        toast.error(data.error);
      }
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        if (selectedTask && selectedTask._id === data.task._id) {
          setSelectedTask(data.task);
        }
        toast.success("Task updated!");
      } else {
        toast.error(data.error);
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Task deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        setSelectedTask(null);
      } else {
        toast.error(data.error);
      }
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/tasks/${selectedTask._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["comments", selectedTask?._id] });
        setCommentText("");
        toast.success("Comment added!");
      } else {
        toast.error(data.error);
      }
    },
  });

  const handleCreateTask = (values: TaskFormValues) => {
    createTaskMutation.mutate(values);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({ id: taskId, updates: { status: newStatus } });
  };

  const handlePriorityChange = (taskId: string, newPriority: string) => {
    updateTaskMutation.mutate({ id: taskId, updates: { priority: newPriority } });
  };

  const handleAssigneeChange = (taskId: string, newAssigneeId: string) => {
    updateTaskMutation.mutate({ id: taskId, updates: { assigneeId: newAssigneeId } });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText);
    }
  };

  const tasks = tasksData?.tasks || [];
  const assignees = membersData?.members || [];
  const comments = commentsData?.comments || [];

  // Categorize tasks for Kanban
  const kanbanColumns = {
    Todo: tasks.filter((t: any) => t.status === "Todo"),
    "In Progress": tasks.filter((t: any) => t.status === "In Progress"),
    Review: tasks.filter((t: any) => t.status === "Review"),
    Completed: tasks.filter((t: any) => t.status === "Completed"),
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "High":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Medium":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Review":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "In Progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      {/* Top action header: Filter inputs & View Toggles */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Task Manager</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Coordinate sprints, assign tasks, and track statuses from a premium console.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggles */}
          <div className="bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => setViewTab("kanban")}
              className={`p-1.5 rounded-md text-zinc-400 hover:text-white transition-all cursor-pointer ${
                viewTab === "kanban" ? "bg-zinc-800 text-white" : ""
              }`}
              title="Kanban Board"
            >
              <Grid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewTab("list")}
              className={`p-1.5 rounded-md text-zinc-400 hover:text-white transition-all cursor-pointer ${
                viewTab === "list" ? "bg-zinc-800 text-white" : ""
              }`}
              title="List View"
            >
              <ListIcon className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Create Button (Guarded) */}
          {isEditable && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow shadow-violet-600/10 cursor-pointer active:scale-98"
            >
              <Plus className="h-4 w-4" /> Create Task
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-600 transition-all placeholder-zinc-500"
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Filter by Project..."
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-600 transition-all placeholder-zinc-500"
          />
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-600 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-600 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {tasksLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 bg-zinc-950/20 border border-zinc-900/60 border-dashed rounded-2xl text-center">
          <AlertCircle className="h-10 w-10 text-zinc-700 mb-3" />
          <h3 className="text-sm font-semibold text-white">No tasks matching queries</h3>
          <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
            Try adjusting your search criteria, clearing your filters, or creating a new task.
          </p>
        </div>
      ) : viewTab === "kanban" ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {Object.entries(kanbanColumns).map(([colName, colTasks]) => (
            <div key={colName} className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex flex-col gap-4">
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                <span className="text-[11px] font-bold text-white tracking-wider flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    colName === "Completed"
                      ? "bg-emerald-500"
                      : colName === "Review"
                      ? "bg-amber-500"
                      : colName === "In Progress"
                      ? "bg-blue-500"
                      : "bg-zinc-500"
                  }`} />
                  {colName.toUpperCase()}
                </span>
                <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold font-mono">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-[10px] text-zinc-600 border border-dashed border-zinc-900 rounded-lg">
                    No tasks in this lane
                  </div>
                ) : (
                  colTasks.map((t: any) => (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTask(t)}
                      className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 p-4 rounded-lg cursor-pointer transition-all active:scale-[0.99] group flex flex-col gap-3 shadow hover:shadow-violet-600/5 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-semibold text-zinc-500 truncate max-w-[120px]">
                          📂 {t.project}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(t.priority)}`}>
                          {t.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-2">
                        {t.title}
                      </h4>

                      {/* Card Footer info */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 mt-1">
                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>

                        {/* Assignee Avatar */}
                        {t.assigneeId && (
                          <div className="flex items-center gap-1">
                             <Avatar name={t.assigneeId.name} sizeClass="h-5.5 w-5.5 text-[9px]" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST TAB VIEW */
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-950/40 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs">
                {tasks.map((t: any) => (
                  <tr
                    key={t._id}
                    onClick={() => setSelectedTask(t)}
                    className="hover:bg-zinc-900/20 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-bold text-white group-hover:text-violet-400 transition-colors">
                      {t.title}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-medium">
                      {t.project}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.assigneeId && (
                        <div className="flex items-center gap-2">
                           <Avatar name={t.assigneeId.name} sizeClass="h-5.5 w-5.5 text-[9px]" />
                          <span className="text-[10px] text-zinc-400 font-semibold">{t.assigneeId.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 font-mono">
                      {new Date(t.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE TASK SLIDEOVER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Create Workspace Task</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form scroll wrapper */}
            <form onSubmit={handleSubmit(handleCreateTask)} className="overflow-y-auto p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Task Title</label>
                <input
                  type="text"
                  {...register("title")}
                  placeholder="e.g., Integrate Auth.js endpoints"
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
                />
                {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Project Name</label>
                  <input
                    type="text"
                    {...register("project")}
                    placeholder="e.g., Core API"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
                  />
                  {errors.project && <p className="text-[10px] text-red-500 mt-1">{errors.project.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Due Date</label>
                  <input
                    type="date"
                    {...register("dueDate")}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch (err) {}
                    }}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-600 cursor-pointer"
                  />
                  {errors.dueDate && <p className="text-[10px] text-red-500 mt-1">{errors.dueDate.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Assignee</label>
                  <select
                    {...register("assigneeId")}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-600 appearance-none cursor-pointer"
                  >
                    <option value="">Select Member...</option>
                    {assignees
                      .filter((a: any) => a.role === "Employee")
                      .map((a: any) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.designation})
                        </option>
                      ))}
                  </select>
                  {errors.assigneeId && <p className="text-[10px] text-red-500 mt-1">{errors.assigneeId.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">Priority</label>
                  <select
                    {...register("priority")}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-600 appearance-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Description</label>
                <textarea
                  rows={4}
                  {...register("description")}
                  placeholder="Provide structured details of standard deliverables..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-violet-600 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shadow shadow-violet-600/10 cursor-pointer flex items-center gap-2"
                >
                  {createTaskMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL SIDEBAR DRAWER (Right-sliding) */}
      {selectedTask && (
        <>
          {/* Drawer backdrop */}
          <div onClick={() => setSelectedTask(null)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40" />

          {/* Drawer Panel */}
          <div className="fixed top-0 bottom-0 right-0 w-full max-w-lg bg-zinc-950 border-l border-zinc-900 z-50 flex flex-col justify-between shadow-2xl animate-slide-in">
            {/* Header controls */}
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono text-zinc-500">TASK TIMELINE & DETAILS</span>
              <div className="flex items-center gap-3">
                {isEditable && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this task?")) {
                        deleteTaskMutation.mutate(selectedTask._id);
                      }
                    }}
                    className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-red-500/5 rounded-lg transition-all border border-transparent hover:border-red-500/10 cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Scrollable details panel */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Task Primary details card */}
              <div className="space-y-3">
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
                  📂 {selectedTask.project}
                </span>
                <h2 className="text-base font-bold text-white">{selectedTask.title}</h2>
                <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/30 p-3 rounded-lg border border-zinc-900/60">
                  {selectedTask.description || "No description provided."}
                </p>
              </div>

              {/* Operational Selectors Grid (Inline mutations) */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-xs">
                {/* 1. Status Dropdown */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-500">Status</span>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleStatusChange(selectedTask._id, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 font-semibold focus:outline-none focus:ring-1 focus:ring-violet-600 appearance-none cursor-pointer"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    {isEditable && <option value="Completed">Completed</option>}
                  </select>
                </div>

                {/* 2. Priority Dropdown */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-500">Priority</span>
                  <select
                    disabled={!isEditable}
                    value={selectedTask.priority}
                    onChange={(e) => handlePriorityChange(selectedTask._id, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 font-semibold focus:outline-none focus:ring-1 focus:ring-violet-600 appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* 3. Assignee Selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-500">Assignee</span>
                  <select
                    disabled={!isEditable}
                    value={selectedTask.assigneeId?._id || selectedTask.assigneeId}
                    onChange={(e) => handleAssigneeChange(selectedTask._id, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 font-semibold focus:outline-none focus:ring-1 focus:ring-violet-600 appearance-none cursor-pointer disabled:opacity-60"
                  >
                    {assignees
                      .filter((a: any) => a.role === "Employee")
                      .map((a: any) => (
                        <option key={a._id} value={a._id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 4. Due Date view */}
                <div className="space-y-1.5 flex flex-col justify-end pb-1 px-1">
                  <span className="text-[10px] font-bold text-zinc-500 block mb-0.5">Due Date</span>
                  <span className="font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    {new Date(selectedTask.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Comments Feed Timeline */}
              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-violet-400" /> Discussion Timeline ({comments.length})
                </span>

                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 py-6 text-center">No comments on this task yet.</p>
                  ) : (
                    comments.map((c: any) => (
                      <div key={c._id} className="bg-zinc-900/20 border border-zinc-900/60 p-3 rounded-lg text-xs leading-relaxed space-y-2 flex gap-3.5 items-start">
                         <Avatar name={c.authorId?.name || "Deleted User"} sizeClass="h-7 w-7 text-[9px]" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-white text-[11px] truncate block leading-none">{c.authorId?.name}</strong>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-[11px]">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom comment textarea builder */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/60">
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or submit work notes..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-600"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
