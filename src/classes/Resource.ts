/**
 * Resource - Collectable Resource Entity (MODEL)
 * Simple GameObject representing resources (food, wood, stone, magic crystals)
 * Ants detect via smell range, collect, and deplete when empty
 */

import { GameObject } from './GameObject';
import { EventBus } from '../utils/eventBus';
import { ENTITY_CONFIG, ResourceType } from '../config/entityConfig';

export class Resource extends GameObject {
    public readonly resourceType: ResourceType;
    public amount: number;
    public isCollectable: boolean;

    constructor(gridX: number, gridY: number, resourceType: ResourceType, amount?: number) {
        const config = ENTITY_CONFIG.RESOURCES[resourceType];
        super('resource', gridX, gridY, config.collisionSize);
        
        this.resourceType = resourceType;
        this.amount = amount !== undefined ? amount : config.stackAmount;
        this.isCollectable = true;
        
        // Emit creation event
        EventBus.emit('RESOURCE_CREATED', this.id, gridX, gridY, resourceType, this.amount);
    }

    /**
     * Collect from this resource
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
