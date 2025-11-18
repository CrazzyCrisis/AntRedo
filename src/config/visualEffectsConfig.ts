/**
 * Visual Effects Configuration
 * Centralized configuration for all visual effects (damage numbers, flashes, particles, etc.)
 * 
 * Following config-first philosophy - all effect parameters defined here for easy tuning
 */

/**
 * Damage Number Effect Configuration
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

/**
 * Flash Effect Configuration
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

/**
 * Floating Text Effect Configuration (non-damage text like "+XP", "Level Up!")
 */
export const FLOATING_TEXT_CONFIG = {
    // Text styling
    fontSize: 14,
    fontWeight: 'normal',
    
    // Preset colors
    colors: {
        xp: '#FFD700',          // Gold for XP gains
        levelUp: '#FF00FF',     // Magenta for level ups
        resource: '#00FFFF',    // Cyan for resource collection
        achievement: '#FFAA00'  // Orange for achievements
    },
    
    // Animation
    duration: 1500,
    floatDistance: 60,
    fadeStartTime: 0.3,
    
    // Positioning
    offsetY: -30,
    randomOffsetX: 15
} as const;

/**
 * Visual Effect Presets - Easy-to-use preset configurations
 */
export const VFX_PRESETS = {
    // Damage presets
    DAMAGE_PHYSICAL: {
        type: 'damage',
        color: DAMAGE_NUMBER_CONFIG.colors.physical
    },
    DAMAGE_MAGICAL: {
        type: 'damage',
        color: DAMAGE_NUMBER_CONFIG.colors.magical
    },
    DAMAGE_CRITICAL: {
        type: 'damage',
        color: DAMAGE_NUMBER_CONFIG.colors.critical,
        scale: DAMAGE_NUMBER_CONFIG.criticalScale,
        duration: DAMAGE_NUMBER_CONFIG.criticalDuration
    },
    HEALING: {
        type: 'damage',
        color: DAMAGE_NUMBER_CONFIG.colors.healing
    },
    
    // Flash presets
    FLASH_DAMAGE: FLASH_EFFECT_CONFIG.damage,
    FLASH_HEAL: FLASH_EFFECT_CONFIG.heal,
    FLASH_CRITICAL: FLASH_EFFECT_CONFIG.critical,
    FLASH_POWERUP: FLASH_EFFECT_CONFIG.powerup,
    FLASH_DEATH: FLASH_EFFECT_CONFIG.death,
    
    // Text presets
    TEXT_XP: {
        type: 'text',
        color: FLOATING_TEXT_CONFIG.colors.xp
    },
    TEXT_LEVEL_UP: {
        type: 'text',
        color: FLOATING_TEXT_CONFIG.colors.levelUp
    },
    TEXT_RESOURCE: {
        type: 'text',
        color: FLOATING_TEXT_CONFIG.colors.resource
    }
} as const;
