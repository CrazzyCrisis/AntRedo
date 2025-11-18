/**
 * Centralized Building Configuration System
 * Single source of truth for ALL building properties (except sprites/animations)
 * 
 * Phase 1: Core configuration infrastructure
 * - 12 building types (3 existing + 9 new)
 * - 4 function types: STORAGE, SPAWNER, DEFENSE, STAT_BOOST
 * - Configurable display names
 * - All stats, costs, terrain, and function-specific parameters
 * 
 * Config-First Philosophy: ALL values configurable here
 */

import { TileType } from '../../world/TileSystem';

// ============================================================================
// CORE TYPES & ENUMS
// ============================================================================

/**
 * Building function categories
 * Determines what special ability the building provides
 */
export enum BuildingFunctionType {
    STORAGE = 'STORAGE',       // Increases resource/ant capacity limits
    SPAWNER = 'SPAWNER',       // Spawns ants on intervals
    DEFENSE = 'DEFENSE',       // Attacks enemies in range
    STAT_BOOST = 'STAT_BOOST'  // Buffs ants in radius
}

/**
 * Building UI categories for hierarchical menu system
 * Groups buildings by player-facing category (not function)
 */
export enum BuildingUICategory {
    STORAGE = 'STORAGE',     // Warehouses, Nests - storage buildings
    UNITS = 'UNITS',         // Barracks, Huts - ant spawners
    BOOSTS = 'BOOSTS',       // Beacons - stat boost buildings
    DEFENSE = 'DEFENSE'      // Towers - defensive structures
}

/**
 * Resource types that can be stored/produced
 */
export type ResourceType = 'food' | 'wood' | 'stone' | 'magicCrystal';

/**
 * Ant job types that can be spawned
 */
export type AntJobType = 'worker' | 'builder' | 'gatherer' | 'spitter' | 'soldier';

/**
 * Building types - all 12 buildings
 */
export type BuildingType = 
    // Existing (3)
    | 'warehouse' 
    | 'barracks' 
    | 'tower'
    // Storage (1)
    | 'nest'
    // Spawners (3)
    | 'builderHut'
    | 'gathererHut'
    | 'spitterHut'
    // Stat Boost Beacons (5)
    | 'speedBeacon'
    | 'attackBeacon'
    | 'attackSpeedBeacon'
    | 'gatherSpeedBeacon'
    | 'terrainNullifierBeacon';

// ============================================================================
// FUNCTION-SPECIFIC CONFIGURATION INTERFACES
// ============================================================================

/**
 * Storage function configuration
 * Buildings that increase resource/ant limits
 */
export interface StorageConfig {
    foodLimit?: number;           // Food storage increase
    woodLimit?: number;           // Wood storage increase
    stoneLimit?: number;          // Stone storage increase
    magicCrystalLimit?: number;   // Magic crystal storage increase
    antCapacity?: number;         // Ant population limit increase
}

/**
 * Spawner function configuration
 * Buildings that spawn ants on intervals
 */
export interface SpawnerConfig {
    antType: AntJobType;          // Type of ant to spawn
    spawnInterval: number;        // Seconds between spawns
    maxConcurrentAnts: number;    // Max ants alive from this spawner at once
    spawnRadius: number;          // Tiles around building to spawn ants
}

/**
 * Defense function configuration
 * Buildings that attack enemies
 */
export interface DefenseConfig {
    attackRange: number;          // Tiles for targeting enemies
    attackDamage: number;         // Damage per shot
    attackCooldown: number;       // Seconds between attacks
    projectileSpeed: number;      // World units per second
    targetPriority: 'nearest' | 'lowest_health' | 'highest_threat';
}

/**
 * Stat boost function configuration
 * Buildings that buff ants in range
 */
export interface StatBoostConfig {
    boostRadius: number;          // Tiles for buff application
    speedBoost?: number;          // Movement speed multiplier (1.5 = +50%)
    attackBoost?: number;         // Attack damage bonus (flat)
    attackSpeedBoost?: number;    // Attack speed multiplier (1.3 = +30%)
    gatherSpeedBoost?: number;    // Resource gathering speed multiplier (2.0 = double)
    terrainSpeedNullifier?: boolean;  // Ignore terrain penalties if true
}

// ============================================================================
// BUILDING LEVEL CONFIGURATION
// ============================================================================

/**
 * Per-level building stats
 * Buildings have 3 levels, stats increase each level
 */
export interface BuildingLevel {
    health: number;               // Max health for this level
    antCapBonus?: number;         // Additional ant cap (STORAGE function)
}

// ============================================================================
// MAIN BUILDING CONFIGURATION
// ============================================================================

/**
 * Complete building configuration
 * Single source of truth for all building properties
 */
export interface BuildingConfig {
    // Display
    name: string;                 // Configurable display name (shown in UI)
    uiCategory: BuildingUICategory;  // UI category for hierarchical menu
    
    // Physical
    size: { width: number; height: number };  // Tiles occupied (2x2, 1x1, etc.)
    
    // Economy
    costs: { wood: number; stone: number };   // Construction costs
    constructionTime: number;                  // Seconds to build
    
    // Progression
    levels: [BuildingLevel, BuildingLevel, BuildingLevel];  // Always 3 levels
    
    // Placement
    allowedTerrain: TileType[];               // Valid terrain for placement
    constructionSprite: string;               // Path to construction sprite
    completedSprite: string;                  // Path to completed sprite
    unlocked: boolean;                        // Quest unlock status
    
    // Function
    functionType: BuildingFunctionType;       // What this building does
    storageConfig?: StorageConfig;            // If STORAGE type
    spawnerConfig?: SpawnerConfig;            // If SPAWNER type
    defenseConfig?: DefenseConfig;            // If DEFENSE type
    statBoostConfig?: StatBoostConfig;        // If STAT_BOOST type
}

// ============================================================================
// BUILDING DEFINITIONS (12 Buildings)
// ============================================================================

/**
 * All building configurations
 * Config-First: Change values here, not in code
 */
export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
    // ========================================================================
    // EXISTING BUILDINGS (3) - Migrated from entityConfig.ts
    // ========================================================================
    
    warehouse: {
        name: 'Warehouse',
        uiCategory: BuildingUICategory.STORAGE,
        size: { width: 2, height: 2 },
        costs: { wood: 20, stone: 10 },
        constructionTime: 30,
        levels: [
            { health: 200, antCapBonus: 5 },
            { health: 400, antCapBonus: 10 },
            { health: 600, antCapBonus: 15 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.FARMLAND],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hill/Hill1.png',
        unlocked: true,
        functionType: BuildingFunctionType.STORAGE,
        storageConfig: {
            foodLimit: 125,      // Increase food capacity by x amount
            woodLimit: 50,      // Increase wood capacity by x amount
            stoneLimit: 50      // Increase stone capacity by x amount
        }
    },
    
    barracks: {
        name: 'Barracks',
        uiCategory: BuildingUICategory.UNITS,
        size: { width: 2, height: 2 },
        costs: { wood: 15, stone: 15 },
        constructionTime: 25,
        levels: [
            { health: 150, antCapBonus: 3 },
            { health: 300, antCapBonus: 6 },
            { health: 450, antCapBonus: 9 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hive/Hive1.png',
        unlocked: true,
        functionType: BuildingFunctionType.SPAWNER,
        spawnerConfig: {
            antType: 'worker',
            spawnInterval: 10,        // Spawn every 10 seconds
            maxConcurrentAnts: 5,     // Max 5 workers alive at once
            spawnRadius: 2            // Spawn within 2 tiles
        }
    },
    
    tower: {
        name: 'Defense Tower',
        uiCategory: BuildingUICategory.DEFENSE,
        size: { width: 2, height: 2 },
        costs: { wood: 10, stone: 20 },
        constructionTime: 20,
        levels: [
            { health: 100 },
            { health: 200 },
            { health: 300 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Cone/Cone1.png',
        unlocked: true,
        functionType: BuildingFunctionType.DEFENSE,
        defenseConfig: {
            attackRange: 8,           // 8 tiles range
            attackDamage: 15,         // 15 damage per shot
            attackCooldown: 2,        // Fire every 2 seconds
            projectileSpeed: 200,     // Fast projectiles
            targetPriority: 'nearest'
        }
    },
    // --- STORAGE (1) ---
    
    nest: {
        name: 'Ant Nest',
        uiCategory: BuildingUICategory.STORAGE,
        size: { width: 2, height: 2 },
        costs: { wood: 25, stone: 15 },
        constructionTime: 35,
        levels: [
            { health: 250, antCapBonus: 10 },
            { health: 500, antCapBonus: 20 },
            { health: 750, antCapBonus: 30 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hive/Hive2.png',
        unlocked: true,
        functionType: BuildingFunctionType.STORAGE,
        storageConfig: {
            antCapacity: 15  // +15 ant population limit
        }
    },
    
    // --- SPAWNERS (3) ---
    
    builderHut: {
        name: 'Builder Hut',
        uiCategory: BuildingUICategory.UNITS,
        size: { width: 2, height: 2 },
        costs: { wood: 10, stone: 5 },
        constructionTime: 15,
        levels: [
            { health: 80 },
            { health: 160 },
            { health: 240 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hill/Hill2.png',
        unlocked: true,
        functionType: BuildingFunctionType.SPAWNER,
        spawnerConfig: {
            antType: 'builder',
            spawnInterval: 15,        // Spawn every 15 seconds
            maxConcurrentAnts: 3,     // Max 3 builders
            spawnRadius: 2
        }
    },
    
    gathererHut: {
        name: 'Gatherer Hut',
        uiCategory: BuildingUICategory.UNITS,
        size: { width: 2, height: 2 },
        costs: { wood: 8, stone: 5 },
        constructionTime: 12,
        levels: [
            { health: 70 },
            { health: 140 },
            { health: 210 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.FARMLAND],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hive/Hive1.png',
        unlocked: true,
        functionType: BuildingFunctionType.SPAWNER,
        spawnerConfig: {
            antType: 'gatherer',
            spawnInterval: 8,         // Spawn every 8 seconds
            maxConcurrentAnts: 6,     // Max 6 gatherers
            spawnRadius: 2
        }
    },
    
    spitterHut: {
        name: 'Spitter Hut',
        uiCategory: BuildingUICategory.UNITS,
        size: { width: 2, height: 2 },
        costs: { wood: 12, stone: 10 },
        constructionTime: 18,
        levels: [
            { health: 90 },
            { health: 180 },
            { health: 270 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Cone/Cone2.png',
        unlocked: true,
        functionType: BuildingFunctionType.SPAWNER,
        spawnerConfig: {
            antType: 'spitter',
            spawnInterval: 20,        // Spawn every 20 seconds (stronger units)
            maxConcurrentAnts: 4,     // Max 4 spitters
            spawnRadius: 2
        }
    },
    
    // --- STAT BOOST BEACONS (5) ---
    
    speedBeacon: {
        name: 'Speed Beacon',
        uiCategory: BuildingUICategory.BOOSTS,
        size: { width: 1, height: 1 },
        costs: { wood: 15, stone: 10 },
        constructionTime: 10,
        levels: [
            { health: 50 },
            { health: 100 },
            { health: 150 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hill/Hill1.png',
        unlocked: true,
        functionType: BuildingFunctionType.STAT_BOOST,
        statBoostConfig: {
            boostRadius: 6,           // 6 tile radius
            speedBoost: 1.5           // +50% movement speed
        }
    },
    
    attackBeacon: {
        name: 'Attack Beacon',
        uiCategory: BuildingUICategory.BOOSTS,
        size: { width: 1, height: 1 },
        costs: { wood: 18, stone: 12 },
        constructionTime: 12,
        levels: [
            { health: 60 },
            { health: 120 },
            { health: 180 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Cone/Cone1.png',
        unlocked: true,
        functionType: BuildingFunctionType.STAT_BOOST,
        statBoostConfig: {
            boostRadius: 5,           // 5 tile radius
            attackBoost: 5            // +5 attack damage
        }
    },
    
    attackSpeedBeacon: {
        name: 'Attack Speed Beacon',
        uiCategory: BuildingUICategory.BOOSTS,
        size: { width: 1, height: 1 },
        costs: { wood: 20, stone: 15 },
        constructionTime: 14,
        levels: [
            { health: 65 },
            { health: 130 },
            { health: 195 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hive/Hive2.png',
        unlocked: true,
        functionType: BuildingFunctionType.STAT_BOOST,
        statBoostConfig: {
            boostRadius: 5,           // 5 tile radius
            attackSpeedBoost: 1.3     // +30% attack speed
        }
    },
    
    gatherSpeedBeacon: {
        name: 'Gather Speed Beacon',
        uiCategory: BuildingUICategory.BOOSTS,
        size: { width: 1, height: 1 },
        costs: { wood: 16, stone: 10 },
        constructionTime: 11,
        levels: [
            { health: 55 },
            { health: 110 },
            { health: 165 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.FARMLAND],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hill/Hill2.png',
        unlocked: true,
        functionType: BuildingFunctionType.STAT_BOOST,
        statBoostConfig: {
            boostRadius: 7,           // 7 tile radius
            gatherSpeedBoost: 2.0     // Double gathering speed
        }
    },
    
    terrainNullifierBeacon: {
        name: 'Terrain Nullifier Beacon',
        uiCategory: BuildingUICategory.BOOSTS,
        size: { width: 1, height: 1 },
        costs: { wood: 25, stone: 20 },
        constructionTime: 16,
        levels: [
            { health: 75 },
            { health: 150 },
            { health: 225 }
        ],
        allowedTerrain: [TileType.GRASS, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Cone/Cone2.png',
        unlocked: true,
        functionType: BuildingFunctionType.STAT_BOOST,
        statBoostConfig: {
            boostRadius: 8,                   // 8 tile radius
            terrainSpeedNullifier: true       // Ignore terrain penalties
        }
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get building configuration by type
 * @param buildingType - Type of building
 * @returns Complete building config
 */
export function getBuildingByType(buildingType: BuildingType): BuildingConfig {
    return BUILDINGS[buildingType];
}

/**
 * Get building display name
 * @param buildingType - Type of building
 * @returns Configurable display name
 */
export function getBuildingDisplayName(buildingType: BuildingType): string {
    return BUILDINGS[buildingType].name;
}

/**
 * Get all buildings by function type
 * @param functionType - Function type to filter by
 * @returns Array of building types with that function
 */
export function getBuildingsByFunction(functionType: BuildingFunctionType): BuildingType[] {
    return Object.entries(BUILDINGS)
        .filter(([_, config]) => config.functionType === functionType)
        .map(([type, _]) => type as BuildingType);
}

/**
 * Check if building is unlocked
 * @param buildingType - Type of building
 * @returns True if unlocked for placement
 */
export function isBuildingUnlocked(buildingType: BuildingType): boolean {
    return BUILDINGS[buildingType].unlocked;
}

/**
 * Get all buildings by UI category
 * Used by BuildingMenuComponent for hierarchical filtering
 * @param uiCategory - UI category to filter by
 * @returns Array of building types in that category
 */
export function getBuildingsByUICategory(uiCategory: BuildingUICategory): BuildingType[] {
    return Object.entries(BUILDINGS)
        .filter(([_, config]) => config.uiCategory === uiCategory)
        .map(([type, _]) => type as BuildingType);
}
