"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, Menu, X, HelpCircle } from "lucide-react";
import ScrambleText from "./ScrambleText";
import { ThemeToggle } from "./ThemeToggle";

// todo : put the correct links 
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

interface MenuOption {
  title: string;
  desc: string;
  href: string;
  external?: boolean;
}

const DOCS_ITEMS: MenuOption[] = [
  { title: "introduction", desc: "zero-custody delegation protocol overview", href: "https://docs.shugo.com/introduction", external: true },
  { title: "quickstart", desc: "deploy your first guardrail in under 5 minutes", href: "https://docs.shugo.com/quickstart", external: true },
  { title: "zero-custody", desc: "solana subscriptions & allowances cpi mechanics", href: "https://docs.shugo.com/zero-custody", external: true },
  { title: "velocity caps", desc: "epoch-based mathematical spend bounding", href: "https://docs.shugo.com/velocity-caps", external: true },
];

const CLI_ITEMS: MenuOption[] = [
  { title: "shugo init", desc: "scaffold local agent policy workspaces", href: "https://docs.shugo.com/quickstart", external: true },
  { title: "shugo delegate", desc: "sign and broadcast on-chain allowance policy", href: "https://docs.shugo.com/quickstart", external: true },
  { title: "shugo inspect", desc: "stream real-time spend accumulators and epochs", href: "https://docs.shugo.com/quickstart", external: true },
  { title: "shugo revoke", desc: "instant emergency key revocation via single instruction", href: "https://docs.shugo.com/quickstart", external: true },
];

const PROOFS_ITEMS: MenuOption[] = [
  { title: "kani model checker", desc: "bounded verification runs eliminating panics & overflows", href: "/proofs#kani" },
  { title: "velocity invariants", desc: "formal mathematical proof against balance exhaustion", href: "/proofs#velocity" },
  { title: "revocation soundness", desc: "proof that revoked agent keys cannot sign or proxy cpis", href: "/proofs#revocation" },
  { title: "verification logs", desc: "reproducible artifacts, harnesses, and test traces", href: "/proofs#logs" },
];

const FAQ_DATA = [
  { q: "if the agent hallucinates, is the treasury drained?", a: "no. the agent does not possess the treasury's private keys. it only possesses execution authority bounded by shugo's on-chain cpi proxy. if an agent attempts to exceed its epoch cap or call a non-allowlisted program, the anchor program rejects the transaction." },
  { q: "why not just use a squads multisig?", a: "multisigs require synchronous human signatures for every transaction, defeating the purpose of an autonomous agent. shugo is a delegation engine: humans sign once to establish cryptographic bounds, and the agent executes autonomously within them." },
  { q: "how do you guarantee the epoch velocity limits?", a: "the velocity tracking accumulators and mathematical bounds are formally verified using the aws kani model checker. we mathematically prove that integer overflows and epoch-bypass vectors are impossible under any execution path." },
  { q: "does shugo custody the assets?", a: "no. shugo is strictly a zero-custody protocol. assets remain in your native solana wallet. we leverage the official solana subscriptions & allowances (s&a) program to act solely as a strict authorization proxy." },
  { q: "what if the agent's local keypair is compromised?", a: "the attacker is mathematically bound by the exact same velocity caps and target allowlists. furthermore, the treasury owner can revoke the agent's cpi execution authority instantly via a single `shugo revoke` instruction." },
];

function FaqAccordion({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200 dark:border-[#222]">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-4 text-left font-medium text-black dark:text-white hover:opacity-70 transition-opacity">
        <span className="text-sm pr-4">{q}</span>
        <ChevronDown size={16} className={`transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[200px] pb-4 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

function DesktopDropdown({ label, items, mainHref }: { label: string; items: MenuOption[]; mainHref: string }) {
  return (
    <div className="relative group flex items-center h-14">
      <Link href={mainHref} className="text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors flex items-center gap-1 py-2 text-xs xl:text-sm">
        <span>{label}</span>
        <ChevronDown size={12} className="transition-transform duration-200 group-hover:rotate-180 opacity-60 group-hover:opacity-100" />
      </Link>
      <div className="absolute top-12 left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block z-50 w-[460px] xl:w-[500px]">
        <div className="bg-[#FFFFFF] dark:bg-[#0C0C0C] border border-zinc-200 dark:border-[#222] shadow-2xl p-2.5 grid grid-cols-2 gap-2 text-xs">
          {items.map((item) => (
            <Link key={item.title} href={item.href} target={item.external ? "_blank" : undefined} className="p-2.5 border border-transparent hover:border-zinc-200 dark:hover:border-[#222] hover:bg-zinc-50 dark:hover:bg-[#141414] transition-all flex flex-col justify-between group/card">
              <div className="flex items-center justify-between text-black dark:text-white font-medium mb-1">
                <span>{item.title}</span>
                <ArrowUpRight size={12} className="opacity-0 group-hover/card:opacity-100 transition-opacity text-zinc-400" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-500 text-[11px] leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// navbar hero page
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const pathname = usePathname();

  
  useEffect(() => {
    setMobileMenuOpen(false);
    setFaqOpen(false);
    setExpandedSection(null);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen || faqOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [mobileMenuOpen, faqOpen]);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#FFFFFF] dark:bg-[#0C0C0C] font-mono text-sm lowercase">
        <div className="w-full border-b border-zinc-200 dark:border-[#222]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            
            {/* Logo*/}
            <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
              <div className="flex items-center ">
                <Link className="font-bold text-lg sm:text-xl text-black dark:text-white hover:opacity-70 transition-opacity min-w-[95px] sm:min-w-[105px]" href="/">
                  <ScrambleText text="shugo" japanese="守護" hindi="शुगो" />
                </Link>
                <span className="-ml-[20px] hidden sm:flex items-center px-1.5 py-0.5 border border-[#14F195]/30 bg-[#14F195]/10 text-[#14F195] text-[11px] leading-none rounded-sm font-semibold">
                  devnet
                </span>
              </div>

              <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
                <DesktopDropdown label="docs" mainHref="https://docs.shugo.com" items={DOCS_ITEMS} />
                <DesktopDropdown label="cli" mainHref="https://docs.shugo.com/quickstart" items={CLI_ITEMS} />
                <DesktopDropdown label="proofs" mainHref="/proofs" items={PROOFS_ITEMS} />
                <button onClick={() => setFaqOpen(true)} className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-xs xl:text-sm flex items-center gap-1.5">
                  faq <HelpCircle size={14} />
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-1 sm:gap-1 lg:gap-2">
              
              <ThemeToggle />


              <Link className="hidden sm:block text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors p-1.5" href="https://github.com/Shugo-protocol/Shugo" target="_blank" aria-label="GitHub">
                <GithubIcon size={18} />
              </Link>

              <Link
                href="/dashboard"
                className="hidden lg:flex items-center gap-1.5 bg-[#14F195] hover:bg-[#10C97A] text-black px-3.5 py-1.5 text-xs xl:text-sm font-bold transition-all shadow-[0_0_15px_rgba(20,241,149,0.15)] hover:shadow-[0_0_20px_rgba(20,241,149,0.3)] ml-2 "
              >
                dashboard
              </Link>

              <button onClick={() => setMobileMenuOpen((prev) => !prev)} aria-label="Toggle navigation menu" className="lg:hidden p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-14 bottom-0 bg-[#FFFFFF] dark:bg-[#0C0C0C] border-b border-zinc-200 dark:border-[#222] overflow-y-auto px-4 py-6 z-50 flex flex-col justify-between">
            <div className="space-y-3">

              <Link
                href="/dashboard"
                className="flex items-center justify-between p-3.5 bg-[#14F195] text-black font-bold hover:bg-[#10C97A] transition-colors shadow-[0_0_15px_rgba(20,241,149,0.15)] rounded-sm"
              >
                <span>launch dashboard</span>
                <ArrowUpRight size={16} />
              </Link>

              <div className="border border-zinc-200 dark:border-[#222]">
                <button onClick={() => toggleSection("docs")} className="w-full flex items-center justify-between p-3.5 text-left font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-[#141414] transition-colors">
                  <span>docs</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${expandedSection === "docs" ? "rotate-180" : ""}`} />
                </button>
                {expandedSection === "docs" && (
                  <div className="p-2 border-t border-zinc-200 dark:border-[#222] bg-zinc-50/50 dark:bg-[#111] grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DOCS_ITEMS.map((item) => (
                      <Link key={item.title} href={item.href} target={item.external ? "_blank" : undefined} className="p-2.5 bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-[#222] hover:border-black dark:hover:border-white transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between font-medium text-black dark:text-white text-xs mb-1">
                          <span>{item.title}</span>
                          <ArrowUpRight size={12} className="text-zinc-400" />
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-snug">{item.desc}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-zinc-200 dark:border-[#222]">
                <button onClick={() => toggleSection("cli")} className="w-full flex items-center justify-between p-3.5 text-left font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-[#141414] transition-colors">
                  <span>cli</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${expandedSection === "cli" ? "rotate-180" : ""}`} />
                </button>
                {expandedSection === "cli" && (
                  <div className="p-2 border-t border-zinc-200 dark:border-[#222] bg-zinc-50/50 dark:bg-[#111] grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CLI_ITEMS.map((item) => (
                      <Link key={item.title} href={item.href} target={item.external ? "_blank" : undefined} className="p-2.5 bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-[#222] hover:border-black dark:hover:border-white transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between font-medium text-black dark:text-white text-xs mb-1">
                          <span>{item.title}</span>
                          <ArrowUpRight size={12} className="text-zinc-400" />
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-snug">{item.desc}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-zinc-200 dark:border-[#222]">
                <button onClick={() => toggleSection("proofs")} className="w-full flex items-center justify-between p-3.5 text-left font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-[#141414] transition-colors">
                  <span>proofs</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${expandedSection === "proofs" ? "rotate-180" : ""}`} />
                </button>
                {expandedSection === "proofs" && (
                  <div className="p-2 border-t border-zinc-200 dark:border-[#222] bg-zinc-50/50 dark:bg-[#111] grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROOFS_ITEMS.map((item) => (
                      <Link key={item.title} href={item.href} className="p-2.5 bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-[#222] hover:border-black dark:hover:border-white transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between font-medium text-black dark:text-white text-xs mb-1">
                          <span>{item.title}</span>
                          <ArrowUpRight size={12} className="text-zinc-400" />
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-snug">{item.desc}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => setFaqOpen(true)} className="w-full flex items-center justify-between p-3.5 border border-zinc-200 dark:border-[#222] font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-[#141414] transition-colors text-left">
                <span>faq</span>
                <HelpCircle size={16} className="text-zinc-500" />
              </button>
            </div>

            {/* todo: check name before pusing it */}
            <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-[#222] text-xs text-zinc-500 flex items-center justify-between">
              <span>shugo / 守護 / शुगो</span>
              <Link href="https://github.com/Shugo-protocol/Shugo" target="_blank" className="hover:text-black dark:hover:text-white transition-colors">
                github.com/Shugo-protocol/Shugo
              </Link>
            </div>
          </div>
        )}
      </header>

      <div className={`fixed inset-0 z-[60] transition-opacity duration-500 ${faqOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFaqOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-full md:w-[50vw] bg-[#FAFAFA] dark:bg-[#0C0C0C] border-l border-zinc-200 dark:border-[#222] shadow-2xl p-6 sm:p-10 transform transition-transform duration-500 ease-in-out overflow-y-auto ${faqOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white font-mono lowercase">judge faq</h2>
            <button onClick={() => setFaqOpen(false)} className="p-2 bg-zinc-200 dark:bg-[#1A1A1A] hover:bg-zinc-300 dark:hover:bg-[#222] rounded-full transition-colors text-black dark:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col font-mono lowercase">
            {FAQ_DATA.map((faq, index) => <FaqAccordion key={index} q={faq.q} a={faq.a} />)}
          </div>
          <div className="mt-12 p-4 bg-zinc-100 dark:bg-[#141414] border border-zinc-200 dark:border-[#222] text-xs text-zinc-500 dark:text-zinc-400 font-mono lowercase">
            <span className="font-bold text-black dark:text-white">note:</span> explicitly architected for solana foundation's s&a delegation standards.
          </div>
        </div>
      </div>
    </>
  );
}