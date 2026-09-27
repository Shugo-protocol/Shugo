import type { Command } from "commander";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

import { buildUpdatePolicyInstruction, decodePolicy } from "@shugo/sdk";

import { DEFAULT_KEYPAIR_PATH, createConnection, loadKeypair } from "../config.js";
import { fetchMintDecimals, toBaseUnits } from "../format.js";

export function registerUpdatePolicyCommand(program: Command): void {
  program
    .command("update-policy")
    .description("Change a policy's agent, caps, or destination allowlist")
    .requiredOption("--policy <address>", "the policy to update")
    .requiredOption("--agent <address>", "the only signer allowed to call `pull` against this policy")
    .requiredOption("--per-call-cap <amount>", "max amount per pull, in the mint's UI units")
    .requiredOption("--velocity-cap <amount>", "max total amount per rolling window, in UI units")
    .requiredOption("--velocity-window-seconds <seconds>", "length of the rolling window, in seconds")
    .requiredOption("--destinations <addresses>", "comma-separated allowed receiver token accounts")
    .option("-k, --keypair <path>", "path to the HUMAN's keypair file", DEFAULT_KEYPAIR_PATH)
    .option("-u, --url <url>", "devnet | mainnet | localnet | a raw RPC URL", "devnet")
    .action(async (opts) => {
      const connection = createConnection(opts.url);
      const human = loadKeypair(opts.keypair);
      const policy = new PublicKey(opts.policy);

      const raw = await connection.getAccountInfo(policy);
      if (raw === null) throw new Error(`no policy account found at ${policy.toBase58()}`);
      const existing = decodePolicy(raw.data);
      const decimals = await fetchMintDecimals(connection, existing.mint);

      const destinations = String(opts.destinations)
        .split(",")
        .map((s: string) => new PublicKey(s.trim()));

      const ix = buildUpdatePolicyInstruction({
        human: human.publicKey,
        policy,
        agent: new PublicKey(opts.agent),
        perCallCap: toBaseUnits(opts.perCallCap, decimals),
        velocityCap: toBaseUnits(opts.velocityCap, decimals),
        velocityWindowSeconds: BigInt(opts.velocityWindowSeconds),
        destinations,
      });

      const tx = new Transaction().add(ix);
      tx.feePayer = human.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signature = await sendAndConfirmTransaction(connection, tx, [human]);
      console.log(`Updated ${policy.toBase58()}`);
      console.log(`  signature: ${signature}`);
    });
}