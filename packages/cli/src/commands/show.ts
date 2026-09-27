import type { Command } from "commander";
import { PublicKey } from "@solana/web3.js";

import { activeDestinations, decodePolicy } from "@shugo/sdk";

import { createConnection } from "../config.js";
import { fetchMintDecimals, toUiAmount } from "../format.js";

export function registerShowCommand(program: Command): void {
  program
    .command("show")
    .description("Read and display a policy's current state — no keypair needed, this is read-only")
    .argument("<policy>", "the policy address to read")
    .option("-u, --url <url>", "devnet | mainnet | localnet | a raw RPC URL", "devnet")
    .action(async (policyArg: string, opts) => {
      const connection = createConnection(opts.url);
      const policyAddress = new PublicKey(policyArg);

      const raw = await connection.getAccountInfo(policyAddress);
      if (raw === null) throw new Error(`no policy account found at ${policyAddress.toBase58()}`);
      const policy = decodePolicy(raw.data);
      const decimals = await fetchMintDecimals(connection, policy.mint);

      console.log(`Policy ${policyAddress.toBase58()}`);
      console.log(`  human:              ${policy.human.toBase58()}`);
      console.log(`  agent:              ${policy.agent.toBase58()}`);
      console.log(`  mint:               ${policy.mint.toBase58()}`);
      console.log(`  paused:             ${policy.paused}`);
      console.log(`  per-call cap:       ${toUiAmount(policy.perCallCap, decimals)}`);
      console.log(
        `  velocity cap:       ${toUiAmount(policy.velocityCap, decimals)} per ${policy.velocityWindowSeconds}s`,
      );
      console.log(`  pulled this window: ${toUiAmount(policy.windowPulled, decimals)}`);
      console.log("  destinations:");
      for (const d of activeDestinations(policy)) console.log(`    - ${d.toBase58()}`);
    });
}