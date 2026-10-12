import { formatUnits, maxUint256 } from "viem";

export const WITHDRAW_ALL_AMOUNT = maxUint256;

/** Aave Pool.repay accepts maxUint256 to clear the full variable debt. */
export const REPAY_ALL_AMOUNT = maxUint256;

/**
 * Extra allowance headroom for repay(maxUint256): 2% of debt + 1 base unit.
 * Aave pulls debt at execution after accrual; exact-debt approval reverts.
 * Does not change the amount passed to Pool.repay.
 */
const REPAY_APPROVAL_BUFFER_DIVISOR = 50n;

/** The market's base currency uses 8 decimals in getUserAccountData. */
export const AAVE_BASE_CURRENCY_DECIMALS = 8;

export type ParseAmountErrorCode = "EMPTY" | "INVALID" | "NEGATIVE" | "ZERO" | "EXCESS_DECIMALS";

export class ParseAmountError extends Error {
  readonly code: ParseAmountErrorCode;

  constructor(code: ParseAmountErrorCode, message: string) {
    super(message);
    this.name = "ParseAmountError";
    this.code = code;
  }
}

/**
 * Parse a human-readable decimal amount into token base units.
 * Rejects empty, non-numeric, negative, zero, and excess fractional precision.
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const trimmed = amount.trim();

  if (!trimmed) {
    throw new ParseAmountError("EMPTY", "Amount is required.");
  }

  if (trimmed.startsWith("-")) {
    throw new ParseAmountError("NEGATIVE", "Amount must be positive.");
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new ParseAmountError("INVALID", "Amount is not a valid decimal number.");
  }

  const [wholePart, fractionPart = ""] = trimmed.split(".");

  if (fractionPart.length > decimals) {
    throw new ParseAmountError("EXCESS_DECIMALS", `Amount has too many decimal places (max ${decimals}).`);
  }

  const paddedFraction = fractionPart.padEnd(decimals, "0");
  const combined = `${wholePart}${paddedFraction}`.replace(/^0+(?=\d)/, "") || "0";
  const parsed = BigInt(combined);

  if (parsed <= 0n) {
    throw new ParseAmountError("ZERO", "Amount must be greater than zero.");
  }

  return parsed;
}

export function hasSufficientBalance(amount: bigint, balance: bigint): boolean {
  return amount <= balance;
}

export function hasSufficientAllowance(amount: bigint, allowance: bigint): boolean {
  return amount <= allowance;
}

export function isWithdrawAllAmount(amount: bigint): boolean {
  return amount === WITHDRAW_ALL_AMOUNT;
}

export function isRepayAllAmount(amount: bigint): boolean {
  return amount === REPAY_ALL_AMOUNT;
}

/**
 * Allowance to request before a full (or debt-sized) repay.
 *
 * Returns debt plus a small buffer so `repay(maxUint256)` can pull post-accrual
 * debt. Approving above wallet balance is valid ERC-20; the buffer is only
 * capped when the wallet already holds a surplus below the full buffer
 * (best-effort headroom). Callers must still disable repay-all when
 * `walletBalance < debt`.
 */
export function repayApprovalAmount(debt: bigint, walletBalance: bigint): bigint {
  if (debt <= 0n) {
    return 0n;
  }

  const buffered = debt + debt / REPAY_APPROVAL_BUFFER_DIVISOR + 1n;

  if (walletBalance >= buffered) {
    return buffered;
  }

  if (walletBalance > debt) {
    return walletBalance;
  }

  return buffered;
}

/**
 * Largest underlying amount that can be withdrawn while keeping health factor ≥ 1.
 *
 * Aave's `withdraw(maxUint256)` always burns the full aToken balance, then reverts if HF
 * would fall below 1 — it does not auto-cap. Callers with open debt must pass this amount
 * (or `maxUint256` only when the result equals `deposited` / debt is zero).
 *
 * Uses the user-weighted liquidation threshold from `getUserAccountData`. Applies a 0.1%
 * haircut on partial withdrawals so index/price rounding does not push HF under 1.
 */
export function maxWithdrawableUnderlying(params: {
  deposited: bigint;
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  liquidationThresholdBps: bigint;
  assetPriceBase: bigint;
  assetDecimals: number;
  availableLiquidity?: bigint;
}): bigint {
  const {
    deposited,
    totalCollateralBase,
    totalDebtBase,
    liquidationThresholdBps,
    assetPriceBase,
    assetDecimals,
    availableLiquidity,
  } = params;

  if (deposited <= 0n) {
    return 0n;
  }

  let amount: bigint;

  if (totalDebtBase === 0n) {
    amount = deposited;
  } else if (liquidationThresholdBps === 0n || assetPriceBase === 0n) {
    return 0n;
  } else {
    // HF ≥ 1 ⇔ collateralBase ≥ ceil(debtBase * 10_000 / LT_bps)
    const minCollateralBase =
      (totalDebtBase * 10_000n + liquidationThresholdBps - 1n) / liquidationThresholdBps;

    if (totalCollateralBase <= minCollateralBase) {
      return 0n;
    }

    const withdrawableBase = totalCollateralBase - minCollateralBase;
    const scale = 10n ** BigInt(assetDecimals);
    const rawAmount = (withdrawableBase * scale) / assetPriceBase;

    if (rawAmount >= deposited) {
      amount = deposited;
    } else {
      const buffered = (rawAmount * 999n) / 1000n;
      amount = buffered > 0n ? buffered : 0n;
    }
  }

  if (availableLiquidity !== undefined && amount > availableLiquidity) {
    amount = availableLiquidity;
  }

  return amount;
}

/**
 * Format Aave health factor (1e18 = 1.0). No debt → maxUint256 → "∞".
 */
export function formatHealthFactor(healthFactor: bigint): string {
  if (healthFactor === maxUint256) {
    return "∞";
  }

  try {
    const formatted = formatUnits(healthFactor, 18);
    const [whole, fraction = ""] = formatted.split(".");
    if (!fraction) {
      return whole;
    }
    const trimmedFraction = fraction.slice(0, 4).replace(/0+$/, "");
    return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
  } catch {
    return healthFactor.toString();
  }
}

/** Format Aave getUserAccountData base-currency amounts (8 decimals). */
export function formatAaveBaseAmount(value: bigint): string {
  try {
    return formatUnits(value, AAVE_BASE_CURRENCY_DECIMALS);
  } catch {
    return value.toString();
  }
}
