/**
 * HealthComponent - Health and Death Management (MODEL)
 * Handles damage, healing, death, and health regeneration
 * Used by: Ants, Queen, Boss, Buildings
 */

import { BaseComponent } from './BaseComponent';
import { EventBus } from '../../utils/eventBus';

/**
 * HealthComponent
 * Manages entity health, damage, healing, and death
 */
export class HealthComponent extends BaseComponent {

    private currentHealth: number;
    private maxHealth: number;
    private regenRate: number;          // Health per second regeneration
    private alive: boolean = true;
    private timeSinceLastDamage: number = Infinity; // Track game time for regen delay (start at Infinity = always regenerating initially)
    
    private readonly REGEN_DELAY = 3000; // 3 seconds before regen starts after damage

    /**
     * Create a new HealthComponent
     * @param maxHealth - Maximum health
     * @param regenRate - Health regeneration per second (0 = no regen)
     */
    constructor(maxHealth: number, regenRate: number = 0) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.regenRate = regenRate;
    }

    /**
     * Lifecycle: Update health regeneration
     */
    update(deltaTime: number): void {
        if (!this.alive || this.currentHealth >= this.maxHealth) {
            return;
        }

        // Track time since last damage
        const previousTime = this.timeSinceLastDamage;
        this.timeSinceLastDamage += deltaTime;

        // Check if we've passed the regen delay threshold
        if (this.timeSinceLastDamage < this.REGEN_DELAY) {
            return; // Still in delay period
        }

        // Calculate how much time to apply regen for
        // Only count time AFTER the delay threshold
        let regenTime = deltaTime;
        if (previousTime < this.REGEN_DELAY) {
            // We crossed the threshold during this update
            // Only regenerate for time AFTER crossing the threshold
            regenTime = this.timeSinceLastDamage - this.REGEN_DELAY;
        }

        // Regenerate health
        if (this.regenRate > 0 && regenTime > 0) {
            const regenAmount = (regenTime / 1000) * this.regenRate;
            this.heal(regenAmount);
        }
    }

    /**
     * Take damage
     * @param amount - Damage amount
     * @param attackerId - ID of attacking entity (for kill tracking)
     */
    public takeDamage(amount: number, attackerId: string): void {
        if (!this.alive || amount <= 0) {
            return;
        }

        // Apply damage
        const actualDamage = Math.min(amount, this.currentHealth);
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.timeSinceLastDamage = 0; // Reset regen delay timer

        // Emit damage event
        if (this.owner) {
            EventBus.emit('ENTITY_DAMAGED', this.owner.id, actualDamage, this.currentHealth);
        }

        // Check for death
        if (this.currentHealth <= 0) {
            this.die(attackerId);
        }
    }

    /**
     * Heal health
     * @param amount - Healing amount
     */
    public heal(amount: number): void {
        if (!this.alive || amount <= 0 || this.currentHealth >= this.maxHealth) {
            return;
        }

        const actualHeal = Math.min(amount, this.maxHealth - this.currentHealth);
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);

        // Emit heal event
        if (this.owner && actualHeal > 0) {
            EventBus.emit('ENTITY_HEALED', this.owner.id, actualHeal, this.currentHealth);
        }
    }

    /**
     * Handle death
     * @param killerId - ID of entity that killed this one
     */
    private die(killerId: string): void {
        if (!this.alive) {
            return;
        }

        this.alive = false;
        this.currentHealth = 0;

        // Emit death event
        if (this.owner) {
            EventBus.emit('ENTITY_DIED', this.owner.id, killerId);
            
            // Destroy the owner GameObject
            this.owner.destroy();
        }
    }

    /**
     * Check if entity is alive
     */
    public isAlive(): boolean {
        return this.alive;
    }

    /**
     * Check if entity is dead
     */
    public isDead(): boolean {
        return !this.alive;
    }

    /**
     * Get current health
     */
    public getCurrentHealth(): number {
        return this.currentHealth;
    }

    /**
     * Get maximum health
     */
    public getMaxHealth(): number {
        return this.maxHealth;
    }

    /**
     * Get health as percentage (0.0 to 1.0)
     */
    public getHealthPercent(): number {
        if (this.maxHealth === 0) {
            return 0;
        }
        return this.currentHealth / this.maxHealth;
    }

    /**
     * Get regeneration rate
     */
    public getRegenRate(): number {
        return this.regenRate;
    }

    /**
     * Get time since last damage (in milliseconds)
     */
    public getTimeSinceLastDamage(): number {
        return this.timeSinceLastDamage;
    }

    /**
     * Check if health is below threshold
     * @param threshold - Health percentage threshold (0.0 to 1.0)
     */
    public isLowHealth(threshold: number): boolean {
        return this.getHealthPercent() < threshold;
    }

    /**
     * Set max health (useful for upgrades/buffs)
     * @param newMax - New maximum health
     * @param healToMax - If true, heal to new max
     */
    public setMaxHealth(newMax: number, healToMax: boolean = false): void {
        this.maxHealth = newMax;
        
        if (healToMax) {
            this.currentHealth = newMax;
        } else {
            // Clamp current health to new max
            this.currentHealth = Math.min(this.currentHealth, newMax);
        }
    }

    /**
     * Set regeneration rate (useful for upgrades/buffs)
     * @param newRate - New regen rate (health per second)
     */
    public setRegenRate(newRate: number): void {
        this.regenRate = newRate;
    }
}
