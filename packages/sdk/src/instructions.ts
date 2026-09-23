import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import type { AccountMeta } from "@solana/web3.js";

import {
  EXECUTE_PULL_DISC,
  GUARD_PROGRAM_ID,
  INIT_POLICY_DISC,
  SA_CREATE_FIXED_DELEGATION_DISC,
  SA_INITIALIZE_SUBSCRIPTION_AUTHORITY_DISC,
  SET_PAUSED_DISC,
  SUBSCRIPTIONS_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  UPDATE_POLICY_DISC,
} from "./constants.js";
import { ByteWriter } from "./layout.js";

// ---------------------------------------------------------------------
// Our own program. Account orders below match, field for field, the
// `#[derive(Accounts)]` structs in programs/guard/src/instructions/*.rs.
// ---------------------------------------------------------------------

export interface InitPolicyParams {
  human: PublicKey;
  mint: PublicKey;
  policy: PublicKey;
  policyId: bigint;
  agent: PublicKey;
  perCallCap: bigint;
  velocityCap: bigint;
  velocityWindowSeconds: bigint;
  destinations: PublicKey[];
}

/** Matches `InitPolicy`: human, mint, policy, system_program. */
export function buildInitPolicyInstruction(p: InitPolicyParams): TransactionInstruction {
  const data = new ByteWriter()
    .bytes(INIT_POLICY_DISC)
    .u64(p.policyId)
    .pubkey(p.agent)
    .u64(p.perCallCap)
    .u64(p.velocityCap)
    .i64(p.velocityWindowSeconds)
    .vecPubkey(p.destinations)
    .build();

  return new TransactionInstruction({
    programId: GUARD_PROGRAM_ID,
    keys: [
      { pubkey: p.human, isSigner: true, isWritable: true },
      { pubkey: p.mint, isSigner: false, isWritable: false },
      { pubkey: p.policy, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export interface ExecutePullParams {
  agent: PublicKey;
  policy: PublicKey;
  delegation: PublicKey;
  subscriptionAuthority: PublicKey;
  delegatorAta: PublicKey;
  receiverAta: PublicKey;
  mint: PublicKey;
  eventAuthority: PublicKey;
  amount: bigint;
  destination: PublicKey;
  /** Token-2022 transfer-hook accounts. Always [] today — see extensions.ts. */
  extraAccounts?: AccountMeta[];
}

/**
 * Matches `ExecutePull`: agent, policy, delegation, subscription_authority,
 * delegator_ata, receiver_ata, mint, token_program, event_authority,
 * subscriptions_program, [+ remaining accounts].
 */
export function buildExecutePullInstruction(p: ExecutePullParams): TransactionInstruction {
  const data = new ByteWriter().bytes(EXECUTE_PULL_DISC).u64(p.amount).pubkey(p.destination).build();

  return new TransactionInstruction({
    programId: GUARD_PROGRAM_ID,
    keys: [
      { pubkey: p.agent, isSigner: true, isWritable: false },
      { pubkey: p.policy, isSigner: false, isWritable: true },
      { pubkey: p.delegation, isSigner: false, isWritable: true },
      { pubkey: p.subscriptionAuthority, isSigner: false, isWritable: true },
      { pubkey: p.delegatorAta, isSigner: false, isWritable: true },
      { pubkey: p.receiverAta, isSigner: false, isWritable: true },
      { pubkey: p.mint, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: p.eventAuthority, isSigner: false, isWritable: false },
      { pubkey: SUBSCRIPTIONS_PROGRAM_ID, isSigner: false, isWritable: false },
      ...(p.extraAccounts ?? []),
    ],
    data,
  });
}

/** Matches `SetPaused`: human, policy. The kill switch — pause and resume are the same call. */
export function buildSetPausedInstruction(human: PublicKey, policy: PublicKey, paused: boolean): TransactionInstruction {
  const data = new ByteWriter().bytes(SET_PAUSED_DISC).bool(paused).build();

  return new TransactionInstruction({
    programId: GUARD_PROGRAM_ID,
    keys: [
      { pubkey: human, isSigner: true, isWritable: false },
      { pubkey: policy, isSigner: false, isWritable: true },
    ],
    data,
  });
}

export interface UpdatePolicyParams {
  human: PublicKey;
  policy: PublicKey;
  agent: PublicKey;
  perCallCap: bigint;
  velocityCap: bigint;
  velocityWindowSeconds: bigint;
  destinations: PublicKey[];
}

/** Matches `UpdatePolicy`: human, policy. Configuration only — see the Rust doc comment on why. */
export function buildUpdatePolicyInstruction(p: UpdatePolicyParams): TransactionInstruction {
  const data = new ByteWriter()
    .bytes(UPDATE_POLICY_DISC)
    .pubkey(p.agent)
    .u64(p.perCallCap)
    .u64(p.velocityCap)
    .i64(p.velocityWindowSeconds)
    .vecPubkey(p.destinations)
    .build();

  return new TransactionInstruction({
    programId: GUARD_PROGRAM_ID,
    keys: [
      { pubkey: p.human, isSigner: true, isWritable: false },
      { pubkey: p.policy, isSigner: false, isWritable: true },
    ],
    data,
  });
}

// ---------------------------------------------------------------------
// Subscriptions & Allowances — only the two setup instructions we need.
// `transfer_fixed` is never called from here; it's only ever reached via
// our own program's CPI, never directly by the SDK.
// ---------------------------------------------------------------------

/**
 * Matches the real account order confirmed from
 * `initialize_subscription_authority_action_with_sponsor` in the S&A test
 * suite: user, subscription_authority, mint, user_ata, system_program,
 * token_program. Data is the one discriminator byte, nothing else.
 */
export function buildInitializeSubscriptionAuthorityInstruction(
  user: PublicKey,
  mint: PublicKey,
  subscriptionAuthority: PublicKey,
  userAta: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: SUBSCRIPTIONS_PROGRAM_ID,
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: subscriptionAuthority, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([SA_INITIALIZE_SUBSCRIPTION_AUTHORITY_DISC]),
  });
}

export interface CreateFixedDelegationParams {
  delegator: PublicKey;
  subscriptionAuthority: PublicKey;
  delegation: PublicKey;
  /** The Policy PDA — this is what makes it OUR policy that gets consulted on every pull. */
  delegatee: PublicKey;
  nonce: bigint;
  amount: bigint;
  expiryTs: bigint;
  /**
   * Must match the SubscriptionAuthority's real, current `init_id` — S&A
   * rejects a mismatch. Callers reading a freshly-created authority can
   * safely pass 0n; anything else needs the decoded real value (not yet
   * implemented on our side — see the TODO in highLevel.ts).
   */
  expectedSubscriptionAuthorityInitId: bigint;
}

/**
 * Matches the real account order confirmed from `CreateDelegation::instruction`:
 * delegator, subscription_authority, delegation, delegatee (NOT a signer at
 * creation time — only at transfer time), system_program.
 */
export function buildCreateFixedDelegationInstruction(p: CreateFixedDelegationParams): TransactionInstruction {
  const data = new ByteWriter()
    .u8(SA_CREATE_FIXED_DELEGATION_DISC)
    .u64(p.nonce)
    .u64(p.amount)
    .i64(p.expiryTs)
    .i64(p.expectedSubscriptionAuthorityInitId)
    .build();

  return new TransactionInstruction({
    programId: SUBSCRIPTIONS_PROGRAM_ID,
    keys: [
      { pubkey: p.delegator, isSigner: true, isWritable: true },
      { pubkey: p.subscriptionAuthority, isSigner: false, isWritable: true },
      { pubkey: p.delegation, isSigner: false, isWritable: true },
      { pubkey: p.delegatee, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}