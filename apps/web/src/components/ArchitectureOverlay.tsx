"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  X, ZoomIn, ZoomOut, Sparkles, ChevronRight, LayoutTemplate, BookOpen
} from "lucide-react";

// Custom GitHub icon to avoid lucide-react import issues
const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface ArchitectureOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = 'architecture' | 'terms' | 'privacy';

export default function ArchitectureOverlay({ isOpen, onClose }: ArchitectureOverlayProps) {
  const [render, setRender] = useState(false);
  const [scale, setScale] = useState(1);
  const [view, setView] = useState<ViewState>('architecture');

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setScale(1);
      setView('architecture');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));

  if (!render) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#FAFAFA] dark:bg-black flex flex-col md:flex-row font-mono text-sm transition-opacity duration-300 ease-out ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onTransitionEnd={() => { if (!isOpen) setRender(false); }}
    >
      
      {/* Left Sidebar Navigation (Borderless & Unified Background) */}
      <div className="w-full md:w-[280px] lg:w-[320px] h-auto md:h-full bg-transparent flex flex-col pt-16 md:pt-24 px-8 md:px-12 pb-8 shrink-0 relative z-20">
        
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 md:left-8 p-2 bg-white dark:bg-[#111] hover:bg-zinc-100 dark:hover:bg-[#222] border border-zinc-200 dark:border-[#333] rounded-full transition-colors z-50 text-black dark:text-white shadow-sm flex items-center justify-center"
          aria-label="Close overlay"
        >
          <X size={18} />
        </button>

        <nav className="flex flex-col gap-10 mt-4">
          
          {/* Main Resources */}
          <div className="flex flex-col gap-4">
            <h3 className="text-black dark:text-white font-bold mb-2 text-base tracking-tight capitalize">Resources</h3>
            <button 
              onClick={() => setView('architecture')} 
              className={`text-left transition-colors font-medium flex items-center gap-2 ${view === 'architecture' ? 'text-[#14F195]' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
            >
               <LayoutTemplate size={16} /> Architecture
            </button>
            <Link href="https://github.com/Shugo-protocol/Shugo" target="_blank" className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 font-medium">
               <GithubIcon size={16} /> GitHub
            </Link>
            <Link href="https://docs.shugo.com" className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 font-medium">
               <BookOpen size={16} /> Documentation
            </Link>
          </div>

          {/* Legal Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-black dark:text-white font-bold mb-2 text-base tracking-tight capitalize">Legal</h3>
            <button 
              onClick={() => setView('terms')} 
              className={`text-left transition-colors font-medium ${view === 'terms' ? 'text-black dark:text-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
            >
              Terms of Service
            </button>
            <button 
              onClick={() => setView('privacy')} 
              className={`text-left transition-colors font-medium ${view === 'privacy' ? 'text-black dark:text-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
            >
              Privacy Policy
            </button>
          </div>
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 h-[60vh] md:h-full bg-transparent relative overflow-hidden z-10">
        
        {/* --- VIEW: ARCHITECTURE --- */}
        {view === 'architecture' && (
          <div className="w-full h-full flex items-center justify-center relative bg-white/50 dark:bg-[#0A0A0A]/50 rounded-tl-3xl md:border-l md:border-t border-zinc-200 dark:border-[#222]">
            <div className="w-full h-full overflow-auto flex items-center justify-center p-8">
              <div 
                className="relative w-full h-full min-h-[400px] transition-transform duration-200 ease-out origin-center"
                style={{ transform: `scale(${scale})` }}
              >
                <Image 
                  src="/architecture.svg" 
                  alt="Shugo Architecture Diagram" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-8 right-8 flex items-center gap-1 bg-white dark:bg-[#111] border border-zinc-200 dark:border-[#222] rounded-lg p-1.5 shadow-lg z-10 text-black dark:text-white">
              <button onClick={handleZoomOut} className="p-2 hover:bg-zinc-100 dark:hover:bg-[#222] rounded-md transition-colors disabled:opacity-30" disabled={scale <= 0.5}>
                <ZoomOut size={18} />
              </button>
              <span className="text-xs px-3 min-w-[60px] text-center font-bold">
                {Math.round(scale * 100)}%
              </span>
              <button onClick={handleZoomIn} className="p-2 hover:bg-zinc-100 dark:hover:bg-[#222] rounded-md transition-colors disabled:opacity-30" disabled={scale >= 3}>
                <ZoomIn size={18} />
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW: LEGAL (Terms / Privacy) --- */}
        {(view === 'terms' || view === 'privacy') && (
          <div className="w-full h-full overflow-y-auto p-8 md:p-16 lg:p-24 animate-in fade-in duration-500">
            <div className="max-w-3xl">
              <span className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 block font-sans">Sep 28, 2026</span>
              <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-6 tracking-tight capitalize font-sans">
                {view === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              
              <p className="text-base text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed font-sans">
                {view === 'terms' 
                  ? "The terms that govern your use of Shugo, covering your licence, zero-custody delegation mechanics, acceptable conduct, and the rules for the public smart contract interactions." 
                  : "How Shugo handles your data. As a zero-custody protocol, we inherently minimize data collection, but here is exactly what we do and do not track when you interact with our CLI and Web interfaces."}
              </p>

              {/* Ask AI to explain box (Matched to Reference Image) */}
              <div className="p-6 border border-zinc-200 dark:border-[#222] rounded-2xl bg-zinc-50 dark:bg-[#111] mb-12 shadow-sm">
                <h3 className="text-black dark:text-white font-semibold mb-2 flex items-center gap-2 font-sans text-base">
                  Ask AI to explain
                </h3>
                <p className="text-sm text-zinc-500 mb-6 font-sans">Get a quick, plain-language summary of this page without all the jargon.</p>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-white dark:bg-[#1F1F1F] border border-zinc-200 dark:border-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2A2A2A] transition-colors text-sm px-4 py-2.5 rounded-full flex items-center gap-2 font-medium font-sans">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><Sparkles size={12} className="text-emerald-500"/></span> 
                    ChatGPT <ChevronRight size={14} className="text-zinc-500 ml-1"/>
                  </button>
                  <button className="bg-white dark:bg-[#1F1F1F] border border-zinc-200 dark:border-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2A2A2A] transition-colors text-sm px-4 py-2.5 rounded-full flex items-center gap-2 font-medium font-sans">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center"><Sparkles size={12} className="text-orange-500"/></span> 
                    Claude <ChevronRight size={14} className="text-zinc-500 ml-1"/>
                  </button>
                  <button className="bg-white dark:bg-[#1F1F1F] border border-zinc-200 dark:border-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2A2A2A] transition-colors text-sm px-4 py-2.5 rounded-full flex items-center gap-2 font-medium font-sans">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center"><Sparkles size={12} className="text-blue-500"/></span> 
                    Gemini <ChevronRight size={14} className="text-zinc-500 ml-1"/>
                  </button>
                  <button className="bg-white dark:bg-[#1F1F1F] border border-zinc-200 dark:border-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2A2A2A] transition-colors text-sm px-4 py-2.5 rounded-full flex items-center gap-2 font-medium font-sans">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center"><Sparkles size={12} className="text-cyan-500"/></span> 
                    Perplexity <ChevronRight size={14} className="text-zinc-500 ml-1"/>
                  </button>
                </div>
              </div>

              <div className="text-base text-zinc-600 dark:text-zinc-400 space-y-6 pb-24 font-sans">
                 <h3 className="text-black dark:text-white font-bold text-xl capitalize mb-4">Introduction, Scope & Acceptance</h3>
                 <p className="leading-relaxed">
                   These {view === 'terms' ? 'Terms of Service' : 'Privacy Policies'} govern your access to and use of Shugo, including its CLI application, companion website, APIs, and any related software features or smart contracts (collectively, the "Service").
                 </p>
                 <p className="leading-relaxed">
                   By installing the CLI, or otherwise using the Service, you confirm that you have read, understood, and agree to be bound by these terms. If you do not agree with these terms, you must not use the Service.
                 </p>
                 <p className="leading-relaxed">
                   If you accept these terms on behalf of an organization, you represent and warrant that you have the authority to bind that organization; in such case, "you" and "your" refer to that organization.
                 </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}