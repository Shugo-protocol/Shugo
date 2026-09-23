import type { PublicKey } from "@solana/web3.js";

import { MAX_DESTINATIONS } from "./constants.js";
import { ByteReader } from "./layout.js";

export interface PolicyAccount {
  human: PublicKey;
  agent: PublicKey;
  mint: PublicKey;
  perCallCap: bigint;
  velocityCap: bigint;
  velocityWindowSeconds: bigint;
  windowStartTs: bigint;
  windowPulled: bigint;
  /** Fixed-length MAX_DESTINATIONS array — only the first `destinationCount` entries are meaningful. */
  destinations: PublicKey[];
  destinationCount: number;
  paused: boolean;
  bump: number;
  policyId: bigint;
}

/**
 * Decodes a Policy account's raw data. Skips the 8-byte Anchor discriminator
 * at the front; every field after that matches `Policy` in state.rs, in the
 * same order, field for field.
 */
export function decodePolicy(data: Buffer): PolicyAccount {
  const r = new ByteReader(data.subarray(8));

  const human = r.pubkey();
  const agent = r.pubkey();
  const mint = r.pubkey();
  const perCallCap = r.u64();
  const velocityCap = r.u64();
  const velocityWindowSeconds = r.i64();
  const windowStartTs = r.i64();
  const windowPulled = r.u64();

  const destinations: PublicKey[] = [];
  for (let i = 0; i < MAX_DESTINATIONS; i++) destinations.push(r.pubkey());

  const destinationCount = r.u8();
  const paused = r.bool();
  const bump = r.u8();
  const policyId = r.u64();

  return {
    human,
    agent,
    mint,
    perCallCap,
    velocityCap,
    velocityWindowSeconds,
    windowStartTs,
    windowPulled,
    destinations,
    destinationCount,
    paused,
    bump,
    policyId,
  };
}

/** Only the destinations actually in use — trims the fixed-size array down to `destinationCount`. */
export function activeDestinations(policy: PolicyAccount): PublicKey[] {
  return policy.destinations.slice(0, policy.destinationCount);
}