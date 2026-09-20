"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Copy, Check, ChevronDown } from "lucide-react";
import ScrambleText from "@/components/ScrambleText";

// todo: have to change the doc link + npx shugo init is a dummy command correct it once official package is deployed on npm package
export default function Home() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("npx shugo init");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col items-center pt-8 md:pt-14 px-4 sm:px-6 text-center lowercase bg-[#FFFFFF] dark:bg-[#0C0C0C] text-black dark:text-white transition-colors font-mono overflow-x-hidden relative">

      <Link 
        href="/docs/architecture"
        className="mb-7 border border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] hover:bg-[#F4F4F5] dark:hover:bg-[#1A1A1A] transition-all rounded-full px-4 py-1.5 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm group max-w-full z-10"
      >
        <Shield size={14} className="text-yellow-500 shrink-0" />
        <span className="text-zinc-600 dark:text-[#A1A1AA] truncate">
          delegate cpi execution authority, never private keys.
        </span>
        <ArrowRight className="text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" size={14} />
      </Link>

      <h1 className="text-4xl sm:text-5xl md:text-7xl font-normal tracking-tight max-w-6xl leading-tight px-2 z-10">
        shugo: on-chain guardrails <br className="hidden md:block" /> for ai agents
      </h1>
      
      <p className="mt-6 md:mt-8 text-zinc-500 dark:text-zinc-400 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed px-4 z-10">
        a zero-custody policy engine. enforce cryptographic velocity caps and execution bounds directly on <span className="font-semibold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">solana</span>.
      </p>

      <button 
        onClick={handleCopy}
        className="mt-8 md:mt-10 border border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] hover:bg-[#F4F4F5] dark:hover:bg-[#1A1A1A] px-4 py-2 flex items-center gap-4 text-sm transition-colors text-zinc-400 dark:text-zinc-500 group active:scale-95 z-10"
      >
        <code className="text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors">
          npx shugo init
        </code>
        {copied ? (
          <Check size={14} className="ml-4 text-green-500" />
        ) : (
          <Copy size={14} className="ml-4 group-hover:text-black dark:group-hover:text-white transition-colors" />
        )}
      </button>

      <Link href="https://docs.shugo.com" className="z-10">
        <button className="mt-8 md:mt-10 bg-[#EAEAEA] dark:bg-[#EDEDED] text-black px-6 py-2.5 font-bold hover:bg-[#D4D4D4] dark:hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm sm:text-base">
          read the docs <ArrowRight size={16} />
        </button>
      </Link>

      <p className="mt-8 md:mt-10 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 px-4 z-10">
        built on the solana foundation's official delegations program
      </p>

      <div className="mt-8 mb-8 flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm opacity-80 hover:opacity-100 transition-opacity z-10">
        <span>see shugo in action</span>
        <ChevronDown size={16} className="mt-1 text-zinc-400 dark:text-zinc-600 animate-bounce" />
      </div>

      <div className="w-full max-w-[90rem] grid grid-cols-1 xl:grid-cols-[200px_1fr_200px] gap-8 mt-1 mb-8 px-0 md:px-12 items-end z-10">

        <div className="hidden xl:flex flex-col gap-4 text-zinc-500 dark:text-zinc-600 text-sm text-left mb-16">
          <span className="font-bold text-black dark:text-white">shugo / 守護</span>
          <Link href="https://x.com" target="_blank" className="hover:text-black dark:hover:text-white hover:translate-x-1 transition-all">x (twitter)</Link>
          <span className="mt-6 text-xs">© 2026</span>
        </div>

        <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
          <div className="w-full aspect-video max-h-[600px] bg-[#FAFAFA] dark:bg-[#111111] border border-zinc-200 dark:border-[#222] rounded-lg overflow-hidden transition-colors relative flex items-center justify-center shadow-sm">
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-[10px] sm:text-xs font-bold bg-white dark:bg-black text-black dark:text-white px-2 py-1 border border-zinc-200 dark:border-[#222] rounded z-10">
              shugo_demo.mp4
            </div>
            <div className="w-12 h-12 sm:w-20 sm:h-20 bg-black dark:bg-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg group z-10">
              <div className="w-0 h-0 border-t-[8px] sm:border-t-[12px] border-t-transparent border-l-[14px] sm:border-l-[20px] border-l-white dark:border-l-black border-b-[8px] sm:border-b-[12px] border-b-transparent ml-1 sm:ml-2 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

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

      <div className="w-full flex justify-center items-center mt-12 md:mt-16 overflow-hidden pointer-events-none select-none opacity-5 dark:opacity-[0.03] z-0">
        <div className="text-[18vw] leading-none font-bold tracking-tighter text-black dark:text-white">
          <ScrambleText text="shugo" japanese="守護" hindi="शुगो" />
        </div>
      </div>

      <div className="flex xl:hidden flex-col sm:flex-row items-center justify-between gap-8 w-full border-t border-zinc-200 dark:border-[#222] pt-8 pb-12 px-4 text-sm text-zinc-500 dark:text-zinc-600 z-10 bg-[#FFFFFF] dark:bg-[#0C0C0C]">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <span className="font-bold text-black dark:text-white">shugo / 守護</span>
          <span className="text-xs">© 2026</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14F195] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14F195]"></span>
          </span>
          <span className="text-black dark:text-white font-semibold">devnet live</span>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-3">
          <Link href="https://x.com" target="_blank" className="hover:text-black dark:hover:text-white transition-colors">x (twitter)</Link>
          <Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">privacy policy</Link>
          <Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">terms of service</Link>
        </div>
      </div>

    </main>
  );
}