import type { PublicKey as PublicKeyType } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

/**
 * Hand-rolled, dependency-free byte encoding for our own program's
 * instruction data — the same approach used on the Rust side (see
 * `ByteWriter`/`ByteReader` in the tokenlint work, and the hand-built
 * instructions in the Rust integration tests). Every layout here is a
 * small, fixed shape (u64/i64/pubkey/bool/vec<pubkey>), so a real Borsh
 * library buys nothing but an unverifiable dependency — we can't `npm
 * install` here to confirm its exact current API.
 */

export class ByteWriter {
  private chunks: Buffer[] = [];

  u8(value: number): this {
    const b = Buffer.alloc(1);
    b.writeUInt8(value, 0);
    this.chunks.push(b);
    return this;
  }

  bool(value: boolean): this {
    return this.u8(value ? 1 : 0);
  }

  u64(value: bigint): this {
    const b = Buffer.alloc(8);
    b.writeBigUInt64LE(value, 0);
    this.chunks.push(b);
    return this;
  }

  i64(value: bigint): this {
    const b = Buffer.alloc(8);
    b.writeBigInt64LE(value, 0);
    this.chunks.push(b);
    return this;
  }

  pubkey(value: PublicKeyType): this {
    this.chunks.push(value.toBuffer());
    return this;
  }

  /** Borsh `Vec<Pubkey>`: 4-byte LE length, then each 32-byte key. */
  vecPubkey(values: PublicKeyType[]): this {
    const len = Buffer.alloc(4);
    len.writeUInt32LE(values.length, 0);
    this.chunks.push(len);
    for (const v of values) this.chunks.push(v.toBuffer());
    return this;
  }

  bytes(value: Buffer): this {
    this.chunks.push(value);
    return this;
  }

  build(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

export class ByteReader {
  private offset = 0;

  constructor(private readonly data: Buffer) {}

  u8(): number {
    const v = this.data.readUInt8(this.offset);
    this.offset += 1;
    return v;
  }

  bool(): boolean {
    return this.u8() !== 0;
  }

  u64(): bigint {
    const v = this.data.readBigUInt64LE(this.offset);
    this.offset += 8;
    return v;
  }

  i64(): bigint {
    const v = this.data.readBigInt64LE(this.offset);
    this.offset += 8;
    return v;
  }

  pubkey(): PublicKeyType {
    const v = new PublicKey(this.data.subarray(this.offset, this.offset + 32));
    this.offset += 32;
    return v;
  }
}