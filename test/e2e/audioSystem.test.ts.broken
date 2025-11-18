/**
 * E2E tests for Audio System
 * Tests audio integration with scenes and game events
 * Uses mock sounds to verify integration without actual playback
 */

import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { AudioManager } from '../../src/managers/AudioManager';
import { Renderer } from '../../src/rendering/Renderer';
import { MenuScene } from '../../src/scenes/MenuScene';
import { AudioSettingsScene } from '../../src/scenes/AudioSettingsScene';

describe('Audio System E2E Tests', () => {
    let audioManager: AudioManager;
    let renderer: Renderer;
    const mockWindow = {
        innerWidth: 800,
        innerHeight: 600
    };

    beforeEach(() => {
        EventBus.clear();
        audioManager = AudioManager.getInstance();
        renderer = new Renderer(mockWindow as any, 800, 600);
        
        // Reset audio manager
        audioManager.setMasterVolume(0.7);
        audioManager.setMusicVolume(0.8);
        audioManager.setSFXVolume(0.8);
        audioManager.setMusicMuted(false);
        audioManager.setSFXMuted(false);
    });

    afterEach(() => {
        audioManager.cleanup();
        EventBus.clear();
    });

    describe('Menu Scene BGM Integration', () => {
        it('should track music when MenuScene enters', () => {
            // Create mock menu images
            const mockImages = {
                title: { width: 200, height: 100 },
                playButton: { width: 100, height: 50 },
                optionsButton: { width: 100, height: 50 },
                exitButton: { width: 100, height: 50 },
                videoSettingsButton: { width: 100, height: 50 },
                audioSettingsButton: { width: 100, height: 50 },
                controlsButton: { width: 100, height: 50 },
                backButton: { width: 100, height: 50 },
                devRoomButton: { width: 100, height: 50 },
                startGameButton: { width: 100, height: 50 },
                levelEditorButton: { width: 100, height: 50 }
            };

            // Load mock MENU_THEME sound
            const mockMenuMusic = {
                isPlaying: () => false,
                setVolume: () => {},
                loop: () => {},
                play: () => {}
            };
            audioManager.loadSound('MENU_THEME', mockMenuMusic);

            const menuScene = new MenuScene(renderer, 800, 600, mockImages);
            
            // Enter scene (should play menu music)
            menuScene.enter();
            
            // Verify music is tracked
            expect(audioManager.getCurrentMusic()).to.equal('MENU_THEME');
            
            // Exit scene (should stop music)
            menuScene.exit();
            
            // Verify music stopped
            expect(audioManager.getCurrentMusic()).to.be.null;
        });

        it('should stop music when MenuScene exits', () => {
            const mockImages = {
                title: { width: 200, height: 100 },
                playButton: { width: 100, height: 50 },
                optionsButton: { width: 100, height: 50 },
                exitButton: { width: 100, height: 50 },
                videoSettingsButton: { width: 100, height: 50 },
                audioSettingsButton: { width: 100, height: 50 },
                controlsButton: { width: 100, height: 50 },
                backButton: { width: 100, height: 50 },
                devRoomButton: { width: 100, height: 50 },
                startGameButton: { width: 100, height: 50 },
                levelEditorButton: { width: 100, height: 50 }
            };

            const mockMenuMusic = {
                isPlaying: () => true,
                setVolume: () => {},
                loop: () => {},
                stop: () => {}
            };
            audioManager.loadSound('MENU_THEME', mockMenuMusic);

            const menuScene = new MenuScene(renderer, 800, 600, mockImages);
            
            menuScene.enter();
            expect(audioManager.getCurrentMusic()).to.equal('MENU_THEME');
            
            menuScene.exit();
            expect(audioManager.getCurrentMusic()).to.be.null;
        });
    });

    describe('AudioSettingsScene Integration', () => {
        it('should create audio settings scene without errors', () => {
            expect(() => {
                const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
                audioSettingsScene.enter();
                audioSettingsScene.exit();
            }).to.not.throw();
        });

        it('should sync slider values with AudioManager on enter', () => {
            audioManager.setMasterVolume(0.5);
            audioManager.setMusicVolume(0.6);
            audioManager.setSFXVolume(0.7);
            
            const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
            audioSettingsScene.enter();
            
            // Verify sliders are created with current values
            expect(audioSettingsScene.masterVolumeSlider.getValue()).to.equal(0.5);
            expect(audioSettingsScene.musicVolumeSlider.getValue()).to.equal(0.6);
            expect(audioSettingsScene.sfxVolumeSlider.getValue()).to.equal(0.7);
            
            audioSettingsScene.exit();
        });

        it('should update AudioManager when master volume slider changes', () => {
            const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
            audioSettingsScene.enter();
            
            // Simulate slider change
            audioSettingsScene.masterVolumeSlider.setValue(0.3);
            
            // Verify AudioManager updated
            expect(audioManager.getMasterVolume()).to.equal(0.3);
            
            audioSettingsScene.exit();
        });

        it('should update AudioManager when music volume slider changes', () => {
            const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
            audioSettingsScene.enter();
            
            audioSettingsScene.musicVolumeSlider.setValue(0.4);
            expect(audioManager.getMusicVolume()).to.equal(0.4);
            
            audioSettingsScene.exit();
        });

        it('should update AudioManager when SFX volume slider changes', () => {
            const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
            audioSettingsScene.enter();
            
            audioSettingsScene.sfxVolumeSlider.setValue(0.5);
            expect(audioManager.getSFXVolume()).to.equal(0.5);
            
            audioSettingsScene.exit();
        });

        it('should update AudioManager when music mute toggle changes', () => {
            const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
            audioSettingsScene.enter();
            
            audioSettingsScene.musicMuteToggle.setOn(true);
            expect(audioManager.isMusicMuted()).to.be.true;
            
            audioSettingsScene.musicMuteToggle.setOn(false);
            expect(audioManager.isMusicMuted()).to.be.false;
            
            audioSettingsScene.exit();
        });

        it('should update AudioManager when SFX mute toggle changes', () => {
            const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
            audioSettingsScene.enter();
            
            audioSettingsScene.sfxMuteToggle.setOn(true);
            expect(audioManager.isSFXMuted()).to.be.true;
            
            audioSettingsScene.sfxMuteToggle.setOn(false);
            expect(audioManager.isSFXMuted()).to.be.false;
            
            audioSettingsScene.exit();
        });

        it('should emit MENU_BACK_CLICKED when back button clicked', (done) => {
            const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
            audioSettingsScene.enter();
            
            EventBus.on(GameEvents.MENU_BACK_CLICKED, () => {
                audioSettingsScene.exit();
                done();
            });
            
            // Simulate back button click
            audioSettingsScene.backButton.handleClick(
                audioSettingsScene.backButton['x'], 
                audioSettingsScene.backButton['y']
            );
        });
    });

    describe('Event-Driven Sound Playback', () => {
        it('should initialize event listeners', () => {
            audioManager.initialize();
            
            // Verify event listeners are registered
            expect(EventBus.hasListeners(GameEvents.ANT_ATTACKED)).to.be.true;
            expect(EventBus.hasListeners(GameEvents.BUILDING_PLACED)).to.be.true;
            expect(EventBus.hasListeners(GameEvents.FIREBALL_EXPLODE)).to.be.true;
        });

        it('should attempt to play sound when game event fires', () => {
            let playCalled = false;
            const mockSound = {
                isPlaying: () => false,
                setVolume: () => {},
                play: () => { playCalled = true; }
            };
            
            audioManager.loadSound('ANT_HIT', mockSound);
            audioManager.initialize();
            
            // Fire event that should trigger sound
            EventBus.emit(GameEvents.ANT_ATTACKED);
            
            // Verify play was called
            expect(playCalled).to.be.true;
        });

        it('should not play sound if SFX is muted', () => {
            let playCalled = false;
            const mockSound = {
                isPlaying: () => false,
                setVolume: () => {},
                play: () => { playCalled = true; }
            };
            
            audioManager.loadSound('ANT_HIT', mockSound);
            audioManager.initialize();
            audioManager.setSFXMuted(true);
            
            EventBus.emit(GameEvents.ANT_ATTACKED);
            
            expect(playCalled).to.be.false;
        });

        it('should calculate correct volume for SFX', () => {
            let appliedVolume = 0;
            const mockSound = {
                isPlaying: () => false,
                setVolume: (vol: number) => { appliedVolume = vol; },
                play: () => {}
            };
            
            audioManager.loadSound('ANT_HIT', mockSound);
            audioManager.setMasterVolume(0.5);
            audioManager.setSFXVolume(0.8);
            audioManager.initialize();
            
            EventBus.emit(GameEvents.ANT_ATTACKED);
            
            // Expected: 0.5 (master) * 0.8 (sfx) * 0.5 (sound config) = 0.2
            expect(appliedVolume).to.equal(0.2);
        });

        it('should not play already playing sound', () => {
            let playCount = 0;
            const mockSound = {
                isPlaying: () => playCount > 0,
                setVolume: () => {},
                play: () => { playCount++; }
            };
            
            audioManager.loadSound('ANT_HIT', mockSound);
            audioManager.initialize();
            
            EventBus.emit(GameEvents.ANT_ATTACKED);
            expect(playCount).to.equal(1);
            
            // Try to play again while already playing
            EventBus.emit(GameEvents.ANT_ATTACKED);
            expect(playCount).to.equal(1); // Should not increment
        });
    });

    describe('Scene Transitions with Music', () => {
        it('should handle music transition between scenes', () => {
            const mockMenuMusic = {
                isPlaying: () => true,
                setVolume: () => {},
                loop: () => {},
                stop: () => {}
            };
            
            const mockDevRoomMusic = {
                isPlaying: () => false,
                setVolume: () => {},
                loop: () => {},
                play: () => {}
            };
            
            audioManager.loadSound('MENU_THEME', mockMenuMusic);
            audioManager.loadSound('DEV_ROOM_THEME', mockDevRoomMusic);
            
            // Start menu music
            audioManager.playMusic('MENU_THEME', true);
            expect(audioManager.getCurrentMusic()).to.equal('MENU_THEME');
            
            // Transition to dev room
            audioManager.stopMusic();
            expect(audioManager.getCurrentMusic()).to.be.null;
            
            audioManager.playMusic('DEV_ROOM_THEME', true);
            expect(audioManager.getCurrentMusic()).to.equal('DEV_ROOM_THEME');
        });
    });

    describe('Volume Control Persistence', () => {
        it('should maintain volume settings across scene changes', () => {
            audioManager.setMasterVolume(0.4);
            audioManager.setMusicVolume(0.5);
            audioManager.setSFXVolume(0.6);
            
            // Create and enter/exit audio settings scene
            const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
            audioSettingsScene.enter();
            audioSettingsScene.exit();
            
            // Verify volumes persisted
            expect(audioManager.getMasterVolume()).to.equal(0.4);
            expect(audioManager.getMusicVolume()).to.equal(0.5);
            expect(audioManager.getSFXVolume()).to.equal(0.6);
        });

        it('should maintain mute settings across scene changes', () => {
            audioManager.setMusicMuted(true);
            audioManager.setSFXMuted(true);
            
            const audioSettingsScene = new AudioSettingsScene(renderer, 800, 600);
            audioSettingsScene.enter();
            audioSettingsScene.exit();
            
            expect(audioManager.isMusicMuted()).to.be.true;
            expect(audioManager.isSFXMuted()).to.be.true;
        });
    });
});
