"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { MapPin, ArrowUpRight, FileText, ShieldCheck, X, Sun, Moon } from "lucide-react";

export default function Footer() {
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check initial theme on mount
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Mock content for the modals
  const modalContent = {
    terms: {
      title: "Terms of Service",
      body: (
        <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
          <p>Last updated: October 2026</p>
          <h3 className="text-black dark:text-white font-semibold text-base mt-6">1. Acceptance of Terms</h3>
          <p>By accessing and using Shugo Protocol, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          <h3 className="text-black dark:text-white font-semibold text-base mt-4">2. Use License</h3>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on Shugo Protocol's website for personal, non-commercial transitory viewing only.</p>
          <h3 className="text-black dark:text-white font-semibold text-base mt-4">3. Disclaimer</h3>
          <p>The materials on Shugo Protocol's website are provided on an 'as is' basis. Shugo Protocol makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability.</p>
        </div>
      ),
    },
    privacy: {
      title: "Privacy Policy",
      body: (
        <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
          <p>Last updated: October 2026</p>
          <h3 className="text-black dark:text-white font-semibold text-base mt-6">1. Information We Collect</h3>
          <p>We only collect information about you if we have a reason to do so—for example, to provide our Services, to communicate with you, or to make our Services better.</p>
          <h3 className="text-black dark:text-white font-semibold text-base mt-4">2. How We Use Information</h3>
          <p>We use the information we collect to provide, maintain, and improve our services, as well as to develop new ones. We also use this information to offer you tailored content.</p>
          <h3 className="text-black dark:text-white font-semibold text-base mt-4">3. Security</h3>
          <p>While no online service is 100% secure, we work very hard to protect information about you against unauthorized access, use, alteration, or destruction, and take reasonable measures to do so.</p>
        </div>
      ),
    }
  };

  return (
    <footer className="relative w-full bg-[#FFFFFF] dark:bg-[#0C0C0C] text-black dark:text-white pt-16 md:pt-20 pb-8 px-4 sm:px-6 md:px-12 font-mono lowercase">
      
      {/* Top Row: GitHub Profile Card + Navigation Links */}
      <div className="max-w-[90rem] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 mb-20 md:mb-28 z-10 relative">
        
        {/* Left Section: Help us improve + Inline GitHub Card */}
        <div className="w-full lg:max-w-md shrink-0">
          <h3 className="text-xl sm:text-2xl lg:text-3xl text-zinc-500 dark:text-zinc-400 mb-6 font-sans leading-tight normal-case">
            help us to improve.
          </h3>
          
          {/* GitHub Organization Card placed directly in layout */}
          <Link
            href="https://github.com/Shugo-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-full max-w-[380px] bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] transition-all duration-200 hover:-translate-y-0.5 normal-case"
          >
            <div className="flex gap-4 items-start">
              {/* Avatar Box */}
              <div className="w-14 h-14 shrink-0 bg-[#F6F8FA] border border-zinc-200 rounded-xl flex items-center justify-center font-bold text-black text-sm tracking-tight shadow-inner font-sans">
                Shugo
              </div>
              
              {/* Profile Details */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[17px] font-bold text-zinc-900 leading-snug group-hover:text-black transition-colors font-sans">
                    Shugo
                  </h4>
                  <ArrowUpRight size={16} className="text-zinc-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                
                <p className="text-[13px] text-zinc-600 mt-1 leading-snug font-sans">
                  shugo: on-chain guardrails for ai agents on solana
                </p>
                
                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 mt-3.5 text-[12px] text-zinc-500 font-sans">
                  
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-zinc-400" />
                    <span>India</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-500">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>@ShugoProtocol</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Links Grid: Developers, Resources, Socials */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 lg:ml-auto normal-case max-w-2xl">
          <div className="flex flex-col gap-3 md:gap-4">
            <h4 className="text-zinc-400 dark:text-zinc-500 mb-1 font-medium text-xs uppercase tracking-wider">Developers</h4>
            <Link href="https://docs.shugo.com" className="hover:text-black dark:hover:text-white transition-colors text-sm text-zinc-600 dark:text-zinc-400">Documentation</Link>
            <Link href="https://github.com/Shugo-protocol" target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors text-sm text-zinc-600 dark:text-zinc-400">GitHub</Link>
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors text-sm text-zinc-600 dark:text-zinc-400">NPM Registry</Link>
          </div>
          
          <div className="flex flex-col gap-3 md:gap-4">
            <h4 className="text-zinc-400 dark:text-zinc-500 mb-1 font-medium text-xs uppercase tracking-wider">Resources</h4>
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors text-sm text-zinc-600 dark:text-zinc-400">Security Audits</Link>
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors text-sm text-zinc-600 dark:text-zinc-400">Network Status</Link>
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors text-sm text-zinc-600 dark:text-zinc-400">Blog</Link>
          </div>
          
          <div className="flex flex-col gap-3 md:gap-4">
            <h4 className="text-zinc-400 dark:text-zinc-500 mb-1 font-medium text-xs uppercase tracking-wider">Socials</h4>
            <Link 
              href="https://x.com/ShugoProtocol" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-black dark:hover:text-white transition-colors text-sm text-zinc-600 dark:text-zinc-400"
            >
              X (Twitter)
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Legal + Actions */}
      <div className="max-w-[90rem] mx-auto flex flex-col-reverse lg:flex-row justify-between items-center gap-6 z-10 relative normal-case">
        
        {/* Legal Links */}
        <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          <span>© Shugo Inc. 2026</span>
          
          {/* Terms of Service Button with Icon */}
          <button 
            onClick={() => setActiveModal('terms')}
            className="flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors"
          >
            <FileText size={14} className="opacity-70" />
            <span>Terms of service</span>
          </button>
          
          {/* Privacy Policy Button with Icon */}
          <button 
            onClick={() => setActiveModal('privacy')}
            className="flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors"
          >
            <ShieldCheck size={14} className="opacity-70" />
            <span>Privacy policy</span>
          </button>
        </div>
        
        {/* Actions Group: Theme + Scroll to Top */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-center">
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="p-2 sm:px-3 sm:py-2 rounded-full border border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] hover:bg-zinc-100 dark:hover:bg-[#1A1A1A] transition-colors text-xs sm:text-sm flex items-center gap-2 text-zinc-600 dark:text-zinc-400 group"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Scroll To Top */}
          <button 
            onClick={scrollToTop}
            className="px-4 py-2 rounded-full border border-zinc-200 dark:border-[#222] bg-[#FAFAFA] dark:bg-[#111111] hover:bg-zinc-100 dark:hover:bg-[#1A1A1A] transition-colors text-xs sm:text-sm flex items-center gap-2 text-zinc-600 dark:text-zinc-400 group flex-1 lg:flex-none justify-center"
          >
            Go all the way up 
            <span className="group-hover:-translate-y-0.5 transition-transform">↑</span>
          </button>
        </div>

      </div>

      {/* Background Japanese Watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute bottom-0 right-0 text-[32vw] md:text-[20vw] lg:text-[16vw] leading-[0.75] font-bold tracking-tighter text-black dark:text-white opacity-[0.035] dark:opacity-[0.025] translate-y-[15%] translate-x-[4%] whitespace-nowrap">
          守護
        </div>
      </div>
      
      {/* Centered Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm normal-case font-sans">
          {/* Overlay background click to close */}
          <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
          
          {/* Modal Content Box */}
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#222] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-[#222]">
              <h2 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                {activeModal === 'terms' ? <FileText size={18} /> : <ShieldCheck size={18} />}
                {modalContent[activeModal].title}
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#222] rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto overscroll-contain">
              {modalContent[activeModal].body}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-[#222] flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black font-medium text-sm rounded-xl hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}