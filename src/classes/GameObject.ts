/**
 * GameObject - Base Entity Class (MODEL)
 * Pure data class with component system
 * No rendering code - only data and EventBus emissions
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { IComponent } from './components/IComponent';
import { rectIntersect } from '../utils/helpers';
import { TILE_CONFIG } from '../config/tileConfig';

export class GameObject {
    // Unique identifier
    public readonly id: string;
    
    // Entity type (e.g., 'ant', 'queen', 'resource')
    public readonly type: string;
    
    // Grid position
    public gridX: number;
    public gridY: number;
    
    // World position (in pixels)
    public worldX: number = 0;
    public worldY: number = 0;
    
    // Active state
    public isActive: boolean;
    
    // Movement system
    public moveSpeed: number = 3.0; // Tiles per second
    private moveAccumulator: number = 0; // Accumulated movement time
    private targetMoveX: number = 0; // Pending movement direction
    private targetMoveY: number = 0;
    
    // Smooth movement interpolation
    private smoothWorldX: number = 0; // Interpolated world position for rendering
    private smoothWorldY: number = 0;
    private isMoving: boolean = false;
    
    // Smart snapping system
    private isSnapping: boolean = false; // Currently snapping to tile center
    private snapTargetX: number = 0; // Target position for snapping
    private snapTargetY: number = 0;
    private snapSpeed: number = 8.0; // Tiles per second for snapping (faster than normal movement)
    public enableSnapping: boolean = true; // Enable/disable snapping (disable for AI-controlled entities)
    
    // Collision box
    public collisionWidth: number;
    public collisionHeight: number;
    
    // Component system
    private components: Map<string, IComponent>;
    
    // Cleanup event listener (store reference for manual unsubscription)
    private cleanupListener: (() => void) | null = null;

    /**
     * Create a new GameObject
     * @param type - Entity type identifier
     * @param gridX - Grid column position
     * @param gridY - Grid row position
     * @param collisionSize - Size of collision box (default: TILE_CONFIG.SIZE)
     */
    constructor(type: string, gridX: number, gridY: number, collisionSize: number = TILE_CONFIG.SIZE) {
        this.id = this.generateId(type);
        this.type = type;
        this.gridX = gridX;
        this.gridY = gridY;
        this.isActive = true;
        this.collisionWidth = collisionSize;
        this.collisionHeight = collisionSize;
        this.components = new Map();
        
        // Calculate world position from grid position
        this.updateWorldPosition();
        
        // Initialize smooth position to match grid position
        this.smoothWorldX = this.worldX;
        this.smoothWorldY = this.worldY;
        
        // Emit initial smooth position update so sprites position correctly on spawn
        EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, this.id, this.smoothWorldX, this.smoothWorldY);
        
        // Listen for cleanup signal - all entities self-destruct on this event
        this.cleanupListener = EventBus.once(GameEvents.CLEANUP_ALL_ENTITIES, () => {
            if (!this.isActive) return; // Already destroyed by other means
            this.destroy();
        });
    }

    /**
     * Generate unique ID for this entity
     * Format: type_timestamp_random
     */
    private generateId(type: string): string {
        return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update world position based on grid position
     */
    private updateWorldPosition(): void {
        this.worldX = this.gridX * TILE_CONFIG.SIZE;
        this.worldY = this.gridY * TILE_CONFIG.SIZE;
    }

    /**
     * Move toward a target tile (used by PathfindingComponent)
     * Returns true when target tile is reached
     * This method integrates pathfinding with GameObject's smooth movement system
     * @param targetGridX - Target grid X
     * @param targetGridY - Target grid Y
     * @param deltaTime - Time delta in milliseconds
     * @returns True if target reached
     */
    public moveTowardTile(targetGridX: number, targetGridY: number, deltaTime: number): boolean {
        // Already at target
        if (this.gridX === targetGridX && this.gridY === targetGridY) {
            return true;
        }
        
        // Calculate direction toward target
        const dx = Math.sign(targetGridX - this.gridX);
        const dy = Math.sign(targetGridY - this.gridY);
        
        // Request movement in that direction
        this.requestMove(dx, dy);
        
        // Process movement (this will use smooth interpolation)
        this.processMovement(deltaTime);
        
        // Check if we reached target this frame
        return this.gridX === targetGridX && this.gridY === targetGridY;
    }

    /**
     * Request movement in a direction (for time-based movement)
     * Call this every frame with desired direction
     * @param dirX - X direction (-1, 0, or 1)
     * @param dirY - Y direction (-1, 0, or 1)
     */
    public requestMove(dirX: number, dirY: number): void {
        this.targetMoveX = dirX;
        this.targetMoveY = dirY;
        
        // If player presses a key while snapping, cancel snap and start moving immediately
        if (this.isSnapping && (dirX !== 0 || dirY !== 0)) {
            this.isSnapping = false;
        }
    }

    /**
     * Process accumulated movement based on deltaTime and moveSpeed
     * Called automatically by update()
     * @param deltaTime - Time since last frame in milliseconds
     */
    private processMovement(deltaTime: number): void {
        const wasMoving = this.isMoving;
        this.isMoving = this.targetMoveX !== 0 || this.targetMoveY !== 0;
        
        // If we just stopped moving, calculate snap target (only if snapping is enabled)
        if (wasMoving && !this.isMoving && !this.isSnapping && this.enableSnapping) {
            this.calculateSnapTarget();
            this.isSnapping = true;
        }
        
        // Handle snapping animation
        if (this.isSnapping) {
            const deltaSeconds = deltaTime / 1000;
            const snapDistance = deltaSeconds * this.snapSpeed * TILE_CONFIG.SIZE;
            
            // Calculate direction to snap target
            const dx = this.snapTargetX - this.smoothWorldX;
            const dy = this.snapTargetY - this.smoothWorldY;
            const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
            
            if (distanceToTarget < snapDistance) {
                // Reached target - snap exactly to tile center
                this.smoothWorldX = this.snapTargetX;
                this.smoothWorldY = this.snapTargetY;
                this.isSnapping = false;
                
                // Update grid position to match snap target
                // Use floor because snap target is already tile center (tileX * SIZE + SIZE/2)
                // Example: snapTarget 336 → 336/32 = 10.5 → floor = 10 ✓
                const snapGridX = Math.floor(this.snapTargetX / TILE_CONFIG.SIZE);
                const snapGridY = Math.floor(this.snapTargetY / TILE_CONFIG.SIZE);
                
                this.moveTo(snapGridX, snapGridY);
            } else {
                // Move towards snap target
                const dirX = dx / distanceToTarget;
                const dirY = dy / distanceToTarget;
                this.smoothWorldX += dirX * snapDistance;
                this.smoothWorldY += dirY * snapDistance;
            }
            
            // Emit smooth position update
            EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, this.id, this.smoothWorldX, this.smoothWorldY);
            
            // Reset movement accumulator while snapping
            this.moveAccumulator = 0;
            this.targetMoveX = 0;
            this.targetMoveY = 0;
            return;
        }
        
        if (!this.isMoving) {
            // Not moving and not snapping - idle
            this.moveAccumulator = 0;
            this.targetMoveX = 0;
            this.targetMoveY = 0;
            return;
        }

        // Normal movement
        // Convert deltaTime from ms to seconds
        const deltaSeconds = deltaTime / 1000;
        
        // Calculate instant movement per frame (pixels per frame)
        const moveDistance = deltaSeconds * this.moveSpeed * TILE_CONFIG.SIZE;
        
        // Move smoothWorldX/Y directly (instant response)
        this.smoothWorldX += this.targetMoveX * moveDistance;
        this.smoothWorldY += this.targetMoveY * moveDistance;
        
        // Emit smooth position update for rendering
        EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, this.id, this.smoothWorldX, this.smoothWorldY);
        
        // Accumulate movement time for grid position updates
        this.moveAccumulator += deltaSeconds * this.moveSpeed;

        // Update grid position when accumulator reaches 1.0
        if (this.moveAccumulator >= 1.0) {
            const newGridX = this.gridX + this.targetMoveX;
            const newGridY = this.gridY + this.targetMoveY;
            
            // Check for collision with other ants (only ants bounce into each other)
            let canMove = true;
            if (this.type === 'ant') {
                // Lazy-import EntityManager to avoid circular dependency
                const { EntityManager } = require('../managers/EntityManager');
                const occupant = EntityManager.getInstance().getTileOccupant(newGridX, newGridY);
                if (occupant && occupant.type === 'ant' && occupant.id !== this.id) {
                    canMove = false; // Tile occupied by another ant - collision!
                }
            }
            
            if (canMove) {
                this.moveTo(newGridX, newGridY);
            }
            
            this.moveAccumulator -= 1.0; // Keep remainder for smooth movement
        }

        // Reset target for next frame (must be set again each frame)
        this.targetMoveX = 0;
        this.targetMoveY = 0;
    }
    
    /**
     * Calculate which tile center to snap to based on current position
     * Uses rounding to snap to the nearest tile center
     */
    private calculateSnapTarget(): void {
        // Snap to the nearest tile center (not just floor)
        // This handles edge cases where entity is at tile boundary (e.g., 319.9 or 320.1)
        const currentTileX = Math.round(this.smoothWorldX / TILE_CONFIG.SIZE);
        const currentTileY = Math.round(this.smoothWorldY / TILE_CONFIG.SIZE);
        
        // Calculate center of nearest tile
        const tileCenterX = (currentTileX * TILE_CONFIG.SIZE);
        const tileCenterY = (currentTileY * TILE_CONFIG.SIZE);
        
        // Set snap target to nearest tile center
        this.snapTargetX = tileCenterX;
        this.snapTargetY = tileCenterY;
    }

    /**
     * Move entity to new grid position immediately
     * Emits ENTITY_MOVED event if position changes
     * Use requestMove() for smooth time-based movement instead
     */
    public moveTo(gridX: number, gridY: number): void {
        // Check if position actually changed
        if (this.gridX === gridX && this.gridY === gridY) {
            return;
        }

        this.gridX = gridX;
        this.gridY = gridY;
        this.updateWorldPosition();

        
        
        // Only reset smooth position if not currently moving (teleport case)
        // During smooth movement, let smoothWorldX/Y continue moving naturally
        if (!this.isMoving) {
            this.smoothWorldX = this.worldX;
            this.smoothWorldY = this.worldY;
        }

        // Emit movement event
        EventBus.emit(GameEvents.ENTITY_MOVED, this.id, gridX, gridY);
    }

    /**
     * Get the interpolated world position for smooth rendering
     * @returns Object with x and y pixel coordinates
     */
    public getSmoothPosition(): { x: number; y: number } {
        return { x: this.smoothWorldX, y: this.smoothWorldY };
    }

    /**
     * Add a component to this entity
     * @param name - Component identifier
     * @param component - Component instance
     */
    public addComponent(name: string, component: IComponent): void {
        this.components.set(name, component);
        component.onAttach(this);
    }

    /**
     * Get a component by name
     * @param name - Component identifier
     * @returns Component instance or undefined
     */
    public getComponent(name: string): IComponent | undefined {
        return this.components.get(name);
    }

    /**
     * Check if entity has a component
     * @param name - Component identifier
     */
    public hasComponent(name: string): boolean {
        return this.components.has(name);
    }

    /**
     * Remove a component from this entity
     * @param name - Component identifier
     */
    public removeComponent(name: string): void {
        const component = this.components.get(name);
        if (component) {
            component.onDetach();
            this.components.delete(name);
        }
    }

    /**
     * Check collision with another GameObject
     * Uses rectangle collision from helpers
     * @param other - Other GameObject to check against
     * @returns true if colliding
     */
    public isCollidingWith(other: GameObject): boolean {
        return rectIntersect(
            this.worldX,
            this.worldY,
            this.collisionWidth,
            this.collisionHeight,
            other.worldX,
            other.worldY,
            other.collisionWidth,
            other.collisionHeight
        );
    }

    /**
     * Update this entity and all its components
     * @param deltaTime - Time elapsed since last update (milliseconds)
     */
    public update(deltaTime: number): void {
        if (!this.isActive) {
            return;
        }

        // Process movement accumulation
        this.processMovement(deltaTime);

        // Update all components
        this.components.forEach(component => {
            component.update(deltaTime);
        });
    }

    /**
     * Destroy this entity
     * Marks as inactive, removes all components, emits destruction event
     */
    public destroy(): void {
        if (!this.isActive) {
            return; // Already destroyed
        }


        this.isActive = false;
        
        // Unsubscribe from cleanup event (if not already fired)
        if (this.cleanupListener) {
            this.cleanupListener();
            this.cleanupListener = null;
        }

        // Remove all components
        const componentNames = Array.from(this.components.keys());
        componentNames.forEach(name => {
            this.removeComponent(name);
        });

        // Emit destruction event using proper constant
        EventBus.emit(GameEvents.ENTITY_DESTROYED, this.id, this.type);

    }
}
