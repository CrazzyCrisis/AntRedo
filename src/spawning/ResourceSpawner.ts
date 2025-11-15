/**
 * ResourceSpawner - Spawns resource entities using noise-based veins or clusters
 * 
 * Responsibilities:
 * - Spawn resource veins following Perlin noise patterns
 * - Spawn resource clusters with Poisson disk distribution
 * - Validate spawn positions (no water, proper spacing)
 * - Track spawned resources (no respawn when depleted)
 * 
 * Pattern:
 * - Uses ResourceFactory to create entities
 * - Integrates with NoiseLayerManager for vein generation
 * - Uses ClusterSpawner for cluster positioning
 */

import { Resource } from '../classes/Resource';
import { ResourceFactory } from '../factories/ResourceFactory';
import { ResourceType } from '../config/entityConfig';
import { Renderer } from '../rendering/Renderer';
import { SpawnRuleValidator } from './SpawnRule';
import { ClusterSpawner } from './ClusterSpawner';
import { NoiseLayerManager } from './NoiseLayerManager';
import { ResourceVeinConfig } from '../config/spawnConfig';

/**
 * Bounds for spawning area
 */
export interface SpawnBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * Result of resource spawning
 */
export interface ResourceSpawnResult {
    resources: Resource[];
    positions: Array<{ x: number; y: number }>;
    totalAmount: number;
}

/**
 * ResourceSpawner creates resource entities using noise-based generation
 */
export class ResourceSpawner {
    private renderer: Renderer;
    private tileGrid: any;
    private getEntitiesInRadius: (x: number, y: number, radius: number) => any[];
    private noiseManager: NoiseLayerManager | null = null;
    private resourceSprites: Map<ResourceType, any>;
    private spawnedResources: Resource[] = []; // Track for depletion

    constructor(
        renderer: Renderer,
        tileGrid: any,
        getEntitiesInRadius: (x: number, y: number, radius: number) => any[]
    ) {
        this.renderer = renderer;
        this.tileGrid = tileGrid;
        this.getEntitiesInRadius = getEntitiesInRadius;
        this.resourceSprites = new Map();
    }

    /**
     * Set noise layer manager for vein generation
     */
    public setNoiseManager(manager: NoiseLayerManager): void {
        this.noiseManager = manager;
    }

    /**
     * Register resource sprite for a type
     */
    public registerSprite(resourceType: ResourceType, sprite: any): void {
        this.resourceSprites.set(resourceType, sprite);
    }

    /**
     * Spawn resource vein following Perlin noise pattern
     * @param bounds Area to spawn in
     * @param config Resource vein configuration
     * @param noiseLayer Name of noise layer to use
     * @returns Spawned resources
     */
    public spawnResourceVein(
        bounds: SpawnBounds,
        config: ResourceVeinConfig,
        noiseLayer: string
    ): ResourceSpawnResult {
        if (!this.noiseManager) {
            console.error('❌ NoiseLayerManager not set, cannot spawn noise-based vein');
            return { resources: [], positions: [], totalAmount: 0 };
        }

        const resources: Resource[] = [];
        const positions: Array<{ x: number; y: number }> = [];
        let totalAmount = 0;

        // Sample grid points in bounds
        const sampleSpacing = 1; // Check every tile
        for (let x = bounds.minX; x <= bounds.maxX; x += sampleSpacing) {
            for (let y = bounds.minY; y <= bounds.maxY; y += sampleSpacing) {
                // Sample noise at this position
                const noiseValue = this.noiseManager.sampleAt(noiseLayer, x, y);

                // Check if noise in threshold range
                if (noiseValue >= config.threshold.min && noiseValue <= config.threshold.max) {
                    // Apply density probability
                    if (Math.random() < config.density) {
                        // Validate spawn position
                        const constraints = SpawnRuleValidator.getDefaultConstraints('resource');
                        const validation = SpawnRuleValidator.canSpawnAt(
                            x, y, constraints,
                            this.tileGrid,
                            {getEntitiesInRadius: this.getEntitiesInRadius} as any
                        );
                        if (validation.valid) {
                            const resource = this.createResource(x, y, config.resourceType as ResourceType, 10);
                            if (resource) {
                                resources.push(resource);
                                positions.push({ x, y });
                                totalAmount += 10;
                                this.spawnedResources.push(resource);
                            }
                        }
                    }
                }
            }
        }

        return { resources, positions, totalAmount };
    }

    /**
     * Spawn resource cluster (alternative to noise-based)
     * @param centerX Center grid X
     * @param centerY Center grid Y
     * @param resourceType Type of resource
     * @param count Number of resource nodes
     * @param radius Cluster radius
     * @param amountPerNode Amount per resource node
     * @returns Spawned resources
     */
    public spawnResourceCluster(
        centerX: number,
        centerY: number,
        resourceType: ResourceType,
        radius: number,
        amountPerNode: number
    ): ResourceSpawnResult {
        const resources: Resource[] = [];
        const positions: Array<{ x: number; y: number }> = [];
        let totalAmount = 0;

        // Generate positions using Poisson disk for even distribution
        const constraints = SpawnRuleValidator.getDefaultConstraints('resource');
        const bounds = {
            x: centerX - radius,
            y: centerY - radius,
            width: radius * 2,
            height: radius * 2
        };
        const spawnPositions = ClusterSpawner.spawnPoissonDisk(
            bounds,
            1.5, // minDistance between resources
            constraints,
            this.tileGrid,
            {getEntitiesInRadius: this.getEntitiesInRadius} as any
        );

        // Spawn resources at positions
        for (const pos of spawnPositions) {
            const resource = this.createResource(pos.x, pos.y, resourceType, amountPerNode);
            if (resource) {
                resources.push(resource);
                positions.push(pos);
                totalAmount += amountPerNode;
                this.spawnedResources.push(resource);
            }
        }

        return { resources, positions, totalAmount };
    }

    /**
     * Get all spawned resources (for tracking depletion)
     */
    public getSpawnedResources(): readonly Resource[] {
        return this.spawnedResources;
    }

    /**
     * Clear spawned resources list (for level reset)
     */
    public clearSpawnedResources(): void {
        this.spawnedResources = [];
    }

    /**
     * Create a single resource using ResourceFactory
     */
    private createResource(
        gridX: number,
        gridY: number,
        resourceType: ResourceType,
        amount: number
    ): Resource | null {
        const sprite = this.resourceSprites.get(resourceType);
        if (!sprite) {
            console.warn(`Resource sprite not registered for type ${resourceType}`);
            return null;
        }

        return ResourceFactory.create(
            this.renderer,
            sprite,
            gridX,
            gridY,
            resourceType,
            amount
        );
    }
}
