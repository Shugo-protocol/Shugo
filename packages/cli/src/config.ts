import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

/** Matches solana-cli's own default keypair location. */
export const DEFAULT_KEYPAIR_PATH = join(homedir(), ".config", "solana", "id.json");

/**
 * Loads a Solana CLI-format keypair file — a JSON array of bytes, the same
 * format every `solana-keygen new`-created file uses. Not our own format;
 * the ecosystem standard, so any existing keypair file just works.
 */
export function loadKeypair(path: string = DEFAULT_KEYPAIR_PATH): Keypair {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(`couldn't read keypair file at ${path}: ${(err as Error).message}`);
  }

  let bytes: unknown;
  try {
    bytes = JSON.parse(raw);
  } catch {
    throw new Error(`${path} doesn't look like a Solana CLI keypair file (expected a JSON byte array)`);
  }
  if (!Array.isArray(bytes)) {
    throw new Error(`${path} doesn't look like a Solana CLI keypair file (expected a JSON byte array)`);
  }

  return Keypair.fromSecretKey(Uint8Array.from(bytes as number[]));
}

const CLUSTER_ALIASES: Record<string, string> = {
  devnet: clusterApiUrl("devnet"),
  testnet: clusterApiUrl("testnet"),
  mainnet: clusterApiUrl("mainnet-beta"),
  "mainnet-beta": clusterApiUrl("mainnet-beta"),
  localnet: "http://127.0.0.1:8899",
  localhost: "http://127.0.0.1:8899",
};

/** Resolves --url "devnet" | "mainnet" | "localnet" | a raw RPC URL, case-insensitively. */
export function resolveRpcUrl(value: string): string {
  return CLUSTER_ALIASES[value.toLowerCase()] ?? value;
}

export function createConnection(url: string): Connection {
  return new Connection(resolveRpcUrl(url), "confirmed");
}