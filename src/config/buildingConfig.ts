/**
 * Building Placement Configuration
 * Extends ENTITY_CONFIG.BUILDINGS with placement-specific properties
 * Config-First Philosophy: All building placement rules centralized here
 */

import { BuildingType, ENTITY_CONFIG } from './entityConfig';
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
 */
export const BUILDING_PLACEMENT_CONFIG: Record<BuildingType, BuildingPlacementConfig> = {
    warehouse: {
        // Warehouses need flat, stable ground - grass, dirt, farmland
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.FARMLAND],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/warehouse.png',
        unlocked: true  // Default unlocked for testing
    },
    barracks: {
        // Barracks more versatile - can be built on grass, dirt, stone
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/barracks.png',
        unlocked: true
    },
    tower: {
        // Towers need solid foundation - grass or stone preferred
        allowedTerrain: [TileType.GRASS, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/tower.png',
        unlocked: true
    }
};

/**
 * Get full building configuration (combines ENTITY_CONFIG + placement config)
 * @param buildingType - Type of building to get config for
 * @returns Complete building configuration with stats and placement rules
 */
export function getBuildingConfig(buildingType: BuildingType) {
    return {
        ...ENTITY_CONFIG.BUILDINGS[buildingType],
        ...BUILDING_PLACEMENT_CONFIG[buildingType]
    };
}
