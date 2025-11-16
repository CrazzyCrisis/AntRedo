/**
 * DevRoom Spawn Configuration
 * Controls entity spawning in the dev room for testing
 */

export const DEV_ROOM_SPAWN_CONFIG = {
    // Enable/disable spawning systems
    SPAWNING: {
        ENEMY_BUILDINGS: false,     // Spawn enemy buildings that produce ants
        RESOURCES: true,            // Spawn resources (food, wood, stone, etc.)
        ENEMIES: true,              // Spawn enemy entities (bosses, ants)
        WAVES: false                // Enable wave-based enemy spawning
    },

    // Level generation settings
    LEVEL: {
        DIFFICULTY: 'easy' as 'easy' | 'medium' | 'hard',
        RESOURCE_ABUNDANCE: 'scarce' as 'scarce' | 'normal' | 'abundant',
        ENEMY_DENSITY: 'low' as 'low' | 'medium' | 'high' | 'extreme',
        SAFE_ZONE_DURATION: 9999,   // Seconds before enemies can spawn near player (9999 = effectively infinite)
    },

    // Starting entities
    STARTER_UNITS: {
        BUILDERS: 1,
        GATHERERS: 0,
        SCOUTS: 0,
        WARRIORS: 0
    }
} as const;
