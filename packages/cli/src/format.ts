import type { Connection, PublicKey } from "@solana/web3.js";

/** Byte offset of `decimals` in the base (no-extensions) SPL Mint layout. */
const MINT_DECIMALS_OFFSET = 44;

/**
 * Reads just the `decimals` field from a mint account. Deliberately not a
 * full Mint layout decoder or a dependency on `@solana/spl-token` — this is
 * the one field the CLI needs to turn UI amounts into base units. Works for
 * both classic SPL Token and Token-2022 mints: the base 82-byte layout is
 * byte-identical between them regardless of any extensions appended after
 * it, the same fact this whole project's Token-2022 research rests on.
 */
export async function fetchMintDecimals(connection: Connection, mint: PublicKey): Promise<number> {
  const info = await connection.getAccountInfo(mint);
  if (info === null) throw new Error(`no mint account found at ${mint.toBase58()}`);
  if (info.data.length < MINT_DECIMALS_OFFSET + 1) {
    throw new Error(`account at ${mint.toBase58()} is too short to be a mint`);
  }
  return info.data.readUInt8(MINT_DECIMALS_OFFSET);
}

/**
 * Converts a human-entered UI amount ("50.5") to base units for a mint with
 * the given decimals. Logic proven against 7 cases (whole numbers,
 * fractions, a leading-dot input, zero, and a 9-decimal mint) with a plain
 * Node script before being wired in here — see the project notes for the
 * exact test run.
 */
export function toBaseUnits(uiAmount: string, decimals: number): bigint {
  const [whole, frac = ""] = uiAmount.split(".");
  if (frac.length > decimals) {
    throw new Error(`amount ${uiAmount} has more decimal places than the mint's ${decimals}`);
  }
  const paddedFrac = frac.padEnd(decimals, "0");
  const combined = `${whole}${paddedFrac}`.replace(/^0+(?=\d)/, "");
  return BigInt(combined === "" ? "0" : combined);
}

/** Converts base units back to a UI-friendly decimal string. Round-trips with `toBaseUnits`, proven. */
export function toUiAmount(baseUnits: bigint, decimals: number): string {
  const s = baseUnits.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals) || "0";
  const frac = s.slice(s.length - decimals);
  return frac.length > 0 ? `${whole}.${frac}`.replace(/0+$/, "").replace(/\.$/, "") : whole;
}