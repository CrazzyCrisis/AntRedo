/**
 * PathfindingComponent - Path Following and Navigation (MODEL)
 * Reuses existing A* Pathfinder for optimal path calculation
 * Handles movement along paths using lerp for smooth transitions
 */

import { IComponent } from './IComponent';
import { GameObject } from '../GameObject';
import { EventBus } from '../../utils/eventBus';
import { Pathfinder, PathNode } from '../../world/Pathfinder';
import { TileData } from '../../world/TileSystem';
import { lerp } from '../../utils/helpers';

/**
 * PathfindingComponent
 * Uses A* pathfinding to navigate entities through the world
 */
export class PathfindingComponent implements IComponent {
    public owner!: GameObject;

    private pathfinder: Pathfinder;
    private currentPath: PathNode[] = [];
    private pathIndex: number = 0;
    private speed: number;              // Tiles per second
    private moving: boolean = false;
    
    // Smooth movement tracking
    private currentProgress: number = 0;  // 0.0 to 1.0 progress to next node
    private fromCol: number = 0;
    private fromRow: number = 0;
    private toCol: number = 0;
    private toRow: number = 0;

    /**
     * Create a new PathfindingComponent
     * @param speed - Movement speed in tiles per second
     */
    constructor(speed: number) {
        this.pathfinder = new Pathfinder();
        this.speed = speed;
    }

    /**
     * Lifecycle: Attach to GameObject
     */
    onAttach(owner: GameObject): void {
        this.owner = owner;
        this.fromCol = owner.gridX;
        this.fromRow = owner.gridY;
    }

    /**
     * Lifecycle: Detach from GameObject
     */
    onDetach(): void {
        this.owner = undefined!;
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
        if (!this.owner) {
            return;
        }

        // Check if already at target
        if (this.owner.gridX === targetCol && this.owner.gridY === targetRow) {
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

        // Store path and start following
        this.currentPath = path;
        this.pathIndex = 0;
        this.currentProgress = 0;
        this.moving = true;

        // Skip first node if it's our current position
        if (path.length > 0 && path[0].col === this.owner.gridX && path[0].row === this.owner.gridY) {
            this.pathIndex = 1;
        }

        // Initialize movement from current position to next node
        this.fromCol = this.owner.gridX;
        this.fromRow = this.owner.gridY;
        
        if (this.pathIndex < path.length) {
            this.toCol = path[this.pathIndex].col;
            this.toRow = path[this.pathIndex].row;
        } else {
            // Path only had start node - complete immediately
            this.completePathFollowing();
            return;
        }

        EventBus.emit('PATH_FOUND', this.owner.id, path.length);
    }

    /**
     * Follow the current path
     * @param deltaTime - Time elapsed in milliseconds
     */
    private followPath(deltaTime: number): void {
        if (!this.owner || this.currentPath.length === 0) {
            return;
        }

        // Calculate movement progress (convert ms to seconds, multiply by tiles/second)
        const progressDelta = (deltaTime / 1000) * this.speed;
        this.currentProgress += progressDelta;

        // Check if reached next node
        if (this.currentProgress >= 1.0) {
            this.currentProgress = 0;
            this.pathIndex++;

            // Check if path complete
            if (this.pathIndex >= this.currentPath.length) {
                this.completePathFollowing();
                return;
            }

            // Move to next segment
            this.fromCol = this.owner.gridX;
            this.fromRow = this.owner.gridY;
            this.toCol = this.currentPath[this.pathIndex].col;
            this.toRow = this.currentPath[this.pathIndex].row;
        }

        // Lerp between current and next node
        const newCol = Math.round(lerp(this.fromCol, this.toCol, this.currentProgress));
        const newRow = Math.round(lerp(this.fromRow, this.toRow, this.currentProgress));

        // Update owner position if changed
        if (newCol !== this.owner.gridX || newRow !== this.owner.gridY) {
            this.owner.moveTo(newCol, newRow);
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
        this.currentProgress = 0;
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
