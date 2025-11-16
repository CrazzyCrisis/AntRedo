/**
 * Water Particle Effect Configuration
 * Swimming particles, water splashes, drowning effects
 */

import { MotionPatternName } from './particleMotionPatterns';

export const WATER_PARTICLE_CONFIG = {
    // Appearance
    size: {
        min: 2,                 // Minimum particle size (pixels)
        max: 4,                 // Maximum particle size (pixels)
        variance: 0.5           // Size variance (0-1, how much variation)
    },
    
    shape: 'circle' as const,   // 'circle' | 'square' | 'diamond' (future shapes)
    
    // Color and transparency
    color: '#3366CC',           // Base water blue color
    colorVariance: 0.1,         // Color hue variance (0-1)
    alphaStart: 0.8,            // Starting opacity (0-1)
    alphaEnd: 0,                // Ending opacity (0-1)
    
    // Lifetime and spawning
    lifetime: {
        min: 600,               // Minimum lifetime (ms)
        max: 1000,              // Maximum lifetime (ms)
    },
    spawnRate: 5,               // Particles per second per entity
    spawnRadius: 8,             // Random spawn offset radius (pixels)
    
    // Motion
    motionPattern: 'BUBBLE_FLOAT' as MotionPatternName,
    speed: {
        min: 15,                // Minimum movement speed (pixels/second)
        max: 25                 // Maximum movement speed (pixels/second)
    },
    
    // Advanced motion (can override pattern)
    drift: {
        enabled: true,
        horizontal: 5,          // Horizontal drift amount (pixels)
        vertical: -20           // Vertical drift amount (negative = upward)
    }
} as const;

/**
 * Cave water particles (darker, slower)
 */
export const CAVE_WATER_PARTICLE_CONFIG = {
    ...WATER_PARTICLE_CONFIG,
    color: '#224488',           // Darker blue
    lifetime: {
        min: 700,
        max: 1200
    },
    speed: {
        min: 10,
        max: 18
    },
    alphaStart: 0.6             // More transparent
} as const;

/**
 * Water splash effect (burst of particles)
 */
export const WATER_SPLASH_CONFIG = {
    particleCount: 8,           // Number of particles in splash
    size: {
        min: 3,
        max: 6
    },
    color: '#5588DD',
    lifetime: {
        min: 300,
        max: 500
    },
    motionPattern: 'BURST_OUTWARD' as MotionPatternName,
    speed: {
        min: 40,
        max: 80
    }
} as const;
