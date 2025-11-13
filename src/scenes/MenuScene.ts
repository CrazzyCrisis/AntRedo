import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { AnimatedSpriteComponent } from '../rendering/components/AnimatedSpriteComponent';
import { ButtonComponent } from '../rendering/components/ButtonComponent';
import { EventBus, GameEvents } from '../utils/eventBus';
import { RenderLayer } from '../rendering/RenderLayer';
import { MAIN_MENU_LAYOUT, OPTIONS_MENU_LAYOUT, MENU_SCALES, MENU_ANIMATIONS } from '../config/menuLayout';

/**
 * MenuScene - Main menu implementation
 * Shows title with main menu buttons or options submenu buttons
 */
export class MenuScene implements IScene {
    private renderer: Renderer;
    private titleSprite: AnimatedSpriteComponent | null = null;
    // private currentState: MenuState = 'main'; // For future use if needed
    
    // Main menu buttons
    private playButton: ButtonComponent | null = null;
    private optionsButton: ButtonComponent | null = null;
    private exitButton: ButtonComponent | null = null;
    
    // Options submenu buttons
    private videoSettingsButton: ButtonComponent | null = null;
    private audioSettingsButton: ButtonComponent | null = null;
    private controlsButton: ButtonComponent | null = null;
    private backButton: ButtonComponent | null = null;
    
    private buttons: ButtonComponent[] = [];
    private buttonUnregisterFunctions: Array<() => void> = [];
    private titleUnregisterFunction: (() => void) | null = null;
    private canvasWidth: number;
    private canvasHeight: number; 

    // Preloaded images
    private titleImg: any;
    private playButtonImg: any;
    private optionsButtonImg: any;
    private exitButtonImg: any;
    private videoSettingsButtonImg: any;
    private audioSettingsButtonImg: any;
    private controlsButtonImg: any;
    private backButtonImg: any;

    constructor(
        renderer: Renderer,
        canvasWidth: number,
        canvasHeight: number,
        images: {
            title: any;
            playButton: any;
            optionsButton: any;
            exitButton: any;
            videoSettingsButton: any;
            audioSettingsButton: any;
            controlsButton: any;
            backButton: any;
        }
    ) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Store preloaded images
        this.titleImg = images.title;
        this.playButtonImg = images.playButton;
        this.optionsButtonImg = images.optionsButton;
        this.exitButtonImg = images.exitButton;
        this.videoSettingsButtonImg = images.videoSettingsButton;
        this.audioSettingsButtonImg = images.audioSettingsButton;
        this.controlsButtonImg = images.controlsButton;
        this.backButtonImg = images.backButton;
    }

    /**
     * Called when scene becomes active
     */
    enter(): void {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        
        // Create animated title (persists across menu states)
        this.titleSprite = new AnimatedSpriteComponent(
            this.titleImg,
            centerX + MAIN_MENU_LAYOUT.TITLE.offsetX,
            centerY + MAIN_MENU_LAYOUT.TITLE.offsetY
        );
        this.titleSprite.setAnimationSpeed(MENU_ANIMATIONS.TITLE_SPEED);
        this.titleSprite.setAmplitude(MENU_ANIMATIONS.TITLE_AMPLITUDE);
        this.titleSprite.depth = 10;
        this.titleSprite.scale = MENU_SCALES.TITLE;
        this.titleUnregisterFunction = this.renderer.register(this.titleSprite);

        // Show main menu
        this.showMainMenu();
    }

    /**
     * Show main menu buttons
     */
    private showMainMenu(): void {
        this.clearButtons();
        
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        // Create main menu buttons using layout config
        this.playButton = new ButtonComponent(
            this.playButtonImg,
            centerX + MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetX,
            centerY + MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetY,
            'play_button'
        );
        this.playButton.depth = 10;
        this.playButton.scale = MENU_SCALES.BUTTON;
        this.playButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_PLAY_CLICKED);
        });

        this.optionsButton = new ButtonComponent(
            this.optionsButtonImg,
            centerX + MAIN_MENU_LAYOUT.OPTIONS_BUTTON.offsetX,
            centerY + MAIN_MENU_LAYOUT.OPTIONS_BUTTON.offsetY,
            'options_button'
        );
        this.optionsButton.depth = 10;
        this.optionsButton.scale = MENU_SCALES.BUTTON;
        this.optionsButton.onClick(() => {
            this.showOptionsMenu();
        });

        this.exitButton = new ButtonComponent(
            this.exitButtonImg,
            centerX + MAIN_MENU_LAYOUT.EXIT_BUTTON.offsetX,
            centerY + MAIN_MENU_LAYOUT.EXIT_BUTTON.offsetY,
            'exit_button'
        );
        this.exitButton.depth = 10;
        this.exitButton.scale = MENU_SCALES.BUTTON;
        this.exitButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_EXIT_CLICKED);
        });

        // Track and register buttons
        this.buttons = [this.playButton, this.optionsButton, this.exitButton];
        this.buttons.forEach(button => {
            this.buttonUnregisterFunctions.push(this.renderer.register(button));
        });
    }

    /**
     * Show options submenu buttons
     */
    private showOptionsMenu(): void {
        this.clearButtons();
        
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        // Create options submenu buttons using layout config
        this.videoSettingsButton = new ButtonComponent(
            this.videoSettingsButtonImg,
            centerX + OPTIONS_MENU_LAYOUT.VIDEO_SETTINGS_BUTTON.offsetX,
            centerY + OPTIONS_MENU_LAYOUT.VIDEO_SETTINGS_BUTTON.offsetY,
            'video_settings_button'
        );
        this.videoSettingsButton.depth = 10;
        this.videoSettingsButton.scale = MENU_SCALES.BUTTON;
        this.videoSettingsButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_VIDEO_SETTINGS_CLICKED);
        });

        this.audioSettingsButton = new ButtonComponent(
            this.audioSettingsButtonImg,
            centerX + OPTIONS_MENU_LAYOUT.AUDIO_SETTINGS_BUTTON.offsetX,
            centerY + OPTIONS_MENU_LAYOUT.AUDIO_SETTINGS_BUTTON.offsetY,
            'audio_settings_button'
        );
        this.audioSettingsButton.depth = 10;
        this.audioSettingsButton.scale = MENU_SCALES.BUTTON;
        this.audioSettingsButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_AUDIO_SETTINGS_CLICKED);
        });

        this.controlsButton = new ButtonComponent(
            this.controlsButtonImg,
            centerX + OPTIONS_MENU_LAYOUT.CONTROLS_BUTTON.offsetX,
            centerY + OPTIONS_MENU_LAYOUT.CONTROLS_BUTTON.offsetY,
            'controls_button'
        );
        this.controlsButton.depth = 10;
        this.controlsButton.scale = MENU_SCALES.BUTTON;
        this.controlsButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_CONTROLS_CLICKED);
        });

        // Create back button
        this.backButton = new ButtonComponent(
            this.backButtonImg,
            centerX + OPTIONS_MENU_LAYOUT.BACK_BUTTON.offsetX,
            centerY + OPTIONS_MENU_LAYOUT.BACK_BUTTON.offsetY,
            'back_button'
        );
        this.backButton.depth = 10;
        this.backButton.scale = MENU_SCALES.BUTTON;
        this.backButton.onClick(() => {
            this.showMainMenu();
        });

        // Track and register buttons
        this.buttons = [this.videoSettingsButton, this.audioSettingsButton, this.controlsButton, this.backButton];
        this.buttons.forEach(button => {
            this.buttonUnregisterFunctions.push(this.renderer.register(button));
        });
    }

    /**
     * Clear current buttons from renderer
     */
    private clearButtons(): void {
        // Unregister all current buttons
        this.buttonUnregisterFunctions.forEach(unregister => unregister());
        this.buttonUnregisterFunctions = [];
        this.buttons = [];
        
        // Clear button references
        this.playButton = null;
        this.optionsButton = null;
        this.exitButton = null;
        this.videoSettingsButton = null;
        this.audioSettingsButton = null;
        this.controlsButton = null;
        this.backButton = null;
    }

    /**
     * Called when scene is deactivated
     */
    exit(): void {
        // Unregister buttons
        this.clearButtons();
        
        // Unregister title
        if (this.titleUnregisterFunction) {
            this.titleUnregisterFunction();
            this.titleUnregisterFunction = null;
        }
        
        this.titleSprite = null;
    }

    /**
     * Called every frame
     */
    update(): void {
        // Update animations
        if (this.titleSprite) {
            this.titleSprite.update();
        }

        // Update button animations (pulse effect)
        this.buttons.forEach(button => button.update());
        
        // Mark UI layer dirty so animations render every frame
        this.renderer.markLayerDirty(RenderLayer.UI);
    }

    /**
     * Handle mouse click
     */
    handleMouseClick(x: number, y: number): void {
        // Check each button for click
        this.buttons.forEach(button => {
            button.handleClick(x, y);
        });
    }

    /**
     * Handle mouse move (for hover effects)
     */
    handleMouseMove(x: number, y: number): void {
        // Update hover state for all buttons
        this.buttons.forEach(button => {
            const isOver = button.isMouseOver(x, y);
            button.setHovered(isOver);
        });
    }
}
