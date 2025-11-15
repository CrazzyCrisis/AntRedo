"use strict";
/**
 * SettingsManager - Centralized settings management
 * Singleton pattern with localStorage persistence
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsManager = void 0;
var eventBus_1 = require("../utils/eventBus");
var defaultSettings_1 = require("../config/defaultSettings");
var helpers_1 = require("../utils/helpers");
var SETTINGS_STORAGE_KEY = 'antredo_settings';
var SettingsManager = /** @class */ (function () {
    function SettingsManager() {
        this.settings = this.loadSettings();
    }
    /**
     * Get singleton instance
     */
    SettingsManager.getInstance = function () {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    };
    /**
     * Load settings from localStorage or use defaults
     */
    SettingsManager.prototype.loadSettings = function () {
        try {
            var saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (saved) {
                var parsed = JSON.parse(saved);
                // Validate and merge with defaults (in case new settings were added)
                return this.validateSettings(parsed);
            }
        }
        catch (error) {
            console.warn('Failed to load settings from localStorage, using defaults:', error);
        }
        return JSON.parse(JSON.stringify(defaultSettings_1.DEFAULT_SETTINGS)); // Deep clone
    };
    /**
     * Validate settings structure and values
     */
    SettingsManager.prototype.validateSettings = function (settings) {
        // If structure is invalid, return defaults
        if (!settings || typeof settings !== 'object') {
            return JSON.parse(JSON.stringify(defaultSettings_1.DEFAULT_SETTINGS));
        }
        // Merge with defaults to ensure all properties exist
        var validated = {
            audio: __assign(__assign({}, defaultSettings_1.DEFAULT_SETTINGS.audio), settings.audio),
            video: __assign(__assign({}, defaultSettings_1.DEFAULT_SETTINGS.video), settings.video),
            keyBindings: __assign(__assign({}, defaultSettings_1.DEFAULT_SETTINGS.keyBindings), settings.keyBindings),
            accessibility: __assign(__assign({}, defaultSettings_1.DEFAULT_SETTINGS.accessibility), settings.accessibility)
        };
        // Validate ranges
        validated.audio.masterVolume = (0, helpers_1.clamp)(validated.audio.masterVolume, 0, 1);
        validated.audio.musicVolume = (0, helpers_1.clamp)(validated.audio.musicVolume, 0, 1);
        validated.audio.sfxVolume = (0, helpers_1.clamp)(validated.audio.sfxVolume, 0, 1);
        validated.video.cameraSmoothing = (0, helpers_1.clamp)(validated.video.cameraSmoothing, 0, 1);
        return validated;
    };
    /**
     * Save settings to localStorage
     */
    SettingsManager.prototype.saveSettings = function () {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
        }
        catch (error) {
            console.error('Failed to save settings to localStorage:', error);
        }
    };
    /**
     * Reset all settings to defaults
     */
    SettingsManager.prototype.resetSettings = function () {
        this.settings = JSON.parse(JSON.stringify(defaultSettings_1.DEFAULT_SETTINGS));
        this.saveSettings();
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.SETTINGS_RESET);
    };
    /**
     * Get all settings
     */
    SettingsManager.prototype.getAllSettings = function () {
        return JSON.parse(JSON.stringify(this.settings)); // Return copy
    };
    /**
     * Get audio settings
     */
    SettingsManager.prototype.getAudioSettings = function () {
        return __assign({}, this.settings.audio);
    };
    /**
     * Set audio settings
     */
    SettingsManager.prototype.setAudioSettings = function (audio) {
        // Validate ranges
        audio.masterVolume = (0, helpers_1.clamp)(audio.masterVolume, 0, 1);
        audio.musicVolume = (0, helpers_1.clamp)(audio.musicVolume, 0, 1);
        audio.sfxVolume = (0, helpers_1.clamp)(audio.sfxVolume, 0, 1);
        this.settings.audio = audio;
        this.saveSettings();
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.SETTING_AUDIO_CHANGED, audio);
    };
    /**
     * Get video settings
     */
    SettingsManager.prototype.getVideoSettings = function () {
        return __assign({}, this.settings.video);
    };
    /**
     * Set video settings
     */
    SettingsManager.prototype.setVideoSettings = function (video) {
        // Validate ranges
        video.cameraSmoothing = (0, helpers_1.clamp)(video.cameraSmoothing, 0, 1);
        this.settings.video = video;
        this.saveSettings();
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.SETTING_VIDEO_CHANGED, video);
    };
    /**
     * Get key bindings
     */
    SettingsManager.prototype.getKeyBindings = function () {
        return JSON.parse(JSON.stringify(this.settings.keyBindings)); // Deep copy
    };
    /**
     * Set key bindings
     * Note: Does not emit event - InputManager handles keybind change events
     */
    SettingsManager.prototype.setKeyBindings = function (keyBindings) {
        this.settings.keyBindings = JSON.parse(JSON.stringify(keyBindings)); // Deep copy
        this.saveSettings();
        // Note: No event emission - InputManager owns keybind change notifications
    };
    /**
     * Get accessibility settings
     */
    SettingsManager.prototype.getAccessibilitySettings = function () {
        return __assign({}, this.settings.accessibility);
    };
    /**
     * Set accessibility settings
     */
    SettingsManager.prototype.setAccessibilitySettings = function (accessibility) {
        this.settings.accessibility = accessibility;
        this.saveSettings();
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.SETTING_ACCESSIBILITY_CHANGED, accessibility);
    };
    /**
     * Reset all settings to defaults
     */
    SettingsManager.prototype.resetToDefaults = function () {
        this.settings = JSON.parse(JSON.stringify(defaultSettings_1.DEFAULT_SETTINGS));
        this.saveSettings();
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.SETTINGS_RESET);
    };
    return SettingsManager;
}());
exports.SettingsManager = SettingsManager;
