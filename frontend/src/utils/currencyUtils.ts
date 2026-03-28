/**
 * Utility functions for currency conversion between gold, silver, and copper.
 * Conversion rates:
 * - 1 gold = 10 silver
 * - 1 gold = 1000 copper
 * - 1 silver = 100 copper
 */

export const COPPER_PER_SILVER = 100;
export const COPPER_PER_GOLD = 1000;

/**
 * Convert gold, silver, and copper to total copper value.
 */
export const toCopperValue = (gold: number, silver: number, copper: number): number => {
  return gold * COPPER_PER_GOLD + silver * COPPER_PER_SILVER + copper;
};

/**
 * Extract gold amount from total copper value.
 */
export const getGold = (copperValue: number | null | undefined): number => {
  return copperValue ? Math.floor(copperValue / COPPER_PER_GOLD) : 0;
};

/**
 * Extract silver amount from total copper value (0-99).
 */
export const getSilver = (copperValue: number | null | undefined): number => {
  return copperValue ? Math.floor((copperValue % COPPER_PER_GOLD) / COPPER_PER_SILVER) : 0;
};

/**
 * Extract copper amount from total copper value (0-99).
 */
export const getCopper = (copperValue: number | null | undefined): number => {
  return copperValue ? copperValue % COPPER_PER_SILVER : 0;
};
