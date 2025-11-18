/**
 * Resource - Collectable Resource Entity (MODEL)
 * Simple GameObject representing resources (food, wood, stone, magic crystals)
 * Ants detect via smell range, collect, and deplete when empty
 */

import { GameObject } from './GameObject';
import { EventBus } from '../utils/eventBus';
import { ENTITY_CONFIG, ResourceType } from '../config/gameplay/entityConfig';
import { RESOURCE_EXTRACTION } from '../config/gameplay/resourceGatheringConfig';
import { randomInt } from '../utils/helpers';

export class Resource extends GameObject {
    public readonly resourceType: ResourceType;
    public amount: number;
    public isCollectable: boolean;
    public readonly maxYield: number;       // Total yield this resource started with
    public currentYield: number;            // How much is left to extract
    public isBeingHarvested: boolean;       // Is an ant currently extracting?
    public harvesterAntId: string | null;   // Which ant is harvesting

    constructor(gridX: number, gridY: number, resourceType: ResourceType, amount?: number) {
        const config = ENTITY_CONFIG.RESOURCES[resourceType];
        super('resource', gridX, gridY, config.collisionSize);
        
        this.resourceType = resourceType;
        this.amount = amount !== undefined ? amount : config.stackAmount;
        this.isCollectable = true;
        
        // Initialize yield tracking from gathering config
        const extractionConfig = RESOURCE_EXTRACTION[resourceType];
        this.maxYield = randomInt(extractionConfig.minYield, extractionConfig.maxYield);
        this.currentYield = this.maxYield;
        this.isBeingHarvested = false;
        this.harvesterAntId = null;
        
        // Emit creation event
        EventBus.emit('RESOURCE_CREATED', this.id, gridX, gridY, resourceType, this.amount);
    }

    /**
     * Extract one unit from this resource (called by ResourceGatheringComponent)
     * @param harvesterAntId - ID of the ant harvesting
     * @returns True if extraction successful, false if depleted
     */
    public extract(harvesterAntId: string): boolean {
        if (!this.isCollectable || this.currentYield <= 0) {
            return false;
        }
        
        // Mark as being harvested
        this.isBeingHarvested = true;
        this.harvesterAntId = harvesterAntId;
        
        // Deplete one unit
        this.currentYield -= 1;
        
        // Emit extraction event
        EventBus.emit('RESOURCE_EXTRACTED', this.id, this.resourceType, this.currentYield, this.maxYield);
        
        // Check if fully depleted
        if (this.currentYield <= 0) {
            this.deplete();
            return false;
        }
        
        return true;
    }

    /**
     * Mark resource as no longer being harvested
     */
    public releaseHarvester(): void {
        this.isBeingHarvested = false;
        this.harvesterAntId = null;
    }

    /**
     * Get extraction progress (0-1, where 1 = fully depleted)
     */
    public getDepletionProgress(): number {
        if (this.maxYield === 0) return 1;
        return 1 - (this.currentYield / this.maxYield);
    }

    /**
     * Check if resource is being harvested by specific ant
     */
    public isHarvestedBy(antId: string): boolean {
        return this.isBeingHarvested && this.harvesterAntId === antId;
    }

    /**
     * Collect from this resource (legacy method for non-gathering collection)
     * @param amount - Amount to collect
     * @returns Actual amount collected (capped by available amount)
     */
    public collect(amount: number): number {
        if (!this.isCollectable || this.amount <= 0) {
            return 0;
        }
        
        // Calculate actual collection amount
        const collected = Math.min(amount, this.amount);
        this.amount -= collected;
        
        // Emit collection event
        EventBus.emit('RESOURCE_COLLECTED', this.id, this.resourceType, collected, this.amount);
        
        // Check if depleted
        if (this.amount <= 0) {
            this.deplete();
        }
        
        return collected;
    }

    /**
     * Check if resource is empty
     */
    public isEmpty(): boolean {
        return this.amount <= 0;
    }

    /**
     * Get resource type
     */
    public getType(): ResourceType {
        return this.resourceType;
    }

    /**
     * Get remaining amount
     */
    public getAmount(): number {
        return this.amount;
    }

    /**
     * Get smell range for this resource type
     */
    public getSmellRange(): number {
        return ENTITY_CONFIG.RESOURCES[this.resourceType].smellRange;
    }

    /**
     * Mark resource as depleted and destroy
     */
    private deplete(): void {
        this.isCollectable = false;
        EventBus.emit('RESOURCE_DEPLETED', this.id, this.resourceType);
        this.destroy();
    }
}
