/**
 * EnvironmentEffectsManager
 * Handles environmental hazards (water damage, drowning) and visual effects (swimming particles)
 */

import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';
import { GameObject } from '../classes/GameObject';
import { HealthComponent } from '../classes/components/HealthComponent';
import { TileGrid } from '../world/TileGrid';
import { TileType } from '../world/TileSystem';
import { HAZARDOUS_TILES, WATER_EFFECT_CONFIG, TILE_PARTICLE_COLORS } from '../config/environmentEffectsConfig';
import { WATER_PARTICLE_CONFIG } from '../config/visualEffects/waterParticleConfig';
import { gridToWorldCenter } from '../utils/helpers';
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
        // Listen for entity movement to check tile type
        this.subscribe(GameEvents.ENTITY_MOVED, (entityId: string, gridX: number, gridY: number) => {
            this.checkEntityTile(entityId, gridX, gridY);
        });

        // Listen for entity destruction to cleanup
        this.subscribe(GameEvents.ENTITY_DESTROYED, (entityId: string) => {
            this.entityStates.delete(entityId);
        });
    }

    /**
     * Check if entity is on a hazardous tile
     */
    private checkEntityTile(entityId: string, gridX: number, gridY: number): void {
        if (!this.tileGrid) {
            return;
        }

        const tileType = this.tileGrid.getTileType(gridX, gridY);
        if (tileType === null) return;

        const hazardConfig = HAZARDOUS_TILES[tileType as keyof typeof HAZARDOUS_TILES];
        const wasInHazard = this.entityStates.get(entityId)?.inHazard || false;
        const isInHazard = hazardConfig !== undefined;

        if (isInHazard) {
            // Entity entered or is still in hazard
            if (!this.entityStates.has(entityId)) {
                // First time entering hazard
                this.entityStates.set(entityId, {
                    entityId,
                    tileType,
                    lastDamageTime: Date.now(),
                    lastParticleTime: Date.now(),
                    inHazard: true
                });

                // Emit splash event (for sound)
                this.emit(GameEvents.ENTITY_ENTER_WATER, entityId, gridX, gridY);
            } else {
                // Update tile type in case they moved to different hazard
                const state = this.entityStates.get(entityId)!;
                state.tileType = tileType;
                state.inHazard = true;
            }
        } else if (wasInHazard) {
            // Entity left hazard
            this.entityStates.delete(entityId);
            this.emit(GameEvents.ENTITY_EXIT_WATER, entityId);
        }
    }

    /**
     * Update all environmental effects
     * Call this from game loop
     */
    public update(entities: GameObject[]): void {
        if (this.entityStates.size === 0) return; // Skip if no entities in hazards
        
        const now = Date.now();

        // Update each entity in hazardous tiles
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
                    health.takeDamage(hazardConfig.damagePerSecond, 'environment');
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
     */
    private spawnSwimmingParticles(entity: GameObject, tileType: TileType): void {
        if (!this.renderer) {
            return;
        }

        const worldPos = gridToWorldCenter(entity.gridX, entity.gridY, TILE_SIZE);
        const color = TILE_PARTICLE_COLORS[tileType] || WATER_PARTICLE_CONFIG.color;

        // Detect sprite size for scaling particles
        // Try to get sprite component from entity's internal _cleanup or attached renderables
        let spriteScale = 1.0;
        const entityAny = entity as any;
        
        // Check if entity has a sprite reference (set by setupEntitySpriteBinding)
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
            
            const particleX = worldPos.x + offsetX;
            const particleY = worldPos.y + offsetY + WATER_EFFECT_CONFIG.sinkDepth;
            
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
