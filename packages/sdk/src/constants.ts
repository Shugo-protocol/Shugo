import { PublicKey } from "@solana/web3.js";

/**
 * Every value below was confirmed against real source during development —
 * either the deployed `subscriptions-program` repo (grepped directly) or
 * `anchor keys sync`'s actual output for our own program — not guessed.
 * See the Rust integration tests in tests/guard-litesvm for how each was
 * obtained; these are the same values, ported, not re-derived.
 */

export const GUARD_PROGRAM_ID = new PublicKey("6gHABW3Rn5dsTdXKN2xzRdb4g9v2DjYmc9sKq1Wn8my9");

/** program/src/lib.rs:49 — declare_id!("De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44") */
export const SUBSCRIPTIONS_PROGRAM_ID = new PublicKey("De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44");

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

/**
 * The Associated Token Account program's address. Hand-derived rather than
 * pulled from `@solana/spl-token` deliberately: that package's exact export
 * names have churned across versions, and this address is a fixed protocol
 * constant, unchanged for years, so hardcoding it carries less risk than an
 * unverifiable dependency on a package we can't install here to check.
 */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export const MAX_DESTINATIONS = 4;

// --- Our own program's Anchor sighashes -----------------------------------
// 8-byte sighash = sha256("global:<instruction_name>")[..8], computed with a
// script during development (see the Rust test file's header comment for
// the exact command), not guessed.
export const INIT_POLICY_DISC = Buffer.from([0x2d, 0xea, 0x6e, 0x64, 0xd1, 0x92, 0xbf, 0x56]);
export const EXECUTE_PULL_DISC = Buffer.from([0xb6, 0x35, 0x35, 0xf5, 0x8e, 0x9b, 0xf0, 0x9a]);
export const SET_PAUSED_DISC = Buffer.from([0x5b, 0x3c, 0x7d, 0xc0, 0xb0, 0xe1, 0xa6, 0xda]);
export const UPDATE_POLICY_DISC = Buffer.from([0xd4, 0xf5, 0xf6, 0x07, 0xa3, 0x97, 0x12, 0x39]);

// --- Subscriptions & Allowances' one-byte discriminators ------------------
// From `grep -rn "pub const DISCRIMINATOR" program/src/instructions/` against
// the real repo, not guessed.
export const SA_INITIALIZE_SUBSCRIPTION_AUTHORITY_DISC = 0;
export const SA_CREATE_FIXED_DELEGATION_DISC = 1;
export const SA_TRANSFER_FIXED_DISC = 4;

// --- PDA seeds -------------------------------------------------------------
export const POLICY_SEED = Buffer.from("policy");
/** state/subscription_authority.rs:47 */
export const SUBSCRIPTION_AUTHORITY_SEED = Buffer.from("SubscriptionAuthority");
/** state/common.rs:10 — DELEGATE_BASE_SEED */
export const DELEGATE_BASE_SEED = Buffer.from("delegation");
/** event_engine.rs:25 — EVENT_AUTHORITY_SEED */
export const EVENT_AUTHORITY_SEED = Buffer.from("event_authority");