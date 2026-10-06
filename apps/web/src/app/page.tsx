"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Copy, 
  Check, 
  ChevronDown, 
  MessageSquare,
  BookOpen,
  Lock,
  TerminalSquare
} from "lucide-react";
import ScrambleText from "@/components/ScrambleText";
// import ArchitectureOverlay from "@/components/ArchitectureOverlay";
import Footer from "@/components/Footer";

// Framework Icon SVG components (npm and pnpm)
function NpmLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h256v256H0z" fill="#CB3837" />
      <path d="M48 48h160v160H48z" fill="#FFF" />
      <path d="M72 72h32v96H88v-16H72V72zm48 0h48v80h-16v16h-16V72h-16zm64 0h32v80h-16v16h-16V72z" fill="#CB3837" />
    </svg>
  );
}

function PnpmLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h7.5v7.5H0zm8.25 0h7.5v7.5H8.25zM16.5 0H24v7.5h-7.5zm-16.5 8.25h7.5v7.5H0zm8.25 0h7.5v7.5H8.25zm8.25 0H24v7.5h-7.5zM0 16.5h7.5V24H0zm8.25 0h7.5V24H8.25z"/>
    </svg>
  );
}

// Complex, Wide Japanese Fortress (Tenshu + Flanking Turret + Wall)
function JapaneseFortressIllustration({ className = "" }: { className?: string }) {
  return (
    <svg 
      className={`text-zinc-300 dark:text-zinc-700 ${className}`} 
      viewBox="0 0 800 400" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMaxYMax meet"
    >
      <path d="M 20 380 L 780 380" strokeWidth="2" />

      {/* --- Flanking Left Watchtower (Yagura) --- */}
      <path d="M 80 380 Q 110 350 120 280 L 220 280 Q 230 350 260 380 Z" strokeWidth="2" />
      <path d="M 120 280 L 100 380 M 150 280 L 140 380 M 180 280 L 180 380 M 210 280 L 220 380" strokeWidth="1" strokeDasharray="2,3" />
      <rect x="130" y="240" width="80" height="40" />
      <path d="M 100 250 Q 170 235 240 250 L 220 220 L 120 220 Z" />
      <rect x="145" y="250" width="15" height="15" />
      <rect x="180" y="250" width="15" height="15" />
      <rect x="140" y="190" width="60" height="30" />
      <path d="M 110 200 Q 170 180 230 200 L 210 160 L 130 160 Z" />
      <path d="M 150 170 L 170 150 L 190 170" />

      {/* --- Connecting Defensive Wall (Watari-yagura) --- */}
      <path d="M 220 320 L 450 320 L 480 380 L 260 380" strokeWidth="1.5" />
      <rect x="235" y="270" width="230" height="50" />
      <path d="M 220 280 Q 350 265 480 280 L 480 270 L 220 270 Z" />
      <circle cx="260" cy="295" r="3" fill="currentColor" />
      <circle cx="300" cy="295" r="3" fill="currentColor" />
      <circle cx="340" cy="295" r="3" fill="currentColor" />
      <circle cx="380" cy="295" r="3" fill="currentColor" />
      <circle cx="420" cy="295" r="3" fill="currentColor" />

      {/* --- Main Central Keep (Tenshu) --- */}
      <path d="M 430 380 Q 480 330 500 240 L 700 240 Q 720 330 770 380 Z" strokeWidth="2" />
      <path d="M 500 240 L 470 380 M 540 240 L 520 380 M 580 240 L 570 380 M 620 240 L 620 380 M 660 240 L 670 380 M 700 240 L 730 380" strokeWidth="1" strokeDasharray="3,4" />
      
      <rect x="515" y="190" width="170" height="50" />
      <path d="M 460 210 Q 600 180 740 210 L 700 160 L 500 160 Z" />
      <rect x="540" y="200" width="20" height="25" />
      <rect x="590" y="200" width="20" height="25" />
      <rect x="640" y="200" width="20" height="25" />

      <rect x="535" y="130" width="130" height="30" />
      <path d="M 480 150 Q 600 120 720 150 L 680 100 L 520 100 Z" />
      <path d="M 560 140 Q 600 100 640 140" strokeWidth="1.5" />
      <path d="M 570 105 L 600 80 L 630 105" />

      <rect x="555" y="70" width="90" height="30" />
      <path d="M 510 90 Q 600 60 690 90 L 660 40 L 540 40 Z" />
      <rect x="585" y="80" width="30" height="15" />

      <rect x="575" y="10" width="50" height="30" />
      <path d="M 530 30 Q 600 5 670 30 L 640 -10 L 560 -10 Z" />
      <path d="M 585 10 L 600 -5 L 615 10" />
      <path d="M 560 -10 C 550 -25, 570 -30, 565 -45" strokeWidth="2" />
      <path d="M 640 -10 C 650 -25, 630 -30, 635 -45" strokeWidth="2" />
    </svg>
  );
}

function Reveal({ children, delay = "delay-0", className = "" }: { children: React.ReactNode, delay?: string, className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out will-change-[opacity,transform] ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-8 blur-md"} ${delay} ${className}`}>
      {children}
    </div>
  );
}

// Silent, smooth Cryptographic Decryption Entrance Badge
function SecureBootBadge({ onOpenArch }: { onOpenArch: () => void }) {
  const [stage, setStage] = useState<'hidden' | 'booting' | 'expanding' | 'decrypting' | 'resolved'>('hidden');
  const [displayText, setDisplayText] = useState("");
  const targetText = "delegate cpi execution authority, never private keys.";
  const cipherChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~";

  useEffect(() => {
    // Clean, silent animation timeline sequence
    const t1 = setTimeout(() => setStage('booting'), 300);
    const t2 = setTimeout(() => setStage('expanding'), 1000);
    const t3 = setTimeout(() => setStage('decrypting'), 1400);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Scramble Text Effect during 'decrypting' phase
  useEffect(() => {
    if (stage === 'decrypting') {
      let iteration = 0;
      const interval = setInterval(() => {
        setDisplayText(
          targetText.split("").map((letter, index) => {
            if (index < iteration) {
              return targetText[index];
            }
            return cipherChars[Math.floor(Math.random() * cipherChars.length)];
          }).join("")
        );

        if (iteration >= targetText.length) {
          clearInterval(interval);
          setStage('resolved');
        }
        iteration += 1.2; // Decryption speed
      }, 30);
      return () => clearInterval(interval);
    }
  }, [stage]);

  return (
    <button 
      onClick={onOpenArch}
      className={`relative border flex items-center rounded-full h-9 group z-20 origin-center shadow-sm overflow-hidden will-change-[width,opacity] transition-all
        ${stage === 'hidden' ? 'opacity-0 scale-95 w-9 border-transparent bg-transparent' : ''}
        ${stage === 'booting' ? 'opacity-100 scale-100 w-9 border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] duration-500' : ''}
        ${stage === 'expanding' ? 'opacity-100 scale-100 w-[420px] sm:w-[480px] border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]' : ''}
        ${(stage === 'decrypting' || stage === 'resolved') ? 'opacity-100 scale-100 w-[420px] sm:w-[480px] border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] hover:bg-[#F4F4F5] dark:hover:bg-[#1A1A1A] duration-300' : ''}
      `}
    >
      <div className="flex items-center justify-center w-8 h-8 shrink-0 relative ml-0.5">
        {stage === 'booting' || stage === 'expanding' ? (
           <TerminalSquare size={14} className="text-[#14F195] animate-pulse" />
        ) : (
           <MessageSquare size={14} className="text-[#14F195]" />
        )}
        
        <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#14F195] rounded-full transition-opacity duration-300 ${stage === 'booting' ? "opacity-100 animate-pulse" : "opacity-0"}`} />
      </div>

      <div className={`whitespace-nowrap flex items-center overflow-hidden transition-opacity duration-300 ${
        (stage === 'decrypting' || stage === 'resolved') ? "opacity-100 ml-1 flex-1" : "opacity-0 w-0 pointer-events-none ml-0"
      }`}>
        <span className={`text-xs sm:text-sm truncate w-full text-left font-mono transition-colors duration-300 ${
          stage === 'decrypting' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-600 dark:text-[#A1A1AA]'
        }`}>
          {stage === 'resolved' ? targetText : displayText}
        </span>
      </div>

      <div className={`flex items-center justify-end shrink-0 transition-all duration-500 ${stage === 'resolved' ? 'w-6 opacity-100 mr-2' : 'w-0 opacity-0'}`}>
        <ArrowRight className="text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all" size={14} />
      </div>
    </button>
  );
}

function HeroBackgroundRay() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 flex items-center justify-center">
      <div className="w-full h-full absolute top-0 left-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-[140vw] h-full opacity-40 dark:opacity-20 -ml-[20vw] blur-3xl mix-blend-screen dark:mix-blend-lighten">
          <defs>
            <linearGradient id="rayGradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#14F195" stopOpacity="0.0" />
              <stop offset="30%" stopColor="#14F195" stopOpacity="0.15" />
              <stop offset="60%" stopColor="#14F195" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#14F195" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <polygon points="0,48 100,10 100,90 0,52" fill="url(#rayGradient)" />
        </svg>
      </div>
    </div>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [lockVibrating, setLockVibrating] = useState(false);

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

  const handleLockClick = () => {
    setLockVibrating(true);
    setTimeout(() => setLockVibrating(false), 300);
  };

  return (
    <>
      
      <style dangerouslySetInnerHTML={{__html: `
        /* Vibration Animation for the Locked Button */
        @keyframes lockVibrate {
          0% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        .animate-lock-vibrate { animation: lockVibrate 0.3s ease-in-out; }
      `}} />

      <main className="min-h-[calc(100vh-56px)] flex flex-col items-center pt-28 md:pt-36 px-4 sm:px-6 text-center lowercase bg-[#FFFFFF] dark:bg-[#0C0C0C] text-black dark:text-white transition-colors font-mono overflow-x-hidden relative z-0">
        
        <HeroBackgroundRay />

        {/* --- Foreground Japanese Fortress (Repositioned to the right center) --- */}
        <div className="hidden lg:flex absolute right-[-5%] top-[25%] w-[55vw] max-w-[850px] pointer-events-none -z-10 opacity-30 dark:opacity-20 justify-end">
          <JapaneseFortressIllustration className="w-full h-auto drop-shadow-sm" />
        </div>

        {/* Notification Badge - Centered */}
        <div className="h-9 mb-7 flex justify-center w-full z-20">
          <SecureBootBadge onOpenArch={() => setIsArchOpen(true)} />
        </div>

        {/* Hero Text - Centered */}
        <Reveal delay="delay-[100ms]" className="z-10">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-normal tracking-tight max-w-6xl leading-tight px-2">
            shugo: on-chain guardrails <br className="hidden md:block" /> for ai agents
          </h1>
        </Reveal>
        
        {/* Subtitle - Centered */}
        <Reveal delay="delay-[200ms]" className="z-10">
          <p className="mt-6 md:mt-8 text-zinc-500 dark:text-zinc-400 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed px-4 mx-auto">
            a zero-custody policy engine. enforce cryptographic velocity caps and execution bounds directly on <span className="font-semibold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">solana</span>.
          </p>
        </Reveal>

        {/* --- Stacked Package Manager & Docs Button --- */}
        <Reveal delay="delay-[300ms]" className="z-10 w-full mt-10 md:mt-12 flex justify-center">
          <div className="flex flex-col items-start w-full max-w-2xl">
            
            {/* 1. Tabs aligned above input (ROUNDED CORNERS) */}
            <div className="flex items-center gap-1.5 mb-2 relative">
              <button 
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium transition-all rounded-md bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white shadow-sm border border-zinc-300 dark:border-zinc-700 cursor-default"
              >
                <NpmLogo /> npm
              </button>
              
              {/* Fully Locked pnpm tab - clicking ANYWHERE on it triggers the vibration */}
              <button 
                onClick={handleLockClick}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium transition-all rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent cursor-pointer ${lockVibrating ? 'animate-lock-vibrate' : ''}`}
              >
                <span className="absolute -top-2 -right-2 text-red-500 z-10 transition-transform">
                  <Lock size={12} strokeWidth={3} />
                </span>
                <PnpmLogo /> pnpm
              </button>
            </div>

            {/* 2. Side-by-side Command Input and Docs Button (ROUNDED CORNERS) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              
              {/* Command Input Box */}
              <div className="flex items-center justify-between border border-zinc-300 dark:border-zinc-700 bg-[#FAFAFA] dark:bg-[#111111] px-4 py-3 flex-1 w-full h-[50px] shadow-sm rounded-lg">
                <div className="flex items-center gap-3 font-mono text-sm sm:text-base text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-400 select-none">$</span>
                  <code>npx shugo init</code>
                </div>
                <button onClick={handleCopy} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors p-1">
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
              </div>

              {/* Read the Docs Button - Background Logo Sized Down to Prevent Cutting */}
              <Link href="https://docs.shugo.com" className="w-full sm:w-auto h-[50px]">
                <button className="relative w-full sm:w-auto bg-[#EAEAEA] dark:bg-[#EDEDED] text-black px-6 font-bold hover:bg-[#D4D4D4] dark:hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base h-full whitespace-nowrap rounded-lg group overflow-hidden z-0 border border-transparent">
                  
                  {/* Background Icon - Fits Perfectly within the button now */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-10 scale-75 group-hover:scale-100 transition-all duration-300 ease-out z-[-1]">
                    <BookOpen size={44} className="text-black" />
                  </div>
                  
                  read the docs
                  
                  <ArrowRight 
                    size={16} 
                    className="text-zinc-700 transition-transform duration-300 transform group-hover:translate-x-1.5" 
                  />
                </button>
              </Link>
            </div>

          </div>
        </Reveal>

        {/* --- Bottom Text & Video Container --- */}
        <Reveal delay="delay-[400ms]" className="z-10 mt-12 md:mt-16 w-full flex justify-center">
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 text-center px-4">
            built on the solana foundation's official delegations program
          </p>
        </Reveal>

        <Reveal delay="delay-[500ms]" className="z-10 mt-8 mb-6 xl:mb-8 flex justify-center w-full">
          <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
            <span>see shugo in action</span>
            <ChevronDown size={16} className="mt-1 text-zinc-400 dark:text-zinc-600 animate-bounce" />
          </div>
        </Reveal>
        
        <Reveal className="w-full z-10 mb-24">
          <div className="w-full max-w-[90rem] px-4 md:px-12 mx-auto">
            <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
              <div className="w-full aspect-video max-h-[600px] bg-[#FAFAFA] dark:bg-[#111111] border border-zinc-200 dark:border-[#222] rounded-lg overflow-hidden transition-colors relative flex items-center justify-center shadow-2xl">
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-[10px] sm:text-xs font-bold bg-white dark:bg-black text-black dark:text-white px-2 py-1 border border-zinc-200 dark:border-[#222] rounded-md z-10 shadow-sm">
                  shugo_demo.mp4
                </div>
                <div className="w-12 h-12 sm:w-20 sm:h-20 bg-black dark:bg-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg group z-10">
                  <div className="w-0 h-0 border-t-[8px] sm:border-t-[12px] border-t-transparent border-l-[14px] sm:border-l-[20px] border-l-white dark:border-l-black border-b-[8px] sm:border-b-[12px] border-b-transparent ml-1 sm:ml-2 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </main>
      <Footer/>
    </>
  );
}