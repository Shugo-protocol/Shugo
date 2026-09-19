use anchor_lang::prelude::*;

use crate::policy_engine::DenyReason;

#[error_code]
pub enum GuardError {
    #[msg("This policy is paused")]
    Paused,
    #[msg("Amount exceeds the per-call cap")]
    ExceedsPerCallCap,
    #[msg("Amount would exceed the velocity cap for the current window")]
    ExceedsVelocityCap,
    #[msg("Destination is not on this policy's allowlist")]
    DestinationNotAllowed,
    #[msg("Too many destinations for one policy")]
    TooManyDestinations,
    #[msg("Only the human who owns this policy can do that")]
    Unauthorized,
    #[msg("Arithmetic overflow while evaluating the policy")]
    Overflow,
    #[msg("This mint is out of scope for v1 (Token-2022 extension present)")]
    UnsupportedMint,
}

/// Bridges the pure `policy_engine` module's `DenyReason` to Anchor's error
/// type, so `execute_pull`'s handler can turn a `Decision::Deny` straight
/// into `Err(...)` without duplicating the reason list in two places.
impl From<DenyReason> for GuardError {
    fn from(reason: DenyReason) -> Self {
        match reason {
            DenyReason::Paused => GuardError::Paused,
            DenyReason::ExceedsPerCallCap => GuardError::ExceedsPerCallCap,
            DenyReason::ExceedsVelocityCap => GuardError::ExceedsVelocityCap,
            DenyReason::DestinationNotAllowed => GuardError::DestinationNotAllowed,
            DenyReason::Overflow => GuardError::Overflow,
        }
    }
}