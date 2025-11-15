/**
 * Centralized Manager Imports
 * 
 * Barrel export file for common manager dependencies.
 * Managers frequently share EventBus, helper functions, entity classes,
 * and other manager references.
 * 
 * Usage in manager files:
 * ```typescript
 * import {
 *     EventBus, GameEvents,
 *     GameObject, Ant, Queen, Building,
 *     distance, clamp, getEntitiesInRadius
 * } from '../imports/managerImports';
 * 
 * export class MyManager {
 *     private static instance: MyManager;
 *     
 *     private constructor() {
 *         this.setupEventListeners();
 *     }
 *     
 *     public static getInstance(): MyManager {
 *         if (!MyManager.instance) {
 *             MyManager.instance = new MyManager();
 *         }
 *         return MyManager.instance;
 *     }
 * }
 * ```
 */

// ============================================================================
// EVENT BUS
// ============================================================================
export { EventBus, GameEvents } from '../utils/eventBus';

// ============================================================================
// ENTITY CLASSES
// ============================================================================
export { GameObject } from '../classes/GameObject';
export { Ant } from '../classes/Ant';
export { Queen } from '../classes/Queen';
export { Boss } from '../classes/Boss';
export { Resource } from '../classes/Resource';
export { Building } from '../classes/Building';
export { Projectile } from '../classes/Projectile';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export { 
    distance, 
    clamp, 
    pointInRect,
    getEntitiesInRadius,
    isEntityEnemy,
    gridToWorld,
    worldToGrid
} from '../utils/helpers';

// ============================================================================
// WORLD SYSTEMS
// ============================================================================
export { TileGrid } from '../world/TileGrid';
export { TileData, TILE_SIZE } from '../world/TileSystem';

// ============================================================================
// CONFIG
// ============================================================================
export { ResourceType, BuildingType, ENTITY_CONFIG } from '../config/entityConfig';
export { CONFIG } from '../config';
