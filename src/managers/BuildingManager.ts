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

        // Emit ant spawning signal for barracks buildings
        if (buildingType === 'barracks') {
            console.log(`[BuildingManager] Barracks placed - emitting ant spawn signal`);
            EventBus.emit('BARRACKS_PLACED', building.id, factionId, gridX, gridY);
        }
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
     * @param buildingId - Building ID
     */
    private onBuildingCompleted(buildingId: string): void {
        const building = this.buildings.get(buildingId);
        if (!building) return;

        // Apply ant cap bonus to faction
        // Buildings would need a factionId property to know which faction to boost
        const antCapBonus = building.getAntCapBonus();
        if (antCapBonus > 0) {
            // FactionManager.getInstance().increaseAntCap(factionId, antCapBonus);
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
     * @param buildingId - Building ID
     */
    public destroyBuilding(buildingId: string): void {
        const building = this.buildings.get(buildingId);
        if (building) {
            building.destroy();
        }
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

    /**
     * Update all buildings (construction progress, resource generation)
     * @param deltaTime - Time elapsed in seconds
     */
    public update(deltaTime: number): void {
        for (const building of this.buildings.values()) {
            if (!building.isActive) continue;

            // Update construction progress from workers
            if (!building.isConstructed && building.workers.size > 0) {
                const progressPerWorker = 1; // Progress per worker per second
                const progress = building.workers.size * progressPerWorker * deltaTime;
                building.addProgress(progress);
            }

            // Generate resources
            if (building.isConstructed) {
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
