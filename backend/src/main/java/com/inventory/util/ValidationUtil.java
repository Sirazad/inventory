package com.inventory.util;

import com.inventory.exception.InvalidOperationException;

/**
 * Utility class for common input validation.
 */
public final class ValidationUtil {
    
    private ValidationUtil() {
        // Private constructor to prevent instantiation
    }
    
    /**
     * Validate that a string is not null or empty.
     * 
     * @param value The string to validate
     * @param fieldName The name of the field for error message
     * @throws InvalidOperationException if the string is null or empty
     */
    public static void requireNonEmpty(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new InvalidOperationException(fieldName + " cannot be empty");
        }
    }
    
    /**
     * Validate that a number is not null and is positive.
     * 
     * @param value The number to validate
     * @param fieldName The name of the field for error message
     * @throws InvalidOperationException if the number is null or not positive
     */
    public static void requirePositive(Integer value, String fieldName) {
        if (value == null || value <= 0) {
            throw new InvalidOperationException(fieldName + " must be positive");
        }
    }
    
    /**
     * Validate that a number is within a specific range.
     * 
     * @param value The number to validate
     * @param min The minimum value (inclusive)
     * @param max The maximum value (inclusive)
     * @param fieldName The name of the field for error message
     * @throws InvalidOperationException if the number is outside the range
     */
    public static void requireInRange(Integer value, int min, int max, String fieldName) {
        if (value == null || value < min || value > max) {
            throw new InvalidOperationException(
                    fieldName + " must be between " + min + " and " + max);
        }
    }
}
