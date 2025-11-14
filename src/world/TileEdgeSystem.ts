/**
 * Tile Edge System - Automatic edge/corner sprite selection
 * Analyzes neighboring tiles and selects appropriate edge sprites
 */

import { TileType } from './TileSystem';
import { TileGrid } from './TileGrid';

/**
 * Edge types for autotiling
 * Matches the naming convention in tileEdges_16x16 folders
 */
export enum EdgeType {
    FULL = 'full',      // Surrounded by same type
    BASE = '',          // Base tile (no suffix)
    TOP = 't',          // Top edge
    BOTTOM = 'b',       // Bottom edge
    LEFT = 'l',         // Left edge
    RIGHT = 'r',        // Right edge
    TOP_LEFT = 'tl',    // Top-left corner
    TOP_RIGHT = 'tr',   // Top-right corner
    BOTTOM_LEFT = 'bl', // Bottom-left corner
    BOTTOM_RIGHT = 'br' // Bottom-right corner
}

/**
 * Tile types that support edge sprites
 * Based on available folders in tileEdges_16x16
 */
export const EDGE_SUPPORTED_TILES = new Set<TileType>([
    TileType.GRASS,
    TileType.DIRT,
    TileType.MOSS,
    TileType.SAND,
    TileType.STONE,
    TileType.WATER
]);

/**
 * Base path for edge sprites
 */
export const EDGE_SPRITE_BASE_PATH = 'assets/images/tileEdges_16x16/';

/**
 * Maps TileType to folder name in tileEdges_16x16
 */
export const TILE_EDGE_FOLDERS: Partial<Record<TileType, string>> = {
    [TileType.GRASS]: 'grass',
    [TileType.DIRT]: 'dirt',
    [TileType.MOSS]: 'moss',
    [TileType.SAND]: 'sand',
    [TileType.STONE]: 'stone',
    [TileType.WATER]: 'water'
};

/**
 * Neighbor analysis result for edge detection
 */
interface NeighborAnalysis {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    topLeft: boolean;
    topRight: boolean;
    bottomLeft: boolean;
    bottomRight: boolean;
}

/**
 * Analyzes neighbors and determines which edge sprite to use
 */
export class TileEdgeSystem {
    /**
     * Gets the appropriate edge sprite filename for a tile
     * @param tileGrid The world tile grid
     * @param col Column position
     * @param row Row position
     * @returns Edge sprite filename (e.g., 'grass_tl.png') or null if no edges
     */
    public static getEdgeSprite(tileGrid: TileGrid, col: number, row: number): string | null {
        const tile = tileGrid.getTileDataAt(col, row);
        if (!tile) return null;

        // Check if this tile type supports edges
        if (!EDGE_SUPPORTED_TILES.has(tile.type)) {
            return null;
        }

        const folder = TILE_EDGE_FOLDERS[tile.type];
        if (!folder) return null;

        // Analyze neighbors
        const neighbors = this.analyzeNeighbors(tileGrid, col, row, tile.type);
        
        // Determine edge type
        const edgeType = this.determineEdgeType(neighbors);
        
        // Build filename
        return this.buildEdgeFilename(folder, edgeType);
    }

    /**
     * Analyzes all 8 neighbors to determine which are the same tile type
     */
    private static analyzeNeighbors(
        tileGrid: TileGrid,
        col: number,
        row: number,
        tileType: TileType
    ): NeighborAnalysis {
        const isSameType = (c: number, r: number): boolean => {
            const neighbor = tileGrid.getTileDataAt(c, r);
            return neighbor !== null && neighbor.type === tileType;
        };

        return {
            top: isSameType(col, row - 1),
            bottom: isSameType(col, row + 1),
            left: isSameType(col - 1, row),
            right: isSameType(col + 1, row),
            topLeft: isSameType(col - 1, row - 1),
            topRight: isSameType(col + 1, row - 1),
            bottomLeft: isSameType(col - 1, row + 1),
            bottomRight: isSameType(col + 1, row + 1)
        };
    }

    /**
     * Determines the edge type based on neighbor analysis
     * Uses bitmasking-style logic for complex edge detection
     */
    private static determineEdgeType(neighbors: NeighborAnalysis): EdgeType {
        const { top, bottom, left, right, topLeft, topRight, bottomLeft, bottomRight } = neighbors;

        // All neighbors are same type - fully surrounded
        if (top && bottom && left && right && topLeft && topRight && bottomLeft && bottomRight) {
            return EdgeType.FULL;
        }

        // Corner cases (corners take precedence over edges)
        if (!top && !left) return EdgeType.TOP_LEFT;
        if (!top && !right) return EdgeType.TOP_RIGHT;
        if (!bottom && !left) return EdgeType.BOTTOM_LEFT;
        if (!bottom && !right) return EdgeType.BOTTOM_RIGHT;

        // Edge cases
        if (!top) return EdgeType.TOP;
        if (!bottom) return EdgeType.BOTTOM;
        if (!left) return EdgeType.LEFT;
        if (!right) return EdgeType.RIGHT;

        // Default to base tile (has some neighbors but not edge-specific)
        return EdgeType.BASE;
    }

    /**
     * Builds the full edge sprite filename
     */
    private static buildEdgeFilename(folder: string, edgeType: EdgeType): string {
        const basePath = `${EDGE_SPRITE_BASE_PATH}${folder}/`;
        
        if (edgeType === EdgeType.BASE) {
            return `${basePath}${folder}.png`;
        }
        
        if (edgeType === EdgeType.FULL) {
            return `${basePath}${folder}_full.png`;
        }
        
        return `${basePath}${folder}_${edgeType}.png`;
    }

    /**
     * Gets the full edge sprite path for a tile
     * Convenience method that combines folder and filename
     */
    public static getEdgeSpritePath(tileGrid: TileGrid, col: number, row: number): string | null {
        return this.getEdgeSprite(tileGrid, col, row);
    }

    /**
     * Checks if a tile type supports edge sprites
     */
    public static supportsEdges(tileType: TileType): boolean {
        return EDGE_SUPPORTED_TILES.has(tileType);
    }

    /**
     * Preloads all edge sprites for a given tile type
     * Returns array of sprite paths to load
     */
    public static getEdgeSpritePaths(tileType: TileType): string[] {
        const folder = TILE_EDGE_FOLDERS[tileType];
        if (!folder) return [];

        const basePath = `${EDGE_SPRITE_BASE_PATH}${folder}/`;
        const edgeTypes = ['', 't', 'b', 'l', 'r', 'tl', 'tr', 'bl', 'br', 'full'];
        
        return edgeTypes.map(suffix => {
            if (suffix === '') {
                return `${basePath}${folder}.png`;
            }
            return `${basePath}${folder}_${suffix}.png`;
        });
    }
}
