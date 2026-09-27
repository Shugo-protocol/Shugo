import type { Command } from "commander";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

import { buildSetPausedInstruction } from "@shugo/sdk";

import { DEFAULT_KEYPAIR_PATH, createConnection, loadKeypair } from "../config.js";

function registerOne(program: Command, name: "pause" | "resume", paused: boolean): void {
  program
    .command(name)
    .description(
      paused
        ? "Pause a policy — every future `pull` against it is denied until resumed"
        : "Resume a paused policy — pulls are evaluated normally again",
    )
    .requiredOption("--policy <address>", "the policy to update")
    .option("-k, --keypair <path>", "path to the HUMAN's keypair file", DEFAULT_KEYPAIR_PATH)
    .option("-u, --url <url>", "devnet | mainnet | localnet | a raw RPC URL", "devnet")
    .action(async (opts) => {
      const connection = createConnection(opts.url);
      const human = loadKeypair(opts.keypair);
      const policy = new PublicKey(opts.policy);

      const ix = buildSetPausedInstruction(human.publicKey, policy, paused);
      const tx = new Transaction().add(ix);
      tx.feePayer = human.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signature = await sendAndConfirmTransaction(connection, tx, [human]);
      console.log(`${paused ? "Paused" : "Resumed"} ${policy.toBase58()}`);
      console.log(`  signature: ${signature}`);
    });
}

export function registerPauseCommands(program: Command): void {
  registerOne(program, "pause", true);
  registerOne(program, "resume", false);
}