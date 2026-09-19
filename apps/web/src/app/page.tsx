import Link from "next/link";
import { ArrowRight, Shield, Copy, ChevronDown } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col items-center pt-8 md:pt-14 px-6 text-center lowercase bg-[#FFFFFF] dark:bg-[#0C0C0C] text-black dark:text-white transition-colors font-mono overflow-x-hidden">
      
      <Link 
        href="/docs/architecture"
        className="mb-8 border border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] hover:bg-[#F4F4F5] dark:hover:bg-[#1A1A1A] hover:scale-105 transition-all rounded-full px-4 py-1.5 flex items-center gap-3 text-sm group"
      >
        <Shield size={14} className="text-yellow-500" />
        <span className="text-zinc-600 dark:text-[#A1A1AA]">
          isolate risk with zero-custody delegation.
        </span>
        <ArrowRight className="text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all" size={14} />
      </Link>

      <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-6xl leading-tight">
        shugo on-chain guardrails <br className="hidden md:block" /> for ai agents
      </h1>
      
      <p className="mt-8 text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg md:text-xl leading-relaxed">
        a zero-custody policy engine. enforce cryptographic velocity caps and execution bounds directly on <span className="font-semibold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">solana</span>.
      </p>

      <div className="mt-10 border border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] px-4 py-2 flex items-center gap-4 text-sm transition-colors text-zinc-400 dark:text-zinc-500 group">
        <code className="text-zinc-500">npx shugo init</code>
        <Copy size={14} className="ml-4 hover:text-black dark:hover:text-white cursor-pointer transition-colors active:scale-90" />
      </div>

      <button className="mt-10 bg-[#EAEAEA] dark:bg-[#EDEDED] text-black px-6 py-2.5 font-bold hover:bg-[#D4D4D4] dark:hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
        read the docs <ArrowRight size={16} />
      </button>

      <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-400">
        built on the solana foundation's official delegations program
      </p>

      <div className="mt-8 mb-8 flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm opacity-80 hover:opacity-100 transition-opacity">
        <span>see shugo in action</span>
        <ChevronDown size={16} className="mt-1 text-zinc-400 dark:text-zinc-600 animate-bounce" />
      </div>

      {/* 
        Grid layout guarantees mathematical centering of the middle column.
        xl:grid-cols-[200px_1fr_200px] forces the left and right columns to identical widths.
      */}
      <div className="w-full max-w-[90rem] grid grid-cols-1 xl:grid-cols-[200px_1fr_200px] gap-8 mt-1 mb-24 px-4 md:px-12 items-end">
        
        {/* Left Side "Footer" */}
        <div className="hidden xl:flex flex-col gap-4 text-zinc-500 dark:text-zinc-600 text-sm text-left mb-16">
          <span className="font-bold text-black dark:text-white">shugo / 守護</span>
          <Link href="https://x.com" target="_blank" className="hover:text-black dark:hover:text-white hover:translate-x-1 transition-all">x (twitter)</Link>
          <span className="mt-6 text-xs">© 2026</span>
        </div>

        {/* Center Column: Video Player + Timeline */}
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
          
          <div className="w-full aspect-video bg-[#FAFAFA] dark:bg-[#111111] border border-zinc-200 dark:border-[#222] flex items-center justify-center relative overflow-hidden transition-colors rounded-lg">
            <div className="absolute top-4 left-4 text-xs font-bold bg-white dark:bg-black text-black dark:text-white px-2 py-1 border border-zinc-200 dark:border-[#222] rounded">
              shugo_demo.mp4
            </div>
            <div className="w-20 h-20 bg-black dark:bg-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg group">
              <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white dark:border-l-black border-b-[12px] border-b-transparent ml-2 group-hover:scale-110 transition-transform" />
            </div>
          </div>


        </div>

        {/* Right Side "Footer" */}
        <div className="hidden xl:flex flex-col items-end gap-4 text-zinc-500 dark:text-zinc-600 text-sm text-right mb-16">
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14F195] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14F195]"></span>
            </span>
            <span className="text-black dark:text-white font-semibold">devnet live</span>
          </div>
          <Link href="/privacy" className="hover:text-black dark:hover:text-white hover:-translate-x-1 transition-all">privacy policy</Link>
          <Link href="/terms" className="hover:text-black dark:hover:text-white hover:-translate-x-1 transition-all">terms of service</Link>
        </div>

      </div>

    </main>
  );
}