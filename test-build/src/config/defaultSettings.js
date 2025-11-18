"use strict";
/**
 * Default Settings Configuration
 * Defines all settings interfaces and default values
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = exports.DEFAULT_ACCESSIBILITY_SETTINGS = exports.DEFAULT_KEY_BINDINGS = exports.DEFAULT_VIDEO_SETTINGS = exports.DEFAULT_AUDIO_SETTINGS = void 0;
exports.DEFAULT_AUDIO_SETTINGS = {
    masterVolume: 0.7,
    musicVolume: 0.8,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true
};
exports.DEFAULT_VIDEO_SETTINGS = {
    particleEffects: true,
    screenShake: true,
    cameraSmoothing: 0.1,
    showFPS: false
};
exports.DEFAULT_KEY_BINDINGS = {
    moveUp: ['w', 'ArrowUp'],
    moveDown: ['s', 'ArrowDown'],
    moveLeft: ['a', 'ArrowLeft'],
    moveRight: ['d', 'ArrowRight'],
    jump: [' ', 'w', 'ArrowUp'],
    interact: ['e', 'Enter'],
    pause: ['Escape', 'p'],
    openInventory: ['i', 'Tab'],
    saveWorld: ['s'],
    loadWorld: ['l'],
    deleteWorld: ['d']
};
exports.DEFAULT_ACCESSIBILITY_SETTINGS = {
    colorBlindMode: 'none',
    textSize: 'medium'
};
/**
 * Default Settings
 */
exports.DEFAULT_SETTINGS = {
    audio: exports.DEFAULT_AUDIO_SETTINGS,
    video: exports.DEFAULT_VIDEO_SETTINGS,
    keyBindings: exports.DEFAULT_KEY_BINDINGS,
    accessibility: exports.DEFAULT_ACCESSIBILITY_SETTINGS
};
