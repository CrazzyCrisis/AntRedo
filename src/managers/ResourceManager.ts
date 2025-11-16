import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';
/**
 * ResourceManager - Resource Economy Manager (CONTROLLER)
 * Singleton manager for tracking and managing faction resources
 * Handles resource deposits, withdrawals, and warehouse integration
 */


import { ResourceType } from '../config/entityConfig';

/**
 * Resource storage per faction
 */
interface FactionResources {
    food: number;
    wood: number;
    stone: number;
    magicCrystal: number;
}

/**
 * ResourceManager manages all faction resources in the game
 * Tracks global resource pools and provides transaction methods
 */
export class ResourceManager extends BaseManager {
    private static instance: ResourceManager;
    private resources: Map<string, FactionResources>; // factionId â†’ resources

    private constructor() {
        super(); // Initialize BaseManager
        this.resources = new Map();
        this.setupEventListeners();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }

    /**
     * Setup EventBus listeners
     */
    private setupEventListeners(): void {
        // Listen for resource deposits from ants
        this.subscribe('RESOURCE_DEPOSITED', (factionId: string, resourceType: ResourceType, amount: number) => {
            this.addResource(factionId, resourceType, amount);
        });

        // Listen for resource generation from buildings
        this.subscribe('BUILDING_RESOURCE_GENERATED', (factionId: string, resourceType: string, amount: number) => {
            this.addResource(factionId, resourceType as ResourceType, amount);
        });

        // Listen for faction creation to initialize resources
        this.subscribe('FACTION_CREATED', (factionId: string) => {
            this.initializeFactionResources(factionId);
        });
    }

    /**
     * Initialize resources for a new faction
     * @param factionId - Faction ID
     */
    private initializeFactionResources(factionId: string): void {
        this.resources.set(factionId, {
            food: 100,        // Starting resources
            wood: 50,
            stone: 50,
            magicCrystal: 0   // Rare resource starts at 0
        });
    }

    /**
     * Public method to initialize a faction (for testing)
     * @param factionId - Faction ID
     */
    public initializeFaction(factionId: string): void {
        this.initializeFactionResources(factionId);
    }

    /**
     * Add resources to faction
     * @param factionId - Faction ID
     * @param type - Resource type
     * @param amount - Amount to add
     */
    public addResource(factionId: string, type: ResourceType, amount: number): void {
        const factionResources = this.resources.get(factionId);
        if (!factionResources) {
            console.warn(`Faction ${factionId} has no resource storage!`);
            return;
        }

        factionResources[type] += amount;

        // Emit update event for UI
        this.emit(GameEvents.RESOURCE_UPDATED, factionId, type, factionResources[type]);
    }

    /**
     * Remove resources from faction
     * @param factionId - Faction ID
     * @param type - Resource type
     * @param amount - Amount to remove
     * @returns True if successful, false if insufficient resources
     */
    public removeResource(factionId: string, type: ResourceType, amount: number): boolean {
        const factionResources = this.resources.get(factionId);
        if (!factionResources) {
            return false;
        }

        // Check if enough resources
        if (factionResources[type] < amount) {
            this.emit('RESOURCE_INSUFFICIENT', factionId, type, factionResources[type], amount);
            return false;
        }

        factionResources[type] -= amount;

        // Emit update event for UI
        this.emit(GameEvents.RESOURCE_UPDATED, factionId, type, factionResources[type]);

        return true;
    }

    /**
     * Check if faction has enough resources
     * @param factionId - Faction ID
     * @param type - Resource type
     * @param amount - Amount needed
     * @returns True if faction has enough
     */
    public hasEnough(factionId: string, type: ResourceType, amount: number): boolean {
        const factionResources = this.resources.get(factionId);
        if (!factionResources) {
            return false;
        }

        return factionResources[type] >= amount;
    }

    /**
     * Get resource count for faction
     * @param factionId - Faction ID
     * @param type - Resource type
     * @returns Current amount
     */
    public getResourceCount(factionId: string, type: ResourceType): number {
        const factionResources = this.resources.get(factionId);
        if (!factionResources) {
            return 0;
        }

        return factionResources[type];
    }

    /**
     * Get all resource counts for faction
     * @param factionId - Faction ID
     * @returns Copy of faction resources or null
     */
    public getAllResourceCounts(factionId: string): FactionResources | null {
        const factionResources = this.resources.get(factionId);
        if (!factionResources) {
            return null;
        }

        // Return copy to prevent external modification
        return { ...factionResources };
    }

    /**
     * Check if faction can afford multiple resources
     * @param factionId - Faction ID
     * @param costs - Map of resource types to amounts
     * @returns True if faction can afford all costs
     */
    public canAfford(factionId: string, costs: Partial<FactionResources>): boolean {
        const factionResources = this.resources.get(factionId);
        if (!factionResources) {
            return false;
        }

        for (const [type, amount] of Object.entries(costs)) {
            if (amount && factionResources[type as ResourceType] < amount) {
                return false;
            }
        }

        return true;
    }

    /**
     * Spend multiple resources at once
     * @param factionId - Faction ID
     * @param costs - Map of resource types to amounts
     * @returns True if successful, false if insufficient
     */
    public spendResources(factionId: string, costs: Partial<FactionResources>): boolean {
        // Check if can afford first
        if (!this.canAfford(factionId, costs)) {
            return false;
        }

        // Deduct all resources
        for (const [type, amount] of Object.entries(costs)) {
            if (amount) {
                this.removeResource(factionId, type as ResourceType, amount);
            }
        }

        return true;
    }

    /**
     * Set resource count directly (for testing/cheats)
     * @param factionId - Faction ID
     * @param type - Resource type
     * @param amount - New amount
     */
    public setResource(factionId: string, type: ResourceType, amount: number): void {
        const factionResources = this.resources.get(factionId);
        if (!factionResources) {
            return;
        }

        factionResources[type] = amount;
        this.emit(GameEvents.RESOURCE_UPDATED, factionId, type, amount);
    }

    /**
     * Try to consume food for healing
     * @param factionId - Faction ID
     * @param foodAmount - Amount of food to consume
     * @returns True if food was consumed, false if insufficient food
     */
    public consumeFoodForHealing(factionId: string, foodAmount: number): boolean {
        return this.removeResource(factionId, 'food', foodAmount);
    }

    /**
     * Clear all resources (for testing)
     */
    public clear(): void {
        this.resources.clear();
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
