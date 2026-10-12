"use client";

import { Buffer } from "buffer";
if (typeof window !== "undefined") {
  (window as Window & { Buffer?: typeof Buffer }).Buffer =
    (window as Window & { Buffer?: typeof Buffer }).Buffer || Buffer;
}

import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { Connection } from "@solana/web3.js";
import { 
  AlertTriangle, 
  CheckCircle, 
  PauseCircle, 
  Activity, 
  ExternalLink, 
  Clock, 
  ShieldCheck,
  Lock,
  RefreshCw,
  Search,
  UserRound,
  Bot,
  Copy,
  X,
  Check,
} from "lucide-react";
import { GUARD_PROGRAM_ID, decodePolicy, activeDestinations } from "@shugo-protocol/sdk";
import Footer from "@/components/Footer";

type DecodedPolicy = ReturnType<typeof decodePolicy> & { pubkey: string };

const PAGE_SIZE = 12;

const NETWORKS = {
  devnet: "https://api.devnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com"
};

function MinimalFortIllustration() {
  return (
    <svg viewBox="0 0 150 66" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-[54px] w-[122px] text-zinc-400 dark:text-zinc-600 sm:h-[64px] sm:w-[146px]">
      <g stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 56H138" />
        <path d="M28 56V34H48V56M24 34H52L48 28H28L24 34Z" />
        <path d="M33 28V18H43V28M30 18H46L43 14H33L30 18Z" />
        <path d="M66 56V25H84V56M62 25H88L84 19H66L62 25Z" />
        <path d="M70 19V10H80V19M67 10H83L80 6H70L67 10Z" />
        <path d="M102 56V34H122V56M98 34H126L122 28H102L98 34Z" />
        <path d="M107 28V18H117V28M104 18H120L117 14H107L104 18Z" />
        <path d="M37 43V48M75 36V43M112 43V48" />
      </g>
    </svg>
  );
}

// Official Solana mark recreated as an inline SVG so it stays crisp at every size.
function SolanaLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 36 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="solana-gradient-top" x1="0" y1="0" x2="36" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="solana-gradient-middle" x1="0" y1="0" x2="36" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="solana-gradient-bottom" x1="0" y1="0" x2="36" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <path d="M7 2H34L28.8 7.2H1.8L7 2Z" fill="url(#solana-gradient-top)" />
      <path d="M7 13.4H34L28.8 18.6H1.8L7 13.4Z" fill="url(#solana-gradient-middle)" />
      <path d="M7 24.8H34L28.8 30H1.8L7 24.8Z" fill="url(#solana-gradient-bottom)" />
    </svg>
  );
}

export default function ShugoDashboard() {
  const [policies, setPolicies] = useState<DecodedPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"devnet" | "mainnet">("devnet");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0); 
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPolicy, setSelectedPolicy] = useState<DecodedPolicy | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPolicyNotice, setShowPolicyNotice] = useState(false);
  const [policyNoticeLeaving, setPolicyNoticeLeaving] = useState(false);

  useEffect(() => {
    // Only remember an explicit "I already have a policy" choice.
    // Dismissing or choosing the docs link never persists the decision.
    try {
      if (window.localStorage.getItem("shugo-policy-notice-accepted") === "true") {
        setShowPolicyNotice(false);
        return;
      }
    } catch {
      // If storage is unavailable, keep the notice usable for this visit.
    }

    setShowPolicyNotice(true);
    const dismissTimer = window.setTimeout(() => setPolicyNoticeLeaving(true), 7200);
    const removeTimer = window.setTimeout(() => setShowPolicyNotice(false), 7700);
    return () => {
      window.clearTimeout(dismissTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    const updateClock = () => setNow(Math.floor(Date.now() / 1000));
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchPolicies = useCallback(async () => {
    // Mainnet is intentionally locked in this dashboard.
    if (activeTab !== "devnet") return;

    setLoading(true);
    setError(null);

    try {
      const connection = new Connection(NETWORKS.devnet, "confirmed");
      const accounts = await connection.getProgramAccounts(GUARD_PROGRAM_ID);
      const parsedPolicies: DecodedPolicy[] = [];

      for (const account of accounts) {
        try {
          parsedPolicies.push({
            pubkey: account.pubkey.toBase58(),
            ...decodePolicy(account.account.data),
          });
        } catch {
          // Ignore malformed or incompatible accounts without failing the whole list.
        }
      }

      setPolicies(parsedPolicies);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to fetch policy accounts.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchPolicies();
  }, [fetchPolicies]);

  const getPolicyStatus = (policy: DecodedPolicy) => {
    if (policy.paused) return { label: "PAUSED", color: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-900/70", icon: PauseCircle, bg: "bg-amber-50 dark:bg-amber-950/40" };
    if (policy.windowPulled >= policy.velocityCap) return { label: "LIMIT REACHED", color: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900/70", icon: AlertTriangle, bg: "bg-rose-50 dark:bg-rose-950/40" };
    return { label: "ACTIVE", color: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-900/70", icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-950/50" };
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  const filteredPolicies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return policies;

    return policies.filter((policy) =>
      policy.pubkey.toLowerCase().includes(query) ||
      policy.human.toBase58().toLowerCase().includes(query) ||
      policy.agent.toBase58().toLowerCase().includes(query)
    );
  }, [policies, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE));
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPolicies.slice(start, start + PAGE_SIZE);
  }, [filteredPolicies, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="relative isolate min-h-screen w-full overflow-x-clip bg-white pt-16 text-zinc-800 transition-colors duration-300 selection:bg-zinc-200 dark:bg-[#0C0C0C] dark:text-zinc-100 sm:pt-20 lg:pt-24">
      {/* Quiet background details. The Japanese fortress sits below the heading instead of competing with it. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden">
        <div className="absolute inset-0 bg-white dark:bg-[#0C0C0C]" />
        <div className="absolute left-1/2 top-48 h-72 w-[min(90vw,1000px)] -translate-x-1/2 rounded-full bg-transparent" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes vibrate {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .vibrate-on-click.is-vibrating { animation: vibrate 0.35s ease-in-out; }

        @keyframes fort-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes reveal-up {
          from { opacity: 0; transform: translateY(12px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .reveal {
          animation: reveal-up 720ms cubic-bezier(0.2, 0.65, 0.3, 1) both;
        }
        .reveal-delay-1 { animation-delay: 80ms; }
        .reveal-delay-2 { animation-delay: 160ms; }
        .reveal-delay-3 { animation-delay: 240ms; }
        .reveal-delay-4 { animation-delay: 320ms; }
        .reveal-card {
          animation: reveal-up 680ms cubic-bezier(0.2, 0.65, 0.3, 1) both;
          animation-delay: calc(var(--reveal-index, 0) * 65ms);
        }
        @keyframes policy-backdrop-in {
          from { opacity: 0; backdrop-filter: blur(0px) saturate(100%); }
          to { opacity: 1; backdrop-filter: blur(18px) saturate(125%); }
        }
        @keyframes policy-modal-in {
          0% { opacity: 0; transform: translateY(22px) scale(0.965); filter: blur(7px); }
          65% { opacity: 1; transform: translateY(-2px) scale(1.004); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .policy-backdrop-enter { animation: policy-backdrop-in 320ms ease-out both; }
        .policy-modal-enter { animation: policy-modal-in 480ms cubic-bezier(0.2, 0.8, 0.2, 1) both; transform-origin: center; }
       @keyframes policy-notice-in {
         from { opacity: 0; transform: translate3d(22px, -8px, 0) scale(0.97); filter: blur(5px); }
         to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
       }
       @keyframes policy-notice-out {
         from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
         to { opacity: 0; transform: translate3d(18px, -5px, 0) scale(0.97); }
       }
       .policy-notice-enter { animation: policy-notice-in 460ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
       .policy-notice-leave { animation: policy-notice-out 420ms cubic-bezier(0.4, 0, 1, 1) both; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) {
          .vibrate-on-click.is-vibrating { animation: none; }
          .reveal, .reveal-card { animation: none; opacity: 1; transform: none; }
          .policy-backdrop-enter, .policy-modal-enter, .policy-notice-enter, .policy-notice-leave { animation: none; }
        }
      ` }} />

      {showPolicyNotice && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed right-3 top-[7.25rem] z-[100] w-[min(22rem,calc(100vw-1.5rem))] sm:right-5 sm:top-[7.5rem] ${policyNoticeLeaving ? "policy-notice-leave" : "policy-notice-enter"}`}
        >
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white/95 p-4 pr-9 shadow-[0_8px_28px_rgba(24,24,27,0.08)] backdrop-blur-md dark:border-zinc-800 dark:bg-[#141414]/95 dark:shadow-[0_8px_28px_rgba(0,0,0,0.24)]">
            <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-zinc-300/80 dark:bg-zinc-700/80" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Before you continue</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                Have a policy already? Search for it below. New here? Create one and read the terms carefully first.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.localStorage.setItem("shugo-policy-notice-accepted", "true");
                    } catch {
                      // The notice can still be dismissed if storage is unavailable.
                    }
                    setPolicyNoticeLeaving(true);
                    window.setTimeout(() => setShowPolicyNotice(false), 430);
                  }}
                  className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[11px] font-medium leading-4 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  I already have a policy
                </button>
                <a
                  href="https://docs.shugo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 rounded-lg border border-zinc-300 bg-zinc-800 px-2.5 py-2 text-center text-[11px] font-medium leading-4 text-white transition hover:bg-zinc-700 dark:border-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
                >
                  I don’t have a policy
                </a>
              </div>
            </div>
            <button
              type="button"
              aria-label="Dismiss notice"
              onClick={() => {
                setPolicyNoticeLeaving(true);
                window.setTimeout(() => setShowPolicyNotice(false), 430);
              }}
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <X size={12} />
            </button>
          </div>
        </aside>
      )}

      <main className="relative z-10 mx-auto w-full min-w-0 max-w-[1600px] px-3 font-mono min-[380px]:px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header / hero */}
        <header className="reveal mx-auto flex max-w-4xl flex-col items-center px-1 text-center">
          <div className="mb-5 animate-[fort-drift_5s_ease-in-out_infinite]">
            <MinimalFortIllustration />
          </div>
          <h1 className="text-balance text-[clamp(1.8rem,7vw,3.5rem)] font-medium lowercase leading-[1.05] tracking-[-0.075em] text-zinc-900 dark:text-zinc-50">
            policy <span className="text-zinc-400 dark:text-zinc-600">/</span> explorer
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-[11px] leading-5 text-zinc-500 dark:text-zinc-400 sm:mt-4 sm:text-[13px] sm:leading-7">
            Inspect agent permissions, spending limits, and on-chain activity.
          </p>
        </header>

        {/* Controls */}
        <section className="reveal reveal-delay-1 mx-auto mt-7 flex w-full max-w-3xl flex-col items-stretch gap-3 sm:mt-10 sm:gap-4 sm:items-center">
          <p className="w-full text-left text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 sm:text-[10px]">
            Search on-chain permissions
          </p>
          <div className="flex w-full items-stretch gap-2 sm:gap-3">
            <label className="group relative min-w-0 flex-1">
              <span className="sr-only">Search policies</span>
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300"
              />
              <input
                type="text"
                placeholder="Search by Policy, Human, or Agent address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-zinc-200/90 bg-white pl-11 pr-4 text-xs text-zinc-800 shadow-[0_4px_18px_rgba(0,0,0,0.035)] outline-none transition duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100/50 dark:border-[#222222] dark:bg-[#111111] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:hover:border-[#333333] dark:focus:border-emerald-900 dark:focus:ring-emerald-950/50 sm:text-sm"
              />
            </label>
            <button
              type="button"
              onClick={fetchPolicies}
              disabled={loading}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-600 shadow-[0_2px_10px_rgba(0,0,0,0.025)] transition hover:border-zinc-300 hover:bg-white disabled:cursor-wait disabled:opacity-60 dark:border-[#222222] dark:bg-[#111111] dark:text-zinc-300 dark:hover:bg-zinc-800"
              title="Refresh network data"
              aria-label="Refresh network data"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Network selector */}
          <div className="inline-flex max-w-full items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("devnet")}
              aria-pressed={activeTab === "devnet"}
              className={`relative flex min-h-7 items-center justify-center gap-1.5 px-1.5 py-1 transition-all duration-200 ${
                activeTab === "devnet"
                  ? "text-zinc-900 dark:text-zinc-100 border rounded-md border-zinc-300 dark:border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border-zinc-300 dark:border-zinc-700"
              }`}
            >
              <SolanaLogo className="h-3.5 w-[18px] shrink-0" />
              <span className="text-[10px] font-semibold tracking-tight sm:text-[11px]">Devnet</span>
            </button>

            <button
              type="button"
              id="mainnet-button"
              onClick={() => {
                const button = document.getElementById("mainnet-button");
                if (!button) return;
                button.classList.remove("is-vibrating");
                void button.offsetWidth;
                button.classList.add("is-vibrating");
              }}
              aria-label="Mainnet is locked and unavailable"
              aria-disabled="true"
              title="Mainnet is currently locked"
              className="vibrate-on-click relative flex min-h-7 items-center justify-center gap-1.5 px-1.5 py-1 text-zinc-400 transition-colors dark:text-zinc-500"
            >
              <SolanaLogo className="h-3.5 w-[18px] shrink-0 opacity-70" />
              <span className="relative pt-0.5 text-[10px] font-semibold tracking-tight sm:text-[11px]">
                Mainnet
                <Lock size={10} strokeWidth={2.4} className="absolute -right-2.5 -top-2 text-red-500 dark:text-red-400" />
              </span>
            </button>
          </div>
        </section>

        {/* Main content */}
        <section className="reveal reveal-delay-2 mt-9 sm:mt-12 lg:mt-14">
          <div className="mb-5 flex flex-col gap-4 border-b border-zinc-200/80 pb-5 dark:border-[#222222] sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                Network overview
              </p>
              <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Activity size={14} className="shrink-0 text-zinc-600 dark:text-zinc-300" />
                <span className="shrink-0 font-semibold uppercase tracking-wider">Program ID</span>
                <span className="truncate font-mono text-zinc-700 dark:text-zinc-300">{GUARD_PROGRAM_ID.toBase58()}</span>
                <a
                  href={`https://explorer.solana.com/address/${GUARD_PROGRAM_ID.toBase58()}?cluster=${activeTab}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  title="Open program in Solana Explorer"
                  aria-label="Open program in Solana Explorer"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
              <span className="text-zinc-500 dark:text-zinc-400">
                <span className="mr-2 text-zinc-300 dark:text-zinc-700">/</span>{activeTab}
              </span>
              <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                <span className="mr-2 text-zinc-300 dark:text-zinc-700">/</span>{String(filteredPolicies.length).padStart(2, "0")} {searchQuery ? "matches" : "policies"}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm dark:border-[#222222] dark:bg-[#111111] dark:text-zinc-300">
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-zinc-500" />
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-100">Unable to load policy data</p>
                <p className="mt-1 break-words text-xs leading-5 text-zinc-500 dark:text-zinc-400">{error}</p>
              </div>
            </div>
          )}

          {/* Policy cards */}
          <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredPolicies.length === 0 && !loading && !error ? (
              <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300/90 bg-white px-6 py-16 text-center dark:border-[#222222] dark:bg-[#111111]">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-400 dark:border-[#222222] dark:bg-[#111111] dark:text-zinc-500">
                  <ShieldCheck size={25} strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {searchQuery ? "No Matches Found" : "No Policies on this Network"}
                </p>
                <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-400 dark:text-zinc-500">
                  {searchQuery
                    ? "Try another policy, human, or agent address."
                    : "Policies will appear here when they are available on the selected network."}
                </p>
              </div>
            ) : (
              paginatedPolicies.map((policy, index) => {
                const status = getPolicyStatus(policy);
                const StatusIcon = status.icon;
                const pulled = Number(policy.windowPulled);
                const cap = Number(policy.velocityCap);
                const percentUsed = cap > 0 ? Math.min(100, (pulled / cap) * 100) : 0;
                const destinations = activeDestinations(policy);
                const address = policy.pubkey;
                const human = policy.human.toBase58();
                const agent = policy.agent.toBase58();


                return (
                  <button
                    type="button"
                    key={policy.pubkey}
                    onClick={() => setSelectedPolicy(policy)}
                    style={{ "--reveal-index": Math.min(index, 8) } as CSSProperties}
                    className={`reveal-card group relative flex aspect-square min-w-0 w-full flex-col overflow-hidden rounded-2xl border bg-white p-4 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:bg-[#111111] sm:p-5 ${
                      policy.paused
                        ? "border-amber-200/90 hover:border-amber-300 dark:border-amber-900/60 dark:hover:border-amber-800"
                        : pulled >= cap
                          ? "border-rose-200/90 hover:border-rose-300 dark:border-rose-900/60 dark:hover:border-rose-800"
                          : "border-zinc-200/80 hover:border-emerald-200 dark:border-[#222222] dark:hover:border-emerald-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Policy address</p>
                        <p className="truncate font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-100" title={address}>{formatAddress(address)}</p>
                      </div>
                      {!policy.paused && (
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-wide ${status.border} ${status.bg} ${status.color}`}>
                          <StatusIcon size={11} /> {status.label}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="min-w-0 rounded-xl bg-zinc-50 p-2.5 dark:bg-[#0C0C0C]">
                        <div className="mb-2 flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500"><UserRound size={13} /><span className="text-[9px] font-semibold uppercase tracking-wider">Human</span></div>
                        <p className="truncate font-mono text-[10px] text-zinc-600 dark:text-zinc-300" title={human}>{formatAddress(human)}</p>
                      </div>
                      <div className="min-w-0 rounded-xl bg-zinc-50 p-2.5 dark:bg-[#0C0C0C]">
                        <div className="mb-2 flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500"><Bot size={13} /><span className="text-[9px] font-semibold uppercase tracking-wider">Agent</span></div>
                        <p className="truncate font-mono text-[10px] text-zinc-600 dark:text-zinc-300" title={agent}>{formatAddress(agent)}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Velocity usage</span>
                        <span className="font-mono text-[10px] text-zinc-700 dark:text-zinc-200">{pulled.toLocaleString()} / {cap.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className={`h-full rounded-full transition-all duration-700 ${policy.paused ? "bg-amber-500" : pulled >= cap ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${percentUsed}%` }} />
                      </div>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-[#222222]">
                      <div>
                        <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Per-call limit</p>
                        <p className="font-mono text-xs text-zinc-800 dark:text-zinc-100">{Number(policy.perCallCap).toLocaleString()} <span className="text-[9px] text-zinc-400">units</span></p>
                      </div>
                      <div className="text-right">
                        <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Destinations</p>
                        <p className="font-mono text-xs text-zinc-800 dark:text-zinc-100">{destinations.length}</p>
                      </div>
                      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-widest text-zinc-400 opacity-0 transition group-hover:opacity-100 sm:bottom-4">View details ↗</span>
                    </div>

                    {policy.paused && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] dark:bg-[#0C0C0C]/80">
                        <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/60 dark:text-amber-300">
                          <PauseCircle size={25} strokeWidth={1.7} />
                        </span>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/60 dark:text-amber-300">Paused</span>
                        <span className="mt-2 text-[9px] text-zinc-500 dark:text-zinc-400">Click to inspect policy</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}

            {loading && filteredPolicies.length === 0 && (
              <div className="col-span-full flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white text-zinc-500 dark:border-[#222222] dark:bg-[#111111]">
                <div className="mb-5 h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500 dark:border-zinc-700 dark:border-t-zinc-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Syncing blockchain state...</p>
                <p className="mt-2 text-[11px] text-zinc-400">Fetching current policy accounts</p>
              </div>
            )}
          </div>

          {filteredPolicies.length > 0 && (
            <nav aria-label="Policy pages" className="mt-6 flex flex-col gap-3 border-t border-zinc-200/80 pt-4 dark:border-[#222222] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Showing <span className="font-semibold text-zinc-700 dark:text-zinc-200">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPolicies.length)}</span> of <span className="font-semibold text-zinc-700 dark:text-zinc-200">{filteredPolicies.length}</span> policies
              </p>
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg border border-zinc-200 px-2.5 py-2 text-[11px] text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900" aria-label="First page">First</button>
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg border border-zinc-200 px-3 py-2 text-[11px] text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Previous</button>
                <span className="min-w-[5.5rem] px-2 text-center font-mono text-[11px] text-zinc-600 dark:text-zinc-300">{currentPage} / {totalPages}</span>
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-zinc-200 px-3 py-2 text-[11px] text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">Next</button>
                <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="rounded-lg border border-zinc-200 px-2.5 py-2 text-[11px] text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900" aria-label="Last page">Last</button>
              </div>
            </nav>
          )}
        </section>
          
      </main>
      <Footer/>

      {selectedPolicy && (() => {
        const policy = selectedPolicy;
        const destinations = activeDestinations(policy);
        const pulled = Number(policy.windowPulled);
        const cap = Number(policy.velocityCap);
        const usedPercent = cap > 0 ? Math.min(100, (pulled / cap) * 100) : 0;
        const remaining = Math.max(0, cap - pulled);
        const status = getPolicyStatus(policy);
        const ModalStatusIcon = status.icon;
        const allFields = [
          { label: "Policy address", value: policy.pubkey, icon: ShieldCheck },
          { label: "Human address", value: policy.human.toBase58(), icon: UserRound },
          { label: "Agent address", value: policy.agent.toBase58(), icon: Bot },
          { label: "Paused", value: String(Boolean(policy.paused)), icon: PauseCircle },
          { label: "Velocity used", value: String(pulled), icon: Activity },
          { label: "Velocity cap", value: String(cap), icon: Activity },
          { label: "Remaining capacity", value: String(remaining), icon: CheckCircle },
          { label: "Per-call cap", value: String(Number(policy.perCallCap)), icon: Lock },
          { label: "Window start timestamp", value: String(Number(policy.windowStartTs)), icon: Clock },
          { label: "Velocity window (seconds)", value: String(Number(policy.velocityWindowSeconds)), icon: Clock },
          { label: "Allowed destinations", value: destinations.length ? destinations.map((d) => d.toBase58()).join("\n") : "No constraints applied.", icon: ExternalLink },
        ];
        const copyValue = async (label: string, value: string) => {
          try {
            await navigator.clipboard.writeText(value);
            setCopiedField(label);
            window.setTimeout(() => setCopiedField((current) => current === label ? null : current), 1600);
          } catch {
            setError("Clipboard access failed. Please copy the value manually.");
          }
        };
        return (
          <div className="policy-backdrop-enter fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-zinc-100/90 px-3 pb-4 pt-16 backdrop-blur-2xl sm:items-center sm:px-6 sm:py-12 sm:pt-12 dark:bg-[#080808]/85" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPolicy(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="policy-modal-title" className="policy-modal-enter relative my-auto flex max-h-[calc(100dvh-6rem)] w-full max-w-5xl sm:max-h-[min(84dvh,800px)] flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_100px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.03] dark:border-white/[0.12] dark:bg-[#111111] dark:shadow-[0_28px_100px_rgba(0,0,0,0.55)] dark:ring-white/[0.04]">
              {/* Landscape modal header */}
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-[#262626] sm:px-7 sm:py-5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500"><ShieldCheck size={13} /> On-chain policy</div>
                    <h2 id="policy-modal-title" className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">Policy <span className="text-zinc-400">/</span> {formatAddress(policy.pubkey)}</h2>
                    <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">Devnet · Full addresses, permissions and usage</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider sm:inline-flex ${status.border} ${status.bg} ${status.color}`}><ModalStatusIcon size={13} /> {status.label}</span>
                  <button type="button" onClick={() => setSelectedPolicy(null)} aria-label="Close policy details" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 dark:border-[#303030] dark:hover:bg-[#202020]"><X size={16} /></button>
                </div>
              </div>

              {/* Two-column landscape layout; the body scrolls independently. */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                <div className="mb-4 flex sm:hidden">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${status.border} ${status.bg} ${status.color}`}><ModalStatusIcon size={13} /> {status.label}</span>
                </div>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-5">
                  {/* Left column: status, logos and velocity visualization */}
                  <div className="min-w-0 space-y-4">
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-[#292929] dark:bg-[#171717]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${policy.paused ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300" : pulled >= cap ? "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"}`}><ModalStatusIcon size={20} /></span>
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">Policy status</p>
                            <p className={`mt-1 text-sm font-bold ${status.color}`}>{status.label}</p>
                          </div>
                        </div>
                        <span className="rounded-lg border border-white/80 bg-white/70 px-3 py-2 text-[10px] text-zinc-500 dark:border-[#333333] dark:bg-[#111111]/70 dark:text-zinc-400">{destinations.length} destination{destinations.length === 1 ? "" : "s"}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#292929] dark:bg-[#171717] sm:p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400"><Activity size={14} /><p className="text-[9px] font-bold uppercase tracking-[0.15em]">Velocity cap</p></div>
                          <p className="mt-2 max-w-full break-all font-mono text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-xl">{pulled.toLocaleString()} <span className="text-xs font-normal text-zinc-400">/ {cap.toLocaleString()}</span></p>
                          <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">{remaining.toLocaleString()} units remaining</p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full [--policy-ring-track:#e4e4e7] dark:[--policy-ring-track:#27272a] sm:h-14 sm:w-14" style={{ background: `conic-gradient(${policy.paused ? "#f59e0b" : pulled >= cap ? "#f43f5e" : "#10b981"} ${usedPercent}%, var(--policy-ring-track, #e4e4e7) ${usedPercent}% 100%)` }}>
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-mono text-[9px] font-bold text-zinc-800 dark:bg-[#151515] dark:text-zinc-100 sm:h-11 sm:w-11">{usedPercent.toFixed(0)}%</div>
                        </div>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="progressbar" aria-label="Velocity cap usage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={usedPercent}>
                        <div className={`h-full rounded-full transition-all duration-700 ${policy.paused ? "bg-amber-500" : pulled >= cap ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${usedPercent}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-zinc-400 dark:text-zinc-500"><span>0 used</span><span>{remaining.toLocaleString()} left</span><span>{cap.toLocaleString()} cap</span></div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 dark:border-[#292929] dark:bg-[#171717]">
                        <div className="mb-2 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><UserRound size={15} /></span><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Human wallet</span></div>
                        <p className="break-all font-mono text-[10px] leading-5 text-zinc-700 dark:text-zinc-300">{policy.human.toBase58()}</p>
                        <button type="button" onClick={() => void copyValue("Human address", policy.human.toBase58())} className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800">{copiedField === "Human address" ? <Check size={11} /> : <Copy size={11} />}{copiedField === "Human address" ? "Copied" : "Copy address"}</button>
                      </div>
                      <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 dark:border-[#292929] dark:bg-[#171717]">
                        <div className="mb-2 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><Bot size={15} /></span><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Agent wallet</span></div>
                        <p className="break-all font-mono text-[10px] leading-5 text-zinc-700 dark:text-zinc-300">{policy.agent.toBase58()}</p>
                        <button type="button" onClick={() => void copyValue("Agent address", policy.agent.toBase58())} className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800">{copiedField === "Agent address" ? <Check size={11} /> : <Copy size={11} />}{copiedField === "Agent address" ? "Copied" : "Copy address"}</button>
                      </div>
                    </div>
                  </div>

                  {/* Right column: all decoded policy data */}
                  <div className="min-w-0">
                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-[#292929]">
                      <div className="pb-3"><h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Policy parameters</h3><p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">Configuration and limits</p></div>
                      <a href={`https://explorer.solana.com/address/${policy.pubkey}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 border-b-2 border-zinc-900 px-2 pb-3 text-[10px] font-semibold text-zinc-800 transition hover:text-violet-600 dark:border-zinc-100 dark:text-zinc-200 dark:hover:text-violet-300"><ExternalLink size={12} /> Solana Explorer</a>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {allFields.map(({ label, value, icon: FieldIcon }) => (
                        <div key={label} className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 dark:border-[#292929] dark:bg-[#171717]">
                          <div className="mb-2 flex items-center justify-between gap-2"><p className="flex min-w-0 items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400"><FieldIcon size={12} className="shrink-0" />{label}</p>{label === "Policy address" && <button type="button" onClick={() => void copyValue(label, value)} className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-semibold text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label={`Copy ${label}`}>{copiedField === label ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}{copiedField === label ? "Copied" : "Copy"}</button>}</div>
                          <p className="min-w-0 break-all whitespace-pre-wrap [overflow-wrap:anywhere] font-mono text-[10px] leading-5 text-zinc-800 dark:text-zinc-200">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
      })()}
    </div>
  );
}
