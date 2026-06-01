import React from "react";

interface AvatarProps {
  name?: string;
  sizeClass?: string;
}

export default function Avatar({ name = "User", sizeClass = "h-9 w-9 text-[11px]" }: AvatarProps) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length === 1 
    ? parts[0].slice(0, 2).toUpperCase() 
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  // Consistent gradient based on name hash
  const colors = [
    "from-violet-600 to-indigo-500",
    "from-emerald-600 to-teal-500",
    "from-rose-600 to-orange-500",
    "from-blue-600 to-cyan-500",
    "from-amber-600 to-yellow-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  const gradient = colors[index];

  return (
    <div className={`${sizeClass} rounded-lg bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold text-white shadow-sm border border-white/10 shrink-0 select-none uppercase`} title={name}>
      {initials}
    </div>
  );
}
