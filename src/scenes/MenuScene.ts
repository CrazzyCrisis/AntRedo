import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { AnimatedSpriteComponent } from '../rendering/components/AnimatedSpriteComponent';
import { ButtonComponent } from '../rendering/components/ButtonComponent';
import { EventBus, GameEvents } from '../utils/eventBus';
import { RenderLayer } from '../rendering/RenderLayer';
import { MAIN_MENU_LAYOUT, OPTIONS_MENU_LAYOUT, LEVEL_SELECT_LAYOUT, MENU_SCALES, MENU_ANIMATIONS } from '../config/menuLayout';

/**
 * MenuScene - Main menu implementation
 * Shows title with main menu buttons or options submenu buttons
 */
export class MenuScene implements IScene {
    private renderer: Renderer;
    private titleSprite: AnimatedSpriteComponent | null = null;
    // private currentState: MenuState = 'main'; // For future use if needed
    
    // Main menu buttons
    public playButton: ButtonComponent | null = null;
    public optionsButton: ButtonComponent | null = null;
    public exitButton: ButtonComponent | null = null;
    
    // Options submenu buttons
    public videoSettingsButton: ButtonComponent | null = null;
    public audioSettingsButton: ButtonComponent | null = null;
    public controlsButton: ButtonComponent | null = null;
    public backButton: ButtonComponent | null = null;
    
    // Level select submenu buttons
    public devRoomButton: ButtonComponent | null = null;
    public startGameButton: ButtonComponent | null = null;
    public levelEditorButton: ButtonComponent | null = null;
    
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
    private devRoomButtonImg: any;
    private startGameButtonImg: any;
    private levelEditorButtonImg: any;

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
            devRoomButton: any;
            startGameButton: any;
            levelEditorButton: any;
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
        this.devRoomButtonImg = images.devRoomButton;
        this.startGameButtonImg = images.startGameButton;
        this.levelEditorButtonImg = images.levelEditorButton;
    }

    /**
     * Called when scene becomes active
     */
    enter(): void {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;
        
        // Create animated title (persists across menu states)
        // Convert normalized coordinates (-1 to 1) to pixel positions
        this.titleSprite = new AnimatedSpriteComponent(
            this.titleImg,
            centerX + (MAIN_MENU_LAYOUT.TITLE.offsetX * halfWidth),
            centerY - (MAIN_MENU_LAYOUT.TITLE.offsetY * halfHeight)
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
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;

        // Create main menu buttons using layout config
        // Convert normalized coordinates (-1 to 1) to pixel positions
        this.playButton = new ButtonComponent(
            this.playButtonImg,
            centerX + (MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetX * halfWidth),
            centerY - (MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetY * halfHeight),
            'play_button'
        );
        this.playButton.depth = 10;
        this.playButton.scale = MENU_SCALES.BUTTON;
        this.playButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_PLAY_CLICKED);
            this.showLevelSelectMenu();
        });

        this.optionsButton = new ButtonComponent(
            this.optionsButtonImg,
            centerX + (MAIN_MENU_LAYOUT.OPTIONS_BUTTON.offsetX * halfWidth),
            centerY - (MAIN_MENU_LAYOUT.OPTIONS_BUTTON.offsetY * halfHeight),
            'options_button'
        );
        this.optionsButton.depth = 10;
        this.optionsButton.scale = MENU_SCALES.BUTTON;
        this.optionsButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_OPTIONS_CLICKED);
            this.showOptionsMenu();
        });

        this.exitButton = new ButtonComponent(
            this.exitButtonImg,
            centerX + (MAIN_MENU_LAYOUT.EXIT_BUTTON.offsetX * halfWidth),
            centerY - (MAIN_MENU_LAYOUT.EXIT_BUTTON.offsetY * halfHeight),
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
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;

        // Create options submenu buttons using layout config
        // Convert normalized coordinates (-1 to 1) to pixel positions
        this.videoSettingsButton = new ButtonComponent(
            this.videoSettingsButtonImg,
            centerX + (OPTIONS_MENU_LAYOUT.VIDEO_SETTINGS_BUTTON.offsetX * halfWidth),
            centerY - (OPTIONS_MENU_LAYOUT.VIDEO_SETTINGS_BUTTON.offsetY * halfHeight),
            'video_settings_button'
        );
        this.videoSettingsButton.depth = 10;
        this.videoSettingsButton.scale = MENU_SCALES.BUTTON;
        this.videoSettingsButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_VIDEO_SETTINGS_CLICKED);
        });

        this.audioSettingsButton = new ButtonComponent(
            this.audioSettingsButtonImg,
            centerX + (OPTIONS_MENU_LAYOUT.AUDIO_SETTINGS_BUTTON.offsetX * halfWidth),
            centerY - (OPTIONS_MENU_LAYOUT.AUDIO_SETTINGS_BUTTON.offsetY * halfHeight),
            'audio_settings_button'
        );
        this.audioSettingsButton.depth = 10;
        this.audioSettingsButton.scale = MENU_SCALES.BUTTON;
        this.audioSettingsButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_AUDIO_SETTINGS_CLICKED);
        });

        this.controlsButton = new ButtonComponent(
            this.controlsButtonImg,
            centerX + (OPTIONS_MENU_LAYOUT.CONTROLS_BUTTON.offsetX * halfWidth),
            centerY - (OPTIONS_MENU_LAYOUT.CONTROLS_BUTTON.offsetY * halfHeight),
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
            centerX + (OPTIONS_MENU_LAYOUT.BACK_BUTTON.offsetX * halfWidth),
            centerY - (OPTIONS_MENU_LAYOUT.BACK_BUTTON.offsetY * halfHeight),
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
     * Show level select submenu buttons
     */
    private showLevelSelectMenu(): void {
        this.clearButtons();
        
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;

        // Create level select submenu buttons using layout config
        // Convert normalized coordinates (-1 to 1) to pixel positions
        this.devRoomButton = new ButtonComponent(
            this.devRoomButtonImg,
            centerX + (LEVEL_SELECT_LAYOUT.DEV_ROOM_BUTTON.offsetX * halfWidth),
            centerY - (LEVEL_SELECT_LAYOUT.DEV_ROOM_BUTTON.offsetY * halfHeight),
            'dev_room_button'
        );
        this.devRoomButton.depth = 10;
        this.devRoomButton.scale = MENU_SCALES.BUTTON;
        this.devRoomButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_DEV_ROOM_CLICKED);
        });

        this.startGameButton = new ButtonComponent(
            this.startGameButtonImg,
            centerX + (LEVEL_SELECT_LAYOUT.START_GAME_BUTTON.offsetX * halfWidth),
            centerY - (LEVEL_SELECT_LAYOUT.START_GAME_BUTTON.offsetY * halfHeight),
            'start_game_button'
        );
        this.startGameButton.depth = 10;
        this.startGameButton.scale = MENU_SCALES.BUTTON;
        this.startGameButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_START_GAME_CLICKED);
        });

        this.levelEditorButton = new ButtonComponent(
            this.levelEditorButtonImg,
            centerX + (LEVEL_SELECT_LAYOUT.LEVEL_EDITOR_BUTTON.offsetX * halfWidth),
            centerY - (LEVEL_SELECT_LAYOUT.LEVEL_EDITOR_BUTTON.offsetY * halfHeight),
            'level_editor_button'
        );
        this.levelEditorButton.depth = 10;
        this.levelEditorButton.scale = MENU_SCALES.BUTTON;
        this.levelEditorButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_LEVEL_EDITOR_CLICKED);
        });

        // Create back button
        this.backButton = new ButtonComponent(
            this.backButtonImg,
            centerX + (LEVEL_SELECT_LAYOUT.BACK_BUTTON.offsetX * halfWidth),
            centerY - (LEVEL_SELECT_LAYOUT.BACK_BUTTON.offsetY * halfHeight),
            'back_button'
        );
        this.backButton.depth = 10;
        this.backButton.scale = MENU_SCALES.BUTTON;
        this.backButton.onClick(() => {
            this.showMainMenu();
        });

        // Track and register buttons
        this.buttons = [this.devRoomButton, this.startGameButton, this.levelEditorButton, this.backButton];
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
        
        // Clear all button references (main menu, options, and level select)
        this.playButton = null;
        this.optionsButton = null;
        this.exitButton = null;
        this.videoSettingsButton = null;
        this.audioSettingsButton = null;
        this.controlsButton = null;
        this.backButton = null;
        this.devRoomButton = null;
        this.startGameButton = null;
        this.levelEditorButton = null;
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
