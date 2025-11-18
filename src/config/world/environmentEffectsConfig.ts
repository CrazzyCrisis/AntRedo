/**
 * Environment Effects Configuration
 * Damage from hazardous tiles, swimming effects, etc.
 */

import { TileType } from '../../world/TileSystem';

/**
 * Water/Swimming Effect Configuration
 */
export const WATER_EFFECT_CONFIG = {
    // Damage over time
    damagePerSecond: 5,         // Health lost per second in water
    damageInterval: 1000,        // Apply damage every 1000ms
    
    // Visual effects
    sinkDepth: 4,                // Pixels to sink into water
    
    // Particle effects
    particles: {
        enabled: true,
        spawnRate: 5,            // Particles per second
        color: '#3366CC',        // Water blue color
        lifetime: 800,           // Particle lifetime in ms
        spreadRadius: 8,         // How far particles spread
        floatSpeed: 20,          // Upward float speed (pixels/second)
        fadeStart: 0.5           // When to start fading (0-1)
    },
    
    // Sound effects
    sound: {
        enabled: true,
        splashOnEnter: 'water_splash.wav',
        swimLoop: 'water_swim.wav',
        loopVolume: 0.3
    }
} as const;

/**
 * Hazardous tile configurations
 * Maps tile types to their damage effects
 */
export const HAZARDOUS_TILES = {
    [TileType.WATER]: {
        damagePerSecond: 5,
        damageInterval: 1000,
        effectType: 'drowning' as const
    },
    [TileType.CAVE_WATER]: {
        damagePerSecond: 7,      // Cave water is more dangerous
        damageInterval: 1000,
        effectType: 'drowning' as const
    }
    // Add more hazardous tiles here (lava, poison, etc.)
} as const;

/**
 * Swimming particle colors by tile type
 */
export const TILE_PARTICLE_COLORS: Record<number, string> = {
    [TileType.WATER]: '#3366CC',        // Blue
    [TileType.CAVE_WATER]: '#224488'    // Darker blue
};
