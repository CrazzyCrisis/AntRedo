/**
 * Building Placement Configuration
 * Extends ENTITY_CONFIG.BUILDINGS with placement-specific properties
 * Config-First Philosophy: All building placement rules centralized here
 */

import { BuildingType, ENTITY_CONFIG } from './gameplay/entityConfig';
import { TileType } from '../world/TileSystem';

/**
 * Building placement configuration
 * Defines terrain restrictions, sprites, and unlock status per building
 */
interface BuildingPlacementConfig {
    allowedTerrain: TileType[];     // Whitelist of valid terrain types for placement
    constructionSprite: string;     // Path to construction site sprite
    completedSprite: string;        // Path to finished building sprite
    unlocked: boolean;              // Quest unlock status (all true for now, will integrate with QuestManager)
}

/**
 * Building placement configuration for all building types
 * Each building has specific terrain requirements and sprite paths
 * Phase 4: Added placeholder entries for new buildings (centralized config used instead)
 */
export const BUILDING_PLACEMENT_CONFIG: Record<BuildingType, BuildingPlacementConfig> = {
    warehouse: {
        // Warehouses need flat, stable ground - grass, dirt, farmland
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.FARMLAND],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hill/Hill1.png',
        unlocked: true  // Default unlocked for testing
    },
    barracks: {
        // Barracks more versatile - can be built on grass, dirt, stone
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hive/Hive1.png',
        unlocked: true
    },
    tower: {
        // Towers need solid foundation - grass or stone preferred
        allowedTerrain: [TileType.GRASS, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Cone/Cone1.png',
        unlocked: true
    },
    // Phase 4: Placeholder entries for new buildings (use centralized config via getBuildingByType)
    nest: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hive/Hive2.png',
        unlocked: true
    },
    builderHut: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hill/Hill2.png',
        unlocked: true
    },
    gathererHut: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hive1.png',
        unlocked: true
    },
    spitterHut: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Cone/Cone2.png',
        unlocked: true
    },
    speedBeacon: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hill/Hill1.png',
        unlocked: true
    },
    attackBeacon: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Cone/Cone1.png',
        unlocked: true
    },
    attackSpeedBeacon: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hive/Hive2.png',
        unlocked: true
    },
    gatherSpeedBeacon: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Hill/Hill2.png',
        unlocked: true
    },
    terrainNullifierBeacon: {
        allowedTerrain: [TileType.GRASS, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/Cone/Cone2.png',
        unlocked: true
    }
};

/**
 * Get full building configuration (combines ENTITY_CONFIG + placement config)
 * Phase 4: Falls back to centralized buildingConfig.ts for new building types
 * @param buildingType - Type of building to get config for
 * @returns Complete building configuration with stats and placement rules
 */
export function getBuildingConfig(buildingType: BuildingType) {
    // Legacy support for original 3 buildings
    if (buildingType in ENTITY_CONFIG.BUILDINGS && buildingType in BUILDING_PLACEMENT_CONFIG) {
        return {
            ...ENTITY_CONFIG.BUILDINGS[buildingType],
            ...BUILDING_PLACEMENT_CONFIG[buildingType]
        };
    }
    
    // Phase 4: Use centralized config for new buildings
    const { getBuildingByType } = require('./buildings/buildingConfig');
    const centralConfig = getBuildingByType(buildingType);
    
    if (!centralConfig) {
        console.warn(`[getBuildingConfig] No config found for building type: ${buildingType}`);
        // Return minimal fallback to prevent crashes
        return {
            costs: { wood: 0, stone: 0 },
            unlocked: false,
            allowedTerrain: []
        };
    }
    
    // Convert centralized config to legacy format expected by UI
    return {
        costs: centralConfig.costs,
        unlocked: centralConfig.unlocked,
        allowedTerrain: centralConfig.allowedTerrain,
        name: centralConfig.name,
        displayName: centralConfig.displayName,
        description: centralConfig.description,
        // Legacy fields for compatibility
        size: { width: 2, height: 2 }, // Default size for all new buildings
        constructionTime: 30,
        levels: [{
            health: 100,
            constructionTime: 30
        }]
    };
}
