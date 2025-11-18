/**
 * EnvironmentEffectsManager
 * Handles environmental hazards (water damage, drowning) and visual effects (swimming particles)
 */

import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';
import { GameObject } from '../classes/GameObject';
import { HealthComponent, DamageSource } from '../classes/components/HealthComponent';
import { TileGrid } from '../world/TileGrid';
import { TileType } from '../world/TileSystem';
import { HAZARDOUS_TILES, WATER_EFFECT_CONFIG, TILE_PARTICLE_COLORS } from '../config/world/environmentEffectsConfig';
import { WATER_PARTICLE_CONFIG } from '../config/visualEffects/waterParticleConfig';
import { TILE_SIZE } from '../world/TileSystem';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { WaterParticleComponent } from '../rendering/components/WaterParticleComponent';

interface EntityHazardState {
    entityId: string;
    tileType: TileType;
    lastDamageTime: number;
    lastParticleTime: number;
    inHazard: boolean;
}

export class EnvironmentEffectsManager extends BaseManager {
    private static instance: EnvironmentEffectsManager;
    private tileGrid: TileGrid | null = null;
    private renderer: Renderer | null = null;
    private entityStates: Map<string, EntityHazardState> = new Map();
    private activeParticles: Set<WaterParticleComponent> = new Set();

    private constructor() {
        super();
        this.setupEventListeners();
    }

    public static getInstance(): EnvironmentEffectsManager {
        if (!EnvironmentEffectsManager.instance) {
            EnvironmentEffectsManager.instance = new EnvironmentEffectsManager();
        }
        return EnvironmentEffectsManager.instance;
    }

    /**
     * Set tile grid for tile type detection
     */
    public setTileGrid(tileGrid: TileGrid): void {
        this.tileGrid = tileGrid;
    }

    /**
     * Set renderer for visual effects
     */
    public setRenderer(renderer: Renderer): void {
        this.renderer = renderer;
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // Listen for entity destruction to cleanup
        this.subscribe(GameEvents.ENTITY_DESTROYED, (entityId: string) => {
            this.entityStates.delete(entityId);
        });
    }

    /**
     * Check if entity is on a hazardous tile based on smooth (rendered) position
     */
    private checkEntityTile(entity: GameObject): { isInHazard: boolean; tileType: TileType | null } {
        if (!this.tileGrid) {
            return { isInHazard: false, tileType: null };
        }

        // Use smooth position to determine tile (where sprite actually renders)
        const smoothPos = entity.getSmoothPosition();
        const centerOffset = TILE_SIZE / 2;
        const worldX = smoothPos.x + centerOffset;
        const worldY = smoothPos.y + centerOffset;
        
        // Convert world position to grid position
        const gridX = Math.floor(worldX / TILE_SIZE);
        const gridY = Math.floor(worldY / TILE_SIZE);
        
        const tileType = this.tileGrid.getTileType(gridX, gridY);
        if (tileType === null) {
            return { isInHazard: false, tileType: null };
        }

        const hazardConfig = HAZARDOUS_TILES[tileType as keyof typeof HAZARDOUS_TILES];
        const isInHazard = hazardConfig !== undefined;
        
        return { isInHazard, tileType };
    }

    /**
     * Update all environmental effects
     * Call this from game loop
     * Checks hazards based on entity's smooth (rendered) position
     */
    public update(entities: GameObject[]): void {
        if (!this.tileGrid) return;
        
        const now = Date.now();

        // Check all entities for hazard status based on their smooth position
        for (const entity of entities) {
            const { isInHazard, tileType } = this.checkEntityTile(entity);
            const wasInHazard = this.entityStates.has(entity.id);
            
            if (isInHazard && tileType !== null) {
                // Entity is in hazard
                if (!wasInHazard) {
                    // First time entering hazard
                    this.entityStates.set(entity.id, {
                        entityId: entity.id,
                        tileType,
                        lastDamageTime: now,
                        lastParticleTime: now,
                        inHazard: true
                    });

                    // Emit splash event (for sound)
                    this.emit(GameEvents.ENTITY_ENTER_WATER, entity.id, entity.gridX, entity.gridY);
                } else {
                    // Still in hazard - update tile type if changed
                    const state = this.entityStates.get(entity.id)!;
                    state.tileType = tileType;
                }
            } else if (wasInHazard) {
                // Entity left hazard
                this.entityStates.delete(entity.id);
                this.emit(GameEvents.ENTITY_EXIT_WATER, entity.id);
            }
        }

        // Apply damage and spawn particles for entities in hazards
        this.entityStates.forEach((state, entityId) => {
            const entity = entities.find(e => e.id === entityId);
            if (!entity) {
                this.entityStates.delete(entityId);
                return;
            }

            const hazardConfig = HAZARDOUS_TILES[state.tileType as keyof typeof HAZARDOUS_TILES];
            if (!hazardConfig) return;

            // Apply damage at intervals
            if (now - state.lastDamageTime >= hazardConfig.damageInterval) {
                const health = entity.getComponent('Health') as HealthComponent;
                if (health && health.isAlive()) {
                    // Use smooth position to get current grid tile for damage source
                    const smoothPos = entity.getSmoothPosition();
                    const centerOffset = TILE_SIZE / 2;
                    const worldX = smoothPos.x + centerOffset;
                    const worldY = smoothPos.y + centerOffset;
                    const gridX = Math.floor(worldX / TILE_SIZE);
                    const gridY = Math.floor(worldY / TILE_SIZE);
                    
                    // Create damage source with tile position
                    const damageSource: DamageSource = {
                        type: 'hazard',
                        tileX: gridX,
                        tileY: gridY,
                        timestamp: now
                    };
                    
                    health.takeDamage(hazardConfig.damagePerSecond, 'environment', false, damageSource);
                }
                state.lastDamageTime = now;
            }

            // Spawn swimming particles
            if (WATER_PARTICLE_CONFIG.spawnRate > 0 && this.renderer) {
                const particleInterval = 1000 / WATER_PARTICLE_CONFIG.spawnRate;
                
                if (now - state.lastParticleTime >= particleInterval) {
                    this.spawnSwimmingParticles(entity, state.tileType);
                    state.lastParticleTime = now;
                }
            }
        });
    }

    /**
     * Spawn swimming particles around entity
     * Particles scale with entity sprite size
     * Uses entity's smooth (rendered) position for accurate placement
     */
    private spawnSwimmingParticles(entity: GameObject, tileType: TileType): void {
        if (!this.renderer) {
            return;
        }

        // Use smooth position (where sprite is actually rendered) instead of grid position
        const smoothPos = entity.getSmoothPosition();
        const centerOffset = TILE_SIZE / 2; // Sprites render from center
        const worldX = smoothPos.x + centerOffset;
        const worldY = smoothPos.y + centerOffset;
        
        const color = TILE_PARTICLE_COLORS[tileType] || WATER_PARTICLE_CONFIG.color;

        // Detect sprite size for scaling particles
        let spriteScale = 1.0;
        const entityAny = entity as any;
        
        if (entityAny._spriteComponent) {
            spriteScale = entityAny._spriteComponent.scale || 1.0;
        }

        // Calculate scaled spawn radius and particle size
        const scaledSpawnRadius = WATER_PARTICLE_CONFIG.spawnRadius * spriteScale;
        const particleSizeMin = WATER_PARTICLE_CONFIG.size.min * spriteScale;
        const particleSizeMax = WATER_PARTICLE_CONFIG.size.max * spriteScale;

        // Spawn 2-3 particles per interval
        const particleCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < particleCount; i++) {
            // Random offset within spawn radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * scaledSpawnRadius;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            const particleX = worldX + offsetX;
            const particleY = worldY + offsetY + WATER_EFFECT_CONFIG.sinkDepth;
            
            // Create particle with scaled size
            const particleSize = particleSizeMin + Math.random() * (particleSizeMax - particleSizeMin);
            const particle = new WaterParticleComponent(particleX, particleY, color, particleSize);
            
            const unregister = this.renderer.register(particle);
            this.activeParticles.add(particle);
            
            // Mark layer as dirty to force redraw
            this.renderer.markLayerDirty(RenderLayer.VISUAL_EFFECTS);

            // Auto-cleanup when finished
            const checkInterval = setInterval(() => {
                if (particle.isFinished()) {
                    clearInterval(checkInterval);
                    this.activeParticles.delete(particle);
                    unregister();
                }
            }, 100);
        }
    }

    /**
     * Check if entity is in water (for visual sinking effect)
     */
    public isEntityInWater(entityId: string): boolean {
        const state = this.entityStates.get(entityId);
        return state?.inHazard || false;
    }

    /**
     * Get sink depth for entity (for rendering offset)
     */
    public getEntitySinkDepth(entityId: string): number {
        const state = this.entityStates.get(entityId);
        if (!state || !state.inHazard) return 0;

        // Check if it's a water tile
        const hazardConfig = HAZARDOUS_TILES[state.tileType as keyof typeof HAZARDOUS_TILES];
        if (hazardConfig?.effectType === 'drowning') {
            return WATER_EFFECT_CONFIG.sinkDepth;
        }

        return 0;
    }

    /**
     * Cleanup
     */
    public cleanup(): void {
        this.cleanupSubscriptions();
        this.entityStates.clear();
        this.activeParticles.clear();
        this.tileGrid = null;
        this.renderer = null;
    }
}
