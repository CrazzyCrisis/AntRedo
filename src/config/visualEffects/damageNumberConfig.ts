/**
 * Damage Number Visual Effect Configuration
 * Centralized configuration for damage number styling and animation
 */

export const DAMAGE_NUMBER_CONFIG = {
    // Text styling
    fontSize: 16,
    fontWeight: 'bold',
    
    // Colors by damage type
    colors: {
        physical: '#FF4444',    // Red for physical damage
        magical: '#8844FF',     // Purple for magical damage
        healing: '#44FF44',     // Green for healing
        critical: '#FFAA00',    // Orange for critical hits
        poison: '#88FF44',      // Lime for poison damage
        fire: '#FF8800'         // Orange-red for fire damage
    },
    
    // Animation
    duration: 1000,             // Duration in milliseconds
    floatDistance: 40,          // How far up the number floats
    fadeStartTime: 0.5,         // When to start fading (0-1, 0.5 = halfway through)
    
    // Positioning
    offsetY: -20,               // Initial Y offset from entity
    randomOffsetX: 10,          // Random X offset range (-10 to +10)
    
    // Size scaling
    scaleStart: 1.5,            // Initial scale multiplier
    scaleEnd: 1.0,              // Final scale multiplier
    
    // Critical hits
    criticalScale: 2.0,         // Scale multiplier for critical hits
    criticalDuration: 1200      // Longer duration for crits
} as const;
