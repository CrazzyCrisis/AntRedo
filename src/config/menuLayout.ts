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

// ============================================================================
// SETTINGS SCREEN LAYOUTS
// ============================================================================

/**
 * Audio Settings Screen Layout
 * Volume sliders and mute toggles
 */
export const AUDIO_SETTINGS_LAYOUT = {
    TITLE: {
        offsetX: 0,
        offsetY: 0.6
    },
    MASTER_VOLUME_LABEL: {
        offsetX: -0.4,
        offsetY: 0.3
    },
    MASTER_VOLUME_SLIDER: {
        offsetX: 0.15,
        offsetY: 0.3
    },
    MUSIC_VOLUME_LABEL: {
        offsetX: -0.4,
        offsetY: 0.1
    },
    MUSIC_VOLUME_SLIDER: {
        offsetX: 0.15,
        offsetY: 0.1
    },
    MUSIC_MUTE_LABEL: {
        offsetX: -0.4,
        offsetY: -0.1
    },
    MUSIC_MUTE_TOGGLE: {
        offsetX: 0.15,
        offsetY: -0.1
    },
    SFX_VOLUME_LABEL: {
        offsetX: -0.4,
        offsetY: -0.3
    },
    SFX_VOLUME_SLIDER: {
        offsetX: 0.15,
        offsetY: -0.3
    },
    SFX_MUTE_LABEL: {
        offsetX: -0.4,
        offsetY: -0.5
    },
    SFX_MUTE_TOGGLE: {
        offsetX: 0.15,
        offsetY: -0.5
    },
    BACK_BUTTON: {
        offsetX: -0.85,
        offsetY: -0.75
    }
} as const;

/**
 * Video Settings Screen Layout
 * Effect toggles and quality dropdown
 */
export const VIDEO_SETTINGS_LAYOUT = {
    TITLE: {
        offsetX: 0,
        offsetY: 0.6
    },
    CAMERA_SMOOTHING_LABEL: {
        offsetX: -0.4,
        offsetY: 0.3
    },
    CAMERA_SMOOTHING_SLIDER: {
        offsetX: 0.15,
        offsetY: 0.3
    },
    SCREEN_SHAKE_LABEL: {
        offsetX: -0.4,
        offsetY: 0.1
    },
    SCREEN_SHAKE_TOGGLE: {
        offsetX: 0.15,
        offsetY: 0.1
    },
    PARTICLE_EFFECTS_LABEL: {
        offsetX: -0.4,
        offsetY: -0.1
    },
    PARTICLE_EFFECTS_TOGGLE: {
        offsetX: 0.15,
        offsetY: -0.1
    },
    BACK_BUTTON: {
        offsetX: -0.85,
        offsetY: -0.75
    }
} as const;

/**
 * Controls Screen Layout
 * Keybind components for all actions
 */
export const CONTROLS_LAYOUT = {
    TITLE: {
        offsetX: 0,
        offsetY: 0.7
    },
    // Movement controls
    MOVE_UP: {
        offsetX: 0,
        offsetY: 0.45
    },
    MOVE_DOWN: {
        offsetX: 0,
        offsetY: 0.3
    },
    MOVE_LEFT: {
        offsetX: 0,
        offsetY: 0.15
    },
    MOVE_RIGHT: {
        offsetX: 0,
        offsetY: 0
    },
    // Action controls
    INTERACT: {
        offsetX: 0,
        offsetY: -0.2
    },
    ATTACK: {
        offsetX: 0,
        offsetY: -0.35
    },
    // UI controls
    PAUSE: {
        offsetX: 0,
        offsetY: -0.55
    },
    BACK_BUTTON: {
        offsetX: -0.85,
        offsetY: -0.75
    },
    RESET_BUTTON: {
        offsetX: 0.85,
        offsetY: -0.75
    }
} as const;

/**
 * Settings UI Scales
 */
export const SETTINGS_SCALES = {
    TITLE: 0.5,
    SLIDER: 0.15,
    TOGGLE: 0.12,
    KEYBIND: 0.15,
    BACK_BUTTON: 0.15
} as const;

/**
 * Settings Component Dimensions (in pixels, for component sizing)
 */
export const SETTINGS_DIMENSIONS = {
    SLIDER_WIDTH: 200,
    SLIDER_HEIGHT: 20,
    TOGGLE_WIDTH: 60,
    TOGGLE_HEIGHT: 30,
    KEYBIND_WIDTH: 300,
    KEYBIND_HEIGHT: 40,
    LABEL_OFFSET: -150  // Distance from component to label (left side)
} as const;
