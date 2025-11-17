import { SpawnConstraints } from '../config/gameplay/spawnConfig';
import { PerlinNoise } from '../utils/PerlinNoise';
import { TileType } from '../world/TileSystem';

/**
 * Cluster types for entity spawning
 */
export enum ClusterType {
    SINGLE = 'single',           // Single entity
    SMALL = 'small',             // 2-5 entities in tight group
    MEDIUM = 'medium',           // 5-10 entities in loose group
    LARGE = 'large',             // 10-20 entities spread out
    RADIAL = 'radial',           // Circular pattern around center
    POISSON = 'poisson',         // Evenly distributed (Poisson disk)
    NOISE = 'noise'              // Follow Perlin noise patterns
}

/**
 * Validation result from spawn checks
 */
export interface ValidationResult {
    valid: boolean;
    reason?: string;
}

/**
 * Spawn rule defining how and where an entity type can spawn
 */
export interface SpawnRule {
    entityType: string;
    probability: number;         // 0-1 chance to spawn
    clusterType: ClusterType;
    constraints: SpawnConstraints;
}

/**
 * Helper functions for spawn validation
 */
export class SpawnRuleValidator {
    /**
     * Check if a position is valid for spawning based on constraints
     */
    static canSpawnAt(
        x: number,
        y: number,
        constraints: SpawnConstraints,
        tileGrid: any,
        entityManager: any,
        noiseGen?: PerlinNoise
    ): ValidationResult {
        // Validate tile type
        const tileValidation = this.validateTileType(x, y, constraints, tileGrid);
        if (!tileValidation.valid) {
            return tileValidation;
        }

        // Validate minimum distance from entities
        if (constraints.minDistanceFromEntities !== undefined) {
            const distanceValidation = this.validateMinDistance(
                x, y,
                constraints.minDistanceFromEntities,
                entityManager
            );
            if (!distanceValidation.valid) {
                return distanceValidation;
            }
        }

        // Validate minimum distance from specific entity types
        if (constraints.minDistanceFromType) {
            const typeDistanceValidation = this.validateMinDistanceFromType(
                x, y,
                constraints.minDistanceFromType,
                entityManager
            );
            if (!typeDistanceValidation.valid) {
                return typeDistanceValidation;
            }
        }

        // Validate Perlin noise threshold
        if (constraints.noiseThreshold && noiseGen) {
            const noiseValidation = this.validateNoiseThreshold(
                x, y,
                constraints.noiseThreshold,
                noiseGen
            );
            if (!noiseValidation.valid) {
                return noiseValidation;
            }
        }

        return { valid: true };
    }

    /**
     * Validate tile type at position
     */
    private static validateTileType(
        x: number,
        y: number,
        constraints: SpawnConstraints,
        tileGrid: any
    ): ValidationResult {
        // Coordinates are already in grid space
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);

        // Check grid bounds
        if (!tileGrid || !tileGrid[gridY] || !tileGrid[gridY][gridX]) {
            console.warn(`[SpawnRule] Position (${x}, ${y}) -> grid (${gridX}, ${gridY}) is out of bounds (grid height: ${tileGrid?.length || 0}, width: ${tileGrid?.[0]?.length || 0})`);
            return {
                valid: false,
                reason: `Position (${x}, ${y}) is out of bounds`
            };
        }

        const tile = tileGrid[gridY][gridX];
        const tileType = tile.type !== undefined ? tile.type : tile;

        // Check if tile type is allowed
        if (!constraints.allowedTileTypes.includes(tileType)) {
            return {
                valid: false,
                reason: `Tile type '${tileType}' not in allowed types: ${constraints.allowedTileTypes.join(', ')}`
            };
        }

        return { valid: true };
    }

    /**
     * Validate minimum distance from all entities
     */
    private static validateMinDistance(
        x: number,
        y: number,
        minDistance: number,
        entityManager: any
    ): ValidationResult {
        if (!entityManager || !entityManager.getAllEntities) {
            return { valid: true }; // Skip validation if no entity manager
        }

        const entities = entityManager.getAllEntities();
        
        for (const entity of entities) {
            const dx = entity.x - x;
            const dy = entity.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                return {
                    valid: false,
                    reason: `Too close to entity (distance: ${distance.toFixed(1)}, min: ${minDistance})`
                };
            }
        }

        return { valid: true };
    }

    /**
     * Validate minimum distance from specific entity types
     */
    private static validateMinDistanceFromType(
        x: number,
        y: number,
        minDistances: { [entityType: string]: number },
        entityManager: any
    ): ValidationResult {
        if (!entityManager || !entityManager.getEntitiesByType) {
            return { valid: true }; // Skip validation if no entity manager
        }

        for (const [entityType, minDistance] of Object.entries(minDistances)) {
            const entities = entityManager.getEntitiesByType(entityType);
            
            for (const entity of entities) {
                const dx = entity.x - x;
                const dy = entity.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    return {
                        valid: false,
                        reason: `Too close to ${entityType} (distance: ${distance.toFixed(1)}, min: ${minDistance})`
                    };
                }
            }
        }

        return { valid: true };
    }

    /**
     * Validate Perlin noise threshold
     */
    private static validateNoiseThreshold(
        x: number,
        y: number,
        noiseThreshold: { layer: string; min: number; max: number },
        noiseGen: PerlinNoise
    ): ValidationResult {
        // Sample noise at position
        const noiseValue = noiseGen.noise(x, y);

        // Normalize to 0-1 range (Perlin noise is typically -1 to 1)
        const normalizedNoise = (noiseValue + 1) / 2;

        // Check if within threshold range
        if (normalizedNoise < noiseThreshold.min || normalizedNoise > noiseThreshold.max) {
            return {
                valid: false,
                reason: `Noise value ${normalizedNoise.toFixed(2)} outside range [${noiseThreshold.min}, ${noiseThreshold.max}]`
            };
        }

        return { valid: true };
    }

    /**
     * Get default constraints for common entity types
     */
    static getDefaultConstraints(entityType: string): SpawnConstraints {
        switch (entityType) {
            case 'ant':
                return {
                    allowedTileTypes: [TileType.DIRT, TileType.GRASS, TileType.SAND],
                    minDistanceFromEntities: 8
                };
            
            case 'resource':
                return {
                    allowedTileTypes: [TileType.DIRT, TileType.GRASS, TileType.SAND, TileType.STONE],
                    minDistanceFromEntities: 16,
                    minDistanceFromType: {
                        'resource': 8  // Resources should be spaced apart
                    }
                };
            
            case 'decoration':
                return {
                    allowedTileTypes: [TileType.GRASS, TileType.DIRT, TileType.SAND],
                    minDistanceFromEntities: 4
                };
            
            case 'boss':
                return {
                    allowedTileTypes: [TileType.DIRT, TileType.GRASS, TileType.SAND],
                    minDistanceFromEntities: 32,
                    minDistanceFromType: {
                        'queen': 50,  // Bosses far from Queen
                        'boss': 80    // Bosses far from each other
                    }
                };
            
            default:
                return {
                    allowedTileTypes: [TileType.DIRT, TileType.GRASS, TileType.SAND],
                    minDistanceFromEntities: 8
                };
        }
    }
}
