/**
 * TileGrid - Tile Query System
 * Provides efficient tile lookups by world or grid coordinates
 * Integrates with Pathfinder and entity movement systems
 */

import { TileData, TileType, TILE_SIZE } from './TileSystem';

/**
 * TileGrid manages a 2D grid of tiles and provides query methods
 * for entities to check terrain properties
 */
export class TileGrid {
    private grid: TileData[][];
    private width: number;
    private height: number;

    /**
     * Create a new TileGrid
     * @param grid 2D array of TileData [row][col]
     */
    constructor(grid: TileData[][]) {
        this.grid = grid;
        this.height = grid.length;
        this.width = grid.length > 0 ? grid[0].length : 0;
    }

    /**
     * Get grid width in tiles
     */
    getWidth(): number {
        return this.width;
    }

    /**
     * Get grid height in tiles
     */
    getHeight(): number {
        return this.height;
    }

    /**
     * Get tile data at grid coordinates
     * @param col Grid column
     * @param row Grid row
     * @returns TileData or null if out of bounds
     */
    getTileDataAt(col: number, row: number): TileData | null {
        if (!this.isInBounds(col, row)) {
            return null;
        }
        return this.grid[row][col];
    }

    /**
     * Get tile data at world coordinates
     * @param worldX World X coordinate in pixels
     * @param worldY World Y coordinate in pixels
     * @returns TileData or null if out of bounds
     */
    getTileAtWorldPos(worldX: number, worldY: number): TileData | null {
        const coords = this.worldToGrid(worldX, worldY);
        if (!coords) {
            return null;
        }
        return this.getTileDataAt(coords.col, coords.row);
    }

    /**
     * Check if grid coordinates are walkable
     * @param col Grid column
     * @param row Grid row
     * @returns true if walkable, false otherwise (including out of bounds)
     */
    isWalkable(col: number, row: number): boolean {
        const tile = this.getTileDataAt(col, row);
        return tile ? tile.walkable : false;
    }

    /**
     * Check if world coordinates are walkable
     * @param worldX World X coordinate in pixels
     * @param worldY World Y coordinate in pixels
     * @returns true if walkable, false otherwise
     */
    isWalkableWorld(worldX: number, worldY: number): boolean {
        const tile = this.getTileAtWorldPos(worldX, worldY);
        return tile ? tile.walkable : false;
    }

    /**
     * Get movement cost at grid coordinates
     * @param col Grid column
     * @param row Grid row
     * @returns Movement cost, or Infinity if non-walkable/out of bounds
     */
    getMovementCost(col: number, row: number): number {
        const tile = this.getTileDataAt(col, row);
        return tile ? tile.movementCost : Infinity;
    }

    /**
     * Get movement cost at world coordinates
     * @param worldX World X coordinate in pixels
     * @param worldY World Y coordinate in pixels
     * @returns Movement cost, or Infinity if non-walkable/out of bounds
     */
    getMovementCostWorld(worldX: number, worldY: number): number {
        const tile = this.getTileAtWorldPos(worldX, worldY);
        return tile ? tile.movementCost : Infinity;
    }

    /**
     * Check if grid coordinates are within bounds
     * @param col Grid column
     * @param row Grid row
     * @returns true if in bounds
     */
    isInBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.width && row >= 0 && row < this.height;
    }

    /**
     * Check if world coordinates are within grid bounds
     * @param worldX World X coordinate in pixels
     * @param worldY World Y coordinate in pixels
     * @returns true if in bounds
     */
    isInWorldBounds(worldX: number, worldY: number): boolean {
        return worldX >= 0 && worldX < this.width * TILE_SIZE &&
               worldY >= 0 && worldY < this.height * TILE_SIZE;
    }

    /**
     * Get tile type at grid coordinates
     * @param col Grid column
     * @param row Grid row
     * @returns TileType or null if out of bounds
     */
    getTileType(col: number, row: number): TileType | null {
        const tile = this.getTileDataAt(col, row);
        return tile ? tile.type : null;
    }

    /**
     * Get tile type at world coordinates
     * @param worldX World X coordinate in pixels
     * @param worldY World Y coordinate in pixels
     * @returns TileType or null if out of bounds
     */
    getTileTypeWorld(worldX: number, worldY: number): TileType | null {
        const tile = this.getTileAtWorldPos(worldX, worldY);
        return tile ? tile.type : null;
    }

    /**
     * Get direct access to underlying grid data
     * Used by Pathfinder and rendering systems
     * @returns 2D array of TileData [row][col]
     */
    getGrid(): TileData[][] {
        return this.grid;
    }

    /**
     * Convert world coordinates to grid coordinates
     * @param worldX World X coordinate in pixels
     * @param worldY World Y coordinate in pixels
     * @returns Grid coordinates or null if out of bounds
     */
    worldToGrid(worldX: number, worldY: number): { col: number; row: number } | null {
        if (!this.isInWorldBounds(worldX, worldY)) {
            return null;
        }
        const col = Math.floor(worldX / TILE_SIZE);
        const row = Math.floor(worldY / TILE_SIZE);
        return { col, row };
    }

    /**
     * Convert grid coordinates to world coordinates (top-left corner of tile)
     * @param col Grid column
     * @param row Grid row
     * @returns World coordinates in pixels
     */
    gridToWorld(col: number, row: number): { x: number; y: number } {
        return {
            x: col * TILE_SIZE,
            y: row * TILE_SIZE
        };
    }
}
