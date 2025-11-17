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
            offsetY: -0.90,             // Near bottom
            height: 200                // Panel height in pixels
        },
        RESOURCE_DISPLAY: {
            offsetX: -0.30,             
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
            offsetX: -0.85,             // slightly off left edge
            offsetY: -0.85              // slightly off bottom edge
        },
        QUEEN_COMMANDS: {
            offsetX: -0.65,             // Mid-left
            offsetY: -0.85              // Near bottom (on panel)
        },
        BUILDING_MENU: {
            offsetX: 0,                 // Centered horizontally
            offsetY: -0.50              // Vertical position (-1 bottom to 1 top, 0 center)
        },
        MINIMAP: {
            offsetX: 0.76,              // Near right edge
            offsetY: -0.5             // Bottom right
        }
    },

    // UI Component Sizes
    SIZES: {
        PORTRAIT: 32,                  // Queen portrait size (pixels)
        MINIMAP: 164,                   // Minimap size (width/height in pixels)
        POWER_BAR_WIDTH: 400,           // Power bar total width
        BUILDING_MENU_BUTTON_WIDTH: 180,   // Building menu button width
        BUILDING_MENU_BUTTON_HEIGHT: 60    // Building menu button height
    },

    // UI Component Scales (multipliers applied to base sizes)
    SCALES: {
        RESOURCE_DISPLAY: 1.0,          // Resource icons and text scale
        POPULATION_DISPLAY: 1.0,        // Population counter scale
        POWER_BAR: 1.0,                 // Power bar and icons scale
        QUEEN_PORTRAIT: 1.0,            // Queen portrait scale
        QUEEN_COMMANDS: 1.2,            // Command buttons scale
        BUILDING_MENU: 1.0,             // Building menu scale
        MINIMAP: 1.0                    // Minimap scale
    },

    // Building Menu Settings
    BUILDING_MENU: {
        BUTTON_SPACING: 15,             // Horizontal spacing between buttons (pixels)
        PANEL_PADDING: 15,              // Padding inside menu panel
        PANEL_BACKGROUND_COLOR: '#2C2C2C',
        PANEL_ALPHA: 200,               // Alpha value (0-255)
        RESOURCE_ICON_SIZE: 16,         // Resource icon display size
        
        // Category Button Settings (Hierarchical Menu)
        CATEGORY_BUTTON_WIDTH: 150,     // Category button width (pixels)
        CATEGORY_BUTTON_HEIGHT: 50,     // Category button height (pixels)
        CATEGORY_SPACING: 10,           // Spacing between category buttons (pixels)
        CATEGORY_ROW_OFFSET_Y: 0.20,    // Normalized vertical offset above building buttons (ensures no overlap)
        
        // Category Button Colors
        CATEGORY_NORMAL_COLOR: '#3A3A3A',
        CATEGORY_HOVER_COLOR: '#4A4A4A',
        CATEGORY_SELECTED_COLOR: '#5A8A5A',
        CATEGORY_TEXT_COLOR: '#FFFFFF',
        CATEGORY_TEXT_SIZE: 16          // Text size for category labels
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
