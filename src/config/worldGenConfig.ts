/**
 * World Generation Configuration
 * Settings for procedural terrain generation
 */

import { TileType } from '../world/TileSystem';

/**
 * Tile distribution threshold configuration
 * Each entry represents: [maxThreshold, tileType]
 * Thresholds should be in ascending order from 0.0 to 1.0
 */
export interface TileThreshold {
    threshold: number;      // Max normalized noise value for this tile (0.0 - 1.0)
    tileType: TileType;     // Tile type to generate
    enabled: boolean;       // Whether this tile type is active
}

/**
 * World generation configuration
 */
export interface WorldGenConfig {
    noiseScale: number;
    tileThresholds: TileThreshold[];
}

/**
 * Default world generation configuration
 * Matches the current hardcoded values in WorldGenerator
 */
export const DEFAULT_WORLD_GEN_CONFIG: WorldGenConfig = {
    noiseScale: 0.15,
    tileThresholds: [
        { threshold: 0.40, tileType: TileType.WATER, enabled: true },   // 0.00 - 0.40 (40%)
        { threshold: 0.50, tileType: TileType.SAND, enabled: true },    // 0.40 - 0.50 (10%)
        { threshold: 0.65, tileType: TileType.GRASS, enabled: true },   // 0.50 - 0.65 (15%)
        { threshold: 0.75, tileType: TileType.DIRT, enabled: true },    // 0.65 - 0.75 (10%)
        { threshold: 0.99, tileType: TileType.STONE, enabled: true },   // 0.75 - 0.99 (24%)
        { threshold: 1.00, tileType: TileType.MOSS, enabled: true }     // 0.99 - 1.00 (1%)
    ]
};

/**
 * Available tile types for world generation
 * (Excluding special tiles like cave walls, farmland, etc.)
 */
export const AVAILABLE_WORLD_GEN_TILES = [
    TileType.GRASS,
    TileType.DIRT,
    TileType.STONE,
    TileType.SAND,
    TileType.WATER,
    TileType.MOSS
];
