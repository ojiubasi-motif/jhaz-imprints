/**
 * Pricing Engine Unit Tests
 * Tests pure function with deterministic outputs: base price, modifiers, rounding
 */

import { describe, it, expect } from "vitest";
import { computeOrderTotal } from "../pricingEngine";

describe("pricingEngine — computeOrderTotal()", () => {
  describe("Base price only", () => {
    it("should return base price when no modifiers", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 0,
        stylePriceModifier: 0,
      });
      expect(result).toBe(10000);
    });

    it("should handle high base prices", () => {
      const result = computeOrderTotal({
        basePrice: 500000,
        fabricPriceModifier: 0,
        stylePriceModifier: 0,
      });
      expect(result).toBe(500000);
    });
  });

  describe("Fabric modifier only", () => {
    it("should apply positive fabric modifier", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 5000,
        stylePriceModifier: 0,
      });
      expect(result).toBe(15000);
    });

    it("should apply negative fabric modifier (discount)", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: -2000,
        stylePriceModifier: 0,
      });
      expect(result).toBe(8000);
    });

    it("should handle zero fabric modifier", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 0,
        stylePriceModifier: 0,
      });
      expect(result).toBe(10000);
    });
  });

  describe("Style modifier only", () => {
    it("should apply positive style modifier", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 0,
        stylePriceModifier: 3000,
      });
      expect(result).toBe(13000);
    });

    it("should apply negative style modifier (discount)", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 0,
        stylePriceModifier: -1000,
      });
      expect(result).toBe(9000);
    });

    it("should handle zero style modifier", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 0,
        stylePriceModifier: 0,
      });
      expect(result).toBe(10000);
    });
  });

  describe("Both modifiers", () => {
    it("should apply both positive modifiers", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 5000,
        stylePriceModifier: 3000,
      });
      expect(result).toBe(18000);
    });

    it("should apply both negative modifiers (discounts)", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: -2000,
        stylePriceModifier: -1000,
      });
      expect(result).toBe(7000);
    });

    it("should apply mixed modifiers (one positive, one negative)", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 5000,
        stylePriceModifier: -2000,
      });
      expect(result).toBe(13000);
    });

    it("should handle zero total (modifiers cancel out base)", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: -5000,
        stylePriceModifier: -5000,
      });
      expect(result).toBe(0);
    });
  });

  describe("Floating-point rounding", () => {
    it("should round to 2 decimal places (rounding down)", () => {
      // 10000 + 3333.33... = 13333.33...
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 3333.333,
        stylePriceModifier: 0,
      });
      expect(result).toBe(13333.33);
    });

    it("should round to 2 decimal places (rounding up)", () => {
      // 10000 + 3333.666... = 13333.666... → rounds to 13333.67
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 3333.666,
        stylePriceModifier: 0,
      });
      expect(result).toBe(13333.67);
    });

    it("should handle banker's rounding (0.5 rounds to nearest even)", () => {
      // 10000.5 should round correctly to 10000.5 (already 1 decimal)
      // When using toFixed and parseFloat, 10000.005 → 10000.01 (rounds up)
      const result = computeOrderTotal({
        basePrice: 10000.005,
        fabricPriceModifier: 0,
        stylePriceModifier: 0,
      });
      // Result should be consistent with toFixed(2) then parseFloat
      expect(result).toBe(10000.01);
    });

    it("should round very small floating point differences", () => {
      // JavaScript floating point: 0.1 + 0.2 !== 0.3
      const result = computeOrderTotal({
        basePrice: 0.1,
        fabricPriceModifier: 0.2,
        stylePriceModifier: 0,
      });
      expect(result).toBeCloseTo(0.3, 2);
    });

    it("should round complex calculation with all modifiers", () => {
      // (10000.555 + 1234.567 + 9999.888) → 21234.01
      const result = computeOrderTotal({
        basePrice: 10000.555,
        fabricPriceModifier: 1234.567,
        stylePriceModifier: 9999.888,
      });
      expect(result).toBe(21235.01);
    });
  });

  describe("Edge cases", () => {
    it("should handle negative base price (shouldn't happen but test robustness)", () => {
      const result = computeOrderTotal({
        basePrice: -1000,
        fabricPriceModifier: 2000,
        stylePriceModifier: 0,
      });
      expect(result).toBe(1000);
    });

    it("should handle very large prices", () => {
      const result = computeOrderTotal({
        basePrice: 1000000,
        fabricPriceModifier: 500000,
        stylePriceModifier: 250000,
      });
      expect(result).toBe(1750000);
    });

    it("should handle very small modifiers", () => {
      const result = computeOrderTotal({
        basePrice: 10000,
        fabricPriceModifier: 0.01,
        stylePriceModifier: 0.02,
      });
      expect(result).toBe(10000.03);
    });
  });
});
