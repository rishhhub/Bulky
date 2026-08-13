package org.bulkby.common.util;

import java.util.regex.Pattern;

/**
 * Utility class for sanitizing user input to prevent XSS attacks and other security issues.
 */
public class InputSanitizer {
    
    // Pattern to match HTML tags
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    
    // Pattern to match script tags and event handlers
    private static final Pattern SCRIPT_PATTERN = Pattern.compile(
        "(?i)(<script[^>]*>.*?</script>|javascript:|on\\w+\\s*=)", 
        Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL
    );
    
    /**
     * Sanitizes a string by removing HTML tags and script content.
     * This prevents XSS attacks while preserving the text content.
     * 
     * @param input The input string to sanitize
     * @return Sanitized string with HTML/script tags removed, or null if input is null
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        
        String sanitized = input.trim();
        
        // Remove script tags and event handlers
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        
        // Remove HTML tags
        sanitized = HTML_TAG_PATTERN.matcher(sanitized).replaceAll("");
        
        // Escape remaining special characters
        sanitized = sanitized.replace("&", "&amp;")
                            .replace("<", "&lt;")
                            .replace(">", "&gt;")
                            .replace("\"", "&quot;")
                            .replace("'", "&#x27;");
        
        return sanitized;
    }
    
    /**
     * Sanitizes a string but allows basic formatting (for descriptions, etc.).
     * Removes script tags but allows safe HTML.
     * 
     * @param input The input string to sanitize
     * @return Sanitized string with script tags removed
     */
    public static String sanitizeAllowBasicFormatting(String input) {
        if (input == null) {
            return null;
        }
        
        String sanitized = input.trim();
        
        // Remove script tags and event handlers
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        
        return sanitized;
    }
    
    /**
     * Validates and sanitizes a URL to ensure it's safe.
     * 
     * @param url The URL to validate and sanitize
     * @return Sanitized URL or null if invalid
     */
    public static String sanitizeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }
        
        String sanitized = url.trim();
        
        // Only allow http:// and https:// URLs
        if (!sanitized.matches("^https?://.*")) {
            return null;
        }
        
        // Remove script tags
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        
        return sanitized;
    }
    
    /**
     * Truncates a string to a maximum length to prevent DoS via extremely long inputs.
     * 
     * @param input The input string
     * @param maxLength Maximum allowed length
     * @return Truncated string if longer than maxLength, otherwise original string
     */
    public static String truncate(String input, int maxLength) {
        if (input == null) {
            return null;
        }
        if (input.length() <= maxLength) {
            return input;
        }
        return input.substring(0, maxLength);
    }
}
