/**
 * Tile Movement Configuration
 * Centralized config for tile pathfinding costs and entity speed modifiers
 * 
 * PATHFINDING COST: How much pathfinding "weights" each tile (higher = avoid if possible)
 * SPEED MODIFIER: How much the tile slows down/speeds up entities (1.0 = normal, 0.4 = 60% slower, 1.3 = 30% faster)
 * 
 * Entity-specific modifiers allow certain entities to move differently on tiles
 * (e.g., bosses are faster on stone, fish would be faster in water)
 */

import { TileType } from '../../world/TileSystem';

/**
 * Speed modifier for entity movement on specific tiles
 * 1.0 = normal speed
 * < 1.0 = slower (0.5 = 50% speed, 0.4 = 40% speed)
 * > 1.0 = faster (1.3 = 130% speed, 2.0 = 200% speed)
 */
export interface TileSpeedModifier {
    default: number;           // Default speed modifier for all entities
    boss?: number;            // Override for boss entities
    queen?: number;           // Override for queen
    ant?: number;             // Override for ants
    // Add more entity types as needed
}

/**
 * Complete tile movement configuration
 */
export interface TileMovementConfig {
    pathfindingCost: number;       // A* pathfinding weight (higher = less desirable path)
    speedModifier: TileSpeedModifier;  // Speed multipliers per entity type
    walkable: boolean;             // Can entities walk on this tile at all?
}

/**
 * Tile Movement Configuration Map
 * Defines pathfinding costs and speed modifiers for each tile type
 */
export const TILE_MOVEMENT_CONFIG: Record<TileType, TileMovementConfig> = {
    // === NORMAL TERRAIN ===
    [TileType.GRASS]: {
        pathfindingCost: 0.7,
        speedModifier: { default: 1.2 },
        walkable: true
    },
    
    [TileType.DIRT]: {
        pathfindingCost: 1.1,
        speedModifier: { default: 0.95 },
        walkable: true
    },
    
    // STONE - High pathfinding cost, slows most entities, speeds up bosses
    [TileType.STONE]: {
        pathfindingCost: 5.0,          // High cost - avoid if possible
        speedModifier: {
            default: 0.7,              // 30% slower for most entities
            boss: 1.3                  // 30% faster for bosses (they like stone!)
        },
        walkable: true
    },
    
    [TileType.SAND]: {
        pathfindingCost: 1.5,
        speedModifier: { default: 0.85 },
        walkable: true
    },
    
    [TileType.SAND_DARK]: {
        pathfindingCost: 1.5,
        speedModifier: { default: 0.85 },
        walkable: true
    },
    
    // WATER - Very high pathfinding cost, extremely slow movement, not walkable by default
    [TileType.WATER]: {
        pathfindingCost: 100.0,        // Extremely high - almost never path through
        speedModifier: {
            default: 0.1,              // 90% slower (future: will also damage)
            // Future: fish/aquatic entities would have higher speed here
        },
        walkable: false                 // Not walkable (future: swimming mechanic could change this)
    },
    
    [TileType.FARMLAND]: {
        pathfindingCost: 1.2,
        speedModifier: { default: 0.9 },
        walkable: true
    },
    
    [TileType.MOSS]: {
        pathfindingCost: 1.1,
        speedModifier: { default: 0.95 },
        walkable: true
    },
    
    // === PEBBLES ===
    [TileType.PEBBLE_1]: {
        pathfindingCost: 1.0,
        speedModifier: { default: 1.0 },
        walkable: true
    },
    
    [TileType.PEBBLE_2]: {
        pathfindingCost: 1.0,
        speedModifier: { default: 1.0 },
        walkable: true
    },
    
    [TileType.PEBBLE_3]: {
        pathfindingCost: 1.0,
        speedModifier: { default: 1.0 },
        walkable: true
    },
    
    // === CAVE TILES ===
    [TileType.CAVE_FLOOR]: {
        pathfindingCost: 1.0,
        speedModifier: { default: 1.0 },
        walkable: true
    },
    
    [TileType.CAVE_WALL]: {
        pathfindingCost: Infinity,
        speedModifier: { default: 0 },
        walkable: false
    },
    
    [TileType.CAVE_DIRT]: {
        pathfindingCost: 1.2,
        speedModifier: { default: 0.9 },
        walkable: true
    },
    
    [TileType.CAVE_DARK]: {
        pathfindingCost: Infinity,
        speedModifier: { default: 0 },
        walkable: false
    },
    
    [TileType.CAVE_WATER]: {
        pathfindingCost: 100.0,
        speedModifier: { default: 0.4 },
        walkable: false
    },
    
    [TileType.ANTHILL]: {
        pathfindingCost: Infinity,
        speedModifier: { default: 0 },
        walkable: false
    }
};

/**
 * Get speed modifier for specific entity type on tile
 * @param tileType - Type of tile
 * @param entityType - Type of entity ('ant', 'boss', 'queen', etc.)
 * @returns Speed multiplier (1.0 = normal)
 */
export function getTileSpeedModifier(tileType: TileType, entityType: string = 'default'): number {
    const config = TILE_MOVEMENT_CONFIG[tileType];
    if (!config) return 1.0;
    
    // Check for entity-specific override
    const speedMod = config.speedModifier;
    switch (entityType.toLowerCase()) {
        case 'boss':
            return speedMod.boss ?? speedMod.default;
        case 'queen':
            return speedMod.queen ?? speedMod.default;
        case 'ant':
            return speedMod.ant ?? speedMod.default;
        default:
            return speedMod.default;
    }
}

/**
 * Get pathfinding cost for tile type
 * @param tileType - Type of tile
 * @returns Pathfinding cost (higher = less desirable)
 */
export function getTilePathfindingCost(tileType: TileType): number {
    const config = TILE_MOVEMENT_CONFIG[tileType];
    return config?.pathfindingCost ?? 1.0;
}

/**
 * Check if tile is walkable
 * @param tileType - Type of tile
 * @returns True if entities can walk on this tile
 */
export function isTileWalkable(tileType: TileType): boolean {
    const config = TILE_MOVEMENT_CONFIG[tileType];
    return config?.walkable ?? false;
}
