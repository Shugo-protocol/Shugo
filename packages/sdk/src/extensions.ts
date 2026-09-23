import type { AccountMeta, Connection, PublicKey } from "@solana/web3.js";

/**
 * Extra accounts a pull needs beyond the fixed nine, for a Token-2022
 * transfer-hook mint. Returns [] today — plain SPL Token mints, and
 * Token-2022 mints with no configured hook, need nothing extra.
 *
 * TODO (Token-2022 hook support): read the mint's TransferHook extension,
 * derive its ExtraAccountMetaList PDA (seeds:
 * ["extra-account-metas", mint] under the hook program's own address —
 * the SPL transfer-hook-interface convention), and return the accounts it
 * declares. See `test_fixed_transfer_token_2022_active_transfer_hook` in
 * the subscriptions repo's test suite for the exact shape being resolved.
 *
 * This is the ONLY function that needs to change to add hook support —
 * `buildExecutePullTransaction` already spreads whatever this returns onto
 * the instruction's account list.
 */
export async function resolveExtraAccountsForMint(
  _connection: Connection,
  _mint: PublicKey,
): Promise<AccountMeta[]> {
  return [];
}

/**
 * Throws if `mint` is something this SDK can't actually handle correctly
 * yet. No-op today — every mint is accepted, matching the equivalent TODO
 * left in `init_policy.rs` on the Rust side (this check exists on neither
 * side yet; enforcing it only client-side would be a false sense of safety
 * since nothing stops a direct on-chain call from skipping it).
 *
 * TODO (mint validation): reject Token-2022 mints carrying a configured
 * TransferHook, ConfidentialTransfer, or any other extension
 * `resolveExtraAccountsForMint` doesn't yet forward accounts for.
 */
export async function checkMintSupported(_connection: Connection, _mint: PublicKey): Promise<void> {
  return;
}