/**
 * Integration tests for AudioManager
 * Tests the audio system logic without actual sound playback
 */

import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { AudioManager } from '../../src/managers/AudioManager';

describe('AudioManager Integration Tests', () => {
    let audioManager: AudioManager;

    beforeEach(() => {
        // Clear EventBus
        EventBus.clear();
        
        // Get fresh instances
        audioManager = AudioManager.getInstance();
        
        // Reset to default settings
        audioManager.setMasterVolume(0.7);
        audioManager.setBGMVolume(0.8);
        audioManager.setSFXVolume(0.8);
        audioManager.setVoiceVolume(0.8);
        audioManager.setSystemVolume(0.8);
    });

    afterEach(() => {
        audioManager.cleanup();
        EventBus.clear();
    });

    describe('Volume Control', () => {
        it('should set and get master volume', () => {
            audioManager.setMasterVolume(0.5);
            expect(audioManager.getMasterVolume()).to.equal(0.5);
        });

        it('should clamp master volume to 0-1 range', () => {
            audioManager.setMasterVolume(1.5);
            expect(audioManager.getMasterVolume()).to.equal(1);
            
            audioManager.setMasterVolume(-0.5);
            expect(audioManager.getMasterVolume()).to.equal(0);
        });

        it('should set and get music volume', () => {
            audioManager.setBGMVolume(0.6);
            expect(audioManager.getBGMVolume()).to.equal(0.6);
        });

        it('should clamp music volume to 0-1 range', () => {
            audioManager.setBGMVolume(2.0);
            expect(audioManager.getBGMVolume()).to.equal(1);
            
            audioManager.setBGMVolume(-1.0);
            expect(audioManager.getBGMVolume()).to.equal(0);
        });

        it('should set and get SFX volume', () => {
            audioManager.setSFXVolume(0.4);
            expect(audioManager.getSFXVolume()).to.equal(0.4);
        });

        it('should clamp SFX volume to 0-1 range', () => {
            audioManager.setSFXVolume(1.2);
            expect(audioManager.getSFXVolume()).to.equal(1);
            
            audioManager.setSFXVolume(-0.3);
            expect(audioManager.getSFXVolume()).to.equal(0);
        });
    });

    describe('Settings Integration', () => {
        it('should sync with SettingsManager when audio settings change', () => {
            const newSettings = {
                masterVolume: 0.5,
                bgmVolume: 0.6,
                sfxVolume: 0.7,
                voiceVolume: 0.8,
                systemVolume: 0.9
            };
            
            EventBus.emit(GameEvents.SETTING_AUDIO_CHANGED, newSettings);
            
            expect(audioManager.getMasterVolume()).to.equal(0.5);
            expect(audioManager.getBGMVolume()).to.equal(0.6);
            expect(audioManager.getSFXVolume()).to.equal(0.7);
            expect(audioManager.getVoiceVolume()).to.equal(0.8);
            expect(audioManager.getSystemVolume()).to.equal(0.9);
        });

        it('should get current settings', () => {
            audioManager.setMasterVolume(0.5);
            audioManager.setBGMVolume(0.6);
            audioManager.setSFXVolume(0.7);
            audioManager.setVoiceVolume(0.8);
            audioManager.setSystemVolume(0.9);
            
            // Verify settings through getters
            expect(audioManager.getMasterVolume()).to.equal(0.5);
            expect(audioManager.getBGMVolume()).to.equal(0.6);
            expect(audioManager.getSFXVolume()).to.equal(0.7);
            expect(audioManager.getVoiceVolume()).to.equal(0.8);
            expect(audioManager.getSystemVolume()).to.equal(0.9);
        });
    });

    describe('Sound Management', () => {
        it('should register sound as loaded', () => {
            audioManager.registerSound('TEST_SOUND');
            expect(audioManager.isSoundLoaded('TEST_SOUND')).to.be.true;
        });

        it('should track loaded sounds', () => {
            audioManager.registerSound('SOUND_1');
            audioManager.registerSound('SOUND_2');
            
            const loaded = audioManager.getLoadedSounds();
            expect(loaded).to.include('SOUND_1');
            expect(loaded).to.include('SOUND_2');
        });

        it('should unload sound', () => {
            audioManager.registerSound('TEST_SOUND');
            expect(audioManager.isSoundLoaded('TEST_SOUND')).to.be.true;
            
            audioManager.unloadSound('TEST_SOUND');
            expect(audioManager.isSoundLoaded('TEST_SOUND')).to.be.false;
        });

        it('should track current music', () => {
            expect(audioManager.getCurrentBGM()).to.be.null;
            
            audioManager.setCurrentBGM('MENU_THEME');
            expect(audioManager.getCurrentBGM()).to.equal('MENU_THEME');
        });
    });

    describe('Event-Driven Playback', () => {
        it('should initialize and setup event listeners', () => {
            audioManager.initialize();
            
            // Check that EventBus has listeners for audio events
            expect(EventBus.hasListeners(GameEvents.ANT_ATTACKED)).to.be.true;
            expect(EventBus.hasListeners(GameEvents.FIREBALL_EXPLODE)).to.be.true;
            expect(EventBus.hasListeners(GameEvents.BUILDING_PLACED)).to.be.true;
        });

        it('should have event listeners after initialization', () => {
            audioManager.initialize();
            
            // Verify multiple event mappings are set up
            const eventCount = EventBus.listenerCount(GameEvents.ANT_ATTACKED) +
                             EventBus.listenerCount(GameEvents.BUILDING_PLACED) +
                             EventBus.listenerCount(GameEvents.FIREBALL_EXPLODE);
            
            expect(eventCount).to.be.greaterThan(0);
        });

        it('should cleanup event listeners', () => {
            audioManager.initialize();
            
            const beforeCount = EventBus.listenerCount(GameEvents.ANT_ATTACKED);
            expect(beforeCount).to.be.greaterThan(0);
            
            audioManager.cleanup();
            
            const afterCount = EventBus.listenerCount(GameEvents.ANT_ATTACKED);
            expect(afterCount).to.equal(0);
        });
    });

    describe('Sound Loading and Playback (Mock)', () => {
        it('should load sound without error', () => {
            const mockSound = { isPlaying: () => false, setSFXsetSFXVolume: () => {}, play: () => {} };
            
            expect(() => {
                audioManager.loadSound('ANT_HIT', mockSound);
            }).to.not.throw();
            
            expect(audioManager.isSoundLoaded('ANT_HIT')).to.be.true;
        });

        it('should not throw when playing unloaded sound', () => {
            expect(() => {
                audioManager.play('NONEXISTENT_SOUND' as any);
            }).to.not.throw();
        });

        it('should not throw when stopping unloaded sound', () => {
            expect(() => {
                audioManager.stopSound('NONEXISTENT_SOUND' as any);
            }).to.not.throw();
        });
    });

    describe('Music Playback Control', () => {
        it('should track current music when played', () => {
            const mockSound = { 
                isPlaying: () => false, 
                setBGMVolume: () => {}, 
                loop: () => {},
                play: () => {}
            };
            
            audioManager.loadSound('MENU_THEME', mockSound);
            audioManager.playBGM('MENU_THEME', true);
            
            expect(audioManager.getCurrentBGM()).to.equal('MENU_THEME');
        });

        it('should clear current music when stopped', () => {
            const mockSound = { 
                isPlaying: () => true, 
                stop: () => {}
            };
            
            audioManager.loadSound('MENU_THEME', mockSound);
            audioManager.setCurrentBGM('MENU_THEME');
            audioManager.stopBGM    ();
            
            expect(audioManager.getCurrentBGM()).to.be.null;
        });

        it('should not throw when stopping music with no current track', () => {
            expect(() => {
                audioManager.stopBGM();
            }).to.not.throw();
        });

        it('should not throw when pausing music with no current track', () => {
            expect(() => {
                audioManager.pauseBGM();
            }).to.not.throw();
        });

        it('should not throw when resuming music with no current track', () => {
            expect(() => {
                audioManager.resumeBGM();
            }).to.not.throw();
        });
    });
});
