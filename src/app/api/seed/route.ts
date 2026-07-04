import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  User,
  Team,
  Task,
  Leave,
  Announcement,
  TrainingProgress,
  ActivityLog,
  Notification,
  TaskComment,
  Standout,
} from "@/lib/models";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Clean existing database collections
    await User.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});
    await TaskComment.deleteMany({});
    await Leave.deleteMany({});
    await Announcement.deleteMany({});
    await TrainingProgress.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    await Standout.deleteMany({});

    // 2. Encrypt default password
    const defaultHashedPassword = await bcrypt.hash("password123", 10);

    // 3. Create Admin: Prasad Chodagiri
    const admin = await User.create({
      name: "Prasad Chodagiri",
      email: "chodagiriprasad5@gmail.com",
      password: defaultHashedPassword,
      role: "Admin",
      phone: "+91 99999 88888",
      designation: "Managing Director & Admin",
      skills: ["Leadership", "Management", "Operations", "SaaS Strategy"],
      joiningDate: new Date("2024-01-15"),
      profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    });

    // 4. Create Team Lead: Prasad Cificap
    const leadPrasad = await User.create({
      name: "Prasad Cificap",
      email: "prasad.cificap@gmail.com",
      password: defaultHashedPassword,
      role: "Team Lead",
      phone: "+91 98765 00000",
      designation: "Engineering Lead",
      skills: ["Next.js", "System Design", "Node.js", "Team Leadership"],
      joiningDate: new Date("2024-06-01"),
      profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    });

    // 5. Create Core Engineering Team
    const engineeringTeam = await Team.create({
      name: "Core Engineering",
      description: "Building the next-generation premium SaaS platform.",
      leadId: leadPrasad._id,
    });

    // Link Team Lead to their Team
    leadPrasad.teamId = engineeringTeam._id;
    await leadPrasad.save();

    // 6. Create Employees (Reporting to leadPrasad inside engineeringTeam)
    const empYeswanth = await User.create({
      name: "Yeswanth Gorusureddy",
      email: "yeswanthgorusureddy.cificap@gmail.com",
      password: defaultHashedPassword,
      role: "Employee",
      phone: "+91 98765 00001",
      designation: "Associate Software Engineer",
      teamId: engineeringTeam._id,
      leadId: leadPrasad._id,
      skills: ["React", "TypeScript", "Tailwind CSS", "Zustand"],
      joiningDate: new Date("2025-01-10"),
      profilePicture: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      githubUsername: "yeswanthgorusureddy-cificap",
      vercelUsername: "yeswanthgorusureddy.cificap@gmail.com",
      discordUsername: "yeswanthgorusureddycificap",
      clickupEmail: "yeswanthgorusureddy.cificap@gmail.com",
    });

    const empRamya = await User.create({
      name: "Chintha Ramya",
      email: "chintharamya.cificap@gmail.com",
      password: defaultHashedPassword,
      role: "Employee",
      phone: "+91 98765 00002",
      designation: "Associate Software Engineer",
      teamId: engineeringTeam._id,
      leadId: leadPrasad._id,
      skills: ["React", "TypeScript", "Next.js", "State Management"],
      joiningDate: new Date("2025-01-12"),
      profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      githubUsername: "chintharamya-cificap",
      vercelUsername: "ramyachintha05",
      discordUsername: "ramyachinthacificap",
      clickupEmail: "ramyachintha61@gmail.com",
    });

    const empVijaya = await User.create({
      name: "Vijaya Singampalli",
      email: "vijaya.cificap@gmail.com",
      password: defaultHashedPassword,
      role: "Employee",
      phone: "+91 98765 00003",
      designation: "Associate Software Engineer",
      teamId: engineeringTeam._id,
      leadId: leadPrasad._id,
      skills: ["Figma", "UI/UX Design", "Next.js UI", "CSS Gradients"],
      joiningDate: new Date("2025-01-15"),
      profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      githubUsername: "vijaya-cificap",
      vercelUsername: "vijaya.cificap@gmail.com",
      discordUsername: "vijayasingampalli",
      clickupEmail: "vijaya.cificap@gmail.com",
    });

    const empKhyathi = await User.create({
      name: "Khyathi Prasad Nethula",
      email: "khyathiprasadnethula.cificap@gmail.com",
      password: defaultHashedPassword,
      role: "Employee",
      phone: "+91 98765 00004",
      designation: "Associate Software Engineer",
      teamId: engineeringTeam._id,
      leadId: leadPrasad._id,
      skills: ["React", "TypeScript", "Tailwind CSS", "Redux"],
      joiningDate: new Date("2025-01-18"),
      profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      githubUsername: "khyathiprasadnethula-cificap",
      vercelUsername: "khyathiprasadnethula.cificap@gmail.com",
      discordUsername: "khyathi_nethula",
      clickupEmail: "khyathiprasadnethula.cificap@gmail.com",
    });

    const empVijayReddy = await User.create({
      name: "Karri Vijay Rama Reddy",
      email: "karrivijayramareddy.cificap@gmail.com",
      password: defaultHashedPassword,
      role: "Employee",
      phone: "+91 98765 00005",
      designation: "Associate Software Engineer",
      teamId: engineeringTeam._id,
      leadId: leadPrasad._id,
      skills: ["MongoDB", "Mongoose", "Next.js APIs", "Security"],
      joiningDate: new Date("2025-01-20"),
      profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      githubUsername: "karrivijayramareddy-cificap",
      vercelUsername: "karrivijayramareddy.cificap@gmail.com",
      discordUsername: "karrivijayramareddy.cificap",
      clickupEmail: "karrivijayramareddy.cificap@gmail.com",
    });

    // Mock Tasks, Task Comments, and Leaves creation are cleared.
    // This allows the database collections for tasks/leaves to be empty by default on seeding.

    // 10. Create Announcements
    await Announcement.create({
      title: "Welcome to Cificap Workspace Platform!",
      content: "We are thrilled to launch the new centralized workspace platform. Team members can now view tasks, schedule leaves, write e-learning notes, and collaborate efficiently from a unified premium console.",
      authorId: admin._id,
      teamVisibility: null, // Company-wide
      pinned: true,
      attachments: [{ name: "Platform Guide", url: "#" }],
    });

    await Announcement.create({
      title: "Sprint 1 Development Guidelines",
      content: "Core engineering design sync has been scheduled for Monday. All engineers under Prasad's team should present drafts of their technical schemas.",
      authorId: leadPrasad._id,
      teamVisibility: engineeringTeam._id, // Team Specific
      pinned: false,
    });

    // E-learning module data is cleared.

    // 12. Create Activity Logs
    const activities = [
      { actorId: admin._id, action: "Created the organization workspace.", category: "Team" },
      { actorId: leadPrasad._id, action: "Created 'Core Engineering' team.", category: "Team" },
    ];
    await ActivityLog.insertMany(activities);


    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with premium mock records!",
    });
  } catch (error: any) {
    console.error("Seeding Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
