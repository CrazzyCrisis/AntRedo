import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { AudioSettingsScene } from '../../src/scenes/AudioSettingsScene';
import { Renderer } from '../../src/rendering/Renderer';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { AudioManager } from '../../src/managers/AudioManager';
import { SettingsManager } from '../../src/managers/SettingsManager';
import { AUDIO_SETTINGS_LAYOUT } from '../../src/config/menuLayout';

// Mock p5.Graphics
const createMockGraphics = () => ({
    background: () => {},
    fill: () => {},
    rect: () => {},
    ellipse: () => {},
    stroke: () => {},
    strokeWeight: () => {},
    noStroke: () => {},
    push: () => {},
    pop: () => {},
    textAlign: () => {},
    textSize: () => {},
    text: () => {},
    circle: () => {},
    arc: () => {},
    triangle: () => {},
    createGraphics: (_w: number, _h: number) => createMockGraphics(),
    CENTER: 'center',
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top',
    BOTTOM: 'bottom',
    HALF_PI: Math.PI / 2,
    PI: Math.PI,
    CHORD: 'chord'
});

describe('AudioSettingsScene', () => {
    let scene: AudioSettingsScene;
    let renderer: Renderer;
    let audioManager: AudioManager;
    let settingsManager: SettingsManager;
    const canvasWidth = 800;
    const canvasHeight = 600;

    beforeEach(() => {
        EventBus.clear();
        
        // Reset managers
        (SettingsManager as any).instance = null;
        (AudioManager as any).instance = null;
        
        settingsManager = SettingsManager.getInstance();
        audioManager = AudioManager.getInstance();
        
        // Mock localStorage
        global.localStorage = {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
            key: () => null,
            length: 0
        } as any;
        
        // Create renderer with mock graphics
        renderer = new Renderer(() => createMockGraphics() as any, canvasWidth, canvasHeight);
        scene = new AudioSettingsScene(renderer, canvasWidth, canvasHeight,() => Image);
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Scene Lifecycle', () => {
        it('should implement IScene interface', () => {
            expect(scene.enter).to.be.a('function');
            expect(scene.exit).to.be.a('function');
            expect(scene.update).to.be.a('function');
            expect(scene.handleMouseClick).to.be.a('function');
            expect(scene.handleMouseMove).to.be.a('function');
        });

        it('should create components on enter()', () => {
            scene.enter();
            
            expect(scene.masterVolumeSlider).to.not.be.undefined;
            expect(scene.bgmVolumeSlider).to.not.be.undefined;
            expect(scene.sfxVolumeSlider).to.not.be.undefined;
            expect(scene.voicesVolumeSlider).to.not.be.undefined;
            expect(scene.systemVolumeSlider).to.not.be.undefined;
            expect(scene.backButton).to.not.be.undefined;
        });

        it('should register components with renderer on enter()', () => {
            const initialCount = renderer['renderables'].get(RenderLayer.UI)?.length || 0;
            scene.enter();
            const afterCount = renderer['renderables'].get(RenderLayer.UI)?.length || 0;
            
            expect(afterCount).to.be.greaterThan(initialCount);
        });

        it('should unregister components on exit()', () => {
            scene.enter();
            const afterEnter = renderer['renderables'].get(RenderLayer.UI)?.length || 0;
            
            scene.exit();
            const afterExit = renderer['renderables'].get(RenderLayer.UI)?.length || 0;
            
            expect(afterExit).to.be.lessThan(afterEnter);
        });

        it('should clean up event listeners on exit()', () => {
            scene.enter();
            const beforeCount = EventBus.listenerCount(GameEvents.SETTING_AUDIO_CHANGED);
            
            scene.exit();
            const afterCount = EventBus.listenerCount(GameEvents.SETTING_AUDIO_CHANGED);
            
            expect(afterCount).to.equal(beforeCount - 1);
        });
    });

    describe('Component Initialization', () => {
        beforeEach(() => {
            scene.enter();
        });

        it('should create master volume slider with correct initial value', () => {
            const currentVolume = audioManager.getMasterVolume();
            expect(scene.masterVolumeSlider.getValue()).to.equal(currentVolume);
        });

        it('should create BGM volume slider with correct initial value', () => {
            const currentVolume = audioManager.getBGMVolume();
            expect(scene.bgmVolumeSlider.getValue()).to.equal(currentVolume);
        });

        it('should create SFX volume slider with correct initial value', () => {
            const currentVolume = audioManager.getSFXVolume();
            expect(scene.sfxVolumeSlider.getValue()).to.equal(currentVolume);
        });

        it('should position components using layout constants', () => {
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            const halfWidth = canvasWidth / 2;
            const halfHeight = canvasHeight / 2;
            
            const expectedMasterX = centerX + (AUDIO_SETTINGS_LAYOUT.MASTER_VOLUME_SLIDER.offsetX * halfWidth);
            const expectedMasterY = centerY - (AUDIO_SETTINGS_LAYOUT.MASTER_VOLUME_SLIDER.offsetY * halfHeight);
            
            expect(scene.masterVolumeSlider.x).to.equal(expectedMasterX);
            expect(scene.masterVolumeSlider.y).to.equal(expectedMasterY);
        });
    });

    describe('AudioManager Integration', () => {
        beforeEach(() => {
            scene.enter();
        });

        it('should update AudioManager when master volume slider changes', () => {
            const newValue = 0.5;
            scene.masterVolumeSlider.setValue(newValue);
            
            expect(audioManager.getMasterVolume()).to.equal(newValue);
        });

        it('should update AudioManager when BGM volume slider changes', () => {
            const newValue = 0.7;
            scene.bgmVolumeSlider.setValue(newValue);
            
            expect(audioManager.getBGMVolume()).to.equal(newValue);
        });

        it('should update AudioManager when SFX volume slider changes', () => {
            const newValue = 0.3;
            scene.sfxVolumeSlider.setValue(newValue);
            
            expect(audioManager.getSFXVolume()).to.equal(newValue);
        });
    });

    describe('EventBus Integration', () => {
        beforeEach(() => {
            scene.enter();
        });

        it('should sync components when SETTING_AUDIO_CHANGED is emitted', () => {
            // Change settings externally
            audioManager.setMasterVolume(0.6);
            EventBus.emit(GameEvents.SETTING_AUDIO_CHANGED);
            
            expect(scene.masterVolumeSlider.getValue()).to.equal(0.6);
        });

        it('should update all sliders when audio settings change', () => {
            audioManager.setMasterVolume(0.4);
            audioManager.setBGMVolume(0.5);
            audioManager.setSFXVolume(0.6);
            EventBus.emit(GameEvents.SETTING_AUDIO_CHANGED);
            
            expect(scene.masterVolumeSlider.getValue()).to.equal(0.4);
            expect(scene.bgmVolumeSlider.getValue()).to.equal(0.5);
            expect(scene.sfxVolumeSlider.getValue()).to.equal(0.6);
        });

        it('should emit MENU_BACK_CLICKED when back button clicked', () => {
            let emitted = false;
            EventBus.on(GameEvents.MENU_BACK_CLICKED, () => emitted = true);
            
            scene.backButton.handleClick(scene.backButton.x, scene.backButton.y);
            
            expect(emitted).to.be.true;
        });
    });

    describe('Mouse Interaction', () => {
        beforeEach(() => {
            scene.enter();
        });

        it('should handle hover on sliders', () => {
            const x = scene.masterVolumeSlider.x;
            const y = scene.masterVolumeSlider.y;
            
            scene.handleMouseMove(x, y);
            
            expect(scene.masterVolumeSlider['isMouseOverTrack']).to.be.true;
        });

        it('should handle slider drag', () => {
            const slider = scene.masterVolumeSlider;
            slider.handleMouseDown(slider.x, slider.y);
            
            expect(slider['dragging']).to.be.true;
        });

        it('should handle back button click', () => {
            let clicked = false;
            EventBus.on(GameEvents.MENU_BACK_CLICKED, () => clicked = true);
            
            const x = scene.backButton.x;
            const y = scene.backButton.y;
            scene.handleMouseClick(x, y);
            
            expect(clicked).to.be.true;
        });

        it('should handle back button hover', () => {
            const x = scene.backButton.x;
            const y = scene.backButton.y;
            
            scene.handleMouseMove(x, y);
            
            expect(scene.backButton['isHovered']).to.be.true;
        });
    });

    describe('Update Loop', () => {
        beforeEach(() => {
            scene.enter();
        });

        it('should update button pulse animations', () => {
            scene.backButton.setHovered(true);
            const initialPulse = scene.backButton['pulseTime'];
            
            scene.update();
            
            expect(scene.backButton['pulseTime']).to.not.equal(initialPulse);
        });
    });

    describe('Persistence', () => {
        it('should persist volume changes to localStorage', () => {
            scene.enter();
            
            let saved = false;
            const originalSave = settingsManager.saveSettings;
            settingsManager.saveSettings = () => { saved = true; originalSave.call(settingsManager); };
            
            scene.masterVolumeSlider.setValue(0.8);
            
            expect(saved).to.be.true;
        });

    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            scene.enter();
        });

        it('should handle rapid volume changes', () => {
            scene.masterVolumeSlider.setValue(0.1);
            scene.masterVolumeSlider.setValue(0.9);
            scene.masterVolumeSlider.setValue(0.5);
            
            expect(audioManager.getMasterVolume()).to.equal(0.5);
        });

        it('should handle clicking outside all components', () => {
            expect(() => scene.handleMouseClick(0, 0)).to.not.throw();
        });

        it('should handle multiple enter/exit cycles', () => {
            scene.exit();
            scene.enter();
            scene.exit();
            scene.enter();
            
            expect(scene.masterVolumeSlider).to.not.be.undefined;
        });

        it('should handle scene sync when settings reset', () => {
            audioManager.setMasterVolume(0.5);
            scene.masterVolumeSlider.setValue(0.5);
            
            settingsManager.resetSettings();
            EventBus.emit(GameEvents.SETTING_AUDIO_CHANGED);
            
            expect(scene.masterVolumeSlider.getValue()).to.equal(audioManager.getMasterVolume());
        });
    });
});
