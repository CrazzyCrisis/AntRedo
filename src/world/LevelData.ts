import { SpawnConfig } from '../config/gameplay/spawnConfig';
import { WorldGenConfig } from '../config/world/worldGenConfig';
import { TileType } from './TileSystem';

/**
 * Complete level data structure
 * Contains all information needed to generate and spawn a level
 */
export interface LevelData {
    // Metadata
    name: string;
    description?: string;
    author?: string;
    version: string;
    
    // World generation
    worldSize: {
        width: number;
        height: number;
    };
    worldGenConfig: WorldGenConfig;
    worldSeed?: number; // Seed for world generation (separate from spawn seeds)
    
    // Entity spawning
    spawnConfig: SpawnConfig;
    
    // Procedural generation
    isProcedural: boolean;
}

/**
 * Validation result for level data
 */
export interface LevelDataValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Level data manager
 * Handles loading, saving, and validation of level data
 */
export class LevelDataManager {
    /**
     * Save level data to JSON file
     */
    static save(levelData: LevelData, filePath: string): void {
        try {
            const jsonData = JSON.stringify(levelData, null, 2);
            
            // Browser environment - trigger download
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filePath.split('/').pop() || 'level.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            throw new Error(`Failed to save level data: ${error}`);
        }
    }



    /**
     * Load level data from JSON file
     */
    static async load(filePath: string): Promise<LevelData> {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const levelData = await response.json() as LevelData;
            
            // Validate loaded data
            const validation = this.validate(levelData);
            if (!validation.valid) {
                throw new Error(`Invalid level data: ${validation.errors.join(', ')}`);
            }
            
            return levelData;
        } catch (error) {
            throw new Error(`Failed to load level data: ${error}`);
        }
    }

    /**
     * Validate level data integrity
     */
    static validate(levelData: LevelData): LevelDataValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required fields
        if (!levelData.name) {
            errors.push('Level name is required');
        }
        
        if (!levelData.version) {
            errors.push('Level version is required');
        }

        // Validate world size
        if (!levelData.worldSize || levelData.worldSize.width <= 0 || levelData.worldSize.height <= 0) {
            errors.push('Invalid world size');
        }

        // Validate world gen config
        if (!levelData.worldGenConfig) {
            errors.push('World generation config is required');
        }

        // Validate spawn config
        if (!levelData.spawnConfig) {
            errors.push('Spawn config is required');
        } else {
            // Validate queen spawn
            if (!levelData.spawnConfig.queen) {
                errors.push('Queen spawn config is required');
            } else {
                const queen = levelData.spawnConfig.queen;
                if (queen.position.x < 0 || queen.position.x >= levelData.worldSize.width ||
                    queen.position.y < 0 || queen.position.y >= levelData.worldSize.height) {
                    errors.push('Queen spawn position is outside world bounds');
                }
            }

            // Validate starter ants
            if (!levelData.spawnConfig.starterAnts) {
                errors.push('Starter ants config is required');
            }

            // Validate safe zone
            if (!levelData.spawnConfig.safeZone) {
                errors.push('Safe zone config is required');
            } else {
                if (levelData.spawnConfig.safeZone.radius <= 0) {
                    errors.push('Safe zone radius must be positive');
                }
            }

            // Validate noise layers
            if (!levelData.spawnConfig.noiseLayers) {
                errors.push('Noise layers config is required');
            }

            // Warnings
            if (levelData.spawnConfig.resourceVeins.length === 0) {
                warnings.push('No resource veins defined - level may be unplayable');
            }

            if (levelData.spawnConfig.enemyNests.length === 0) {
                warnings.push('No enemy nests defined - level may be too easy');
            }
        }

        // Validate procedural generation
        if (levelData.isProcedural && !levelData.worldSeed) {
            warnings.push('Procedural level without seed - will use random worldSeed');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Create a default level data structure
     */
    static createDefault(name: string, worldSize: { width: number; height: number }): LevelData {
        return {
            name,
            description: 'A default level',
            version: '1.0.0',
            worldSize,
            isProcedural: false,
            worldGenConfig: {
                noiseScale: 0.15,
                tileThresholds: [
                    { threshold: 0.40, tileType: TileType.WATER, enabled: true, priority: 50 },
                    { threshold: 0.50, tileType: TileType.SAND, enabled: true, priority: 44 },
                    { threshold: 0.65, tileType: TileType.GRASS, enabled: true, priority: 25 },
                    { threshold: 0.75, tileType: TileType.DIRT, enabled: true, priority: 12 },
                    { threshold: 0.99, tileType: TileType.STONE, enabled: true, priority: 6 },
                    { threshold: 1.00, tileType: TileType.MOSS, enabled: true, priority: 37 }
                ]
            },
            worldSeed: Math.floor(Math.random() * 1000000),
            spawnConfig: {
                queen: {
                    position: { x: worldSize.width / 2, y: worldSize.height / 2 },
                    factionId: 'player'
                },
                starterAnts: {
                    builders: 3,
                    gatherers: 2,
                    scouts: 2
                },
                resourceVeins: [],
                enemyNests: [],
                safeZone: {
                    center: { x: worldSize.width / 2, y: worldSize.height / 2 },
                    radius: 20
                },
                noiseLayers: {
                    resources: { scale: 0.05 },
                    enemies: { scale: 0.08 },
                    decorations: { scale: 0.1 }
                }
            }
        };
    }

    /**
     * Create a procedural level from seed
     */
    static createProcedural(
        name: string,
        seed: number,
        worldSize: { width: number; height: number }
    ): LevelData {
        const levelData = this.createDefault(name, worldSize);
        levelData.isProcedural = true;
        levelData.worldSeed = seed;
        
        // Use seed to generate noise layer seeds
        levelData.spawnConfig.noiseLayers.resources.seed = seed;
        levelData.spawnConfig.noiseLayers.enemies.seed = seed + 1000;
        levelData.spawnConfig.noiseLayers.decorations.seed = seed + 2000;
        
        return levelData;
    }
}
