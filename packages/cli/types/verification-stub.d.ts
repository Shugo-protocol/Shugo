/**
 * VERIFICATION-ONLY STUBS. Not part of the published package. Same
 * situation and same caveat as packages/sdk/types/verification-stub.d.ts —
 * no network access to `npm install` the real libraries here, so these
 * declare only the symbols actually used, based on each library's
 * long-stable, well-known API. Running `tsc --noEmit` against these proves
 * this package's code is internally consistent; it does NOT prove these
 * signatures exactly match the real libraries' current .d.ts files.
 *
 * DELETE THIS FILE once `pnpm install` has actually run in this package —
 * the real packages' own types must take over.
 *
 * One deliberate simplification, different from a mismatch: commander's
 * real types use generics to type an `action()` callback's options object
 * precisely from the preceding `.option()` calls. This stub types that
 * parameter as `any` instead of replicating that machinery, so it can't
 * catch "read an option that was never declared" the way the real library's
 * advanced typing sometimes can. Most real-world commander code relies on
 * the same loose typing this stub uses, so this isn't a meaningful gap for
 * how the CLI's commands are actually written here.
 */

declare class Buffer extends Uint8Array {
  static alloc(size: number): Buffer;
  static concat(list: ReadonlyArray<Uint8Array>): Buffer;
  static from(value: string | ReadonlyArray<number> | Uint8Array, encodingOrOffset?: string): Buffer;
  writeUInt8(value: number, offset: number): number;
  writeUInt32LE(value: number, offset: number): number;
  writeBigUInt64LE(value: bigint, offset: number): number;
  writeBigInt64LE(value: bigint, offset: number): number;
  readUInt8(offset: number): number;
  readBigUInt64LE(offset: number): bigint;
  readBigInt64LE(offset: number): bigint;
  subarray(start?: number, end?: number): Buffer;
}

// eslint-disable-next-line no-var
declare const console: { log(...args: unknown[]): void; error(...args: unknown[]): void };
declare const process: { argv: string[]; exitCode?: number };

declare module "node:fs" {
  export function readFileSync(path: string, encoding: string): string;
}

declare module "node:os" {
  export function homedir(): string;
}

declare module "node:path" {
  export function join(...parts: string[]): string;
}

declare module "commander" {
  export class Command {
    constructor(name?: string);
    name(name: string): this;
    description(description: string): this;
    version(version: string): this;
    command(nameAndArgs: string): Command;
    argument(name: string, description?: string): this;
    option(flags: string, description?: string, defaultValue?: string | boolean): this;
    requiredOption(flags: string, description?: string, defaultValue?: string | boolean): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action(fn: (...args: any[]) => void | Promise<void>): this;
    parseAsync(argv?: readonly string[]): Promise<this>;
  }
}

declare module "@solana/web3.js" {
  export class PublicKey {
    constructor(value: string | Uint8Array | Buffer | ReadonlyArray<number>);
    toBuffer(): Buffer;
    toBase58(): string;
    equals(other: PublicKey): boolean;
    static findProgramAddressSync(
      seeds: ReadonlyArray<Buffer | Uint8Array>,
      programId: PublicKey,
    ): [PublicKey, number];
  }

  export interface AccountMeta {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }

  export class TransactionInstruction {
    constructor(opts: { programId: PublicKey; keys: AccountMeta[]; data: Buffer });
  }

  export class Transaction {
    constructor();
    feePayer?: PublicKey;
    recentBlockhash?: string;
    add(...items: TransactionInstruction[]): this;
  }

  export interface AccountInfoLike {
    data: Buffer;
    owner: PublicKey;
    lamports: number;
    executable: boolean;
  }

  export interface LatestBlockhash {
    blockhash: string;
    lastValidBlockHeight: number;
  }

  export class Connection {
    constructor(endpoint: string, commitmentOrConfig?: unknown);
    getAccountInfo(publicKey: PublicKey): Promise<AccountInfoLike | null>;
    getLatestBlockhash(): Promise<LatestBlockhash>;
  }

  export const SystemProgram: {
    programId: PublicKey;
  };

  export class Keypair {
    publicKey: PublicKey;
    static fromSecretKey(secretKey: Uint8Array): Keypair;
    static generate(): Keypair;
  }

  export function clusterApiUrl(cluster: string): string;

  export function sendAndConfirmTransaction(
    connection: Connection,
    transaction: Transaction,
    signers: Keypair[],
  ): Promise<string>;
}