/**
 * LevelLoader - Loads and manages level data
 * 
 * Features:
 * - Load levels from JSON files
 * - Generate procedural levels
 * - Save levels (for editor support)
 * - Level validation
 */

import { SpawnConfig } from '../config/spawnConfig';
import { EventBus, GameEvents } from '../utils/eventBus';

/**
 * Spawn area boundaries
 */
interface SpawnBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * Level metadata for display and organization
 */
export interface LevelMetadata {
    id: string;
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    author?: string;
    version?: number;
    tags?: string[];
}

/**
 * Complete level data structure
 */
export interface LevelData {
    metadata: LevelMetadata;
    spawnConfig: SpawnConfig;
    worldSeed: number;
}

/**
 * Level generation parameters for procedural levels
 */
export interface ProceduralLevelParams {
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    worldSize: { width: number; height: number };
    resourceAbundance: 'scarce' | 'normal' | 'abundant';
    enemyDensity: 'low' | 'medium' | 'high' | 'extreme';
    safeZoneDuration: number; // seconds, -1 = permanent
    wavesEnabled: boolean;
}

/**
 * LevelLoader - Singleton for loading and managing levels
 */
export class LevelLoader {
    private static instance: LevelLoader;
    private loadedLevel: LevelData | null = null;

    private constructor() {}

    public static getInstance(): LevelLoader {
        if (!LevelLoader.instance) {
            LevelLoader.instance = new LevelLoader();
        }
        return LevelLoader.instance;
    }

    /**
     * Load level from JSON file
     * @param path - Path to level JSON file
     * @returns Promise resolving to LevelData
     */
    public async loadLevel(path: string): Promise<LevelData> {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load level: ${response.statusText}`);
            }

            const levelData = await response.json() as LevelData;

            // Validate level data
            this.validateLevelData(levelData);

            // Store loaded level
            this.loadedLevel = levelData;

            console.log(`[LevelLoader] Loaded level: ${levelData.metadata.name}`);
            EventBus.emit(GameEvents.LEVEL_LOAD, levelData.metadata);

            return levelData;

        } catch (error) {
            console.error('[LevelLoader] Failed to load level:', error);
            throw error;
        }
    }

    /**
     * Generate a procedural level with specified parameters
     * @param params - Procedural generation parameters
     * @param seed - World seed (defaults to timestamp)
     * @returns Generated LevelData
     */
    public loadProceduralLevel(
        params: ProceduralLevelParams,
        seed: number = Date.now()
    ): LevelData {
        const worldCenter = {
            x: Math.floor(params.worldSize.width / 2),
            y: Math.floor(params.worldSize.height / 2)
        };

        // Generate spawn config based on difficulty
        const spawnConfig = this.generateSpawnConfig(params, worldCenter);

        // Create level metadata
        const metadata: LevelMetadata = {
            id: `procedural_${seed}`,
            name: `Procedural Level (${params.difficulty})`,
            description: `Procedurally generated ${params.difficulty} level`,
            difficulty: params.difficulty,
            author: 'Procedural Generator',
            version: 1,
            tags: ['procedural', params.difficulty]
        };

        const levelData: LevelData = {
            metadata,
            spawnConfig,
            worldSeed: seed
        };

        this.loadedLevel = levelData;

        console.log(`[LevelLoader] Generated procedural level (seed: ${seed})`);
        EventBus.emit(GameEvents.LEVEL_LOAD, metadata);

        return levelData;
    }

    /**
     * Save level to JSON (for editor support)
     * @param levelData - Level data to save
     * @returns JSON string
     */
    public saveLevel(levelData: LevelData): string {
        try {
            const json = JSON.stringify(levelData, null, 2);
            console.log(`[LevelLoader] Saved level: ${levelData.metadata.name}`);
            return json;
        } catch (error) {
            console.error('[LevelLoader] Failed to save level:', error);
            throw error;
        }
    }

    /**
     * Get currently loaded level
     * @returns Current LevelData or null
     */
    public getCurrentLevel(): LevelData | null {
        return this.loadedLevel;
    }

    /**
     * Clear loaded level
     */
    public clearLevel(): void {
        this.loadedLevel = null;
        console.log('[LevelLoader] Cleared loaded level');
    }

    /**
     * Validate level data structure
     * @param levelData - Level data to validate
     * @throws Error if validation fails
     */
    private validateLevelData(levelData: LevelData): void {
        // Check required fields
        if (!levelData.metadata) {
            throw new Error('Level missing metadata');
        }
        if (!levelData.spawnConfig) {
            throw new Error('Level missing spawnConfig');
        }
        if (typeof levelData.worldSeed !== 'number') {
            throw new Error('Level missing valid worldSeed');
        }

        // Validate metadata
        const meta = levelData.metadata;
        if (!meta.id || !meta.name || !meta.difficulty) {
            throw new Error('Level metadata incomplete');
        }

        // Validate spawn config
        const config = levelData.spawnConfig;
        if (!config.queen || !config.starterAnts || !config.noiseLayers) {
            throw new Error('SpawnConfig incomplete');
        }

        console.log('[LevelLoader] Level validation passed');
    }

    /**
     * Generate spawn config from procedural parameters
     * @param params - Procedural generation parameters
     * @param worldCenter - Center position for queen/safe zone
     * @returns Generated SpawnConfig
     */
    private generateSpawnConfig(
        params: ProceduralLevelParams,
        worldCenter: { x: number; y: number }
    ): SpawnConfig {
        // Base config on difficulty
        const difficultyMultipliers = {
            easy: { ants: 1.5, resources: 1.5, enemies: 0.5, safeRadius: 30 },
            medium: { ants: 1.0, resources: 1.0, enemies: 1.0, safeRadius: 20 },
            hard: { ants: 0.75, resources: 0.75, enemies: 1.5, safeRadius: 15 },
            expert: { ants: 0.5, resources: 0.5, enemies: 2.0, safeRadius: 10 }
        };

        const multiplier = difficultyMultipliers[params.difficulty];

        // Resource abundance mapping
        const resourceDensityMap = {
            scarce: 0.15,
            normal: 0.3,
            abundant: 0.5
        };
        const resourceDensity = resourceDensityMap[params.resourceAbundance];

        // Enemy density mapping
        const enemyCountMap = {
            low: 1,
            medium: 3,
            high: 5,
            extreme: 8
        };
        const nestCount = enemyCountMap[params.enemyDensity];

        // Generate random seed for noise layers
        const baseSeed = Date.now();

        // Create spawn bounds (80% of world size)
        const bounds: SpawnBounds = {
            minX: Math.floor(params.worldSize.width * 0.1),
            minY: Math.floor(params.worldSize.height * 0.1),
            maxX: Math.floor(params.worldSize.width * 0.9),
            maxY: Math.floor(params.worldSize.height * 0.9)
        };

        // Generate starter ants based on difficulty
        const baseAnts = {
            builders: 3,
            gatherers: 5,
            scouts: 2
        };

        const starterAnts = {
            builders: Math.floor(baseAnts.builders * multiplier.ants),
            gatherers: Math.floor(baseAnts.gatherers * multiplier.ants),
            scouts: Math.floor(baseAnts.scouts * multiplier.ants)
        };

        // Generate resource veins
        const resourceVeins = [
            {
                bounds: { x: bounds.minX, y: bounds.minY, width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY },
                resourceType: 'food',
                noiseLayer: 'resources',
                threshold: { min: 0.6, max: 1.0 },
                density: resourceDensity
            },
            {
                bounds: { x: bounds.minX, y: bounds.minY, width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY },
                resourceType: 'wood',
                noiseLayer: 'resources',
                threshold: { min: 0.3, max: 0.6 },
                density: resourceDensity * 0.8
            },
            {
                bounds: { x: bounds.minX, y: bounds.minY, width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY },
                resourceType: 'stone',
                noiseLayer: 'resources',
                threshold: { min: 0.0, max: 0.3 },
                density: resourceDensity * 0.6
            },
            {
                bounds: { x: bounds.minX, y: bounds.minY, width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY },
                resourceType: 'magicCrystal',
                noiseLayer: 'resources',
                threshold: { min: 0.85, max: 1.0 },
                density: resourceDensity * 0.3
            }
        ];

        // Generate enemy nests
        const enemyNests = [];
        const nestPositions = this.generateNestPositions(
            nestCount,
            worldCenter,
            multiplier.safeRadius + 10, // Outside safe zone
            params.worldSize
        );

        for (let i = 0; i < nestCount; i++) {
            const antCount = Math.floor(5 * multiplier.enemies);
            enemyNests.push({
                center: nestPositions[i],
                bossType: i % 2 === 0 ? 'scorpion' : 'spider', // Alternate boss types
                antCount,
                factionId: `enemy_${i}`
            });
        }

        // Wave configuration
        const waveMultipliers = {
            easy: 1.2,
            medium: 1.5,
            hard: 1.8,
            expert: 2.0
        };

        const waves = params.wavesEnabled ? {
            enabled: true,
            baseDelay: 30,
            baseAntCount: Math.floor(3 * multiplier.enemies),
            antCountMultiplier: waveMultipliers[params.difficulty],
            bossInterval: params.difficulty === 'expert' ? 3 : 5
        } : {
            enabled: false,
            baseDelay: 0,
            baseAntCount: 0,
            antCountMultiplier: 1,
            bossInterval: 0
        };

        // Safe zone configuration
        const safeZone = {
            center: worldCenter,
            radius: multiplier.safeRadius,
            duration: params.safeZoneDuration
        };

        // Noise layers with random seeds
        const noiseLayers = {
            resources: { scale: 0.05, seed: baseSeed + 1 },
            enemies: { scale: 0.08, seed: baseSeed + 2 },
            decorations: { scale: 0.1, seed: baseSeed + 3 }
        };

        return {
            queen: {
                position: worldCenter,
                factionId: 'player'
            },
            starterAnts,
            resourceVeins,
            enemyNests,
            safeZone,
            waves,
            noiseLayers
        };
    }

    /**
     * Generate nest positions around world center
     * @param count - Number of nests to generate
     * @param center - World center position
     * @param minDistance - Minimum distance from center
     * @param worldSize - World dimensions
     * @returns Array of nest positions
     */
    private generateNestPositions(
        count: number,
        center: { x: number; y: number },
        minDistance: number,
        worldSize: { width: number; height: number }
    ): Array<{ x: number; y: number }> {
        const positions: Array<{ x: number; y: number }> = [];
        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = angleStep * i;
            const distance = minDistance + Math.random() * 20; // Randomize distance slightly

            let x = Math.floor(center.x + Math.cos(angle) * distance);
            let y = Math.floor(center.y + Math.sin(angle) * distance);

            // Clamp to world bounds
            x = Math.max(5, Math.min(worldSize.width - 5, x));
            y = Math.max(5, Math.min(worldSize.height - 5, y));

            positions.push({ x, y });
        }

        return positions;
    }
}
