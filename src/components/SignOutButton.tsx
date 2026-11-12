"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }
  return (
    <button onClick={signOut} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900" title="Sign out">
      <LogOut className="h-5 w-5" aria-hidden /> <span className="hidden md:inline">Sign out</span>
    </button>
  );
}
