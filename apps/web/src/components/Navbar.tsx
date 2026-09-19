import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import ScrambleText from "./ScrambleText";
import { ThemeToggle } from "./ThemeToggle";

const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Navbar() {
  return (
    <header className="w-full bg-[#FFFFFF] dark:bg-[#0C0C0C] font-mono text-sm lowercase transition-colors">
      
      {/* Top Nav Row */}
      <div className="w-full border-b border-zinc-200 dark:border-[#222]">
        {/* Changed max-w-6xl to max-w-7xl and fixed invalid px-[-10] to px-6 */}
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Link className="font-bold text-xl text-black dark:text-white hover:opacity-70 transition-opacity min-w-[100px]" href="/">
              <ScrambleText text="shugo" japanese="守護" hindi="शुगो" />
            </Link>
            <nav className="hidden md:flex gap-4 text-zinc-500 dark:text-zinc-400">
              <Link className="hover:text-black dark:hover:text-white transition-colors" href="/docs">docs</Link>
              <Link className="hover:text-black dark:hover:text-white transition-colors" href="/cli">cli</Link>
              <Link className="hover:text-black dark:hover:text-white transition-colors" href="/dashboard">dashboard</Link>
              <Link className="hover:text-black dark:hover:text-white transition-colors" href="/proofs">proofs</Link>
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle/>
            <Link 
              className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors ml-2" 
              href="https://github.com/Shugo-protocol/Shugo" 
              target="_blank"
            >
              <GithubIcon size={18} />
            </Link>
          </div>
        </div>
      </div>
      
    </header>
  );
}