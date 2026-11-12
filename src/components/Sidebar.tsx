"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "./ThemeToggle";
import { Brush, Layers, LayoutDashboard, ListTodo, NotebookPen, Sparkles, type LucideIcon } from "lucide-react";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/whiteboard", label: "Whiteboard", icon: Brush },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/ask", label: "Ask AI", icon: Sparkles },
  { href: "/review", label: "Review", icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-full shrink-0 flex-row items-center border-b border-slate-200 bg-white px-2 md:h-full md:w-56 md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-0">
      <Link href="/dashboard" className="whitespace-nowrap px-2 py-3 text-lg font-bold md:px-4 md:py-5 md:text-xl">
        Cogni<span className="text-indigo-600">vo</span>
      </Link>
      <nav className="flex flex-row gap-1 md:flex-1 md:flex-col md:px-2">
        {links.map((l) => {
          const Icon = l.icon;
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              className={`flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium md:px-3 ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden md:inline">{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3 p-2 md:ml-0 md:border-t md:border-slate-200 md:p-4">
        <ThemeToggle />
        <span className="hidden h-5 w-px bg-slate-200 md:block" aria-hidden />
        <SignOutButton />
      </div>
    </aside>
  );
}
