/**
 * DevRoomScene - Development/testing room for world generation
 * Loads a procedurally generated world and displays it
 */

import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { EventBus, GameEvents } from '../utils/eventBus';
import { GameStateManager } from '../managers/GameStateManager';
import { WorldGenerator } from '../world/WorldGenerator';
import { TileGrid } from '../world/TileGrid';
import { RenderLayer } from '../rendering/RenderLayer';
import { TILE_SIZE } from '../world/TileSystem';
import { ButtonComponent } from '../rendering/components/ButtonComponent';
import { DEV_ROOM_CONFIG } from '../config/devRoomConfig';
import { TileFrillSystem } from '../world/TileEdgeSystem';

export class DevRoomScene implements IScene {
    private renderer: Renderer;
    private canvasWidth: number;
    private canvasHeight: number;
    private backButton: ButtonComponent | null = null;
    private unregisterFunctions: Array<() => void> = [];
    private gameState: GameStateManager;
    private worldGenerator: WorldGenerator;
    private backButtonImg: any;
    private tileSprites: { [key: number]: any };
    private tileEdgeSprites: { [path: string]: any };
    
    // Tile colors from config (fallback)
    private tileColors: { [key: number]: string };

    constructor(renderer: Renderer, canvasWidth: number, canvasHeight: number, backButtonImg: any, tileSprites: { [key: number]: any }, tileEdgeSprites: { [path: string]: any }) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.backButtonImg = backButtonImg;
        this.tileSprites = tileSprites;
        this.tileEdgeSprites = tileEdgeSprites;
        this.gameState = GameStateManager.getInstance();
        this.worldGenerator = new WorldGenerator();
        
        // Initialize tile colors from config (used only if sprites disabled)
        this.tileColors = DEV_ROOM_CONFIG.TILES.COLORS;
    }

    enter(): void {
        // Generate world using config parameters
        this.worldGenerator.setNoiseScale(DEV_ROOM_CONFIG.WORLD.NOISE_SCALE);
        
        // Use system time as seed for random world generation
        const seed = Date.now();
        
        const worldData = this.worldGenerator.generate(
            DEV_ROOM_CONFIG.WORLD.WIDTH,
            DEV_ROOM_CONFIG.WORLD.HEIGHT,
            seed
        );
        const tileGrid = new TileGrid(worldData);
        
        // Store in game state
        this.gameState.setTileGrid(tileGrid);

        // Create back button using ButtonComponent
        this.createBackButton();

        // Create a simple tile renderer component
        this.createTileRenderer(tileGrid);
    }

    private createBackButton(): void {
        // Convert normalized coordinates to pixels
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;
        
        const buttonX = centerX + (DEV_ROOM_CONFIG.LAYOUT.BACK_BUTTON.offsetX * halfWidth);
        const buttonY = centerY - (DEV_ROOM_CONFIG.LAYOUT.BACK_BUTTON.offsetY * halfHeight);
        
        // Create ButtonComponent with sprite
        this.backButton = new ButtonComponent(
            this.backButtonImg,
            buttonX,
            buttonY,
            'back_button_devroom'
        );
        this.backButton.scale = DEV_ROOM_CONFIG.SCALES.BUTTON;
        this.backButton.setPulseSpeed(DEV_ROOM_CONFIG.ANIMATIONS.BUTTON_PULSE_SPEED);
        this.backButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_BACK_CLICKED);
        });
        
        this.unregisterFunctions.push(this.renderer.register(this.backButton));
    }

    private createTileRenderer(tileGrid: TileGrid): void {
        const grid = tileGrid.getGrid();
        
        // Create a renderable that draws all tiles with frill overlays
        const tileRenderable = {
            id: 'tile_grid',
            layer: RenderLayer.GROUND,
            depth: 0,
            render: (graphics: any) => {
                // Draw each tile
                for (let row = 0; row < grid.length; row++) {
                    for (let col = 0; col < grid[row].length; col++) {
                        const tile = grid[row][col];
                        const x = col * TILE_SIZE;
                        const y = row * TILE_SIZE;
                        
                        if (DEV_ROOM_CONFIG.TILES.USE_SPRITES) {
                            // Step 1: Draw base tile sprite
                            if (this.tileSprites[tile.type]) {
                                graphics.image(this.tileSprites[tile.type], x, y, TILE_SIZE, TILE_SIZE);
                            }
                            
                            // Step 2: Overlay frill sprites on top (if enabled)
                            if (DEV_ROOM_CONFIG.TILES.USE_EDGES) {
                                const frillData = TileFrillSystem.getFrillOverlays(tileGrid, col, row);
                                
                                if (frillData.hasFrill) {
                                    // Render each frill overlay
                                    for (const frillPath of frillData.frillPaths) {
                                        const sprite = this.tileEdgeSprites[frillPath];
                                        if (sprite) {
                                            graphics.image(sprite, x, y, TILE_SIZE, TILE_SIZE);
                                        }
                                    }
                                }
                            }
                        } else {
                            // Draw colored rectangle (fallback)
                            const color = this.tileColors[tile.type] || '#FFFFFF';
                            graphics.fill(color);
                            graphics.noStroke();
                            graphics.rect(x, y, TILE_SIZE, TILE_SIZE);
                            
                            // Draw border for clarity
                            graphics.stroke(0, 50);
                            graphics.noFill();
                            graphics.rect(x, y, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
            }
        };

        this.unregisterFunctions.push(this.renderer.register(tileRenderable));
        this.renderer.markLayerDirty(RenderLayer.GROUND);
        
        // Add grid overlay on top of tiles
        if (DEV_ROOM_CONFIG.GRID_OVERLAY.ENABLED) {
            this.createGridOverlay(tileGrid);
        }
    }
    
    private createGridOverlay(tileGrid: TileGrid): void {
        const grid = tileGrid.getGrid();
        const gridWidth = grid[0].length * TILE_SIZE;
        const gridHeight = grid.length * TILE_SIZE;
        
        const gridRenderable = {
            id: 'tile_grid_overlay',
            layer: RenderLayer.GROUND_DECORATIONS,
            depth: 1000,  // Render on top of everything else in this layer
            render: (graphics: any) => {
                graphics.stroke(DEV_ROOM_CONFIG.GRID_OVERLAY.COLOR);
                graphics.strokeWeight(DEV_ROOM_CONFIG.GRID_OVERLAY.LINE_WEIGHT);
                (graphics as any).drawingContext.globalAlpha = DEV_ROOM_CONFIG.GRID_OVERLAY.ALPHA / 255;
                
                // Draw vertical lines
                for (let col = 0; col <= grid[0].length; col++) {
                    const x = col * TILE_SIZE;
                    graphics.line(x, 0, x, gridHeight);
                }
                
                // Draw horizontal lines
                for (let row = 0; row <= grid.length; row++) {
                    const y = row * TILE_SIZE;
                    graphics.line(0, y, gridWidth, y);
                }
                
                // Reset alpha
                (graphics as any).drawingContext.globalAlpha = 1.0;
            }
        };
        
        this.unregisterFunctions.push(this.renderer.register(gridRenderable));
        this.renderer.markLayerDirty(RenderLayer.GROUND_DECORATIONS);
    }

    exit(): void {
        // Unregister all renderables
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];

        // Clear game state
        this.gameState.clearTileGrid();
    }

    update(): void {
        // Update button animations
        if (this.backButton) {
            this.backButton.update();
            // Mark UI layer dirty so button hover effects are visible
            this.renderer.markLayerDirty(RenderLayer.UI);
        }
    }

    handleMouseClick(x: number, y: number): void {
        // Handle button click
        if (this.backButton) {
            this.backButton.handleClick(x, y);
        }
    }

    handleMouseMove(x: number, y: number): void {
        // Handle button hover
        if (this.backButton) {
            this.backButton.setHovered(this.backButton.isMouseOver(x, y));
        }
    }
}
