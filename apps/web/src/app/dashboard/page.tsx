"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, Shield, Activity, AlertOctagon, 
  Wallet, RefreshCw, Lock, ArrowRight, Pause, XCircle
} from "lucide-react";

// dummy data to simulate sdk 
const MOCK_POLICY = {
  pda: "7v9Q...X2mP",
  agent: "AgNt9w8xyz...3K1p",
  treasury: "TrSry5...9qZf",
  status: "active", 
  epochLength: "24h",
  resetTime: "04h:22m:18s",
  spend: {
    current: 2.4,
    max: 10.0,
    symbol: "SOL",
  },
  allowedPrograms: [
    { name: "jupiter v6", id: "JUP6LkbZbjS1jKKwapdH67yIeEAaWEyw1Vp" },
    { name: "raydium cpmm", id: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C" }
  ]
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [policyData, setPolicyData] = useState<typeof MOCK_POLICY | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setTimeout(() => {
      setPolicyData(MOCK_POLICY);
      setIsSearching(false);
    }, 800);
  };

  const spendPercentage = policyData 
    ? (policyData.spend.current / policyData.spend.max) * 100 
    : 0;

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#FFFFFF] dark:bg-[#0C0C0C] text-black dark:text-white font-mono lowercase transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">guardrail command center</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">inspect policies, monitor velocity caps, and manage delegation.</p>
          </div>

          <button className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-bold hover:opacity-80 transition-opacity rounded-sm">
            <Wallet size={16} />
            <span>connect wallet</span>
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative mb-12 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="paste policy pda or agent pubkey to inspect..."
            className="w-full bg-[#FAFAFA] dark:bg-[#111111] border border-zinc-200 dark:border-[#222] text-sm sm:text-base px-12 py-4 outline-none focus:border-[#14F195] transition-colors placeholder:text-zinc-500 shadow-sm"
          />
          <button 
            type="submit"
            disabled={!searchQuery.trim() || isSearching}
            className="absolute inset-y-2 right-2 px-6 bg-[#EAEAEA] dark:bg-[#222] hover:bg-[#D4D4D4] dark:hover:bg-[#333] text-black dark:text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? <RefreshCw size={14} className="animate-spin" /> : "inspect"}
          </button>
        </form>

        {!policyData ? (
          <div className="border border-dashed border-zinc-300 dark:border-[#333] rounded-lg p-12 flex flex-col items-center justify-center text-zinc-500">
            <Shield size={32} className="mb-4 opacity-50" />
            <span className="text-sm">no policy loaded. query an address to view live limits.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Main Diagnostics*/}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              
              {/* Velocity Cap */}
              <div className="bg-[#FAFAFA] dark:bg-[#111111] border border-zinc-200 dark:border-[#222] p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-black dark:text-white font-bold">
                    <Activity size={18} />
                    <span>epoch velocity gauge</span>
                  </div>
                  <div className="text-xs bg-zinc-200 dark:bg-[#222] text-zinc-600 dark:text-zinc-400 px-2 py-1 border border-zinc-300 dark:border-[#333]">
                    reset in: {policyData.resetTime}
                  </div>
                </div>

                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-bold text-black dark:text-white tracking-tight">
                    {policyData.spend.current} <span className="text-lg text-zinc-500">{policyData.spend.symbol}</span>
                  </span>
                  <span className="text-sm text-zinc-500">
                    max {policyData.spend.max} {policyData.spend.symbol} / {policyData.epochLength}
                  </span>
                </div>

                <div className="w-full h-3 bg-zinc-200 dark:bg-[#222] rounded-full overflow-hidden relative border border-zinc-300 dark:border-[#333]">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] transition-all duration-1000 ease-out"
                    style={{ width: `${spendPercentage}%` }}
                  />
                </div>
                
                {spendPercentage > 80 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-3 flex items-center gap-1.5 mt-4">
                    <AlertOctagon size={12} /> warning: agent is approaching epoch velocity cap.
                  </p>
                )}
              </div>

              <div className="bg-[#FAFAFA] dark:bg-[#111111] border border-zinc-200 dark:border-[#222] p-6 sm:p-8">
                <div className="flex items-center gap-2 text-black dark:text-white font-bold mb-6">
                  <Lock size={18} />
                  <span>cpi execution bounds</span>
                </div>
                
                <div className="space-y-3">
                  <div className="text-xs text-zinc-500 mb-2 border-b border-zinc-200 dark:border-[#222] pb-2">allowed target programs</div>
                  {policyData.allowedPrograms.map((prog, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-[#222] gap-2">
                      <span className="text-sm font-semibold">{prog.name}</span>
                      <span className="text-xs text-zinc-500 truncate max-w-[200px] sm:max-w-none">{prog.id}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="space-y-6">

              <div className="bg-[#FAFAFA] dark:bg-[#111111] border border-zinc-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-sm">status</span>
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20 text-xs font-bold uppercase tracking-wider">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14F195] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#14F195]"></span>
                    </span>
                    {policyData.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">policy pda</div>
                    <div className="font-medium text-sm text-black dark:text-white">{policyData.pda}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">treasury vault</div>
                    <div className="font-medium text-sm text-black dark:text-white flex items-center justify-between">
                      {policyData.treasury}
                      <Link href={`https://explorer.solana.com/address/${policyData.treasury}?cluster=devnet`} target="_blank">
                        <ArrowRight size={14} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors" />
                      </Link>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">agent delegate key</div>
                    <div className="font-medium text-sm text-black dark:text-white">{policyData.agent}</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 p-6">
                <div className="font-bold text-red-500 text-sm mb-4">danger zone</div>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 bg-transparent border border-red-500/50 hover:bg-red-500/10 text-red-500 px-4 py-2.5 text-sm font-bold transition-colors">
                    <Pause size={14} /> pause agent
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 text-sm font-bold transition-colors">
                    <XCircle size={14} /> revoke policy
                  </button>
                  <p className="text-[10px] text-red-500/70 text-center leading-relaxed">
                    revocation permanently burns the on-chain allowance mapping. agent will immediately fail to sign cpi transactions.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}