/**
 * Status Bar Configuration
 * Centralized colors and settings for all status bars (health, hunger, oxygen, stamina, etc.)
 */

export interface StatusBarColorThreshold {
    threshold: number; // Percentage (0.0 to 1.0)
    color: { r: number; g: number; b: number };
}

export interface StatusBarConfig {
    /** Array of color thresholds, sorted from highest to lowest */
    colors: StatusBarColorThreshold[];
    /** Event names to listen for value changes */
    events: {
        damaged?: string;  // Value decreased
        healed?: string;   // Value increased
    };
    /** Bar visual settings */
    visual?: {
        width?: number;
        height?: number;
        offsetY?: number;
        borderThickness?: number;
    };
}

export const STATUS_BAR_CONFIGS: Record<string, StatusBarConfig> = {
    health: {
        colors: [
            { threshold: 0.6, color: { r: 50, g: 200, b: 50 } },   // Green (healthy: 60%+)
            { threshold: 0.3, color: { r: 220, g: 200, b: 50 } },  // Yellow (wounded: 30-60%)
            { threshold: 0.0, color: { r: 220, g: 50, b: 50 } }    // Red (critical: <30%)
        ],
        events: {
            damaged: 'ENTITY_DAMAGED',
            healed: 'ENTITY_HEALED'
        }
    },
    
    hunger: {
        colors: [
            { threshold: 0.6, color: { r: 100, g: 180, b: 255 } }, // Blue (satisfied: 60%+)
            { threshold: 0.3, color: { r: 255, g: 160, b: 80 } },  // Orange (hungry: 30-60%)
            { threshold: 0.0, color: { r: 200, g: 50, b: 200 } }   // Purple (starving: <30%)
        ],
        events: {
            damaged: 'ENTITY_HUNGER_DEPLETED',
            healed: 'ENTITY_HUNGER_RESTORED'
        },
        visual: {
            offsetY: -25 // Slightly higher than health bar
        }
    },
    
    oxygen: {
        colors: [
            { threshold: 0.6, color: { r: 100, g: 220, b: 255 } }, // Cyan (breathing: 60%+)
            { threshold: 0.3, color: { r: 255, g: 200, b: 100 } }, // Yellow-orange (low: 30-60%)
            { threshold: 0.0, color: { r: 255, g: 80, b: 80 } }    // Red (drowning: <30%)
        ],
        events: {
            damaged: 'ENTITY_OXYGEN_DEPLETED',
            healed: 'ENTITY_OXYGEN_RESTORED'
        },
        visual: {
            offsetY: -30 // Above hunger bar
        }
    },
    
    stamina: {
        colors: [
            { threshold: 0.6, color: { r: 255, g: 220, b: 80 } },  // Yellow (energized: 60%+)
            { threshold: 0.3, color: { r: 255, g: 150, b: 80 } },  // Orange (tired: 30-60%)
            { threshold: 0.0, color: { r: 180, g: 100, b: 100 } }  // Brown-red (exhausted: <30%)
        ],
        events: {
            damaged: 'ENTITY_STAMINA_DEPLETED',
            healed: 'ENTITY_STAMINA_RESTORED'
        },
        visual: {
            offsetY: -35 // Above oxygen bar
        }
    },
    
    shield: {
        colors: [
            { threshold: 0.6, color: { r: 150, g: 150, b: 255 } }, // Blue-purple (strong: 60%+)
            { threshold: 0.3, color: { r: 200, g: 150, b: 255 } }, // Purple (weak: 30-60%)
            { threshold: 0.0, color: { r: 255, g: 100, b: 200 } }  // Pink (breaking: <30%)
        ],
        events: {
            damaged: 'ENTITY_SHIELD_DAMAGED',
            healed: 'ENTITY_SHIELD_RESTORED'
        },
        visual: {
            offsetY: -15 // Below health bar
        }
    },
    
    mana: {
        colors: [
            { threshold: 0.6, color: { r: 100, g: 100, b: 255 } }, // Blue (full: 60%+)
            { threshold: 0.3, color: { r: 180, g: 100, b: 255 } }, // Purple (low: 30-60%)
            { threshold: 0.0, color: { r: 255, g: 80, b: 255 } }   // Magenta (empty: <30%)
        ],
        events: {
            damaged: 'ENTITY_MANA_USED',
            healed: 'ENTITY_MANA_RESTORED'
        },
        visual: {
            offsetY: -40 // Above stamina bar
        }
    }
};

/**
 * Default visual settings for all status bars
 */
export const DEFAULT_STATUS_BAR_VISUAL = {
    width: 32,
    height: 4,
    offsetY: -20,
    borderThickness: 1,
    displayDuration: 3000,  // 3 seconds
    fadeDuration: 500,      // 0.5 seconds
    lerpSpeed: 0.15         // Animation speed
};
