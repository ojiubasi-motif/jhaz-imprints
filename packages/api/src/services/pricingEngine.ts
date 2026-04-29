/**
 * Pricing engine for computing order totals.
 * Pure function — no database calls, fully unit-testable.
 */

export interface PricingInput {
  basePrice: number;
  fabricPriceModifier?: number;
  stylePriceModifier?: number;
}

/**
 * Compute total order price by applying fabric and style modifiers.
 *
 * @param input - Base price and modifiers
 * @returns Total price rounded to 2 decimal places
 *
 * @example
 *   computeOrderTotal({
 *     basePrice: 45000,
 *     fabricPriceModifier: 10000,
 *     stylePriceModifier: 5000
 *   }) // → 60000
 */
export function computeOrderTotal(input: PricingInput): number {
  const fabricModifier = input.fabricPriceModifier ?? 0;
  const styleModifier = input.stylePriceModifier ?? 0;

  const total = input.basePrice + fabricModifier + styleModifier;

  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}
