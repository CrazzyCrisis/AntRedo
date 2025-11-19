/**
 * HazardAvoidanceComponent
 * Handles fleeing from hazardous tiles/terrain
 */

import { BaseComponent } from './BaseComponent';
import { HealthComponent } from './HealthComponent';
import { StateMachineComponent, EntityState } from './StateMachineComponent';
import { ENTITY_CONFIG } from '../../config/gameplay/entityConfig';
import { distance } from '../../utils/helpers';

export class HazardAvoidanceComponent extends BaseComponent {
    private fleeingHazard: boolean = false;
    private fleeStartTime: number = 0;
    private fleeSafePosition: { x: number, y: number } | null = null;
    private currentMoveX: number = 0;
    private currentMoveY: number = 0;
    private entityType: string; // 'ant', 'queen', etc. for config lookup

    constructor(entityType: string) {
        super();
        this.entityType = entityType;
    }

    /**
     * Check if currently fleeing from hazard
     */
    public isFleeing(): boolean {
        return this.fleeingHazard;
    }

    /**
     * Get current flee direction
     */
    public getFleeDirection(): { x: number, y: number } {
        return { x: this.currentMoveX, y: this.currentMoveY };
    }

    /**
     * Update hazard avoidance behavior
     */
    public update(_deltaTime: number): void {
        if (!this.owner) {
            return;
        }

        // Check for hazard avoidance (higher priority than random movement)
        this.checkHazardAvoidance();

        // If fleeing hazard, apply movement
        if (this.fleeingHazard) {
            this.updateFleeingState();
        }
    }

    /**
     * Check if entity should flee from recent hazard damage
     */
    private checkHazardAvoidance(): void {
        if (!this.owner) {
            return;
        }

        // Get hazard avoidance config for this entity type
        const config = (ENTITY_CONFIG.HAZARD_AVOIDANCE as any)[this.entityType];
        
        // Check if hazard avoidance is enabled
        if (!config || !config.ENABLED) {
            return;
        }

        // Don't start new flee if already fleeing
        if (this.fleeingHazard) {
            return;
        }

        // Get components
        const health = this.owner.getComponent('Health') as HealthComponent;
        const stateMachine = this.owner.getComponent('StateMachine') as StateMachineComponent;
        
        if (!health || !stateMachine) {
            return;
        }

        // Check if we took hazard damage recently
        const lastHazardDamage = health.lastHazardDamage;
        if (!lastHazardDamage) {
            return;
        }

        // Check if damage is recent
        const now = Date.now();
        const timeSinceDamage = now - lastHazardDamage.timestamp;
        if (timeSinceDamage > config.RECENT_DAMAGE_THRESHOLD_MS) {
            return;
        }

        // Check current state - don't flee if in combat
        const currentState = stateMachine.getCurrentState();
        if (currentState === EntityState.ATTACKING || currentState === EntityState.COMBAT) {
            return;
        }

        // Check health threshold
        const healthRatio = health.getCurrentHealth() / health.getMaxHealth();
        if (healthRatio < config.MIN_HEALTH_TO_FLEE) {
            return;
        }

        // Start fleeing
        this.startFleeingHazard(lastHazardDamage.tileX!, lastHazardDamage.tileY!, config);
    }

    /**
     * Start fleeing from hazard tile
     */
    private startFleeingHazard(hazardTileX: number, hazardTileY: number, config: any): void {
        if (!this.owner) {
            return;
        }

        // Calculate direction away from hazard
        const directionX = this.owner.gridX - hazardTileX;
        const directionY = this.owner.gridY - hazardTileY;
        
        // Normalize direction
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
        if (magnitude === 0) {
            // Already at hazard position? Just pick a random direction
            const angle = Math.random() * Math.PI * 2;
            const normX = Math.cos(angle);
            const normY = Math.sin(angle);
            
            // Calculate safe position
            this.fleeSafePosition = {
                x: Math.round(this.owner.gridX + normX * config.FLEE_DISTANCE),
                y: Math.round(this.owner.gridY + normY * config.FLEE_DISTANCE)
            };
        } else {
            const normX = directionX / magnitude;
            const normY = directionY / magnitude;
            
            // Calculate safe position FLEE_DISTANCE away
            this.fleeSafePosition = {
                x: Math.round(this.owner.gridX + normX * config.FLEE_DISTANCE),
                y: Math.round(this.owner.gridY + normY * config.FLEE_DISTANCE)
            };
        }

        // Set state
        this.fleeingHazard = true;
        this.fleeStartTime = Date.now();

        // Update state machine
        const stateMachine = this.owner.getComponent('StateMachine') as StateMachineComponent;
        if (stateMachine) {
            stateMachine.setState(EntityState.FLEEING_HAZARD);
        }

        // Store flee direction for direct movement (simplified - no pathfinding for now)
        // Calculate normalized direction vector
        const dirX = this.fleeSafePosition.x - this.owner.gridX;
        const dirY = this.fleeSafePosition.y - this.owner.gridY;
        const dist = Math.sqrt(dirX * dirX + dirY * dirY);
        
        if (dist > 0) {
            this.currentMoveX = Math.sign(dirX);
            this.currentMoveY = Math.sign(dirY);
        }
    }

    /**
     * Update fleeing state - check if reached safety or timed out
     */
    private updateFleeingState(): void {
        if (!this.owner || !this.fleeingHazard || !this.fleeSafePosition) {
            return;
        }

        const config = (ENTITY_CONFIG.HAZARD_AVOIDANCE as any)[this.entityType];
        const now = Date.now();
        
        // Check timeout
        if (now - this.fleeStartTime > config.FLEE_TIMEOUT_MS) {
            this.stopFleeingHazard();
            return;
        }

        // Check if reached safe position (within 1.5 tiles)
        const distToSafe = distance(
            this.owner.gridX, this.owner.gridY,
            this.fleeSafePosition.x, this.fleeSafePosition.y
        );
        
        if (distToSafe < 1.5) {
            this.stopFleeingHazard();
            return;
        }

        // Continue moving in flee direction
        this.owner.requestMove(this.currentMoveX, this.currentMoveY);
    }

    /**
     * Stop fleeing and return to normal behavior
     */
    private stopFleeingHazard(): void {
        if (!this.owner) {
            return;
        }

        this.fleeingHazard = false;
        this.fleeSafePosition = null;

        // Return to idle state
        const stateMachine = this.owner.getComponent('StateMachine') as StateMachineComponent;
        if (stateMachine) {
            stateMachine.setState(EntityState.IDLE);
        }

        // Clear last hazard damage so we don't immediately flee again
        const health = this.owner.getComponent('Health') as HealthComponent;
        if (health) {
            health.lastHazardDamage = null;
        }
    }
}
