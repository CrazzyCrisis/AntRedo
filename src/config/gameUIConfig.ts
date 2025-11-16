/**
 * Game UI Overlay Configuration
 * Centralized settings for in-game UI elements
 * 
 * POSITIONING: Uses normalized coordinates (-1 to 1) relative to screen center
 * - offsetX: -1 (left edge) to 1 (right edge), 0 is center
 * - offsetY: -1 (bottom edge) to 1 (top edge), 0 is center
 * This ensures UI scales properly with any screen resolution
 */

export const GAME_UI_CONFIG = {
    // UI Component Positioning (Normalized Coordinates)
    LAYOUT: {
        BOTTOM_PANEL: {
            offsetX: 0,                 // Centered horizontally
            offsetY: -0.95,             // Near bottom
            height: 100                 // Panel height in pixels
        },
        RESOURCE_DISPLAY: {
            offsetX: 0,             
            offsetY: 0.98               // Near top edge
        },
        POPULATION_DISPLAY: {
            offsetX: -0.95,             // Near left edge
            offsetY: 0.95               // Below resources
        },
        POWER_BAR: {
            offsetX: 0,                 // Centered horizontally
            offsetY: -0.85              // Near bottom (on panel)
        },
        QUEEN_PORTRAIT: {
            offsetX: -1.01,             // slightly off left edge
            offsetY: -1.01              // slightly off bottom edge
        },
        QUEEN_COMMANDS: {
            offsetX: -0.65,             // Mid-left
            offsetY: -0.85              // Near bottom (on panel)
        },
        MINIMAP: {
            offsetX: 0.85,              // Near right edge
            offsetY: -0.70             // Bottom right
        }
    },

    // UI Component Sizes
    SIZES: {
        PORTRAIT: 128,                  // Queen portrait size (pixels)
        MINIMAP: 150,                   // Minimap size (width/height in pixels)
        POWER_BAR_WIDTH: 400            // Power bar total width
    },

    // UI Component Scales (multipliers applied to base sizes)
    SCALES: {
        RESOURCE_DISPLAY: 1.0,          // Resource icons and text scale
        POPULATION_DISPLAY: 1.0,        // Population counter scale
        POWER_BAR: 1.0,                 // Power bar and icons scale
        QUEEN_PORTRAIT: 1.3,            // Queen portrait scale
        QUEEN_COMMANDS: 1.2,            // Command buttons scale
        MINIMAP: 1.0                    // Minimap scale
    },

    // Default Visibility Flags
    DEFAULT_VISIBILITY: {
        RESOURCES: true,
        POPULATION: true,
        POWER_BAR: true,
        QUEEN_PORTRAIT: true,
        COMMANDS: true,
        MINIMAP: true
    },

    // Queen Portrait Settings
    PORTRAIT: {
        BACKGROUND_COLOR: '#2C2416',
        BACKGROUND_ALPHA: 0.85,
        FRAME_COLOR: '#8B7355',
        FRAME_WIDTH: 4,
        INNER_ACCENT_COLOR: '#D4AF37',  // Gold accent
        ANIMATED_BORDER: false,          // Enable animated ant border
        ANT_SPEED: 0.02,                // Radians per frame for border ant
        ANT_OFFSET: 8                   // Distance from frame edge
    },

    // Minimap Settings
    MINIMAP: {
        ZOOM: 1.0,                      // Minimap zoom level
        SHOW_ENTITIES: true,             // Show entities on minimap
        SHOW_RESOURCES: true,            // Show resources on minimap
        SHOW_CAMERA_BOUNDS: true         // Show camera viewport indicator
    }
} as const;
