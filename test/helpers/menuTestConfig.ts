/**
 * Menu Test Configuration
 * Centralizes UI element positions for testing
 * Imports from actual menu config to stay in sync
 */

import { MAIN_MENU_LAYOUT, OPTIONS_MENU_LAYOUT, LEVEL_SELECT_LAYOUT } from '../../src/config/ui/menuLayout';

// Canvas dimensions used in tests
export const TEST_CANVAS = {
    WIDTH: 800,
    HEIGHT: 600
} as const;

// Calculate center positions and half dimensions (matches MenuScene calculations)
const centerX = TEST_CANVAS.WIDTH / 2;
const centerY = TEST_CANVAS.HEIGHT / 2;
const halfWidth = TEST_CANVAS.WIDTH / 2;
const halfHeight = TEST_CANVAS.HEIGHT / 2;

/**
 * Main Menu Button Positions
 * These are calculated from the actual menu layout config
 * Normalized coordinates (-1 to 1) are converted to pixel positions
 */
export const MAIN_MENU_BUTTONS = {
    PLAY: {
        x: centerX + (MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetX * halfWidth),
        y: centerY - (MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetY * halfHeight),
        label: 'Play Button'
    },
    OPTIONS: {
        x: centerX + (MAIN_MENU_LAYOUT.OPTIONS_BUTTON.offsetX * halfWidth),
        y: centerY - (MAIN_MENU_LAYOUT.OPTIONS_BUTTON.offsetY * halfHeight),
        label: 'Options Button'
    },
    EXIT: {
        x: centerX + (MAIN_MENU_LAYOUT.EXIT_BUTTON.offsetX * halfWidth),
        y: centerY - (MAIN_MENU_LAYOUT.EXIT_BUTTON.offsetY * halfHeight),
        label: 'Exit Button'
    }
} as const;

/**
 * Options Submenu Button Positions
 * These are calculated from the actual menu layout config
 * Normalized coordinates (-1 to 1) are converted to pixel positions
 */
export const OPTIONS_MENU_BUTTONS = {
    VIDEO_SETTINGS: {
        x: centerX + (OPTIONS_MENU_LAYOUT.VIDEO_SETTINGS_BUTTON.offsetX * halfWidth),
        y: centerY - (OPTIONS_MENU_LAYOUT.VIDEO_SETTINGS_BUTTON.offsetY * halfHeight),
        label: 'Video Settings Button'
    },
    AUDIO_SETTINGS: {
        x: centerX + (OPTIONS_MENU_LAYOUT.AUDIO_SETTINGS_BUTTON.offsetX * halfWidth),
        y: centerY - (OPTIONS_MENU_LAYOUT.AUDIO_SETTINGS_BUTTON.offsetY * halfHeight),
        label: 'Audio Settings Button'
    },
    CONTROLS: {
        x: centerX + (OPTIONS_MENU_LAYOUT.CONTROLS_BUTTON.offsetX * halfWidth),
        y: centerY - (OPTIONS_MENU_LAYOUT.CONTROLS_BUTTON.offsetY * halfHeight),
        label: 'Controls Button'
    },
    BACK: {
        x: centerX + (OPTIONS_MENU_LAYOUT.BACK_BUTTON.offsetX * halfWidth),
        y: centerY - (OPTIONS_MENU_LAYOUT.BACK_BUTTON.offsetY * halfHeight),
        label: 'Back Button'
    }
} as const;

/**
 * Level Select Menu Button Positions
 * These are calculated from the actual menu layout config
 * Normalized coordinates (-1 to 1) are converted to pixel positions
 */
export const LEVEL_SELECT_BUTTONS = {
    DEV_ROOM: {
        x: centerX + (LEVEL_SELECT_LAYOUT.DEV_ROOM_BUTTON.offsetX * halfWidth),
        y: centerY - (LEVEL_SELECT_LAYOUT.DEV_ROOM_BUTTON.offsetY * halfHeight),
        label: 'Dev Room Button'
    },
    START_GAME: {
        x: centerX + (LEVEL_SELECT_LAYOUT.START_GAME_BUTTON.offsetX * halfWidth),
        y: centerY - (LEVEL_SELECT_LAYOUT.START_GAME_BUTTON.offsetY * halfHeight),
        label: 'Start Game Button'
    },
    LEVEL_EDITOR: {
        x: centerX + (LEVEL_SELECT_LAYOUT.LEVEL_EDITOR_BUTTON.offsetX * halfWidth),
        y: centerY - (LEVEL_SELECT_LAYOUT.LEVEL_EDITOR_BUTTON.offsetY * halfHeight),
        label: 'Level Editor Button'
    },
    BACK: {
        x: centerX + (LEVEL_SELECT_LAYOUT.BACK_BUTTON.offsetX * halfWidth),
        y: centerY - (LEVEL_SELECT_LAYOUT.BACK_BUTTON.offsetY * halfHeight),
        label: 'Back Button'
    }
} as const;

/**
 * Title Position
 * Calculated from the actual menu layout config
 * Normalized coordinates (-1 to 1) are converted to pixel positions
 */
export const TITLE_POSITION = {
    x: centerX + (MAIN_MENU_LAYOUT.TITLE.offsetX * halfWidth),
    y: centerY - (MAIN_MENU_LAYOUT.TITLE.offsetY * halfHeight),
    label: 'Title'
} as const;

/**
 * Mock image data for MenuScene tests
 */
export const createMockImages = () => ({
    title: { width: 300, height: 100 },
    playButton: { width: 200, height: 80 },
    optionsButton: { width: 200, height: 80 },
    exitButton: { width: 200, height: 80 },
    videoSettingsButton: { width: 200, height: 80 },
    audioSettingsButton: { width: 200, height: 80 },
    controlsButton: { width: 200, height: 80 },
    backButton: { width: 200, height: 80 },
    devRoomButton: { width: 200, height: 80 },
    startGameButton: { width: 200, height: 80 },
    levelEditorButton: { width: 200, height: 80 }
});
