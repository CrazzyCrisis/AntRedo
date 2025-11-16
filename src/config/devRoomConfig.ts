/**
 * DevRoom Configuration
 * Centralized config for dev room settings
 * 
 * NOTE: Tile-related config (SIZE, COLORS, USE_SPRITES, USE_EDGES, GRID_OVERLAY, and
 * tile-related DEBUG flags) have been moved to tileConfig.ts for better organization.
 */

export const DEV_ROOM_CONFIG = {
    // World generation settings
    WORLD: {
        WIDTH: 200,              // Width in tiles
        HEIGHT: 200,             // Height in tiles
        SEED: 12345,            // Fixed seed for consistency (use undefined for random)
        NOISE_SCALE: 0.05      // Perlin noise scale (0.05-0.3 typical range)
    },

    // Starting resources for testing
    STARTING_RESOURCES: {
        FOOD: 100,              // Starting food for healing system testing
        WOOD: 100,              // Enough to build multiple buildings (warehouse=20, barracks=15, tower=10)
        STONE: 100,             // Enough to build multiple buildings (warehouse=10, barracks=15, tower=20)
        MAGIC_CRYSTAL: 50       // For future features
    },

    // Camera settings
    CAMERA: {
        INITIAL_X: 3840,          // Starting camera X (centered on 30-tile width at 256px each)
        INITIAL_Y: 5120,          // Starting camera Y (centered on 20-tile height at 256px each)
        FOLLOW_PLAYER: true,    // Enable camera following when player is added
        SMOOTHING: 0.1           // Camera smoothing factor
    },

    // UI Layout (normalized coordinates like main menu)
    LAYOUT: {
        BACK_BUTTON: {
            offsetX: -0.85,      // Left side
            offsetY: 0.85        // Top
        },
        INFO_TEXT: {
            offsetX: 0,          // Centered
            offsetY: -0.85       // Bottom
        }
    },

    // UI Scales
    SCALES: {
        BUTTON: 0.15            // Button scale relative to canvas
    },

    // UI Animations
    ANIMATIONS: {
        BUTTON_PULSE_SPEED: 0.05,
        BUTTON_PULSE_AMOUNT: 0.05
    },

    // Debug settings (scene-specific)
    DEBUG: {
        SHOW_INFO: true          // Show world info text
    }
} as const;
