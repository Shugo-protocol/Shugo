//! Pure policy-evaluation logic: no accounts, no CPI, no Solana runtime.
//!
//! Kept deliberately free of Anchor's account/context machinery so it can be
//! exhaustively checked with Kani (see the harness at the bottom) independent
//! of everything else in the program. The instruction handler in
//! `instructions/execute_pull.rs` is a thin shell around this module: load
//! the account, call `evaluate`, act on the `Decision`.

use anchor_lang::prelude::Pubkey;

use crate::state::MAX_DESTINATIONS;

/// A snapshot of the fields `evaluate` needs, copied out of the on-chain
/// `Policy` account. Separate from the account type on purpose, so this
/// module has zero dependency on account deserialization.
#[derive(Clone, Copy)]
pub struct PolicyView {
    pub paused: bool,
    pub per_call_cap: u64,
    pub velocity_cap: u64,
    pub velocity_window_s: i64,
    pub window_start_ts: i64,
    pub window_pulled: u64,
    pub destinations: [Pubkey; MAX_DESTINATIONS],
    pub destination_count: u8,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DenyReason {
    Paused,
    ExceedsPerCallCap,
    ExceedsVelocityCap,
    DestinationNotAllowed,
    Overflow,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Decision {
    Allow {
        /// New `window_pulled` value the caller should write back.
        new_window_pulled: u64,
        /// Whether the window rolled over — if so, the caller should also
        /// reset `window_start_ts` to `now`.
        window_reset: bool,
    },
    Deny(DenyReason),
}

/// Does this pull satisfy the policy right now? Fail-fast, same composed-
/// checks shape as AgentTrust's `gate_payment` composer: kill switch first,
/// then amount, then the rolling window, then destination.
pub fn evaluate(policy: &PolicyView, now: i64, amount: u64, destination: Pubkey) -> Decision {
    if policy.paused {
        return Decision::Deny(DenyReason::Paused);
    }
    if amount > policy.per_call_cap {
        return Decision::Deny(DenyReason::ExceedsPerCallCap);
    }

    let window_reset = now >= policy.window_start_ts.saturating_add(policy.velocity_window_s);
    let pulled_before_this_request = if window_reset { 0 } else { policy.window_pulled };

    let new_window_pulled = match pulled_before_this_request.checked_add(amount) {
        Some(v) => v,
        None => return Decision::Deny(DenyReason::Overflow),
    };
    if new_window_pulled > policy.velocity_cap {
        return Decision::Deny(DenyReason::ExceedsVelocityCap);
    }

    let allowed = &policy.destinations[..policy.destination_count as usize];
    if !allowed.contains(&destination) {
        return Decision::Deny(DenyReason::DestinationNotAllowed);
    }

    Decision::Allow { new_window_pulled, window_reset }
}

#[cfg(kani)]
mod verification {
    use super::*;

    /// Pins the safety property as a biconditional — `evaluate` returns
    /// `Allow` if and only if every check actually passes — so a future
    /// refactor can't quietly let a denied case slip through the Allow arm.
    /// Same shape of proof as AgentTrust's `gate_payment_strict_correctness`.
    ///
    /// NOTE, unverified by me (no Kani in this environment): `Pubkey` may not
    /// implement `kani::Arbitrary` out of the box depending on the
    /// anchor-lang/solana-program version Anchor just installed for you. If
    /// `cargo kani` complains about that on first run, swap `Pubkey` for a
    /// raw `[u8; 32]` inside this harness only — `evaluate` itself keeps
    /// using `Pubkey`, since only the harness needs to be symbolic-friendly.
    #[kani::proof]
    fn evaluate_correctness() {
        let paused: bool = kani::any();
        let per_call_cap: u64 = kani::any();
        let velocity_cap: u64 = kani::any();
        let velocity_window_s: i64 = kani::any();
        let window_start_ts: i64 = kani::any();
        let window_pulled: u64 = kani::any();
        let destination_count: u8 = kani::any();
        kani::assume((destination_count as usize) <= MAX_DESTINATIONS);

        let destinations: [Pubkey; MAX_DESTINATIONS] = kani::any();
        let now: i64 = kani::any();
        let amount: u64 = kani::any();
        let destination: Pubkey = kani::any();

        let policy = PolicyView {
            paused,
            per_call_cap,
            velocity_cap,
            velocity_window_s,
            window_start_ts,
            window_pulled,
            destinations,
            destination_count,
        };

        // Mirror the same logic independently, so the proof isn't just
        // restating the implementation back at itself.
        let window_reset = now >= window_start_ts.saturating_add(velocity_window_s);
        let pulled_before = if window_reset { 0 } else { window_pulled };
        let sum_ok = pulled_before.checked_add(amount).is_some();
        let new_pulled = pulled_before.checked_add(amount).unwrap_or(u64::MAX);
        let dest_ok = destinations[..destination_count as usize].contains(&destination);

        let should_allow = !paused
            && amount <= per_call_cap
            && sum_ok
            && new_pulled <= velocity_cap
            && dest_ok;

        match evaluate(&policy, now, amount, destination) {
            Decision::Allow { .. } => assert!(should_allow),
            Decision::Deny(_) => assert!(!should_allow),
        }
    }
}