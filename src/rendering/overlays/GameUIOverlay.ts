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

import { Renderer } from '../Renderer';
import { Camera } from '../Camera';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { ResourceDisplayComponent } from '../components/ResourceDisplayComponent';
import { PopulationDisplayComponent } from '../components/PopulationDisplayComponent';
import { PowerBarComponent } from '../components/PowerBarComponent';
import { QueenPortraitComponent } from '../components/QueenPortraitComponent';
import { QueenCommandsComponent } from '../components/QueenCommandsComponent';
import { MinimapComponent } from '../components/MinimapComponent';
import { PanelComponent } from '../components/PanelComponent';
import { Queen } from '../../classes/Queen';
import { GAME_UI_CONFIG } from '../../config/gameUIConfig';
import { EntityManager } from '../../managers/EntityManager';

export interface GameUISprites {
    queen: any;
    ant?: any;
    resources?: {
        food: any;
        wood: any;
        stone: any;
        magicCrystal: any;
    };
    jobSprites?: {
        worker?: any;
        warrior?: any;
        scout?: any;
    };
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
    /**
     * Extract the idle frame (first frame) from a spritesheet
     * Useful for getting a single sprite from animated spritesheets for UI display
     * @param spritesheet - The spritesheet image (p5.Image)
     * @returns A 16x16 p5.Image containing just the idle frame, or null if spritesheet is invalid
     */
    public static extractIdleFrame(spritesheet: any): any {
        if (!spritesheet) return null;
        
        // Idle frame is at row 0, col 0 (16x16 pixels)
        const frameWidth = 16;
        const frameHeight = 16;
        const x = 0;
        const y = 0;
        
        // Use p5.js get() to extract the specific region
        // Note: This creates a new p5.Image with just that frame
        return spritesheet.get(x, y, frameWidth, frameHeight);
    }

    private renderer: Renderer;
    private camera: Camera;
    private config: GameUIConfig;
    private sprites: GameUISprites;
    
    // UI Components
    private bottomPanel: PanelComponent | null = null;
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
            showMinimap: GAME_UI_CONFIG.DEFAULT_VISIBILITY.MINIMAP,
            showPowerBar: GAME_UI_CONFIG.DEFAULT_VISIBILITY.POWER_BAR,
            showQueenPortrait: GAME_UI_CONFIG.DEFAULT_VISIBILITY.QUEEN_PORTRAIT,
            showCommands: GAME_UI_CONFIG.DEFAULT_VISIBILITY.COMMANDS,
            showResources: GAME_UI_CONFIG.DEFAULT_VISIBILITY.RESOURCES,
            showPopulation: GAME_UI_CONFIG.DEFAULT_VISIBILITY.POPULATION,
            ...config
        };
        this.sprites = sprites;
    }

    /**
     * Initialize all UI components
     */
    initialize(): void {
        const { canvasWidth, canvasHeight } = this.config;
        
        // Calculate screen center and half dimensions for normalized coordinate conversion
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const halfWidth = canvasWidth / 2;
        const halfHeight = canvasHeight / 2;
        
        // Bottom Panel (render first so it's behind other UI elements)
        const panelY = centerY - (GAME_UI_CONFIG.LAYOUT.BOTTOM_PANEL.offsetY * halfHeight);
        const panelHeight = GAME_UI_CONFIG.LAYOUT.BOTTOM_PANEL.height;
        this.bottomPanel = new PanelComponent(
            0,
            panelY - panelHeight / 2,
            canvasWidth,
            panelHeight,
            '#808080', // Grey
            100 // Transparent
        );
        this.uiUnregisterFunctions.push(this.renderer.register(this.bottomPanel));
        
        // Resource Display (top-left)
        if (this.config.showResources) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.RESOURCE_DISPLAY.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.RESOURCE_DISPLAY.offsetY * halfHeight);
            this.resourceDisplay = new ResourceDisplayComponent(
                x,
                y,
                this.config.factionId,
                this.sprites.resources
            );
            this.resourceDisplay.scale = GAME_UI_CONFIG.SCALES.RESOURCE_DISPLAY;
            // Pass EntityManager for querying ant inventories
            this.resourceDisplay.setEntityManager(EntityManager.getInstance());
            this.uiUnregisterFunctions.push(this.renderer.register(this.resourceDisplay));
        }
        
        // Population Display (left side, below resources)
        if (this.config.showPopulation) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.POPULATION_DISPLAY.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.POPULATION_DISPLAY.offsetY * halfHeight);
            this.populationDisplay = new PopulationDisplayComponent(
                x,
                y,
                this.sprites.ant,
                this.config.factionId,
                this.sprites.jobSprites
            );
            // TODO: Implement scale for PopulationDisplayComponent
            // this.populationDisplay.scale = GAME_UI_CONFIG.SCALES.POPULATION_DISPLAY;
            this.uiUnregisterFunctions.push(this.renderer.register(this.populationDisplay));
        }
        
        // Power Bar (bottom center)
        if (this.config.showPowerBar) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.POWER_BAR.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.POWER_BAR.offsetY * halfHeight);
            this.powerBar = new PowerBarComponent(x, y);
            // TODO: Implement scale for PowerBarComponent
            // this.powerBar.scale = GAME_UI_CONFIG.SCALES.POWER_BAR;
            this.uiUnregisterFunctions.push(this.renderer.register(this.powerBar));
        }
        
        // Queen Portrait (bottom-left)
        if (this.config.showQueenPortrait && this.sprites.queen) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.QUEEN_PORTRAIT.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.QUEEN_PORTRAIT.offsetY * halfHeight);
            this.queenPortrait = new QueenPortraitComponent(x, y, this.sprites.queen);
            // TODO: Implement scale for QueenPortraitComponent
            // this.queenPortrait.scale = GAME_UI_CONFIG.SCALES.QUEEN_PORTRAIT;
            this.uiUnregisterFunctions.push(this.renderer.register(this.queenPortrait));
        }
        
        // Queen Commands (bottom mid-left)
        if (this.config.showCommands) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.QUEEN_COMMANDS.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.QUEEN_COMMANDS.offsetY * halfHeight);
            this.commandsUI = new QueenCommandsComponent(x, y);
            // TODO: Implement scale for QueenCommandsComponent
            // this.commandsUI.scale = GAME_UI_CONFIG.SCALES.QUEEN_COMMANDS;
            this.uiUnregisterFunctions.push(this.renderer.register(this.commandsUI));
        }
        
        // Minimap (bottom-right)
        if (this.config.showMinimap) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.MINIMAP.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.MINIMAP.offsetY * halfHeight);
            const minimapSize = GAME_UI_CONFIG.SIZES.MINIMAP;
            this.minimap = new MinimapComponent(
                x,
                y,
                minimapSize,
                minimapSize,
                this.config.worldWidth,
                this.config.worldHeight
            );
            // TODO: Implement scale for MinimapComponent
            // this.minimap.scale = GAME_UI_CONFIG.SCALES.MINIMAP;
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
        
        if (this.populationDisplay) {
            this.populationDisplay.update();
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
        
        // Calculate screen center and half dimensions for normalized coordinate conversion
        const centerX = width / 2;
        const centerY = height / 2;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        // Reposition bottom panel
        if (this.bottomPanel) {
            const panelY = centerY - (GAME_UI_CONFIG.LAYOUT.BOTTOM_PANEL.offsetY * halfHeight);
            const panelHeight = GAME_UI_CONFIG.LAYOUT.BOTTOM_PANEL.height;
            this.bottomPanel.setPosition(0, panelY - panelHeight / 2);
            this.bottomPanel.setSize(width, panelHeight);
        }
        
        // Reposition UI components using normalized coordinates
        if (this.resourceDisplay) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.RESOURCE_DISPLAY.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.RESOURCE_DISPLAY.offsetY * halfHeight);
            this.resourceDisplay.setPosition(x, y);
        }
        
        if (this.populationDisplay) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.POPULATION_DISPLAY.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.POPULATION_DISPLAY.offsetY * halfHeight);
            this.populationDisplay.setPosition(x, y);
        }
        
        if (this.powerBar) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.POWER_BAR.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.POWER_BAR.offsetY * halfHeight);
            this.powerBar.setPosition(x, y);
        }
        
        if (this.queenPortrait) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.QUEEN_PORTRAIT.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.QUEEN_PORTRAIT.offsetY * halfHeight);
            this.queenPortrait.setPosition(x, y);
        }
        
        if (this.commandsUI) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.QUEEN_COMMANDS.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.QUEEN_COMMANDS.offsetY * halfHeight);
            this.commandsUI.setPosition(x, y);
        }
        
        if (this.minimap) {
            const x = centerX + (GAME_UI_CONFIG.LAYOUT.MINIMAP.offsetX * halfWidth);
            const y = centerY - (GAME_UI_CONFIG.LAYOUT.MINIMAP.offsetY * halfHeight);
            this.minimap.setPosition(x, y);
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
