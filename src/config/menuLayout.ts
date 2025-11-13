/**
 * Menu Layout Configuration
 * Single source of truth for menu UI positioning
 * Both MenuScene and tests import from here to stay in sync
 */

/**
 * Main Menu Button Offsets (relative to canvas center)
 * Adjust these values to change the menu layout
 */
export const MAIN_MENU_LAYOUT = {
    TITLE: {
        offsetX: 0,      // Centered horizontally
        offsetY: -200    // Above center
    },
    PLAY_BUTTON: {
        offsetX: 0,
        offsetY: -30
    },
    OPTIONS_BUTTON: {
        offsetX: 0,
        offsetY: 70
    },
    EXIT_BUTTON: {
        offsetX: 0,
        offsetY: 170
    }
} as const;

/**
 * Options Submenu Button Offsets (relative to canvas center)
 */
export const OPTIONS_MENU_LAYOUT = {
    VIDEO_SETTINGS_BUTTON: {
        offsetX: 0,
        offsetY: -50
    },
    AUDIO_SETTINGS_BUTTON: {
        offsetX: 0,
        offsetY: 40
    },
    CONTROLS_BUTTON: {
        offsetX: 0,
        offsetY: 140
    },
    BACK_BUTTON: {
        offsetX: 500,
        offsetY: 220
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
