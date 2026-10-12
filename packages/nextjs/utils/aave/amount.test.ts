import {
  ParseAmountError,
  REPAY_ALL_AMOUNT,
  WITHDRAW_ALL_AMOUNT,
  formatAaveBaseAmount,
  formatHealthFactor,
  hasSufficientAllowance,
  hasSufficientBalance,
  isRepayAllAmount,
  isWithdrawAllAmount,
  maxWithdrawableUnderlying,
  parseTokenAmount,
  repayApprovalAmount,
} from "./amount";
import { maxUint256 } from "viem";
import { describe, expect, it } from "vitest";

describe("parseTokenAmount", () => {
  it("parses whole and fractional amounts with 6 decimals", () => {
    expect(parseTokenAmount("1", 6)).toBe(1_000_000n);
    expect(parseTokenAmount("1.5", 6)).toBe(1_500_000n);
    expect(parseTokenAmount("0.000001", 6)).toBe(1n);
  });

  it("parses amounts with 2 decimals (EURS-style)", () => {
    expect(parseTokenAmount("1", 2)).toBe(100n);
    expect(parseTokenAmount("1.5", 2)).toBe(150n);
    expect(parseTokenAmount("0.01", 2)).toBe(1n);
    expect(() => parseTokenAmount("1.001", 2)).toThrow(/too many decimal/i);
  });

  it("rejects empty input", () => {
    expect(() => parseTokenAmount("", 6)).toThrow(ParseAmountError);
    expect(() => parseTokenAmount("   ", 6)).toThrow(/required/i);
  });

  it("rejects invalid and negative amounts", () => {
    expect(() => parseTokenAmount("abc", 6)).toThrow(/valid decimal/i);
    expect(() => parseTokenAmount("-1", 6)).toThrow(/positive/i);
    expect(() => parseTokenAmount("1.2.3", 6)).toThrow(/valid decimal/i);
  });

  it("rejects zero", () => {
    expect(() => parseTokenAmount("0", 6)).toThrow(/greater than zero/i);
    expect(() => parseTokenAmount("0.0", 6)).toThrow(/greater than zero/i);
  });

  it("rejects excess decimal precision", () => {
    expect(() => parseTokenAmount("1.1234567", 6)).toThrow(/too many decimal/i);
  });
});

describe("balance and allowance guards", () => {
  it("detects insufficient balance", () => {
    expect(hasSufficientBalance(100n, 50n)).toBe(false);
    expect(hasSufficientBalance(50n, 50n)).toBe(true);
    expect(hasSufficientBalance(10n, 50n)).toBe(true);
  });

  it("detects insufficient allowance", () => {
    expect(hasSufficientAllowance(100n, 0n)).toBe(false);
    expect(hasSufficientAllowance(100n, 100n)).toBe(true);
  });
});

describe("withdraw-all and repay-all amounts", () => {
  it("uses maxUint256 for withdraw all", () => {
    expect(isWithdrawAllAmount(WITHDRAW_ALL_AMOUNT)).toBe(true);
    expect(isWithdrawAllAmount(1n)).toBe(false);
  });

  it("uses maxUint256 for repay all", () => {
    expect(isRepayAllAmount(REPAY_ALL_AMOUNT)).toBe(true);
    expect(REPAY_ALL_AMOUNT).toBe(WITHDRAW_ALL_AMOUNT);
    expect(isRepayAllAmount(1n)).toBe(false);
  });
});

describe("repayApprovalAmount", () => {
  it("returns zero when there is no debt", () => {
    expect(repayApprovalAmount(0n, 1_000_000n)).toBe(0n);
  });

  it("adds a 2% plus one-unit buffer above debt", () => {
    const debt = 1_000_000n;
    // 1_000_000 + 20_000 + 1
    expect(repayApprovalAmount(debt, debt)).toBe(1_020_001n);
  });

  it("requests the buffer when the wallet cannot cover debt", () => {
    const debt = 1_000_000n;
    expect(repayApprovalAmount(debt, debt / 2n)).toBe(1_020_001n);
  });

  it("uses wallet surplus as best-effort headroom when below the full buffer", () => {
    const debt = 1_000_000n;
    const wallet = 1_010_000n;
    expect(repayApprovalAmount(debt, wallet)).toBe(wallet);
  });

  it("caps at the buffered amount when the wallet already covers it", () => {
    const debt = 1_000_000n;
    const buffered = 1_020_001n;
    expect(repayApprovalAmount(debt, 5_000_000n)).toBe(buffered);
  });

  it("handles dust debt (1 base unit)", () => {
    // 1 + 0 + 1
    expect(repayApprovalAmount(1n, 0n)).toBe(2n);
  });
});

describe("maxWithdrawableUnderlying", () => {
  const ethDecimals = 18;
  /** NZ$3,090 with 8 base decimals. */
  const ethPrice = 309_000_000_000n;

  it("returns the full deposit when there is no debt", () => {
    const deposited = 10n ** 17n; // 0.1 ETH
    expect(
      maxWithdrawableUnderlying({
        deposited,
        totalCollateralBase: 30_900_000_000n,
        totalDebtBase: 0n,
        liquidationThresholdBps: 8000n,
        assetPriceBase: ethPrice,
        assetDecimals: ethDecimals,
      }),
    ).toBe(deposited);
  });

  it("returns zero when debt fully consumes the liquidation buffer", () => {
    // 0.32 ETH ≈ NZ$989; LT 80% → max debt at HF=1 is 0.8 * 989
    const deposited = 32n * 10n ** 16n;
    const collateralBase = (deposited * ethPrice) / 10n ** 18n;
    const debtAtHfOne = (collateralBase * 8000n) / 10_000n;

    expect(
      maxWithdrawableUnderlying({
        deposited,
        totalCollateralBase: collateralBase,
        totalDebtBase: debtAtHfOne,
        liquidationThresholdBps: 8000n,
        assetPriceBase: ethPrice,
        assetDecimals: ethDecimals,
      }),
    ).toBe(0n);
  });

  it("returns a partial amount when only some collateral is free", () => {
    const deposited = 32n * 10n ** 16n; // 0.32 ETH
    const collateralBase = (deposited * ethPrice) / 10n ** 18n;
    // Borrow half of the HF=1 capacity so roughly half the collateral is free.
    const debt = (collateralBase * 8000n) / 10_000n / 2n;

    const result = maxWithdrawableUnderlying({
      deposited,
      totalCollateralBase: collateralBase,
      totalDebtBase: debt,
      liquidationThresholdBps: 8000n,
      assetPriceBase: ethPrice,
      assetDecimals: ethDecimals,
    });

    expect(result).toBeGreaterThan(0n);
    expect(result).toBeLessThan(deposited);
  });

  it("caps at available market liquidity", () => {
    const deposited = 10n ** 18n;
    const liquidity = 10n ** 17n;

    expect(
      maxWithdrawableUnderlying({
        deposited,
        totalCollateralBase: 0n,
        totalDebtBase: 0n,
        liquidationThresholdBps: 8000n,
        assetPriceBase: ethPrice,
        assetDecimals: ethDecimals,
        availableLiquidity: liquidity,
      }),
    ).toBe(liquidity);
  });

  it("with debt never returns more than the liquidity-capped HF amount", () => {
    const deposited = 32n * 10n ** 16n;
    const collateralBase = (deposited * ethPrice) / 10n ** 18n;
    const debt = (collateralBase * 8000n) / 10_000n / 2n;
    const tinyLiquidity = 10n ** 15n;

    const result = maxWithdrawableUnderlying({
      deposited,
      totalCollateralBase: collateralBase,
      totalDebtBase: debt,
      liquidationThresholdBps: 8000n,
      assetPriceBase: ethPrice,
      assetDecimals: ethDecimals,
      availableLiquidity: tinyLiquidity,
    });

    expect(result).toBe(tinyLiquidity);
  });
});

describe("formatHealthFactor", () => {
  it("shows infinity when health factor is maxUint256 (no debt)", () => {
    expect(formatHealthFactor(maxUint256)).toBe("∞");
  });

  it("formats 1e18-scaled health factors", () => {
    expect(formatHealthFactor(10n ** 18n)).toBe("1");
    expect(formatHealthFactor(15n * 10n ** 17n)).toBe("1.5");
  });
});

describe("formatAaveBaseAmount", () => {
  it("formats 8-decimal base currency amounts", () => {
    expect(formatAaveBaseAmount(100_000_000n)).toBe("1");
    expect(formatAaveBaseAmount(150_000_000n)).toBe("1.5");
  });
});
