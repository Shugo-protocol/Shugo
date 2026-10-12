"use client";

import { useEffect, useRef, useState } from "react";
import type { ElementType, MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Ban,
  BookOpen,
  ChevronDown,
  Cpu,
  FlaskConical,
  Gauge,
  HelpCircle,
  Key,
  Lock,
  Menu,
  MessageSquareText,
  ScrollText,
  Shield,
  Terminal,
  Eye,
  X,
  Zap,
} from "lucide-react";
import ScrambleText from "./ScrambleText";

interface MenuOption {
  title: string;
  desc: string;
  href: string;
  external?: boolean;
  icon: ElementType;
}

const DOCS_ITEMS: MenuOption[] = [
  {
    title: "introduction",
    desc: "zero-custody delegation protocol overview",
    href: "https://docs.shugo.website/introduction",
    external: true,
    icon: BookOpen,
  },
  {
    title: "quickstart",
    desc: "deploy your first guardrail in under 5 minutes",
    href: "https://docs.shugo.website/quickstart",
    external: true,
    icon: Zap,
  },
  {
    title: "zero-custody",
    desc: "solana subscriptions & allowances cpi mechanics",
    href: "https://docs.shugo.website/zero-custody",
    external: true,
    icon: Shield,
  },
  {
    title: "velocity caps",
    desc: "epoch-based mathematical spend bounding",
    href: "https://docs.shugo.website/zero-custody",
    external: true,
    icon: Gauge,
  },
];

const CLI_ITEMS: MenuOption[] = [
  {
    title: "shugo init",
    desc: "scaffold local agent policy workspaces",
    href: "https://docs.shugo.website/quickstart",
    external: true,
    icon: Terminal,
  },
  {
    title: "shugo delegate",
    desc: "sign and broadcast on-chain allowance policy",
    href: "https://docs.shugo.website/quickstart",
    external: true,
    icon: Key,
  },
  {
    title: "shugo inspect",
    desc: "stream real-time spend accumulators and epochs",
    href: "https://docs.shugo.website/quickstart",
    external: true,
    icon: Eye,
  },
  {
    title: "shugo revoke",
    desc: "instant emergency key revocation via single instruction",
    href: "https://docs.shugo.website/quickstart",
    external: true,
    icon: Ban,
  },
];

const PROOFS_ITEMS: MenuOption[] = [
  {
    title: "kani model checker",
    desc: "bounded verification runs eliminating panics & overflows",
    href: "/proofs#kani",
    icon: Cpu,
  },
  {
    title: "velocity invariants",
    desc: "formal mathematical proof against balance exhaustion",
    href: "/proofs#velocity",
    icon: Activity,
  },
  {
    title: "revocation soundness",
    desc: "proof that revoked agent keys cannot sign or proxy cpis",
    href: "/proofs#revocation",
    icon: Lock,
  },
  {
    title: "verification logs",
    desc: "reproducible artifacts, harnesses, and test traces",
    href: "/proofs#logs",
    icon: ScrollText,
  },
];

const FAQ_DATA = [
  {
    q: "if the agent hallucinates, is the treasury drained?",
    a: "no. the agent does not possess the treasury's private keys. it only possesses execution authority bounded by shugo's on-chain cpi proxy. if an agent attempts to exceed its epoch cap or call a non-allowlisted program, the anchor program rejects the transaction.",
  },
  {
    q: "why not just use a squads multisig?",
    a: "multisigs require synchronous human signatures for every transaction, defeating the purpose of an autonomous agent. shugo is a delegation engine: humans sign once to establish cryptographic bounds, and the agent executes autonomously within them.",
  },
  {
    q: "how do you guarantee the epoch velocity limits?",
    a: "the velocity tracking accumulators and mathematical bounds are formally verified using the aws kani model checker. we mathematically prove that integer overflows and epoch-bypass vectors are impossible under any execution path.",
  },
  {
    q: "does shugo custody the assets?",
    a: "no. shugo is strictly a zero-custody protocol. assets remain in your native solana wallet. we leverage the official solana subscriptions & allowances (s&a) program to act solely as a strict authorization proxy.",
  },
  {
    q: "what if the agent's local keypair is compromised?",
    a: "the attacker is mathematically bound by the exact same velocity caps and target allowlists. furthermore, the treasury owner can revoke the agent's cpi execution authority instantly via a single shugo revoke instruction.",
  },
];

function GithubIcon({ size = 20 }: { size?: number }) {
  return (
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
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

/** Reusable animated icon for the Judge-only message type in the Playground. */
export function JudgeOnlyMessageIcon() {
  return (
    <span
      className="group/judge relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 transition-colors duration-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 motion-reduce:transition-none"
      aria-hidden="true"
    >
      <MessageSquareText
        size={15}
        strokeWidth={1.7}
        className="transition-transform duration-300 group-hover/judge:-translate-y-0.5 group-hover/judge:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
      />
      <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
    </span>
  );
}

function FaqAccordion({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-zinc-200 dark:border-[#222]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between py-4 text-left font-medium text-black transition-opacity duration-200 hover:opacity-75 dark:text-white"
      >
        <span className="pr-4 text-sm leading-snug">{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-zinc-500 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-black dark:text-white" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
          isOpen
            ? "grid-rows-[1fr] pb-4 opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

function DesktopDropdown({
  label,
  items,
  mainHref,
  onMouseEnter,
}: {
  label: string;
  items: MenuOption[];
  mainHref: string;
  onMouseEnter: (e: MouseEvent<HTMLDivElement>) => void;
}) {
  const [pillStyle, setPillStyle] = useState({
    transform: "translate(0px, 0px)",
    width: 0,
    height: 0,
    opacity: 0,
  });

  const handleItemEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget;
    setPillStyle({
      transform: `translate(${target.offsetLeft}px, ${target.offsetTop}px)`,
      width: target.offsetWidth,
      height: target.offsetHeight,
      opacity: 1,
    });
  };

  return (
    <div
      className="group relative z-10 flex h-14 items-center"
      onMouseEnter={onMouseEnter}
    >
      <Link
        href={mainHref}
        className="flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors duration-200 hover:text-black dark:text-zinc-400 dark:hover:text-white xl:text-[13px]"
      >
        <span>{label}</span>
        <ChevronDown
          size={12}
          className="opacity-60 transition-transform duration-300 group-hover:rotate-180 group-hover:opacity-100"
        />
      </Link>

      <div className="invisible absolute left-1/2 top-full z-50 w-[460px] -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition-[opacity,transform,visibility] duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 xl:w-[500px]">
        <div className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-2xl dark:border-[#222] dark:bg-[#0C0C0C]">
          <div
            className="relative grid grid-cols-2 gap-2 text-xs"
            onMouseLeave={() =>
              setPillStyle((prev) => ({ ...prev, opacity: 0 }))
            }
          >
            <div
              className="pointer-events-none absolute left-0 top-0 z-0 rounded-lg border border-zinc-200 bg-zinc-50 transition-[transform,width,height,opacity] duration-200 ease-out will-change-transform dark:border-[#222] dark:bg-[#141414]"
              style={{
                transform: pillStyle.transform,
                width: `${pillStyle.width}px`,
                height: `${pillStyle.height}px`,
                opacity: pillStyle.opacity,
              }}
            />

            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  onMouseEnter={handleItemEnter}
                  className="group/card relative flex flex-col justify-between overflow-hidden rounded-lg border border-transparent p-2.5"
                >
                  <Icon
                    className="pointer-events-none absolute -bottom-2 -right-2 z-0 h-16 w-16 text-black/[0.03] transition-transform duration-300 group-hover/card:-rotate-12 group-hover/card:scale-110 motion-reduce:transition-none dark:text-white/[0.03]"
                    aria-hidden="true"
                  />
                  <div className="relative z-10 mb-1 flex items-center justify-between font-medium text-black dark:text-white">
                    <span>{item.title}</span>
                    <ArrowUpRight
                      size={12}
                      className="text-zinc-400 opacity-0 transition-opacity group-hover/card:opacity-100"
                    />
                  </div>
                  <p className="relative z-10 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                    {item.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredRect, setHoveredRect] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setFaqOpen(false);
    setExpandedSection(null);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen && !faqOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [mobileMenuOpen, faqOpen]);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (!navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const targetRect = e.currentTarget.getBoundingClientRect();
    setHoveredRect({
      left: targetRect.left - navRect.left,
      width: targetRect.width,
      opacity: 1,
    });
  };

  const sections = [
    { id: "docs", label: "docs", items: DOCS_ITEMS },
    { id: "cli", label: "cli", items: CLI_ITEMS },
    { id: "proofs", label: "proofs", items: PROOFS_ITEMS },
  ];

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-40 bg-transparent font-mono text-sm lowercase transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none ${
          isMounted ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 -z-10 top-0 h-28 bg-white/50 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] dark:bg-[#0C0C0C]/50 sm:h-32" />

        <div className="w-full">
          <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="z-10 flex min-w-0 items-center">
              <Link
                href="/"
                aria-label="Shugo home"
                className="truncate text-base font-light text-black transition-opacity hover:opacity-75 dark:text-white sm:text-xl"
              >
                <ScrambleText text="shugo" japanese="守護" hindi="शुगो" />
              </Link>
            </div>

            <nav
              ref={navRef}
              aria-label="Main navigation"
              onMouseLeave={() =>
                setHoveredRect((prev) => ({ ...prev, opacity: 0 }))
              }
              className="absolute left-1/2 z-10 hidden -translate-x-1/2 items-center justify-center gap-1 lg:flex xl:gap-2"
            >
              <div
                className="pointer-events-none absolute top-1/2 z-0 h-9 -translate-y-1/2 rounded-full bg-zinc-100/80 transition-[left,width,opacity] duration-200 ease-out dark:bg-white/10"
                style={{
                  left: `${hoveredRect.left}px`,
                  width: `${hoveredRect.width}px`,
                  opacity: hoveredRect.opacity,
                }}
              />

              <DesktopDropdown
                label="docs"
                mainHref="https://docs.shugo.website"
                items={DOCS_ITEMS}
                onMouseEnter={handleMouseEnter}
              />
              <DesktopDropdown
                label="cli"
                mainHref="https://docs.shugo.website/quickstart"
                items={CLI_ITEMS}
                onMouseEnter={handleMouseEnter}
              />
              <DesktopDropdown
                label="proofs"
                mainHref="https://docs.shugo.website/proofs"
                items={PROOFS_ITEMS}
                onMouseEnter={handleMouseEnter}
              />

              <div
                className="z-10 flex h-14 items-center"
                onMouseEnter={handleMouseEnter}
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(true)}
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors duration-200 hover:text-black dark:text-zinc-400 dark:hover:text-white xl:text-[13px]"
                >
                  faq <HelpCircle size={14} className="opacity-70" />
                </button>
              </div>

              {/* Playground button with animated lab icon */}
              <div
                className="z-10 flex h-14 items-center"
                onMouseEnter={handleMouseEnter}
              >
                <Link
                  href="/Playground"
                  className="group/playground relative flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors duration-200 hover:text-black dark:text-zinc-400 dark:hover:text-white xl:text-[13px]"
                >
                  <span className="relative flex items-center justify-center">
                    <FlaskConical
                      size={15}
                      strokeWidth={1.8}
                      className="transition-transform duration-300 ease-out group-hover/playground:-rotate-12 group-hover/playground:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
                    />
                    <span className="pointer-events-none absolute -inset-1 rounded-full border border-emerald-500/0 transition-[transform,border-color] duration-300 group-hover/playground:scale-125 group-hover/playground:border-emerald-500/40 motion-reduce:transition-none" />
                  </span>
                  <span>playground</span>
                  <ArrowUpRight
                    size={12}
                    className="translate-x-0 translate-y-0 opacity-50 transition-[transform,opacity] duration-200 group-hover/playground:translate-x-0.5 group-hover/playground:-translate-y-0.5 group-hover/playground:opacity-100 motion-reduce:transition-none"
                  />
                </Link>
              </div>
            </nav>

            <div className="z-10 flex items-center justify-end gap-1.5 sm:gap-2">
              <Link
                className="hidden rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100/80 hover:text-black dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white sm:flex"
                href="https://github.com/Shugo-protocol/Shugo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <GithubIcon size={18} />
              </Link>

              <Link
                href="/explorer"
                className="ml-1 hidden items-center gap-1.5 rounded-md bg-[#14F195] px-4 py-2 text-xs font-bold text-black shadow-[0_0_15px_rgba(20,241,149,0.15)] transition-colors hover:bg-[#10C97A] lg:flex xl:text-sm"
              >
                Explorer
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100 active:scale-95 dark:text-zinc-300 dark:hover:bg-white/10 lg:hidden"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          aria-hidden={!mobileMenuOpen}
          className={`fixed inset-x-0 top-14 z-50 flex h-[calc(100dvh-3.5rem)] flex-col justify-between overflow-y-auto border-t border-zinc-200/80 bg-white/95 px-4 py-5 backdrop-blur-2xl transition-[opacity,transform,visibility] duration-200 dark:border-[#222] dark:bg-[#0C0C0C]/95 sm:px-6 lg:hidden ${
            mobileMenuOpen
              ? "visible translate-y-0 opacity-100"
              : "invisible -translate-y-2 opacity-0"
          }`}
        >
          <div className="space-y-3">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={mobileMenuOpen ? 0 : -1}
              className="flex min-h-12 items-center justify-between rounded-xl bg-[#14F195] p-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(20,241,149,0.15)] transition-colors hover:bg-[#10C97A]"
            >
              <span>launch dashboard</span>
              <ArrowUpRight size={18} />
            </Link>

            <Link
              href="/Playground"
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={mobileMenuOpen ? 0 : -1}
              className="group/mobile-playground flex min-h-12 items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 text-sm font-medium text-black transition-colors hover:bg-zinc-50 dark:border-[#222] dark:bg-[#111] dark:text-white dark:hover:bg-[#171717]"
            >
              <span className="flex items-center gap-2.5">
                <FlaskConical
                  size={17}
                  className="transition-transform duration-300 group-hover/mobile-playground:-rotate-12 group-hover/mobile-playground:scale-110 motion-reduce:transition-none"
                />
                playground
              </span>
              <ArrowUpRight size={16} className="text-zinc-400" />
            </Link>

            {sections.map((section) => (
              <div
                key={section.id}
                className="overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50/50 dark:border-[#222] dark:bg-[#111]/50"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={expandedSection === section.id}
                  className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left font-medium text-black transition-colors hover:bg-zinc-100/60 dark:text-white dark:hover:bg-white/5"
                >
                  <span className="text-sm">{section.label}</span>
                  <ChevronDown
                    size={16}
                    className={`text-zinc-500 transition-transform duration-200 ${
                      expandedSection === section.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                    expandedSection === section.id
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 gap-2 border-t border-zinc-200 bg-white/60 p-2.5 dark:border-[#222] dark:bg-[#0A0A0A]/60 sm:grid-cols-2">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.title}
                            href={item.href}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noopener noreferrer" : undefined}
                            onClick={() => setMobileMenuOpen(false)}
                            tabIndex={
                              mobileMenuOpen && expandedSection === section.id
                                ? 0
                                : -1
                            }
                            className="group/mobile relative flex flex-col justify-between overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 transition-colors active:border-zinc-400 dark:border-[#222] dark:bg-[#121212] dark:active:border-zinc-600"
                          >
                            <Icon
                              className="pointer-events-none absolute -bottom-2 -right-2 z-0 h-14 w-14 text-black/[0.03] transition-transform duration-300 group-hover/mobile:-rotate-12 group-hover/mobile:scale-110 dark:text-white/[0.03]"
                              aria-hidden="true"
                            />
                            <div className="relative z-10 mb-1 flex items-center justify-between text-xs font-medium text-black dark:text-white">
                              <span>{item.title}</span>
                              <ArrowUpRight size={13} className="text-zinc-400" />
                            </div>
                            <p className="relative z-10 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                              {item.desc}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setFaqOpen(true);
              }}
              className="flex min-h-12 w-full items-center justify-between rounded-xl border border-zinc-200/80 px-4 py-3 text-left font-medium text-black transition-colors hover:bg-zinc-50 dark:border-[#222] dark:text-white dark:hover:bg-[#141414]"
            >
              <span className="text-sm">faq</span>
              <HelpCircle size={16} className="text-zinc-500" />
            </button>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-xs text-zinc-500 dark:border-[#222] sm:flex-row">
            <span>shugo / 守護 / शुगो</span>
            <Link
              href="https://github.com/Shugo-protocol/Shugo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-black dark:hover:text-white"
            >
              <GithubIcon size={14} />
              <span>github.com/Shugo-protocol/Shugo</span>
            </Link>
          </div>
        </div>
      </header>

      {/* FAQ drawer */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
          faqOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!faqOpen}
      >
        <button
          type="button"
          aria-label="Close FAQ"
          tabIndex={faqOpen ? 0 : -1}
          className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm"
          onClick={() => setFaqOpen(false)}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Frequently asked questions"
          className={`absolute right-0 top-0 flex h-[100dvh] w-full flex-col border-l border-zinc-200 bg-[#FAFAFA] shadow-2xl transition-transform duration-300 ease-out dark:border-[#222] dark:bg-[#0C0C0C] sm:w-[50vw] ${
            faqOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-zinc-200/80 bg-[#FAFAFA]/95 px-6 py-4 backdrop-blur-md dark:border-[#222] dark:bg-[#0C0C0C]/95 sm:py-5">
            <h2 className="font-mono text-lg font-bold lowercase tracking-tight text-black dark:text-white sm:text-xl">
              faq&apos;s
            </h2>
            <button
              type="button"
              onClick={() => setFaqOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-black transition-colors hover:bg-zinc-300 dark:bg-[#1A1A1A] dark:text-white dark:hover:bg-[#222]"
              aria-label="Close FAQ"
              tabIndex={faqOpen ? 0 : -1}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 font-mono lowercase">
            {FAQ_DATA.map((faq) => (
              <FaqAccordion key={faq.q} q={faq.q} a={faq.a} />
            ))}
            <div className="mb-6 mt-8 rounded-xl border border-zinc-200 bg-zinc-100 p-4 text-xs text-zinc-500 dark:border-[#222] dark:bg-[#141414] dark:text-zinc-400">
              <span className="font-bold text-black dark:text-white">note:</span>{" "}
              explicitly architected for solana foundation&apos;s s&a delegation standards.
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
