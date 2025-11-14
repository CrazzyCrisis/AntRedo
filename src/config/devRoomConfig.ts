/**
 * DevRoom Configuration
 * Centralized config for dev room settings
 */

export const DEV_ROOM_CONFIG = {
    // World generation settings
    WORLD: {
        WIDTH: 200,              // Width in tiles
        HEIGHT: 200,             // Height in tiles
        SEED: 12345,            // Fixed seed for consistency (use undefined for random)
        NOISE_SCALE: 0.1        // Perlin noise scale (0.05-0.3 typical range)
    },

    // Tile rendering settings
    TILES: {
        SIZE: 32,               // Tile size in pixels (overrides TILE_SIZE from TileSystem if needed)
        
        // Tile colors (used until actual sprites are loaded)
        COLORS: {
            GRASS: '#90EE90',           // Light green
            DIRT: '#8B4513',            // Brown
            STONE: '#808080',           // Grey
            SAND: '#F4A460',            // Sandy brown
            WATER: '#4682B4',           // Blue
            CAVE_FLOOR: '#D2B48C',      // Tan
            CAVE_WALL: '#2F4F4F',       // Dark grey
            CAVE_DIRT: '#654321',       // Dark brown
            CAVE_EXTRA_DARK: '#1C1C1C', // Very dark grey
            PEBBLE_1: '#A9A9A9',        // Light grey
            PEBBLE_2: '#8B8989',        // Medium grey
            PEBBLE_3: '#696969',        // Dark grey
            MOSS: '#556B2F',            // Olive green
            FARMLAND: '#8B7355',        // Light brown
            ANTHILL: '#CD853F',         // Peru
            SAND_DARK: '#DAA520',       // Goldenrod
            WATER_CAVE: '#4169E1'       // Royal blue
        },

        // Sprite mapping - now implemented!
        USE_SPRITES: true,       // Set to true to use PNG sprites, false for placeholder colors
        USE_EDGES: true          // Set to true to use edge/corner autotiling sprites
    },

    // Camera settings
    CAMERA: {
        INITIAL_X: 240,          // Starting camera X (centered on 30-tile width at 16px each)
        INITIAL_Y: 160,          // Starting camera Y (centered on 20-tile height at 16px each)
        FOLLOW_PLAYER: false,    // Enable camera following when player is added
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

    // Debug settings
    DEBUG: {
        SHOW_GRID: false,        // Show tile grid overlay
        SHOW_COORDS: false,      // Show tile coordinates
        SHOW_COSTS: false,       // Show movement costs
        SHOW_INFO: true          // Show world info text
    }
} as const;
