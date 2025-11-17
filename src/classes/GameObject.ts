/**
 * GameObject - Base Entity Class (MODEL)
 * Pure data class with component system
 * No rendering code - only data and EventBus emissions
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { IComponent } from './components/IComponent';
import { rectIntersect } from '../utils/helpers';
import { TILE_CONFIG } from '../config/world/tileConfig';
import { getTileSpeedModifier } from '../config/world/tileMovementConfig';

export class GameObject {
    // Unique identifier
    public readonly id: string;
    
    // Entity type (e.g., 'ant', 'queen', 'resource', 'boss')
    public readonly type: string;
    
    // Entity class (for tile speed modifiers: 'ant', 'queen', 'boss', etc.)
    // Different from type - type is unique ID, entityClass is category
    public entityClass: string;
    
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
    private knockbackListener: (() => void) | null = null;
    
    // Knockback state
    private knockbackVelocityX: number = 0;
    private knockbackVelocityY: number = 0;
    private isKnockedBack: boolean = false;
    public knockbackImmune: boolean = false; // Set true for bosses

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
        this.entityClass = type; // Default to type, subclasses can override
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
        
        // Listen for knockback events targeting this entity
        this.knockbackListener = EventBus.on('ENTITY_KNOCKBACK', (entityId: string, knockbackX: number, knockbackY: number) => {
            if (entityId === this.id && !this.knockbackImmune) {
                this.applyKnockback(knockbackX, knockbackY);
            }
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
            
            // Reset movement targets while snapping
            this.targetMoveX = 0;
            this.targetMoveY = 0;
            return;
        }
        
        if (!this.isMoving) {
            // Not moving and not snapping - idle
            this.targetMoveX = 0;
            this.targetMoveY = 0;
            return;
        }

        // Normal movement
        // Convert deltaTime from ms to seconds
        const deltaSeconds = deltaTime / 1000;
        
        // Apply tile-based speed modifier
        let effectiveSpeed = this.moveSpeed;
        
        // Get current tile from TileGrid (requires GameStateManager)
        try {
            const { GameStateManager } = require('../managers/GameStateManager');
            const tileGrid = GameStateManager.getInstance().getTileGrid();
            
            if (tileGrid) {
                // Get tile at current grid position
                const currentTile = tileGrid.getTileDataAt(this.gridX, this.gridY);
                
                if (currentTile) {
                    // Get speed modifier for this entity type on this tile
                    const speedModifier = getTileSpeedModifier(currentTile.type, this.entityClass);
                    effectiveSpeed *= speedModifier;
                    
                    // Debug logging (can be removed later)
                    // console.log(`${this.entityClass} on ${currentTile.type}: ${speedModifier}x speed`);
                }
            }
        } catch (error) {
            // Fail silently if GameStateManager not available (e.g., during tests)
            // Fall back to base moveSpeed
        }
        
        // Calculate instant movement per frame (pixels per frame)
        const moveDistance = deltaSeconds * effectiveSpeed * TILE_CONFIG.SIZE;
        
        // Move smoothWorldX/Y directly (instant response)
        this.smoothWorldX += this.targetMoveX * moveDistance;
        this.smoothWorldY += this.targetMoveY * moveDistance;
        
        // Sync grid position to match smooth position (sprite is source of truth)
        // This ensures logical position always matches visual position
        const centerOffset = TILE_CONFIG.SIZE / 2;
        const spriteWorldX = this.smoothWorldX + centerOffset;
        const spriteWorldY = this.smoothWorldY + centerOffset;
        const spriteGridX = Math.floor(spriteWorldX / TILE_CONFIG.SIZE);
        const spriteGridY = Math.floor(spriteWorldY / TILE_CONFIG.SIZE);
        
        // If sprite crossed into a new tile, update grid position
        if (spriteGridX !== this.gridX || spriteGridY !== this.gridY) {
            // Check for collision with other ants (only ants bounce into each other)
            let canMove = true;
            if (this.type === 'ant') {
                // Lazy-import EntityManager to avoid circular dependency
                const { EntityManager } = require('../managers/EntityManager');
                const occupant = EntityManager.getInstance().getTileOccupant(spriteGridX, spriteGridY);
                if (occupant && occupant.type === 'ant' && occupant.id !== this.id) {
                    canMove = false; // Tile occupied by another ant - collision!
                    // Stop smooth movement at tile boundary
                    const blockedWorldX = this.gridX * TILE_CONFIG.SIZE;
                    const blockedWorldY = this.gridY * TILE_CONFIG.SIZE;
                    this.smoothWorldX = blockedWorldX;
                    this.smoothWorldY = blockedWorldY;
                }
            }
            
            if (canMove) {
                this.moveTo(spriteGridX, spriteGridY);
            }
        }
        
        // Emit smooth position update for rendering
        EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, this.id, this.smoothWorldX, this.smoothWorldY);

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
        // Floor coordinates to ensure they're integers (prevent floating point errors)
        gridX = Math.floor(gridX);
        gridY = Math.floor(gridY);
        
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
     * Apply knockback force to this entity
     * @param knockbackX - X force (in tiles)
     * @param knockbackY - Y force (in tiles)
     */
    private applyKnockback(knockbackX: number, knockbackY: number): void {
        if (this.knockbackImmune) return;
        
        // Set knockback velocity
        this.knockbackVelocityX = knockbackX;
        this.knockbackVelocityY = knockbackY;
        this.isKnockedBack = true;
        
        // Cancel snapping during knockback
        this.isSnapping = false;
    }

    /**
     * Process knockback physics
     * @param deltaTime - Time elapsed in milliseconds
     */
    private processKnockback(deltaTime: number): void {
        if (!this.isKnockedBack) return;
        
        const deltaSeconds = deltaTime / 1000;
        const friction = 0.92; // Friction decay per frame at 60fps
        const adjustedFriction = Math.pow(friction, deltaTime / 16.67); // Adjust for actual deltaTime
        
        // Apply knockback velocity to position
        const knockbackDistance = TILE_CONFIG.SIZE * deltaSeconds;
        this.smoothWorldX += this.knockbackVelocityX * knockbackDistance;
        this.smoothWorldY += this.knockbackVelocityY * knockbackDistance;
        
        // Apply friction to slow down
        this.knockbackVelocityX *= adjustedFriction;
        this.knockbackVelocityY *= adjustedFriction;
        
        // Stop knockback when velocity is very small
        const speed = Math.sqrt(this.knockbackVelocityX * this.knockbackVelocityX + 
                                this.knockbackVelocityY * this.knockbackVelocityY);
        if (speed < 0.05) {
            this.isKnockedBack = false;
            this.knockbackVelocityX = 0;
            this.knockbackVelocityY = 0;
            
            // Update grid position to match final knockback position
            const centerOffset = TILE_CONFIG.SIZE / 2;
            const finalGridX = Math.floor((this.smoothWorldX + centerOffset) / TILE_CONFIG.SIZE);
            const finalGridY = Math.floor((this.smoothWorldY + centerOffset) / TILE_CONFIG.SIZE);
            this.moveTo(finalGridX, finalGridY);
        }
        
        // Emit position update
        EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, this.id, this.smoothWorldX, this.smoothWorldY);
    }

    /**
     * Update this entity and all its components
     * @param deltaTime - Time elapsed since last update (milliseconds)
     */
    public update(deltaTime: number): void {
        if (!this.isActive) {
            return;
        }

        // Process knockback first (overrides normal movement)
        if (this.isKnockedBack) {
            this.processKnockback(deltaTime);
        } else {
            // Process normal movement
            this.processMovement(deltaTime);
        }

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
        
        // Unsubscribe from knockback event
        if (this.knockbackListener) {
            this.knockbackListener();
            this.knockbackListener = null;
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
