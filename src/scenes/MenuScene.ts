import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { AnimatedSpriteComponent } from '../rendering/components/AnimatedSpriteComponent';
import { ButtonComponent } from '../rendering/components/ButtonComponent';
import { EventBus, GameEvents } from '../utils/eventBus';

/**
 * MenuScene - Main menu implementation
 * Shows title, play button, options button, and exit button
 */
export class MenuScene implements IScene {
    private renderer: Renderer;
    private titleSprite: AnimatedSpriteComponent | null = null;
    private playButton: ButtonComponent | null = null;
    private optionsButton: ButtonComponent | null = null;
    private exitButton: ButtonComponent | null = null;
    
    private buttons: ButtonComponent[] = [];
    private unregisterFunctions: Array<() => void> = [];
    private canvasWidth: number;
    private canvasHeight: number;
    private buttonScale: number = 0.3; // Scale buttons to 30% of original size

    // Preloaded images
    private titleImg: any;
    private playButtonImg: any;
    private optionsButtonImg: any;
    private exitButtonImg: any;

    constructor(
        renderer: Renderer,
        canvasWidth: number,
        canvasHeight: number,
        images: { title: any; playButton: any; optionsButton: any; exitButton: any }
    ) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Store preloaded images
        this.titleImg = images.title;
        this.playButtonImg = images.playButton;
        this.optionsButtonImg = images.optionsButton;
        this.exitButtonImg = images.exitButton;
    }

    /**
     * Called when scene becomes active
     */
    enter(): void {
        // Calculate center positions
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        
        // Create animated title using loaded image
        this.titleSprite = new AnimatedSpriteComponent(this.titleImg, centerX, centerY - 150);
        this.titleSprite.setAnimationSpeed(0.05);
        this.titleSprite.setAmplitude(8);
        this.titleSprite.depth = 10;
        this.titleSprite.scale = 0.4; // Scale title down too

        // Create buttons using loaded images with scale
        this.playButton = new ButtonComponent(this.playButtonImg, centerX, centerY - 30, 'play_button');
        this.playButton.depth = 10;
        this.playButton.scale = this.buttonScale;
        this.playButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_PLAY_CLICKED);
        });

        this.optionsButton = new ButtonComponent(this.optionsButtonImg, centerX, centerY + 50, 'options_button');
        this.optionsButton.depth = 10;
        this.optionsButton.scale = this.buttonScale;
        this.optionsButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_OPTIONS_CLICKED);
        });

        this.exitButton = new ButtonComponent(this.exitButtonImg, centerX, centerY + 130, 'exit_button');
        this.exitButton.depth = 10;
        this.exitButton.scale = this.buttonScale;
        this.exitButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_EXIT_CLICKED);
        });

        // Track all buttons for hover management
        this.buttons = [this.playButton, this.optionsButton, this.exitButton];

        // Register all UI components with renderer
        this.unregisterFunctions.push(this.renderer.register(this.titleSprite));
        this.unregisterFunctions.push(this.renderer.register(this.playButton));
        this.unregisterFunctions.push(this.renderer.register(this.optionsButton));
        this.unregisterFunctions.push(this.renderer.register(this.exitButton));
    }

    /**
     * Called when scene is deactivated
     */
    exit(): void {
        // Unregister all UI components
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];

        // Clear references
        this.titleSprite = null;
        this.playButton = null;
        this.optionsButton = null;
        this.exitButton = null;
        this.buttons = [];
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
