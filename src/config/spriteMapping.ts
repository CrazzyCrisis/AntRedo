/**
 * Sprite Mapping Configuration
 * Maps TileType enum values and entity types to sprite file paths
 * SINGLE SOURCE OF TRUTH for all sprite paths
 */

import { TileType } from '../world/TileSystem';

/**
 * Base path for tile sprites
 */
export const TILE_SPRITE_BASE_PATH = 'assets/images/16x16 Tiles/';

/**
 * Maps TileType to sprite filename
 * Filenames match the actual PNG files in assets/images/16x16 Tiles/
 */
export const TILE_SPRITE_MAP: Record<TileType, string> = {
    [TileType.GRASS]: 'grass.png',
    [TileType.DIRT]: 'dirt.png',
    [TileType.STONE]: 'stone.png',
    [TileType.SAND]: 'sand.png',
    [TileType.SAND_DARK]: 'sand_dark.png',
    [TileType.WATER]: 'water.png',
    [TileType.FARMLAND]: 'farmland.png',
    [TileType.MOSS]: 'moss.png',
    [TileType.PEBBLE_1]: 'pebble_1.png',
    [TileType.PEBBLE_2]: 'pebble_2.png',
    [TileType.PEBBLE_3]: 'pebble_3.png',
    [TileType.CAVE_FLOOR]: 'cave_1.png',      // Using cave_1 as default floor
    [TileType.CAVE_WALL]: 'cave_extraDark.png', // Dark cave walls
    [TileType.CAVE_DIRT]: 'cave_dirt.png',
    [TileType.CAVE_DARK]: 'cave_3.png',        // Very dark cave areas
    [TileType.CAVE_WATER]: 'water_cave.png',
    [TileType.ANTHILL]: 'anthill.png'
};

/**
 * Gets the full sprite path for a tile type
 */
export function getTileSpritePath(tileType: TileType): string {
    return TILE_SPRITE_BASE_PATH + TILE_SPRITE_MAP[tileType];
}

/**
 * Available sprite files for reference
 * Useful for debugging and validation
 */
export const AVAILABLE_SPRITES = [
    'anthill.png',
    'cave_1.png',
    'cave_2.png',
    'cave_3.png',
    'cave_dirt.png',
    'cave_extraDark.png',
    'dirt.png',
    'farmland.png',
    'grass.png',
    'moss.png',
    'pebble_1.png',
    'pebble_2.png',
    'pebble_3.png',
    'sand.png',
    'sand_dark.png',
    'stone.png',
    'water.png',
    'water_cave.png'
] as const;

/**
 * Alternate cave sprites for variety
 * Can be used for random variation in cave generation
 */
export const CAVE_VARIANTS = {
    FLOOR: ['cave_1.png', 'cave_2.png'],
    WALL: ['cave_extraDark.png', 'cave_3.png']
} as const;

// ============================================================================
// ENTITY SPRITE CONFIGURATION
// ============================================================================

/**
 * Base paths for entity sprites
 */
export const ENTITY_SPRITE_PATHS = {
    CREATURES_BASE: 'assets/images/creatures/',
    TILES_BASE: 'assets/images/16x16 Tiles/'
} as const;

/**
 * Entity sprite mappings
 * SINGLE SOURCE OF TRUTH for entity sprite paths
 */
export const ENTITY_SPRITES = {
    // Creatures
    ant: 'creatures/ants/gray_ant.png',
    queen: 'creatures/ants/gray_ant_queen.png',
    boss: 'creatures/spider/spider.png',
    
    // Buildings
    building: '16x16 Tiles/anthill.png',
    
    // Resources
    resources: {
        food: 'resources/mapleLeaf.png',
        wood: 'resources/twig_1.png',
        stone: 'resources/stone.png',
        magicCrystal: 'resources/leaf.png'
    }
} as const;

/**
 * Get full sprite path for entity
 */
export function getEntitySpritePath(spritePath: string): string {
    return 'assets/images/' + spritePath;
}
