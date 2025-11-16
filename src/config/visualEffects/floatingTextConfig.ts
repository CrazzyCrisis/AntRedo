/**
 * Floating Text Effect Configuration
 * Non-damage text like "+XP", "Level Up!", resource collection
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
