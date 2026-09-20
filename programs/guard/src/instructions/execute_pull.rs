use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke_signed;

use crate::errors::GuardError;
use crate::policy_engine::{evaluate, Decision, PolicyView};
use crate::state::Policy;

/// `transfer_fixed`'s one-byte instruction discriminator. Confirmed against
/// `program/src/instructions/transfer_fixed_delegation.rs` in the real
/// subscriptions repo: `pub const DISCRIMINATOR: &u8 = &4;`. This is NOT an
/// Anchor 8-byte sighash — the S&A program is written in Pinocchio, which
/// uses plain single-byte discriminators.
pub const TRANSFER_FIXED_DISCRIMINATOR: u8 = 4;

#[derive(Accounts)]
pub struct ExecutePull<'info> {
    pub agent: Signer<'info>,

    #[account(
        mut,
        has_one = agent @ GuardError::Unauthorized,
    )]
    pub policy: Account<'info, Policy>,

    // The nine accounts below are passed straight through to S&A's
    // `transfer_fixed` in this exact order — confirmed against
    // `writable_accounts_must_be_writable` / `signer_accounts_must_be_signers`
    // in the real test suite. We don't validate their contents ourselves;
    // S&A does that on the other side of the CPI, which is the whole point
    // of composing with audited infra instead of re-implementing custody.
    /// CHECK: S&A's FixedDelegation PDA; validated by S&A during the CPI.
    #[account(mut)]
    pub delegation: UncheckedAccount<'info>,
    /// CHECK: S&A's SubscriptionAuthority PDA; validated by S&A. Marked
    /// `mut` to match the real, proven-working `TransferDelegation::execute`
    /// helper in the S&A test suite — its own `writable_accounts_must_be_writable`
    /// test's template marks this readonly, but that's the minimum, not what
    /// every passing transfer test actually sends. Writable is always a safe
    /// superset; the reverse would fail at the CPI privilege check.
    #[account(mut)]
    pub subscription_authority: UncheckedAccount<'info>,
    /// CHECK: the human's token account for `policy.mint`; validated by S&A.
    #[account(mut)]
    pub delegator_ata: UncheckedAccount<'info>,
    /// CHECK: must equal `destination` below — enforced by this handler,
    /// not by S&A, since S&A itself places no constraint on the receiver.
    #[account(mut)]
    pub receiver_ata: UncheckedAccount<'info>,
    /// CHECK: must equal `policy.mint`; checked implicitly via seeds below.
    pub mint: UncheckedAccount<'info>,
    /// CHECK: SPL Token or Token-2022, whichever `policy.mint` belongs to.
    pub token_program: UncheckedAccount<'info>,
    /// CHECK: S&A's fixed event-authority PDA, required by its self-CPI
    /// event-logging pattern.
    pub event_authority: UncheckedAccount<'info>,
    /// CHECK: the Subscriptions & Allowances program itself, invoked below.
    pub subscriptions_program: UncheckedAccount<'info>,
    // Token-2022 transfer-hook accounts (hook program, validation PDA, and
    // whatever else the mint's hook declares) go through as remaining
    // accounts on the calling transaction — see the TODO in the handler.
}

pub fn handler(ctx: Context<ExecutePull>, amount: u64, destination: Pubkey) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;

    // Ties `evaluate`'s destination check to the account the CPI will
    // actually pay out to — without this, a caller could satisfy the
    // allowlist with `destination` while pointing `receiver_ata` somewhere
    // else entirely.
    require_keys_eq!(
        ctx.accounts.receiver_ata.key(),
        destination,
        GuardError::DestinationNotAllowed
    );

    let view = PolicyView {
        paused: ctx.accounts.policy.paused,
        per_call_cap: ctx.accounts.policy.per_call_cap,
        velocity_cap: ctx.accounts.policy.velocity_cap,
        velocity_window_s: ctx.accounts.policy.velocity_window_s,
        window_start_ts: ctx.accounts.policy.window_start_ts,
        window_pulled: ctx.accounts.policy.window_pulled,
        destinations: ctx.accounts.policy.destinations,
        destination_count: ctx.accounts.policy.destination_count,
    };

    let (new_window_pulled, window_reset) = match evaluate(&view, now, amount, destination) {
        Decision::Allow { new_window_pulled, window_reset } => (new_window_pulled, window_reset),
        Decision::Deny(reason) => return Err(GuardError::from(reason).into()),
    };

    // Snapshot the fields the CPI's instruction data and signer seeds need,
    // before mutating the account — keeps every borrow below immutable.
    let human = ctx.accounts.policy.human;
    let policy_id = ctx.accounts.policy.policy_id;
    let bump = ctx.accounts.policy.bump;
    let policy_key = ctx.accounts.policy.key();
    let mint_key = ctx.accounts.mint.key();

    ctx.accounts.policy.window_pulled = new_window_pulled;
    if window_reset {
        ctx.accounts.policy.window_start_ts = now;
    }

    // transfer_fixed's raw instruction data: [1-byte discriminator]
    // [u64 amount LE][32-byte delegator][32-byte mint]. Layout confirmed
    // against the hand-built instruction in
    // `writable_accounts_must_be_writable` in the real test suite.
    let mut data = Vec::with_capacity(1 + 8 + 32 + 32);
    data.push(TRANSFER_FIXED_DISCRIMINATOR);
    data.extend_from_slice(&amount.to_le_bytes());
    data.extend_from_slice(&human.to_bytes());
    data.extend_from_slice(&mint_key.to_bytes());

    let ix = Instruction {
        program_id: ctx.accounts.subscriptions_program.key(),
        accounts: vec![
            AccountMeta::new(ctx.accounts.delegation.key(), false),
            AccountMeta::new(ctx.accounts.subscription_authority.key(), false),
            AccountMeta::new(ctx.accounts.delegator_ata.key(), false),
            AccountMeta::new(ctx.accounts.receiver_ata.key(), false),
            AccountMeta::new_readonly(mint_key, false),
            AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
            // The delegatee, account #6: OUR Policy PDA, marked as signer.
            // `invoke_signed` below is what actually makes the runtime
            // accept it — S&A's program never needs to know it's a PDA.
            AccountMeta::new_readonly(policy_key, true),
            AccountMeta::new_readonly(ctx.accounts.event_authority.key(), false),
            AccountMeta::new_readonly(ctx.accounts.subscriptions_program.key(), false),
            // TODO (Token-2022 transfer-hook mints): append
            // ctx.remaining_accounts here, mirrored into both `accounts`
            // and the AccountInfo list below — see
            // `test_fixed_transfer_token_2022_active_transfer_hook` for the
            // exact shape (hook program, validation PDA, whatever the hook
            // needs). Not required for the plain-SPL-Token spike.
        ],
        data,
    };

    let policy_id_bytes = policy_id.to_le_bytes();
    let bump_arr = [bump];
    let seeds: &[&[u8]] = &[
        Policy::SEED_PREFIX,
        human.as_ref(),
        mint_key.as_ref(),
        &policy_id_bytes,
        &bump_arr,
    ];

    invoke_signed(
        &ix,
        &[
            ctx.accounts.delegation.to_account_info(),
            ctx.accounts.subscription_authority.to_account_info(),
            ctx.accounts.delegator_ata.to_account_info(),
            ctx.accounts.receiver_ata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.policy.to_account_info(),
            ctx.accounts.event_authority.to_account_info(),
            ctx.accounts.subscriptions_program.to_account_info(),
        ],
        &[seeds],
    )?;

    Ok(())
}