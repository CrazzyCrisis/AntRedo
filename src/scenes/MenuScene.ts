import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { AnimatedSpriteComponent } from '../rendering/components/AnimatedSpriteComponent';
import { ButtonComponent } from '../rendering/components/ButtonComponent';
import { EventBus, GameEvents } from '../utils/eventBus';

// Declare p5.js functions (global mode)
declare const loadImage: any;

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

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    /**
     * Called when scene becomes active
     */
    enter(): void {
        // Load sprites (placeholders for now - actual assets would use loadImage)
        const titleSpriteImg = { width: 200, height: 80 }; // Placeholder
        const buttonSpriteImg = { width: 150, height: 50 }; // Placeholder

        // Create animated title
        this.titleSprite = new AnimatedSpriteComponent(titleSpriteImg, 400, 150);
        this.titleSprite.setAnimationSpeed(0.05);
        this.titleSprite.setAmplitude(8);
        this.titleSprite.depth = 10;

        // Create buttons
        this.playButton = new ButtonComponent(buttonSpriteImg, 400, 300, 'play_button');
        this.playButton.depth = 10;
        this.playButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_PLAY_CLICKED);
        });

        this.optionsButton = new ButtonComponent(buttonSpriteImg, 400, 375, 'options_button');
        this.optionsButton.depth = 10;
        this.optionsButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_OPTIONS_CLICKED);
        });

        this.exitButton = new ButtonComponent(buttonSpriteImg, 400, 450, 'exit_button');
        this.exitButton.depth = 10;
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
