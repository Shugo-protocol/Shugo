export default function PrivacyPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#FFFFFF] dark:bg-[#0C0C0C] text-zinc-500 dark:text-zinc-400 font-mono lowercase transition-colors px-6 py-24">
      <div className="max-w-3xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">
          privacy policy
        </h1>

        <section className="space-y-4 leading-relaxed">
          <h2 className="text-lg font-bold text-black dark:text-white">1. data collection</h2>
          <p>
            shugo is a decentralized, on-chain protocol built on solana. we do not collect, store, or process personal data. all policy delegations and transactions occur entirely on-chain and are publicly verifiable on the solana ledger.
          </p>
        </section>

        <section className="space-y-4 leading-relaxed">
          <h2 className="text-lg font-bold text-black dark:text-white">2. local telemetry</h2>
          <p>
            the shugo cli and sdk operate strictly within your local environment or the environment of your authorized ai agents. no telemetry, usage statistics, or private keys are transmitted to shugo servers.
          </p>
        </section>

        <section className="space-y-4 leading-relaxed">
          <h2 className="text-lg font-bold text-black dark:text-white">3. third-party agents</h2>
          <p>
            when you delegate allowances to an ai agent, you are subject to the privacy policies of the framework powering that agent. shugo is only responsible for enforcing the cryptographic boundaries of the transaction.
          </p>
        </section>
        
        <p className="pt-12 text-sm">last updated: september 2026</p>
      </div>
    </main>
  );
}