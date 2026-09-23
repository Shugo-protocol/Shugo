/**
 * @guard/sdk — a policy guardrail layer for Solana's Subscriptions &
 * Allowances program. See ARCHITECTURE.md for the full design; the short
 * version: a Policy PDA our program controls is registered as `delegatee`
 * on a real S&A FixedDelegation, so every pull is checked against a
 * per-call cap, a rolling velocity cap, and a destination allowlist before
 * our program CPIs into S&A's own `transfer_fixed` — none of which the
 * base program enforces on its own.
 */

export {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  GUARD_PROGRAM_ID,
  MAX_DESTINATIONS,
  SUBSCRIPTIONS_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "./constants.js";

export {
  deriveAssociatedTokenAddress,
  deriveDelegationAddress,
  deriveEventAuthorityAddress,
  derivePolicyAddress,
  deriveSubscriptionAuthorityAddress,
} from "./pda.js";

export { activeDestinations, decodePolicy } from "./decode.js";
export type { PolicyAccount } from "./decode.js";

export {
  buildCreateFixedDelegationInstruction,
  buildExecutePullInstruction,
  buildInitPolicyInstruction,
  buildInitializeSubscriptionAuthorityInstruction,
  buildSetPausedInstruction,
  buildUpdatePolicyInstruction,
} from "./instructions.js";
export type {
  CreateFixedDelegationParams,
  ExecutePullParams,
  InitPolicyParams,
  UpdatePolicyParams,
} from "./instructions.js";

export { checkMintSupported, resolveExtraAccountsForMint } from "./extensions.js";

export { buildExecutePullTransaction, createPolicyAndDelegation } from "./highLevel.js";
export type {
  CreatePolicyAndDelegationParams,
  CreatePolicyAndDelegationResult,
  ExecutePullTransactionParams,
  ExecutePullTransactionResult,
} from "./highLevel.js";