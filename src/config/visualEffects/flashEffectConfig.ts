/**
 * Flash Effect Configuration
 * Color overlays and screen flashes for various events
 */

export const FLASH_EFFECT_CONFIG = {
    // Damage flash
    damage: {
        color: '#FF0000',       // Red flash
        duration: 200,          // Duration in milliseconds
        intensity: 0.7,         // Blend intensity (0-1)
        pulseCount: 2           // Number of pulses
    },
    
    // Healing flash
    heal: {
        color: '#00FF00',       // Green flash
        duration: 300,
        intensity: 0.5,
        pulseCount: 1
    },
    
    // Critical hit flash
    critical: {
        color: '#FFFF00',       // Yellow flash
        duration: 250,
        intensity: 0.9,
        pulseCount: 3
    },
    
    // Power-up/buff flash
    powerup: {
        color: '#00FFFF',       // Cyan flash
        duration: 400,
        intensity: 0.6,
        pulseCount: 2
    },
    
    // Death flash
    death: {
        color: '#880000',       // Dark red flash
        duration: 500,
        intensity: 1.0,
        pulseCount: 1
    }
} as const;
