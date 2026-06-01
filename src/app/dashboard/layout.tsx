import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sleek Pinned Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky top header navbar */}
        <Navbar />

        {/* Dynamic page container (scrollable) */}
        <main className="flex-1 overflow-y-auto px-6 py-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
