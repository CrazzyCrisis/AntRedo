/**
 * SpawnManager - Singleton manager coordinating all entity spawning
 * 
 * Responsibilities:
 * - Orchestrate all spawners (ants, resources, enemies)
 * - Execute full level spawn sequence
 * - Manage enemy wave spawning
 * - Track spawned entities by category
 * - Handle spawn-related events
 * 
 * Pattern:
 * - Singleton for global access
 * - Uses spawner classes for actual entity creation
 * - Integrates with LevelData for configuration
 * - EventBus integration for wave notifications
 */

import { Queen } from '../classes/Queen';
import { Ant } from '../classes/Ant';
import { Boss } from '../classes/Boss';
import { Resource } from '../classes/Resource';
import { Renderer } from '../rendering/Renderer';
import { AntSpawner } from '../spawning/AntSpawner';
import { ResourceSpawner } from '../spawning/ResourceSpawner';
import { EnemySpawner } from '../spawning/EnemySpawner';
import { NoiseLayerManager } from '../spawning/NoiseLayerManager';
import { SafeZone } from '../spawning/SafeZone';
import { QueenFactory } from '../factories/QueenFactory';
import { EventBus, GameEvents } from '../utils/eventBus';
import { SpawnConfig, WaveConfig } from '../config/spawnConfig';

/**
 * Entity spawn result
 */
export interface SpawnResult {
    queen: Queen | null;
    ants: Ant[];
    resources: Resource[];
    enemies: {
        bosses: Boss[];
        ants: Ant[];
    };
}

/**
 * Entity tracking by category
 */
interface EntityTracking {
    ants: Map<string, Ant>;
    resources: Map<string, Resource>;
    bosses: Map<string, Boss>;
    buildings: Map<string, any>; // Future: Building type
}

/**
 * SpawnManager - Singleton coordinator for all spawning operations
 */
export class SpawnManager {
    private static instance: SpawnManager | null = null;
    
    private renderer: Renderer | null = null;
    private antSpawner: AntSpawner | null = null;
    private resourceSpawner: ResourceSpawner | null = null;
    private enemySpawner: EnemySpawner | null = null;
    private noiseManager: NoiseLayerManager | null = null;
    private safeZone: SafeZone | null = null;
    private queenSprite: any = null;
    
    // Entity tracking
    private trackedEntities: EntityTracking = {
        ants: new Map(),
        resources: new Map(),
        bosses: new Map(),
        buildings: new Map()
    };
    
    // Wave spawning state
    private currentWave: number = 0;
    private waveTimer: number = 0;
    private wavesConfig: WaveConfig[] = [];
    private isWaveSystemActive: boolean = false;
    
    // Event unsubscribers
    private eventUnsubscribers: Array<() => void> = [];
    
    private constructor() {
        // Private constructor for singleton
        this.setupEventListeners();
    }
    
    /**
     * Get singleton instance
     */
    public static getInstance(): SpawnManager {
        if (!SpawnManager.instance) {
            SpawnManager.instance = new SpawnManager();
        }
        return SpawnManager.instance;
    }
    
    /**
     * Initialize spawn manager with renderer and helper functions
     */
    public initialize(
        renderer: Renderer,
        tileGrid: any,
        getEntitiesInRadius: (x: number, y: number, radius: number) => any[]
    ): void {
        this.renderer = renderer;
        
        // Create spawners with actual tileGrid array
        this.antSpawner = new AntSpawner(renderer, tileGrid, getEntitiesInRadius);
        this.resourceSpawner = new ResourceSpawner(renderer, tileGrid, getEntitiesInRadius);
        this.enemySpawner = new EnemySpawner(renderer, this.antSpawner, tileGrid, getEntitiesInRadius);
        
        // Create noise manager
        this.noiseManager = new NoiseLayerManager(Date.now());
        this.resourceSpawner.setNoiseManager(this.noiseManager);
        
        console.log('✅ SpawnManager initialized');
    }
    
    /**
     * Register sprites for spawning
     */
    public registerSprites(sprites: {
        ants?: Map<number, any>;
        resources?: Map<string, any>;
        boss?: any;
        queen?: any;
    }): void {
        // Register ant sprites (by job type)
        if (sprites.ants && this.antSpawner) {
            sprites.ants.forEach((sprite, jobType) => {
                this.antSpawner!.registerSprite(jobType, sprite);
            });
        }
        
        // Register resource sprites (by resource type)
        if (sprites.resources && this.resourceSpawner) {
            sprites.resources.forEach((sprite, resourceType) => {
                this.resourceSpawner!.registerSprite(resourceType as any, sprite);
            });
        }
        
        // Register boss sprite
        if (sprites.boss && this.enemySpawner) {
            this.enemySpawner.registerBossSprite(sprites.boss);
        }
        
        // Register queen sprite
        if (sprites.queen) {
            this.queenSprite = sprites.queen;
        }
        
        console.log('✅ Sprites registered with SpawnManager');
    }
    
    /**
     * Execute full level spawn sequence
     * @param config Spawn configuration from LevelData
     * @param worldSeed Seed for procedural generation
     * @returns All spawned entities
     */
    public spawnLevel(config: SpawnConfig, worldSeed: number): SpawnResult {
        if (!this.renderer || !this.antSpawner || !this.resourceSpawner || !this.enemySpawner) {
            console.error('SpawnManager not initialized');
            return { queen: null, ants: [], resources: [], enemies: { bosses: [], ants: [] } };
        }
        
        console.log('🌍 Starting level spawn sequence...');
        
        const result: SpawnResult = {
            queen: null,
            ants: [],
            resources: [],
            enemies: { bosses: [], ants: [] }
        };
        
        // 1. Initialize noise layers
        if (this.noiseManager) {
            this.noiseManager = new NoiseLayerManager(worldSeed);
            this.noiseManager.initializeFromConfig(config.noiseLayers);
            this.resourceSpawner.setNoiseManager(this.noiseManager);
        }
        
        // 2. Create safe zone
        this.safeZone = new SafeZone(
            config.safeZone.center.x,
            config.safeZone.center.y,
            config.safeZone
        );
        this.enemySpawner.setSafeZone(this.safeZone);
        
        // 3. Spawn Queen
        result.queen = this.spawnQueen(config.queen.position.x, config.queen.position.y, config.queen.factionId);
        
        // 4. Spawn starter ants
        if (config.starterAnts && result.queen) {
            // Convert starterAnts config to AntClusterConfig
            const totalAnts = config.starterAnts.builders + config.starterAnts.gatherers + config.starterAnts.scouts;
            const clusterConfig = {
                center: { x: result.queen.gridX, y: result.queen.gridY },
                count: totalAnts,
                radius: 4, // 4 tile radius around queen
                factionId: config.queen.factionId,
                jobDistribution: {
                    builder: config.starterAnts.builders / totalAnts,
                    gatherer: config.starterAnts.gatherers / totalAnts,
                    scout: config.starterAnts.scouts / totalAnts,
                    warrior: 0
                }
            };
            
            const starterResult = this.antSpawner.spawnStarterAnts(
                result.queen.gridX,
                result.queen.gridY,
                clusterConfig,
                config.queen.factionId
            );
            result.ants.push(...starterResult.ants);
            this.trackAnts(starterResult.ants);
        }
        
        // 5. Spawn resource veins
        for (const veinConfig of config.resourceVeins) {
            // Convert bounds format
            const bounds = {
                minX: veinConfig.bounds.x,
                minY: veinConfig.bounds.y,
                maxX: veinConfig.bounds.x + veinConfig.bounds.width,
                maxY: veinConfig.bounds.y + veinConfig.bounds.height
            };
            
            const veinResult = this.resourceSpawner.spawnResourceVein(
                bounds,
                veinConfig,
                veinConfig.noiseLayer
            );
            result.resources.push(...veinResult.resources);
            this.trackResources(veinResult.resources);
        }
        
        // 6. Spawn enemy nests
        for (const nestConfig of config.enemyNests) {
            const nestResult = this.enemySpawner.spawnEnemyNest(nestConfig);
            if (nestResult) {
                result.enemies.bosses.push(nestResult.boss);
                result.enemies.ants.push(...nestResult.ants);
                this.trackBoss(nestResult.boss);
                this.trackAnts(nestResult.ants);
            }
        }
        
        // 7. Setup wave spawning (if enabled)
        if (config.waves && config.waves.enabled) {
            // Generate wave configs from settings
            const generatedWaves: WaveConfig[] = [];
            for (let i = 0; i < 10; i++) { // Generate 10 waves
                generatedWaves.push({
                    waveNumber: i + 1,
                    delay: config.waves.baseDelay * (i + 1),
                    antCount: Math.floor(config.waves.baseAntCount * Math.pow(config.waves.antCountMultiplier, i)),
                    hasBoss: (i + 1) % config.waves.bossInterval === 0,
                    spawnRadius: 10 // Distance from safe zone edge
                });
            }
            
            this.wavesConfig = generatedWaves;
            this.currentWave = 0;
            this.waveTimer = generatedWaves[0].delay * 1000; // Convert to ms
            this.isWaveSystemActive = true;
        }
        
        console.log('✅ Level spawn complete!');
        console.log(`  Queen: ${result.queen ? '✓' : '✗'}`);
        console.log(`  Ants: ${result.ants.length}`);
        console.log(`  Resources: ${result.resources.length}`);
        console.log(`  Enemy Bosses: ${result.enemies.bosses.length}`);
        console.log(`  Enemy Ants: ${result.enemies.ants.length}`);
        
        EventBus.emit(GameEvents.LEVEL_START);
        
        return result;
    }
    
    /**
     * Spawn Queen at position
     */
    private spawnQueen(gridX: number, gridY: number, factionId: string): Queen | null {
        if (!this.renderer) return null;
        
        // Use registered queen sprite
        const queen = QueenFactory.create(
            this.renderer,
            this.queenSprite, // Use registered sprite
            gridX,
            gridY,
            factionId
        );
        
        return queen;
    }
    
    /**
     * Update wave spawning system
     * @param deltaTime Time since last frame in milliseconds
     */
    public update(deltaTime: number): void {
        // Update safe zone
        if (this.safeZone) {
            this.safeZone.update(deltaTime);
        }
        
        // Update wave timer
        if (this.isWaveSystemActive && this.currentWave < this.wavesConfig.length) {
            this.waveTimer -= deltaTime;
            
            if (this.waveTimer <= 0) {
                this.spawnNextWave();
            }
        }
    }
    
    /**
     * Spawn next enemy wave
     */
    private spawnNextWave(): void {
        if (!this.enemySpawner || this.currentWave >= this.wavesConfig.length) {
            return;
        }
        
        const waveConfig = this.wavesConfig[this.currentWave];
        
        console.log(`🌊 Spawning wave ${waveConfig.waveNumber}...`);
        
        const waveResult = this.enemySpawner.spawnWave(waveConfig);
        
        // Track spawned entities
        if (waveResult.boss) {
            this.trackBoss(waveResult.boss);
        }
        this.trackAnts(waveResult.ants);
        
        // Setup next wave
        this.currentWave++;
        if (this.currentWave < this.wavesConfig.length) {
            this.waveTimer = this.wavesConfig[this.currentWave].delay * 1000;
        } else {
            this.isWaveSystemActive = false;
            console.log('🏁 All waves spawned');
        }
    }
    
    /**
     * Clear all spawned entities
     */
    public clearAllSpawns(): void {
        // Destroy tracked entities
        this.trackedEntities.ants.forEach(ant => ant.destroy());
        this.trackedEntities.resources.forEach(resource => resource.destroy());
        this.trackedEntities.bosses.forEach(boss => boss.destroy());
        
        // Clear tracking
        this.trackedEntities.ants.clear();
        this.trackedEntities.resources.clear();
        this.trackedEntities.bosses.clear();
        this.trackedEntities.buildings.clear();
        
        // Reset wave system
        this.currentWave = 0;
        this.waveTimer = 0;
        this.isWaveSystemActive = false;
        
        console.log('🧹 All spawns cleared');
    }
    
    /**
     * Get safe zone instance
     */
    public getSafeZone(): SafeZone | null {
        return this.safeZone;
    }
    
    /**
     * Get entity count by category
     */
    public getEntityCount(category: 'ants' | 'resources' | 'bosses' | 'buildings'): number {
        return this.trackedEntities[category].size;
    }
    
    /**
     * Get entities by faction
     */
    public getEntitiesByFaction(_factionId: string): Ant[] {
        const entities: Ant[] = [];
        this.trackedEntities.ants.forEach(ant => {
            // Note: Ant class should have public getFaction() method
            // For now, return all ants
            entities.push(ant);
        });
        return entities;
    }
    
    /**
     * Track spawned ants
     */
    private trackAnts(ants: Ant[]): void {
        for (const ant of ants) {
            this.trackedEntities.ants.set(ant.id, ant);
        }
    }
    
    /**
     * Track spawned resources
     */
    private trackResources(resources: Resource[]): void {
        for (const resource of resources) {
            this.trackedEntities.resources.set(resource.id, resource);
        }
    }
    
    /**
     * Track spawned boss
     */
    private trackBoss(boss: Boss): void {
        this.trackedEntities.bosses.set(boss.id, boss);
    }
    
    /**
     * Setup event listeners for entity tracking
     */
    private setupEventListeners(): void {
        // Listen for entity destruction to remove from tracking
        this.eventUnsubscribers.push(
            EventBus.on(GameEvents.ENTITY_DESTROYED, (entityId: string) => {
                this.trackedEntities.ants.delete(entityId);
                this.trackedEntities.resources.delete(entityId);
                this.trackedEntities.bosses.delete(entityId);
                this.trackedEntities.buildings.delete(entityId);
            })
        );
    }
    
    /**
     * Cleanup manager
     */
    public destroy(): void {
        this.clearAllSpawns();
        
        // Unsubscribe from events
        for (const unsubscribe of this.eventUnsubscribers) {
            unsubscribe();
        }
        this.eventUnsubscribers = [];
        
        SpawnManager.instance = null;
    }
}
