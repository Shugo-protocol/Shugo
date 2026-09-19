use anchor_lang::prelude::*;

/// Small on purpose: a hackathon-scope policy needs a handful of allowed
/// destinations, not an open-ended list. Raising this later means a state
/// migration, so keep it deliberate rather than generous.
pub const MAX_DESTINATIONS: usize = 4;

/// One Policy PDA per (human, mint, policy_id). Its own address is what the
/// human registers as `delegatee` when creating the real Subscriptions &
/// Allowances delegation — this account both holds our rules AND is the
/// signer our program produces via `invoke_signed` when it CPIs into S&A.
#[account]
pub struct Policy {
    /// The delegator: whoever funds pulls and can change or pause this policy.
    pub human: Pubkey,
    /// The only signer allowed to call `execute_pull` against this policy.
    pub agent: Pubkey,
    /// The mint this policy governs. v1 scope: classic SPL Token or a
    /// Token-2022 mint with no configured extensions (checked in the
    /// `init_policy` handler, not encoded here).
    pub mint: Pubkey,
    pub per_call_cap: u64,
    pub velocity_cap: u64,
    pub velocity_window_s: i64,
    pub window_start_ts: i64,
    pub window_pulled: u64,
    pub destinations: [Pubkey; MAX_DESTINATIONS],
    pub destination_count: u8,
    pub paused: bool,
    pub bump: u8,
    /// Part of the PDA seeds — lets one (human, mint) pair hold several
    /// independent policies, e.g. one per agent.
    pub policy_id: u64,
}

impl Policy {
    pub const SPACE: usize = 8   // Anchor discriminator
        + 32 + 32 + 32           // human, agent, mint
        + 8 + 8 + 8 + 8 + 8      // per_call_cap, velocity_cap, velocity_window_s,
                                  // window_start_ts, window_pulled
        + 32 * MAX_DESTINATIONS  // destinations
        + 1 + 1 + 1              // destination_count, paused, bump
        + 8;                     // policy_id

    pub const SEED_PREFIX: &'static [u8] = b"policy";
}