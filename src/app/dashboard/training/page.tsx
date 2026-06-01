"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Play,
  CheckCircle2,
  Circle,
  Video,
  FileText,
  ExternalLink,
  Loader2,
  Users,
  Award,
  ChevronRight,
  Save,
  BookOpen,
  ArrowLeft,
  Code,
  MessageSquare,
  Globe,
  Settings,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";

// Static session list mapping the 12 days
const trainingSessions = [
  {
    day: 1,
    date: "Jun-02",
    topic: "HTML Fundamentals",
    concepts: "HTML5 Structure, Semantic Tags, Forms, Tables, Lists",
    youtube: "https://youtu.be/qz0aGYrrlhU?si=OLCRqZR8QFp8yRg5",
    videoId: "qz0aGYrrlhU",
    cheatSheet: {
      syntax: `<!-- Semantic Page Structure -->
<header>
  <nav class="flex justify-between">
    <a href="/">Cificap Portal</a>
  </nav>
</header>
<main class="container mx-auto p-4">
  <section class="mb-6">
    <h2>User Registration Form</h2>
    <form action="/api/register" method="POST" class="space-y-4">
      <input type="text" name="username" required class="p-2" />
      <input type="email" name="email" required class="p-2" />
      <button type="submit" class="bg-primary text-white px-4 py-2">Submit</button>
    </form>
  </section>
</main>`,
      classes: [
        { name: "<header> / <nav> / <main>", desc: "Semantic structural tags that define layout segments." },
        { name: "<form> / <input> / <button>", desc: "Core form controls for handling employee data submissions." },
        { name: "<table> / <thead> / <tbody>", desc: "Constructs structured tabular data display layers." },
        { name: "<ul> / <ol> / <li>", desc: "Unordered and ordered list elements for menus or bullet points." }
      ]
    }
  },
  {
    day: 2,
    date: "Jun-03",
    topic: "HTML Advanced + CSS Basics",
    concepts: "Links, Images, Media, CSS Selectors, Box Model",
    youtube: "https://youtu.be/6biMWgD6_JY?si=MziXggYVvWKrS-bE",
    videoId: "6biMWgD6_JY",
    cheatSheet: {
      syntax: `/* CSS Selectors & Box Model Setup */
* {
  box-sizing: border-box; /* Includes padding & borders in width */
}

.profile-card {
  width: 320px;
  padding: 16px;          /* Space inside border */
  border: 1px solid var(--border);
  margin: 12px;           /* Space outside border */
  border-radius: 8px;
}

.profile-card img {
  max-width: 100%;
  height: auto;
  border-radius: 50%;
}`,
      classes: [
        { name: "box-sizing: border-box;", desc: "Crucial rule to prevent padding and borders from breaking layout widths." },
        { name: "padding vs margin", desc: "Padding handles inner element spacing; margin controls outer structural margins." },
        { name: "a[target='_blank']", desc: "Attribute selector targeting link anchors to open in secondary windows." },
        { name: "<img src='' alt=''>", desc: "Embeds image files. Always specify alt text for accessibility constraints." }
      ]
    }
  },
  {
    day: 3,
    date: "Jun-04",
    topic: "CSS Layouts & Responsive Design",
    concepts: "Flexbox, Grid, Positioning, Media Queries",
    youtube: "https://youtu.be/x4u1yp3Msao?si=KdgXI1-JdtAEGnco",
    videoId: "x4u1yp3Msao",
    cheatSheet: {
      syntax: `/* Flexbox Layout Alignment */
.navbar-flex {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

/* Grid Layout Matrix */
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

/* Responsive Breakpoint Adjustment */
@media (max-width: 768px) {
  .team-grid {
    grid-template-columns: 1fr; /* Single column on mobile screens */
  }
}`,
      classes: [
        { name: "display: flex;", desc: "Establishes one-dimensional flexible alignment rows or columns." },
        { name: "display: grid;", desc: "Constructs multi-column grid layouts with defined grid gaps." },
        { name: "position: absolute / relative / sticky", desc: "Coordinates offsets relative to viewport, elements, or scrolling points." },
        { name: "@media (max-width: ...)", desc: "Triggers CSS styling sheets shifts depending on screen dimensions boundaries." }
      ]
    }
  },
  {
    day: 4,
    date: "Jun-05",
    topic: "CSS Advanced + Antigravity Intro",
    concepts: "Animations, Transitions, Tailwind CSS, Antigravity Setup",
    youtube: "https://youtu.be/5BI5DgzyFAA?si=0MuAkvVOIMLfRF0L",
    videoId: "5BI5DgzyFAA",
    cheatSheet: {
      syntax: `/* Transitions and Keyframe Animations */
.glow-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glow-card:hover {
  transform: translateY(-4px);
  filter: drop-shadow(0 4px 12px rgba(124, 58, 237, 0.4));
}

@keyframes floatGlow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1.0; transform: scale(1.02); }
}

.pulsing-effect {
  animation: floatGlow 2s infinite ease-in-out;
}`,
      classes: [
        { name: "transition-property / duration", desc: "Smooths CSS style property changes over a specified timeline." },
        { name: "@keyframes / animation", desc: "Creates multi-step custom CSS keyframe state transitions." },
        { name: "@theme (Tailwind v4)", desc: "Extends Tailwind design token configurations with custom variables." },
        { name: "git clone <repo-url>", desc: "Initializes local repository cloning to set up paired Antigravity environment." }
      ]
    }
  },
  {
    day: 5,
    date: "Jun-06",
    topic: "Prompt Engineering",
    concepts: "Prompt Writing, Context Building, UI Generation, Iteration Techniques",
    youtube: "https://youtu.be/2BpCk4d2Cc0?si=aQPswmazGmdqUXbo",
    videoId: "2BpCk4d2Cc0",
    cheatSheet: {
      syntax: `### High-Quality LLM Prompt Recipe
1. **Persona**: "Act as a Lead Frontend Engineer."
2. **Context**: "Refactoring \`src/components/layout/Sidebar.tsx\` using Next.js 16 & Tailwind v4."
3. **Objective**: "Enable full mobile responsive drawer overlay without breaking desktop layout."
4. **Constraints**: "Keep HSL CSS variables, do not utilize base colors (zinc/neutral ok), write complete files."
5. **Instruction**: "Output the complete diff block clearly."`,
      classes: [
        { name: "Context Window Mapping", desc: "Supplying exact files contexts to LLMs to prevent hallucinatory edits." },
        { name: "Constraints Definition", desc: "Setting concrete styling, performance, or library constraints inside prompts." },
        { name: "UI Prototyping (Lovable/v0)", desc: "Generating premium prototype interfaces using AI prompt layouts generators." },
        { name: "Iterative Refinement", desc: "Reviewing code logic outputs and issuing precise correction updates." }
      ]
    }
  },
  {
    day: 6,
    date: "Jun-07",
    topic: "Week 1 Review + Mini Project",
    concepts: "GitHub Workflow, Code Review, Responsive Design Best Practices",
    youtube: "",
    videoId: "",
    cheatSheet: {
      syntax: `### Week 1 Mini-Project: Personal/Product Landing Page Workbook
* Objective: Build a premium responsive Landing Page utilizing HTML5, semantic elements, and Tailwind CSS.

#### 🛠️ Git & Workflow Steps:
1. Initialize Repository & Create Feature Branch:
   $ git checkout -b feature/mini-landing-page
2. Structure page wireframe utilizing HTML5 semantic blocks.
3. Code layout containing hero header, 3-column features panel, and interactive contact form.
4. Stage changes & commit clean logs:
   $ git add .
   $ git commit -m "feat: design responsive glassmorphic landing page"
5. Push to GitHub & deploy project instantly on Vercel.`,
      classes: [
        { name: "git checkout -b <branch>", desc: "Launches clean feature branch tracking to secure primary codebase master files." },
        { name: "git commit -m '<message>'", desc: "Saves snapshot tracking with descriptive descriptive commit logs." },
        { name: "Vercel Sync Integrations", desc: "Automatically triggers production deploys upon git push commits." },
        { name: "Semantic Hierarchy", desc: "Ensures single <h1> header, proper heading cascades, and clean HTML5 elements." }
      ]
    }
  },
  {
    day: 7,
    date: "Jun-09",
    topic: "React Fundamentals",
    concepts: "JSX, Components, Props, State, Event Handling",
    youtube: "https://youtu.be/SqcY0GIETPk?si=2eAEgDlfUo2BtEZP",
    videoId: "SqcY0GIETPk",
    cheatSheet: {
      syntax: `import React, { useState } from "react";

// Passing Props to Reusable Child Component
interface CardProps {
  title: string;
  onSelect: () => void;
}

export function FeatureCard({ title, onSelect }: CardProps) {
  return (
    <button onClick={onSelect} className="p-4 bg-card border rounded-lg hover:bg-accent text-left">
      <h3 className="font-bold text-foreground text-sm">{title}</h3>
    </button>
  );
}

// React State hook Management
export default function TrainingSelector() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-xs">Selected: {selected || "None"}</p>
      <FeatureCard title="CSS Grid" onSelect={() => setSelected("CSS Grid")} />
    </div>
  );
}`,
      classes: [
        { name: "useState<T>(initial)", desc: "Enables interactive, state-reactive properties inside React component cycles." },
        { name: "Props Passing", desc: "Flows readonly settings, titles, or callbacks down to child components." },
        { name: "JSX Syntax Requirements", desc: "Enforces single element root wrappers, className attributes, and camelCase attributes." },
        { name: "onClick / onChange Events", desc: "Binds user action callbacks directly to state updates." }
      ]
    }
  },
  {
    day: 8,
    date: "Jun-10",
    topic: "Lovable AI",
    concepts: "Building Apps with Lovable, Prompt-Based Development, UI Generation, CRUD Apps",
    youtube: "https://youtu.be/YLjopoEnPi8?si=fnTXcCifPDXwcJRi",
    videoId: "YLjopoEnPi8",
    cheatSheet: {
      syntax: `### Premium Lovable CRUD Prompts
1. **Initialize State Schema**: "Build a leaves application. Each leave has startDate, endDate, status ('Pending'|'Approved'|'Rejected'), and employeeId."
2. **Design Roster UI Grid**: "Create a premium table displaying leaves. Include filter badges, approved state green glows, and pending indicators."
3. **Connect API Endpoint**: "Create mock database collection array, and write create/update functions to bind form actions directly to state logs."`,
      classes: [
        { name: "Lovable Editor Engine", desc: "Translates high-level prompts into highly structured react portfolios." },
        { name: "State Mappings Validation", desc: "Ensures UI actions correctly trigger item edits, deletions, and additions." },
        { name: "API Bindings Protocols", desc: "Syncs frontend components with mock or active database endpoints." },
        { name: "Visual Styling Customization", desc: "Adjusts card padding, border spacing, and glassmorphic variables." }
      ]
    }
  },
  {
    day: 9,
    date: "Jun-11",
    topic: "Node.js & Express Basics",
    concepts: "Node.js Runtime, Express Server, Routing, REST APIs, CRUD Operations",
    youtube: "https://youtu.be/CnH3kAXSrmU?si=wgDSinKLmeBoopRe",
    videoId: "CnH3kAXSrmU",
    cheatSheet: {
      syntax: `const express = require("express");
const app = express();

app.use(express.json()); // Parses incoming JSON payloads

// REST API endpoint: Retrieve Team Tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find({}).populate("assigneeId", "name");
    return res.status(200).json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => console.log("Backend server active"));`,
      classes: [
        { name: "app.use(express.json())", desc: "Middleware configuration enabling request body body-parsing parsing." },
        { name: "res.status(200).json(...)", desc: "Returns unified JSON payload data back to client components." },
        { name: "app.get / app.post / app.put", desc: "Express routing actions matching REST standard requests." },
        { name: "mongoose.model()", desc: "Compiles MongoDB schema definitions into query-ready data objects." }
      ]
    }
  },
  {
    day: 10,
    date: "Jun-12",
    topic: "Data Science Fundamentals",
    concepts: "Python Basics, NumPy, Pandas, Data Analysis, Data Visualization",
    youtube: "https://youtu.be/XU5pw3QRYjQ?si=8Ht2ZuCB3a5BnRrH",
    videoId: "XU5pw3QRYjQ",
    cheatSheet: {
      syntax: `import pandas as pd
import numpy as np

# Load employee workspace dataset
df = pd.read_csv("employee_stats.csv")

# Filter dataset: Roster members under engineering
dev_team = df[df["department"] == "Engineering"]

# Aggregate: Calculate mean completed tasks grouped by designation
task_averages = df.groupby("designation")["completed_tasks"].mean().reset_index()

# output data metrics
print(task_averages.to_dict(orient="records"))`,
      classes: [
        { name: "pd.read_csv('filepath.csv')", desc: "Parses tabular CSV files into high-performance Pandas DataFrames." },
        { name: "df.groupby('col')['metric'].mean()", desc: "Runs lightning-fast database-style group calculations." },
        { name: "df[df['col'] == val]", desc: "Filters rows depending on comparison matching criteria." },
        { name: "np.array([...])", desc: "Creates optimized numerical array grids for data computations." }
      ]
    }
  },
  {
    day: 11,
    date: "Jun-13",
    topic: "Automation with n8n",
    concepts: "Workflows, Webhooks, API Integrations, Triggers & Actions",
    youtube: "https://youtu.be/e30V3LnrS7o?si=9hYbsQ21DspiwXA",
    videoId: "e30V3LnrS7o",
    cheatSheet: {
      syntax: `/* n8n Webhook dynamic email payload syntax */
{
  "email": "{{ $json.body.recipient }}",
  "subject": "Sprint Task Assigned",
  "body": "Hi {{ $json.body.name }}, a new critical task '{{ $json.body.title }}' has been assigned to your board. Details: {{ $json.body.link }}"
}`,
      classes: [
        { name: "Webhook Listen Node", desc: "Receives real-time incoming HTTP POST requests from external apps." },
        { name: "n8n expression editor", desc: "Enables template string interpolation using double curly brackets syntax." },
        { name: "Node-based Workflow", desc: "Connects webhooks, APIs, filters, and loops without writing complex code." },
        { name: "API HTTP Request Node", desc: "Makes direct REST calls to fetch or update records across other services." }
      ]
    }
  },
  {
    day: 12,
    date: "Jun-14",
    topic: "Final Project & Demo Day",
    concepts: "Project Presentation, Team Collaboration, Deployment, Code Review",
    youtube: "",
    videoId: "",
    cheatSheet: {
      syntax: `### Week 2 Final Project: Full-Stack Next.js 16 Workspace Platform
* Objective: Collaborate to build and host the centralized Cificap Workspace.

#### 📦 Core Deliverables Checklist:
1. Setup nested App Router routes under protected \`/dashboard\` dashboard scopes.
2. Form Mongoose models: User, Team, Task, TaskComment, Leave, TrainingProgress.
3. Secure layout routing frames via NextAuth (Auth.js) credentials token handlers.
4. Program interactive Kanban Task Board containing drag-and-drop simulated status updates.
5. Code Leave Roster Calendar with interactive click-to-select range selection.
6. Install Ctrl+K floating Command Palette navigating to all dashboard sections.
7. Perform production build checks and deploy securely on Vercel.`,
      classes: [
        { name: "Next.js protected layout", desc: "Redirects unauthenticated visitors back to login path instantly." },
        { name: "Mongoose Relations", desc: "Populates related database records across tables (assignees, comments, review authors)." },
        { name: "Next.js Route Handlers", desc: "Deploys secure backend API endpoints inside app/api/* folder scopes." },
        { name: "Vercel environment settings", desc: "Syncs MONGODB_URI and NEXTAUTH_SECRET values in production environments." }
      ]
    }
  }
];

export default function TrainingPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const user = session?.user;

  const isAdmin = user?.role === "Admin";

  // State hooks
  const [selectedDay, setSelectedDay] = useState(1);
  const [personalNotes, setPersonalNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"syllabus" | "notes">("syllabus");

  // Admin specific states
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  // Sync state notes when day changes
  React.useEffect(() => {
    if (userProgress) {
      const activeRecord = userProgress.find((p: any) => p.day === selectedDay);
      setPersonalNotes(activeRecord?.notes || "");
    }
  }, [selectedDay]);

  // Query: Get Training Progress data
  // Admin gets all employee progress summaries, Employee gets their own 12 days progress.
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["training-progress", isAdmin],
    queryFn: async () => {
      const res = await fetch("/api/training");
      return res.json();
    },
    enabled: !!session,
  });

  const userProgress = progressData?.progress || [];
  const adminRoster = progressData?.roster || [];

  // Initialize selected notes on first load
  React.useEffect(() => {
    if (userProgress.length > 0 && !personalNotes) {
      const activeRecord = userProgress.find((p: any) => p.day === selectedDay);
      setPersonalNotes(activeRecord?.notes || "");
    }
  }, [userProgress]);

  // Mutation: Save Progress Status & Personal Notes
  const saveProgressMutation = useMutation({
    mutationFn: async ({
      day,
      completed,
      notes,
    }: {
      day: number;
      completed: boolean;
      notes: string;
    }) => {
      const res = await fetch("/api/training", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, completed, notes }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Progress saved successfully!");
        queryClient.invalidateQueries({ queryKey: ["training-progress"] });
      } else {
        toast.error(data.error);
      }
    },
  });

  const handleToggleCompleted = (day: number, currentCompleted: boolean) => {
    const activeRecord = userProgress.find((p: any) => p.day === day);
    saveProgressMutation.mutate({
      day,
      completed: !currentCompleted,
      notes: activeRecord?.notes || "",
    });
  };

  const handleSaveNotes = () => {
    const activeRecord = userProgress.find((p: any) => p.day === selectedDay);
    saveProgressMutation.mutate({
      day: selectedDay,
      completed: activeRecord?.completed || false,
      notes: personalNotes,
    });
  };

  // Helper rendering
  const activeSession = trainingSessions.find((s) => s.day === selectedDay)!;
  const activeProgress = userProgress.find((p: any) => p.day === selectedDay);

  const getCompletedCount = () => {
    return userProgress.filter((p: any) => p.completed).length;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="border-b border-zinc-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Internship Training Sessions</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete the daily training modules, review key concepts, save notes, and track certification progress.
          </p>
        </div>

        {/* Global Progress Pill for Employee */}
        {!isAdmin && userProgress.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-900 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <Award className="h-5 w-5 text-violet-400" />
            <div>
              <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide">Overall Progress</span>
              <span className="text-xs text-white font-semibold">
                {getCompletedCount()} / 12 Days ({Math.round((getCompletedCount() / 12) * 100)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {progressLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        </div>
      ) : isAdmin ? (
        // =========================================================================
        // ADMIN PORTAL VIEW
        // =========================================================================
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow">
            <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-400" /> Internship Roster Training Logs ({adminRoster.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/40 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Employee</th>
                    <th className="py-3 px-5">Designation</th>
                    <th className="py-3 px-5">Days Completed</th>
                    <th className="py-3 px-5">Percentage</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                  {adminRoster.map((row: any) => (
                    <tr key={row.employee._id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="py-4 px-5 flex items-center gap-3">
                        <Avatar name={row.employee.name} sizeClass="h-8 w-8 text-[10px]" />
                        <div>
                          <strong className="text-white text-[11px] block">{row.employee.name}</strong>
                          <span className="text-[9px] text-zinc-500 block font-mono">{row.employee.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-medium text-zinc-400">
                        {row.employee.designation || "Engineer Intern"}
                      </td>
                      <td className="py-4 px-5 font-mono text-zinc-450 font-semibold">
                        {row.completedCount} / 12 Days
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3 max-w-[160px]">
                          <div className="flex-1 h-1.5 w-24 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                            <div
                              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                              style={{ width: `${row.percentage}%` }}
                            />
                          </div>
                          <span className="font-semibold text-white font-mono text-[10px]">
                            {row.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedEmployee(row)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 font-semibold"
                        >
                          View Log <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sliding Right Drawer Panel for Admin inspecting Employee detailed progress */}
          {selectedEmployee && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
              <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-900 h-full flex flex-col shadow-2xl animate-slide-in p-6 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    <ArrowLeft className="h-4 w-4" /> Close Panel
                  </button>
                  <span className="text-[10px] font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-mono uppercase">
                    Intern Study Log
                  </span>
                </div>

                {/* Employee Details Card inside drawer */}
                <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-4 flex gap-4 items-center mb-6">
                  <Avatar name={selectedEmployee.employee.name} sizeClass="h-12 w-12 text-sm" />
                  <div className="flex-1 min-w-0">
                    <strong className="text-white text-sm block leading-tight">{selectedEmployee.employee.name}</strong>
                    <span className="text-xs text-zinc-500 block mt-1">{selectedEmployee.employee.designation || "Intern"}</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-[10px] text-zinc-400 border-t border-zinc-900/60 pt-2">
                      {selectedEmployee.employee.githubUsername && (
                        <span className="flex items-center gap-1.5 font-mono">
                          <Code className="h-3.5 w-3.5 text-zinc-500" /> {selectedEmployee.employee.githubUsername}
                        </span>
                      )}
                      {selectedEmployee.employee.discordUsername && (
                        <span className="flex items-center gap-1.5 font-mono">
                          <MessageSquare className="h-3.5 w-3.5 text-zinc-500" /> {selectedEmployee.employee.discordUsername}
                        </span>
                      )}
                      {selectedEmployee.employee.clickupEmail && (
                        <span className="flex items-center gap-1.5 font-mono">
                          <Globe className="h-3.5 w-3.5 text-zinc-500" /> {selectedEmployee.employee.clickupEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stepper Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                    <BookOpen className="h-4 w-4 text-violet-400" /> Day-by-Day Session Logs ({selectedEmployee.completedCount} / 12)
                  </h3>

                  <div className="space-y-3.5">
                    {trainingSessions.map((session) => {
                      const record = selectedEmployee.progress.find((p: any) => p.day === session.day);
                      return (
                        <div
                          key={session.day}
                          className={`p-4 border rounded-xl flex flex-col gap-3 transition-colors ${record?.completed
                            ? "bg-emerald-950/5 border-emerald-900/20"
                            : "bg-zinc-950 border-zinc-900"
                            }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] font-bold text-zinc-500 font-mono block uppercase">
                                Day {session.day} — {session.date}
                              </span>
                              <strong className="text-white text-xs block mt-1 truncate">{session.topic}</strong>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${record?.completed
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-zinc-900 text-zinc-500 border-zinc-800"
                                }`}
                            >
                              {record?.completed ? "Completed" : "In Progress"}
                            </span>
                          </div>

                          {record?.notes ? (
                            <div className="p-3 bg-zinc-900/40 rounded border border-zinc-900/80 mt-1 flex flex-col gap-1.5">
                              <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wide">Intern's Review Notes:</span>
                              <p className="text-[11px] text-zinc-300 italic whitespace-pre-wrap leading-relaxed">
                                "{record.notes}"
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-650 italic mt-0.5">No study notes documented for this day.</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // =========================================================================
        // EMPLOYEE VIEW (CORE LEARNING HUB)
        // =========================================================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stepper Sidebar list of 12 days */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow h-fit space-y-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block border-b border-zinc-900 pb-2">
              Syllabus Outline (12 Days)
            </span>

            <div className="space-y-2">
              {trainingSessions.map((session) => {
                const record = userProgress.find((p: any) => p.day === session.day);
                const isSelected = selectedDay === session.day;
                const isCompleted = record?.completed;

                return (
                  <button
                    key={session.day}
                    onClick={() => setSelectedDay(session.day)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3 cursor-pointer ${isSelected
                      ? "bg-violet-600/10 border-violet-500/20 text-white font-semibold shadow shadow-violet-500/5"
                      : "bg-transparent border-transparent hover:bg-zinc-900/60 text-zinc-400 hover:text-white"
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-zinc-600 shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-bold text-zinc-500 font-mono block uppercase">
                        Day {session.day} • {session.date}
                      </span>
                      <span className="text-[11px] truncate block mt-0.5 leading-tight">{session.topic}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area: Video, Details, and Notes Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold text-zinc-500 font-mono block uppercase">
                    Day {activeSession.day} • {activeSession.date} MODULE
                  </span>
                  <h2 className="text-base font-bold text-white tracking-tight mt-1 truncate">{activeSession.topic}</h2>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mark as Completed Button */}
                  <button
                    onClick={() => handleToggleCompleted(activeSession.day, activeProgress?.completed || false)}
                    disabled={saveProgressMutation.isPending}
                    className={`px-3.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 ${activeProgress?.completed
                      ? "bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-500/20 text-emerald-400"
                      : "bg-violet-600 hover:bg-violet-500 border-violet-500 text-white shadow shadow-violet-600/10"
                      }`}
                  >
                    {saveProgressMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {activeProgress?.completed ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                      </>
                    ) : (
                      "Mark as Completed"
                    )}
                  </button>
                </div>
              </div>

              {/* Concepts list */}
              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Concepts Covered:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSession.concepts.split(",").map((concept) => (
                    <span
                      key={concept}
                      className="text-[9.5px] bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-zinc-300 font-semibold"
                    >
                      {concept.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Video Player */}
              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Session Video Tutorial:</span>
                {activeSession.videoId ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 relative">
                    <iframe
                      src={`https://www.youtube.com/embed/${activeSession.videoId}?modestbranding=1&rel=0`}
                      title={activeSession.topic}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                    <Video className="h-10 w-10 text-zinc-700 mb-3" />
                    <strong className="text-white text-xs block">Hands-on Review / Demo Day Only</strong>
                    <span className="text-[10px] text-zinc-500 max-w-[280px] mt-1 block">
                      No video tutorial for this session. Use this day to work on your mini project drafts or deployment review logs.
                    </span>
                  </div>
                )}
              </div>

              {/* Personal Notes Rich Textarea under the Video */}
              <div className="space-y-3.5 border-t border-zinc-900 pt-5 mt-5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-violet-400" /> My Study Review Notes:
                  </span>
                  {saveProgressMutation.isPending && (
                    <span className="text-[9px] text-zinc-500 flex items-center gap-1 font-mono italic">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> saving...
                    </span>
                  )}
                </div>

                <textarea
                  rows={6}
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  placeholder="Document key highlights, terms, commands, or personal review notes here..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-600 resize-none font-sans"
                />

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveNotes}
                    disabled={saveProgressMutation.isPending}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Session Notes
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Cheat Sheet & Code Revision Panel */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow space-y-4">
              <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                <div className="h-7 w-7 rounded bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">💡 Study & Syntax Cheat Sheet</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Quick guide on syntax rules, classes, and project work instructions.</p>
                </div>
              </div>

              {activeSession.cheatSheet ? (
                <div className="space-y-4 text-xs">
                  {/* Syntax Code block */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Code Syntax & Templates:</span>
                    <pre className="bg-zinc-900 border border-zinc-850 text-[10.5px] p-3.5 rounded-lg text-emerald-400 font-mono overflow-x-auto select-all leading-normal">
                      <code>{activeSession.cheatSheet.syntax}</code>
                    </pre>
                  </div>

                  {/* Related tag/class revision lists */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Key Classes, Tags & Directives:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeSession.cheatSheet.classes.map((cls: any) => (
                        <div key={cls.name} className="p-2.5 bg-zinc-900/40 border border-zinc-900/60 rounded-lg flex flex-col gap-1">
                          <code className="text-violet-400 font-mono text-[10px] font-bold">{cls.name}</code>
                          <span className="text-[10px] text-zinc-400">{cls.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-zinc-500 italic">No custom cheat sheet available for this session.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
