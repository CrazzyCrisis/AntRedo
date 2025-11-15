import {
    IScene,
    Renderer,
    RenderLayer,
    SliderWithArrowsComponent,
    ButtonComponent,
    AudioManager,
    EventBus,
    GameEvents,
    AUDIO_SETTINGS_LAYOUT,
    SETTINGS_SCALES,
    TextRenderable,
    PanelRenderable
} from '../imports/sceneImports';

/**
 * Audio Settings Scene
 * Clean volume control interface with sliders and arrows
 * Wired directly to AudioManager for real-time audio control
 */
export class AudioSettingsScene implements IScene {
    private renderer: Renderer;
    private canvasWidth: number;
    private canvasHeight: number;
    private audioManager: AudioManager;
    private backButtonImage: any;
    
    // UI Components
    public backgroundPanel!: PanelRenderable;
    public titleText!: TextRenderable;
    public masterVolumeSlider!: SliderWithArrowsComponent;
    public bgmVolumeSlider!: SliderWithArrowsComponent;
    public sfxVolumeSlider!: SliderWithArrowsComponent;
    public voicesVolumeSlider!: SliderWithArrowsComponent;
    public systemVolumeSlider!: SliderWithArrowsComponent;
    public backButton!: ButtonComponent;
    
    // Labels
    public masterLabel!: TextRenderable;
    public bgmLabel!: TextRenderable;
    public sfxLabel!: TextRenderable;
    public voicesLabel!: TextRenderable;
    public systemLabel!: TextRenderable;
    
    // Lifecycle management
    private unregisterFunctions: Array<() => void> = [];
    private components: Array<PanelRenderable | SliderWithArrowsComponent | ButtonComponent | TextRenderable> = [];
    
    constructor(renderer: Renderer, canvasWidth: number, canvasHeight: number, backButtonImage: any) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.audioManager = AudioManager.getInstance();
        this.backButtonImage = backButtonImage;
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
        
        // Mark UI layer dirty to show animations and hover states
        this.renderer.markLayerDirty(RenderLayer.UI);
    }
    
    handleMouseClick(x: number, y: number): void {
        // Check back button
        if (this.backButton.isMouseOver(x, y)) {
            this.backButton.handleClick(x, y);
            return;
        }
        
        // Check all sliders for clicks (arrows or track)
        this.masterVolumeSlider.handleClick(x, y);
        this.bgmVolumeSlider.handleClick(x, y);
        this.sfxVolumeSlider.handleClick(x, y);
        this.voicesVolumeSlider.handleClick(x, y);
        this.systemVolumeSlider.handleClick(x, y);
        
        // Also check for drag start on sliders
        this.masterVolumeSlider.handleMouseDown(x, y);
        this.bgmVolumeSlider.handleMouseDown(x, y);
        this.sfxVolumeSlider.handleMouseDown(x, y);
        this.voicesVolumeSlider.handleMouseDown(x, y);
        this.systemVolumeSlider.handleMouseDown(x, y);
        
        // Mark UI layer dirty for visual updates
        this.renderer.markLayerDirty(RenderLayer.UI);
    }
    
    handleMouseMove(x: number, y: number): void {
        // Update hover states for all sliders
        this.masterVolumeSlider.handleMouseMove(x, y);
        this.bgmVolumeSlider.handleMouseMove(x, y);
        this.sfxVolumeSlider.handleMouseMove(x, y);
        this.voicesVolumeSlider.handleMouseMove(x, y);
        this.systemVolumeSlider.handleMouseMove(x, y);
        
        // Update back button hover
        this.backButton.setHovered(this.backButton.isMouseOver(x, y));
        
        // Mark UI layer dirty for hover state updates
        this.renderer.markLayerDirty(RenderLayer.UI);
    }
    
    handleMouseUp(_x: number, _y: number): void {
        // Release all sliders
        this.masterVolumeSlider.handleMouseUp();
        this.bgmVolumeSlider.handleMouseUp();
        this.sfxVolumeSlider.handleMouseUp();
        this.voicesVolumeSlider.handleMouseUp();
        this.systemVolumeSlider.handleMouseUp();
        
        // Mark UI layer dirty for visual updates
        this.renderer.markLayerDirty(RenderLayer.UI);
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
        
        // Create background panel first (draws behind everything)
        const panelWidth = AUDIO_SETTINGS_LAYOUT.PANEL.width * this.canvasWidth;
        const panelHeight = AUDIO_SETTINGS_LAYOUT.PANEL.height * this.canvasHeight;
        const panelX = toPixelX(AUDIO_SETTINGS_LAYOUT.PANEL.offsetX) - panelWidth / 2;
        const panelY = toPixelY(AUDIO_SETTINGS_LAYOUT.PANEL.offsetY) - panelHeight / 2;
        
        this.backgroundPanel = new PanelRenderable(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            'audio_settings_panel',
            '#2C2C2C',  // Dark gray background
            220,        // Alpha (slightly transparent)
            12          // Corner radius
        );
        
        // Mock sprite for sliders (wide track)
        const mockSliderSprite = { width: 300, height: 20 };
        
        // Title text
        this.titleText = new TextRenderable(
            'Audio Settings',
            toPixelX(AUDIO_SETTINGS_LAYOUT.TITLE.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.TITLE.offsetY),
            32,
            255,
            'audio_title'
        );
        
        // Create sliders with arrows
        this.masterVolumeSlider = new SliderWithArrowsComponent(
            mockSliderSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.MASTER_VOLUME_SLIDER.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.MASTER_VOLUME_SLIDER.offsetY),
            0, 1,
            this.audioManager.getMasterVolume(),
            'master_volume'
        );
        this.masterVolumeSlider.setArrowStep(0.05); // 5% increments
        this.masterVolumeSlider.onChange((value: number) => {
            this.audioManager.setMasterVolume(value);
        });
        
        this.bgmVolumeSlider = new SliderWithArrowsComponent(
            mockSliderSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.BGM_VOLUME_SLIDER.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.BGM_VOLUME_SLIDER.offsetY),
            0, 1,
            this.audioManager.getBGMVolume(),
            'bgm_volume'
        );
        this.bgmVolumeSlider.setArrowStep(0.05);
        this.bgmVolumeSlider.onChange((value: number) => {
            this.audioManager.setBGMVolume(value);
        });
        
        this.sfxVolumeSlider = new SliderWithArrowsComponent(
            mockSliderSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.SFX_VOLUME_SLIDER.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.SFX_VOLUME_SLIDER.offsetY),
            0, 1,
            this.audioManager.getSFXVolume(),
            'sfx_volume'
        );
        this.sfxVolumeSlider.setArrowStep(0.05);
        this.sfxVolumeSlider.onChange((value: number) => {
            this.audioManager.setSFXVolume(value);
            // Play preview sound (use LIGHTNING as SFX example) - restart to hear volume changes
            this.audioManager.play('LIGHTNING', true);
        });
        
        // Voices and System sliders (currently map to SFX, can be extended later)
        this.voicesVolumeSlider = new SliderWithArrowsComponent(
            mockSliderSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.VOICES_VOLUME_SLIDER.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.VOICES_VOLUME_SLIDER.offsetY),
            0, 1,
            this.audioManager.getVoiceVolume(), // Currently same as SFX
            'voices_volume'
        );
        this.voicesVolumeSlider.setArrowStep(0.05);
        this.voicesVolumeSlider.onChange((value: number) => {
            // Could extend AudioManager to have separate voices volume
            this.audioManager.setVoiceVolume(value);
            // Play preview sound (ant voice) - restart to hear volume changes
            this.audioManager.play('ANT_FOCUSED_1', true);
        });
        
        this.systemVolumeSlider = new SliderWithArrowsComponent(
            mockSliderSprite as any,
            toPixelX(AUDIO_SETTINGS_LAYOUT.SYSTEM_VOLUME_SLIDER.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.SYSTEM_VOLUME_SLIDER.offsetY),
            0, 1,
            this.audioManager.getSystemVolume(), // Currently same as SFX
            'system_volume'
        );
        this.systemVolumeSlider.setArrowStep(0.05);
        this.systemVolumeSlider.onChange((value: number) => {
            // Could extend AudioManager to have separate system volume
            this.audioManager.setSystemVolume(value);
            // Play preview sound (button click as UI/system example) - restart to hear volume changes
            this.audioManager.play('BUTTON_CLICK', true);
        });
        
        // Create labels using config positions
        this.masterLabel = new TextRenderable(
            'Master',
            toPixelX(AUDIO_SETTINGS_LAYOUT.MASTER_LABEL.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.MASTER_LABEL.offsetY),
            18, 255, 'master_label'
        );
        
        this.bgmLabel = new TextRenderable(
            'BGM',
            toPixelX(AUDIO_SETTINGS_LAYOUT.BGM_LABEL.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.BGM_LABEL.offsetY),
            18, 255, 'bgm_label'
        );
        
        this.sfxLabel = new TextRenderable(
            'SFX',
            toPixelX(AUDIO_SETTINGS_LAYOUT.SFX_LABEL.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.SFX_LABEL.offsetY),
            18, 255, 'sfx_label'
        );
        
        this.voicesLabel = new TextRenderable(
            'Voices',
            toPixelX(AUDIO_SETTINGS_LAYOUT.VOICES_LABEL.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.VOICES_LABEL.offsetY),
            18, 255, 'voices_label'
        );
        
        this.systemLabel = new TextRenderable(
            'System',
            toPixelX(AUDIO_SETTINGS_LAYOUT.SYSTEM_LABEL.offsetX),
            toPixelY(AUDIO_SETTINGS_LAYOUT.SYSTEM_LABEL.offsetY),
            18, 255, 'system_label'
        );
        
        // Create back button with proper image
        this.backButton = new ButtonComponent(
            this.backButtonImage,
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
            this.backgroundPanel,  // Panel first (draws behind)
            this.titleText,
            this.masterVolumeSlider,
            this.bgmVolumeSlider,
            this.sfxVolumeSlider,
            this.voicesVolumeSlider,
            this.systemVolumeSlider,
            this.masterLabel,
            this.bgmLabel,
            this.sfxLabel,
            this.voicesLabel,
            this.systemLabel,
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
        this.bgmVolumeSlider.setValue(this.audioManager.getBGMVolume());
        this.sfxVolumeSlider.setValue(this.audioManager.getSFXVolume());
        this.voicesVolumeSlider.setValue(this.audioManager.getVoiceVolume());
        this.systemVolumeSlider.setValue(this.audioManager.getSystemVolume());
    }
}
