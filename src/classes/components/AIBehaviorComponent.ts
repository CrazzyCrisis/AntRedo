/**
 * AIBehaviorComponent
 * Manages autonomous behavior, decision-making, and blackboard memory for AI entities
 */

import { IComponent } from './IComponent';
import { GameObject } from '../GameObject';
import { EventBus } from '../../utils/eventBus';
import { GameEvents } from '../../utils/eventBus';

export class AIBehaviorComponent implements IComponent {
    public owner!: GameObject;
    private autonomous: boolean = true;
    private currentBehavior: string | null = null;
    private currentTarget: string | null = null;
    private blackboard: Map<string, any> = new Map();
    private elapsedTime: number = 0;

    /**
     * Attach component to owner GameObject
     */
    public onAttach(owner: GameObject): void {
        this.owner = owner;
    }

    /**
     * Detach component and cleanup state
     */
    public onDetach(): void {
        this.clearBehavior();
        this.clearTarget();
        this.clearBlackboard();
        this.elapsedTime = 0;
    }

    /**
     * Update AI behavior (only if autonomous)
     */
    public update(deltaTime: number): void {
        if (!this.autonomous) {
            return;
        }

        this.elapsedTime += deltaTime;

        // In a full implementation, this would:
        // 1. Evaluate current conditions (blackboard, sensors, etc.)
        // 2. Select appropriate behavior based on priorities
        // 3. Execute behavior logic
        // 4. Update blackboard with results

        // For now, this is a framework for behavior execution
        // Specific behaviors would be implemented by game logic
    }

    /**
     * Set autonomous mode (enable/disable AI)
     */
    public setAutonomous(autonomous: boolean): void {
        if (this.autonomous === autonomous) {
            return;
        }

        this.autonomous = autonomous;

        if (this.owner) {
            EventBus.emit(GameEvents.AI_STATE_CHANGED, this.owner.id, autonomous);
        }
    }

    /**
     * Check if AI is autonomous
     */
    public isAutonomous(): boolean {
        return this.autonomous;
    }

    /**
     * Set current behavior
     */
    public setBehavior(behavior: string | null): void {
        if (this.currentBehavior === behavior) {
            return;
        }

        const oldBehavior = this.currentBehavior;
        this.currentBehavior = behavior;

        if (this.owner && oldBehavior !== null) {
            EventBus.emit(GameEvents.AI_BEHAVIOR_CHANGED, this.owner.id, oldBehavior, behavior);
        }
    }

    /**
     * Get current behavior
     */
    public getCurrentBehavior(): string | null {
        return this.currentBehavior;
    }

    /**
     * Clear current behavior
     */
    public clearBehavior(): void {
        this.currentBehavior = null;
    }

    /**
     * Complete current behavior (emits event and clears)
     */
    public completeBehavior(): void {
        if (this.currentBehavior && this.owner) {
            EventBus.emit(GameEvents.AI_BEHAVIOR_COMPLETE, this.owner.id, this.currentBehavior);
        }

        this.currentBehavior = null;
    }

    /**
     * Set AI target entity
     */
    public setTarget(targetId: string | null): void {
        if (this.currentTarget === targetId) {
            return;
        }

        this.currentTarget = targetId;

        if (this.owner && targetId !== null) {
            EventBus.emit(GameEvents.AI_TARGET_ACQUIRED, this.owner.id, targetId);
        }
    }

    /**
     * Get current target
     */
    public getTarget(): string | null {
        return this.currentTarget;
    }

    /**
     * Clear current target
     */
    public clearTarget(): void {
        if (this.currentTarget && this.owner) {
            EventBus.emit(GameEvents.AI_TARGET_LOST, this.owner.id);
        }

        this.currentTarget = null;
    }

    /**
     * Set blackboard value (AI memory/state storage)
     */
    public setBlackboardValue(key: string, value: any): void {
        this.blackboard.set(key, value);
    }

    /**
     * Get blackboard value
     */
    public getBlackboardValue(key: string): any {
        return this.blackboard.get(key);
    }

    /**
     * Check if blackboard has key
     */
    public hasBlackboardValue(key: string): boolean {
        return this.blackboard.has(key);
    }

    /**
     * Clear single blackboard value
     */
    public clearBlackboardValue(key: string): void {
        this.blackboard.delete(key);
    }

    /**
     * Clear all blackboard values
     */
    public clearBlackboard(): void {
        this.blackboard.clear();
    }
}
