/**
 * EntityManager - Central Entity Tracking (CONTROLLER)
 * Singleton manager for all game entities
 * Provides fast lookups by ID, type, and spatial queries
 */

import { BaseManager } from './BaseManager';
import {
    GameObject,
    GameEvents,
    distance,
    pointInRect
} from '../imports/managerImports';

export class EntityManager extends BaseManager {
    private static instance: EntityManager;
    
    // Entity storage
    private entities: Map<string, GameObject>;
    private entitiesByType: Map<string, Set<string>>;
    
    // Tile occupancy tracking (for collision avoidance)
    private tileOccupants: Map<string, GameObject>;

    private constructor() {
        super(); // Initialize BaseManager
        this.entities = new Map();
        this.entitiesByType = new Map();
        this.tileOccupants = new Map();
        this.setupEventListeners();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): EntityManager {
        if (!EntityManager.instance) {
            EntityManager.instance = new EntityManager();
        }
        return EntityManager.instance;
    }

    /**
     * Setup EventBus listeners for automatic cleanup
     */
    private setupEventListeners(): void {
        // Auto-remove entities when they're destroyed
        this.subscribe(GameEvents.ENTITY_DESTROYED, (id: string) => {
            this.removeEntity(id);
        });
        
        // Track tile occupancy when entities move
        this.subscribe(GameEvents.ENTITY_MOVED, (id: string, gridX: number, gridY: number) => {
            const entity = this.entities.get(id);
            if (entity) {
                this.updateTileOccupancy(entity, gridX, gridY);
            }
        });
    }

    /**
     * Add entity to tracking
     * @param entity - GameObject to track
     */
    public addEntity(entity: GameObject): void {
        // Add to main storage
        this.entities.set(entity.id, entity);

        // Add to type index
        if (!this.entitiesByType.has(entity.type)) {
            this.entitiesByType.set(entity.type, new Set());
        }
        this.entitiesByType.get(entity.type)!.add(entity.id);
        
        // Register initial tile occupancy
        this.registerTileOccupant(entity);

        // Emit event
        this.emit('ENTITY_ADDED', entity.id, entity.type);
    }

    /**
     * Remove entity from tracking
     * @param id - Entity ID to remove
     */
    public removeEntity(id: string): void {
        const entity = this.entities.get(id);
        if (!entity) {
            return; // Entity not found, gracefully ignore
        }

        // Remove from type index
        const typeSet = this.entitiesByType.get(entity.type);
        if (typeSet) {
            typeSet.delete(id);
        }
        
        // Unregister from tile occupancy
        this.unregisterTileOccupant(entity);

        // Remove from main storage
        this.entities.delete(id);

        // Emit event
        this.emit('ENTITY_REMOVED', id, entity.type);
    }

    /**
     * Get entity by ID
     * @param id - Entity ID
     * @returns GameObject or undefined
     */
    public getEntity(id: string): GameObject | undefined {
        return this.entities.get(id);
    }

    /**
     * Get all active entities
     * @returns Array of active GameObjects
     */
    public getAllEntities(): GameObject[] {
        return Array.from(this.entities.values()).filter(e => e.isActive);
    }

    /**
     * Get entities by type
     * @param type - Entity type (e.g., 'ant', 'resource')
     * @returns Array of active GameObjects of specified type
     */
    public getEntitiesByType(type: string): GameObject[] {
        const ids = this.entitiesByType.get(type);
        if (!ids) {
            return [];
        }

        return Array.from(ids)
            .map(id => this.entities.get(id))
            .filter((e): e is GameObject => e !== undefined && e.isActive);
    }

    /**
     * Get total entity count (active only)
     * @param type - Optional type filter
     * @returns Number of active entities
     */
    public getEntityCount(type?: string): number {
        if (type) {
            return this.getEntitiesByType(type).length;
        }
        return this.getAllEntities().length;
    }

    /**
     * Get entities at specific grid position
     * @param gridX - Grid column
     * @param gridY - Grid row
     * @returns Array of active GameObjects at position
     */
    public getEntitiesAt(gridX: number, gridY: number): GameObject[] {
        return this.getAllEntities().filter(e => 
            e.gridX === gridX && e.gridY === gridY
        );
    }

    /**
     * Get entities within radius (uses distance helper)
     * @param worldX - Center X in world coordinates
     * @param worldY - Center Y in world coordinates
     * @param radius - Radius in pixels
     * @returns Array of active GameObjects within radius
     */
    public getEntitiesInRadius(worldX: number, worldY: number, radius: number): GameObject[] {
        return this.getAllEntities().filter(e => {
            const dist = distance(worldX, worldY, e.worldX, e.worldY);
            return dist <= radius;
        });
    }

    /**
     * Get entities within rectangle (uses pointInRect helper)
     * @param x - Rectangle X (top-left)
     * @param y - Rectangle Y (top-left)
     * @param width - Rectangle width
     * @param height - Rectangle height
     * @returns Array of active GameObjects within rectangle
     */
    public getEntitiesInRect(x: number, y: number, width: number, height: number): GameObject[] {
        return this.getAllEntities().filter(e => 
            pointInRect(e.worldX, e.worldY, x, y, width, height)
        );
    }

    /**
     * Get entity occupying a specific tile
     * @param gridX - Grid column
     * @param gridY - Grid row
     * @returns GameObject or undefined if tile is unoccupied
     */
    public getTileOccupant(gridX: number, gridY: number): GameObject | undefined {
        const key = `${gridX},${gridY}`;
        return this.tileOccupants.get(key);
    }

    /**
     * Register entity as occupying a tile
     * @param entity - GameObject to register
     */
    public registerTileOccupant(entity: GameObject): void {
        const key = `${entity.gridX},${entity.gridY}`;
        this.tileOccupants.set(key, entity);
    }

    /**
     * Unregister entity from tile occupancy
     * @param entity - GameObject to unregister
     */
    public unregisterTileOccupant(entity: GameObject): void {
        const key = `${entity.gridX},${entity.gridY}`;
        this.tileOccupants.delete(key);
    }

    /**
     * Update tile occupancy when entity moves
     * @param entity - GameObject that moved
     * @param newGridX - New grid X position
     * @param newGridY - New grid Y position
     */
    private updateTileOccupancy(entity: GameObject, newGridX: number, newGridY: number): void {
        // Unregister from old tile
        this.unregisterTileOccupant(entity);
        
        // Update entity position (in case it's not already updated)
        entity.gridX = newGridX;
        entity.gridY = newGridY;
        
        // Register at new tile
        this.registerTileOccupant(entity);
    }

    /**
     * Update all active entities
     * Call this once per frame from your scene's update() method
     * @param deltaTime - Time since last frame in milliseconds
     */
    public update(deltaTime: number): void {
        // Update all active entities
        for (const entity of this.entities.values()) {
            if (entity.isActive) {
                entity.update(deltaTime);
            }
        }
    }

    /**
     * Clear all entities (for testing/reset)
     */
    public clear(): void {
        this.entities.clear();
        this.entitiesByType.clear();
        this.tileOccupants.clear();
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
