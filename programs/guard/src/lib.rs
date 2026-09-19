use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod policy_engine;
pub mod state;

use instructions::*;

// Placeholder — the standard anchor-init example key, recognizable on sight
// as "not real yet". Run `anchor build` then `anchor keys sync` to replace
// this with the pubkey Anchor actually generated for you, then `anchor
// build` again so the on-chain program agrees with this declaration.
declare_id!("6gHABW3Rn5dsTdXKN2xzRdb4g9v2DjYmc9sKq1Wn8my9");

#[program]
pub mod guard {
    use super::*;

    pub fn init_policy(
        ctx: Context<InitPolicy>,
        policy_id: u64,
        agent: Pubkey,
        per_call_cap: u64,
        velocity_cap: u64,
        velocity_window_s: i64,
        destinations: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::init_policy::handler(
            ctx,
            policy_id,
            agent,
            per_call_cap,
            velocity_cap,
            velocity_window_s,
            destinations,
        )
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        instructions::set_paused::handler(ctx, paused)
    }

    pub fn execute_pull(ctx: Context<ExecutePull>, amount: u64, destination: Pubkey) -> Result<()> {
        instructions::execute_pull::handler(ctx, amount, destination)
    }
}