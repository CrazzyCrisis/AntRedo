/**
 * Tile System - Core tile types, properties, and Tile class
 * Provides foundation for procedural generation and A* pathfinding
 */

import { TILE_CONFIG } from '../config/tileConfig';

/**
 * Enum defining all available tile types
 * Maps to sprites in assets/images/16x16 Tiles/
 */
export enum TileType {
    GRASS = 0,
    DIRT = 1,
    STONE = 2,
    SAND = 3,
    SAND_DARK = 4,
    WATER = 5,
    FARMLAND = 6,
    MOSS = 7,
    PEBBLE_1 = 8,
    PEBBLE_2 = 9,
    PEBBLE_3 = 10,
    CAVE_FLOOR = 11,
    CAVE_WALL = 12,
    CAVE_DIRT = 13,
    CAVE_DARK = 14,
    CAVE_WATER = 15,
    ANTHILL = 16
}

/**
 * Tile properties for gameplay and pathfinding
 */
export interface TileProperties {
    walkable: boolean;      // Can entities walk on this tile?
    movementCost: number;   // Pathfinding weight (1.0 = normal, higher = slower)
    spriteIndex: number;    // Index for sprite sheet or asset mapping
}

/**
 * Tile data for storage in world grid
 * Lightweight format for 2D arrays
 */
export interface TileData {
    type: TileType;
    walkable: boolean;
    movementCost: number;
    spriteIndex: number;
}

/**
 * Tile properties lookup table
 * Defines gameplay characteristics for each tile type
 * Values are sourced from centralized tileMovementConfig.ts
 * Note: Config access is delayed to avoid circular dependencies
 */
export const TILE_PROPERTIES: Record<TileType, TileProperties> = {
    [TileType.GRASS]: { walkable: true, movementCost: 1.0, spriteIndex: 0 },
    [TileType.DIRT]: { walkable: true, movementCost: 1.1, spriteIndex: 1 },
    [TileType.STONE]: { walkable: true, movementCost: 5.0, spriteIndex: 2 },
    [TileType.SAND]: { walkable: true, movementCost: 1.5, spriteIndex: 3 },
    [TileType.SAND_DARK]: { walkable: true, movementCost: 1.5, spriteIndex: 4 },
    [TileType.WATER]: { walkable: false, movementCost: 100.0, spriteIndex: 5 },
    [TileType.FARMLAND]: { walkable: true, movementCost: 1.2, spriteIndex: 6 },
    [TileType.MOSS]: { walkable: true, movementCost: 1.1, spriteIndex: 7 },
    [TileType.PEBBLE_1]: { walkable: true, movementCost: 1.0, spriteIndex: 8 },
    [TileType.PEBBLE_2]: { walkable: true, movementCost: 1.0, spriteIndex: 9 },
    [TileType.PEBBLE_3]: { walkable: true, movementCost: 1.0, spriteIndex: 10 },
    [TileType.CAVE_FLOOR]: { walkable: true, movementCost: 1.0, spriteIndex: 11 },
    [TileType.CAVE_WALL]: { walkable: false, movementCost: Infinity, spriteIndex: 12 },
    [TileType.CAVE_DIRT]: { walkable: true, movementCost: 1.2, spriteIndex: 13 },
    [TileType.CAVE_DARK]: { walkable: false, movementCost: Infinity, spriteIndex: 14 },
    [TileType.CAVE_WATER]: { walkable: false, movementCost: 100.0, spriteIndex: 15 },
    [TileType.ANTHILL]: { walkable: false, movementCost: Infinity, spriteIndex: 16 }
};

/**
 * Tile size constant (from config)
 */
export const TILE_SIZE = TILE_CONFIG.SIZE;

/**
 * Tile class - Represents a single tile in the world grid
 * Contains position, type, and provides utility methods for pathfinding
 */
export class Tile {
    public readonly col: number;
    public readonly row: number;
    public readonly type: TileType;
    public readonly walkable: boolean;
    public readonly movementCost: number;
    public readonly spriteIndex: number;

    constructor(col: number, row: number, type: TileType) {
        this.col = col;
        this.row = row;
        this.type = type;

        // Load properties from lookup table
        const props = TILE_PROPERTIES[type];
        this.walkable = props.walkable;
        this.movementCost = props.movementCost;
        this.spriteIndex = props.spriteIndex;
    }

    /**
     * Get world position (top-left corner of tile)
     */
    getWorldPosition(): { x: number; y: number } {
        return {
            x: this.col * TILE_SIZE,
            y: this.row * TILE_SIZE
        };
    }

    /**
     * Get world center position (center of tile)
     */
    getWorldCenter(): { x: number; y: number } {
        return {
            x: this.col * TILE_SIZE + TILE_SIZE / 2,
            y: this.row * TILE_SIZE + TILE_SIZE / 2
        };
    }

    /**
     * Get 4-directional neighbor positions (up, down, left, right)
     */
    getNeighbor4Positions(): Array<{ col: number; row: number }> {
        return [
            { col: this.col, row: this.row - 1 },     // Up
            { col: this.col, row: this.row + 1 },     // Down
            { col: this.col - 1, row: this.row },     // Left
            { col: this.col + 1, row: this.row }      // Right
        ];
    }

    /**
     * Get 8-directional neighbor positions (including diagonals)
     */
    getNeighbor8Positions(): Array<{ col: number; row: number }> {
        return [
            { col: this.col, row: this.row - 1 },     // Up
            { col: this.col, row: this.row + 1 },     // Down
            { col: this.col - 1, row: this.row },     // Left
            { col: this.col + 1, row: this.row },     // Right
            { col: this.col - 1, row: this.row - 1 }, // Up-Left
            { col: this.col + 1, row: this.row - 1 }, // Up-Right
            { col: this.col - 1, row: this.row + 1 }, // Down-Left
            { col: this.col + 1, row: this.row + 1 }  // Down-Right
        ];
    }

    /**
     * Calculate Manhattan distance to another grid position
     */
    manhattanDistanceTo(col: number, row: number): number {
        return Math.abs(this.col - col) + Math.abs(this.row - row);
    }

    /**
     * Calculate Euclidean distance to another grid position
     */
    euclideanDistanceTo(col: number, row: number): number {
        const dx = this.col - col;
        const dy = this.row - row;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if tile is a specific type
     */
    isType(type: TileType): boolean {
        return this.type === type;
    }

    /**
     * Check if tile is one of multiple types
     */
    isOneOf(types: TileType[]): boolean {
        return types.includes(this.type);
    }

    /**
     * Convert to TileData format for storage
     */
    toData(): TileData {
        return {
            type: this.type,
            walkable: this.walkable,
            movementCost: this.movementCost,
            spriteIndex: this.spriteIndex
        };
    }

    /**
     * Create Tile from TileData
     */
    static fromData(col: number, row: number, data: TileData): Tile {
        const tile = new Tile(col, row, data.type);
        return tile;
    }
}
