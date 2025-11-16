/**
 * Tile Configuration
 * Centralized config for tile rendering, grid overlay, and tile-related debug settings
 * Used across the entire game for consistent tile sizing and rendering
 */

export const TILE_CONFIG = {
    // Core tile settings
    SIZE: 128,                // Tile size in pixels (world coordinate scale)
    
    // Tile rendering settings
    USE_SPRITES: true,       // Set to true to use PNG sprites, false for placeholder colors
    USE_EDGES: true,         // Set to true to use edge/corner autotiling sprites
    
    // Tile colors (used when USE_SPRITES is false or as fallback)
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

    // Grid overlay settings
    GRID_OVERLAY: {
        ENABLED: true,           // Show grid lines over tiles
        COLOR: '#0c5b1bff',      // Grid line color
        ALPHA: 125,              // Transparency (0-255, lower = more transparent)
        LINE_WEIGHT: 1           // Line thickness in pixels
    },

    // Tile-related debug settings
    DEBUG: {
        SHOW_GRID: false,        // Show tile grid overlay
        SHOW_COORDS: false,      // Show tile coordinates
        SHOW_COSTS: false        // Show movement costs
    }
} as const;
