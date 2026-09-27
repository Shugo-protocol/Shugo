import type { Command } from "commander";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";

import { buildExecutePullTransaction, decodePolicy } from "@shugo/sdk";

import { DEFAULT_KEYPAIR_PATH, createConnection, loadKeypair } from "../config.js";
import { fetchMintDecimals, toBaseUnits } from "../format.js";

export function registerPullCommand(program: Command): void {
  program
    .command("pull")
    .description("Pull funds through a policy — run by the AGENT, not the human")
    .requiredOption("--policy <address>", "the policy to pull against")
    .requiredOption("--delegation <address>", "the underlying S&A FixedDelegation address")
    .requiredOption("--amount <amount>", "amount to pull, in the mint's UI units")
    .requiredOption("--destination <address>", "the receiver token account — must be on the policy's allowlist")
    .option("-k, --keypair <path>", "path to the AGENT's keypair file (not the human's)", DEFAULT_KEYPAIR_PATH)
    .option("-u, --url <url>", "devnet | mainnet | localnet | a raw RPC URL", "devnet")
    .action(async (opts) => {
      const connection = createConnection(opts.url);
      const agent = loadKeypair(opts.keypair);
      const policy = new PublicKey(opts.policy);
      const delegation = new PublicKey(opts.delegation);
      const destination = new PublicKey(opts.destination);

      const raw = await connection.getAccountInfo(policy);
      if (raw === null) throw new Error(`no policy account found at ${policy.toBase58()}`);
      const decimals = await fetchMintDecimals(connection, decodePolicy(raw.data).mint);

      const { transaction } = await buildExecutePullTransaction({
        connection,
        agent: agent.publicKey,
        policy,
        delegation,
        amount: toBaseUnits(opts.amount, decimals),
        destination,
      });

      transaction.feePayer = agent.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signature = await sendAndConfirmTransaction(connection, transaction, [agent]);
      console.log(`Pulled ${opts.amount} to ${destination.toBase58()}`);
      console.log(`  signature: ${signature}`);
    });
}