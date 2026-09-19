export default function TermsPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#FFFFFF] dark:bg-[#0C0C0C] text-zinc-500 dark:text-zinc-400 font-mono lowercase transition-colors px-6 py-24">
      <div className="max-w-3xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">
          terms of service
        </h1>

        <section className="space-y-4 leading-relaxed">
          <h2 className="text-lg font-bold text-black dark:text-white">1. open source software</h2>
          <p>
            shugo is an open-source protocol provided "as is", without warranty of any kind, express or implied. by utilizing the shugo smart contracts, sdk, or cli, you assume all risks associated with decentralized networks.
          </p>
        </section>

        <section className="space-y-4 leading-relaxed">
          <h2 className="text-lg font-bold text-black dark:text-white">2. zero-custody nature</h2>
          <p>
            shugo is a zero-custody velocity limitation layer. we do not have access to your private keys, nor can we recover funds, reverse transactions, or intervene if an underlying allowed target contract is exploited.
          </p>
        </section>

        <section className="space-y-4 leading-relaxed">
          <h2 className="text-lg font-bold text-black dark:text-white">3. network fees</h2>
          <p>
            users are solely responsible for all solana network fees (gas/compute) associated with provisioning policies, executing agent pulls, and maintaining on-chain state rent.
          </p>
        </section>

        <p className="pt-12 text-sm">last updated: september 2026</p>
      </div>
    </main>
  );
}