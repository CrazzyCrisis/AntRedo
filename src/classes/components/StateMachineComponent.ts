/**
 * StateMachineComponent - Entity State Management (MODEL)
 * Manages state transitions for game entities
 * Used by: Ants (all jobs), Boss, Buildings (construction states)
 */

import { IComponent } from './IComponent';
import { GameObject } from '../GameObject';
import { EventBus } from '../../utils/eventBus';

/**
 * Available entity states
 */
export enum EntityState {
    IDLE = 'IDLE',
    GATHERING = 'GATHERING',
    COMBAT = 'COMBAT',
    FOLLOWING = 'FOLLOWING',
    BUILDING = 'BUILDING',
    PATROLLING = 'PATROLLING',
    ATTACKING = 'ATTACKING',
    SCOUTING = 'SCOUTING',
    HEALING = 'HEALING',
    RETURNING = 'RETURNING'  // Returning to base/warehouse
}

/**
 * State Machine Component
 * Tracks current state, previous state, and state history for debugging
 */
export class StateMachineComponent implements IComponent {
    public owner!: GameObject;

    private currentState: EntityState;
    private previousState?: EntityState;
    private stateHistory: EntityState[] = [];
    private stateDuration: number = 0;  // Time spent in current state (milliseconds)
    
    private readonly MAX_HISTORY_SIZE = 10;  // Limit history to prevent memory bloat

    /**
     * Create a new StateMachineComponent
     * @param initialState - Starting state
     */
    constructor(initialState: EntityState) {
        this.currentState = initialState;
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
        this.owner = undefined!;
    }

    /**
     * Lifecycle: Update state duration
     */
    update(deltaTime: number): void {
        this.stateDuration += deltaTime;
    }

    /**
     * Set new state
     * @param newState - State to transition to
     */
    public setState(newState: EntityState): void {
        this.transitionTo(newState);
    }

    /**
     * Transition to new state with optional reason
     * @param newState - State to transition to
     * @param reason - Optional reason for transition (for debugging)
     */
    public transitionTo(newState: EntityState, reason?: string): void {
        // Skip if already in this state
        if (this.currentState === newState) {
            return;
        }

        const oldState = this.currentState;

        // Update states
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateDuration = 0;

        // Record in history
        this.stateHistory.push(newState);
        
        // Limit history size
        if (this.stateHistory.length > this.MAX_HISTORY_SIZE) {
            this.stateHistory.shift();
        }

        // Emit state change event
        if (this.owner) {
            EventBus.emit('STATE_CHANGED', this.owner.id, oldState, newState, reason);
        }
    }

    /**
     * Get current state
     */
    public getCurrentState(): EntityState {
        return this.currentState;
    }

    /**
     * Get previous state
     */
    public getPreviousState(): EntityState | undefined {
        return this.previousState;
    }

    /**
     * Get state history (for debugging)
     */
    public getStateHistory(): EntityState[] {
        return [...this.stateHistory];  // Return copy to prevent external modification
    }

    /**
     * Check if currently in specific state
     * @param state - State to check
     */
    public isInState(state: EntityState): boolean {
        return this.currentState === state;
    }

    /**
     * Check if currently in any of the given states
     * @param states - Array of states to check
     */
    public isInAnyState(states: EntityState[]): boolean {
        return states.includes(this.currentState);
    }

    /**
     * Get duration in current state (milliseconds)
     */
    public getStateDuration(): number {
        return this.stateDuration;
    }

    /**
     * Clear state history (for debugging/testing)
     */
    public clearHistory(): void {
        this.stateHistory = [];
    }
}
