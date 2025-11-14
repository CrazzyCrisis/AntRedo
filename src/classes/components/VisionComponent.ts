/**
 * VisionComponent - Entity Detection and Vision System (MODEL)
 * Handles circle and cone vision, entity detection, and visibility tracking
 * Used by: Boss (cone vision for targeting), Ants (circle vision for gathering/combat)
 */

import { IComponent } from './IComponent';
import { GameObject } from '../GameObject';
import { EventBus } from '../../utils/eventBus';
import { GameEvents } from '../../utils/eventBus';
import { normalizeAngle } from '../../utils/helpers';

/**
 * VisionComponent
 * Manages entity vision with circle or cone detection
 */
export class VisionComponent implements IComponent {
    public owner!: GameObject;

    private visionRange: number;
    private visionAngle: number;         // Degrees (360 = full circle, < 360 = cone)
    private visionDirection: number = 0; // Radians (0 = right/east, PI/2 = up/north)
    private detectedEntities: Set<string> = new Set();

    /**
     * Create a new VisionComponent
     * @param visionRange - Maximum detection range (grid units)
     * @param visionAngle - Vision cone angle in degrees (360 = circle, less = cone)
     */
    constructor(visionRange: number, visionAngle: number) {
        this.visionRange = Math.max(0, visionRange);
        this.visionAngle = Math.max(0, visionAngle);
    }

    /**
     * Lifecycle: Attach to GameObject
     */
    onAttach(owner: GameObject): void {
        this.owner = owner;
    }

    /**
     * Lifecycle: Detach from GameObject
     */
    onDetach(): void {
        this.detectedEntities.clear();
        this.owner = undefined!;
    }

    /**
     * Lifecycle: Update (no-op for vision)
     */
    update(_deltaTime: number): void {
        // Vision checks happen on-demand, not per-frame
    }

    /**
     * Check if target is visible
     * @param target - Target GameObject
     * @returns True if target is within vision
     */
    public canSee(target: GameObject): boolean {
        if (!target || !this.owner) {
            return false;
        }

        // Calculate grid distance
        const dx = target.gridX - this.owner.gridX;
        const dy = target.gridY - this.owner.gridY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check range
        if (distance > this.visionRange) {
            return false;
        }

        // If 360 degrees (full circle), no angle check needed
        if (this.visionAngle >= 360) {
            return true;
        }

        // For cone vision, check if target is within cone angle
        return this.isInVisionCone(target.gridX, target.gridY);
    }

    /**
     * Check if position is within vision cone
     * @param targetX - Target grid X
     * @param targetY - Target grid Y
     * @returns True if within cone
     */
    public isInVisionCone(targetX: number, targetY: number): boolean {
        if (!this.owner) {
            return false;
        }

        // Calculate angle to target
        const dx = targetX - this.owner.gridX;
        const dy = targetY - this.owner.gridY;

        // If at same position, always visible
        if (dx === 0 && dy === 0) {
            return true;
        }

        // Calculate angle to target (atan2 uses +Y = down convention)
        // We need to adjust for our coordinate system where +Y = up
        const angleToTarget = Math.atan2(-dy, dx);

        // Calculate angle difference
        const normalizedVisionDir = normalizeAngle(this.visionDirection);
        const normalizedTargetAngle = normalizeAngle(angleToTarget);
        
        let angleDiff = Math.abs(normalizedTargetAngle - normalizedVisionDir);
        
        // Handle wrap-around (e.g., 350° vs 10°)
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }

        // Convert vision angle from degrees to radians and divide by 2 for half-cone
        const halfConeAngle = (this.visionAngle * Math.PI / 180) / 2;

        return angleDiff <= halfConeAngle;
    }

    /**
     * Get all visible entities from array
     * @param entities - Array of GameObjects to check
     * @returns Array of visible entities
     */
    public getVisibleEntities(entities: GameObject[]): GameObject[] {
        if (!this.owner) {
            return [];
        }

        const visible: GameObject[] = [];
        const currentlyVisible = new Set<string>();

        for (const entity of entities) {
            // Skip owner entity
            if (entity.id === this.owner.id) {
                continue;
            }

            if (this.canSee(entity)) {
                visible.push(entity);
                currentlyVisible.add(entity.id);

                // Emit ENTITY_DETECTED if newly visible
                if (!this.detectedEntities.has(entity.id)) {
                    EventBus.emit(GameEvents.ENTITY_DETECTED, this.owner.id, entity.id);
                }
            }
        }

        // Check for entities that left vision
        for (const entityId of this.detectedEntities) {
            if (!currentlyVisible.has(entityId)) {
                EventBus.emit(GameEvents.ENTITY_LOST, this.owner.id, entityId);
            }
        }

        // Update detected entities set
        this.detectedEntities = currentlyVisible;

        return visible;
    }

    /**
     * Get set of currently detected entity IDs
     * @returns Set of entity IDs
     */
    public getDetectedEntities(): ReadonlySet<string> {
        return this.detectedEntities;
    }

    /**
     * Get vision range
     * @returns Vision range in grid units
     */
    public getVisionRange(): number {
        return this.visionRange;
    }

    /**
     * Set vision range
     * @param range - New vision range (grid units)
     */
    public setVisionRange(range: number): void {
        this.visionRange = Math.max(0, range);
    }

    /**
     * Get vision angle
     * @returns Vision angle in degrees
     */
    public getVisionAngle(): number {
        return this.visionAngle;
    }

    /**
     * Set vision angle
     * @param angle - New vision angle in degrees
     */
    public setVisionAngle(angle: number): void {
        this.visionAngle = Math.max(0, angle);
    }

    /**
     * Get vision direction
     * @returns Direction in radians (0 = right, PI/2 = up)
     */
    public getVisionDirection(): number {
        return this.visionDirection;
    }

    /**
     * Set vision direction
     * @param direction - Direction in radians (0 = right, PI/2 = up)
     */
    public setVisionDirection(direction: number): void {
        this.visionDirection = direction;
    }
}
