/**
 * Entity Configuration - Single Source of Truth
 * All entity stats, behaviors, and numeric values centralized here
 * Config-First Philosophy: NO hardcoded values in code
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AntJobType = 'gatherer' | 'builder' | 'warrior' | 'scout';
export type QueenPowerType = 'lightning' | 'fireball' | 'blackhole' | 'tidalwave' | 'finalFlash';
export type ResourceType = 'food' | 'wood' | 'stone' | 'magicCrystal';
export type BuildingType = 'warehouse' | 'barracks' | 'tower';
export type PriorityTask = 'queenCommand' | 'gathering' | 'building' | 'combat' | 'scouting' | 'healing' | 'idle';

// ============================================================================
// ANT CONFIGURATION
// ============================================================================

interface AntJobConfig {
    health: number;
    speed: number;
    visionRange: number;
    attackDamage?: number;      // Optional: Only for combat ants
    gatherRate?: number;         // Optional: Only for gatherers
    buildSpeed?: number;         // Optional: Only for builders
}

interface AntConfig {
    JOBS: Record<AntJobType, AntJobConfig>;
    JOB_PRIORITIES: Record<AntJobType, PriorityTask[]>;
    HUNGER: {
        MAX: number;
        DEPLETION_RATE: number;      // Per second
        DEATH_THRESHOLD: number;
        CRITICAL_THRESHOLD: number;
    };
    SMELL_RANGE: number;             // How far ants can smell resources
}

const ANT: AntConfig = {
    JOBS: {
        gatherer: {
            health: 50,
            speed: 2.5,
            visionRange: 5,
            attackDamage: 2,
            gatherRate: 1.0       // Resources per second
        },
        builder: {
            health: 60,
            speed: 2.0,
            visionRange: 4,
            attackDamage: 3,
            buildSpeed: 1.5       // Construction progress per second
        },
        warrior: {
            health: 80,
            speed: 3.0,
            visionRange: 6,
            attackDamage: 15
        },
        scout: {
            health: 40,
            speed: 4.5,           // Fastest ant type
            visionRange: 8,       // Widest vision range
            attackDamage: 5
        }
    },

    // Priority arrays: Earlier = higher priority, queen command always first
    JOB_PRIORITIES: {
        gatherer: ['queenCommand', 'gathering', 'combat', 'idle'],
        builder: ['queenCommand', 'building', 'combat', 'idle'],
        warrior: ['queenCommand', 'combat', 'scouting', 'idle'],
        scout: ['queenCommand', 'scouting', 'combat', 'gathering', 'idle']
    },

    HUNGER: {
        MAX: 100,
        DEPLETION_RATE: 0.1,          // 10% per 100 seconds = ~16 minutes to starve
        DEATH_THRESHOLD: 0,           // Die when hunger reaches 0
        CRITICAL_THRESHOLD: 20        // Show warning/urgent gathering below 20%
    },

    SMELL_RANGE: 10                   // Grid tiles - ants can smell resources this far
};

// ============================================================================
// QUEEN CONFIGURATION
// ============================================================================

interface QueenPowerLevel {
    damage: number;
    radius?: number;          // AOE radius
    range?: number;           // Cast range
    knockback?: number;       // Knockback force
    duration?: number;        // Effect duration (seconds)
    boltCount?: number;       // Number of lightning bolts
    pullStrength?: number;    // Blackhole pull force
    pushStrength?: number;    // Tidalwave push force
}

interface QueenPowerConfig {
    cooldown: number;         // Seconds between uses
    levels: [QueenPowerLevel, QueenPowerLevel, QueenPowerLevel];  // 3 levels
}

interface QueenConfig {
    health: number;
    speed: number;
    commandRadius: number;    // How far queen commands reach
    POWERS: Record<QueenPowerType, QueenPowerConfig>;
    KEYBINDS: Record<QueenPowerType, string>;
}

const QUEEN: QueenConfig = {
    health: 500,
    speed: 3.5,
    commandRadius: 15,        // Grid tiles

    POWERS: {
        lightning: {
            cooldown: 5,      // 5 second cooldown
            levels: [
                { damage: 50, radius: 3, knockback: 5, boltCount: 3, duration: 2 },     // Level 1: 3 bolts, 2s soot
                { damage: 100, radius: 4, knockback: 8, boltCount: 5, duration: 3 },    // Level 2: 5 bolts, 3s soot
                { damage: 200, radius: 5, knockback: 12, boltCount: 8, duration: 4 }    // Level 3: 8 bolts, 4s soot
            ]
        },
        fireball: {
            cooldown: 7,
            levels: [
                { damage: 75, radius: 2, range: 10, duration: 3 },        // Level 1: Burn 3s
                { damage: 150, radius: 3, range: 12, duration: 4 },       // Level 2: Burn 4s
                { damage: 300, radius: 4, range: 15, duration: 5 }        // Level 3: Burn 5s
            ]
        },
        blackhole: {
            cooldown: 10,
            levels: [
                { damage: 30, radius: 4, pullStrength: 3, duration: 3 },  // Level 1: Pull + damage
                { damage: 60, radius: 5, pullStrength: 5, duration: 4 },  // Level 2
                { damage: 120, radius: 6, pullStrength: 8, duration: 5 }  // Level 3
            ]
        },
        tidalwave: {
            cooldown: 8,
            levels: [
                { damage: 40, radius: 6, pushStrength: 10, range: 8 },    // Level 1: Wide push
                { damage: 80, radius: 7, pushStrength: 15, range: 10 },   // Level 2
                { damage: 160, radius: 8, pushStrength: 20, range: 12 }   // Level 3
            ]
        },
        finalFlash: {
            cooldown: 30,     // Ultimate ability - long cooldown
            levels: [
                { damage: 500, radius: 10, knockback: 20, range: 20 },    // Level 1: Massive damage
                { damage: 750, radius: 12, knockback: 25, range: 25 },    // Level 2
                { damage: 1000, radius: 15, knockback: 30, range: 30 }    // Level 3: Screen-wide devastation
            ]
        }
    },

    KEYBINDS: {
        lightning: 'Q',
        fireball: 'W',
        blackhole: 'E',
        tidalwave: 'R',
        finalFlash: 'T'
    }
};

// ============================================================================
// BOSS CONFIGURATION
// ============================================================================

interface BossConfig {
    health: number;
    speed: number;
    patrolSpeed: number;
    attackDamage: number;
    attackRange: number;
    VISION: {
        coneAngle: number;        // Degrees
        coneDistance: number;     // Grid tiles
    };
    PROJECTILE: {
        speed: number;
        damage: number;
        fireCooldown: number;     // Seconds between shots
        HOMING: {
            turnSpeed: number;    // Degrees per frame
            homingRange: number;  // Max distance to track target
        };
    };
}

const BOSS: BossConfig = {
    health: 1000,
    speed: 2.0,
    patrolSpeed: 1.0,
    attackDamage: 25,
    attackRange: 2,           // Melee range in grid tiles

    VISION: {
        coneAngle: 90,        // 90-degree cone
        coneDistance: 12      // See 12 tiles ahead
    },

    PROJECTILE: {
        speed: 4.0,
        damage: 30,
        fireCooldown: 2,      // Shoot every 2 seconds

        HOMING: {
            turnSpeed: 3,     // 3 degrees per frame
            homingRange: 15   // Stop tracking beyond 15 tiles
        }
    }
};

// ============================================================================
// RESOURCE CONFIGURATION
// ============================================================================

interface ResourceConfig {
    stackAmount: number;      // How much resource per stack
    collisionSize: number;    // Collision box size
    smellRange: number;       // How far ants can smell this resource
}

const RESOURCES: Record<ResourceType, ResourceConfig> = {
    food: {
        stackAmount: 10,
        collisionSize: 16,
        smellRange: 8
    },
    wood: {
        stackAmount: 5,
        collisionSize: 20,
        smellRange: 6
    },
    stone: {
        stackAmount: 5,
        collisionSize: 20,
        smellRange: 6
    },
    magicCrystal: {
        stackAmount: 1,       // Rare resource - small stacks
        collisionSize: 12,
        smellRange: 10        // Wider smell range to make them findable
    }
};

// ============================================================================
// BUILDING CONFIGURATION
// ============================================================================

interface BuildingLevel {
    health: number;
    antCapBonus?: number;         // Additional ant cap for this level
    productionRate?: number;      // Resource production multiplier
    statBoost?: {
        antDamage?: number;       // Barracks: Bonus damage for ants
        antSpeed?: number;        // Barracks: Bonus speed
        storageCapacity?: number; // Warehouse: Bonus storage
    };
}

interface BuildingConfig {
    size: { width: number; height: number };  // Variable building sizes
    costs: { wood: number; stone: number };
    constructionTime: number;                  // Seconds to build
    levels: [BuildingLevel, BuildingLevel, BuildingLevel];  // 3 levels
}

const BUILDINGS: Record<BuildingType, BuildingConfig> = {
    warehouse: {
        size: { width: 3, height: 3 },
        costs: { wood: 20, stone: 10 },
        constructionTime: 30,
        levels: [
            { health: 200, antCapBonus: 5, statBoost: { storageCapacity: 100 } },
            { health: 400, antCapBonus: 10, statBoost: { storageCapacity: 200 } },
            { health: 600, antCapBonus: 15, statBoost: { storageCapacity: 300 } }
        ]
    },
    barracks: {
        size: { width: 2, height: 2 },
        costs: { wood: 15, stone: 15 },
        constructionTime: 25,
        levels: [
            { health: 150, antCapBonus: 3, statBoost: { antDamage: 2, antSpeed: 0.2 } },
            { health: 300, antCapBonus: 6, statBoost: { antDamage: 5, antSpeed: 0.5 } },
            { health: 450, antCapBonus: 9, statBoost: { antDamage: 10, antSpeed: 1.0 } }
        ]
    },
    tower: {
        size: { width: 1, height: 1 },
        costs: { wood: 10, stone: 20 },
        constructionTime: 20,
        levels: [
            { health: 100, productionRate: 1.2 },      // 20% production boost
            { health: 200, productionRate: 1.5 },      // 50% production boost
            { health: 300, productionRate: 2.0 }       // 100% production boost (double)
        ]
    }
};

// ============================================================================
// EXPORTED CONFIGURATION
// ============================================================================

export const ENTITY_CONFIG = {
    ANT,
    QUEEN,
    BOSS,
    RESOURCES,
    BUILDINGS
} as const;
