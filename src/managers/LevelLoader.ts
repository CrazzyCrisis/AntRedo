/**
 * LevelLoader - Loads and manages level data
 * 
 * Features:
 * - Load levels from JSON files
 * - Generate procedural levels
 * - Save levels (for editor support)
 * - Level validation
 */

import { SpawnConfig, DEFAULT_SPAWN_CONFIG } from '../config/gameplay/spawnConfig';
import { EventBus, GameEvents } from '../utils/eventBus';

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
        // Start with DEFAULT_SPAWN_CONFIG as base
        const config = JSON.parse(JSON.stringify(DEFAULT_SPAWN_CONFIG)) as SpawnConfig;
        
        // Base config on difficulty
        const difficultyMultipliers = {
            easy: { ants: 1.5, resources: 1.5, enemies: 0.5, safeRadius: 30 },
            medium: { ants: 1.0, resources: 1.0, enemies: 1.0, safeRadius: 20 },
            hard: { ants: 0.75, resources: 0.75, enemies: 1.5, safeRadius: 15 },
            expert: { ants: 0.5, resources: 0.5, enemies: 2.0, safeRadius: 10 }
        };

        const multiplier = difficultyMultipliers[params.difficulty];

        // Override queen position with world center
        config.queen.position = worldCenter;
        
        // Override starter ants based on difficulty multiplier
        config.starterAnts = {
            builders: Math.floor(DEFAULT_SPAWN_CONFIG.starterAnts.builders * multiplier.ants),
            gatherers: Math.floor(DEFAULT_SPAWN_CONFIG.starterAnts.gatherers * multiplier.ants),
            scouts: Math.floor(DEFAULT_SPAWN_CONFIG.starterAnts.scouts * multiplier.ants)
        };

        // Resource abundance mapping (multiplies default densities)
        const resourceDensityMap = {
            scarce: 0.5,
            normal: 1.0,
            abundant: 1.5
        };
        const resourceMultiplier = resourceDensityMap[params.resourceAbundance] * multiplier.resources;

        // Override resource veins with adjusted densities
        config.resourceVeins = config.resourceVeins.map(vein => ({
            ...vein,
            bounds: {
                x: Math.floor(params.worldSize.width * 0.1),
                y: Math.floor(params.worldSize.height * 0.1),
                width: Math.floor(params.worldSize.width * 0.8),
                height: Math.floor(params.worldSize.height * 0.8)
            },
            density: vein.density * resourceMultiplier
        }));

        // Enemy density mapping
        const enemyCountMap = {
            low: 1,
            medium: 3,
            high: 5,
            extreme: 8
        };
        const nestCount = enemyCountMap[params.enemyDensity];

        // Generate enemy nests
        const nestPositions = this.generateNestPositions(
            nestCount,
            worldCenter,
            multiplier.safeRadius + 10, // Outside safe zone
            params.worldSize
        );

        config.enemyNests = [];
        for (let i = 0; i < nestCount; i++) {
            const antCount = Math.floor(5 * multiplier.enemies);
            config.enemyNests.push({
                center: nestPositions[i],
                bossType: i % 2 === 0 ? 'scorpion' : 'spider',
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

        config.waves = params.wavesEnabled ? {
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
        config.safeZone = {
            center: worldCenter,
            radius: multiplier.safeRadius,
            duration: params.safeZoneDuration
        };

        // Noise layers with random seeds
        const baseSeed = Date.now();
        config.noiseLayers = {
            resources: { scale: 0.05, seed: baseSeed + 1 },
            enemies: { scale: 0.08, seed: baseSeed + 2 },
            decorations: { scale: 0.1, seed: baseSeed + 3 }
        };

        return config;
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
