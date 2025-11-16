/**
 * PathfindingComponent - Path Following and Navigation (MODEL)
 * Reuses existing A* Pathfinder for optimal path calculation
 * Handles movement along paths using lerp for smooth transitions
 */

import { BaseComponent } from './BaseComponent';
import { EventBus } from '../../utils/eventBus';
import { Pathfinder, PathNode } from '../../world/Pathfinder';
import { TileData } from '../../world/TileSystem';

/**
 * PathfindingComponent
 * Uses A* pathfinding to navigate entities through the world
 */
export class PathfindingComponent extends BaseComponent {
    private pathfinder: Pathfinder;
    private currentPath: PathNode[] = [];
    private pathIndex: number = 0;
    private speed: number;              // Tiles per second
    private moving: boolean = false;

    /**
     * Create a new PathfindingComponent
     * @param speed - Movement speed in tiles per second
     */
    constructor(speed: number) {
        super();
        this.pathfinder = new Pathfinder();
        this.speed = speed;
    }

    /**
     * Hook: Initialize movement tracking after attach
     */
    protected onAttached(): void {
        // No initialization needed - GameObject handles movement
    }

    /**
     * Lifecycle: Update movement along path
     */
    update(deltaTime: number): void {
        if (!this.moving || this.currentPath.length === 0) {
            return;
        }

        this.followPath(deltaTime);
    }

    /**
     * Find path to target position
     * @param targetCol - Target grid column
     * @param targetRow - Target grid row
     * @param grid - World grid for pathfinding
     */
    public findPath(targetCol: number, targetRow: number, grid: TileData[][]): void {
        console.log(`[PathfindingComponent] findPath() called with target (${targetCol}, ${targetRow})`);
        
        if (!this.owner) {
            return;
        }

        console.log(`[PathfindingComponent] Owner at (${this.owner.gridX}, ${this.owner.gridY})`);

        // Check if already at target
        if (this.owner.gridX === targetCol && this.owner.gridY === targetRow) {
            console.log('[PathfindingComponent] Already at target, clearing path');
            this.clearPath();
            return;
        }

        // Validate target is in bounds and walkable
        if (!grid || grid.length === 0 || grid[0].length === 0) {
            EventBus.emit('PATH_FAILED', this.owner.id, 'Invalid grid');
            return;
        }

        const rows = grid.length;
        const cols = grid[0].length;

        if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= cols) {
            EventBus.emit('PATH_FAILED', this.owner.id, 'Out of bounds');
            return;
        }

        if (!grid[targetRow][targetCol].walkable) {
            EventBus.emit('PATH_FAILED', this.owner.id, 'Target not walkable');
            return;
        }

        // Use A* pathfinder
        const path = this.pathfinder.findPath(
            this.owner.gridX,
            this.owner.gridY,
            targetCol,
            targetRow,
            grid
        );

        if (!path || path.length === 0) {
            this.clearPath();
            EventBus.emit('PATH_FAILED', this.owner.id, 'No path found');
            return;
        }

        console.log(`[PathfindingComponent] Path found with ${path.length} nodes:`);
        console.log(`  First node: (${path[0].col}, ${path[0].row})`);
        console.log(`  Last node: (${path[path.length - 1].col}, ${path[path.length - 1].row})`);

        // Store path and start following
        this.currentPath = path;
        this.pathIndex = 0;
        this.moving = true;

        // Skip first node if it's our current position
        if (path.length > 0 && path[0].col === this.owner.gridX && path[0].row === this.owner.gridY) {
            this.pathIndex = 1;
        }
        
        if (this.pathIndex >= path.length) {
            // Path only had start node - complete immediately
            this.completePathFollowing();
            return;
        }

        EventBus.emit('PATH_FOUND', this.owner.id, path.length);
    }

    /**
     * Follow the current path
     * Uses GameObject's smooth movement system instead of direct lerp
     * @param deltaTime - Time elapsed in milliseconds
     */
    private followPath(deltaTime: number): void {
        if (!this.owner || this.currentPath.length === 0) {
            return;
        }

        // Get next waypoint
        if (this.pathIndex >= this.currentPath.length) {
            this.completePathFollowing();
            return;
        }

        const nextNode = this.currentPath[this.pathIndex];
        
        // Use GameObject's moveTowardTile - this handles smooth movement
        const reached = this.owner.moveTowardTile(nextNode.col, nextNode.row, deltaTime);
        
        if (reached) {
            // Advance to next waypoint
            this.pathIndex++;
            
            // Check if path complete
            if (this.pathIndex >= this.currentPath.length) {
                this.completePathFollowing();
            }
        }
    }

    /**
     * Complete path following and cleanup
     */
    private completePathFollowing(): void {
        if (!this.owner) {
            return;
        }

        // Snap to final position
        const finalNode = this.currentPath[this.currentPath.length - 1];
        this.owner.moveTo(finalNode.col, finalNode.row);

        // Clear path state
        this.clearPath();

        // Emit completion event
        EventBus.emit('PATH_COMPLETE', this.owner.id);
    }

    /**
     * Check if path is still valid (tiles didn't become unwalkable)
     * @param grid - Current world grid
     */
    public checkPathValid(grid: TileData[][]): boolean {
        if (!this.hasPath()) {
            return true;
        }

        // Check if any node in path became unwalkable
        for (const node of this.currentPath) {
            if (node.row < 0 || node.row >= grid.length) {
                return false;
            }
            if (node.col < 0 || node.col >= grid[0].length) {
                return false;
            }
            if (!grid[node.row][node.col].walkable) {
                EventBus.emit('PATH_BLOCKED', this.owner.id);
                this.clearPath();
                return false;
            }
        }

        return true;
    }

    /**
     * Clear current path and stop movement
     */
    public clearPath(): void {
        this.currentPath = [];
        this.pathIndex = 0;
        this.moving = false;
    }

    /**
     * Check if component has an active path
     */
    public hasPath(): boolean {
        return this.currentPath.length > 0;
    }

    /**
     * Check if entity is currently moving
     */
    public isMoving(): boolean {
        return this.moving;
    }

    /**
     * Get next node in path
     */
    public getNextNode(): PathNode | null {
        if (!this.hasPath() || this.pathIndex >= this.currentPath.length) {
            return null;
        }
        return this.currentPath[this.pathIndex];
    }

    /**
     * Get movement speed
     */
    public getSpeed(): number {
        return this.speed;
    }

    /**
     * Set movement speed
     * @param speed - New speed in tiles per second
     */
    public setSpeed(speed: number): void {
        this.speed = speed;
    }

    /**
     * Enable/disable diagonal movement
     * @param allow - Whether to allow diagonal paths
     */
    public setAllowDiagonal(allow: boolean): void {
        this.pathfinder.setAllowDiagonal(allow);
    }
}
