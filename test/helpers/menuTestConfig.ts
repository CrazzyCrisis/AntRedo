/**
 * Menu Test Configuration
 * Centralizes UI element positions for testing
 * Imports from actual menu config to stay in sync
 */

import { MAIN_MENU_LAYOUT, OPTIONS_MENU_LAYOUT } from '../../src/config/menuLayout';

// Canvas dimensions used in tests
export const TEST_CANVAS = {
    WIDTH: 800,
    HEIGHT: 600
} as const;

// Calculate center positions (should match MenuScene calculations)
const centerX = TEST_CANVAS.WIDTH / 2;
const centerY = TEST_CANVAS.HEIGHT / 2;

/**
 * Main Menu Button Positions
 * These are calculated from the actual menu layout config
 */
export const MAIN_MENU_BUTTONS = {
    PLAY: {
        x: centerX + MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetX,
        y: centerY + MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetY,
        label: 'Play Button'
    },
    OPTIONS: {
        x: centerX + MAIN_MENU_LAYOUT.OPTIONS_BUTTON.offsetX,
        y: centerY + MAIN_MENU_LAYOUT.OPTIONS_BUTTON.offsetY,
        label: 'Options Button'
    },
    EXIT: {
        x: centerX + MAIN_MENU_LAYOUT.EXIT_BUTTON.offsetX,
        y: centerY + MAIN_MENU_LAYOUT.EXIT_BUTTON.offsetY,
        label: 'Exit Button'
    }
} as const;

/**
 * Options Submenu Button Positions
 * These are calculated from the actual menu layout config
 */
export const OPTIONS_MENU_BUTTONS = {
    VIDEO_SETTINGS: {
        x: centerX + OPTIONS_MENU_LAYOUT.VIDEO_SETTINGS_BUTTON.offsetX,
        y: centerY + OPTIONS_MENU_LAYOUT.VIDEO_SETTINGS_BUTTON.offsetY,
        label: 'Video Settings Button'
    },
    AUDIO_SETTINGS: {
        x: centerX + OPTIONS_MENU_LAYOUT.AUDIO_SETTINGS_BUTTON.offsetX,
        y: centerY + OPTIONS_MENU_LAYOUT.AUDIO_SETTINGS_BUTTON.offsetY,
        label: 'Audio Settings Button'
    },
    CONTROLS: {
        x: centerX + OPTIONS_MENU_LAYOUT.CONTROLS_BUTTON.offsetX,
        y: centerY + OPTIONS_MENU_LAYOUT.CONTROLS_BUTTON.offsetY,
        label: 'Controls Button'
    },
    BACK: {
        x: centerX + OPTIONS_MENU_LAYOUT.BACK_BUTTON.offsetX,
        y: centerY + OPTIONS_MENU_LAYOUT.BACK_BUTTON.offsetY,
        label: 'Back Button'
    }
} as const;

/**
 * Title Position
 * Calculated from the actual menu layout config
 */
export const TITLE_POSITION = {
    x: centerX + MAIN_MENU_LAYOUT.TITLE.offsetX,
    y: centerY + MAIN_MENU_LAYOUT.TITLE.offsetY,
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
    backButton: { width: 200, height: 80 }
});
