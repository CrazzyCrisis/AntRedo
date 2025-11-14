/**
 * Menu Layout Configuration
 * Single source of truth for menu UI positioning
 * Both MenuScene and tests import from here to stay in sync
 * 
 * NORMALIZED COORDINATE SYSTEM:
 * - offsetX: -1 (left edge) to 1 (right edge), 0 is center
 * - offsetY: -1 (bottom edge) to 1 (top edge), 0 is center
 * - Resolution-independent: scales with canvas size
 */

/**
 * Main Menu Button Offsets (normalized -1 to 1 scale)
 * Adjust these values to change the menu layout
 */
export const MAIN_MENU_LAYOUT = {
    TITLE: {
        offsetX: 0,       // Centered horizontally
        offsetY: 0.5      // Upper half of screen
    },
    PLAY_BUTTON: {
        offsetX: 0,
        offsetY: -0.10
    },
    OPTIONS_BUTTON: {
        offsetX: 0,
        offsetY: -0.45
    },
    EXIT_BUTTON: {
        offsetX: 0,
        offsetY: -1.45     // This button does nothing, so lets hide it but we will keep it just in case
    }
} as const;

/**
 * Options Submenu Button Offsets (normalized -1 to 1 scale)
 */
export const OPTIONS_MENU_LAYOUT = {
    VIDEO_SETTINGS_BUTTON: {
        offsetX: 0,
        offsetY: 0.05
    },
    AUDIO_SETTINGS_BUTTON: {
        offsetX: 0,
        offsetY: -0.20
    },
    CONTROLS_BUTTON: {
        offsetX: 0,
        offsetY: -0.45
    },
    BACK_BUTTON: {
        offsetX: -0.85,   // Near left edge
        offsetY: -0.75    // Near bottom
    }
} as const;

/**
 * Level Select Submenu Button Offsets (normalized -1 to 1 scale)
 * Three buttons arranged horizontally
 */
export const LEVEL_SELECT_LAYOUT = {
    DEV_ROOM_BUTTON: {
        offsetX: -0.4,    // Left side
        offsetY: -0.2         // Center vertically
    },
    START_GAME_BUTTON: {
        offsetX: 0,        // Center
        offsetY: -0.2
    },
    LEVEL_EDITOR_BUTTON: {
        offsetX: 0.4,      // Right side
        offsetY: -0.2
    },
    BACK_BUTTON: {
        offsetX: -0.85,    // Near left edge
        offsetY: -0.75     // Near bottom
    }
} as const;

/**
 * UI Element Scales
 */
export const MENU_SCALES = {
    TITLE: 0.6,
    BUTTON: 0.2
} as const;

/**
 * Animation Settings
 */
export const MENU_ANIMATIONS = {
    TITLE_SPEED: 0.05,      // radians per frame
    TITLE_AMPLITUDE: 8,     // pixels
    BUTTON_PULSE_SPEED: 0.1 // radians per frame
} as const;
