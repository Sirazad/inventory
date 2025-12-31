package com.inventory.util;

/**
 * Utility class for currency conversion between gold, silver, and copper.
 * Conversion rates:
 * - 1 gold = 10 silver
 * - 1 gold = 1000 copper
 * - 1 silver = 100 copper
 */
public final class CurrencyUtil {
    
    private static final int COPPER_PER_SILVER = 100;
    private static final int COPPER_PER_GOLD = 1000;
    
    private CurrencyUtil() {
        // Private constructor to prevent instantiation
    }
    
    /**
     * Convert gold, silver, and copper to total copper value.
     * 
     * @param gold Gold amount (can be null)
     * @param silver Silver amount (can be null)
     * @param copper Copper amount (can be null)
     * @return Total value in copper, or null if all inputs are null or zero
     */
    public static Long toCopperValue(Long gold, Long silver, Long copper) {
        long totalCopper = 0;
        if (gold != null) totalCopper += gold * COPPER_PER_GOLD;
        if (silver != null) totalCopper += silver * COPPER_PER_SILVER;
        if (copper != null) totalCopper += copper;
        return totalCopper > 0 ? totalCopper : null;
    }
    
    /**
     * Extract gold amount from total copper value.
     * 
     * @param copperValue Total value in copper (can be null)
     * @return Gold amount, or 0 if copperValue is null
     */
    public static Long getGold(Long copperValue) {
        return copperValue != null ? copperValue / COPPER_PER_GOLD : 0;
    }
    
    /**
     * Extract silver amount from total copper value.
     * 
     * @param copperValue Total value in copper (can be null)
     * @return Silver amount (0-99), or 0 if copperValue is null
     */
    public static Long getSilver(Long copperValue) {
        return copperValue != null ? (copperValue % COPPER_PER_GOLD) / COPPER_PER_SILVER : 0;
    }
    
    /**
     * Extract copper amount from total copper value.
     * 
     * @param copperValue Total value in copper (can be null)
     * @return Copper amount (0-99), or 0 if copperValue is null
     */
    public static Long getCopper(Long copperValue) {
        return copperValue != null ? copperValue % COPPER_PER_SILVER : 0;
    }
}
