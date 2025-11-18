/**
 * Default Settings Configuration
 * Defines all settings interfaces and default values
 */

/**
 * Audio Settings
 */
export interface AudioSettings {
    masterVolume: number;    // 0.0 to 1.0
    bgmVolume: number;     // 0.0 to 1.0
    sfxVolume: number;       // 0.0 to 1.0
    voiceVolume: number;    // 0.0 to 1.0
    systemVolume: number;    // 0.0 to 1.0
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
    masterVolume: 0.7,
    bgmVolume: 0.8,
    sfxVolume: 0.8,
    voiceVolume: 0.8,
    systemVolume: 0.8
};

/**
 * Video Settings
 */
export interface VideoSettings {
    particleEffects: boolean;
    screenShake: boolean;
    cameraSmoothing: number;  // 0.0 (instant) to 1.0 (very smooth)
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
    particleEffects: true,
    screenShake: true,
    cameraSmoothing: 0.1,
};

/**
 * Key Bindings
 * Each action supports multiple keys
 */
export interface KeyBindings {
    moveUp: string[];
    moveDown: string[];
    moveLeft: string[];
    moveRight: string[];
    jump: string[];
    interact: string[];
    pause: string[];
    openInventory: string[];
    saveWorld: string[];
    loadWorld: string[];
    deleteWorld: string[];
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
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

/**
 * Accessibility Settings
 */
export interface AccessibilitySettings {
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    textSize: 'small' | 'medium' | 'large';
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
    colorBlindMode: 'none',
    textSize: 'medium'
};

/**
 * Complete Settings Interface
 */
export interface Settings {
    audio: AudioSettings;
    video: VideoSettings;
    keyBindings: KeyBindings;
    accessibility: AccessibilitySettings;
}

/**
 * Default Settings
 */
export const DEFAULT_SETTINGS: Settings = {
    audio: DEFAULT_AUDIO_SETTINGS,
    video: DEFAULT_VIDEO_SETTINGS,
    keyBindings: DEFAULT_KEY_BINDINGS,
    accessibility: DEFAULT_ACCESSIBILITY_SETTINGS
};
