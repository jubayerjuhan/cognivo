"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cognivo-theme", next ? "dark" : "light");
    } catch {}
    window.dispatchEvent(new Event("cognivo-theme"));
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
      <span className="hidden md:inline">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
