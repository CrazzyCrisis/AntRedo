import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { SliderComponent } from '../rendering/components/SliderComponent';
import { ToggleComponent } from '../rendering/components/ToggleComponent';
import { ButtonComponent } from '../rendering/components/ButtonComponent';
import { SettingsManager } from '../managers/SettingsManager';
import { EventBus, GameEvents } from '../utils/eventBus';
import { VIDEO_SETTINGS_LAYOUT, SETTINGS_SCALES } from '../config/menuLayout';

/**
 * Video Settings Scene
 * Provides UI for adjusting video/graphics settings
 * Wired directly to SettingsManager for real-time updates
 */
export class VideoSettingsScene implements IScene {
    private renderer: Renderer;
    private canvasWidth: number;
    private canvasHeight: number;
    private settingsManager: SettingsManager;
    
    // UI Components
    public cameraSmoothingSlider!: SliderComponent;
    public screenShakeToggle!: ToggleComponent;
    public particleEffectsToggle!: ToggleComponent;
    public backButton!: ButtonComponent;
    
    // Lifecycle management
    private unregisterFunctions: Array<() => void> = [];
    private components: Array<SliderComponent | ToggleComponent | ButtonComponent> = [];
    
    constructor(renderer: Renderer, canvasWidth: number, canvasHeight: number) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.settingsManager = SettingsManager.getInstance();
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
        if (this.screenShakeToggle.isMouseOver(x, y)) {
            this.screenShakeToggle.handleClick(x, y);
        }
        if (this.particleEffectsToggle.isMouseOver(x, y)) {
            this.particleEffectsToggle.handleClick(x, y);
        }
        
        // Check slider for drag start
        if (this.cameraSmoothingSlider.isMouseOver(x, y)) {
            this.cameraSmoothingSlider.handleMouseDown(x, y);
        }
    }
    
    handleMouseMove(x: number, y: number): void {
        // Update hover states
        this.cameraSmoothingSlider.setHovered(this.cameraSmoothingSlider.isMouseOver(x, y));
        this.screenShakeToggle.setHovered(this.screenShakeToggle.isMouseOver(x, y));
        this.particleEffectsToggle.setHovered(this.particleEffectsToggle.isMouseOver(x, y));
        this.backButton.setHovered(this.backButton.isMouseOver(x, y));
        
        // Handle slider dragging
        if (this.cameraSmoothingSlider['dragging']) {
            this.cameraSmoothingSlider.handleMouseDrag(x, y);
        }
    }
    
    handleMouseUp(_x: number, _y: number): void {
        // Release slider
        this.cameraSmoothingSlider.handleMouseUp();
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
     * Create all UI components with initial values from SettingsManager
     */
    private createComponents(): void {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;
        
        // Helper to convert normalized coordinates to pixels
        const toPixelX = (offsetX: number) => centerX + (offsetX * halfWidth);
        const toPixelY = (offsetY: number) => centerY - (offsetY * halfHeight);
        
        // Mock sprites for UI components
        const mockSprite = { width: 200, height: 20 };
        const mockToggleSprite = { width: 60, height: 30 };
        const mockButtonSprite = { width: 100, height: 40 };
        
        const videoSettings = this.settingsManager.getVideoSettings();
        
        // Create camera smoothing slider
        this.cameraSmoothingSlider = new SliderComponent(
            mockSprite as any,
            toPixelX(VIDEO_SETTINGS_LAYOUT.CAMERA_SMOOTHING_SLIDER.offsetX),
            toPixelY(VIDEO_SETTINGS_LAYOUT.CAMERA_SMOOTHING_SLIDER.offsetY),
            0, // min
            1, // max
            videoSettings.cameraSmoothing,
            'camera_smoothing'
        );
        this.cameraSmoothingSlider.onChange((value: number) => {
            this.settingsManager.setVideoSettings({
                ...this.settingsManager.getVideoSettings(),
                cameraSmoothing: value
            });
        });
        
        // Create screen shake toggle
        this.screenShakeToggle = new ToggleComponent(
            mockToggleSprite as any,
            toPixelX(VIDEO_SETTINGS_LAYOUT.SCREEN_SHAKE_TOGGLE.offsetX),
            toPixelY(VIDEO_SETTINGS_LAYOUT.SCREEN_SHAKE_TOGGLE.offsetY),
            videoSettings.screenShake,
            'screen_shake'
        );
        this.screenShakeToggle.setLabel('Screen Shake');
        this.screenShakeToggle.onChange((state: boolean) => {
            this.settingsManager.setVideoSettings({
                ...this.settingsManager.getVideoSettings(),
                screenShake: state
            });
        });
        
        // Create particle effects toggle
        this.particleEffectsToggle = new ToggleComponent(
            mockToggleSprite as any,
            toPixelX(VIDEO_SETTINGS_LAYOUT.PARTICLE_EFFECTS_TOGGLE.offsetX),
            toPixelY(VIDEO_SETTINGS_LAYOUT.PARTICLE_EFFECTS_TOGGLE.offsetY),
            videoSettings.particleEffects,
            'particle_effects'
        );
        this.particleEffectsToggle.setLabel('Particle Effects');
        this.particleEffectsToggle.onChange((state: boolean) => {
            this.settingsManager.setVideoSettings({
                ...this.settingsManager.getVideoSettings(),
                particleEffects: state
            });
        });
        
        // Create back button
        this.backButton = new ButtonComponent(
            mockButtonSprite as any,
            toPixelX(VIDEO_SETTINGS_LAYOUT.BACK_BUTTON.offsetX),
            toPixelY(VIDEO_SETTINGS_LAYOUT.BACK_BUTTON.offsetY),
            'video_back_button'
        );
        this.backButton.scale = SETTINGS_SCALES.BACK_BUTTON;
        this.backButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_BACK_CLICKED);
        });
        
        // Store all components for batch operations
        this.components = [
            this.cameraSmoothingSlider,
            this.screenShakeToggle,
            this.particleEffectsToggle,
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
        // Listen for external video setting changes
        const videoChangedListener = () => this.syncComponentsWithSettings();
        EventBus.on(GameEvents.SETTING_VIDEO_CHANGED, videoChangedListener);
        
        // Store for cleanup
        this.unregisterFunctions.push(() => {
            EventBus.off(GameEvents.SETTING_VIDEO_CHANGED, videoChangedListener);
        });
    }
    
    /**
     * Cleanup event listeners
     */
    private cleanupEventListeners(): void {
        // Unregister functions already stored include EventBus cleanup
    }
    
    /**
     * Sync component values with SettingsManager state
     * Called when external changes occur
     */
    private syncComponentsWithSettings(): void {
        const videoSettings = this.settingsManager.getVideoSettings();
        this.cameraSmoothingSlider.setValue(videoSettings.cameraSmoothing);
        this.screenShakeToggle.setOn(videoSettings.screenShake);
        this.particleEffectsToggle.setOn(videoSettings.particleEffects);
    }
}
