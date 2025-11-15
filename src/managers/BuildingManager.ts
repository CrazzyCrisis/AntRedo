/**
 * BuildingManager - Building System Manager (CONTROLLER)
 * Singleton manager for tracking and managing all buildings
 * Handles construction, leveling, worker assignment, and stat boosts
 */

import { Building } from '../classes/Building';
import { BuildingType } from '../config/entityConfig';
import { EventBus } from '../utils/eventBus';
import { EntityManager } from './EntityManager';
import { ResourceManager } from './ResourceManager';
import { distance } from '../utils/helpers';
import { ENTITY_CONFIG } from '../config/entityConfig';

/**
 * BuildingManager manages all buildings in the game
 * Tracks buildings by faction, handles construction and leveling
 */
export class BuildingManager {
    private static instance: BuildingManager;
    private buildings: Map<string, Building>; // buildingId → Building
    private buildingsByFaction: Map<string, Set<string>>; // factionId → building IDs

    private constructor() {
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
     * Setup EventBus listeners
     */
    private setupEventListeners(): void {
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
    }

    /**
     * Track a new building
     * @param building - Building to track
     */
    private trackBuilding(building: Building): void {
        this.buildings.set(building.id, building);

        // Track by faction (buildings don't have factionId yet - would need to add)
        // For now, skip faction tracking
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

        EventBus.emit('BUILDING_LEVEL_UP_COMPLETE', buildingId, newLevel);
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
            EventBus.emit('BUILDING_PLACEMENT_FAILED', factionId, buildingType, 'insufficient_resources');
            return null;
        }

        // Spend resources
        ResourceManager.getInstance().spendResources(factionId, costs);

        // Create building (factory would normally handle this)
        const building = new Building(gridX, gridY, buildingType);

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
}
