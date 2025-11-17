/**
 * TileRenderer - Optimized tile rendering with camera culling
 * 
 * Responsibilities:
 * - Render only visible tiles (view frustum culling)
 * - Support base tile sprites + frill overlays
 * - Grid overlay rendering
 * - Fallback to colored rectangles when sprites disabled
 * - Only renders tiles visible in camera view + small margin
 */

import { TileGrid } from './TileGrid';
import { TileFrillSystem } from './TileEdgeSystem';
import { TILE_SIZE } from './TileSystem';
import { Camera } from '../rendering/Camera';
import { TILE_CONFIG } from '../config/world/tileConfig';
import { EventBus, GameEvents } from '../utils/eventBus';
import { RenderLayer } from '../rendering/RenderLayer';

export interface TileRenderConfig {
    /** Map of tile type to sprite image */
    tileSprites: Record<string, any>;
    
    /** Map of frill path to sprite image */
    tileEdgeSprites: Record<string, any>;
    
    /** Fallback colors when sprites disabled */
    tileColors: Record<string, string>;
    
    /** Canvas dimensions for viewport calculations */
    canvasWidth: number;
    canvasHeight: number;
}

/**
 * TileRenderer provides optimized tile rendering with camera culling.
 * 
 * Usage:
 * ```typescript
 * const renderer = new TileRenderer(tileGrid, config);
 * const renderable = renderer.createTileRenderable(camera);
 * ```
 */
export class TileRenderer {
    constructor(
        private tileGrid: TileGrid,
        private config: TileRenderConfig
    ) {}
    
    /**
     * Create a renderable function that renders visible tiles with camera culling.
     * This function is called by the Renderer every frame.
     * 
     * @param camera - Camera instance for view frustum culling
     * @returns Render function compatible with Renderer
     */
    createTileRenderable(camera: Camera | null): (graphics: any) => void {
        const grid = this.tileGrid.getGrid();
        
        return (graphics: any) => {
            if (!camera) {
                return; // No camera, can't determine visible area
            }
            
            // Camera culling: Only render tiles visible in camera view + margin
            const margin = TILE_SIZE * 2; // 2 tiles of margin for smooth edges
            const minX = camera.x - (this.config.canvasWidth / 2) - margin;
            const maxX = camera.x + (this.config.canvasWidth / 2) + margin;
            const minY = camera.y - (this.config.canvasHeight / 2) - margin;
            const maxY = camera.y + (this.config.canvasHeight / 2) + margin;
            
            // Convert world coords to grid coords
            const startCol = Math.max(0, Math.floor(minX / TILE_SIZE));
            const endCol = Math.min(grid[0].length - 1, Math.floor(maxX / TILE_SIZE));
            const startRow = Math.max(0, Math.floor(minY / TILE_SIZE));
            const endRow = Math.min(grid.length - 1, Math.floor(maxY / TILE_SIZE));
            
            // Only draw visible tiles
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const tile = grid[row][col];
                    const x = col * TILE_SIZE;
                    const y = row * TILE_SIZE;
                    
                    if (TILE_CONFIG.USE_SPRITES) {
                        // Step 1: Draw base tile sprite
                        if (this.config.tileSprites[tile.type]) {
                            graphics.image(this.config.tileSprites[tile.type], x, y, TILE_SIZE, TILE_SIZE);
                        }
                        
                        // Step 2: Overlay frill sprites on top (if enabled)
                        if (TILE_CONFIG.USE_EDGES) {
                            const frillData = TileFrillSystem.getFrillOverlays(this.tileGrid, col, row);
                            
                            if (frillData.hasFrill) {
                                // Render each frill overlay
                                for (const frillPath of frillData.frillPaths) {
                                    const sprite = this.config.tileEdgeSprites[frillPath];
                                    if (sprite) {
                                        graphics.image(sprite, x, y, TILE_SIZE, TILE_SIZE);
                                    }
                                }
                            }
                        }
                    } else {
                        // Draw colored rectangle (fallback)
                        const color = this.config.tileColors[tile.type] || '#FFFFFF';
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
        };
    }
    
    /**
     * Create a grid overlay renderable with camera culling.
     * 
     * @param camera - Camera instance for view frustum culling
     * @returns Render function for grid lines
     */
    createGridOverlayRenderable(camera: Camera | null): (graphics: any) => void {
        const grid = this.tileGrid.getGrid();
        
        return (graphics: any) => {
            if (!camera) {
                return;
            }
            
            // Camera culling for grid lines
            const margin = TILE_SIZE * 2;
            const minX = camera.x - (this.config.canvasWidth / 2) - margin;
            const maxX = camera.x + (this.config.canvasWidth / 2) + margin;
            const minY = camera.y - (this.config.canvasHeight / 2) - margin;
            const maxY = camera.y + (this.config.canvasHeight / 2) + margin;
            
            const startCol = Math.max(0, Math.floor(minX / TILE_SIZE));
            const endCol = Math.min(grid[0].length, Math.floor(maxX / TILE_SIZE) + 1);
            const startRow = Math.max(0, Math.floor(minY / TILE_SIZE));
            const endRow = Math.min(grid.length, Math.floor(maxY / TILE_SIZE) + 1);
            
            graphics.stroke(TILE_CONFIG.GRID_OVERLAY.COLOR);
            graphics.strokeWeight(TILE_CONFIG.GRID_OVERLAY.LINE_WEIGHT);
            (graphics as any).drawingContext.globalAlpha = TILE_CONFIG.GRID_OVERLAY.ALPHA / 255;
            
            // Draw vertical lines (only visible ones)
            for (let col = startCol; col <= endCol; col++) {
                const x = col * TILE_SIZE;
                const y1 = startRow * TILE_SIZE;
                const y2 = endRow * TILE_SIZE;
                graphics.line(x, y1, x, y2);
            }
            
            // Draw horizontal lines (only visible ones)
            for (let row = startRow; row <= endRow; row++) {
                const y = row * TILE_SIZE;
                const x1 = startCol * TILE_SIZE;
                const x2 = endCol * TILE_SIZE;
                graphics.line(x1, y, x2, y);
            }
            
            // Reset alpha
            (graphics as any).drawingContext.globalAlpha = 1.0;
        };
    }
    
    /**
     * Force a tile layer rerender by marking it dirty via EventBus.
     * This triggers the Renderer to redraw the ground layer on the next frame.
     * 
     * Use cases:
     * - After changing tile types dynamically
     * - After toggling sprite settings (USE_SPRITES, USE_EDGES)
     * - After loading new tile sprites
     * - When you want to refresh the display without waiting for camera movement
     * 
     * @param includeDecorations - Also mark ground decorations layer as dirty (default: true)
     */
    static forceRerender(includeDecorations: boolean = true): void {
        EventBus.emit(GameEvents.LAYER_DIRTY, RenderLayer.GROUND);
        if (includeDecorations) {
            EventBus.emit(GameEvents.LAYER_DIRTY, RenderLayer.GROUND_DECORATIONS);
        }
    }
}
