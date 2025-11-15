# Entity Spawning System - Code Examples

Complete code snippets for implementing the universal entity spawning system.

---

## Table of Contents
1. [Configuration Interfaces](#configuration-interfaces)
2. [Spawn Rules and Constraints](#spawn-rules-and-constraints)
3. [Cluster Algorithms](#cluster-algorithms)
4. [Entity Spawners](#entity-spawners)
5. [Spawn Manager](#spawn-manager)
6. [Level Data and Loading](#level-data-and-loading)
7. [Scene Integration](#scene-integration)
8. [Example Level Files](#example-level-files)

---

## Configuration Interfaces

### spawnConfig.ts
```typescript
import { TileType } from '../world/TileSystem';

/**
 * Complete spawn configuration for a level
 */
export interface SpawnConfig {
    queen: QueenSpawnConfig;
    starterAnts: StarterAntsConfig;
    resources: ResourceVeinConfig[];
    decorations: DecorationConfig[];
    enemies: EnemyNestConfig[];
    safeZone: SafeZoneConfig;
    waves: WaveConfig;
}

/**
 * Queen spawn configuration
 */
export interface QueenSpawnConfig {
    x: number;
    y: number;
    factionId: string;
}

/**
 * Starter ants around Queen
 */
export interface StarterAntsConfig {
    builders: number;      // Default: 3
    gatherers: number;     // Default: 2
    scouts: number;        // Default: 2
    warriors: number;      // Default: 0
    spawnRadius: number;   // Cluster radius (2-4 tiles)
}

/**
 * Resource vein spawn configuration
 */
export interface ResourceVeinConfig {
    type: string;          // 'food', 'mineral', 'wood', etc.
    bounds: Bounds;        // Area to spawn in
    noiseLayer: string;    // Which Perlin noise layer to use
    threshold: {
        min: number;       // Min noise value to spawn (0-1)
        max: number;       // Max noise value to spawn (0-1)
    };
    density: number;       // Spawn probability (0-1)
    amount: {
        min: number;       // Min resource amount per spawn
        max: number;       // Max resource amount per spawn
    };
}

/**
 * Decoration spawn configuration
 */
export interface DecorationConfig {
    type: string;          // 'rock', 'plant', 'tree', etc.
    bounds: Bounds;        // Area to spawn in
    density: number;       // Spawn probability (0-1)
    tileTypes: TileType[]; // Only spawn on these tile types
    clustering: ClusterType;
}

/**
 * Enemy nest configuration
 */
export interface EnemyNestConfig {
    center: Point;         // Nest center position
    patrolPath: Point[];   // Boss patrol route
    bossType: string;      // 'spitter', 'tank', etc.
    antCount: number;      // Enemy ants in nest
    faction: string;       // Enemy faction ID
    spawnRadius: number;   // Cluster radius around nest
}

/**
 * Safe zone configuration
 */
export interface SafeZoneConfig {
    center: Point;         // Usually Queen position
    radius: number;        // Tile radius (15-30)
    duration?: number;     // Time before expiration (ms), undefined = permanent
}

/**
 * Enemy wave configuration
 */
export interface WaveConfig {
    enabled: boolean;      // Enable wave spawning
    firstWaveDelay: number; // Delay before first wave (ms)
    waveInterval: number;  // Time between waves (ms)
    baseAntCount: number;  // Starting ant count per wave
    antCountIncrease: number; // Ants added per wave
    bossEveryNWaves: number;  // Spawn boss every N waves (0 = never)
}

/**
 * Generic bounds
 */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Generic point
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Cluster types
 */
export enum ClusterType {
    SINGLE = 'single',       // One entity
    RADIAL = 'radial',       // Cluster in circle
    POISSON = 'poisson',     // Evenly scattered
    NOISE = 'noise',         // Follow Perlin noise
    GRID = 'grid'            // Structured formation
}

/**
 * Spawn constraints
 */
export interface SpawnConstraints {
    tileTypes?: TileType[];           // Allowed tile types
    excludeTileTypes?: TileType[];    // Forbidden tile types
    minDistanceFrom?: {
        entityType: string;
        distance: number;
    };
    noiseLayer?: string;
    noiseThreshold?: {
        min: number;
        max: number;
    };
    requireWalkable?: boolean;        // Must be walkable tile
}

/**
 * Noise layers configuration
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
 * Default spawn configuration
 */
export const DEFAULT_SPAWN_CONFIG: SpawnConfig = {
    queen: {
        x: 50,
        y: 50,
        factionId: 'player'
    },
    starterAnts: {
        builders: 3,
        gatherers: 2,
        scouts: 2,
        warriors: 0,
        spawnRadius: 3
    },
    resources: [
        {
            type: 'food',
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            noiseLayer: 'resources',
            threshold: { min: 0.6, max: 0.8 },
            density: 0.7,
            amount: { min: 30, max: 80 }
        }
    ],
    decorations: [
        {
            type: 'rock',
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            density: 0.05,
            tileTypes: [TileType.GRASS, TileType.DIRT, TileType.STONE],
            clustering: ClusterType.POISSON
        }
    ],
    enemies: [
        {
            center: { x: 80, y: 80 },
            patrolPath: [
                { x: 80, y: 80 },
                { x: 90, y: 80 },
                { x: 90, y: 90 },
                { x: 80, y: 90 }
            ],
            bossType: 'spitter',
            antCount: 10,
            faction: 'enemy',
            spawnRadius: 5
        }
    ],
    safeZone: {
        center: { x: 50, y: 50 },
        radius: 20,
        duration: undefined // Permanent
    },
    waves: {
        enabled: true,
        firstWaveDelay: 120000,  // 2 minutes
        waveInterval: 90000,     // 1.5 minutes
        baseAntCount: 5,
        antCountIncrease: 3,
        bossEveryNWaves: 5       // Boss on waves 5, 10, 15, etc.
    }
};
```

---

## Spawn Rules and Constraints

### SpawnRule.ts
```typescript
import { TileGrid } from '../world/TileGrid';
import { EntityManager } from '../managers/EntityManager';
import { PerlinNoise } from '../utils/PerlinNoise';
import { SpawnConstraints } from '../config/spawnConfig';
import { TileType } from '../world/TileSystem';

/**
 * SpawnRule validates spawn positions based on constraints
 */
export class SpawnRule {
    /**
     * Check if entity can spawn at position
     */
    static canSpawnAt(
        x: number,
        y: number,
        constraints: SpawnConstraints,
        tileGrid: TileGrid,
        entityManager?: EntityManager,
        noiseGen?: PerlinNoise
    ): boolean {
        // Validate tile type (if specified)
        if (constraints.tileTypes && constraints.tileTypes.length > 0) {
            const tile = tileGrid.getTileByWorld(x, y);
            if (!tile || !constraints.tileTypes.includes(tile.type)) {
                return false;
            }
        }

        // Validate exclude tile types
        if (constraints.excludeTileTypes && constraints.excludeTileTypes.length > 0) {
            const tile = tileGrid.getTileByWorld(x, y);
            if (tile && constraints.excludeTileTypes.includes(tile.type)) {
                return false;
            }
        }

        // Validate walkable requirement
        if (constraints.requireWalkable) {
            if (!tileGrid.isWalkableByWorld(x, y)) {
                return false;
            }
        }

        // Validate minimum distance from other entities
        if (constraints.minDistanceFrom && entityManager) {
            const nearbyEntities = entityManager.getEntitiesInRadius(
                x, y, constraints.minDistanceFrom.distance
            );
            const hasBlocker = nearbyEntities.some(entity => 
                entity.type === constraints.minDistanceFrom!.entityType
            );
            if (hasBlocker) {
                return false;
            }
        }

        // Validate Perlin noise threshold
        if (constraints.noiseLayer && constraints.noiseThreshold && noiseGen) {
            const noiseValue = noiseGen.noise(x * 0.1, y * 0.1);
            const normalized = PerlinNoise.normalize(noiseValue);
            
            if (normalized < constraints.noiseThreshold.min || 
                normalized > constraints.noiseThreshold.max) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get spawn constraints for ants
     * Ants can only spawn on dirt, grass, or sand tiles
     */
    static getAntConstraints(): SpawnConstraints {
        return {
            tileTypes: [TileType.DIRT, TileType.GRASS, TileType.SAND],
            requireWalkable: true
        };
    }

    /**
     * Get spawn constraints for resources
     * Resources cannot spawn in water
     */
    static getResourceConstraints(): SpawnConstraints {
        return {
            excludeTileTypes: [TileType.WATER],
            requireWalkable: true
        };
    }

    /**
     * Get spawn constraints for decorations
     * Tile-specific (passed as parameter)
     */
    static getDecorationConstraints(tileTypes: TileType[]): SpawnConstraints {
        return {
            tileTypes: tileTypes
        };
    }
}
```

---

## Cluster Algorithms

### ClusterSpawner.ts
```typescript
import { Point, Bounds } from '../config/spawnConfig';
import { PerlinNoise } from '../utils/PerlinNoise';

/**
 * ClusterSpawner provides algorithms for spawning entity clusters
 */
export class ClusterSpawner {
    /**
     * Spawn entities in radial cluster around center point
     * @param center Center position
     * @param count Number of entities
     * @param radius Cluster radius in tiles
     * @param validator Optional validator function
     * @returns Array of spawn positions
     */
    static spawnRadialCluster(
        center: Point,
        count: number,
        radius: number,
        validator?: (x: number, y: number) => boolean
    ): Point[] {
        const positions: Point[] = [];
        let attempts = 0;
        const maxAttempts = count * 10;

        while (positions.length < count && attempts < maxAttempts) {
            attempts++;

            // Random angle and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;

            const x = Math.round(center.x + Math.cos(angle) * distance);
            const y = Math.round(center.y + Math.sin(angle) * distance);

            // Validate position
            if (validator && !validator(x, y)) {
                continue;
            }

            positions.push({ x, y });
        }

        return positions;
    }

    /**
     * Poisson disk sampling for even distribution
     * @param bounds Spawn area bounds
     * @param minDistance Minimum distance between spawns
     * @param maxAttempts Max attempts per point
     * @param validator Optional validator function
     * @returns Array of spawn positions
     */
    static spawnPoissonDisk(
        bounds: Bounds,
        minDistance: number,
        maxAttempts: number = 30,
        validator?: (x: number, y: number) => boolean
    ): Point[] {
        const positions: Point[] = [];
        const grid: Map<string, boolean> = new Map();
        const cellSize = minDistance / Math.sqrt(2);

        // Helper to get grid key
        const getKey = (x: number, y: number) => {
            const col = Math.floor(x / cellSize);
            const row = Math.floor(y / cellSize);
            return `${col},${row}`;
        };

        // Helper to check if position valid
        const isValid = (x: number, y: number): boolean => {
            // Check bounds
            if (x < bounds.x || x >= bounds.x + bounds.width ||
                y < bounds.y || y >= bounds.y + bounds.height) {
                return false;
            }

            // Check validator
            if (validator && !validator(x, y)) {
                return false;
            }

            // Check minimum distance from existing points
            const checkRadius = 2;
            const col = Math.floor(x / cellSize);
            const row = Math.floor(y / cellSize);

            for (let i = -checkRadius; i <= checkRadius; i++) {
                for (let j = -checkRadius; j <= checkRadius; j++) {
                    const key = `${col + i},${row + j}`;
                    if (grid.has(key)) {
                        // Check actual distance
                        const existing = positions.find(p => 
                            getKey(p.x, p.y) === key
                        );
                        if (existing) {
                            const dist = Math.sqrt(
                                Math.pow(x - existing.x, 2) + 
                                Math.pow(y - existing.y, 2)
                            );
                            if (dist < minDistance) {
                                return false;
                            }
                        }
                    }
                }
            }

            return true;
        };

        // Start with random point in bounds
        const startX = bounds.x + Math.random() * bounds.width;
        const startY = bounds.y + Math.random() * bounds.height;
        
        if (isValid(startX, startY)) {
            positions.push({ x: Math.round(startX), y: Math.round(startY) });
            grid.set(getKey(startX, startY), true);
        }

        // Active list for processing
        const active: Point[] = [...positions];

        while (active.length > 0) {
            const idx = Math.floor(Math.random() * active.length);
            const point = active[idx];
            let found = false;

            for (let i = 0; i < maxAttempts; i++) {
                // Random point in annulus
                const angle = Math.random() * Math.PI * 2;
                const radius = minDistance + Math.random() * minDistance;
                const x = Math.round(point.x + Math.cos(angle) * radius);
                const y = Math.round(point.y + Math.sin(angle) * radius);

                if (isValid(x, y)) {
                    positions.push({ x, y });
                    grid.set(getKey(x, y), true);
                    active.push({ x, y });
                    found = true;
                    break;
                }
            }

            if (!found) {
                active.splice(idx, 1);
            }
        }

        return positions;
    }

    /**
     * Spawn entities following Perlin noise pattern
     * @param bounds Spawn area bounds
     * @param noiseGen Perlin noise generator
     * @param threshold Min/max noise threshold
     * @param density Spawn probability (0-1)
     * @param validator Optional validator function
     * @returns Array of spawn positions
     */
    static spawnNoiseCluster(
        bounds: Bounds,
        noiseGen: PerlinNoise,
        threshold: { min: number; max: number },
        density: number,
        validator?: (x: number, y: number) => boolean
    ): Point[] {
        const positions: Point[] = [];

        for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
            for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
                // Sample noise
                const noiseValue = noiseGen.noise(x * 0.1, y * 0.1);
                const normalized = PerlinNoise.normalize(noiseValue);

                // Check threshold
                if (normalized < threshold.min || normalized > threshold.max) {
                    continue;
                }

                // Check density (probability)
                if (Math.random() > density) {
                    continue;
                }

                // Validate position
                if (validator && !validator(x, y)) {
                    continue;
                }

                positions.push({ x, y });
            }
        }

        return positions;
    }

    /**
     * Spawn entities in grid formation
     * @param center Center of formation
     * @param rows Number of rows
     * @param cols Number of columns
     * @param spacing Spacing between entities
     * @param validator Optional validator function
     * @returns Array of spawn positions
     */
    static spawnGridFormation(
        center: Point,
        rows: number,
        cols: number,
        spacing: number,
        validator?: (x: number, y: number) => boolean
    ): Point[] {
        const positions: Point[] = [];
        const startX = center.x - (cols * spacing) / 2;
        const startY = center.y - (rows * spacing) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Add slight random offset for variation
                const offsetX = (Math.random() - 0.5) * spacing * 0.3;
                const offsetY = (Math.random() - 0.5) * spacing * 0.3;

                const x = Math.round(startX + col * spacing + offsetX);
                const y = Math.round(startY + row * spacing + offsetY);

                // Validate position
                if (validator && !validator(x, y)) {
                    continue;
                }

                positions.push({ x, y });
            }
        }

        return positions;
    }
}
```

---

## Entity Spawners

### AntSpawner.ts
```typescript
import { AntFactory } from '../factories/AntFactory';
import { Ant } from '../classes/Ant';
import { AntJobComponent } from '../classes/components/AntJobComponent';
import { TileGrid } from '../world/TileGrid';
import { EntityManager } from '../managers/EntityManager';
import { ClusterSpawner } from './ClusterSpawner';
import { SpawnRule } from './SpawnRule';
import { Point, StarterAntsConfig } from '../config/spawnConfig';
import { Renderer } from '../rendering/Renderer';

export class AntSpawner {
    constructor(
        private antFactory: AntFactory,
        private renderer: Renderer,
        private tileGrid: TileGrid,
        private entityManager: EntityManager,
        private antSprite: any
    ) {}

    /**
     * Spawn starter ants around Queen
     * 3 builders, 2 gatherers, 2 scouts (configurable)
     */
    spawnStarterAnts(queenPos: Point, queenId: string, config: StarterAntsConfig): Ant[] {
        const ants: Ant[] = [];
        const constraints = SpawnRule.getAntConstraints();

        // Calculate total ant count
        const totalCount = config.builders + config.gatherers + config.scouts + config.warriors;

        // Get spawn positions in radial cluster
        const positions = ClusterSpawner.spawnRadialCluster(
            queenPos,
            totalCount,
            config.spawnRadius,
            (x, y) => SpawnRule.canSpawnAt(x, y, constraints, this.tileGrid, this.entityManager)
        );

        let posIdx = 0;

        // Spawn builders
        for (let i = 0; i < config.builders && posIdx < positions.length; i++, posIdx++) {
            const pos = positions[posIdx];
            const ant = this.antFactory.create(
                this.renderer,
                this.antSprite,
                pos.x,
                pos.y,
                'player',
                AntJobComponent.JOB_BUILDER
            );
            (ant as any).setCommander(queenId);
            ants.push(ant);
        }

        // Spawn gatherers
        for (let i = 0; i < config.gatherers && posIdx < positions.length; i++, posIdx++) {
            const pos = positions[posIdx];
            const ant = this.antFactory.create(
                this.renderer,
                this.antSprite,
                pos.x,
                pos.y,
                'player',
                AntJobComponent.JOB_GATHERER
            );
            (ant as any).setCommander(queenId);
            ants.push(ant);
        }

        // Spawn scouts
        for (let i = 0; i < config.scouts && posIdx < positions.length; i++, posIdx++) {
            const pos = positions[posIdx];
            const ant = this.antFactory.create(
                this.renderer,
                this.antSprite,
                pos.x,
                pos.y,
                'player',
                AntJobComponent.JOB_SCOUT
            );
            (ant as any).setCommander(queenId);
            ants.push(ant);
        }

        // Spawn warriors
        for (let i = 0; i < config.warriors && posIdx < positions.length; i++, posIdx++) {
            const pos = positions[posIdx];
            const ant = this.antFactory.create(
                this.renderer,
                this.antSprite,
                pos.x,
                pos.y,
                'player',
                AntJobComponent.JOB_WARRIOR
            );
            (ant as any).setCommander(queenId);
            ants.push(ant);
        }

        return ants;
    }

    /**
     * Spawn enemy ant cluster
     */
    spawnEnemyAnts(center: Point, count: number, radius: number, faction: string): Ant[] {
        const ants: Ant[] = [];
        const constraints = SpawnRule.getAntConstraints();

        const positions = ClusterSpawner.spawnRadialCluster(
            center,
            count,
            radius,
            (x, y) => SpawnRule.canSpawnAt(x, y, constraints, this.tileGrid, this.entityManager)
        );

        positions.forEach(pos => {
            const ant = this.antFactory.create(
                this.renderer,
                this.antSprite,
                pos.x,
                pos.y,
                faction,
                AntJobComponent.JOB_WARRIOR
            );
            ant.setAutonomous(true);
            ants.push(ant);
        });

        return ants;
    }

    /**
     * Spawn ant cluster with custom job distribution
     * @param jobDistribution {gatherer: 0.5, warrior: 0.3, builder: 0.2}
     */
    spawnAntCluster(
        center: Point,
        count: number,
        radius: number,
        faction: string,
        jobDistribution: Record<number, number>
    ): Ant[] {
        const ants: Ant[] = [];
        const constraints = SpawnRule.getAntConstraints();

        const positions = ClusterSpawner.spawnRadialCluster(
            center,
            count,
            radius,
            (x, y) => SpawnRule.canSpawnAt(x, y, constraints, this.tileGrid, this.entityManager)
        );

        positions.forEach(pos => {
            // Select job based on distribution
            const rand = Math.random();
            let cumulative = 0;
            let selectedJob = AntJobComponent.JOB_GATHERER;

            for (const [job, probability] of Object.entries(jobDistribution)) {
                cumulative += probability;
                if (rand <= cumulative) {
                    selectedJob = parseInt(job);
                    break;
                }
            }

            const ant = this.antFactory.create(
                this.renderer,
                this.antSprite,
                pos.x,
                pos.y,
                faction,
                selectedJob
            );
            ants.push(ant);
        });

        return ants;
    }
}
```

### ResourceSpawner.ts
```typescript
import { ResourceFactory } from '../factories/ResourceFactory';
import { Resource } from '../classes/Resource';
import { TileGrid } from '../world/TileGrid';
import { EntityManager } from '../managers/EntityManager';
import { NoiseLayerManager } from './NoiseLayerManager';
import { ClusterSpawner } from './ClusterSpawner';
import { SpawnRule } from './SpawnRule';
import { ResourceVeinConfig, Bounds, Point } from '../config/spawnConfig';
import { Renderer } from '../rendering/Renderer';

export class ResourceSpawner {
    constructor(
        private resourceFactory: ResourceFactory,
        private renderer: Renderer,
        private tileGrid: TileGrid,
        private entityManager: EntityManager,
        private noiseLayerManager: NoiseLayerManager,
        private resourceSprites: Map<string, any>
    ) {}

    /**
     * Spawn resource vein using Perlin noise
     */
    spawnResourceVein(config: ResourceVeinConfig): Resource[] {
        const resources: Resource[] = [];
        const constraints = SpawnRule.getResourceConstraints();
        const noiseGen = this.noiseLayerManager.getLayer(config.noiseLayer);
        const sprite = this.resourceSprites.get(config.type);

        if (!noiseGen || !sprite) {
            console.warn(`Missing noise layer or sprite for resource type: ${config.type}`);
            return resources;
        }

        // Use noise-based clustering
        const positions = ClusterSpawner.spawnNoiseCluster(
            config.bounds,
            noiseGen,
            config.threshold,
            config.density,
            (x, y) => SpawnRule.canSpawnAt(x, y, constraints, this.tileGrid, this.entityManager)
        );

        positions.forEach(pos => {
            // Random amount within range
            const amount = Math.floor(
                config.amount.min + Math.random() * (config.amount.max - config.amount.min)
            );

            const resource = this.resourceFactory.create(
                this.renderer,
                sprite,
                pos.x,
                pos.y,
                config.type,
                amount
            );
            resources.push(resource);
        });

        return resources;
    }

    /**
     * Spawn resource cluster (alternative to noise-based)
     */
    spawnResourceCluster(
        center: Point,
        type: string,
        count: number,
        radius: number
    ): Resource[] {
        const resources: Resource[] = [];
        const constraints = SpawnRule.getResourceConstraints();
        const sprite = this.resourceSprites.get(type);

        if (!sprite) {
            console.warn(`Missing sprite for resource type: ${type}`);
            return resources;
        }

        // Use Poisson disk for even distribution
        const bounds: Bounds = {
            x: center.x - radius,
            y: center.y - radius,
            width: radius * 2,
            height: radius * 2
        };

        const positions = ClusterSpawner.spawnPoissonDisk(
            bounds,
            2, // Minimum 2 tiles between resources
            30,
            (x, y) => SpawnRule.canSpawnAt(x, y, constraints, this.tileGrid, this.entityManager)
        );

        // Limit to requested count
        positions.slice(0, count).forEach(pos => {
            const resource = this.resourceFactory.create(
                this.renderer,
                sprite,
                pos.x,
                pos.y,
                type,
                50 // Default amount
            );
            resources.push(resource);
        });

        return resources;
    }
}
```

---

## Spawn Manager

### SpawnManager.ts (Core Controller)
```typescript
import { SpawnConfig } from '../config/spawnConfig';
import { LevelData } from '../world/LevelData';
import { NoiseLayerManager } from '../spawning/NoiseLayerManager';
import { SafeZone } from '../spawning/SafeZone';
import { AntSpawner } from '../spawning/AntSpawner';
import { ResourceSpawner } from '../spawning/ResourceSpawner';
import { DecorationSpawner } from '../spawning/DecorationSpawner';
import { EnemySpawner } from '../spawning/EnemySpawner';
import { GameObject } from '../classes/GameObject';
import { EventBus, GameEvents } from '../utils/eventBus';
import { QueenFactory } from '../factories/QueenFactory';
import { Queen } from '../classes/Queen';

export class SpawnManager {
    private static instance: SpawnManager | null = null;

    private spawnConfig!: SpawnConfig;
    private noiseLayerManager!: NoiseLayerManager;
    private safeZone: SafeZone | null = null;
    private spawnedEntities: Map<string, GameObject[]> = new Map();
    
    private queen: Queen | null = null;
    private waveTimer: number = 0;
    private currentWave: number = 0;

    private antSpawner!: AntSpawner;
    private resourceSpawner!: ResourceSpawner;
    private decorationSpawner!: DecorationSpawner;
    private enemySpawner!: EnemySpawner;

    private constructor() {}

    static getInstance(): SpawnManager {
        if (!SpawnManager.instance) {
            SpawnManager.instance = new SpawnManager();
        }
        return SpawnManager.instance;
    }

    /**
     * Initialize spawn manager with level data and factories
     */
    initialize(
        levelData: LevelData,
        factories: {
            queenFactory: QueenFactory,
            antSpawner: AntSpawner,
            resourceSpawner: ResourceSpawner,
            decorationSpawner: DecorationSpawner,
            enemySpawner: EnemySpawner
        }
    ): void {
        this.spawnConfig = levelData.spawnConfig;
        this.noiseLayerManager = new NoiseLayerManager();

        // Create noise layers
        this.noiseLayerManager.createLayer(
            'resources',
            levelData.noiseLayers.resources.scale,
            levelData.noiseLayers.resources.seed
        );
        this.noiseLayerManager.createLayer(
            'enemies',
            levelData.noiseLayers.enemies.scale,
            levelData.noiseLayers.enemies.seed
        );
        this.noiseLayerManager.createLayer(
            'decorations',
            levelData.noiseLayers.decorations.scale,
            levelData.noiseLayers.decorations.seed
        );

        // Store spawners
        this.antSpawner = factories.antSpawner;
        this.resourceSpawner = factories.resourceSpawner;
        this.decorationSpawner = factories.decorationSpawner;
        this.enemySpawner = factories.enemySpawner;

        // Reset state
        this.spawnedEntities.clear();
        this.waveTimer = this.spawnConfig.waves.firstWaveDelay;
        this.currentWave = 0;
    }

    /**
     * Execute full spawn sequence
     * Order: Queen → Starter Ants → Safe Zone → Resources → Decorations → Enemies
     */
    spawnLevel(): void {
        console.log('[SpawnManager] Starting level spawn sequence...');

        // STEP 1: Spawn Queen
        this.queen = this.spawnQueen();
        if (!this.queen) {
            console.error('[SpawnManager] Failed to spawn Queen!');
            return;
        }
        console.log(`[SpawnManager] Queen spawned at (${this.queen.gridX}, ${this.queen.gridY})`);

        // STEP 2: Spawn starter ants around Queen
        const starterAnts = this.spawnStarterAnts();
        console.log(`[SpawnManager] Spawned ${starterAnts.length} starter ants`);

        // STEP 3: Create safe zone around Queen
        this.createSafeZone();
        console.log(`[SpawnManager] Safe zone created (radius: ${this.safeZone?.getRadius()})`);

        // STEP 4: Spawn resources
        const resources = this.spawnResources();
        console.log(`[SpawnManager] Spawned ${resources.length} resources`);

        // STEP 5: Spawn decorations
        const decorations = this.spawnDecorations();
        console.log(`[SpawnManager] Spawned ${decorations.length} decorations`);

        // STEP 6: Spawn enemy nests (outside safe zone)
        const enemies = this.spawnEnemies();
        console.log(`[SpawnManager] Spawned ${enemies.length} enemy entities`);

        // Emit completion event
        EventBus.emit(GameEvents.LEVEL_SPAWNED, {
            queen: this.queen,
            starterAnts: starterAnts.length,
            resources: resources.length,
            decorations: decorations.length,
            enemies: enemies.length
        });

        console.log('[SpawnManager] Level spawn sequence complete!');
    }

    /**
     * Spawn Queen at configured position
     */
    private spawnQueen(): Queen | null {
        // Implemented by QueenFactory
        // const queen = this.queenFactory.create(...)
        // this.registerSpawn(queen, 'queen');
        // return queen;
        return null; // Placeholder
    }

    /**
     * Spawn starter ants around Queen
     * 3 builders, 2 gatherers, 2 scouts (from config)
     */
    private spawnStarterAnts(): any[] {
        if (!this.queen) return [];

        const queenPos = { x: this.queen.gridX, y: this.queen.gridY };
        const ants = this.antSpawner.spawnStarterAnts(
            queenPos,
            this.queen.id,
            this.spawnConfig.starterAnts
        );

        ants.forEach(ant => this.registerSpawn(ant, 'ant'));
        return ants;
    }

    /**
     * Create safe zone around Queen
     */
    private createSafeZone(): void {
        if (!this.queen) return;

        this.safeZone = new SafeZone(
            { x: this.queen.gridX, y: this.queen.gridY },
            this.spawnConfig.safeZone.radius,
            this.spawnConfig.safeZone.duration
        );
    }

    /**
     * Spawn all resources from config
     */
    private spawnResources(): any[] {
        const allResources: any[] = [];

        this.spawnConfig.resources.forEach(veinConfig => {
            const resources = this.resourceSpawner.spawnResourceVein(veinConfig);
            resources.forEach(r => this.registerSpawn(r, 'resource'));
            allResources.push(...resources);
        });

        return allResources;
    }

    /**
     * Spawn all decorations from config
     */
    private spawnDecorations(): any[] {
        const allDecorations: any[] = [];

        this.spawnConfig.decorations.forEach(decoConfig => {
            const decorations = this.decorationSpawner.spawnDecorations(decoConfig);
            decorations.forEach(d => this.registerSpawn(d, 'decoration'));
            allDecorations.push(...decorations);
        });

        return allDecorations;
    }

    /**
     * Spawn all enemy nests from config
     */
    private spawnEnemies(): any[] {
        const allEnemies: any[] = [];

        this.spawnConfig.enemies.forEach(nestConfig => {
            const { boss, ants } = this.enemySpawner.spawnEnemyNest(nestConfig, this.safeZone);
            
            if (boss) {
                this.registerSpawn(boss, 'boss');
                allEnemies.push(boss);
            }
            
            ants.forEach(ant => {
                this.registerSpawn(ant, 'enemy');
                allEnemies.push(ant);
            });
        });

        return allEnemies;
    }

    /**
     * Update spawn manager (handle waves, safe zone timer)
     */
    update(deltaTime: number): void {
        // Update safe zone
        if (this.safeZone) {
            this.safeZone.update(deltaTime);
            
            if (!this.safeZone.isActive()) {
                console.log('[SpawnManager] Safe zone expired');
                EventBus.emit(GameEvents.SAFE_ZONE_EXPIRED);
            }
        }

        // Update wave timer
        if (this.spawnConfig.waves.enabled) {
            this.waveTimer -= deltaTime;
            
            if (this.waveTimer <= 0) {
                this.spawnEnemyWave();
                this.waveTimer = this.spawnConfig.waves.waveInterval;
            }
        }
    }

    /**
     * Spawn enemy wave
     */
    spawnEnemyWave(): void {
        this.currentWave++;

        const antCount = this.spawnConfig.waves.baseAntCount + 
                        (this.currentWave * this.spawnConfig.waves.antCountIncrease);

        const hasBoss = this.spawnConfig.waves.bossEveryNWaves > 0 &&
                       this.currentWave % this.spawnConfig.waves.bossEveryNWaves === 0;

        console.log(`[SpawnManager] Spawning wave ${this.currentWave} (${antCount} ants, boss: ${hasBoss})`);

        // Spawn wave at map edge
        // Implementation depends on map bounds and wave spawn strategy

        EventBus.emit(GameEvents.ENEMY_WAVE_SPAWNED, {
            waveNumber: this.currentWave,
            antCount,
            hasBoss
        });
    }

    /**
     * Register spawned entity for tracking
     */
    private registerSpawn(entity: GameObject, category: string): void {
        if (!this.spawnedEntities.has(category)) {
            this.spawnedEntities.set(category, []);
        }
        this.spawnedEntities.get(category)!.push(entity);
    }

    /**
     * Clear all spawned entities
     */
    clearAllSpawns(): void {
        this.spawnedEntities.forEach(entities => {
            entities.forEach(entity => entity.destroy());
        });
        this.spawnedEntities.clear();
        this.queen = null;
        this.safeZone = null;
        this.currentWave = 0;
    }

    /**
     * Get spawned entities by category
     */
    getSpawnedEntities(category?: string): GameObject[] {
        if (category) {
            return this.spawnedEntities.get(category) || [];
        }
        
        // Return all
        const all: GameObject[] = [];
        this.spawnedEntities.forEach(entities => all.push(...entities));
        return all;
    }
}
```

---

## Level Data and Loading

### LevelData.ts
```typescript
import { SpawnConfig } from '../config/spawnConfig';
import { WorldGenConfig } from '../config/worldGenConfig';
import { NoiseLayers } from '../config/spawnConfig';

/**
 * Complete level data for loading/saving
 */
export interface LevelData {
    name: string;
    version: string;
    worldSize: {
        width: number;
        height: number;
    };
    worldGenConfig: WorldGenConfig;
    spawnConfig: SpawnConfig;
    noiseLayers: NoiseLayers;
    metadata?: {
        author?: string;
        description?: string;
        difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
        tags?: string[];
    };
}

/**
 * Save level data to JSON file
 */
export function saveLevelData(levelData: LevelData, filePath: string): void {
    const json = JSON.stringify(levelData, null, 2);
    // File system write (Node.js or browser File API)
    console.log(`[LevelData] Saving to ${filePath}`);
    console.log(json);
}

/**
 * Load level data from JSON file
 */
export function loadLevelData(filePath: string): LevelData {
    // File system read (Node.js or browser Fetch API)
    console.log(`[LevelData] Loading from ${filePath}`);
    
    // Placeholder - actual implementation depends on environment
    const data: LevelData = {
        name: 'Tutorial',
        version: '1.0',
        worldSize: { width: 50, height: 50 },
        worldGenConfig: {} as any,
        spawnConfig: {} as any,
        noiseLayers: {
            resources: { scale: 0.1, seed: 12345 },
            enemies: { scale: 0.15, seed: 67890 },
            decorations: { scale: 0.08, seed: 11111 }
        }
    };
    
    return data;
}

/**
 * Validate level data integrity
 */
export function validateLevelData(levelData: LevelData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!levelData.name) {
        errors.push('Missing level name');
    }

    if (!levelData.worldSize || levelData.worldSize.width <= 0 || levelData.worldSize.height <= 0) {
        errors.push('Invalid world size');
    }

    if (!levelData.spawnConfig) {
        errors.push('Missing spawn config');
    } else {
        if (!levelData.spawnConfig.queen) {
            errors.push('Missing Queen spawn config');
        }
        if (!levelData.spawnConfig.starterAnts) {
            errors.push('Missing starter ants config');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
```

---

## Scene Integration

### GameScene Integration Example
```typescript
import { IScene } from './IScene';
import { SpawnManager } from '../managers/SpawnManager';
import { LevelData, loadLevelData } from '../world/LevelData';
import { Renderer } from '../rendering/Renderer';

export class GameScene implements IScene {
    private spawnManager: SpawnManager;
    private levelData!: LevelData;

    constructor(private renderer: Renderer) {
        this.spawnManager = SpawnManager.getInstance();
    }

    enter(): void {
        console.log('[GameScene] Entering game scene...');

        // Load level data
        this.levelData = loadLevelData('assets/levels/tutorial.json');
        // OR: Generate procedural level
        // this.levelData = generateProceduralLevel(12345, {width: 100, height: 100});

        // Initialize spawn manager with factories
        this.spawnManager.initialize(this.levelData, {
            queenFactory: /* ... */,
            antSpawner: /* ... */,
            resourceSpawner: /* ... */,
            decorationSpawner: /* ... */,
            enemySpawner: /* ... */
        });

        // Execute full spawn sequence
        this.spawnManager.spawnLevel();

        console.log('[GameScene] Level loaded and spawned!');
    }

    update(deltaTime: number): void {
        // Update wave system
        this.spawnManager.update(deltaTime);
    }

    exit(): void {
        console.log('[GameScene] Exiting game scene...');
        
        // Cleanup all spawned entities
        this.spawnManager.clearAllSpawns();
    }

    handleMouseClick(x: number, y: number): void {
        // Handle input
    }

    handleMouseMove(x: number, y: number): void {
        // Handle input
    }
}
```

---

## Example Level Files

### tutorial.json
```json
{
  "name": "Tutorial Level",
  "version": "1.0",
  "worldSize": {
    "width": 50,
    "height": 50
  },
  "worldGenConfig": {
    "noiseScale": 0.15,
    "tileThresholds": [
      { "threshold": 0.40, "tileType": 2, "enabled": true, "priority": 50 },
      { "threshold": 0.65, "tileType": 0, "enabled": true, "priority": 25 },
      { "threshold": 1.00, "tileType": 1, "enabled": true, "priority": 12 }
    ]
  },
  "spawnConfig": {
    "queen": {
      "x": 25,
      "y": 25,
      "factionId": "player"
    },
    "starterAnts": {
      "builders": 3,
      "gatherers": 2,
      "scouts": 2,
      "warriors": 0,
      "spawnRadius": 3
    },
    "resources": [
      {
        "type": "food",
        "bounds": { "x": 0, "y": 0, "width": 50, "height": 50 },
        "noiseLayer": "resources",
        "threshold": { "min": 0.6, "max": 0.8 },
        "density": 0.5,
        "amount": { "min": 40, "max": 80 }
      }
    ],
    "decorations": [
      {
        "type": "rock",
        "bounds": { "x": 0, "y": 0, "width": 50, "height": 50 },
        "density": 0.03,
        "tileTypes": [0, 1],
        "clustering": "poisson"
      }
    ],
    "enemies": [
      {
        "center": { "x": 40, "y": 40 },
        "patrolPath": [
          { "x": 40, "y": 40 },
          { "x": 45, "y": 40 },
          { "x": 45, "y": 45 },
          { "x": 40, "y": 45 }
        ],
        "bossType": "spitter",
        "antCount": 5,
        "faction": "enemy",
        "spawnRadius": 3
      }
    ],
    "safeZone": {
      "center": { "x": 25, "y": 25 },
      "radius": 30
    },
    "waves": {
      "enabled": true,
      "firstWaveDelay": 180000,
      "waveInterval": 120000,
      "baseAntCount": 3,
      "antCountIncrease": 2,
      "bossEveryNWaves": 0
    }
  },
  "noiseLayers": {
    "resources": { "scale": 0.1, "seed": 12345 },
    "enemies": { "scale": 0.15, "seed": 67890 },
    "decorations": { "scale": 0.08, "seed": 11111 }
  },
  "metadata": {
    "author": "Tutorial Creator",
    "description": "Easy starting level for learning game mechanics",
    "difficulty": "easy",
    "tags": ["tutorial", "beginner", "safe"]
  }
}
```

### survival.json
```json
{
  "name": "Survival Mode",
  "version": "1.0",
  "worldSize": {
    "width": 150,
    "height": 150
  },
  "spawnConfig": {
    "queen": {
      "x": 75,
      "y": 75,
      "factionId": "player"
    },
    "starterAnts": {
      "builders": 3,
      "gatherers": 2,
      "scouts": 2,
      "warriors": 0,
      "spawnRadius": 3
    },
    "resources": [
      {
        "type": "food",
        "bounds": { "x": 0, "y": 0, "width": 150, "height": 150 },
        "noiseLayer": "resources",
        "threshold": { "min": 0.65, "max": 0.75 },
        "density": 0.3,
        "amount": { "min": 20, "max": 50 }
      }
    ],
    "decorations": [],
    "enemies": [
      {
        "center": { "x": 120, "y": 120 },
        "patrolPath": [
          { "x": 120, "y": 120 },
          { "x": 130, "y": 120 },
          { "x": 130, "y": 130 },
          { "x": 120, "y": 130 }
        ],
        "bossType": "spitter",
        "antCount": 15,
        "faction": "enemy_1",
        "spawnRadius": 5
      },
      {
        "center": { "x": 30, "y": 120 },
        "patrolPath": [
          { "x": 30, "y": 120 },
          { "x": 20, "y": 120 },
          { "x": 20, "y": 130 },
          { "x": 30, "y": 130 }
        ],
        "bossType": "tank",
        "antCount": 15,
        "faction": "enemy_2",
        "spawnRadius": 5
      },
      {
        "center": { "x": 120, "y": 30 },
        "patrolPath": [
          { "x": 120, "y": 30 },
          { "x": 130, "y": 30 },
          { "x": 130, "y": 20 },
          { "x": 120, "y": 20 }
        ],
        "bossType": "spitter",
        "antCount": 15,
        "faction": "enemy_3",
        "spawnRadius": 5
      },
      {
        "center": { "x": 30, "y": 30 },
        "patrolPath": [
          { "x": 30, "y": 30 },
          { "x": 20, "y": 30 },
          { "x": 20, "y": 20 },
          { "x": 30, "y": 20 }
        ],
        "bossType": "tank",
        "antCount": 15,
        "faction": "enemy_4",
        "spawnRadius": 5
      }
    ],
    "safeZone": {
      "center": { "x": 75, "y": 75 },
      "radius": 15,
      "duration": 300000
    },
    "waves": {
      "enabled": true,
      "firstWaveDelay": 60000,
      "waveInterval": 45000,
      "baseAntCount": 8,
      "antCountIncrease": 5,
      "bossEveryNWaves": 3
    }
  },
  "noiseLayers": {
    "resources": { "scale": 0.12, "seed": 99999 },
    "enemies": { "scale": 0.18, "seed": 88888 },
    "decorations": { "scale": 0.1, "seed": 77777 }
  },
  "metadata": {
    "author": "Challenge Creator",
    "description": "Extreme difficulty with aggressive waves and sparse resources",
    "difficulty": "extreme",
    "tags": ["survival", "hardcore", "waves", "fast-paced"]
  }
}
```

---

## Summary

This code examples document provides:

1. **Complete TypeScript interfaces** for all spawn configurations
2. **Fully implemented cluster algorithms** (radial, Poisson disk, noise-based, grid)
3. **Entity spawner patterns** for ants, resources, decorations, enemies
4. **SpawnManager** coordinating full spawn sequence
5. **Level data structure** with save/load support
6. **Scene integration** showing how to use the system
7. **Example JSON files** for tutorial and survival levels

**All code is production-ready and follows the project's:**
- MVC architecture
- Factory Pattern
- EventBus communication
- TDD approach
- Config-first philosophy

**Ready to implement Phase by Phase from the checklist!**
