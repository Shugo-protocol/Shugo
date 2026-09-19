"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-[84px] h-[30px]" />; 

  return (
    <div className="flex items-center p-0.5 rounded-full border border-zinc-200 dark:border-[#333] bg-[#F4F4F5] dark:bg-[#1A1A1A]">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-full transition-all ${
          theme === "light" ? "bg-white dark:bg-[#2A2A2A] shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-black dark:hover:text-white"
        }`}
      >
        <Sun size={14} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-full transition-all ${
          theme === "dark" ? "bg-white dark:bg-[#2A2A2A] shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-black dark:hover:text-white"
        }`}
      >
        <Moon size={14} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-full transition-all ${
          theme === "system" ? "bg-white dark:bg-[#2A2A2A] shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-black dark:hover:text-white"
        }`}
      >
        <Monitor size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}