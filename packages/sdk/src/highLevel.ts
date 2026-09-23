import { Connection, PublicKey, Transaction } from "@solana/web3.js";

import { TOKEN_PROGRAM_ID } from "./constants.js";
import { type PolicyAccount, decodePolicy } from "./decode.js";
import { checkMintSupported, resolveExtraAccountsForMint } from "./extensions.js";
import {
  buildCreateFixedDelegationInstruction,
  buildExecutePullInstruction,
  buildInitPolicyInstruction,
  buildInitializeSubscriptionAuthorityInstruction,
} from "./instructions.js";
import {
  deriveAssociatedTokenAddress,
  deriveDelegationAddress,
  deriveEventAuthorityAddress,
  derivePolicyAddress,
  deriveSubscriptionAuthorityAddress,
} from "./pda.js";

export interface CreatePolicyAndDelegationParams {
  connection: Connection;
  /** The delegator — funds pulls and owns the policy. */
  human: PublicKey;
  mint: PublicKey;
  /** The only signer allowed to call executePull against this policy. */
  agent: PublicKey;
  perCallCap: bigint;
  velocityCap: bigint;
  velocityWindowSeconds: bigint;
  destinations: PublicKey[];
  /** The real S&A delegation's total allowance. */
  delegationAmount: bigint;
  delegationExpiryUnixSeconds: bigint;
  /** Lets one (human, mint) pair hold several independent policies. Defaults to 0n. */
  policyId?: bigint;
  delegationNonce?: bigint;
}

export interface CreatePolicyAndDelegationResult {
  transaction: Transaction;
  policy: PublicKey;
  delegation: PublicKey;
  subscriptionAuthority: PublicKey;
}

/**
 * Builds — but does not sign or send — the transaction that creates a new
 * Policy AND registers its own address as `delegatee` on a real S&A
 * FixedDelegation. That registration is the whole architecture in one
 * instruction pair: from this point on, S&A will only let the policy's PDA
 * (via our program's `execute_pull` CPI) pull against this delegation.
 *
 * Includes `initializeSubscriptionAuthority` only if `human` doesn't already
 * have one for this mint — checked on-chain, not assumed.
 */
export async function createPolicyAndDelegation(
  params: CreatePolicyAndDelegationParams,
): Promise<CreatePolicyAndDelegationResult> {
  await checkMintSupported(params.connection, params.mint);

  const policyId = params.policyId ?? 0n;
  const nonce = params.delegationNonce ?? 0n;

  const [policy] = derivePolicyAddress(params.human, params.mint, policyId);
  const [subscriptionAuthority] = deriveSubscriptionAuthorityAddress(params.human, params.mint);
  const [delegation] = deriveDelegationAddress(subscriptionAuthority, params.human, policy, nonce);

  const tx = new Transaction();

  const existingAuthority = await params.connection.getAccountInfo(subscriptionAuthority);
  let expectedInitId = 0n;
  if (existingAuthority === null) {
    const humanAta = deriveAssociatedTokenAddress(params.human, params.mint, TOKEN_PROGRAM_ID);
    tx.add(buildInitializeSubscriptionAuthorityInstruction(params.human, params.mint, subscriptionAuthority, humanAta));
  } else {
    // TODO: decode the real `init_id` from `existingAuthority.data` instead
    // of assuming 0n — we haven't written a SubscriptionAuthority decoder
    // yet (only Policy has one, in decode.ts). Safe for the common case of
    // a freshly-created authority; this path needs the real decoder before
    // it correctly handles a human who already has one from an earlier
    // policy or a direct S&A integration.
  }

  tx.add(
    buildInitPolicyInstruction({
      human: params.human,
      mint: params.mint,
      policy,
      policyId,
      agent: params.agent,
      perCallCap: params.perCallCap,
      velocityCap: params.velocityCap,
      velocityWindowSeconds: params.velocityWindowSeconds,
      destinations: params.destinations,
    }),
  );

  tx.add(
    buildCreateFixedDelegationInstruction({
      delegator: params.human,
      subscriptionAuthority,
      delegation,
      delegatee: policy,
      nonce,
      amount: params.delegationAmount,
      expiryTs: params.delegationExpiryUnixSeconds,
      expectedSubscriptionAuthorityInitId: expectedInitId,
    }),
  );

  return { transaction: tx, policy, delegation, subscriptionAuthority };
}

export interface ExecutePullTransactionParams {
  connection: Connection;
  agent: PublicKey;
  policy: PublicKey;
  delegation: PublicKey;
  amount: bigint;
  /** The receiver's token account for the policy's mint — must be on the policy's allowlist. */
  destination: PublicKey;
}

export interface ExecutePullTransactionResult {
  transaction: Transaction;
  /** The policy state this transaction was built against — useful for a caller that wants to show "here's what will be checked" before sending. */
  policyAccount: PolicyAccount;
}

/**
 * Reads the live Policy account to derive everything `execute_pull` needs,
 * then builds — does not sign or send — the pull transaction. Fetching the
 * policy first is what lets a caller build a pull from just an agent
 * keypair, a policy address, and an amount, instead of having to already
 * know the human, the mint, or any PDA by hand.
 */
export async function buildExecutePullTransaction(
  params: ExecutePullTransactionParams,
): Promise<ExecutePullTransactionResult> {
  const raw = await params.connection.getAccountInfo(params.policy);
  if (raw === null) {
    throw new Error(`no policy account found at ${params.policy.toBase58()}`);
  }
  const policyAccount = decodePolicy(raw.data);

  const [subscriptionAuthority] = deriveSubscriptionAuthorityAddress(policyAccount.human, policyAccount.mint);
  const delegatorAta = deriveAssociatedTokenAddress(policyAccount.human, policyAccount.mint, TOKEN_PROGRAM_ID);
  const [eventAuthority] = deriveEventAuthorityAddress();
  const extraAccounts = await resolveExtraAccountsForMint(params.connection, policyAccount.mint);

  const transaction = new Transaction().add(
    buildExecutePullInstruction({
      agent: params.agent,
      policy: params.policy,
      delegation: params.delegation,
      subscriptionAuthority,
      delegatorAta,
      receiverAta: params.destination,
      mint: policyAccount.mint,
      eventAuthority,
      amount: params.amount,
      destination: params.destination,
      extraAccounts,
    }),
  );

  return { transaction, policyAccount };
}