/**
 * HealthComponent - Health and Death Management (MODEL)
 * Handles damage, healing, death, and health regeneration
 * Used by: Ants, Queen, Boss, Buildings
 */

import { BaseComponent } from './BaseComponent';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { gridToWorldCenter } from '../../utils/helpers';
import { TILE_SIZE } from '../../world/TileSystem';
import { ENTITY_CONFIG } from '../../config/gameplay/entityConfig';

/**
 * Damage source for tracking hazards
 */
export interface DamageSource {
    type: 'hazard' | 'combat';
    tileX?: number;  // Grid X position of hazard
    tileY?: number;  // Grid Y position of hazard
    timestamp: number;  // When damage occurred
}

/**
 * HealthComponent
 * Manages entity health, damage, healing, and death
 * Now includes colony food-based healing system and hazard damage tracking
 */
export class HealthComponent extends BaseComponent {

    private currentHealth: number;
    private maxHealth: number;
    private regenRate: number;          // Health per second regeneration
    private alive: boolean = true;
    private timeSinceLastDamage: number = Infinity; // Track game time for regen delay (start at Infinity = always regenerating initially)
    private timeSinceLastHeal: number = 0; // Track time since last colony healing tick
    private entityType: 'ant' | 'queen' | 'boss'; // Entity type for healing config
    private factionId: string;          // Faction ID for resource access
    
    // Hazard damage tracking
    public lastHazardDamage: DamageSource | null = null;
    
    private readonly REGEN_DELAY = 3000; // 3 seconds before regen starts after damage
    private readonly HEALING_DELAY = 5000; // 5 seconds after last damage before colony healing starts
    private readonly HEALING_INTERVAL = 2000; // 2 seconds between healing ticks

    /**
     * Create a new HealthComponent
     * @param maxHealth - Maximum health
     * @param regenRate - Health regeneration per second (0 = no regen)
     * @param entityType - Type of entity (for healing config)
     * @param factionId - Faction ID (for resource access)
     */
    constructor(maxHealth: number, regenRate: number = 0, entityType: 'ant' | 'queen' | 'boss' = 'ant', factionId: string = 'player') {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.regenRate = regenRate;
        this.entityType = entityType;
        this.factionId = factionId;
    }

    /**
     * Lifecycle: Update health regeneration and colony food-based healing
     */
    update(deltaTime: number): void {
        if (!this.alive) {
            return;
        }

        // Try colony food-based healing FIRST (even if at full health, to check conditions)
        this.tryColonyHealing(deltaTime);

        // Skip natural regeneration if at full health
        if (this.currentHealth >= this.maxHealth) {
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

        // Standard regeneration (natural regen rate)
        if (this.regenRate > 0 && regenTime > 0) {
            const regenAmount = (regenTime / 1000) * this.regenRate;
            this.heal(regenAmount);
        }
    }

    /**
     * Try to heal using colony food resources
     * @param deltaTime - Time since last update (milliseconds)
     */
    private tryColonyHealing(deltaTime: number): void {
        // Dead entities cannot heal
        if (!this.alive) {
            return;
        }

        // Must wait HEALING_DELAY after last damage before healing starts
        if (this.timeSinceLastDamage < this.HEALING_DELAY) {
            return;
        }

        // Update time since last heal
        this.timeSinceLastHeal += deltaTime;

        // Only heal every HEALING_INTERVAL (2 seconds)
        if (this.timeSinceLastHeal < this.HEALING_INTERVAL) {
            return;
        }

        // Reset heal timer
        this.timeSinceLastHeal = 0;

        // Get healing config for this entity type
        const healConfig = this.getHealingConfig();
        if (!healConfig) {
            return; // No healing config for this entity type
        }

        // Heal to max health (not just to threshold)
        if (this.currentHealth >= this.maxHealth) {
            return; // Already at full health
        }

        // Calculate food to consume for one healing tick
        const foodToConsume = healConfig.FOOD_COST_PER_SECOND * (this.HEALING_INTERVAL / 1000);
        
        // Try to consume food from colony (dynamic require to avoid circular dependency)
        const { ResourceManager } = require('../../managers/ResourceManager');
        const resourceManager = ResourceManager.getInstance();
        
        if (resourceManager.consumeFoodForHealing(this.factionId, foodToConsume)) {
            // Successfully consumed food - apply healing
            const healAmount = healConfig.RATE_PER_FOOD * foodToConsume;
            this.heal(healAmount);
        }
        // If no food available, simply don't heal (entity won't die from lack of food healing)
    }

    /**
     * Get healing config for this entity type
     * @returns Healing config or null if not applicable
     */
    private getHealingConfig() {
        switch (this.entityType) {
            case 'ant':
                return ENTITY_CONFIG.ANT.HEALING;
            case 'queen':
                return ENTITY_CONFIG.QUEEN.HEALING;
            case 'boss':
                return ENTITY_CONFIG.BOSS.HEALING;
            default:
                return null;
        }
    }

    /**
     * Take damage
     * @param amount - Damage amount
     * @param attackerId - ID of attacking entity (for kill tracking)
     * @param isCritical - Whether this is a critical hit (for visual effects)
     * @param damageSource - Optional source of damage (for hazard tracking)
     */
    public takeDamage(amount: number, attackerId: string, isCritical: boolean = false, damageSource?: DamageSource): void {
        if (!this.alive || amount <= 0) {
            return;
        }

        // Apply damage
        const actualDamage = Math.min(amount, this.currentHealth);
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.timeSinceLastDamage = 0; // Reset regen delay timer

        // Track hazard damage for avoidance behavior
        if (damageSource) {
            this.lastHazardDamage = damageSource;
        }

        // Emit damage event with world position for visual effects
        if (this.owner) {
            const worldPos = gridToWorldCenter(this.owner.gridX, this.owner.gridY, TILE_SIZE);
            EventBus.emit(GameEvents.ENTITY_DAMAGE, this.owner.id, actualDamage, worldPos.x, worldPos.y, isCritical);
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

        // Emit heal event with world position for visual effects
        if (this.owner && actualHeal > 0) {
            const worldPos = gridToWorldCenter(this.owner.gridX, this.owner.gridY, TILE_SIZE);
            EventBus.emit(GameEvents.ENTITY_HEALED, this.owner.id, actualHeal, worldPos.x, worldPos.y);
        }
    }

    /**
     * Handle death
     * @param killerId - ID of entity that killed this one
     */
    private die(_killerId: string): void {
        if (!this.alive) {
            return;
        }

        this.alive = false;
        this.currentHealth = 0;

        // Emit death event with world position for visual effects
        if (this.owner) {
            const worldPos = gridToWorldCenter(this.owner.gridX, this.owner.gridY, TILE_SIZE);
            EventBus.emit(GameEvents.ENTITY_DIED, this.owner.id, worldPos.x, worldPos.y);
            
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
