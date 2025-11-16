/**
 * ResourceGatheringComponent - Autonomous Resource Gathering Behavior
 * Handles smell-based detection, pathfinding to resources, extraction, and inventory management
 * 
 * State Machine:
 * IDLE → SEEKING → MOVING_TO_RESOURCE → EXTRACTING → IDLE
 * 
 * Features:
 * - Smell-based resource detection within configured range
 * - Prioritizes closest resources
 * - Automatic pathfinding to resources
 * - Progressive extraction with timing
 * - Inventory management (stops when full)
 * - Visual progress bar during extraction
 * - Depletion bar on resources
 */

import { BaseComponent } from './BaseComponent';
import { EventBus } from '../../utils/eventBus';
import { RESOURCE_EXTRACTION, GATHERING_BEHAVIOR } from '../../config/resourceGatheringConfig';
import { getEntitiesInRadius, distance } from '../../utils/helpers';
import { Resource } from '../Resource';
import { InventoryComponent } from './InventoryComponent';
import { PathfindingComponent } from './PathfindingComponent';

enum GatheringState {
    IDLE = 'idle',
    SEEKING = 'seeking',
    MOVING_TO_RESOURCE = 'moving_to_resource',
    EXTRACTING = 'extracting'
}

export class ResourceGatheringComponent extends BaseComponent {
    private state: GatheringState;
    private targetResource: Resource | null;
    private extractionProgress: number;         // 0-1 progress of current extraction
    private extractionTimeElapsed: number;      // Time spent extracting current unit
    private scanTimer: number;                  // Time until next resource scan
    private entityManager: any;                 // Reference to EntityManager
    private progressBarCallback: ((progress: number, show: boolean) => void) | null;

    /**
     * Create ResourceGatheringComponent
     * @param entityManager - EntityManager instance for entity queries
     */
    constructor(entityManager: any) {
        super();
        this.state = GatheringState.IDLE;
        this.targetResource = null;
        this.extractionProgress = 0;
        this.extractionTimeElapsed = 0;
        this.scanTimer = 0;
        this.entityManager = entityManager;
        this.progressBarCallback = null;
    }

    /**
     * Set progress bar update callback (called by factory)
     */
    public setProgressBarCallback(callback: (progress: number, show: boolean) => void): void {
        this.progressBarCallback = callback;
    }

    /**
     * Hook: Start gathering behavior when attached
     */
    protected onAttached(): void {
        // Start in seeking state
        this.state = GatheringState.SEEKING;
        this.scanTimer = 0; // Immediate scan
    }

    /**
     * Hook: Clean up when detached
     */
    protected onDetaching(): void {
        this.releaseResource();
        if (this.progressBarCallback) {
            this.progressBarCallback(0, false); // Hide progress bar
        }
    }

    /**
     * Update gathering behavior
     */
    public update(deltaTime: number): void {
        const dt = deltaTime / 1000; // Convert to seconds

        switch (this.state) {
            case GatheringState.IDLE:
                this.updateIdle(dt);
                break;

            case GatheringState.SEEKING:
                this.updateSeeking(dt);
                break;

            case GatheringState.MOVING_TO_RESOURCE:
                this.updateMoving(dt);
                break;

            case GatheringState.EXTRACTING:
                this.updateExtracting(dt);
                break;
        }
    }

    /**
     * IDLE state: Wait a bit before seeking again
     */
    private updateIdle(dt: number): void {
        this.scanTimer += dt;
        
        if (this.scanTimer >= GATHERING_BEHAVIOR.SCAN_INTERVAL) {
            this.scanTimer = 0;
            this.state = GatheringState.SEEKING;
        }
    }

    /**
     * SEEKING state: Scan for resources in smell range
     */
    private updateSeeking(dt: number): void {
        // Check if inventory is full
        const inventory = this.owner.getComponent('Inventory') as InventoryComponent;
        if (!inventory || inventory.isFull()) {
            this.state = GatheringState.IDLE;
            return;
        }

        // Scan for resources in smell range
        const resources = this.findResourcesInSmellRange();
        
        if (resources.length === 0) {
            // No resources found, wait and try again
            this.scanTimer += dt;
            if (this.scanTimer >= GATHERING_BEHAVIOR.SCAN_INTERVAL) {
                this.scanTimer = 0;
            }
            return;
        }

        // Prioritize closest resource
        const closest = this.findClosestResource(resources);
        if (closest) {
            this.targetResource = closest;
            this.startMovingToResource();
        }
    }

    /**
     * MOVING_TO_RESOURCE state: Pathfind to target resource
     */
    private updateMoving(_dt: number): void {
        if (!this.targetResource || !this.targetResource.isActive) {
            // Resource disappeared, go back to seeking
            this.releaseResource();
            this.state = GatheringState.SEEKING;
            return;
        }

        // Check if close enough to extract
        const dist = distance(
            this.owner.gridX,
            this.owner.gridY,
            this.targetResource.gridX,
            this.targetResource.gridY
        );

        const extractionConfig = RESOURCE_EXTRACTION[this.targetResource.resourceType];
        
        if (dist <= extractionConfig.extractionRange) {
            // Close enough, start extracting
            this.startExtracting();
        }
        // Otherwise, pathfinding component handles movement
    }

    /**
     * EXTRACTING state: Extract resources over time
     */
    private updateExtracting(dt: number): void {
        if (!this.targetResource || !this.targetResource.isActive) {
            // Resource disappeared
            this.releaseResource();
            this.state = GatheringState.SEEKING;
            return;
        }

        const extractionConfig = RESOURCE_EXTRACTION[this.targetResource.resourceType];
        
        // Update extraction progress
        this.extractionTimeElapsed += dt;
        this.extractionProgress = this.extractionTimeElapsed / extractionConfig.extractionTime;

        // Update progress bar
        if (this.progressBarCallback) {
            this.progressBarCallback(this.extractionProgress, true);
        }

        // Check if extraction complete
        if (this.extractionProgress >= 1.0) {
            this.completeExtraction();
        }
    }

    /**
     * Find all resources within smell range
     */
    private findResourcesInSmellRange(): Resource[] {
        const entities = getEntitiesInRadius(
            this.entityManager,
            this.owner.gridX,
            this.owner.gridY,
            20, // Max scan radius (will filter by smell range per resource)
            true
        );

        return entities.filter((entity: any) => {
            if (!(entity instanceof Resource)) return false;
            if (!entity.isCollectable) return false;
            if (entity.isBeingHarvested && !entity.isHarvestedBy(this.owner.id)) return false;

            const extractionConfig = RESOURCE_EXTRACTION[entity.resourceType];
            const dist = distance(
                this.owner.gridX,
                this.owner.gridY,
                entity.gridX,
                entity.gridY
            );

            return dist <= extractionConfig.smellRange;
        }) as Resource[];
    }

    /**
     * Find closest resource from list
     */
    private findClosestResource(resources: Resource[]): Resource | null {
        if (resources.length === 0) return null;

        let closest: Resource | null = null;
        let closestDist = Infinity;

        for (const resource of resources) {
            const dist = distance(
                this.owner.gridX,
                this.owner.gridY,
                resource.gridX,
                resource.gridY
            );

            if (dist < closestDist) {
                closestDist = dist;
                closest = resource;
            }
        }

        return closest;
    }

    /**
     * Start pathfinding to target resource
     */
    private startMovingToResource(): void {
        if (!this.targetResource) return;

        // Note: Pathfinding requires grid reference
        // For now, just set state - actual pathfinding integration TBD
        this.state = GatheringState.MOVING_TO_RESOURCE;
        
        EventBus.emit('ANT_GATHERING_STARTED', this.owner.id, this.targetResource.id);
    }

    /**
     * Start extracting from target resource
     */
    private startExtracting(): void {
        if (!this.targetResource) return;

        // Stop movement
        const pathfinding = this.owner.getComponent('Pathfinding') as PathfindingComponent;
        if (pathfinding) {
            pathfinding.clearPath(); // Clear path to stop movement
        }

        // Reset extraction progress
        this.extractionProgress = 0;
        this.extractionTimeElapsed = 0;

        // Mark resource as being harvested
        this.targetResource.isBeingHarvested = true;
        this.targetResource.harvesterAntId = this.owner.id;

        this.state = GatheringState.EXTRACTING;
        
        EventBus.emit('ANT_EXTRACTING', this.owner.id, this.targetResource.id);
    }

    /**
     * Complete one extraction cycle (add to inventory, check if resource depleted)
     */
    private completeExtraction(): void {
        if (!this.targetResource) return;

        const inventory = this.owner.getComponent('Inventory') as InventoryComponent;
        if (!inventory) return;

        // Add to inventory
        const resourceType = this.targetResource.resourceType;
        const added = inventory.addItem(resourceType, 1);

        if (!added) {
            // Inventory full, stop gathering
            this.releaseResource();
            this.state = GatheringState.IDLE;
            if (this.progressBarCallback) {
                this.progressBarCallback(0, false);
            }
            return;
        }

        // Extract from resource
        const resourceStillExists = this.targetResource.extract(this.owner.id);

        if (!resourceStillExists) {
            // Resource depleted, seek new one
            this.releaseResource();
            this.state = GatheringState.SEEKING;
            if (this.progressBarCallback) {
                this.progressBarCallback(0, false);
            }
        } else {
            // Continue extracting from same resource
            this.extractionProgress = 0;
            this.extractionTimeElapsed = 0;
            // Keep progress bar visible, reset to 0
            if (this.progressBarCallback) {
                this.progressBarCallback(0, true);
            }
        }
    }

    /**
     * Release current target resource
     */
    private releaseResource(): void {
        if (this.targetResource) {
            this.targetResource.releaseHarvester();
            this.targetResource = null;
        }
    }

    /**
     * Get current state (for debugging/UI)
     */
    public getState(): string {
        return this.state;
    }

    /**
     * Get target resource (for debugging/UI)
     */
    public getTargetResource(): Resource | null {
        return this.targetResource;
    }
}

