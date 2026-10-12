"use client";

import { Buffer } from "buffer";

// --- THE NUCLEAR BUFFER PATCH (ES5 TypeScript Safe) ---
if (typeof window !== "undefined" && typeof Uint8Array !== "undefined") {
  const U8P = Uint8Array.prototype as any;
  if (!U8P.writeBigUInt64LE) {
    U8P.writeBigUInt64LE = function (value: bigint, offset = 0) {
      const _32 = BigInt(32);
      const _mask = BigInt(0xffffffff);
      const lo = Number(value & _mask);
      const hi = Number((value >> _32) & _mask);
      this[offset] = lo; this[offset + 1] = lo >> 8; this[offset + 2] = lo >> 16; this[offset + 3] = lo >>> 24;
      this[offset + 4] = hi; this[offset + 5] = hi >> 8; this[offset + 6] = hi >> 16; this[offset + 7] = hi >>> 24;
      return offset + 8;
    };
  }
  if (!U8P.writeBigInt64LE) U8P.writeBigInt64LE = U8P.writeBigUInt64LE;
  if (!U8P.readBigUInt64LE) {
    U8P.readBigUInt64LE = function (offset = 0) {
      const _32 = BigInt(32);
      const lo = this[offset] | (this[offset+1]<<8) | (this[offset+2]<<16) | (this[offset+3]*0x1000000);
      const hi = this[offset+4] | (this[offset+5]<<8) | (this[offset+6]<<16) | (this[offset+7]*0x1000000);
      return BigInt(lo >>> 0) + (BigInt(hi >>> 0) << _32);
    };
  }
  if (!U8P.readBigInt64LE) {
    U8P.readBigInt64LE = function (offset = 0) {
      const _32 = BigInt(32);
      const lo = this[offset] | (this[offset+1]<<8) | (this[offset+2]<<16) | (this[offset+3]*0x1000000);
      const hi = this[offset+4] | (this[offset+5]<<8) | (this[offset+6]<<16) | (this[offset+7]<<24);
      return BigInt(lo >>> 0) + (BigInt(hi) << _32);
    };
  }
  import("buffer").then(({ Buffer }) => { window.Buffer = window.Buffer || Buffer; });
}

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { PublicKey, Keypair, Transaction } from "@solana/web3.js";
import { 
  Send, ExternalLink, CheckCircle2, AlertTriangle, 
  ArrowRight, ShieldAlert, Sliders, SlidersHorizontal, 
  PlusCircle, PauseCircle, PlayCircle, ChevronLeft, Download,
  Loader2, ShieldCheck, Zap
} from "lucide-react";
import { 
  createPolicyAndDelegation, 
  buildExecutePullTransaction, 
  buildSetPausedInstruction,
  deriveAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  GUARD_PROGRAM_ID,
  decodePolicy
} from "@shugo-protocol/sdk";

// Dynamically import Wallet button
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

type DecodedPolicy = ReturnType<typeof decodePolicy> & { pubkey: string };

function toBaseUnits(uiAmount: string, decimals: number): bigint {
  const [whole, frac = ""] = uiAmount.split(".");
  const paddedFrac = frac.slice(0, decimals).padEnd(decimals, "0");
  const combined = `${whole}${paddedFrac}`.replace(/^0+(?=\d)/, "");
  return BigInt(combined === "" ? "0" : combined);
}

export default function PlaygroundPage() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [mounted, setMounted] = useState(false);
  const [hasEnteredPlayground, setHasEnteredPlayground] = useState(false);
  const [introExiting, setIntroExiting] = useState(false);
  const [scrambledTitle, setScrambledTitle] = useState("Playground");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSig, setSuccessSig] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  // --- APP STATE ---
  const [view, setView] = useState<"home" | "create" | "manage">("home");
  const [policies, setPolicies] = useState<DecodedPolicy[]>([]);
  const [selectedPolicyKey, setSelectedPolicyKey] = useState<string | null>(null);
  
  // --- FORM STATES ---
  const [mint, setMint] = useState("");
  const [agent, setAgent] = useState("");
  const [destinations, setDestinations] = useState("");
  const [perCallCap, setPerCallCap] = useState("10");
  const [velocityCap, setVelocityCap] = useState("100");
  const [velocityWindowSeconds, setVelocityWindowSeconds] = useState("86400");
  const [delegationAmount, setDelegationAmount] = useState("500");
  const [delegationExpiryDays, setDelegationExpiryDays] = useState("30");
  const [policyId, setPolicyId] = useState("0");

  const [pullDelegation, setPullDelegation] = useState("");
  const [pullAmount, setPullAmount] = useState("5");
  const [pullDestination, setPullDestination] = useState("");

  useEffect(() => {
    setMounted(true);
    // Respect the user's saved choice first; otherwise inherit the site's current theme.
    // Do not let the operating system override a theme the user already chose.
    let nextDark = document.documentElement.classList.contains("dark");
    try {
      const savedTheme = window.localStorage.getItem("shugo-playground-theme");
      if (savedTheme === "dark") nextDark = true;
      if (savedTheme === "light") nextDark = false;
    } catch {
      // Storage may be disabled; inherit the site's theme for this session.
    }
    document.documentElement.classList.toggle("dark", nextDark);
    setIsDark(nextDark);
  }, []);

;

  // --- FETCH POLICIES ---
  const fetchPolicies = async () => {
    if (!publicKey) return;
    try {
      const accounts = await connection.getProgramAccounts(GUARD_PROGRAM_ID);
      const parsed = accounts.map((acc) => {
        try { return { pubkey: acc.pubkey.toBase58(), ...decodePolicy(acc.account.data) }; } 
        catch { return null; }
      }).filter(Boolean) as DecodedPolicy[];
      
      const myPolicies = parsed.filter(p => p.human.equals(publicKey) || p.agent.equals(publicKey));
      setPolicies(myPolicies);
    } catch (err: any) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (connected) fetchPolicies();
  }, [connected, publicKey]);

  const clearAlerts = () => { setError(null); setSuccessSig(null); };

  // --- AUTOFILL DEPLOY ---
  const handleAutoFillDeploy = () => {
    clearAlerts();
    setMint(DEVNET_USDC_MINT);
    if (publicKey) {
      setAgent(publicKey.toBase58());
      const ata = deriveAssociatedTokenAddress(publicKey, new PublicKey(DEVNET_USDC_MINT), TOKEN_PROGRAM_ID);
      setDestinations(ata.toBase58());
    } else {
      setAgent(Keypair.generate().publicKey.toBase58());
      setDestinations(Keypair.generate().publicKey.toBase58());
    }
    setPerCallCap("25"); setVelocityCap("150"); setVelocityWindowSeconds("86400"); 
    setDelegationAmount("1000"); setDelegationExpiryDays("30");
    setPolicyId(Math.floor(Math.random() * 100000).toString());
  };

  // --- DEPLOY POLICY ---
  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return setError("Connect your wallet first.");
    setLoading(true); clearAlerts();

    try {
      const mintPubkey = new PublicKey(mint.trim());
      const agentPubkey = new PublicKey(agent.trim());
      const destPubkeys = destinations.split(",").map((d) => d.trim()).filter(Boolean).map((d) => new PublicKey(d));

      let decimals = 6;
      try {
        const info = await connection.getParsedAccountInfo(mintPubkey);
        if (info.value && "parsed" in info.value.data) decimals = info.value.data.parsed.info.decimals;
      } catch {}

      const { transaction, policy, delegation } = await createPolicyAndDelegation({
        connection, human: publicKey, mint: mintPubkey, agent: agentPubkey,
        perCallCap: toBaseUnits(perCallCap, decimals), velocityCap: toBaseUnits(velocityCap, decimals),
        velocityWindowSeconds: BigInt(velocityWindowSeconds), destinations: destPubkeys,
        delegationAmount: toBaseUnits(delegationAmount, decimals),
        delegationExpiryUnixSeconds: BigInt(Math.floor(Date.now() / 1000) + Number(delegationExpiryDays) * 86400),
        policyId: BigInt(policyId || "0"),
      });

      transaction.feePayer = publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signature = await sendTransaction(transaction, connection);
      
      setSuccessSig(signature);
      setPullDelegation(delegation.toBase58());
      setPullDestination(destPubkeys[0].toBase58());
      setSelectedPolicyKey(policy.toBase58());
      
      await fetchPolicies();
      setView("manage");
    } catch (err: any) {
      setError(err?.message || "Failed to deploy. Check your Devnet SOL balance.");
    } finally { setLoading(false); }
  };

  // --- EXECUTE PULL ---
  const handlePull = async (e: React.FormEvent, policy: DecodedPolicy) => {
    e.preventDefault();
    if (!publicKey) return setError("Connect wallet.");
    setLoading(true); clearAlerts();

    try {
      let decimals = 6; 
      try {
        const info = await connection.getParsedAccountInfo(policy.mint);
        if (info.value && "parsed" in info.value.data) decimals = info.value.data.parsed.info.decimals;
      } catch {}
      
      const { transaction } = await buildExecutePullTransaction({
        connection, agent: publicKey, policy: new PublicKey(policy.pubkey),
        delegation: new PublicKey(pullDelegation.trim()),
        amount: toBaseUnits(pullAmount, decimals),
        destination: new PublicKey(pullDestination.trim())
      });

      transaction.feePayer = publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signature = await sendTransaction(transaction, connection);
      setSuccessSig(signature);
      fetchPolicies();
    } catch (err: any) {
      setError(err?.message || "Pull failed. Did you hit a cap, or forget to provide the Delegation Address?");
    } finally { setLoading(false); }
  };

  // --- PAUSE/RESUME ---
  const handleManage = async (isPausing: boolean, policy: DecodedPolicy) => {
    if (!publicKey) return setError("Connect wallet.");
    setLoading(true); clearAlerts();

    try {
      const ix = buildSetPausedInstruction(publicKey, new PublicKey(policy.pubkey), isPausing);
      const tx = new Transaction().add(ix);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signature = await sendTransaction(tx, connection);
      setSuccessSig(signature);
      fetchPolicies();
    } catch (err: any) {
      setError(err?.message || "Action failed.");
    } finally { setLoading(false); }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 5)}...${addr.slice(-5)}`;

  // Entrance and exit are both client-side state transitions; no full page reload.
  const beginIntroExit = () => {
    if (introExiting || hasEnteredPlayground) return;
    setIntroExiting(true);
    window.setTimeout(() => setHasEnteredPlayground(true), 680);
  };

  useEffect(() => {
    if (hasEnteredPlayground || !mounted || introExiting) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHasEnteredPlayground(true);
      return;
    }
    const words = ["Playground", "प्लेग्राउंड", "プレイグラウンド"];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&";
    const start = performance.now();
    const tick = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const index = Math.min(2, Math.floor(elapsed / 1200));
      const word = words[index];
      const phase = elapsed - index * 1200;
      const settled = Math.min(Array.from(word).length, Math.floor(phase / 48));
      setScrambledTitle(Array.from(word).map((char, i) => {
        if (char === " ") return " ";
        return i < settled ? char : alphabet[Math.floor(Math.random() * alphabet.length)];
      }).join(""));
    }, 45);
    const finish = window.setTimeout(beginIntroExit, 3850);
    return () => { window.clearInterval(tick); window.clearTimeout(finish); };
  }, [hasEnteredPlayground, mounted, introExiting]);

  if (!mounted) return null;

  if (!hasEnteredPlayground) {
    return (
      <section className={`opening-intro fixed inset-0 z-[100] flex h-[100vh] min-h-[100dvh] w-screen flex-col items-center justify-center overflow-hidden px-5 ${introExiting ? "is-exiting" : ""}`} style={{ backgroundColor: isDark ? "#0c0c0c" : "#ffffff", color: isDark ? "#ffffff" : "#09090b" }} aria-label="Opening playground">
        <style jsx>{`
          @keyframes intro-cover-exit { 0%, 99% { visibility:visible; } 100% { visibility:hidden; } }
          @keyframes intro-content-exit { 0% { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } 65% { opacity:.9; transform:translateY(-5px) scale(1.01); filter:blur(0); } 100% { opacity:0; transform:translateY(-10px) scale(1.025); filter:blur(3px); } }
          @keyframes object-enter {
            0% { opacity:0; transform:translate3d(var(--enter-x),var(--enter-y),-170px) rotateX(32deg) rotateY(-28deg) scale(.68); }
            68% { opacity:1; }
            100% { opacity:1; transform:translate3d(0,0,0) rotateX(0) rotateY(0) scale(1); }
          }
          @keyframes sphere-spin { from { transform:rotateY(0deg) rotateX(12deg); } to { transform:rotateY(360deg) rotateX(12deg); } }
          @keyframes cube-spin { from { transform:rotateX(-24deg) rotateY(0deg) rotateZ(-8deg); } to { transform:rotateX(336deg) rotateY(360deg) rotateZ(352deg); } }
          @keyframes torus-spin { 0% { transform:rotateX(0deg) rotateY(0deg) rotateZ(0deg); } 100% { transform:rotateX(0deg) rotateY(0deg) rotateZ(360deg); } }
          @keyframes float-sphere { 0%,100% { translate:0 0; } 50% { translate:0 -7px; } }
          @keyframes float-cube { 0%,100% { translate:0 0; } 50% { translate:0 6px; } }
          @keyframes float-torus { 0%,100% { translate:0 0; } 50% { translate:0 -5px; } }
          @keyframes reveal { from { opacity:0; transform:translate3d(0,8px,0); } to { opacity:1; transform:translate3d(0,0,0); } }
          .object-stage { display:flex; align-items:center; justify-content:space-between; gap:clamp(28px,8vw,76px); width:min(100%,350px); height:clamp(120px,25vw,160px); margin-bottom:1.8rem; perspective:1100px; perspective-origin:50% 45%; }
          .shape-slot { position:relative; display:grid; place-items:center; flex:0 0 clamp(54px,13vw,76px); width:clamp(54px,13vw,76px); height:clamp(64px,15vw,86px); min-width:0; transform-style:preserve-3d; }
          .shape { position:relative; width:clamp(48px,11vw,68px); height:clamp(48px,11vw,68px); transform-style:preserve-3d; animation:object-enter .9s cubic-bezier(.2,.75,.2,1) both; will-change:transform; }
          .sphere { --enter-x:-32px; --enter-y:14px; animation-delay:.04s; }
          .cube { --enter-x:0px; --enter-y:-18px; animation-delay:.16s; }
          .torus { --enter-x:32px; --enter-y:14px; animation-delay:.28s; }
          .sphere .shape-inner { position:absolute; inset:0; border-radius:50%; border:1px solid #777; background:radial-gradient(circle at 29% 23%,#fff 0%,#e9e9e9 13%,#bdbdbd 32%,#777 59%,#242424 100%); box-shadow:inset -12px -10px 18px rgba(0,0,0,.42),inset 4px 4px 8px rgba(255,255,255,.9),0 10px 18px rgba(0,0,0,.12); animation:float-sphere 3.2s ease-in-out infinite; }
          .sphere .shape-inner:before { content:""; position:absolute; inset:0; border-radius:50%; background:repeating-linear-gradient(0deg,transparent 0 10px,rgba(30,30,30,.17) 10px 11px),repeating-linear-gradient(90deg,transparent 0 10px,rgba(30,30,30,.14) 10px 11px); opacity:.55; transform:rotate(-18deg) scaleX(.82); animation:sphere-mesh 4.8s linear infinite; }
          @keyframes sphere-mesh { 0% { transform:rotate(-18deg) scaleX(.82); } 50% { transform:rotate(0deg) scaleX(.45); } 100% { transform:rotate(18deg) scaleX(.82); } }
          .cube .shape-inner { position:absolute; inset:7px; transform-style:preserve-3d; animation:cube-spin 6s linear infinite, float-cube 3.8s ease-in-out infinite; }
          .cube .face { position:absolute; inset:0; border:1px solid #555; backface-visibility:visible; }
          .cube .face:nth-child(1){transform:translateZ(27px);background:linear-gradient(135deg,#fff 0%,#c9c9c9 100%)}
          .cube .face:nth-child(2){transform:rotateY(180deg) translateZ(27px);background:linear-gradient(135deg,#666,#242424)}
          .cube .face:nth-child(3){transform:rotateY(90deg) translateZ(27px);background:linear-gradient(135deg,#b7b7b7,#4a4a4a)}
          .cube .face:nth-child(4){transform:rotateY(-90deg) translateZ(27px);background:linear-gradient(135deg,#eee,#777)}
          .cube .face:nth-child(5){transform:rotateX(90deg) translateZ(27px);background:linear-gradient(135deg,#fff,#999)}
          .cube .face:nth-child(6){transform:rotateX(-90deg) translateZ(27px);background:linear-gradient(135deg,#777,#292929)}
          /* Keep the ring upright and facing forward; rotate clockwise in its own plane so it reads like a vertical wheel. */
          .torus .shape-inner { position:absolute; inset:4px; border-radius:50%; background:radial-gradient(ellipse at center, transparent 0 29%, #4a4a4a 31%, #777 34%, #f8f8f8 39%, #c7c7c7 48%, #777 58%, #303030 67%, #bdbdbd 73%, #f8f8f8 80%, #555 89%, #222 100%); box-shadow:inset 0 2px 4px rgba(255,255,255,.65), 0 8px 14px rgba(0,0,0,.2); transform-style:preserve-3d; animation:torus-spin 6s linear infinite, float-torus 3.7s ease-in-out infinite; will-change:transform; }
          .torus .shape-inner:before { content:""; position:absolute; inset:2px; border-radius:50%; background:radial-gradient(ellipse at center, transparent 0 31%, rgba(255,255,255,.88) 34%, rgba(220,220,220,.55) 42%, transparent 56%); transform:translateZ(3px); }
          .torus .shape-inner:after { content:""; position:absolute; inset:11px; border-radius:50%; border:1px solid rgba(35,35,35,.6); box-shadow:inset 0 2px 5px rgba(0,0,0,.6); }
          .opening-intro.is-exiting { animation:intro-cover-exit .68s linear forwards; pointer-events:none; }
          .intro-content { width:100%; display:flex; flex-direction:column; align-items:center; }
          .opening-intro.is-exiting .intro-content { animation:intro-content-exit .64s cubic-bezier(.22,.7,.2,1) forwards; }
          .shape, .shape-inner { backface-visibility:hidden; }
          .intro-note { animation:reveal .65s ease .35s both; }
          @media(max-width:420px){ .object-stage{gap:clamp(20px,7vw,32px);width:min(100%,290px)} .cube .face:nth-child(1){transform:translateZ(22px)} .cube .face:nth-child(2){transform:rotateY(180deg) translateZ(22px)} .cube .face:nth-child(3){transform:rotateY(90deg) translateZ(22px)} .cube .face:nth-child(4){transform:rotateY(-90deg) translateZ(22px)} .cube .face:nth-child(5){transform:rotateX(90deg) translateZ(22px)} .cube .face:nth-child(6){transform:rotateX(-90deg) translateZ(22px)} }
          @media(prefers-reduced-motion:reduce){.shape,.shape-inner,.intro-note{animation:none!important}.opening-intro.is-exiting{animation:intro-cover-exit .01s linear forwards!important}.opening-intro.is-exiting .intro-content{animation:intro-content-exit .01s linear forwards!important}}
        `}</style>
        <button type="button" onClick={beginIntroExit} className="absolute right-5 top-8 z-10 text-xs opacity-70 transition hover:opacity-100" style={{ color: isDark ? "#a1a1aa" : "#52525b" }}>Skip intro <ArrowRight size={13} className="inline" /></button>
        <div className="intro-content">
        <div className="object-stage" aria-hidden="true">
          <div className="shape-slot"><div className="shape sphere"><div className="shape-inner" /></div></div>
          <div className="shape-slot"><div className="shape cube"><div className="shape-inner"><i className="face"/><i className="face"/><i className="face"/><i className="face"/><i className="face"/><i className="face"/><i className="face"/><i className="face"/></div></div></div>
          <div className="shape-slot"><div className="shape torus"><div className="shape-inner" /></div></div>
        </div>
        <h1 className="min-h-16 max-w-full text-center text-[clamp(1.7rem,6vw,3.5rem)] font-semibold tracking-[-.055em]" aria-label="Playground" aria-live="off">{scrambledTitle}</h1>
        <p className="intro-note mt-3 max-w-sm text-center text-xs leading-6" style={{ color: isDark ? "#a1a1aa" : "#52525b" }}>For hackathon judges to test. Want to build with Shugo? Read our <a className="underline underline-offset-4" style={{ color: isDark ? "#f4f4f5" : "#18181b" }} href="https://docs.shugo.website/" target="_blank" rel="noopener noreferrer">docs</a>.</p>
        </div>
      </section>
    );
  }

  const selectedPolicy = policies.find(p => p.pubkey === selectedPolicyKey);

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-white text-zinc-900 dark:bg-[#0c0c0c] dark:text-zinc-100 font-sans selection:bg-zinc-500/30 transition-colors duration-300">
      <style jsx global>{`
        @keyframes playground-text-reveal {
          from { opacity: 0; transform: translate3d(0, 10px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        /* Reveal readable text once on entry; avoid animating layout-heavy effects on hover. */
        main h1, main h2, main h3, main h4, main p, main label, main button, main a, main [data-reveal-text] {
          animation: playground-text-reveal 520ms cubic-bezier(.2,.7,.25,1) both;
          animation-delay: var(--text-reveal-delay, 0ms);
        }
        main h2 { --text-reveal-delay: 45ms; }
        main h3 { --text-reveal-delay: 75ms; }
        main p, main label { --text-reveal-delay: 90ms; }
        main a, main button { --text-reveal-delay: 110ms; }
        @media (prefers-reduced-motion: reduce) {
          main h1, main h2, main h3, main h4, main p, main label, main button, main a, main [data-reveal-text] {
            animation: none !important; opacity: 1 !important; transform: none !important;
          }
        }
      `}</style>
      {/* The fair artwork belongs only inside the hero banner, behind its logo and copy. */}
      {/* The global site navbar is rendered by the app layout. Keep playground controls below it. */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 sm:pb-12 sm:pt-28 lg:px-8">
        <div className="pointer-events-none fixed bottom-5 right-6 z-0 select-none text-[clamp(8rem,20vw,18rem)] font-black leading-none tracking-[-.08em] text-zinc-200/60 dark:text-zinc-800/55" lang="ja" aria-hidden="true">守護</div>
        <div className="relative z-10 mb-7 min-h-[250px] overflow-hidden rounded-2xl border border-white/15 pb-5 shadow-lg shadow-black/10 sm:mb-8 sm:pb-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <img
              src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1788934363/assets/hackathon/crypto-world-fair/bg-wo-logo"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-black/20" />
          </div>
          <div className="relative z-10 px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-white/75">Devnet / Hackathon demo</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl">Playground</h1>
            </div>
            <WalletMultiButton className="!h-10 !shrink-0 !rounded-xl !border !border-zinc-200 !bg-white !px-3 sm:!px-4 !text-xs sm:!text-sm !font-medium !text-zinc-900 !shadow-none transition hover:!bg-zinc-50 dark:!border-zinc-700 dark:!bg-zinc-100 dark:!text-zinc-950 dark:hover:!bg-white" />
          </div>
          <img
            alt="Crypto World's Fair"
            width={1120}
            height={320}
            decoding="async"
            className="mt-8 h-auto w-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)] sm:mt-10"
            src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1788934363/assets/hackathon/crypto-world-fair/logo-alt.png"
          />
          <p className="mt-5 max-w-2xl text-sm leading-6 text-white/90 drop-shadow-sm">For hackathon judges to test the protocol. To integrate Shugo in your own project, read our <a href="https://docs.shugo.website/" target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline decoration-white/70 underline-offset-4 transition hover:decoration-white">documentation</a>.</p>
          </div>
        </div>
        {/* --- GLOBAL ALERTS --- */}
        <div className="mb-8 empty:hidden">
          {successSig && (
            <div className="flex animate-in fade-in slide-in-from-top-4 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-sm">
              <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 size={22} className="shrink-0" /> 
                <span className="text-sm">Transaction successfully confirmed on devnet!</span>
              </div>
              <a href={`https://explorer.solana.com/tx/${successSig}?cluster=devnet`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-500/30 dark:text-emerald-400">
                View Explorer <ExternalLink size={14} />
              </a>
            </div>
          )}
          {error && (
            <div className="flex animate-in fade-in slide-in-from-top-4 items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 shadow-sm text-red-600 dark:text-red-400 mt-4">
              <AlertTriangle size={22} className="shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* --- VIEW: HOME (MY POLICIES) --- */}
        {view === "home" && (
          <div className="animate-in fade-in duration-500">
            {!connected ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-[#0c0c0c]/50 p-8 text-center shadow-sm backdrop-blur-sm">
                <div className="mb-6 rounded-full bg-zinc-100 dark:bg-zinc-900 p-6 shadow-inner">
                  <ShieldAlert size={48} className="text-zinc-400 dark:text-zinc-600" />
                </div>
                <h2 className="mb-3 text-2xl font-bold">Connect your wallet</h2>
                <p className="max-w-md text-zinc-500 dark:text-zinc-400">
                  Link your Phantom or Solflare wallet to access your existing agent policies or create new on-chain guardrails.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Active Policies</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Render Existing Policies */}
                  {policies.map(p => (
                    <div 
                      key={p.pubkey} 
                      onClick={() => { setSelectedPolicyKey(p.pubkey); setView("manage"); clearAlerts(); }} 
                      className="group relative flex min-h-[240px] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-[transform,border-color,background-color] duration-150 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
                    >
                      <div className="absolute -inset-x-4 -top-4 z-0 h-24 bg-gradient-to-b from-zinc-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      
                      <div className="relative z-10">
                        <div className="mb-6 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-zinc-500" />
                            <span className="font-mono font-bold text-lg">{formatAddress(p.pubkey)}</span>
                          </div>
                          <span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${p.paused ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                            {p.paused ? 'Paused' : 'Active'}
                          </span>
                        </div>
                        
                        <div className="space-y-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950/50">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">Authority</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {p.human.equals(publicKey!) ? "Admin (Human)" : "Spender (Agent)"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">Velocity Used</span>
                            <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                              {Number(p.windowPulled)} <span className="text-zinc-400">/ {Number(p.velocityCap)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative z-10 mt-6 flex items-center justify-end text-sm font-bold text-zinc-600 dark:text-zinc-400">
                        <span className="flex items-center gap-1 transition-transform duration-150 ease-out motion-reduce:transition-none group-hover:translate-x-0.5">
                          Manage Settings <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* Create policy after the existing active policies */}
                  <button
                    onClick={() => { setView("create"); clearAlerts(); }}
                    className="group relative flex min-h-[190px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-6 transition-[border-color,background-color] duration-150 ease-out motion-reduce:transition-none hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-zinc-500/50 dark:hover:bg-zinc-500/5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-150 ease-out motion-reduce:transition-none group-hover:scale-105 dark:bg-zinc-800"><PlusCircle size={24} className="text-zinc-600 dark:text-zinc-400" /></div>
                    <span className="text-sm font-bold tracking-wide text-zinc-700 dark:text-zinc-300">Create New Policy</span>
                    <span className="text-xs text-zinc-500">Configure a new guardrail</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: CREATE (DEPLOY) --- */}
        {view === "create" && (
          <form onSubmit={handleDeploy} className="mx-auto max-w-7xl animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button type="button" onClick={() => setView("home")} className="flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 shadow-sm border border-zinc-200 transition-all hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <ChevronLeft size={16} /> Back
              </button>
              <button type="button" onClick={handleAutoFillDeploy} className="flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-700 transition-all hover:bg-zinc-100 dark:border-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-300 dark:hover:bg-zinc-500/20">
                Fill Example Values
              </button>
            </div>

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
              {/* Section 1 */}
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111111]">
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800/50 dark:bg-zinc-900/20">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    <Sliders size={18} className="text-zinc-500" /> Core Accounts
                  </h3>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Token Mint Address</label>
                    <input type="text" required value={mint} onChange={(e) => setMint(e.target.value)} placeholder="e.g. USDC devnet address" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Agent Signer Address</label>
                    <input type="text" required value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Wallet executing pulls" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Allowed Destinations (Comma separated)</label>
                    <input type="text" required value={destinations} onChange={(e) => setDestinations(e.target.value)} placeholder="Permitted ATAs" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111111]">
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800/50 dark:bg-zinc-900/20">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    <ShieldAlert size={18} className="text-zinc-500" /> Guardrail Limits
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Per-Call Cap</label>
                    <input type="number" step="any" required value={perCallCap} onChange={(e) => setPerCallCap(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Velocity Cap</label>
                    <input type="number" step="any" required value={velocityCap} onChange={(e) => setVelocityCap(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Window (Seconds)</label>
                    <input type="number" required value={velocityWindowSeconds} onChange={(e) => setVelocityWindowSeconds(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Policy ID</label>
                    <input type="number" required value={policyId} onChange={(e) => setPolicyId(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111111]">
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800/50 dark:bg-zinc-900/20">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    <SlidersHorizontal size={18} className="text-zinc-500" /> Delegation Properties
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Total Allowance</label>
                    <input type="number" step="any" required value={delegationAmount} onChange={(e) => setDelegationAmount(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Expiry (Days)</label>
                    <input type="number" required value={delegationExpiryDays} onChange={(e) => setDelegationExpiryDays(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="group col-span-1 flex w-full items-center justify-center gap-3 self-end rounded-2xl bg-zinc-600 px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-zinc-500/20 transition-all hover:bg-zinc-700 disabled:pointer-events-none disabled:opacity-70 dark:bg-zinc-500 dark:hover:bg-zinc-600 xl:col-span-3"
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Deploying Policy...</>
                ) : (
                  <>Deploy Policy <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></>
                )}
              </button>
            </div>
          </form>
        )}

        {/* --- VIEW: MANAGE POLICY --- */}
        {view === "manage" && selectedPolicy && (
          <div className="mx-auto max-w-7xl animate-in slide-in-from-bottom-8 fade-in duration-500">
            <button onClick={() => setView("home")} className="mb-4 flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 shadow-sm border border-zinc-200 transition-all hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <ChevronLeft size={16} /> Back to Policies
            </button>

            {/* Top Status Header */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md dark:border-zinc-800 dark:bg-[#111111]">
              <div className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-zinc-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active Policy Profile</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatAddress(selectedPolicy.pubkey)}</h2>
                </div>
                
                <div className="flex w-full flex-col gap-4 sm:flex-row sm:w-auto sm:gap-8 rounded-2xl bg-zinc-50 p-4 dark:bg-[#0c0c0c]">
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Current Velocity</span>
                    <span className="font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {Number(selectedPolicy.windowPulled)} <span className="text-zinc-400">/ {Number(selectedPolicy.velocityCap)}</span>
                    </span>
                  </div>
                  <div className="hidden w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />
                  <div>
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</span>
                    <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${selectedPolicy.paused ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                      {selectedPolicy.paused ? "Paused" : "Operational"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              
              {/* Agent Tools: PULL */}
              <div className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111111]">
                <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-5 dark:border-zinc-800/50 dark:bg-zinc-900/20">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    <Download size={18} className="text-zinc-500" /> Execute Agent Pull
                  </h3>
                  {publicKey && selectedPolicy.agent.equals(publicKey) && (
                    <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400">Assigned Agent</span>
                  )}
                </div>
                
                <div className="flex-1 p-4">
                  <form onSubmit={(e) => handlePull(e, selectedPolicy)} className="grid h-full grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Delegation PDA Address <span className="text-red-500">*</span></label>
                      <input type="text" required value={pullDelegation} onChange={(e) => setPullDelegation(e.target.value)} placeholder="Enter the underlying PDA" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Destination ATA</label>
                      <input type="text" required value={pullDestination} onChange={(e) => setPullDestination(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Amount</label>
                      <input type="number" step="any" required value={pullAmount} onChange={(e) => setPullAmount(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-[#0c0c0c] dark:focus:border-zinc-500 dark:focus:bg-zinc-900" />
                    </div>
                    
                    <div className="mt-auto self-end sm:col-span-3">
                      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-600 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-700 disabled:opacity-70 dark:bg-zinc-500 dark:hover:bg-zinc-600">
                        {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Zap size={18} /> Execute Transfer</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Human Tools: ADMIN */}
              <div className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111111]">
                <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-5 dark:border-zinc-800/50 dark:bg-zinc-900/20">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    <ShieldAlert size={18} className="text-amber-500" /> Admin Controls
                  </h3>
                  {publicKey && selectedPolicy.human.equals(publicKey) && (
                    <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Admin Owner</span>
                  )}
                </div>
                
                <div className="p-4">
                  <p className="mb-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Administrative authority allows you to instantly halt agent operations. Pausing the policy denies any incoming pull requests until safely resumed.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button 
                      onClick={() => handleManage(true, selectedPolicy)} 
                      disabled={loading || selectedPolicy.paused} 
                      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 py-5 text-amber-700 transition-all hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-40 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                    >
                      <PauseCircle size={32} className="transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold uppercase tracking-widest">Pause Agent</span>
                    </button>
                    
                    <button 
                      onClick={() => handleManage(false, selectedPolicy)} 
                      disabled={loading || !selectedPolicy.paused} 
                      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 py-5 text-emerald-700 transition-all hover:bg-emerald-100 disabled:pointer-events-none disabled:opacity-40 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                    >
                      <PlayCircle size={32} className="transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold uppercase tracking-widest">Resume Policy</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}