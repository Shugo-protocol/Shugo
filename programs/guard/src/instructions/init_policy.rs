use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::errors::GuardError;
use crate::state::{Policy, MAX_DESTINATIONS};

#[derive(Accounts)]
#[instruction(policy_id: u64)]
pub struct InitPolicy<'info> {
    #[account(mut)]
    pub human: Signer<'info>,

    /// `InterfaceAccount<Mint>` accepts both the classic SPL Token program
    /// and Token-2022. v1 scope check (no configured extensions) happens in
    /// the handler below, not in this account constraint — Anchor's mint
    /// interface type alone doesn't tell us which extensions are present.
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = human,
        space = Policy::SPACE,
        seeds = [
            Policy::SEED_PREFIX,
            human.key().as_ref(),
            mint.key().as_ref(),
            &policy_id.to_le_bytes(),
        ],
        bump,
    )]
    pub policy: Account<'info, Policy>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitPolicy>,
    policy_id: u64,
    agent: Pubkey,
    per_call_cap: u64,
    velocity_cap: u64,
    velocity_window_s: i64,
    destinations: Vec<Pubkey>,
) -> Result<()> {
    require!(destinations.len() <= MAX_DESTINATIONS, GuardError::TooManyDestinations);
    require!(velocity_window_s > 0, GuardError::Overflow);

    // TODO once the composability spike is running: reject mints where
    // `get_extension_types(&ctx.accounts.mint)` reports anything beyond an
    // inert (unset) TransferHook — see the open question about which
    // extensions the live S&A program currently forwards vs. rejects.
    // Left as a pass-through for now so the spike isn't blocked on it.

    let mut dest_array = [Pubkey::default(); MAX_DESTINATIONS];
    for (slot, d) in dest_array.iter_mut().zip(destinations.iter()) {
        *slot = *d;
    }

    let policy = &mut ctx.accounts.policy;
    policy.human = ctx.accounts.human.key();
    policy.agent = agent;
    policy.mint = ctx.accounts.mint.key();
    policy.per_call_cap = per_call_cap;
    policy.velocity_cap = velocity_cap;
    policy.velocity_window_s = velocity_window_s;
    policy.window_start_ts = Clock::get()?.unix_timestamp;
    policy.window_pulled = 0;
    policy.destinations = dest_array;
    policy.destination_count = destinations.len() as u8;
    policy.paused = false;
    policy.bump = ctx.bumps.policy;
    policy.policy_id = policy_id;
    Ok(())
}