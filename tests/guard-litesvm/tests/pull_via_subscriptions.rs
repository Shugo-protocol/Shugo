//! The composability spike. Everything the rest of this project depends on
//! is proven or disproven right here: can a PDA our program controls be
//! registered as `delegatee` on a real Subscriptions & Allowances
//! `FixedDelegation`, and can our `execute_pull` actually move tokens
//! through it via CPI?
//!
//! Deliberately does NOT depend on the `guard` crate's Rust types. Two
//! reasons: (1) `anchor-lang 0.30.1` pulls in the older monolithic
//! `solana-program`, while LiteSVM and the real subscriptions test suite use
//! the newer split `solana-*` crates — `Pubkey` and `Instruction` from the
//! two generations are different Rust types, not just different versions of
//! the same one. (2) we don't need Anchor's typed CPI client anyway: both
//! programs are addressed here purely as deployed bytecode plus hand-built
//! instructions, exactly the way `writable_accounts_must_be_writable` in the
//! real subscriptions test suite constructs `transfer_fixed` by hand.
//!
//! Every account order, seed, and discriminator below was read directly out
//! of the real `solana-foundation/subscriptions` source (see the comments
//! next to each), not assumed from documentation.

use borsh::BorshSerialize;
use litesvm::LiteSVM;
use solana_account::Account;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_native_token::LAMPORTS_PER_SOL;
use solana_program_pack::Pack;
use solana_pubkey::Pubkey;
use solana_signer::Signer;
use solana_transaction::Transaction;
use spl_associated_token_account_interface::address::get_associated_token_address_with_program_id;
use spl_token_2022_interface::state::{Account as TokenAccountState, AccountState, Mint as MintState};
use std::time::{SystemTime, UNIX_EPOCH};

// ---------------------------------------------------------------------
// Confirmed constants — every one sourced from the real repo, not guessed.
// ---------------------------------------------------------------------

/// Our program. From `anchor keys sync`'s actual output.
fn guard_program_id() -> Pubkey {
    "6gHABW3Rn5dsTdXKN2xzRdb4g9v2DjYmc9sKq1Wn8my9".parse().unwrap()
}

/// The real, deployed Subscriptions & Allowances program.
/// `program/src/lib.rs:49` — `declare_id!("De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44")`.
fn subscriptions_program_id() -> Pubkey {
    "De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44".parse().unwrap()
}

/// Classic SPL Token program — unrelated to anything we had to look up.
fn token_program_id() -> Pubkey {
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA".parse().unwrap()
}

// S&A instruction discriminators — `grep -rn "pub const DISCRIMINATOR" program/src/instructions/`.
const INITIALIZE_SUBSCRIPTION_AUTHORITY_DISC: u8 = 0;
const CREATE_FIXED_DELEGATION_DISC: u8 = 1;
const TRANSFER_FIXED_DISC: u8 = 4;

// Our own Anchor sighashes — computed with sha256("global:<name>")[..8], not guessed.
const INIT_POLICY_DISC: [u8; 8] = [0x2d, 0xea, 0x6e, 0x64, 0xd1, 0x92, 0xbf, 0x56];
const EXECUTE_PULL_DISC: [u8; 8] = [0xb6, 0x35, 0x35, 0xf5, 0x8e, 0x9b, 0xf0, 0x9a];
const SET_PAUSED_DISC: [u8; 8] = [0x5b, 0x3c, 0x7d, 0xc0, 0xb0, 0xe1, 0xa6, 0xda];
const UPDATE_POLICY_DISC: [u8; 8] = [0xd4, 0xf5, 0xf6, 0x07, 0xa3, 0x97, 0x12, 0x39];

// Seeds — `state/subscription_authority.rs:47`, `state/common.rs:10`,
// `event_engine.rs:44` (`EVENT_AUTHORITY_SEED`).
const SUBSCRIPTION_AUTHORITY_SEED: &[u8] = b"SubscriptionAuthority";
const DELEGATE_BASE_SEED: &[u8] = b"delegation";
const EVENT_AUTHORITY_SEED: &[u8] = b"event_authority";

// Ours — `state.rs` in the guard program.
const POLICY_SEED: &[u8] = b"policy";

// ---------------------------------------------------------------------
// PDA derivations, mirroring tests/integration-tests/src/utils/pda.rs
// ---------------------------------------------------------------------

fn subscription_authority_pda(user: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[SUBSCRIPTION_AUTHORITY_SEED, user.as_ref(), mint.as_ref()],
        &subscriptions_program_id(),
    )
}

fn delegation_pda(
    subscription_authority: &Pubkey,
    delegator: &Pubkey,
    delegatee: &Pubkey,
    nonce: u64,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            DELEGATE_BASE_SEED,
            subscription_authority.as_ref(),
            delegator.as_ref(),
            delegatee.as_ref(),
            &nonce.to_le_bytes(),
        ],
        &subscriptions_program_id(),
    )
}

fn event_authority_pda() -> Pubkey {
    Pubkey::find_program_address(&[EVENT_AUTHORITY_SEED], &subscriptions_program_id()).0
}

fn policy_pda(human: &Pubkey, mint: &Pubkey, policy_id: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[POLICY_SEED, human.as_ref(), mint.as_ref(), &policy_id.to_le_bytes()],
        &guard_program_id(),
    )
}

// ---------------------------------------------------------------------
// SVM setup — loads BOTH compiled programs, exactly like the real repo's
// own `setup()` in tests/integration-tests/src/utils/test_helpers.rs.
// ---------------------------------------------------------------------

fn current_ts() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64
}

fn setup() -> LiteSVM {
    let mut svm = LiteSVM::new();

    let guard_so = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target/deploy/guard.so");
    svm.add_program_from_file(guard_program_id(), &guard_so)
        .unwrap_or_else(|e| panic!("couldn't load {guard_so:?} — run `anchor build` first: {e}"));

    let subscriptions_so = std::env::var("SUBSCRIPTIONS_SO_PATH").map(std::path::PathBuf::from).unwrap_or_else(|_| {
        // Default assumes `guard` and `subscriptions` are sibling directories,
        // matching the tree you showed earlier (~/project/{guard,subscriptions}).
        std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../../subscriptions/target/deploy/subscriptions_program.so")
    });
    svm.add_program_from_file(subscriptions_program_id(), &subscriptions_so).unwrap_or_else(|e| {
        panic!(
            "couldn't load {subscriptions_so:?} — set SUBSCRIPTIONS_SO_PATH if your \
             checkout isn't a sibling of this repo: {e}"
        )
    });

    let mut clock = svm.get_sysvar::<solana_clock::Clock>();
    clock.unix_timestamp = current_ts();
    svm.set_sysvar::<solana_clock::Clock>(&clock);

    svm
}

fn send(svm: &mut LiteSVM, signers: &[&Keypair], payer: &Pubkey, ix: Instruction) -> litesvm::types::TransactionResult {
    let tx = Transaction::new(signers, Message::new(&[ix], Some(payer)), svm.latest_blockhash());
    let result = svm.send_transaction(tx);
    svm.expire_blockhash();
    result
}

fn advance_clock(svm: &mut LiteSVM, seconds: i64) {
    let mut clock = svm.get_sysvar::<solana_clock::Clock>();
    clock.unix_timestamp += seconds;
    // Bump slot too, matching the real repo's own `move_clock_forward` —
    // neither our checks nor S&A's read slot directly, but there's no
    // reason to diverge from a pattern already proven not to confuse LiteSVM.
    clock.slot += (seconds as u64) * 2;
    svm.set_sysvar::<solana_clock::Clock>(&clock);
}

// ---------------------------------------------------------------------
// Minimal classic-SPL-Token mint/ATA setup — no extensions, so the base
// spl-token-2022-interface state layout is byte-identical to classic
// SPL Token, same fact this project's whole pitch rests on.
// ---------------------------------------------------------------------

fn init_mint(svm: &mut LiteSVM, authority: Pubkey, decimals: u8, supply: u64) -> Pubkey {
    let mint = Pubkey::new_unique();
    let mut data = vec![0u8; MintState::LEN];
    let state = MintState {
        mint_authority: Some(authority).into(),
        supply,
        decimals,
        is_initialized: true,
        freeze_authority: None.into(),
    };
    MintState::pack(state, &mut data).unwrap();
    let lamports = svm.minimum_balance_for_rent_exemption(data.len());
    svm.set_account(mint, Account { lamports, data, owner: token_program_id(), executable: false, rent_epoch: 0 })
        .unwrap();
    mint
}

fn init_ata(svm: &mut LiteSVM, mint: Pubkey, owner: Pubkey, amount: u64) -> Pubkey {
    let ata = get_associated_token_address_with_program_id(&owner, &mint, &token_program_id());
    let mut data = vec![0u8; TokenAccountState::LEN];
    let state = TokenAccountState {
        mint,
        owner,
        amount,
        delegate: None.into(),
        state: AccountState::Initialized,
        is_native: None.into(),
        delegated_amount: 0,
        close_authority: None.into(),
    };
    TokenAccountState::pack(state, &mut data).unwrap();
    let lamports = svm.minimum_balance_for_rent_exemption(data.len());
    svm.set_account(ata, Account { lamports, data, owner: token_program_id(), executable: false, rent_epoch: 0 })
        .unwrap();
    ata
}

fn ata_balance(svm: &LiteSVM, ata: &Pubkey) -> u64 {
    let account = svm.get_account(ata).unwrap();
    TokenAccountState::unpack(&account.data[..TokenAccountState::LEN]).unwrap().amount
}

// ---------------------------------------------------------------------
// Instruction builders — hand-built to match the real account orders and
// data layouts confirmed from source, the same technique
// `writable_accounts_must_be_writable` uses for `transfer_fixed` itself.
// ---------------------------------------------------------------------

/// `initialize_subscription_authority` — account order and data (disc only)
/// confirmed from `initialize_subscription_authority_action_with_sponsor`.
fn build_init_subscription_authority_ix(user: &Pubkey, mint: &Pubkey, user_ata: &Pubkey) -> Instruction {
    let (sa_pda, _) = subscription_authority_pda(user, mint);
    Instruction {
        program_id: subscriptions_program_id(),
        accounts: vec![
            AccountMeta::new(*user, true),
            AccountMeta::new(sa_pda, false),
            AccountMeta::new_readonly(*mint, false),
            AccountMeta::new(*user_ata, false),
            AccountMeta::new_readonly(Pubkey::default(), false), // system program
            AccountMeta::new_readonly(token_program_id(), false),
        ],
        data: vec![INITIALIZE_SUBSCRIPTION_AUTHORITY_DISC],
    }
}

/// `create_fixed_delegation` — account order and data layout confirmed from
/// `CreateDelegation::instruction` / `fixed_data`.
fn build_create_fixed_delegation_ix(
    delegator: &Pubkey,
    mint: &Pubkey,
    delegatee: &Pubkey,
    nonce: u64,
    amount: u64,
    expiry_ts: i64,
    expected_subscription_authority_init_id: i64,
) -> (Instruction, Pubkey) {
    let (sa_pda, _) = subscription_authority_pda(delegator, mint);
    let (delegation, _) = delegation_pda(&sa_pda, delegator, delegatee, nonce);

    let data = [
        vec![CREATE_FIXED_DELEGATION_DISC],
        nonce.to_le_bytes().to_vec(),
        amount.to_le_bytes().to_vec(),
        expiry_ts.to_le_bytes().to_vec(),
        expected_subscription_authority_init_id.to_le_bytes().to_vec(),
    ]
    .concat();

    let ix = Instruction {
        program_id: subscriptions_program_id(),
        accounts: vec![
            AccountMeta::new(*delegator, true),
            AccountMeta::new(sa_pda, false),
            AccountMeta::new(delegation, false),
            AccountMeta::new_readonly(*delegatee, false), // NOT a signer at creation time
            AccountMeta::new_readonly(Pubkey::default(), false), // system program
        ],
        data,
    };
    (ix, delegation)
}

/// Our own `init_policy` — account order matches `InitPolicy` in
/// `instructions/init_policy.rs`: human, mint, policy, system_program.
#[allow(clippy::too_many_arguments)]
fn build_init_policy_ix(
    human: &Pubkey,
    mint: &Pubkey,
    policy: &Pubkey,
    policy_id: u64,
    agent: &Pubkey,
    per_call_cap: u64,
    velocity_cap: u64,
    velocity_window_s: i64,
    destinations: &[Pubkey],
) -> Instruction {
    #[derive(BorshSerialize)]
    struct Args {
        policy_id: u64,
        agent: [u8; 32],
        per_call_cap: u64,
        velocity_cap: u64,
        velocity_window_s: i64,
        destinations: Vec<[u8; 32]>,
    }
    let args = Args {
        policy_id,
        agent: agent.to_bytes(),
        per_call_cap,
        velocity_cap,
        velocity_window_s,
        destinations: destinations.iter().map(|d| d.to_bytes()).collect(),
    };
    let mut data = INIT_POLICY_DISC.to_vec();
    args.serialize(&mut data).unwrap();

    Instruction {
        program_id: guard_program_id(),
        accounts: vec![
            AccountMeta::new(*human, true),
            AccountMeta::new_readonly(*mint, false),
            AccountMeta::new(*policy, false),
            AccountMeta::new_readonly(Pubkey::default(), false), // system program
        ],
        data,
    }
}

/// Our own `execute_pull` — account order matches `ExecutePull` in
/// `instructions/execute_pull.rs`.
#[allow(clippy::too_many_arguments)]
fn build_execute_pull_ix(
    agent: &Pubkey,
    policy: &Pubkey,
    delegation: &Pubkey,
    subscription_authority: &Pubkey,
    delegator_ata: &Pubkey,
    receiver_ata: &Pubkey,
    mint: &Pubkey,
    event_authority: &Pubkey,
    amount: u64,
    destination: &Pubkey,
) -> Instruction {
    #[derive(BorshSerialize)]
    struct Args {
        amount: u64,
        destination: [u8; 32],
    }
    let args = Args { amount, destination: destination.to_bytes() };
    let mut data = EXECUTE_PULL_DISC.to_vec();
    args.serialize(&mut data).unwrap();

    Instruction {
        program_id: guard_program_id(),
        accounts: vec![
            AccountMeta::new_readonly(*agent, true),
            AccountMeta::new(*policy, false),
            AccountMeta::new(*delegation, false),
            AccountMeta::new(*subscription_authority, false), // writable — see the fix note above this file
            AccountMeta::new(*delegator_ata, false),
            AccountMeta::new(*receiver_ata, false),
            AccountMeta::new_readonly(*mint, false),
            AccountMeta::new_readonly(token_program_id(), false),
            AccountMeta::new_readonly(*event_authority, false),
            AccountMeta::new_readonly(subscriptions_program_id(), false),
        ],
        data,
    }
}

/// Our own `set_paused` — account order matches `SetPaused` in
/// `instructions/set_paused.rs`: human, policy.
fn build_set_paused_ix(human: &Pubkey, policy: &Pubkey, paused: bool) -> Instruction {
    #[derive(BorshSerialize)]
    struct Args {
        paused: bool,
    }
    let mut data = SET_PAUSED_DISC.to_vec();
    Args { paused }.serialize(&mut data).unwrap();

    Instruction {
        program_id: guard_program_id(),
        accounts: vec![AccountMeta::new_readonly(*human, true), AccountMeta::new(*policy, false)],
        data,
    }
}

/// Our own `update_policy` — account order matches `UpdatePolicy` in
/// `instructions/update_policy.rs`: human, policy.
#[allow(clippy::too_many_arguments)]
fn build_update_policy_ix(
    human: &Pubkey,
    policy: &Pubkey,
    agent: &Pubkey,
    per_call_cap: u64,
    velocity_cap: u64,
    velocity_window_s: i64,
    destinations: &[Pubkey],
) -> Instruction {
    #[derive(BorshSerialize)]
    struct Args {
        agent: [u8; 32],
        per_call_cap: u64,
        velocity_cap: u64,
        velocity_window_s: i64,
        destinations: Vec<[u8; 32]>,
    }
    let args = Args {
        agent: agent.to_bytes(),
        per_call_cap,
        velocity_cap,
        velocity_window_s,
        destinations: destinations.iter().map(|d| d.to_bytes()).collect(),
    };
    let mut data = UPDATE_POLICY_DISC.to_vec();
    args.serialize(&mut data).unwrap();

    Instruction {
        program_id: guard_program_id(),
        accounts: vec![AccountMeta::new_readonly(*human, true), AccountMeta::new(*policy, false)],
        data,
    }
}

// ---------------------------------------------------------------------
// The test.
// ---------------------------------------------------------------------

#[test]
fn policy_pda_pulls_real_tokens_through_a_real_delegation() {
    let mut svm = setup();

    let alice = Keypair::new(); // human / delegator
    let bob = Keypair::new(); // agent — our execute_pull caller
    svm.airdrop(&alice.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();
    svm.airdrop(&bob.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

    let mint = init_mint(&mut svm, alice.pubkey(), 6, 1_000_000_000);
    let alice_ata = init_ata(&mut svm, mint, alice.pubkey(), 100_000_000);
    // The receiver our policy will allow — an arbitrary third-party owner,
    // deliberately not Bob's own wallet, since the whole point of the
    // destination allowlist is constraining where an agent can route funds.
    let charlie = Pubkey::new_unique();
    let charlie_ata = init_ata(&mut svm, mint, charlie, 0);

    // 1. Create our Policy PDA. Its own address is what gets registered as
    //    `delegatee` below — this line is the composability claim made real.
    let policy_id = 0u64;
    let (policy, _bump) = policy_pda(&alice.pubkey(), &mint, policy_id);
    let init_policy_ix = build_init_policy_ix(
        &alice.pubkey(),
        &mint,
        &policy,
        policy_id,
        &bob.pubkey(),
        50_000_000, // per_call_cap
        50_000_000, // velocity_cap
        3600,       // velocity_window_s
        &[charlie_ata],
    );
    let result = send(&mut svm, &[&alice], &alice.pubkey(), init_policy_ix);
    assert!(result.is_ok(), "init_policy failed: {:?}", result.err());

    // 2. Alice initializes her real SubscriptionAuthority for this mint.
    let init_sa_ix = build_init_subscription_authority_ix(&alice.pubkey(), &mint, &alice_ata);
    let result = send(&mut svm, &[&alice], &alice.pubkey(), init_sa_ix);
    assert!(result.is_ok(), "initialize_subscription_authority failed: {:?}", result.err());

    // 3. Alice creates a REAL FixedDelegation — delegatee is our Policy PDA,
    //    not a raw keypair. This is the line that either proves or disproves
    //    the whole architecture.
    let expiry_ts = current_ts() + 86_400;
    let (create_delegation_ix, delegation) =
        build_create_fixed_delegation_ix(&alice.pubkey(), &mint, &policy, 0, 50_000_000, expiry_ts, 0);
    let result = send(&mut svm, &[&alice], &alice.pubkey(), create_delegation_ix);
    assert!(result.is_ok(), "create_fixed_delegation failed: {:?}", result.err());

    // 4. Bob (the agent) calls OUR execute_pull. Internally this evaluates
    //    the policy, then invoke_signed's into S&A's transfer_fixed with our
    //    Policy PDA signing as delegatee.
    let (sa_pda, _) = subscription_authority_pda(&alice.pubkey(), &mint);
    let pull_ix = build_execute_pull_ix(
        &bob.pubkey(),
        &policy,
        &delegation,
        &sa_pda,
        &alice_ata,
        &charlie_ata,
        &mint,
        &event_authority_pda(),
        30_000_000,
        &charlie_ata,
    );
    let result = send(&mut svm, &[&bob], &bob.pubkey(), pull_ix);
    assert!(result.is_ok(), "execute_pull failed: {:?}", result.err());

    // 5. The actual proof: did real tokens actually move?
    assert_eq!(ata_balance(&svm, &charlie_ata), 30_000_000, "charlie should have received the pull");
    assert_eq!(ata_balance(&svm, &alice_ata), 70_000_000, "alice's balance should be debited");
}

#[test]
fn execute_pull_denies_a_destination_not_on_the_allowlist() {
    let mut svm = setup();

    let alice = Keypair::new();
    let bob = Keypair::new();
    svm.airdrop(&alice.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();
    svm.airdrop(&bob.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

    let mint = init_mint(&mut svm, alice.pubkey(), 6, 1_000_000_000);
    let alice_ata = init_ata(&mut svm, mint, alice.pubkey(), 100_000_000);
    let charlie = Pubkey::new_unique();
    let charlie_ata = init_ata(&mut svm, mint, charlie, 0);
    // Eve is NOT on the policy's allowlist.
    let eve = Pubkey::new_unique();
    let eve_ata = init_ata(&mut svm, mint, eve, 0);

    let policy_id = 0u64;
    let (policy, _) = policy_pda(&alice.pubkey(), &mint, policy_id);
    send(
        &mut svm,
        &[&alice],
        &alice.pubkey(),
        build_init_policy_ix(&alice.pubkey(), &mint, &policy, policy_id, &bob.pubkey(), 50_000_000, 50_000_000, 3600, &[
            charlie_ata,
        ]),
    )
    .expect("init_policy failed");

    send(&mut svm, &[&alice], &alice.pubkey(), build_init_subscription_authority_ix(&alice.pubkey(), &mint, &alice_ata))
        .expect("initialize_subscription_authority failed");

    let expiry_ts = current_ts() + 86_400;
    let (create_ix, delegation) =
        build_create_fixed_delegation_ix(&alice.pubkey(), &mint, &policy, 0, 50_000_000, expiry_ts, 0);
    send(&mut svm, &[&alice], &alice.pubkey(), create_ix).expect("create_fixed_delegation failed");

    let (sa_pda, _) = subscription_authority_pda(&alice.pubkey(), &mint);
    // This is exactly the redirect-to-a-third-party shape S&A itself allows
    // unconditionally (`test_fixed_transfer_to_third_party`) — proving our
    // policy layer is the thing actually stopping it, not the base program.
    let pull_ix = build_execute_pull_ix(
        &bob.pubkey(),
        &policy,
        &delegation,
        &sa_pda,
        &alice_ata,
        &eve_ata,
        &mint,
        &event_authority_pda(),
        10_000_000,
        &eve_ata,
    );
    let result = send(&mut svm, &[&bob], &bob.pubkey(), pull_ix);
    assert!(result.is_err(), "pulling to a non-allowlisted destination should be denied");
    assert_eq!(ata_balance(&svm, &eve_ata), 0);
}

/// Shared scaffolding for the tests below: a policy plus a real delegation
/// naming it as delegatee, ready for `execute_pull` calls. Returns everything
/// a test needs to build its own pull instructions.
struct Scenario {
    svm: LiteSVM,
    alice: Keypair,
    bob: Keypair,
    mint: Pubkey,
    alice_ata: Pubkey,
    charlie_ata: Pubkey,
    policy: Pubkey,
    delegation: Pubkey,
    sa_pda: Pubkey,
}

fn build_scenario(per_call_cap: u64, velocity_cap: u64, velocity_window_s: i64, delegation_amount: u64) -> Scenario {
    let mut svm = setup();

    let alice = Keypair::new();
    let bob = Keypair::new();
    svm.airdrop(&alice.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();
    svm.airdrop(&bob.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

    let mint = init_mint(&mut svm, alice.pubkey(), 6, 1_000_000_000);
    let alice_ata = init_ata(&mut svm, mint, alice.pubkey(), 500_000_000);
    let charlie = Pubkey::new_unique();
    let charlie_ata = init_ata(&mut svm, mint, charlie, 0);

    let policy_id = 0u64;
    let (policy, _) = policy_pda(&alice.pubkey(), &mint, policy_id);
    let init_policy_ix = build_init_policy_ix(
        &alice.pubkey(),
        &mint,
        &policy,
        policy_id,
        &bob.pubkey(),
        per_call_cap,
        velocity_cap,
        velocity_window_s,
        &[charlie_ata],
    );
    send(&mut svm, &[&alice], &alice.pubkey(), init_policy_ix).expect("init_policy failed");

    send(&mut svm, &[&alice], &alice.pubkey(), build_init_subscription_authority_ix(&alice.pubkey(), &mint, &alice_ata))
        .expect("initialize_subscription_authority failed");

    let expiry_ts = current_ts() + 86_400;
    let (create_ix, delegation) =
        build_create_fixed_delegation_ix(&alice.pubkey(), &mint, &policy, 0, delegation_amount, expiry_ts, 0);
    send(&mut svm, &[&alice], &alice.pubkey(), create_ix).expect("create_fixed_delegation failed");

    let (sa_pda, _) = subscription_authority_pda(&alice.pubkey(), &mint);

    Scenario { svm, alice, bob, mint, alice_ata, charlie_ata, policy, delegation, sa_pda }
}

#[test]
fn execute_pull_denies_amount_over_per_call_cap() {
    // per_call_cap = 20M, velocity_cap generous, delegation generous — the
    // per-call check should be the thing that fires, nothing else.
    let mut s = build_scenario(20_000_000, 100_000_000, 3600, 100_000_000);

    let pull_ix = build_execute_pull_ix(
        &s.bob.pubkey(),
        &s.policy,
        &s.delegation,
        &s.sa_pda,
        &s.alice_ata,
        &s.charlie_ata,
        &s.mint,
        &event_authority_pda(),
        30_000_000, // over the 20M per_call_cap
        &s.charlie_ata,
    );
    let result = send(&mut s.svm, &[&s.bob], &s.bob.pubkey(), pull_ix);
    assert!(result.is_err(), "amount over per_call_cap should be denied");
    assert_eq!(ata_balance(&s.svm, &s.charlie_ata), 0);
}

#[test]
fn execute_pull_enforces_velocity_cap_across_two_pulls() {
    // per_call_cap alone would allow either pull; velocity_cap = 40M is what
    // should stop the SECOND one, since 30M + 30M > 40M in the same window.
    let mut s = build_scenario(30_000_000, 40_000_000, 3600, 100_000_000);

    let first = build_execute_pull_ix(
        &s.bob.pubkey(),
        &s.policy,
        &s.delegation,
        &s.sa_pda,
        &s.alice_ata,
        &s.charlie_ata,
        &s.mint,
        &event_authority_pda(),
        30_000_000,
        &s.charlie_ata,
    );
    let result = send(&mut s.svm, &[&s.bob], &s.bob.pubkey(), first);
    assert!(result.is_ok(), "first pull within velocity_cap should succeed: {:?}", result.err());
    assert_eq!(ata_balance(&s.svm, &s.charlie_ata), 30_000_000);

    // No clock advance — same window. 30M + 30M = 60M > 40M velocity_cap.
    let second = build_execute_pull_ix(
        &s.bob.pubkey(),
        &s.policy,
        &s.delegation,
        &s.sa_pda,
        &s.alice_ata,
        &s.charlie_ata,
        &s.mint,
        &event_authority_pda(),
        30_000_000,
        &s.charlie_ata,
    );
    let result = send(&mut s.svm, &[&s.bob], &s.bob.pubkey(), second);
    assert!(result.is_err(), "second pull should be denied by the velocity cap, not S&A's own per-delegation cap");
    // Balance stays at exactly the first pull's amount — the second never landed.
    assert_eq!(ata_balance(&s.svm, &s.charlie_ata), 30_000_000);

    // Advance past the velocity window — the cap should no longer apply to
    // a pull that starts a fresh window, proving this is a rolling window
    // and not a one-time lifetime limit.
    advance_clock(&mut s.svm, 3601);
    let third = build_execute_pull_ix(
        &s.bob.pubkey(),
        &s.policy,
        &s.delegation,
        &s.sa_pda,
        &s.alice_ata,
        &s.charlie_ata,
        &s.mint,
        &event_authority_pda(),
        30_000_000,
        &s.charlie_ata,
    );
    let result = send(&mut s.svm, &[&s.bob], &s.bob.pubkey(), third);
    assert!(result.is_ok(), "a new window should reset the velocity cap: {:?}", result.err());
    assert_eq!(ata_balance(&s.svm, &s.charlie_ata), 60_000_000);
}

#[test]
fn execute_pull_denies_when_paused() {
    let mut s = build_scenario(50_000_000, 50_000_000, 3600, 100_000_000);

    let pause_ix = build_set_paused_ix(&s.alice.pubkey(), &s.policy, true);
    send(&mut s.svm, &[&s.alice], &s.alice.pubkey(), pause_ix).expect("set_paused(true) failed");

    let pull_ix = build_execute_pull_ix(
        &s.bob.pubkey(),
        &s.policy,
        &s.delegation,
        &s.sa_pda,
        &s.alice_ata,
        &s.charlie_ata,
        &s.mint,
        &event_authority_pda(),
        10_000_000,
        &s.charlie_ata,
    );
    let result = send(&mut s.svm, &[&s.bob], &s.bob.pubkey(), pull_ix);
    assert!(result.is_err(), "a paused policy should deny every pull, regardless of amount or destination");
    assert_eq!(ata_balance(&s.svm, &s.charlie_ata), 0);
}

#[test]
fn execute_pull_denies_a_signer_who_is_not_the_registered_agent() {
    let mut s = build_scenario(50_000_000, 50_000_000, 3600, 100_000_000);

    // Mallory has no relationship to this policy at all — never registered
    // as its agent. `has_one = agent` on the Policy account should reject
    // her before evaluate() even runs.
    let mallory = Keypair::new();
    s.svm.airdrop(&mallory.pubkey(), LAMPORTS_PER_SOL).unwrap();

    let pull_ix = build_execute_pull_ix(
        &mallory.pubkey(),
        &s.policy,
        &s.delegation,
        &s.sa_pda,
        &s.alice_ata,
        &s.charlie_ata,
        &s.mint,
        &event_authority_pda(),
        10_000_000,
        &s.charlie_ata,
    );
    let result = send(&mut s.svm, &[&mallory], &mallory.pubkey(), pull_ix);
    assert!(result.is_err(), "a signer who isn't the registered agent should be rejected");
    assert_eq!(ata_balance(&s.svm, &s.charlie_ata), 0);
}

#[test]
fn update_policy_changes_take_effect_on_the_next_pull() {
    let mut s = build_scenario(50_000_000, 50_000_000, 3600, 100_000_000);

    let dave = Pubkey::new_unique();
    let dave_ata = init_ata(&mut s.svm, s.mint, dave, 0);

    // Swap the allowlist from [charlie_ata] to [dave_ata] — nothing else
    // about the policy or the underlying delegation changes.
    let update_ix =
        build_update_policy_ix(&s.alice.pubkey(), &s.policy, &s.bob.pubkey(), 50_000_000, 50_000_000, 3600, &[
            dave_ata,
        ]);
    send(&mut s.svm, &[&s.alice], &s.alice.pubkey(), update_ix).expect("update_policy failed");

    // The OLD destination is now rejected — proves the update actually took
    // effect rather than the old allowlist silently still being honored.
    let pull_to_charlie = build_execute_pull_ix(
        &s.bob.pubkey(),
        &s.policy,
        &s.delegation,
        &s.sa_pda,
        &s.alice_ata,
        &s.charlie_ata,
        &s.mint,
        &event_authority_pda(),
        10_000_000,
        &s.charlie_ata,
    );
    let result = send(&mut s.svm, &[&s.bob], &s.bob.pubkey(), pull_to_charlie);
    assert!(result.is_err(), "charlie was removed from the allowlist by update_policy");
    assert_eq!(ata_balance(&s.svm, &s.charlie_ata), 0);

    // The NEW destination works.
    let pull_to_dave = build_execute_pull_ix(
        &s.bob.pubkey(),
        &s.policy,
        &s.delegation,
        &s.sa_pda,
        &s.alice_ata,
        &dave_ata,
        &s.mint,
        &event_authority_pda(),
        10_000_000,
        &dave_ata,
    );
    let result = send(&mut s.svm, &[&s.bob], &s.bob.pubkey(), pull_to_dave);
    assert!(result.is_ok(), "dave was added to the allowlist by update_policy: {:?}", result.err());
    assert_eq!(ata_balance(&s.svm, &dave_ata), 10_000_000);
}