use anchor_lang::prelude::*;

use crate::errors::GuardError;
use crate::state::{Policy, MAX_DESTINATIONS};

/// Anchor sighash for this instruction: sha256("global:update_policy")[..8]
/// = d4f5f607a3971239. Computed, not guessed — same approach used for every
/// other discriminator in this program.
#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    pub human: Signer<'info>,

    #[account(
        mut,
        has_one = human @ GuardError::Unauthorized,
    )]
    pub policy: Account<'info, Policy>,
}

/// Configuration only — deliberately leaves `window_pulled`, `window_start_ts`,
/// and `paused` untouched. Runtime state and the kill switch each have their
/// own, narrower reason to change; folding them into a general config-update
/// instruction would blur who's responsible for what. See `set_paused` for
/// pausing.
pub fn handler(
    ctx: Context<UpdatePolicy>,
    agent: Pubkey,
    per_call_cap: u64,
    velocity_cap: u64,
    velocity_window_s: i64,
    destinations: Vec<Pubkey>,
) -> Result<()> {
    require!(destinations.len() <= MAX_DESTINATIONS, GuardError::TooManyDestinations);
    require!(velocity_window_s > 0, GuardError::Overflow);

    let mut dest_array = [Pubkey::default(); MAX_DESTINATIONS];
    for (slot, d) in dest_array.iter_mut().zip(destinations.iter()) {
        *slot = *d;
    }

    let policy = &mut ctx.accounts.policy;
    policy.agent = agent;
    policy.per_call_cap = per_call_cap;
    policy.velocity_cap = velocity_cap;
    policy.velocity_window_s = velocity_window_s;
    policy.destinations = dest_array;
    policy.destination_count = destinations.len() as u8;
    // human, mint, policy_id, bump: identity fields, immutable by design —
    // changing any of them would mean this is a different policy, not an
    // update to this one.
    // window_pulled, window_start_ts, paused: intentionally untouched; see
    // the doc comment above.

    Ok(())
}