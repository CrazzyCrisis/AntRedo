/**
 * Tests for SettingsManager
 * Following TDD - tests written BEFORE implementation
 */

import { expect } from 'chai';
import { SettingsManager } from '../../src/managers/SettingsManager';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { DEFAULT_SETTINGS } from '../../src/config/defaultSettings';

// Mock localStorage for Node.js environment
class LocalStorageMock {
    private store: Map<string, string> = new Map();

    getItem(key: string): string | null {
        return this.store.get(key) || null;
    }

    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }
}

// Set up localStorage mock
(global as any).localStorage = new LocalStorageMock();

describe('SettingsManager', () => {
    let settingsManager: SettingsManager;
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Clear EventBus
        EventBus.clear();
        
        // Reset singleton instance
        (SettingsManager as any).instance = null;
        
        settingsManager = SettingsManager.getInstance();
    });
    
    afterEach(() => {
        localStorage.clear();
    });

    describe('Singleton Pattern', () => {
        it('should return same instance on multiple getInstance calls', () => {
            const instance1 = SettingsManager.getInstance();
            const instance2 = SettingsManager.getInstance();
            
            expect(instance1).to.equal(instance2);
        });
    });

    describe('Default Settings', () => {
        it('should load default settings when no localStorage data exists', () => {
            const settings = settingsManager.getAllSettings();
            
            expect(settings).to.deep.equal(DEFAULT_SETTINGS);
        });

        it('should have default audio settings', () => {
            const audio = settingsManager.getAudioSettings();
            
            expect(audio.masterVolume).to.equal(0.7);
            expect(audio.musicVolume).to.equal(0.8);
            expect(audio.sfxVolume).to.equal(0.8);
            expect(audio.musicEnabled).to.be.true;
            expect(audio.sfxEnabled).to.be.true;
        });

        it('should have default video settings', () => {
            const video = settingsManager.getVideoSettings();
            
            expect(video.particleEffects).to.be.true;
            expect(video.screenShake).to.be.true;
            expect(video.cameraSmoothing).to.equal(0.1);
            expect(video.showFPS).to.be.false;
        });

        it('should have default key bindings', () => {
            const keyBindings = settingsManager.getKeyBindings();
            
            expect(keyBindings.moveUp).to.deep.equal(['w', 'ArrowUp']);
            expect(keyBindings.jump).to.include(' ');
        });

        it('should have default accessibility settings', () => {
            const accessibility = settingsManager.getAccessibilitySettings();
            
            expect(accessibility.colorBlindMode).to.equal('none');
            expect(accessibility.textSize).to.equal('medium');
        });
    });

    describe('LocalStorage Persistence', () => {
        it('should save settings to localStorage', () => {
            settingsManager.setAudioSettings({
                masterVolume: 0.5,
                musicVolume: 0.6,
                sfxVolume: 0.7,
                musicEnabled: false,
                sfxEnabled: true
            });
            
            const saved = localStorage.getItem('antredo_settings');
            expect(saved).to.not.be.null;
            
            const parsed = JSON.parse(saved!);
            expect(parsed.audio.masterVolume).to.equal(0.5);
        });

        it('should load settings from localStorage on init', () => {
            // Manually set localStorage
            const customSettings = {
                ...DEFAULT_SETTINGS,
                audio: {
                    ...DEFAULT_SETTINGS.audio,
                    masterVolume: 0.3
                }
            };
            localStorage.setItem('antredo_settings', JSON.stringify(customSettings));
            
            // Reset and create new instance
            (SettingsManager as any).instance = null;
            const newManager = SettingsManager.getInstance();
            
            const audio = newManager.getAudioSettings();
            expect(audio.masterVolume).to.equal(0.3);
        });

        it('should use defaults if localStorage data is corrupted', () => {
            localStorage.setItem('antredo_settings', 'invalid json');
            
            (SettingsManager as any).instance = null;
            const newManager = SettingsManager.getInstance();
            
            const settings = newManager.getAllSettings();
            expect(settings).to.deep.equal(DEFAULT_SETTINGS);
        });
    });

    describe('Update Settings', () => {
        it('should update audio settings', () => {
            const newAudio = {
                masterVolume: 0.5,
                musicVolume: 0.6,
                sfxVolume: 0.7,
                musicEnabled: false,
                sfxEnabled: true
            };
            
            settingsManager.setAudioSettings(newAudio);
            
            const audio = settingsManager.getAudioSettings();
            expect(audio).to.deep.equal(newAudio);
        });

        it('should update video settings', () => {
            const newVideo = {
                particleEffects: false,
                screenShake: false,
                cameraSmoothing: 0.5,
                showFPS: true
            };
            
            settingsManager.setVideoSettings(newVideo);
            
            const video = settingsManager.getVideoSettings();
            expect(video).to.deep.equal(newVideo);
        });

        it('should update key bindings', () => {
            const newBindings = {
                ...DEFAULT_SETTINGS.keyBindings,
                jump: ['Space']
            };
            
            settingsManager.setKeyBindings(newBindings);
            
            const bindings = settingsManager.getKeyBindings();
            expect(bindings.jump).to.deep.equal(['Space']);
        });

        it('should update accessibility settings', () => {
            const newAccessibility = {
                colorBlindMode: 'protanopia' as const,
                textSize: 'large' as const
            };
            
            settingsManager.setAccessibilitySettings(newAccessibility);
            
            const accessibility = settingsManager.getAccessibilitySettings();
            expect(accessibility).to.deep.equal(newAccessibility);
        });
    });

    describe('EventBus Integration', () => {
        it('should emit SETTING_AUDIO_CHANGED when audio settings change', () => {
            let eventEmitted = false;
            let receivedSettings: any = null;
            
            EventBus.on(GameEvents.SETTING_AUDIO_CHANGED, (settings) => {
                eventEmitted = true;
                receivedSettings = settings;
            });
            
            const newAudio = {
                masterVolume: 0.5,
                musicVolume: 0.6,
                sfxVolume: 0.7,
                musicEnabled: false,
                sfxEnabled: true
            };
            
            settingsManager.setAudioSettings(newAudio);
            
            expect(eventEmitted).to.be.true;
            expect(receivedSettings).to.deep.equal(newAudio);
        });

        it('should emit SETTING_VIDEO_CHANGED when video settings change', () => {
            let eventEmitted = false;
            
            EventBus.on(GameEvents.SETTING_VIDEO_CHANGED, () => {
                eventEmitted = true;
            });
            
            settingsManager.setVideoSettings({
                particleEffects: false,
                screenShake: false,
                cameraSmoothing: 0.5,
                showFPS: true
            });
            
            expect(eventEmitted).to.be.true;
        });

        it('should NOT emit SETTING_KEYBIND_CHANGED (InputManager owns keybind events)', () => {
            let eventEmitted = false;
            
            EventBus.on(GameEvents.SETTING_KEYBIND_CHANGED, () => {
                eventEmitted = true;
            });
            
            settingsManager.setKeyBindings({
                ...DEFAULT_SETTINGS.keyBindings,
                jump: ['Space']
            });
            
            // SettingsManager is dumb storage - InputManager emits keybind events
            expect(eventEmitted).to.be.false;
        });

        it('should emit SETTING_ACCESSIBILITY_CHANGED when accessibility settings change', () => {
            let eventEmitted = false;
            
            EventBus.on(GameEvents.SETTING_ACCESSIBILITY_CHANGED, () => {
                eventEmitted = true;
            });
            
            settingsManager.setAccessibilitySettings({
                colorBlindMode: 'protanopia',
                textSize: 'large'
            });
            
            expect(eventEmitted).to.be.true;
        });
    });

    describe('Reset Settings', () => {
        it('should reset all settings to defaults', () => {
            // Change some settings
            settingsManager.setAudioSettings({
                masterVolume: 0.1,
                musicVolume: 0.2,
                sfxVolume: 0.3,
                musicEnabled: false,
                sfxEnabled: false
            });
            
            // Reset
            settingsManager.resetToDefaults();
            
            // Should be back to defaults
            const settings = settingsManager.getAllSettings();
            expect(settings).to.deep.equal(DEFAULT_SETTINGS);
        });

        it('should emit SETTINGS_RESET event when reset', () => {
            let eventEmitted = false;
            
            EventBus.on(GameEvents.SETTINGS_RESET, () => {
                eventEmitted = true;
            });
            
            settingsManager.resetToDefaults();
            
            expect(eventEmitted).to.be.true;
        });

        it('should save defaults to localStorage after reset', () => {
            settingsManager.setAudioSettings({
                masterVolume: 0.1,
                musicVolume: 0.2,
                sfxVolume: 0.3,
                musicEnabled: false,
                sfxEnabled: false
            });
            
            settingsManager.resetToDefaults();
            
            const saved = localStorage.getItem('antredo_settings');
            const parsed = JSON.parse(saved!);
            
            expect(parsed).to.deep.equal(DEFAULT_SETTINGS);
        });
    });

    describe('Validation', () => {
        it('should clamp volume values to 0-1 range', () => {
            settingsManager.setAudioSettings({
                masterVolume: 1.5,
                musicVolume: -0.5,
                sfxVolume: 0.5,
                musicEnabled: true,
                sfxEnabled: true
            });
            
            const audio = settingsManager.getAudioSettings();
            expect(audio.masterVolume).to.equal(1.0);
            expect(audio.musicVolume).to.equal(0.0);
        });

        it('should clamp camera smoothing to 0-1 range', () => {
            settingsManager.setVideoSettings({
                particleEffects: true,
                screenShake: true,
                cameraSmoothing: 2.5,
                showFPS: false
            });
            
            const video = settingsManager.getVideoSettings();
            expect(video.cameraSmoothing).to.equal(1.0);
        });
    });
});
