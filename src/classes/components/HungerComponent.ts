/**
 * HungerComponent
 * Manages hunger, starvation, and food consumption for entities (primarily ants)
 */

import { BaseComponent } from './BaseComponent';
import { EventBus } from '../../utils/eventBus';
import { GameEvents } from '../../utils/eventBus';

export class HungerComponent extends BaseComponent {
    private maxHunger: number;
    private currentHunger: number;
    private hungerThreshold: number = 30; // Below this = hungry
    private decayRate: number = 0.5; // Hunger lost per second
    private starvationDamage: number = 1; // Damage per starvation interval
    private starvationInterval: number = 1000; // Milliseconds between damage ticks
    private timeSinceStarvationDamage: number = 0;
    private wasHungry: boolean = false;
    private wasStarving: boolean = false;

    /**
     * Create hunger component with max hunger value
     */
    constructor(maxHunger: number) {
        super();
        if (maxHunger <= 0) {
            throw new Error('Max hunger must be positive');
        }

        this.maxHunger = maxHunger;
        this.currentHunger = maxHunger; // Start full
    }

    /**
     * Hook: Reset hunger state before detach
     */
    protected onDetaching(): void {
        this.currentHunger = this.maxHunger;
        this.timeSinceStarvationDamage = 0;
        this.wasHungry = false;
        this.wasStarving = false;
    }

    /**
     * Update hunger decay and starvation damage
     */
    public update(deltaTime: number): void {
        // Decay hunger over time
        if (this.decayRate > 0) {
            const decay = (this.decayRate * deltaTime) / 1000; // Convert ms to seconds
            this.currentHunger = Math.max(0, this.currentHunger - decay);
        }

        // Check hunger state transitions
        this.checkHungerStates();

        // Apply starvation damage if starving
        if (this.isStarving() && this.starvationDamage > 0) {
            this.timeSinceStarvationDamage += deltaTime;

            if (this.timeSinceStarvationDamage >= this.starvationInterval) {
                this.timeSinceStarvationDamage -= this.starvationInterval;

                if (this.owner) {
                    EventBus.emit(GameEvents.STARVATION_DAMAGE, this.owner.id, this.starvationDamage);
                }
            }
        } else {
            this.timeSinceStarvationDamage = 0;
        }
    }

    /**
     * Check and emit hunger state change events
     */
    private checkHungerStates(): void {
        const isHungry = this.isHungry();
        const isStarving = this.isStarving();

        // Emit hungry event (only on transition)
        if (isHungry && !this.wasHungry && this.owner) {
            EventBus.emit(GameEvents.ENTITY_HUNGRY, this.owner.id);
        }

        // Emit starving event (only on transition)
        if (isStarving && !this.wasStarving && this.owner) {
            EventBus.emit(GameEvents.ENTITY_STARVING, this.owner.id);
        }

        this.wasHungry = isHungry;
        this.wasStarving = isStarving;
    }

    /**
     * Get current hunger value
     */
    public getHunger(): number {
        return this.currentHunger;
    }

    /**
     * Set current hunger (clamped to [0, maxHunger])
     */
    public setHunger(value: number): void {
        this.currentHunger = Math.max(0, Math.min(this.maxHunger, value));
        this.checkHungerStates();
    }

    /**
     * Get max hunger value
     */
    public getMaxHunger(): number {
        return this.maxHunger;
    }

    /**
     * Get hunger as percentage (0-100)
     */
    public getHungerPercentage(): number {
        return (this.currentHunger / this.maxHunger) * 100;
    }

    /**
     * Check if entity is hungry
     */
    public isHungry(): boolean {
        return this.currentHunger < this.hungerThreshold;
    }

    /**
     * Check if entity is starving (zero hunger)
     */
    public isStarving(): boolean {
        return this.currentHunger === 0;
    }

    /**
     * Eat food to restore hunger
     */
    public eat(amount: number): void {
        if (amount < 0) {
            throw new Error('Food amount must be non-negative');
        }

        this.currentHunger = Math.min(this.maxHunger, this.currentHunger + amount);

        if (this.owner && amount > 0) {
            EventBus.emit(GameEvents.ENTITY_ATE, this.owner.id, amount, this.currentHunger);
        }

        this.checkHungerStates();
    }

    /**
     * Fully restore hunger to max
     */
    public fullyRestore(): void {
        const amountRestored = this.maxHunger - this.currentHunger;
        this.eat(amountRestored);
    }

    /**
     * Set hunger decay rate (hunger lost per second)
     */
    public setDecayRate(rate: number): void {
        if (rate < 0) {
            throw new Error('Decay rate must be non-negative');
        }
        this.decayRate = rate;
    }

    /**
     * Set hunger threshold (below this = hungry)
     */
    public setHungerThreshold(threshold: number): void {
        if (threshold < 0) {
            throw new Error('Hunger threshold must be non-negative');
        }
        this.hungerThreshold = threshold;
    }

    /**
     * Set starvation damage per interval
     */
    public setStarvationDamage(damage: number): void {
        if (damage < 0) {
            throw new Error('Starvation damage must be non-negative');
        }
        this.starvationDamage = damage;
    }

    /**
     * Get starvation damage value
     */
    public getStarvationDamage(): number {
        return this.starvationDamage;
    }

    /**
     * Set starvation damage interval (milliseconds)
     */
    public setStarvationInterval(interval: number): void {
        if (interval <= 0) {
            throw new Error('Starvation interval must be positive');
        }
        this.starvationInterval = interval;
    }
}
