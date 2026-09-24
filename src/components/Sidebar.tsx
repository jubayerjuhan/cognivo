"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/notes", label: "Notes", icon: "📝" },
  { href: "/whiteboard", label: "Whiteboard", icon: "🎨" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-slate-200 bg-white md:w-56">
      <Link href="/dashboard" className="px-4 py-5 text-xl font-bold">
        <span className="md:hidden">C</span>
        <span className="hidden md:inline">
          Cogni<span className="text-indigo-600">vo</span>
        </span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{l.icon}</span>
              <span className="hidden md:inline">{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3 border-t border-slate-200 p-4">
        <UserButton />
      </div>
    </aside>
  );
}
