"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Copy, Check, ChevronDown, MessageSquare } from "lucide-react";
import ScrambleText from "@/components/ScrambleText";
import ArchitectureOverlay from "@/components/ArchitectureOverlay";

function Reveal({ 
  children, 
  delay = "delay-0", 
  className = "" 
}: { 
  children: React.ReactNode, 
  delay?: string,
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Disconnect immediately after revealing to save memory
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out will-change-[opacity,transform,filter] ${
        isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-8 blur-md"
      } ${delay} ${className}`}
    >
      {children}
    </div>
  );
}

function IncomingMessage({ onOpenArch }: { onOpenArch: () => void }) {
  const [stage, setStage] = useState<'hidden' | 'falling' | 'expanded'>('hidden');

  useEffect(() => {
    // Audio is strictly separated from rendering to prevent main-thread locking
    const playSound = (type: 'impact' | 'open') => {
      requestAnimationFrame(() => {
        try {
          if (type === 'impact') {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const now = ctx.currentTime;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.6, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
          } else if (type === 'open') {
            const audio = new Audio('/sound.mp3');
            audio.volume = 0.6;
            audio.play().catch(() => {});
          }
        } catch (e) {
          // Silent catch for autoplay restrictions
        }
      });
    };

    const t1 = setTimeout(() => setStage('falling'), 150);
    const t2 = setTimeout(() => playSound('impact'), 150 + 1125); 
    const t3 = setTimeout(() => {
      setStage('expanded');
      playSound('open');
    }, 150 + 2500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dropImpactBounce {
          0% {
            transform: translate(-30vw, -70vh) rotate(-720deg) scale(0.4);
            opacity: 0;
            animation-timing-function: cubic-bezier(0.42, 0, 1, 1); 
          }
          45% {
            transform: translate(-25px, 60px) rotate(-25deg) scale3d(1.3, 0.6, 1);
            opacity: 1;
            animation-timing-function: cubic-bezier(0.21, 0.85, 0.33, 1);
          }
          75% {
            transform: translate(5px, -15px) rotate(10deg) scale3d(0.95, 1.05, 1);
            animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
          }
          100% {
            transform: translate(0, 0) rotate(0deg) scale3d(1, 1, 1);
            opacity: 1;
          }
        }
        .animate-fly-bounce { animation: dropImpactBounce 2.5s forwards; }
      `}} />

      <button 
        onClick={onOpenArch}
        className={`relative border border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] hover:bg-[#F4F4F5] dark:hover:bg-[#1A1A1A] flex items-center rounded-full h-9 group overflow-hidden z-20 origin-center shadow-sm will-change-[max-width,opacity,transform]
          ${stage === 'hidden' ? 'opacity-0' : ''}
          ${stage === 'falling' ? 'animate-fly-bounce max-w-[36px]' : ''}
          ${stage === 'expanded' ? 'opacity-100 max-w-[500px] px-2 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]' : ''}
        `}
      >
        <div className="flex items-center justify-center w-8 h-8 shrink-0 relative ml-0.5">
          <MessageSquare size={14} className="text-[#14F195]" />
          <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#14F195] rounded-full transition-opacity duration-300 ${stage === 'falling' ? "opacity-100 animate-pulse" : "opacity-0"}`} />
        </div>
        
        <div className={`whitespace-nowrap flex items-center gap-2 overflow-hidden transition-all duration-700 ease-out ${
          stage === 'expanded' ? "opacity-100 translate-x-0 ml-1" : "opacity-0 -translate-x-4 w-0 pointer-events-none ml-0"
        }`}>
          <span className="text-zinc-600 dark:text-[#A1A1AA] text-xs sm:text-sm truncate">
            delegate cpi execution authority, never private keys.
          </span>
          <ArrowRight className="text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 mr-2" size={14} />
        </div>
      </button>
    </>
  );
}

function HeroBackgroundRay() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 flex items-center justify-center">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gentleRayReveal {
          0% { opacity: 0; transform: translateX(-10vw) scale(0.95); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-ray-flow {
          animation: gentleRayReveal 2s cubic-bezier(0.22, 1, 0.36, 1) forwards,
                     pulseGlow 8s ease-in-out infinite alternate;
        }
      `}} />
      
      {/* Hardware-accelerated CSS gradient replaces the heavy SVG feTurbulence */}
      <div className="w-[140vw] h-[100vh] absolute top-0 -left-[20vw] opacity-0 animate-ray-flow mix-blend-screen dark:mix-blend-lighten blur-3xl will-change-[opacity,transform]">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_#14F195_0%,_transparent_50%)] opacity-20 dark:opacity-[0.15]" />
      </div>
    </div>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

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
    <>
      <ArchitectureOverlay isOpen={isArchOpen} onClose={() => setIsArchOpen(false)} />

      <main className="min-h-[calc(100vh-56px)] flex flex-col items-center pt-28 md:pt-36 px-4 sm:px-6 text-center lowercase bg-[#FFFFFF] dark:bg-[#0C0C0C] text-black dark:text-white transition-colors font-mono overflow-x-hidden relative z-0">
        
        <HeroBackgroundRay />

        <div className="h-9 mb-7 flex justify-center w-full z-20">
          <IncomingMessage onOpenArch={() => setIsArchOpen(true)} />
        </div>

        <Reveal delay="delay-[100ms]" className="z-10">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-normal tracking-tight max-w-6xl leading-tight px-2">
            shugo: on-chain guardrails <br className="hidden md:block" /> for ai agents
          </h1>
        </Reveal>
        
        <Reveal delay="delay-[200ms]" className="z-10">
          <p className="mt-6 md:mt-8 text-zinc-500 dark:text-zinc-400 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed px-4 mx-auto">
            a zero-custody policy engine. enforce cryptographic velocity caps and execution bounds directly on <span className="font-semibold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">solana</span>.
          </p>
        </Reveal>

        <Reveal delay="delay-[300ms]" className="z-10 flex flex-col sm:flex-row items-center gap-4 mt-8 md:mt-10">
          <button 
            onClick={handleCopy}
            className="border border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] hover:bg-[#F4F4F5] dark:hover:bg-[#1A1A1A] px-4 py-2 flex items-center gap-4 text-sm transition-colors text-zinc-400 dark:text-zinc-500 group active:scale-95"
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

          <Link href="https://docs.shugo.com">
            <button className="bg-[#EAEAEA] dark:bg-[#EDEDED] text-black px-6 py-2.5 font-bold hover:bg-[#D4D4D4] dark:hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm sm:text-base">
              read the docs <ArrowRight size={16} />
            </button>
          </Link>
        </Reveal>

        <Reveal delay="delay-[400ms]" className="z-10">
          <p className="mt-8 md:mt-10 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 px-4">
            built on the solana foundation's official delegations program
          </p>
        </Reveal>

        <Reveal delay="delay-[500ms]" className="z-10 mt-8 mb-6 xl:mb-8">
          <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
            <span>see shugo in action</span>
            <ChevronDown size={16} className="mt-1 text-zinc-400 dark:text-zinc-600 animate-bounce" />
          </div>
        </Reveal>

        <Reveal className="w-full z-10">
          <div className="w-full max-w-[90rem] grid grid-cols-1 xl:grid-cols-[200px_1fr_200px] gap-8 mt-1 mb-8 px-0 md:px-12 items-end mx-auto">
            <div className="hidden xl:flex flex-col gap-4 text-zinc-500 dark:text-zinc-600 text-sm text-left mb-16">
              <span className="font-bold text-black dark:text-white">shugo / 守護</span>
              <Link href="https://x.com" target="_blank" className="hover:text-black dark:hover:text-white hover:translate-x-1 transition-all">x (twitter)</Link>
              <span className="mt-6 text-xs">© 2026</span>
            </div>

            <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
              <div className="w-full aspect-video max-h-[600px] bg-[#FAFAFA] dark:bg-[#111111] border border-zinc-200 dark:border-[#222] rounded-lg overflow-hidden transition-colors relative flex items-center justify-center shadow-2xl">
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-[10px] sm:text-xs font-bold bg-white dark:bg-black text-black dark:text-white px-2 py-1 border border-zinc-200 dark:border-[#222] rounded z-10 shadow-sm">
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
              <button onClick={() => setIsArchOpen(true)} className="hover:text-black dark:hover:text-white transition-colors">privacy policy</button>
              <button onClick={() => setIsArchOpen(true)} className="hover:text-black dark:hover:text-white transition-colors">terms of service</button>
            </div>
          </div>
        </Reveal>

        <div className="w-full flex justify-center items-center mt-12 md:mt-16 overflow-hidden pointer-events-none select-none opacity-5 dark:opacity-[0.03] z-0">
          <div className="text-[18vw] leading-none font-bold tracking-tighter text-black dark:text-white">
            <ScrambleText text="shugo" japanese="守護" hindi="शुगो" />
          </div>
        </div>

        <Reveal className="w-full z-10 mt-12">
          <div className="flex xl:hidden flex-col sm:flex-row items-center justify-between gap-8 w-full border-t border-zinc-200 dark:border-[#222] pt-8 pb-12 px-4 text-sm text-zinc-500 dark:text-zinc-600 bg-[#FFFFFF] dark:bg-[#0C0C0C]">
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
             <button onClick={() => setIsArchOpen(true)} className="hover:text-black dark:hover:text-white transition-colors">privacy policy</button>
              <button onClick={() => setIsArchOpen(true)} className="hover:text-black dark:hover:text-white transition-colors">terms of service</button>
            </div>
          </div>
        </Reveal>
      </main>
    </>
  );
}