/**
 * GameObject - Base Entity Class (MODEL)
 * Pure data class with component system
 * No rendering code - only data and EventBus emissions
 */

import { EventBus } from '../utils/eventBus';
import { IComponent } from './components/IComponent';
import { rectIntersect } from '../utils/helpers';
import { TILE_SIZE } from '../world/TileSystem';

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
    
    // Collision box
    public collisionWidth: number;
    public collisionHeight: number;
    
    // Component system
    private components: Map<string, IComponent>;

    /**
     * Create a new GameObject
     * @param type - Entity type identifier
     * @param gridX - Grid column position
     * @param gridY - Grid row position
     * @param collisionSize - Size of collision box (default: TILE_SIZE from config)
     */
    constructor(type: string, gridX: number, gridY: number, collisionSize: number = TILE_SIZE) {
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
        this.worldX = this.gridX * TILE_SIZE;
        this.worldY = this.gridY * TILE_SIZE;
    }

    /**
     * Move entity to new grid position
     * Emits ENTITY_MOVED event if position changes
     */
    public moveTo(gridX: number, gridY: number): void {
        // Check if position actually changed
        if (this.gridX === gridX && this.gridY === gridY) {
            return;
        }

        this.gridX = gridX;
        this.gridY = gridY;
        this.updateWorldPosition();

        // Emit movement event
        EventBus.emit('ENTITY_MOVED', this.id, gridX, gridY);
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

        // Remove all components
        const componentNames = Array.from(this.components.keys());
        componentNames.forEach(name => {
            this.removeComponent(name);
        });

        // Emit destruction event
        EventBus.emit('ENTITY_DESTROYED', this.id, this.type);
    }
}
