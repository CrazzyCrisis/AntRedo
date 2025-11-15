/**
 * AntSpawner - Spawns ant entities with job distribution and faction assignment
 * 
 * Responsibilities:
 * - Spawn starter ants around Queen at level start
 * - Spawn ant clusters with job distribution
 * - Spawn enemy ants around nests/bosses
 * - Validate spawn positions using SpawnRuleValidator
 * 
 * Pattern:
 * - Uses AntFactory to create entities
 * - Integrates with ClusterSpawner for positioning algorithms
 * - Validates positions against tile grid and constraints
 */

import { Ant } from '../classes/Ant';
import { AntFactory } from '../factories/AntFactory';
import { AntJobComponent } from '../classes/components/AntJobComponent';
import { Renderer } from '../rendering/Renderer';
import { SpawnRuleValidator } from './SpawnRule';
import { ClusterSpawner } from './ClusterSpawner';
import { AntClusterConfig } from '../config/spawnConfig';

/**
 * Job distribution for ant spawning
 * Values should sum to 1.0 (100%)
 */
export interface JobDistribution {
    gatherer: number;  // 0-1
    builder: number;   // 0-1
    warrior: number;   // 0-1
    scout: number;     // 0-1
}

/**
 * Result of ant spawning operation
 */
export interface AntSpawnResult {
    ants: Ant[];
    positions: Array<{ x: number; y: number }>;
    jobCounts: {
        gatherer: number;
        builder: number;
        warrior: number;
        scout: number;
    };
}

/**
 * AntSpawner creates ant entities using factories and spawning algorithms
 */
export class AntSpawner {
    private renderer: Renderer;
    private tileGrid: any;
    private getEntitiesInRadius: (x: number, y: number, radius: number) => any[];
    private antSprites: Map<number, any>; // jobType -> sprite

    constructor(
        renderer: Renderer,
        tileGrid: any,
        getEntitiesInRadius: (x: number, y: number, radius: number) => any[]
    ) {
        this.renderer = renderer;
        this.tileGrid = tileGrid;
        this.getEntitiesInRadius = getEntitiesInRadius;
        this.antSprites = new Map();
    }

    /**
     * Register ant sprites for each job type
     * Must be called before spawning ants
     */
    public registerSprite(jobType: number, sprite: any): void {
        this.antSprites.set(jobType, sprite);
    }

    /**
     * Spawn starter ants around Queen at level start
     * @param queenX Queen's grid X position
     * @param queenY Queen's grid Y position
     * @param config Starter ant configuration from spawn config
     * @param factionId Faction identifier
     * @returns Spawned ants
     */
    public spawnStarterAnts(
        queenX: number,
        queenY: number,
        config: AntClusterConfig,
        factionId: string
    ): AntSpawnResult {
        const ants: Ant[] = [];
        const positions: Array<{ x: number; y: number }> = [];
        const jobCounts = { gatherer: 0, builder: 0, warrior: 0, scout: 0 };

        // Extract job counts from distribution
        const totalAnts = config.count;
        const builderCount = Math.floor(totalAnts * (config.jobDistribution.builder || 0));
        const gathererCount = Math.floor(totalAnts * (config.jobDistribution.gatherer || 0));
        const scoutCount = Math.floor(totalAnts * (config.jobDistribution.scout || 0));


        // Generate positions using radial cluster
        const constraints = SpawnRuleValidator.getDefaultConstraints('ant');
        const spawnPositions = ClusterSpawner.spawnRadialCluster(
            {x: queenX, y: queenY},
            totalAnts,
            config.radius,
            constraints,
            this.tileGrid,
            {getEntitiesInRadius: this.getEntitiesInRadius} as any
        );


        let posIndex = 0;

        // Spawn builders
        for (let i = 0; i < builderCount && posIndex < spawnPositions.length; i++) {
            const pos = spawnPositions[posIndex++];
            const ant = this.createAnt(pos.x, pos.y, AntJobComponent.JOB_BUILDER, factionId);
            if (ant) {
                ants.push(ant);
                positions.push(pos);
                jobCounts.builder++;
            }
        }

        // Spawn gatherers
        for (let i = 0; i < gathererCount && posIndex < spawnPositions.length; i++) {
            const pos = spawnPositions[posIndex++];
            const ant = this.createAnt(pos.x, pos.y, AntJobComponent.JOB_GATHERER, factionId);
            if (ant) {
                ants.push(ant);
                positions.push(pos);
                jobCounts.gatherer++;
            }
        }

        // Spawn scouts
        for (let i = 0; i < scoutCount && posIndex < spawnPositions.length; i++) {
            const pos = spawnPositions[posIndex++];
            const ant = this.createAnt(pos.x, pos.y, AntJobComponent.JOB_SCOUT, factionId);
            if (ant) {
                ants.push(ant);
                positions.push(pos);
                jobCounts.scout++;
            }
        }

        return { ants, positions, jobCounts };
    }

    /**
     * Spawn ant cluster with job distribution
     * @param centerX Center grid X position
     * @param centerY Center grid Y position
     * @param count Total ants to spawn
     * @param radius Cluster radius
     * @param distribution Job distribution (percentages)
     * @param factionId Faction identifier
     * @returns Spawned ants
     */
    public spawnAntCluster(
        centerX: number,
        centerY: number,
        count: number,
        radius: number,
        distribution: JobDistribution,
        factionId: string
    ): AntSpawnResult {
        const ants: Ant[] = [];
        const positions: Array<{ x: number; y: number }> = [];
        const jobCounts = { gatherer: 0, builder: 0, warrior: 0, scout: 0 };

        // Generate positions using Poisson disk for even distribution
        const constraints = SpawnRuleValidator.getDefaultConstraints('ant');
        const bounds = {
            x: centerX - radius,
            y: centerY - radius,
            width: radius * 2,
            height: radius * 2
        };
        const spawnPositions = ClusterSpawner.spawnPoissonDisk(
            bounds,
            1.5, // minDistance
            constraints,
            this.tileGrid,
            {getEntitiesInRadius: this.getEntitiesInRadius} as any
        );

        // Calculate job counts from distribution
        const jobTypes: number[] = [];
        jobTypes.push(...Array(Math.floor(count * distribution.gatherer)).fill(AntJobComponent.JOB_GATHERER));
        jobTypes.push(...Array(Math.floor(count * distribution.builder)).fill(AntJobComponent.JOB_BUILDER));
        jobTypes.push(...Array(Math.floor(count * distribution.warrior)).fill(AntJobComponent.JOB_WARRIOR));
        jobTypes.push(...Array(Math.floor(count * distribution.scout)).fill(AntJobComponent.JOB_SCOUT));

        // Fill remaining slots with gatherers
        while (jobTypes.length < spawnPositions.length) {
            jobTypes.push(AntJobComponent.JOB_GATHERER);
        }

        // Shuffle job types for variety
        this.shuffleArray(jobTypes);

        // Spawn ants at positions
        for (let i = 0; i < Math.min(spawnPositions.length, jobTypes.length); i++) {
            const pos = spawnPositions[i];
            const jobType = jobTypes[i];
            const ant = this.createAnt(pos.x, pos.y, jobType, factionId);
            
            if (ant) {
                ants.push(ant);
                positions.push(pos);
                
                // Update job counts
                switch (jobType) {
                    case AntJobComponent.JOB_GATHERER: jobCounts.gatherer++; break;
                    case AntJobComponent.JOB_BUILDER: jobCounts.builder++; break;
                    case AntJobComponent.JOB_WARRIOR: jobCounts.warrior++; break;
                    case AntJobComponent.JOB_SCOUT: jobCounts.scout++; break;
                }
            }
        }

        return { ants, positions, jobCounts };
    }

    /**
     * Spawn enemy ants around nest/boss
     * @param nestX Nest center grid X
     * @param nestY Nest center grid Y
     * @param count Number of enemy ants
     * @param radius Spawn radius around nest
     * @param factionId Enemy faction identifier
     * @returns Spawned enemy ants (warriors)
     */
    public spawnEnemyAnts(
        nestX: number,
        nestY: number,
        count: number,
        radius: number,
        factionId: string
    ): AntSpawnResult {
        const ants: Ant[] = [];
        const positions: Array<{ x: number; y: number }> = [];
        const jobCounts = { gatherer: 0, builder: 0, warrior: 0, scout: 0 };

        // Generate positions using radial cluster
        const constraints = SpawnRuleValidator.getDefaultConstraints('ant');
        const spawnPositions = ClusterSpawner.spawnRadialCluster(
            {x: nestX, y: nestY},
            count,
            radius,
            constraints,
            this.tileGrid,
            {getEntitiesInRadius: this.getEntitiesInRadius} as any
        );

        // Spawn all as warriors (enemy ants are aggressive)
        for (const pos of spawnPositions) {
            const ant = this.createAnt(pos.x, pos.y, AntJobComponent.JOB_WARRIOR, factionId);
            if (ant) {
                ants.push(ant);
                positions.push(pos);
                jobCounts.warrior++;
            }
        }

        return { ants, positions, jobCounts };
    }

    /**
     * Create a single ant using AntFactory
     * @returns Ant instance or null if sprite not registered
     */
    private createAnt(
        gridX: number,
        gridY: number,
        jobType: number,
        factionId: string
    ): Ant | null {
        const sprite = this.antSprites.get(jobType);
        if (!sprite) {
            console.error(`❌ Ant sprite not registered for job type ${jobType}. Registered types: ${Array.from(this.antSprites.keys())}`);
            return null;
        }

        return AntFactory.create(
            this.renderer,
            sprite,
            gridX,
            gridY,
            factionId,
            jobType
        );
    }

    /**
     * Fisher-Yates shuffle algorithm
     */
    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
