/**
 * Spawn Configuration System
 * Defines all configuration interfaces for entity spawning across levels
 * Supports both procedural and handmade level designs
 */

import { TileType } from '../../world/TileSystem';

/**
 * Queen spawn configuration
 */
export interface QueenSpawnConfig {
    position: { x: number; y: number };
    factionId: string;
}

/**
 * Ant cluster spawn configuration
 * Defines a group of ants to spawn together
 */
export interface AntClusterConfig {
    center: { x: number; y: number };
    count: number;
    radius: number;
    factionId: string;
    jobDistribution: {
        builder?: number;    // Percentage (0-1)
        gatherer?: number;   // Percentage (0-1)
        scout?: number;      // Percentage (0-1)
        warrior?: number;    // Percentage (0-1)
    };
}

/**
 * Resource vein spawn configuration
 * Uses Perlin noise to create natural-looking resource veins
 */
export interface ResourceVeinConfig {
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    resourceType: string; // 'food', 'wood', 'stone', etc.
    noiseLayer: string;   // Name of noise layer to use
    threshold: {
        min: number;        // Minimum noise value (0-1)
        max: number;        // Maximum noise value (0-1)
    };
    density: number;        // Spawn probability (0-1)
}

/**
 * Enemy nest spawn configuration
 * Defines a boss with surrounding ants
 */
export interface EnemyNestConfig {
    center: { x: number; y: number };
    patrolPath?: Array<{ x: number; y: number }>; // Optional patrol points for boss
    bossType: string;     // 'scorpion', 'spider', etc.
    antCount: number;     // Number of enemy ants around nest
    factionId: string;
}

/**
 * Decoration spawn configuration
 * Scatter decorative elements across the map
 */
export interface DecorationConfig {
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    decorationType: string; // 'grass', 'rocks', 'flowers', etc.
    density: number;         // Spawn probability (0-1)
    allowedTileTypes: string[]; // Only spawn on these tile types
}

/**
 * Safe zone configuration
 * Area where enemies cannot spawn initially
 */
export interface SafeZoneConfig {
    center: { x: number; y: number };
    radius: number;
    duration?: number; // Optional: seconds before safe zone expires (-1 = permanent)
}

/**
 * Spawn constraints for validation
 * Defines rules for where entities can spawn
 */
export interface SpawnConstraints {
    allowedTileTypes: TileType[];  // Tiles entity can spawn on
    minDistanceFromEntities?: number; // Minimum distance from other entities
    minDistanceFromType?: {      // Minimum distance from specific entity types
        [entityType: string]: number;
    };
    noiseThreshold?: {           // Perlin noise requirements
        layer: string;
        min: number;
        max: number;
    };
}

/**
 * Noise layer configuration
 * Each layer is an independent Perlin noise generator
 */
export interface NoiseLayers {
    resources: {
        scale: number;
        seed?: number;
    };
    enemies: {
        scale: number;
        seed?: number;
    };
    decorations: {
        scale: number;
        seed?: number;
    };
}

/**
 * Enemy wave configuration
 * Defines progression of enemy waves over time
 */
export interface WaveConfig {
    waveNumber: number;
    delay: number;           // Seconds before wave spawns
    antCount: number;
    hasBoss: boolean;
    spawnRadius: number;     // Distance from safe zone edge
}

/**
 * Complete spawn configuration for a level
 * This is the top-level config that defines all spawning behavior
 */
export interface SpawnConfig {
    // Queen
    queen: QueenSpawnConfig;
    
    // Starter ants around Queen
    starterAnts: {
        builders: number;
        gatherers: number;
        scouts: number;
    };
    
    // Additional ant clusters
    antClusters?: AntClusterConfig[];
    
    // Resources
    resourceVeins: ResourceVeinConfig[];
    
    // Enemies
    enemyNests: EnemyNestConfig[];
    
    // Decorations
    decorations?: DecorationConfig[];
    
    // Safe zone
    safeZone: SafeZoneConfig;
    
    // Noise layers
    noiseLayers: NoiseLayers;
    
    // Enemy waves (optional)
    waves?: {
        enabled: boolean;
        baseDelay: number;        // Seconds between waves
        baseAntCount: number;     // Starting ant count
        antCountMultiplier: number; // Multiplier per wave
        bossInterval: number;     // Add boss every N waves
    };
}

/**
 * Default spawn configuration for standard gameplay
 */
export const DEFAULT_SPAWN_CONFIG: SpawnConfig = {
    queen: {
        position: { x: 50, y: 50 },
        factionId: 'player'
    },
    
    starterAnts: {
        builders: 1,
        gatherers: 2,
        scouts: 1
    },
    
    antClusters: [],
    
    resourceVeins: [
        {
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            resourceType: 'food',
            noiseLayer: 'resources',
            threshold: { min: 0.6, max: 1.0 },
            density: 0.005
        },
        {
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            resourceType: 'wood',
            noiseLayer: 'resources',
            threshold: { min: 0.3, max: 0.6 },
            density: 0.005
        },
        {
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            resourceType: 'stone',
            noiseLayer: 'resources',
            threshold: { min: 0.3, max: 0.6 },
            density: 0.005
        },
        {
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            resourceType: 'magicCrystal',
            noiseLayer: 'resources',
            threshold: { min: 0.3, max: 0.6 },
            density: 0.002
        },
    ],
    
    enemyNests: [
        {
            center: { x: 80, y: 80 },
            bossType: 'spider',
            antCount: 0,
            factionId: 'enemy'
        }
    ],
    
    decorations: [
        {
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            decorationType: 'grass',
            density: 0.1,
            allowedTileTypes: ['grass']
        }
    ],
    
    safeZone: {
        center: { x: 50, y: 50 },
        radius: 20,
        duration: -1 // Permanent
    },
    
    noiseLayers: {
        resources: {
            scale: 0.0,
            seed: 12345
        },
        enemies: {
            scale: 0.0,
            seed: 54321
        },
        decorations: {
            scale: 0.0,
            seed: 99999
        }
    },
    
    waves: {
        enabled: false,
        baseDelay: 120,           // 2 minutes
        baseAntCount: 3,
        antCountMultiplier: 1.5,
        bossInterval: 3           // Boss every 3 waves
    }
};
