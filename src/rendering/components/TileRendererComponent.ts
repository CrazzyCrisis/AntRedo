/**
 * TileRendererComponent - Reusable tile rendering component
 * Renders procedurally generated tile grids with sprite overlays and frills
 * Listens to WORLD_GENERATED event to automatically render new worlds
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { TileGrid } from '../../world/TileGrid';
import { TileFrillSystem } from '../../world/TileEdgeSystem';
import { EventBus, GameEvents } from '../../utils/eventBus';

/**
 * Configuration for TileRenderer appearance
 */
export interface TileRendererConfig {
    tileSize: number;
    useSprites: boolean;
    useEdges: boolean;
    showGrid: boolean;
    gridColor: string;
    gridAlpha: number;
    gridLineWeight: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: TileRendererConfig = {
    tileSize: 16,
    useSprites: true,
    useEdges: true,
    showGrid: false,
    gridColor: '#FFFFFF',
    gridAlpha: 100,
    gridLineWeight: 1
};

/**
 * TileRendererComponent renders tile grids automatically
 * Registers itself with EventBus to listen for WORLD_GENERATED events
 */
export class TileRendererComponent implements Renderable {
    public readonly id: string;
    public readonly layer: RenderLayer = RenderLayer.GROUND;
    public depth: number = 0;
    
    private tileGrid: TileGrid | null = null;
    private tileSprites: { [key: number]: any };
    private tileEdgeSprites: { [path: string]: any };
    private tileColors: { [key: number]: string };
    private config: TileRendererConfig;
    
    // Grid overlay renderable (separate)
    private gridOverlay: Renderable | null = null;
    
    constructor(
        tileSprites: { [key: number]: any },
        tileEdgeSprites: { [path: string]: any },
        tileColors: { [key: number]: string },
        config: Partial<TileRendererConfig> = {}
    ) {
        this.id = 'tile_renderer';
        this.tileSprites = tileSprites;
        this.tileEdgeSprites = tileEdgeSprites;
        this.tileColors = tileColors;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    
    /**
     * Set the tile grid to render
     */
    public setTileGrid(tileGrid: TileGrid): void {
        this.tileGrid = tileGrid;
    }
    
    /**
     * Update configuration
     */
    public setConfig(config: Partial<TileRendererConfig>): void {
        this.config = { ...this.config, ...config };
    }
    
    /**
     * Get grid overlay renderable (if grid is enabled)
     */
    public getGridOverlay(): Renderable | null {
        if (!this.config.showGrid || !this.tileGrid) {
            return null;
        }
        
        if (!this.gridOverlay) {
            this.gridOverlay = this.createGridOverlay();
        }
        
        return this.gridOverlay;
    }
    
    /**
     * Render tiles
     */
    public render(graphics: any): void {
        if (!this.tileGrid) {
            return;
        }
        
        const grid = this.tileGrid.getGrid();
        const TILE_SIZE = this.config.tileSize;
        
        // Draw each tile
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const tile = grid[row][col];
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;
                
                if (this.config.useSprites) {
                    // Step 1: Draw base tile sprite (with fallback to color if missing)
                    const sprite = this.tileSprites[tile.type];
                    if (sprite) {
                        graphics.image(sprite, x, y, TILE_SIZE, TILE_SIZE);
                    } else {
                        // Fallback to colored rectangle if sprite missing
                        const color = this.tileColors[tile.type] || '#FFFFFF';
                        graphics.fill(color);
                        graphics.noStroke();
                        graphics.rect(x, y, TILE_SIZE, TILE_SIZE);
                    }
                    
                    // Step 2: Overlay frill sprites on top (if enabled)
                    if (this.config.useEdges) {
                        const frillData = TileFrillSystem.getFrillOverlays(this.tileGrid, col, row);
                        
                        if (frillData.hasFrill) {
                            // Render each frill overlay
                            for (const frillPath of frillData.frillPaths) {
                                const frillSprite = this.tileEdgeSprites[frillPath];
                                if (frillSprite) {
                                    graphics.image(frillSprite, x, y, TILE_SIZE, TILE_SIZE);
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
    
    /**
     * Create grid overlay renderable
     */
    private createGridOverlay(): Renderable {
        const grid = this.tileGrid!.getGrid();
        const TILE_SIZE = this.config.tileSize;
        const gridWidth = grid[0].length * TILE_SIZE;
        const gridHeight = grid.length * TILE_SIZE;
        
        return {
            layer: RenderLayer.GROUND_DECORATIONS,
            depth: 1000,  // Render on top
            render: (graphics: any) => {
                graphics.stroke(this.config.gridColor);
                graphics.strokeWeight(this.config.gridLineWeight);
                (graphics as any).drawingContext.globalAlpha = this.config.gridAlpha / 255;
                
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
    }
}

/**
 * Helper: Create TileRenderer that auto-listens to WORLD_GENERATED events
 * Returns renderer component + unregister function
 */
export function createAutoTileRenderer(
    tileSprites: { [key: number]: any },
    tileEdgeSprites: { [path: string]: any },
    tileColors: { [key: number]: string },
    config: Partial<TileRendererConfig> = {}
): { renderer: TileRendererComponent; unsubscribe: () => void } {
    const renderer = new TileRendererComponent(tileSprites, tileEdgeSprites, tileColors, config);
    
    // Auto-update on world generation
    const unsubscribe = EventBus.on(GameEvents.WORLD_GENERATED, (worldData: any) => {
        if (worldData && worldData.tileGrid) {
            renderer.setTileGrid(worldData.tileGrid);
        }
    });
    
    return { renderer, unsubscribe };
}
