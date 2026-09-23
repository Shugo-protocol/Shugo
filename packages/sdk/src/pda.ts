import { PublicKey } from "@solana/web3.js";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  DELEGATE_BASE_SEED,
  EVENT_AUTHORITY_SEED,
  GUARD_PROGRAM_ID,
  POLICY_SEED,
  SUBSCRIPTIONS_PROGRAM_ID,
  SUBSCRIPTION_AUTHORITY_SEED,
} from "./constants.js";

function u64LE(value: bigint): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(value, 0);
  return b;
}

/** Our own Policy PDA. seeds = ["policy", human, mint, policy_id_le] under GUARD_PROGRAM_ID. */
export function derivePolicyAddress(human: PublicKey, mint: PublicKey, policyId: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POLICY_SEED, human.toBuffer(), mint.toBuffer(), u64LE(policyId)],
    GUARD_PROGRAM_ID,
  );
}

/**
 * S&A's SubscriptionAuthority PDA.
 * seeds = [SubscriptionAuthority::SEED, user, mint] — confirmed from
 * tests/integration-tests/src/utils/pda.rs.
 */
export function deriveSubscriptionAuthorityAddress(user: PublicKey, mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SUBSCRIPTION_AUTHORITY_SEED, user.toBuffer(), mint.toBuffer()],
    SUBSCRIPTIONS_PROGRAM_ID,
  );
}

/**
 * S&A's Delegation PDA.
 * seeds = [DELEGATE_BASE_SEED, subscription_authority, delegator, delegatee, nonce_le]
 * — confirmed from the same pda.rs.
 */
export function deriveDelegationAddress(
  subscriptionAuthority: PublicKey,
  delegator: PublicKey,
  delegatee: PublicKey,
  nonce: bigint,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [DELEGATE_BASE_SEED, subscriptionAuthority.toBuffer(), delegator.toBuffer(), delegatee.toBuffer(), u64LE(nonce)],
    SUBSCRIPTIONS_PROGRAM_ID,
  );
}

/**
 * S&A's fixed event-authority PDA. Single seed, no per-mint or per-user
 * variation — confirmed from event_engine.rs's `event_authority_pda` module.
 */
export function deriveEventAuthorityAddress(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([EVENT_AUTHORITY_SEED], SUBSCRIPTIONS_PROGRAM_ID);
}

/**
 * The Associated Token Account address for (owner, mint, tokenProgram).
 * Hand-derived for the same reason `ASSOCIATED_TOKEN_PROGRAM_ID` is
 * hardcoded in constants.ts — see that comment.
 */
export function deriveAssociatedTokenAddress(owner: PublicKey, mint: PublicKey, tokenProgram: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}