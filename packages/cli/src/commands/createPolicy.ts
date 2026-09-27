import type { Command } from "commander";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";

import { createPolicyAndDelegation } from "@shugo/sdk";

import { DEFAULT_KEYPAIR_PATH, createConnection, loadKeypair } from "../config.js";
import { fetchMintDecimals, toBaseUnits } from "../format.js";

export function registerCreatePolicyCommand(program: Command): void {
  program
    .command("create-policy")
    .description("Create a new policy and register it as delegatee on a real Subscriptions & Allowances delegation")
    .requiredOption("--mint <address>", "the token mint this policy governs")
    .requiredOption("--agent <address>", "the only signer allowed to call `pull` against this policy")
    .requiredOption("--per-call-cap <amount>", "max amount per pull, in the mint's UI units (e.g. 50.5)")
    .requiredOption("--velocity-cap <amount>", "max total amount per rolling window, in UI units")
    .requiredOption("--velocity-window-seconds <seconds>", "length of the rolling window, in seconds")
    .requiredOption("--destinations <addresses>", "comma-separated allowed receiver token accounts")
    .requiredOption("--delegation-amount <amount>", "total allowance for the underlying S&A delegation, in UI units")
    .requiredOption("--delegation-expiry-days <days>", "days from now until the underlying delegation expires")
    .option("--policy-id <id>", "distinguishes multiple policies for the same (human, mint)", "0")
    .option("-k, --keypair <path>", "path to the HUMAN's keypair file", DEFAULT_KEYPAIR_PATH)
    .option("-u, --url <url>", "devnet | mainnet | localnet | a raw RPC URL", "devnet")
    .action(async (opts) => {
      const connection = createConnection(opts.url);
      const human = loadKeypair(opts.keypair);
      const mint = new PublicKey(opts.mint);
      const decimals = await fetchMintDecimals(connection, mint);

      const destinations = String(opts.destinations)
        .split(",")
        .map((s: string) => new PublicKey(s.trim()));

      const { transaction, policy, delegation, subscriptionAuthority } = await createPolicyAndDelegation({
        connection,
        human: human.publicKey,
        mint,
        agent: new PublicKey(opts.agent),
        perCallCap: toBaseUnits(opts.perCallCap, decimals),
        velocityCap: toBaseUnits(opts.velocityCap, decimals),
        velocityWindowSeconds: BigInt(opts.velocityWindowSeconds),
        destinations,
        delegationAmount: toBaseUnits(opts.delegationAmount, decimals),
        delegationExpiryUnixSeconds: BigInt(
          Math.floor(Date.now() / 1000) + Number(opts.delegationExpiryDays) * 86_400,
        ),
        policyId: BigInt(opts.policyId),
      });

      transaction.feePayer = human.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signature = await sendAndConfirmTransaction(connection, transaction, [human]);

      console.log("Policy created.");
      console.log(`  policy:                 ${policy.toBase58()}`);
      console.log(`  delegation:             ${delegation.toBase58()}`);
      console.log(`  subscription authority: ${subscriptionAuthority.toBase58()}`);
      console.log(`  signature:              ${signature}`);
    });
}