/**
 * Tile Edge System - Frill overlay system for smooth tile transitions
 * Adds decorative edge overlays on top of base tiles instead of replacing them
 */

import { TileType } from './TileSystem';
import { TileGrid } from './TileGrid';

/**
 * Edge frill types for overlay rendering
 * These are semi-transparent overlays that blend tile edges together
 */
export enum EdgeFrillType {
    NONE = '',          // No frill needed
    FULL = 'full',      // Fully surrounded by same type
    BASE = '',          // Base tile (no suffix) - partial neighbors
    TOP = 't',          // Top edge frill
    BOTTOM = 'b',       // Bottom edge frill
    LEFT = 'l',         // Left edge frill
    RIGHT = 'r',        // Right edge frill
    TOP_LEFT = 'tl',    // Top-left corner frill
    TOP_RIGHT = 'tr',   // Top-right corner frill
    BOTTOM_LEFT = 'bl', // Bottom-left corner frill
    BOTTOM_RIGHT = 'br' // Bottom-right corner frill
}

/**
 * Tile types that support frill overlays
 * Based on available folders in tileEdges_16x16
 */
export const FRILL_SUPPORTED_TILES = new Set<TileType>([
    TileType.GRASS,
    TileType.DIRT,
    TileType.MOSS,
    TileType.SAND,
    TileType.STONE,
    TileType.WATER
]);

/**
 * Material Override Hierarchy from tileSmooth.js
 * Higher weight = higher priority = renders on top of lower priority tiles
 * When two tiles meet, the higher priority one's frill extends onto the lower priority one
 */
export const MATERIAL_PRIORITY: Partial<Record<TileType, number>> = {
    [TileType.WATER]: 50,  // Highest - water spreads everywhere
    [TileType.SAND]: 44,
    [TileType.MOSS]: 37,
    [TileType.GRASS]: 25,
    [TileType.DIRT]: 12,
    [TileType.STONE]: 6    // Lowest
};

/**
 * Gets priority for a tile type, returns -1 if not in hierarchy
 */
function getTilePriority(tileType: TileType): number {
    return MATERIAL_PRIORITY[tileType] ?? -1;
}

/**
 * Base path for frill sprites (edge overlays)
 */
export const FRILL_SPRITE_BASE_PATH = 'assets/images/tileEdges_16x16/';

/**
 * Maps TileType to folder name in tileEdges_16x16
 */
export const TILE_FRILL_FOLDERS: Partial<Record<TileType, string>> = {
    [TileType.GRASS]: 'grass',
    [TileType.DIRT]: 'dirt',
    [TileType.MOSS]: 'moss',
    [TileType.SAND]: 'sand',
    [TileType.STONE]: 'stone',
    [TileType.WATER]: 'water'
};

/**
 * Frill data for a single tile - can have multiple frills overlaid
 */
export interface TileFrillData {
    hasFrill: boolean;
    frillPaths: string[];  // Array of frill sprite paths to overlay
}

/**
 * Tile Frill System - Manages decorative edge overlays
 * 
 * Key Difference from Edge System:
 * - Edge System: Replaces entire tile sprite with edge variant
 * - Frill System: Overlays transparent frills ON TOP of base tile
 * 
 * How it works:
 * 1. Render base tile sprite (grass.png, dirt.png, etc.)
 * 2. Analyze neighbors to determine which edges need frills
 * 3. Overlay semi-transparent frill sprites on top
 * 4. Multiple frills can stack (e.g., grass frill + dirt frill on border)
 */
export class TileFrillSystem {
    /**
     * Gets all frill overlays needed for a tile
     * 
     * CRITICAL LOGIC FROM tileSmooth.js:
     * - Uses priority hierarchy: higher priority tiles paint over lower priority ones
     * - Check each neighbor: if neighbor has HIGHER priority, render THEIR frill onto us
     * 
     * Example: Grass tile (priority 25) next to Dirt tile (priority 12)
     * - When rendering DIRT tile, we check all its neighbors
     * - We find GRASS neighbor with higher priority (25 > 12)
     * - We render the GRASS frill that extends INTO the dirt
     * 
     * @param tileGrid The world tile grid
     * @param col Column position of tile being rendered
     * @param row Row position of tile being rendered
     * @returns Array of frill sprite paths to render on top of this tile
     */
    public static getFrillOverlays(tileGrid: TileGrid, col: number, row: number): TileFrillData {
        const tile = tileGrid.getTileDataAt(col, row);
        if (!tile) return { hasFrill: false, frillPaths: [] };

        const frillPaths: string[] = [];
        const targetPriority = getTilePriority(tile.type);

        // Only check for frills if this tile has a priority (is in the hierarchy)
        if (targetPriority === -1) {
            return { hasFrill: false, frillPaths: [] };
        }

        // Check all 8 neighbors (Moore neighborhood - cardinals + corners)
        const neighbors = this.analyzeNeighborTypes(tileGrid, col, row);
        
        // For each neighbor with HIGHER priority (tempOverlap < targetOverlap in original),
        // render THEIR frill extending into US
        
        // CARDINAL DIRECTIONS (4 edges)
        
        // Top neighbor has higher priority → they render their BOTTOM frill onto us
        if (neighbors.top !== null && neighbors.top !== tile.type && FRILL_SUPPORTED_TILES.has(neighbors.top)) {
            const neighborPriority = getTilePriority(neighbors.top);
            if (neighborPriority !== -1 && neighborPriority > targetPriority) {
                const frillPath = this.buildFrillFilename(neighbors.top, EdgeFrillType.BOTTOM);
                if (frillPath) frillPaths.push(frillPath);
            }
        }
        
        // Bottom neighbor has higher priority → they render their TOP frill onto us
        if (neighbors.bottom !== null && neighbors.bottom !== tile.type && FRILL_SUPPORTED_TILES.has(neighbors.bottom)) {
            const neighborPriority = getTilePriority(neighbors.bottom);
            if (neighborPriority !== -1 && neighborPriority > targetPriority) {
                const frillPath = this.buildFrillFilename(neighbors.bottom, EdgeFrillType.TOP);
                if (frillPath) frillPaths.push(frillPath);
            }
        }
        
        // Left neighbor has higher priority → they render their RIGHT frill onto us
        if (neighbors.left !== null && neighbors.left !== tile.type && FRILL_SUPPORTED_TILES.has(neighbors.left)) {
            const neighborPriority = getTilePriority(neighbors.left);
            if (neighborPriority !== -1 && neighborPriority > targetPriority) {
                const frillPath = this.buildFrillFilename(neighbors.left, EdgeFrillType.RIGHT);
                if (frillPath) frillPaths.push(frillPath);
            }
        }
        
        // Right neighbor has higher priority → they render their LEFT frill onto us
        if (neighbors.right !== null && neighbors.right !== tile.type && FRILL_SUPPORTED_TILES.has(neighbors.right)) {
            const neighborPriority = getTilePriority(neighbors.right);
            if (neighborPriority !== -1 && neighborPriority > targetPriority) {
                const frillPath = this.buildFrillFilename(neighbors.right, EdgeFrillType.LEFT);
                if (frillPath) frillPaths.push(frillPath);
            }
        }
        
        // DIAGONAL DIRECTIONS (4 corners)
        
        // Top-left neighbor has higher priority → they render their BOTTOM_RIGHT frill onto us
        if (neighbors.topLeft !== null && neighbors.topLeft !== tile.type && FRILL_SUPPORTED_TILES.has(neighbors.topLeft)) {
            const neighborPriority = getTilePriority(neighbors.topLeft);
            if (neighborPriority !== -1 && neighborPriority > targetPriority) {
                const frillPath = this.buildFrillFilename(neighbors.topLeft, EdgeFrillType.BOTTOM_RIGHT);
                if (frillPath) frillPaths.push(frillPath);
            }
        }
        
        // Top-right neighbor has higher priority → they render their BOTTOM_LEFT frill onto us
        if (neighbors.topRight !== null && neighbors.topRight !== tile.type && FRILL_SUPPORTED_TILES.has(neighbors.topRight)) {
            const neighborPriority = getTilePriority(neighbors.topRight);
            if (neighborPriority !== -1 && neighborPriority > targetPriority) {
                const frillPath = this.buildFrillFilename(neighbors.topRight, EdgeFrillType.BOTTOM_LEFT);
                if (frillPath) frillPaths.push(frillPath);
            }
        }
        
        // Bottom-left neighbor has higher priority → they render their TOP_RIGHT frill onto us
        if (neighbors.bottomLeft !== null && neighbors.bottomLeft !== tile.type && FRILL_SUPPORTED_TILES.has(neighbors.bottomLeft)) {
            const neighborPriority = getTilePriority(neighbors.bottomLeft);
            if (neighborPriority !== -1 && neighborPriority > targetPriority) {
                const frillPath = this.buildFrillFilename(neighbors.bottomLeft, EdgeFrillType.TOP_RIGHT);
                if (frillPath) frillPaths.push(frillPath);
            }
        }
        
        // Bottom-right neighbor has higher priority → they render their TOP_LEFT frill onto us
        if (neighbors.bottomRight !== null && neighbors.bottomRight !== tile.type && FRILL_SUPPORTED_TILES.has(neighbors.bottomRight)) {
            const neighborPriority = getTilePriority(neighbors.bottomRight);
            if (neighborPriority !== -1 && neighborPriority > targetPriority) {
                const frillPath = this.buildFrillFilename(neighbors.bottomRight, EdgeFrillType.TOP_LEFT);
                if (frillPath) frillPaths.push(frillPath);
            }
        }

        return {
            hasFrill: frillPaths.length > 0,
            frillPaths
        };
    }

    /**
     * Analyzes all 8 neighbors and returns their tile types
     */
    private static analyzeNeighborTypes(
        tileGrid: TileGrid,
        col: number,
        row: number
    ): {
        top: TileType | null;
        bottom: TileType | null;
        left: TileType | null;
        right: TileType | null;
        topLeft: TileType | null;
        topRight: TileType | null;
        bottomLeft: TileType | null;
        bottomRight: TileType | null;
    } {
        const getType = (c: number, r: number): TileType | null => {
            const neighbor = tileGrid.getTileDataAt(c, r);
            return neighbor ? neighbor.type : null;
        };

        return {
            top: getType(col, row - 1),
            bottom: getType(col, row + 1),
            left: getType(col - 1, row),
            right: getType(col + 1, row),
            topLeft: getType(col - 1, row - 1),
            topRight: getType(col + 1, row - 1),
            bottomLeft: getType(col - 1, row + 1),
            bottomRight: getType(col + 1, row + 1)
        };
    }

    /**
     * Builds the frill sprite filename for a tile type and frill type
     */
    private static buildFrillFilename(tileType: TileType, frillType: EdgeFrillType | null): string | null {
        if (frillType === null) return null;
        
        const folder = TILE_FRILL_FOLDERS[tileType];
        if (!folder) return null;

        const basePath = `${FRILL_SPRITE_BASE_PATH}${folder}/`;
        
        if (frillType === EdgeFrillType.FULL) {
            return `${basePath}${folder}_full.png`;
        }
        
        return `${basePath}${folder}_${frillType}.png`;
    }

    /**
     * Checks if a tile type supports frill overlays
     */
    public static supportsFrills(tileType: TileType): boolean {
        return FRILL_SUPPORTED_TILES.has(tileType);
    }

    /**
     * Preloads all frill sprites for a given tile type
     * Returns array of sprite paths to load
     */
    public static getFrillSpritePaths(tileType: TileType): string[] {
        const folder = TILE_FRILL_FOLDERS[tileType];
        if (!folder) return [];

        const basePath = `${FRILL_SPRITE_BASE_PATH}${folder}/`;
        const frillTypes = ['', 't', 'b', 'l', 'r', 'tl', 'tr', 'bl', 'br', 'full'];
        
        return frillTypes
            .map(suffix => {
                if (suffix === '') {
                    return `${basePath}${folder}.png`;
                }
                return `${basePath}${folder}_${suffix}.png`;
            })
            .filter(path => path !== null) as string[];
    }
}
