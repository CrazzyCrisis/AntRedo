import { BaseManager } from './BaseManager';
/**
 * PathfindingManager - Pathfinding System Manager (CONTROLLER)
 * Singleton manager wrapping the Pathfinder class
 * Manages shared walkable grid and coordinates pathfinding requests
 */

import { Pathfinder, PathNode, PathResult } from '../world/Pathfinder';
import { TileData } from '../world/TileSystem';


/**
 * PathfindingManager manages pathfinding for all entities
 * Wraps the existing Pathfinder class with grid management
 */
export class PathfindingManager extends BaseManager {
    private static instance: PathfindingManager;
    private pathfinder: Pathfinder;
    private grid: TileData[][] | null = null;
    private width: number = 0;
    private height: number = 0;

    private constructor() {
        super(); // Initialize BaseManager
        this.pathfinder = new Pathfinder();
        this.pathfinder.setAllowDiagonal(true); // Allow diagonal movement by default
        this.setupEventListeners();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): PathfindingManager {
        if (!PathfindingManager.instance) {
            PathfindingManager.instance = new PathfindingManager();
        }
        return PathfindingManager.instance;
    }

    /**
     * Setup EventBus listeners
     */
    private setupEventListeners(): void {
        // Listen for building placement to block tiles
        this.subscribe('BUILDING_PATHFINDING_BLOCK', (_buildingId: string, tiles: Array<{ gridX: number; gridY: number }>) => {
            this.markBlocked(tiles);
        });

        // Listen for building destruction to unblock tiles
        this.subscribe('BUILDING_PATHFINDING_UNBLOCK', (_buildingId: string, tiles: Array<{ gridX: number; gridY: number }>) => {
            this.markWalkable(tiles);
        });

        // Listen for world generation to initialize grid
        this.subscribe('WORLD_GENERATED', (tileGrid: TileData[][]) => {
            this.initializeFromTileGrid(tileGrid);
        });
    }

    /**
     * Initialize pathfinding grid from dimensions
     * @param width - Grid width in tiles
     * @param height - Grid height in tiles
     * @param defaultWalkable - Default walkable state
     */
    public initializeGrid(width: number, height: number, defaultWalkable: boolean = true): void {
        this.width = width;
        this.height = height;

        // Create grid with default TileData
        this.grid = [];
        for (let row = 0; row < height; row++) {
            const rowData: TileData[] = [];
            for (let col = 0; col < width; col++) {
                rowData.push({
                    type: 0, // Default to GRASS
                    walkable: defaultWalkable,
                    movementCost: 1.0,
                    spriteIndex: 0
                });
            }
            this.grid.push(rowData);
        }

        this.emit('PATHFINDING_GRID_INITIALIZED', width, height);
    }

    /**
     * Initialize from existing TileGrid (from world generation)
     * @param tileGrid - TileData grid from TileSystem
     */
    public initializeFromTileGrid(tileGrid: TileData[][]): void {
        this.grid = tileGrid;
        this.height = tileGrid.length;
        this.width = tileGrid.length > 0 ? tileGrid[0].length : 0;

        this.emit('PATHFINDING_GRID_INITIALIZED', this.width, this.height);
    }

    /**
     * Update grid tile walkability
     * @param col - Grid column
     * @param row - Grid row
     * @param walkable - Walkable state
     */
    public updateGrid(col: number, row: number, walkable: boolean): void {
        if (!this.grid) return;
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return;

        this.grid[row][col].walkable = walkable;
    }

    /**
     * Mark multiple tiles as blocked
     * @param tiles - Array of tile positions
     */
    public markBlocked(tiles: Array<{ gridX: number; gridY: number }>): void {
        for (const tile of tiles) {
            this.updateGrid(tile.gridX, tile.gridY, false);
        }
        this.emit('PATHFINDING_TILES_BLOCKED', tiles.length);
    }

    /**
     * Mark multiple tiles as walkable
     * @param tiles - Array of tile positions
     */
    public markWalkable(tiles: Array<{ gridX: number; gridY: number }>): void {
        for (const tile of tiles) {
            this.updateGrid(tile.gridX, tile.gridY, true);
        }
        this.emit('PATHFINDING_TILES_UNBLOCKED', tiles.length);
    }

    /**
     * Find path from start to goal
     * @param startCol - Start column
     * @param startRow - Start row
     * @param goalCol - Goal column
     * @param goalRow - Goal row
     * @returns Array of PathNodes or null if no path
     */
    public findPath(
        startCol: number,
        startRow: number,
        goalCol: number,
        goalRow: number
    ): PathNode[] | null {
        if (!this.grid) {
            console.warn('PathfindingManager: Grid not initialized');
            return null;
        }

        return this.pathfinder.findPath(startCol, startRow, goalCol, goalRow, this.grid);
    }

    /**
     * Find path with cost information
     * @param startCol - Start column
     * @param startRow - Start row
     * @param goalCol - Goal column
     * @param goalRow - Goal row
     * @returns PathResult with path and cost, or null if no path
     */
    public findPathWithCost(
        startCol: number,
        startRow: number,
        goalCol: number,
        goalRow: number
    ): PathResult | null {
        if (!this.grid) {
            console.warn('PathfindingManager: Grid not initialized');
            return null;
        }

        return this.pathfinder.findPathWithCost(startCol, startRow, goalCol, goalRow, this.grid);
    }

    /**
     * Set whether diagonal movement is allowed
     * @param allow - Allow diagonal movement
     */
    public setAllowDiagonal(allow: boolean): void {
        this.pathfinder.setAllowDiagonal(allow);
    }

    /**
     * Check if a tile is walkable
     * @param col - Grid column
     * @param row - Grid row
     * @returns True if walkable
     */
    public isWalkable(col: number, row: number): boolean {
        if (!this.grid) return false;
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return false;

        return this.grid[row][col].walkable;
    }

    /**
     * Get grid dimensions
     * @returns {width, height}
     */
    public getGridDimensions(): { width: number; height: number } {
        return { width: this.width, height: this.height };
    }

    /**
     * Get the grid (for external systems that need direct access)
     * @returns TileData grid or null
     */
    public getGrid(): TileData[][] | null {
        return this.grid;
    }

    /**
     * Clear grid (for testing)
     */
    public clear(): void {
        this.grid = null;
        this.width = 0;
        this.height = 0;
    }

    /**
     * Cleanup - unsubscribe from all events
     */
    public cleanup(): void {
        this.cleanupSubscriptions();
        this.clear();
    }

    /**
     * Reinitialize EventBus listeners (for testing after EventBus.clear())
     */
    public reinitializeListeners(): void {
        this.setupEventListeners();
    }
}
