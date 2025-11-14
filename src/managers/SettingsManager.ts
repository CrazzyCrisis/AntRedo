/**
 * SettingsManager - Centralized settings management
 * Singleton pattern with localStorage persistence
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { 
    Settings, 
    AudioSettings, 
    VideoSettings, 
    KeyBindings, 
    AccessibilitySettings,
    DEFAULT_SETTINGS 
} from '../config/defaultSettings';
import { clamp } from '../utils/helpers';

const SETTINGS_STORAGE_KEY = 'antredo_settings';

export class SettingsManager {
    private static instance: SettingsManager;
    private settings: Settings;

    private constructor() {
        this.settings = this.loadSettings();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    /**
     * Load settings from localStorage or use defaults
     */
    private loadSettings(): Settings {
        try {
            const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate and merge with defaults (in case new settings were added)
                return this.validateSettings(parsed);
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage, using defaults:', error);
        }
        return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); // Deep clone
    }

    /**
     * Validate settings structure and values
     */
    private validateSettings(settings: any): Settings {
        // If structure is invalid, return defaults
        if (!settings || typeof settings !== 'object') {
            return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }

        // Merge with defaults to ensure all properties exist
        const validated: Settings = {
            audio: { ...DEFAULT_SETTINGS.audio, ...settings.audio },
            video: { ...DEFAULT_SETTINGS.video, ...settings.video },
            keyBindings: { ...DEFAULT_SETTINGS.keyBindings, ...settings.keyBindings },
            accessibility: { ...DEFAULT_SETTINGS.accessibility, ...settings.accessibility }
        };

        // Validate ranges
        validated.audio.masterVolume = clamp(validated.audio.masterVolume, 0, 1);
        validated.audio.musicVolume = clamp(validated.audio.musicVolume, 0, 1);
        validated.audio.sfxVolume = clamp(validated.audio.sfxVolume, 0, 1);
        validated.video.cameraSmoothing = clamp(validated.video.cameraSmoothing, 0, 1);

        return validated;
    }

    /**
     * Save settings to localStorage
     */
    private saveSettings(): void {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
        }
    }

    /**
     * Get all settings
     */
    public getAllSettings(): Settings {
        return JSON.parse(JSON.stringify(this.settings)); // Return copy
    }

    /**
     * Get audio settings
     */
    public getAudioSettings(): AudioSettings {
        return { ...this.settings.audio };
    }

    /**
     * Set audio settings
     */
    public setAudioSettings(audio: AudioSettings): void {
        // Validate ranges
        audio.masterVolume = clamp(audio.masterVolume, 0, 1);
        audio.musicVolume = clamp(audio.musicVolume, 0, 1);
        audio.sfxVolume = clamp(audio.sfxVolume, 0, 1);

        this.settings.audio = audio;
        this.saveSettings();
        EventBus.emit(GameEvents.SETTING_AUDIO_CHANGED, audio);
    }

    /**
     * Get video settings
     */
    public getVideoSettings(): VideoSettings {
        return { ...this.settings.video };
    }

    /**
     * Set video settings
     */
    public setVideoSettings(video: VideoSettings): void {
        // Validate ranges
        video.cameraSmoothing = clamp(video.cameraSmoothing, 0, 1);

        this.settings.video = video;
        this.saveSettings();
        EventBus.emit(GameEvents.SETTING_VIDEO_CHANGED, video);
    }

    /**
     * Get key bindings
     */
    public getKeyBindings(): KeyBindings {
        return JSON.parse(JSON.stringify(this.settings.keyBindings)); // Deep copy
    }

    /**
     * Set key bindings
     * Note: Does not emit event - InputManager handles keybind change events
     */
    public setKeyBindings(keyBindings: KeyBindings): void {
        this.settings.keyBindings = JSON.parse(JSON.stringify(keyBindings)); // Deep copy
        this.saveSettings();
        // Note: No event emission - InputManager owns keybind change notifications
    }

    /**
     * Get accessibility settings
     */
    public getAccessibilitySettings(): AccessibilitySettings {
        return { ...this.settings.accessibility };
    }

    /**
     * Set accessibility settings
     */
    public setAccessibilitySettings(accessibility: AccessibilitySettings): void {
        this.settings.accessibility = accessibility;
        this.saveSettings();
        EventBus.emit(GameEvents.SETTING_ACCESSIBILITY_CHANGED, accessibility);
    }

    /**
     * Reset all settings to defaults
     */
    public resetToDefaults(): void {
        this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        this.saveSettings();
        EventBus.emit(GameEvents.SETTINGS_RESET);
    }
}
