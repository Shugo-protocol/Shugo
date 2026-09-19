use anchor_lang::prelude::*;

use crate::errors::GuardError;
use crate::state::Policy;

/// The instant kill switch: one instruction pauses every future
/// `execute_pull` against this policy, regardless of how many delegations
/// or agents sit under it. This is the thing the base S&A program has no
/// equivalent of — closing or rotating a SubscriptionAuthority isn't
/// reliable revocation per its own docs, and stopping N delegations there
/// means N separate `revoke_delegation` calls.
#[derive(Accounts)]
pub struct SetPaused<'info> {
    pub human: Signer<'info>,

    #[account(
        mut,
        has_one = human @ GuardError::Unauthorized,
    )]
    pub policy: Account<'info, Policy>,
}

pub fn handler(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
    ctx.accounts.policy.paused = paused;
    Ok(())
}