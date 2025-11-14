import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { SliderComponent } from '../rendering/components/SliderComponent';
import { ToggleComponent } from '../rendering/components/ToggleComponent';
import { ButtonComponent } from '../rendering/components/ButtonComponent';
import { AudioManager } from '../managers/AudioManager';
import { EventBus, GameEvents } from '../utils/eventBus';
import { AUDIO_SETTINGS_LAYOUT, SETTINGS_SCALES } from '../config/menuLayout';

/**
 * Audio Settings Scene
 * Provides UI for adjusting volume levels and mute settings
 * Wired directly to AudioManager for real-time audio control
 */
export class AudioSettingsScene implements IScene {
    private renderer: Renderer;
    private canvasWidth: number;
    private canvasHeight: number;
    private audioManager: AudioManager;
    
    // UI Components
    public masterVolumeSlider!: SliderComponent;
    public musicVolumeSlider!: SliderComponent;
    public sfxVolumeSlider!: SliderComponent;
    public musicMuteToggle!: ToggleComponent;
    public sfxMuteToggle!: ToggleComponent;
    public backButton!: ButtonComponent;
    
    // Lifecycle management
    private unregisterFunctions: Array<() => void> = [];
    private components: Array<SliderComponent | ToggleComponent | ButtonComponent> = [];
    
    constructor(renderer: Renderer, canvasWidth: number, canvasHeight: number) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.audioManager = AudioManager.getInstance();
    }
    
    enter(): void {
        this.createComponents();
        this.registerComponents();
        this.setupEventListeners();
    }
    
    exit(): void {
        this.unregisterComponents();
        this.cleanupEventListeners();
        this.components = [];
    }
    
    update(): void {
        // Update button pulse animation
        if (this.backButton.update) {
            this.backButton.update();
        }
    }
    
    handleMouseClick(x: number, y: number): void {
        // Check back button
        if (this.backButton.isMouseOver(x, y)) {
            this.backButton.handleClick(x, y);
            return;
        }
        
        // Check toggles
        if (this.musicMuteToggle.isMouseOver(x, y)) {
            this.musicMuteToggle.handleClick(x, y);
        }
        if (this.sfxMuteToggle.isMouseOver(x, y)) {
            this.sfxMuteToggle.handleClick(x, y);
        }
        
        // Check sliders for drag start
        if (this.masterVolumeSlider.isMouseOver(x, y)) {
            this.masterVolumeSlider.handleMouseDown(x, y);
        }
        if (this.musicVolumeSlider.isMouseOver(x, y)) {
            this.musicVolumeSlider.handleMouseDown(x, y);
        }
        if (this.sfxVolumeSlider.isMouseOver(x, y)) {
            this.sfxVolumeSlider.handleMouseDown(x, y);
        }
    }
    
    handleMouseMove(x: number, y: number): void {
        // Update hover states
        this.masterVolumeSlider.setHovered(this.masterVolumeSlider.isMouseOver(x, y));
        this.musicVolumeSlider.setHovered(this.musicVolumeSlider.isMouseOver(x, y));
        this.sfxVolumeSlider.setHovered(this.sfxVolumeSlider.isMouseOver(x, y));
        this.musicMuteToggle.setHovered(this.musicMuteToggle.isMouseOver(x, y));
        this.sfxMuteToggle.setHovered(this.sfxMuteToggle.isMouseOver(x, y));
        this.backButton.setHovered(this.backButton.isMouseOver(x, y));
        
        // Handle slider dragging
        if (this.masterVolumeSlider['dragging']) {
            this.masterVolumeSlider.handleMouseDrag(x, y);
        }
        if (this.musicVolumeSlider['dragging']) {
            this.musicVolumeSlider.handleMouseDrag(x, y);
        }
        if (this.sfxVolumeSlider['dragging']) {
            this.sfxVolumeSlider.handleMouseDrag(x, y);
        }
    }
    
    handleMouseUp(_x: number, _y: number): void {
        // Release all sliders
        this.masterVolumeSlider.handleMouseUp();
        this.musicVolumeSlider.handleMouseUp();
        this.sfxVolumeSlider.handleMouseUp();
    }
    
    onResize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        // Recreate components with new positions
        // First, unregister old components
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];
        this.components = [];
        
        // Recreate with new dimensions
        this.createComponents();
        
        // Mark UI layer as dirty to trigger redraw with new dimensions
        this.renderer.markLayerDirty(RenderLayer.UI);
    }
    
    /**
     * Create all UI components with initial values from AudioManager
     */
    private createComponents(): void {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;
        
        // Helper to convert normalized coordinates to pixels
        const toPixelX = (offsetX: number) => centerX + (offsetX * halfWidth);
        const toPixelY = (offsetY: number) => centerY - (offsetY * halfHeight);
        
        // Mock sprite for UI components (when no asset loaded)
        const mockSprite = { width: 200, height: 20 };
        const mockButtonSprite = { width: 100, height: 40 };
        
        // Create sliders (min, max, initialValue, id)
        this.masterVolumeSlider = new SliderComponent(
            mockSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.MASTER_VOLUME_SLIDER.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.MASTER_VOLUME_SLIDER.offsetY),
            0, // min
            1, // max
            this.audioManager.getMasterVolume(), // initialValue
            'master_volume' // id
        );
        this.masterVolumeSlider.onChange((value: number) => {
            this.audioManager.setMasterVolume(value);
        });
        
        this.musicVolumeSlider = new SliderComponent(
            mockSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.MUSIC_VOLUME_SLIDER.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.MUSIC_VOLUME_SLIDER.offsetY),
            0,
            1,
            this.audioManager.getMusicVolume(),
            'music_volume'
        );
        this.musicVolumeSlider.onChange((value: number) => {
            this.audioManager.setMusicVolume(value);
        });
        
        this.sfxVolumeSlider = new SliderComponent(
            mockSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.SFX_VOLUME_SLIDER.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.SFX_VOLUME_SLIDER.offsetY),
            0,
            1,
            this.audioManager.getSFXVolume(),
            'sfx_volume'
        );
        this.sfxVolumeSlider.onChange((value: number) => {
            this.audioManager.setSFXVolume(value);
        });
        
        // Create toggles (initialState, id)
        const mockToggleSprite = { width: 60, height: 30 };
        this.musicMuteToggle = new ToggleComponent(
            mockToggleSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.MUSIC_MUTE_TOGGLE.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.MUSIC_MUTE_TOGGLE.offsetY),
            this.audioManager.isMusicMuted(),
            'music_mute'
        );
        this.musicMuteToggle.setLabel('Mute Music');
        this.musicMuteToggle.onChange((state: boolean) => {
            this.audioManager.setMusicMuted(state);
        });
        
        this.sfxMuteToggle = new ToggleComponent(
            mockToggleSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.SFX_MUTE_TOGGLE.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.SFX_MUTE_TOGGLE.offsetY),
            this.audioManager.isSFXMuted(),
            'sfx_mute'
        );
        this.sfxMuteToggle.setLabel('Mute SFX');
        this.sfxMuteToggle.onChange((state: boolean) => {
            this.audioManager.setSFXMuted(state);
        });
        
        // Create back button
        this.backButton = new ButtonComponent(
            mockButtonSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.BACK_BUTTON.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.BACK_BUTTON.offsetY),
            'audio_back_button'
        );
        this.backButton.scale = SETTINGS_SCALES.BACK_BUTTON;
        this.backButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_BACK_CLICKED);
        });
        
        // Store all components for batch operations
        this.components = [
            this.masterVolumeSlider,
            this.musicVolumeSlider,
            this.sfxVolumeSlider,
            this.musicMuteToggle,
            this.sfxMuteToggle,
            this.backButton
        ];
    }
    
    /**
     * Register all components with renderer
     */
    private registerComponents(): void {
        this.components.forEach(component => {
            this.unregisterFunctions.push(this.renderer.register(component));
        });
    }
    
    /**
     * Unregister all components from renderer
     */
    private unregisterComponents(): void {
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];
    }
    
    /**
     * Setup event listeners for external changes
     */
    private setupEventListeners(): void {
        // Listen for external audio setting changes
        const audioChangedListener = () => this.syncComponentsWithAudioManager();
        EventBus.on(GameEvents.SETTING_AUDIO_CHANGED, audioChangedListener);
        
        // Store for cleanup
        this.unregisterFunctions.push(() => {
            EventBus.off(GameEvents.SETTING_AUDIO_CHANGED, audioChangedListener);
        });
    }
    
    /**
     * Cleanup event listeners
     */
    private cleanupEventListeners(): void {
        // Unregister functions already stored include EventBus cleanup
    }
    
    /**
     * Sync component values with AudioManager state
     * Called when external changes occur
     */
    private syncComponentsWithAudioManager(): void {
        this.masterVolumeSlider.setValue(this.audioManager.getMasterVolume());
        this.musicVolumeSlider.setValue(this.audioManager.getMusicVolume());
        this.sfxVolumeSlider.setValue(this.audioManager.getSFXVolume());
        this.musicMuteToggle.setOn(this.audioManager.isMusicMuted());
        this.sfxMuteToggle.setOn(this.audioManager.isSFXMuted());
    }
}
