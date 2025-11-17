/**
 * BuildingManager - Building System Manager (CONTROLLER)
 * Singleton manager for tracking and managing all buildings
 * Handles construction, leveling, worker assignment, and stat boosts
 */

import { BaseManager } from './BaseManager';
import {
    Building,
    EventBus,
    GameEvents,
    distance,
    BuildingType,
    ENTITY_CONFIG
} from '../imports/managerImports';
import { EntityManager } from './EntityManager';
import { ResourceManager } from './ResourceManager';
import { ProgressBarComponent } from '../rendering/components/ProgressBarComponent';
import { RenderLayer } from '../rendering/RenderLayer';
import { TILE_SIZE } from '../world/TileSystem';
import { gridToWorldCenter } from '../utils/helpers';

/**
 * BuildingManager manages all buildings in the game
 * Tracks buildings by faction, handles construction and leveling
 */
export class BuildingManager extends BaseManager {
    private static instance: BuildingManager;
    private buildings: Map<string, Building>; // buildingId → Building
    private buildingsByFaction: Map<string, Set<string>>; // factionId → building IDs
    private renderer: any = null;
    private constructionSprites: Map<BuildingType, any> = new Map();
    private completedSprites: Map<BuildingType, any> = new Map();

    // Phase 3: Function-specific tracking
    private spawnerTimers: Map<string, number> = new Map(); // buildingId → time until next spawn
    private spawnerProgressBars: Map<string, ProgressBarComponent> = new Map(); // buildingId → progress bar
    private progressBarUnregisterFunctions: Map<string, () => void> = new Map(); // buildingId → unregister function
    private defenseCooldowns: Map<string, number> = new Map(); // buildingId → cooldown remaining
    private activeBeacons: Set<string> = new Set(); // buildingIds with active stat buffs
    private beaconAffectedAnts: Map<string, Set<string>> = new Map(); // beaconId → antIds

    private constructor() {
        super(); // Initialize BaseManager
        this.buildings = new Map();
        this.buildingsByFaction = new Map();
        this.setupEventListeners();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): BuildingManager {
        if (!BuildingManager.instance) {
            BuildingManager.instance = new BuildingManager();
        }
        return BuildingManager.instance;
    }

    /**
     * Initialize manager with dependencies
     * @param renderer - Renderer instance
     * @param sprites - Object with construction and completed sprites for each building type
     */
    public initialize(renderer: any, sprites: { construction: Map<BuildingType, any>, completed: Map<BuildingType, any> }): void {
        this.renderer = renderer;
        this.constructionSprites = sprites.construction;
        this.completedSprites = sprites.completed;
    }

    /**
     * Setup EventBus listeners
     */
    private setupEventListeners(): void {
        // Listen for construction started (from BuildingPlacementManager)
        this.subscribe(GameEvents.BUILDING_CONSTRUCTION_STARTED, (data: { buildingType: BuildingType, gridX: number, gridY: number, factionId: string }) => {
            this.createBuilding(data.buildingType, data.gridX, data.gridY, data.factionId);
        });

        // Listen for building placement to track
        EventBus.on('BUILDING_PLACED', (buildingId: string, _gridX: number, _gridY: number, _buildingType: BuildingType) => {
            const building = EntityManager.getInstance().getEntity(buildingId) as Building;
            if (building) {
                this.trackBuilding(building);
            }
        });

        // Listen for building destruction to cleanup
        EventBus.on('BUILDING_DESTROYED', (buildingId: string) => {
            this.untrackBuilding(buildingId);
        });

        // Listen for building completion to apply effects
        EventBus.on('BUILDING_COMPLETED', (buildingId: string) => {
            this.onBuildingCompleted(buildingId);
        });

        // Listen for building level ups to apply benefits
        EventBus.on('BUILDING_LEVELED_UP', (buildingId: string, newLevel: number) => {
            this.onBuildingLeveledUp(buildingId, newLevel);
        });
        
        // Listen for barracks placement to spawn initial ants
        EventBus.on('BARRACKS_PLACED', (buildingId: string, factionId: string, gridX: number, gridY: number) => {
            this.spawnBarracksAnts(buildingId, factionId, gridX, gridY);
        });
    }

    /**
     * Create a new building using the factory
     * @param buildingType - Type of building to create
     * @param gridX - Grid X position
     * @param gridY - Grid Y position
     * @param factionId - Faction ID
     */
    private createBuilding(buildingType: BuildingType, gridX: number, gridY: number, factionId: string): void {
        if (!this.renderer) {
            console.error('BuildingManager not initialized with renderer');
            return;
        }

        // Check if faction can afford
        const costs = ENTITY_CONFIG.BUILDINGS[buildingType].costs;
        if (!ResourceManager.getInstance().canAfford(factionId, costs)) {
            this.emit('BUILDING_PLACEMENT_FAILED', factionId, buildingType, 'insufficient_resources');
            console.warn(`[BuildingManager] Cannot afford ${buildingType}: Need wood=${costs.wood}, stone=${costs.stone}`);
            return;
        }

        // Deduct resources
        ResourceManager.getInstance().spendResources(factionId, costs);
        console.log(`[BuildingManager] Deducted resources for ${buildingType}: wood=${costs.wood}, stone=${costs.stone}`);

        const constructionSprite = this.constructionSprites.get(buildingType);
        const completedSprite = this.completedSprites.get(buildingType);

        if (!constructionSprite || !completedSprite) {
            console.error(`Missing sprites for building type: ${buildingType}`);
            return;
        }

        // Use BuildingFactory to create building
        const { BuildingFactory } = require('../factories/BuildingFactory');
        const building = BuildingFactory.create(
            this.renderer,
            constructionSprite,
            completedSprite,
            gridX,
            gridY,
            buildingType,
            factionId
        );

        // PHASE 0.2: Start construction (building starts as construction site)
        building.startConstruction();
        console.log(`[BuildingManager] Started construction for ${buildingType} at (${gridX}, ${gridY})`);
    }

    /**
     * Track a new building
     * @param building - Building to track
     */
    private trackBuilding(building: Building): void {
        this.buildings.set(building.id, building);

        // Track by faction
        if (!this.buildingsByFaction.has(building.factionId)) {
            this.buildingsByFaction.set(building.factionId, new Set());
        }
        this.buildingsByFaction.get(building.factionId)!.add(building.id);
    }

    /**
     * Remove building from tracking
     * @param buildingId - Building ID
     */
    private untrackBuilding(buildingId: string): void {
        const building = this.buildings.get(buildingId);
        if (!building) return;

        this.buildings.delete(buildingId);

        // Remove from faction tracking
        for (const buildingSet of this.buildingsByFaction.values()) {
            buildingSet.delete(buildingId);
        }
    }

    /**
     * Handle building completion
     * Phase 3: Initialize spawners, apply storage bonuses, activate defense/beacons
     * @param buildingId - Building ID
     */
    private onBuildingCompleted(buildingId: string): void {
        const building = this.buildings.get(buildingId);
        if (!building) return;

        const { BUILDINGS } = require('../config/buildings/buildingConfig');
        const buildingConfig = BUILDINGS[building.buildingType];

        // Apply ant cap bonus to faction (existing logic)
        const antCapBonus = building.getAntCapBonus();
        if (antCapBonus > 0) {
            // FactionManager.getInstance().increaseAntCap(factionId, antCapBonus);
        }

        // PHASE 3: Initialize building functions based on type
        switch (buildingConfig.functionType) {
            case 'STORAGE':
                // Apply storage bonuses to resource limits
                this.applyStorageBonus(building);
                break;

            case 'SPAWNER':
                // Start spawner timer
                if (buildingConfig.spawnerConfig) {
                    this.startSpawner(buildingId, buildingConfig.spawnerConfig.spawnInterval);
                }
                break;

            case 'DEFENSE':
                // Initialize defense cooldown at 0 (ready to fire)
                this.defenseCooldowns.set(buildingId, 0);
                break;

            case 'STAT_BOOST':
                // Add to active beacons set
                this.activeBeacons.add(buildingId);
                break;
        }

        // PHASE 0.2: Legacy barracks spawn logic (for backwards compatibility)
        if (building.buildingType === 'barracks') {
            console.log(`[BuildingManager] Barracks completed - spawning initial ants`);
            EventBus.emit('BARRACKS_PLACED', building.id, building.factionId, building.gridX, building.gridY);
        }
    }

    /**
     * Handle building level up
     * @param buildingId - Building ID
     * @param newLevel - New level
     */
    private onBuildingLeveledUp(buildingId: string, newLevel: number): void {
        const building = this.buildings.get(buildingId);
        if (!building) return;

        // Calculate ant cap increase from this level
        const config = ENTITY_CONFIG.BUILDINGS[building.buildingType];
        const levelData = config.levels[newLevel - 1];
        const previousLevelData = newLevel > 1 ? config.levels[newLevel - 2] : null;

        const antCapIncrease = (levelData.antCapBonus || 0) - (previousLevelData?.antCapBonus || 0);

        if (antCapIncrease > 0) {
            // FactionManager.getInstance().increaseAntCap(factionId, antCapIncrease);
        }

        this.emit('BUILDING_LEVEL_UP_COMPLETE', buildingId, newLevel);
    }
    
    /**
     * Spawn initial ants when barracks is placed
     * @param buildingId - Building ID
     * @param factionId - Faction ID
     * @param gridX - Grid X position
     * @param gridY - Grid Y position
     */
    private spawnBarracksAnts(_buildingId: string, factionId: string, gridX: number, gridY: number): void {
        console.log(`[BuildingManager] Spawning ants for barracks at (${gridX}, ${gridY})`);
        
        // Spawn 3 worker ants around the barracks
        const { AntFactory } = require('../factories/AntFactory');
        const { AntJobComponent } = require('../classes/components/AntJobComponent');
        
        const spawnOffsets = [
            { dx: -1, dy: 0 },  // Left
            { dx: 1, dy: 0 },   // Right
            { dx: 0, dy: -1 }   // Top
        ];
        
        for (const offset of spawnOffsets) {
            const spawnX = gridX + offset.dx;
            const spawnY = gridY + offset.dy;
            
            // Create worker ant
            AntFactory.create(
                this.renderer,
                spawnX,
                spawnY,
                factionId,
                AntJobComponent.JOB_GATHERER  // Spawn as gatherers/workers
            );
            
            console.log(`[BuildingManager] Spawned worker ant at (${spawnX}, ${spawnY})`);
        }
    }

    /**
     * Place a construction site
     * @param factionId - Faction placing building
     * @param buildingType - Type of building
     * @param gridX - Grid X position
     * @param gridY - Grid Y position
     * @returns Building entity or null if placement failed
     */
    public placeConstructionSite(
        factionId: string,
        buildingType: BuildingType,
        gridX: number,
        gridY: number
    ): Building | null {
        // Check if faction can afford
        const costs = ENTITY_CONFIG.BUILDINGS[buildingType].costs;
        if (!ResourceManager.getInstance().canAfford(factionId, costs)) {
            this.emit('BUILDING_PLACEMENT_FAILED', factionId, buildingType, 'insufficient_resources');
            return null;
        }

        // Spend resources
        ResourceManager.getInstance().spendResources(factionId, costs);

        // Create building (factory would normally handle this)
        const building = new Building(gridX, gridY, buildingType, factionId);

        // Start construction
        building.startConstruction();

        return building;
    }

    /**
     * Complete building construction
     * @param buildingId - Building ID
     */
    public completeBuilding(buildingId: string): void {
        const building = this.buildings.get(buildingId);
        if (building) {
            building.completeConstruction();
        }
    }

    /**
     * Destroy a building
     * Phase 3: Cleanup spawners, storage bonuses, defense, beacons
     * @param buildingId - Building ID
     */
    public destroyBuilding(buildingId: string): void {
        const building = this.buildings.get(buildingId);
        if (!building) return;

        const { BUILDINGS } = require('../config/buildings/buildingConfig');
        const buildingConfig = BUILDINGS[building.buildingType];

        // PHASE 3: Cleanup building functions based on type
        if (building.isConstructed) {
            switch (buildingConfig.functionType) {
                case 'STORAGE':
                    // Remove storage bonuses from resource limits
                    this.removeStorageBonus(building);
                    break;

                case 'SPAWNER':
                    // Stop spawner timer
                    this.stopSpawner(buildingId);
                    break;

                case 'DEFENSE':
                    // Remove defense cooldown
                    this.defenseCooldowns.delete(buildingId);
                    break;

                case 'STAT_BOOST':
                    // Clear beacon buffs and remove from active set
                    this.clearBeaconBuffs(buildingId);
                    this.activeBeacons.delete(buildingId);
                    break;
            }
        }

        // Destroy the building entity
        building.destroy();
    }

    /**
     * Level up a building
     * @param buildingId - Building ID
     * @returns True if successful
     */
    public levelUpBuilding(buildingId: string): boolean {
        const building = this.buildings.get(buildingId);
        if (!building || !building.isConstructed) {
            return false;
        }

        if (building.isMaxLevel()) {
            return false;
        }

        // TODO: Check resource costs and spend resources

        building.levelUp();
        return true;
    }

    /**
     * Get stat boosts in range of position
     * @param gridX - Grid X position
     * @param gridY - Grid Y position
     * @param radius - Search radius
     * @returns Combined stat boosts from all buildings in range
     */
    public getBoostsInRange(gridX: number, gridY: number, radius: number): Record<string, number> {
        const combinedBoosts: Record<string, number> = {};

        for (const building of this.buildings.values()) {
            if (!building.isConstructed) continue;

            // Check distance
            const dist = distance(gridX, gridY, building.gridX, building.gridY);
            if (dist > radius) continue;

            // Combine boosts
            const boosts = building.getBoosts();
            for (const [key, value] of Object.entries(boosts)) {
                combinedBoosts[key] = (combinedBoosts[key] || 0) + value;
            }
        }

        return combinedBoosts;
    }

    /**
     * Get all buildings of a specific type for a faction
     * @param factionId - Faction ID
     * @param buildingType - Building type
     * @returns Array of buildings
     */
    public getBuildingsOfType(factionId: string, buildingType: BuildingType): Building[] {
        const buildingIds = this.buildingsByFaction.get(factionId);
        if (!buildingIds) return [];

        return Array.from(buildingIds)
            .map(id => this.buildings.get(id))
            .filter((b): b is Building => b !== undefined && b.buildingType === buildingType);
    }

    /**
     * Get building by ID
     * @param buildingId - Building ID
     * @returns Building or undefined
     */
    public getBuilding(buildingId: string): Building | undefined {
        return this.buildings.get(buildingId);
    }

    /**
     * Get all buildings
     * @returns Array of all buildings
     */
    public getAllBuildings(): Building[] {
        return Array.from(this.buildings.values());
    }

    /**
     * Get all buildings for a faction
     * @param factionId - Faction ID
     * @returns Array of buildings for the faction
     */
    public getFactionBuildings(factionId: string): Building[] {
        const buildingIds = this.buildingsByFaction.get(factionId);
        if (!buildingIds) return [];
        
        return Array.from(buildingIds)
            .map(id => this.buildings.get(id))
            .filter((b): b is Building => b !== undefined);
    }

    // ========================================================================
    // PHASE 3: BUILDING FUNCTION MANAGEMENT
    // ========================================================================

    /**
     * Initialize spawner for a building (SPAWNER function)
     * Called when building completes construction
     * @param buildingId - Building ID
     * @param spawnInterval - Time between spawns in seconds
     */
    private startSpawner(buildingId: string, spawnInterval: number): void {
        // Initialize spawn timer (time until first spawn)
        this.spawnerTimers.set(buildingId, spawnInterval);
        
        // Create progress bar above the building
        const building = this.buildings.get(buildingId);
        if (building && this.renderer) {
            // Convert grid position to world coordinates
            const centerGridX = building.gridX + building.size.width / 2;
            const centerGridY = building.gridY + building.size.height / 2;
            const { x: worldX, y: worldY } = gridToWorldCenter(centerGridX, centerGridY, TILE_SIZE);
            
            const progressBar = new ProgressBarComponent(
                worldX,
                worldY - TILE_SIZE, // Position above building sprite
                TILE_SIZE * building.size.width, // Width matches building width
                4, // Height
                -TILE_SIZE / 2, // Offset above sprite
                '#00FF00', // Green fill
                '#333333', // Dark background
                '#FFFFFF' // White border
            );
            progressBar.show();
            
            // Register with renderer
            const unregister = this.renderer.register(progressBar, RenderLayer.ABOVE_ENTITIES);
            
            // Track progress bar and unregister function
            this.spawnerProgressBars.set(buildingId, progressBar);
            this.progressBarUnregisterFunctions.set(buildingId, unregister);
        }
        
        console.log(`[BuildingManager] Started spawner for ${buildingId}, interval=${spawnInterval}s`);
    }

    /**
     * Stop spawner for a building (on destruction)
     * @param buildingId - Building ID
     */
    private stopSpawner(buildingId: string): void {
        this.spawnerTimers.delete(buildingId);
        
        // Cleanup progress bar
        const unregister = this.progressBarUnregisterFunctions.get(buildingId);
        if (unregister) {
            unregister(); // Unregister from renderer
            this.progressBarUnregisterFunctions.delete(buildingId);
        }
        this.spawnerProgressBars.delete(buildingId);
        
        console.log(`[BuildingManager] Stopped spawner for ${buildingId}`);
    }

    /**
     * Handle spawner tick (spawn ants from SPAWNER buildings)
     * @param buildingId - Building ID
     * @param building - Building instance
     */
    private handleSpawnTick(buildingId: string, building: Building): void {
        // Import building config to get spawner settings
        const { BUILDINGS } = require('../config/buildings/buildingConfig');
        const config = BUILDINGS[building.buildingType];
        
        if (!config.spawnerConfig) return;

        const spawnerConfig = config.spawnerConfig;
        
        // Check if we've hit max concurrent ants
        const currentAnts = this.getSpawnedAntsCount(buildingId, building.factionId, spawnerConfig.antType);
        if (currentAnts >= spawnerConfig.maxConcurrentAnts) {
            console.log(`[BuildingManager] Spawner ${buildingId} at max capacity (${currentAnts}/${spawnerConfig.maxConcurrentAnts})`);
            return;
        }

        // Get spawn position around building
        const spawnPos = this.getSpawnPosition(building, spawnerConfig.spawnRadius);
        
        // Spawn ant using factory
        const { AntFactory } = require('../factories/AntFactory');
        const ant = AntFactory.create(
            this.renderer,
            spawnPos.gridX,
            spawnPos.gridY,
            building.factionId,
            spawnerConfig.antType
        );

        console.log(`[BuildingManager] Spawner ${buildingId} spawned ${spawnerConfig.antType} at (${spawnPos.gridX}, ${spawnPos.gridY})`);
        this.emit(GameEvents.SPAWNER_ANT_SPAWNED, buildingId, ant.id, spawnerConfig.antType);
    }

    /**
     * Get count of spawned ants for a spawner
     * @param _buildingId - Building ID (unused currently)
     * @param factionId - Faction ID
     * @param antType - Type of ant to count
     * @returns Number of alive ants of this type
     */
    private getSpawnedAntsCount(_buildingId: string, factionId: string, antType: string): number {
        // Count ants with matching faction and job type
        const entityManager = EntityManager.getInstance();
        const ants = entityManager.getEntitiesByType('ant');
        
        return ants.filter((ant: any) => {
            if (ant.factionId !== factionId) return false;
            const jobComponent = ant.getComponent('AntJobComponent');
            return jobComponent && jobComponent.currentJob === antType;
        }).length;
    }

    /**
     * Get spawn position around building
     * @param building - Building instance
     * @param radius - Spawn radius in tiles
     * @returns Grid position to spawn at
     */
    private getSpawnPosition(building: Building, radius: number): { gridX: number, gridY: number } {
        // Random offset within radius
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        
        const offsetX = Math.round(Math.cos(angle) * dist);
        const offsetY = Math.round(Math.sin(angle) * dist);
        
        return {
            gridX: building.gridX + offsetX,
            gridY: building.gridY + offsetY
        };
    }

    /**
     * Apply storage bonus when STORAGE building completes
     * @param building - Building instance
     */
    private applyStorageBonus(building: Building): void {
        const { BUILDINGS } = require('../config/buildings/buildingConfig');
        const config = BUILDINGS[building.buildingType];
        
        if (!config.storageConfig) return;

        const storageConfig = config.storageConfig;
        const resourceManager = ResourceManager.getInstance();

        // Increase resource limits
        if (storageConfig.foodLimit) {
            resourceManager.increaseLimit(building.factionId, 'food', storageConfig.foodLimit);
        }
        if (storageConfig.woodLimit) {
            resourceManager.increaseLimit(building.factionId, 'wood', storageConfig.woodLimit);
        }
        if (storageConfig.stoneLimit) {
            resourceManager.increaseLimit(building.factionId, 'stone', storageConfig.stoneLimit);
        }
        if (storageConfig.magicCrystalLimit) {
            resourceManager.increaseLimit(building.factionId, 'magicCrystal', storageConfig.magicCrystalLimit);
        }

        // Increase ant capacity
        if (storageConfig.antCapacity) {
            resourceManager.increaseAntLimit(building.factionId, storageConfig.antCapacity);
        }

        console.log(`[BuildingManager] Applied storage bonus for ${building.buildingType}`);
    }

    /**
     * Remove storage bonus when STORAGE building destroyed
     * @param building - Building instance
     */
    private removeStorageBonus(building: Building): void {
        const { BUILDINGS } = require('../config/buildings/buildingConfig');
        const config = BUILDINGS[building.buildingType];
        
        if (!config.storageConfig) return;

        const storageConfig = config.storageConfig;
        const resourceManager = ResourceManager.getInstance();

        // Decrease resource limits
        if (storageConfig.foodLimit) {
            resourceManager.decreaseLimit(building.factionId, 'food', storageConfig.foodLimit);
        }
        if (storageConfig.woodLimit) {
            resourceManager.decreaseLimit(building.factionId, 'wood', storageConfig.woodLimit);
        }
        if (storageConfig.stoneLimit) {
            resourceManager.decreaseLimit(building.factionId, 'stone', storageConfig.stoneLimit);
        }
        if (storageConfig.magicCrystalLimit) {
            resourceManager.decreaseLimit(building.factionId, 'magicCrystal', storageConfig.magicCrystalLimit);
        }

        console.log(`[BuildingManager] Removed storage bonus for ${building.buildingType}`);
    }

    /**
     * Update defense towers (DEFENSE function)
     * Find targets, fire projectiles
     * @param buildingId - Building ID
     * @param building - Building instance
     * @param deltaTime - Time elapsed
     */
    private updateDefenseTower(buildingId: string, building: Building, deltaTime: number): void {
        const { BUILDINGS } = require('../config/buildings/buildingConfig');
        const config = BUILDINGS[building.buildingType];
        
        if (!config.defenseConfig) return;

        const defenseConfig = config.defenseConfig;
        
        // Update cooldown
        const currentCooldown = this.defenseCooldowns.get(buildingId) || 0;
        if (currentCooldown > 0) {
            this.defenseCooldowns.set(buildingId, currentCooldown - deltaTime);
            return;
        }

        // Find target
        const target = this.findDefenseTarget(building, defenseConfig.attackRange, defenseConfig.targetPriority);
        if (!target) return;

        // Fire projectile
        this.fireDefenseProjectile(building, target, defenseConfig);
        
        // Set cooldown
        this.defenseCooldowns.set(buildingId, defenseConfig.attackCooldown);
    }

    /**
     * Find target for defense tower
     * @param building - Building instance
     * @param range - Attack range in tiles
     * @param priority - Target priority type
     * @returns Target entity or null
     */
    private findDefenseTarget(building: Building, range: number, priority: string): any {
        const entityManager = EntityManager.getInstance();
        const enemies = entityManager.getEntitiesInRadius(building.gridX, building.gridY, range);
        
        // Filter to only enemies (different faction)
        const validEnemies = enemies.filter((entity: any) => {
            return entity.factionId && entity.factionId !== building.factionId;
        });

        if (validEnemies.length === 0) return null;

        // Apply target priority
        if (priority === 'nearest') {
            return validEnemies.reduce((closest: any, entity: any) => {
                const dist = distance(building.gridX, building.gridY, entity.gridX, entity.gridY);
                const closestDist = distance(building.gridX, building.gridY, closest.gridX, closest.gridY);
                return dist < closestDist ? entity : closest;
            });
        } else if (priority === 'lowest_health') {
            return validEnemies.reduce((lowest: any, entity: any) => {
                const health = entity.getComponent('HealthComponent');
                const lowestHealth = lowest.getComponent('HealthComponent');
                return health && lowestHealth && health.currentHealth < lowestHealth.currentHealth ? entity : lowest;
            });
        }

        return validEnemies[0];
    }

    /**
     * Fire projectile from defense tower
     * @param building - Building instance
     * @param target - Target entity
     * @param defenseConfig - Defense configuration
     */
    private fireDefenseProjectile(building: Building, target: any, defenseConfig: any): void {
        // Emit event for projectile system to handle
        this.emit(GameEvents.DEFENSE_TOWER_FIRED, 
            building.id, 
            building.gridX, 
            building.gridY,
            target.id,
            target.gridX,
            target.gridY,
            defenseConfig.attackDamage,
            defenseConfig.projectileSpeed
        );
        
        console.log(`[BuildingManager] Defense tower ${building.id} fired at ${target.id}`);
    }

    /**
     * Update stat boost beacons (STAT_BOOST function)
     * Apply buffs to ants in range
     * @param buildingId - Building ID
     * @param building - Building instance
     */
    private updateStatBoostBeacon(buildingId: string, building: Building): void {
        const { BUILDINGS } = require('../config/buildings/buildingConfig');
        const config = BUILDINGS[building.buildingType];
        
        if (!config.statBoostConfig) return;

        const boostConfig = config.statBoostConfig;
        
        // Get ants in range
        const affectedAnts = this.getAntsInBeaconRange(building, boostConfig.boostRadius);
        const affectedAntIds = new Set(affectedAnts.map((ant: any) => ant.id));
        
        // Store affected ants for this beacon
        this.beaconAffectedAnts.set(buildingId, affectedAntIds);
        
        // Apply boosts to ants
        affectedAnts.forEach((ant: any) => {
            this.applyBeaconBoosts(ant, boostConfig);
        });
    }

    /**
     * Get ants in beacon range
     * @param building - Building instance
     * @param radius - Boost radius
     * @returns Array of ant entities
     */
    private getAntsInBeaconRange(building: Building, radius: number): any[] {
        const entityManager = EntityManager.getInstance();
        const entities = entityManager.getEntitiesInRadius(building.gridX, building.gridY, radius);
        
        return entities.filter((entity: any) => {
            return entity.entityType === 'ant' && entity.factionId === building.factionId;
        });
    }

    /**
     * Apply beacon stat boosts to ant
     * @param ant - Ant entity
     * @param boostConfig - Stat boost configuration
     */
    private applyBeaconBoosts(ant: any, boostConfig: any): void {
        // Emit event for ant to apply boosts
        this.emit(GameEvents.BEACON_BOOST_APPLIED, 
            ant.id,
            boostConfig.speedBoost,
            boostConfig.attackBoost,
            boostConfig.attackSpeedBoost,
            boostConfig.gatherSpeedBoost,
            boostConfig.terrainSpeedNullifier
        );
    }

    /**
     * Clear beacon buffs when beacon destroyed
     * @param buildingId - Building ID
     */
    private clearBeaconBuffs(buildingId: string): void {
        const affectedAnts = this.beaconAffectedAnts.get(buildingId);
        if (!affectedAnts) return;

        affectedAnts.forEach(antId => {
            this.emit(GameEvents.BEACON_BOOST_REMOVED, antId);
        });

        this.beaconAffectedAnts.delete(buildingId);
    }

    /**
     * Update all buildings (construction progress, resource generation)
     * Phase 3: Now handles spawner timers, defense towers, and stat boost beacons
     * @param deltaTime - Time elapsed in seconds
     */
    public update(deltaTime: number): void {
        const { BUILDINGS } = require('../config/buildings/buildingConfig');

        for (const building of this.buildings.values()) {
            if (!building.isActive) continue;

            // PHASE 0.2: Update construction progress from workers
            if (!building.isConstructed && building.workers.size > 0) {
                const config = ENTITY_CONFIG.BUILDINGS[building.buildingType];
                const constructionTime = config.constructionTime; // Seconds to complete
                // Formula: (workers * 100 / constructionTime) * deltaTime
                // Example: 2 workers, 30s construction, 1s deltaTime = 2 * 100 / 30 * 1 = 6.67% progress
                const progressPerSecond = (building.workers.size * 100) / constructionTime;
                const progress = progressPerSecond * deltaTime;
                building.addProgress(progress);
            }

            // PHASE 3: Handle building functions for constructed buildings
            if (building.isConstructed) {
                const buildingConfig = BUILDINGS[building.buildingType];

                // SPAWNER function: Update spawn timers
                if (buildingConfig.functionType === 'SPAWNER') {
                    const currentTimer = this.spawnerTimers.get(building.id);
                    if (currentTimer !== undefined) {
                        const newTimer = currentTimer - deltaTime;
                        
                        if (newTimer <= 0 && buildingConfig.spawnerConfig) {
                            // Time to spawn!
                            this.handleSpawnTick(building.id, building);
                            // Reset timer to interval
                            this.spawnerTimers.set(building.id, buildingConfig.spawnerConfig.spawnInterval);
                        } else {
                            this.spawnerTimers.set(building.id, newTimer);
                        }
                        
                        // Update progress bar
                        const progressBar = this.spawnerProgressBars.get(building.id);
                        if (progressBar && buildingConfig.spawnerConfig) {
                            const spawnInterval = buildingConfig.spawnerConfig.spawnInterval;
                            const progress = 1 - (Math.max(0, newTimer) / spawnInterval); // Inverted: 0 → 1 as timer counts down
                            progressBar.setProgress(progress);
                            
                            // Convert grid position to world coordinates
                            const centerGridX = building.gridX + building.size.width / 2;
                            const centerGridY = building.gridY + building.size.height / 2;
                            const { x: worldX, y: worldY } = gridToWorldCenter(centerGridX, centerGridY, TILE_SIZE);
                            progressBar.updatePosition(worldX, worldY);
                        }
                    }
                }

                // DEFENSE function: Update defense towers
                if (buildingConfig.functionType === 'DEFENSE') {
                    this.updateDefenseTower(building.id, building, deltaTime);
                }

                // STAT_BOOST function: Update beacons (apply buffs to ants in range)
                if (buildingConfig.functionType === 'STAT_BOOST') {
                    this.updateStatBoostBeacon(building.id, building);
                }

                // Generate resources (existing logic)
                const generated = building.generateResources(deltaTime);
                if (generated > 0) {
                    // Would emit to ResourceManager with faction ID
                }
            }
        }
    }

    /**
     * Clear all buildings (for testing)
     */
    public clear(): void {
        this.buildings.clear();
        this.buildingsByFaction.clear();
    }

    /**
     * Cleanup - unsubscribe from all events
     */
    public cleanup(): void {
        this.cleanupSubscriptions();
        this.clear();
    }

    /**
     * Reinitialize EventBus listeners (for testing after EventBus.clear())
     */
    public reinitializeListeners(): void {
        this.setupEventListeners();
    }
}
