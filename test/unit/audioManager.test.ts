/**
 * Tests for AudioManager
 * Following TDD - tests written BEFORE implementation
 */

import { expect } from 'chai';
import { AudioManager } from '../../src/managers/AudioManager';
import { EventBus } from '../../src/utils/eventBus';
import { SettingsManager } from '../../src/managers/SettingsManager';

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

describe('AudioManager', () => {
    let audioManager: AudioManager;
    let settingsManager: SettingsManager;
    
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        
        // Clear EventBus
        EventBus.clear();
        
        // Reset singletons
        (SettingsManager as any).instance = null;
        (AudioManager as any).instance = null;
        
        settingsManager = SettingsManager.getInstance();
        audioManager = AudioManager.getInstance();
    });

    describe('Singleton Pattern', () => {
        it('should return same instance on multiple getInstance calls', () => {
            const instance1 = AudioManager.getInstance();
            const instance2 = AudioManager.getInstance();
            
            expect(instance1).to.equal(instance2);
        });
    });

    describe('Initialization', () => {
        it('should initialize with settings from SettingsManager', () => {
            const audioSettings = settingsManager.getAudioSettings();
            
            expect(audioManager.getMasterVolume()).to.equal(audioSettings.masterVolume);
            expect(audioManager.getBGMVolume()).to.equal(audioSettings.bgmVolume);
            expect(audioManager.getSFXVolume()).to.equal(audioSettings.sfxVolume);
            expect(audioManager.getVoiceVolume()).to.equal(audioSettings.voiceVolume);
            expect(audioManager.getSystemVolume()).to.equal(audioSettings.systemVolume);
        });

        it('should start with no loaded sounds', () => {
            const loadedSounds = audioManager.getLoadedSounds();
            expect(loadedSounds).to.be.an('array').that.is.empty;
        });
    });

    describe('Volume Control', () => {
        it('should get master volume', () => {
            const volume = audioManager.getMasterVolume();
            expect(volume).to.be.a('number');
            expect(volume).to.be.at.least(0);
            expect(volume).to.be.at.most(1);
        });

        it('should set master volume', () => {
            audioManager.setMasterVolume(0.5);
            expect(audioManager.getMasterVolume()).to.equal(0.5);
        });

        it('should clamp master volume to 0-1 range', () => {
            audioManager.setMasterVolume(1.5);
            expect(audioManager.getMasterVolume()).to.equal(1.0);
            
            audioManager.setMasterVolume(-0.5);
            expect(audioManager.getMasterVolume()).to.equal(0.0);
        });

        it('should get BGM volume', () => {
            const volume = audioManager.getBGMVolume();
            expect(volume).to.be.a('number');
            expect(volume).to.be.at.least(0);
            expect(volume).to.be.at.most(1);
        });

        it('should set BGM volume', () => {
            audioManager.setBGMVolume(0.6);
            expect(audioManager.getBGMVolume()).to.equal(0.6);
        });

        it('should get SFX volume', () => {
            const volume = audioManager.getSFXVolume();
            expect(volume).to.be.a('number');
            expect(volume).to.be.at.least(0);
            expect(volume).to.be.at.most(1);
        });

        it('should set SFX volume', () => {
            audioManager.setSFXVolume(0.7);
            expect(audioManager.getSFXVolume()).to.equal(0.7);
        });

        it('should save volume changes to SettingsManager', () => {
            audioManager.setMasterVolume(0.3);
            
            const settings = settingsManager.getAudioSettings();
            expect(settings.masterVolume).to.equal(0.3);
        });
    });

    describe('Effective Volume Calculation', () => {
        it('should calculate effective BGM volume (master * BGM)', () => {
            audioManager.setMasterVolume(0.5);
            audioManager.setBGMVolume(0.8);
            
            const effectiveVolume = audioManager.getEffectiveBGMVolume();
            expect(effectiveVolume).to.equal(0.4); // 0.5 * 0.8
        });

        it('should calculate effective SFX volume (master * sfx)', () => {
            audioManager.setMasterVolume(0.6);
            audioManager.setSFXVolume(0.7);
            
            const effectiveVolume = audioManager.getEffectiveSFXVolume();
            expect(effectiveVolume).to.be.closeTo(0.42, 0.01); // 0.6 * 0.7
        });
    });

    describe('EventBus Integration', () => {
        it('should listen to SETTING_AUDIO_CHANGED events', () => {
            // Change settings via SettingsManager
            settingsManager.setAudioSettings({
                masterVolume: 0.3,
                bgmVolume: 0.4,
                sfxVolume: 0.5,
                voiceVolume: 0.6,
                systemVolume: 0.7
            });
            
            // AudioManager should update automatically
            expect(audioManager.getMasterVolume()).to.equal(0.3);
            expect(audioManager.getBGMVolume()).to.equal(0.4);
            expect(audioManager.getSFXVolume()).to.equal(0.5);
        });
    });

    describe('Sound Loading', () => {
        it('should track loaded sound IDs', () => {
            // Note: We can't actually load sounds in Node.js tests
            // This tests the tracking mechanism
            audioManager.registerSound('test-sound');
            
            const sounds = audioManager.getLoadedSounds();
            expect(sounds).to.include('test-sound');
        });

        it('should check if sound is loaded', () => {
            audioManager.registerSound('loaded-sound');
            
            expect(audioManager.isSoundLoaded('loaded-sound')).to.be.true;
            expect(audioManager.isSoundLoaded('not-loaded')).to.be.false;
        });

        it('should unload sound', () => {
            audioManager.registerSound('temp-sound');
            expect(audioManager.isSoundLoaded('temp-sound')).to.be.true;
            
            audioManager.unloadSound('temp-sound');
            expect(audioManager.isSoundLoaded('temp-sound')).to.be.false;
        });
    });

    describe('Playback State', () => {
        it('should track currently playing BGM', () => {
            expect(audioManager.getCurrentBGM()).to.be.null;
        });

        it('should update current BGM when set', () => {
            audioManager.setCurrentBGM('background-BGM');
            expect(audioManager.getCurrentBGM()).to.equal('background-BGM');
        });

        it('should clear current BGM', () => {
            audioManager.setCurrentBGM('background-BGM');
            audioManager.stopBGM();
            expect(audioManager.getCurrentBGM()).to.be.null;
        });
    });

    describe('Error Handling', () => {
        it('should handle playing non-existent sound gracefully', () => {
            expect(() => {
                audioManager.play('ANT_HIT');  // Sound not loaded
            }).to.not.throw();
        });

        it('should handle stopping non-playing BGM gracefully', () => {
            expect(() => {
                audioManager.stopBGM();
            }).to.not.throw();
        });
    });
});
