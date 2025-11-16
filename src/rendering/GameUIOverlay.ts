/**
 * GameUIOverlay - Reusable UI overlay for game scenes
 * Manages all standard game UI components:
 * - Resource Display (top-left)
 * - Population Display (left side)
 * - Power Bar (bottom center)
 * - Queen Portrait (bottom-left)
 * - Queen Commands (bottom mid-left)
 * - Minimap (bottom-right)
 * 
 * Usage:
 *   const uiOverlay = new GameUIOverlay(renderer, camera, canvasWidth, canvasHeight, sprites);
 *   uiOverlay.initialize();
 *   // In update loop:
 *   uiOverlay.update();
 *   // In mouse handlers:
 *   uiOverlay.handleMouseClick(x, y);
 *   // On cleanup:
 *   uiOverlay.cleanup();
 */

import { Renderer } from './Renderer';
import { Camera } from './Camera';
import { EventBus, GameEvents } from '../utils/eventBus';
import { ResourceDisplayComponent } from './components/ResourceDisplayComponent';
import { PopulationDisplayComponent } from './components/PopulationDisplayComponent';
import { PowerBarComponent } from './components/PowerBarComponent';
import { QueenPortraitComponent } from './components/QueenPortraitComponent';
import { QueenCommandsComponent } from './components/QueenCommandsComponent';
import { MinimapComponent } from './components/MinimapComponent';
import { Queen } from '../classes/Queen';

export interface GameUISprites {
    queen: any;
}

export interface GameUIConfig {
    canvasWidth: number;
    canvasHeight: number;
    worldWidth: number;
    worldHeight: number;
    factionId: string;
    showMinimap?: boolean;
    showPowerBar?: boolean;
    showQueenPortrait?: boolean;
    showCommands?: boolean;
    showResources?: boolean;
    showPopulation?: boolean;
}

/**
 * GameUIOverlay manages all standard game UI components
 */
export class GameUIOverlay {
    private renderer: Renderer;
    private camera: Camera;
    private config: GameUIConfig;
    private sprites: GameUISprites;
    
    // UI Components
    private resourceDisplay: ResourceDisplayComponent | null = null;
    private populationDisplay: PopulationDisplayComponent | null = null;
    private powerBar: PowerBarComponent | null = null;
    private queenPortrait: QueenPortraitComponent | null = null;
    private commandsUI: QueenCommandsComponent | null = null;
    private minimap: MinimapComponent | null = null;
    
    // Unregister functions for cleanup
    private uiUnregisterFunctions: Array<() => void> = [];
    private eventUnsubscribers: Array<() => void> = [];

    constructor(
        renderer: Renderer,
        camera: Camera,
        config: GameUIConfig,
        sprites: GameUISprites
    ) {
        this.renderer = renderer;
        this.camera = camera;
        this.config = {
            showMinimap: true,
            showPowerBar: true,
            showQueenPortrait: true,
            showCommands: true,
            showResources: true,
            showPopulation: true,
            ...config
        };
        this.sprites = sprites;
    }

    /**
     * Initialize all UI components
     */
    initialize(): void {
        const padding = 10;
        const { canvasWidth, canvasHeight } = this.config;
        
        // Resource Display (top-left)
        if (this.config.showResources) {
            this.resourceDisplay = new ResourceDisplayComponent(
                padding,
                padding,
                this.config.factionId
            );
            this.uiUnregisterFunctions.push(this.renderer.register(this.resourceDisplay));
        }
        
        // Population Display (left side, below resources)
        if (this.config.showPopulation) {
            this.populationDisplay = new PopulationDisplayComponent(padding, 100);
            this.uiUnregisterFunctions.push(this.renderer.register(this.populationDisplay));
        }
        
        // Power Bar (bottom center)
        if (this.config.showPowerBar) {
            this.powerBar = new PowerBarComponent(
                canvasWidth / 2 - 200,
                canvasHeight - 80
            );
            this.uiUnregisterFunctions.push(this.renderer.register(this.powerBar));
        }
        
        // Queen Portrait (bottom-left)
        if (this.config.showQueenPortrait && this.sprites.queen) {
            this.queenPortrait = new QueenPortraitComponent(
                padding,
                canvasHeight - 140,
                this.sprites.queen
            );
            this.uiUnregisterFunctions.push(this.renderer.register(this.queenPortrait));
        }
        
        // Queen Commands (bottom mid-left)
        if (this.config.showCommands) {
            this.commandsUI = new QueenCommandsComponent(
                200,
                canvasHeight - 100
            );
            this.uiUnregisterFunctions.push(this.renderer.register(this.commandsUI));
        }
        
        // Minimap (bottom-right)
        if (this.config.showMinimap) {
            this.minimap = new MinimapComponent(
                canvasWidth - 160,
                canvasHeight - 160,
                150,
                150,
                this.config.worldWidth,
                this.config.worldHeight
            );
            this.minimap.setCamera(this.camera);
            this.uiUnregisterFunctions.push(this.renderer.register(this.minimap));
            
            // Setup minimap click listener
            this.eventUnsubscribers.push(
                EventBus.on(GameEvents.MINIMAP_CLICKED, (worldX: number, worldY: number) => {
                    this.camera.moveTo(worldX, worldY);
                })
            );
        }
        
        console.log('✅ GameUIOverlay initialized');
    }

    /**
     * Set the queen reference for portrait updates
     */
    setQueen(queen: Queen): void {
        // Initialize power bar with queen's powers
        if (this.powerBar && queen) {
            this.setupPowerBar(queen);
        }
    }

    /**
     * Setup power bar with queen's powers
     */
    private setupPowerBar(queen: Queen): void {
        if (!this.powerBar) return;
        
        const powers = ['Lightning', 'Fireball', 'Blackhole', 'Tidalwave', 'FinalFlash'];
        powers.forEach((power, index) => {
            const powerData = queen.getPower(power);
            if (powerData) {
                this.powerBar!.addPower(
                    index + 1, // key
                    power, // name
                    null, // No power sprites for now
                    powerData.cooldown / 1000, // Convert ms to seconds
                    !powerData.isUnlocked // locked if not unlocked
                );
            }
        });
    }

    /**
     * Update population display
     */
    updatePopulation(current: number, max: number): void {
        if (this.populationDisplay) {
            this.populationDisplay.updateTotal(current, max);
        }
    }

    /**
     * Update UI components (called every frame)
     */
    update(): void {
        if (this.queenPortrait) {
            this.queenPortrait.update();
        }
    }

    /**
     * Handle mouse clicks on UI elements
     */
    handleMouseClick(x: number, y: number): void {
        if (this.commandsUI) {
            this.commandsUI.handleClick(x, y);
        }
        
        if (this.minimap) {
            this.minimap.handleClick(x, y);
        }
        
        if (this.populationDisplay) {
            this.populationDisplay.handleClick(x, y);
        }
    }

    /**
     * Handle mouse movement for hover states
     */
    handleMouseMove(x: number, y: number): void {
        if (this.commandsUI) {
            this.commandsUI.handleMouseMove(x, y);
        }
        
        if (this.minimap) {
            this.minimap.handleMouseMove(x, y);
        }
    }

    /**
     * Handle window resize
     */
    onResize(width: number, height: number): void {
        this.config.canvasWidth = width;
        this.config.canvasHeight = height;
        
        const padding = 10;
        
        // Reposition UI components
        if (this.powerBar) {
            this.powerBar.setPosition(width / 2 - 200, height - 80);
        }
        
        if (this.queenPortrait) {
            this.queenPortrait.setPosition(padding, height - 140);
        }
        
        if (this.commandsUI) {
            this.commandsUI.setPosition(200, height - 100);
        }
        
        if (this.minimap) {
            this.minimap.setPosition(width - 160, height - 160);
        }
    }

    /**
     * Show/hide specific UI components
     */
    setComponentVisibility(component: 'resources' | 'population' | 'powerBar' | 'portrait' | 'commands' | 'minimap', visible: boolean): void {
        // This would require adding show/hide methods to each component
        // For now, just update the config
        switch (component) {
            case 'resources':
                this.config.showResources = visible;
                break;
            case 'population':
                this.config.showPopulation = visible;
                break;
            case 'powerBar':
                this.config.showPowerBar = visible;
                break;
            case 'portrait':
                this.config.showQueenPortrait = visible;
                break;
            case 'commands':
                this.config.showCommands = visible;
                break;
            case 'minimap':
                this.config.showMinimap = visible;
                break;
        }
    }

    /**
     * Cleanup all UI components and event listeners
     */
    cleanup(): void {
        // Unregister UI components
        for (const unregister of this.uiUnregisterFunctions) {
            unregister();
        }
        this.uiUnregisterFunctions = [];
        
        // Unsubscribe from events
        for (const unsubscribe of this.eventUnsubscribers) {
            unsubscribe();
        }
        this.eventUnsubscribers = [];
        
        // Clear references
        this.resourceDisplay = null;
        this.populationDisplay = null;
        this.powerBar = null;
        this.queenPortrait = null;
        this.commandsUI = null;
        this.minimap = null;
        
        console.log('✅ GameUIOverlay cleaned up');
    }
}
