"use strict";
/**
 * HealthComponent - Health and Death Management (MODEL)
 * Handles damage, healing, death, and health regeneration
 * Used by: Ants, Queen, Boss, Buildings
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthComponent = void 0;
var BaseComponent_1 = require("./BaseComponent");
var eventBus_1 = require("../../utils/eventBus");
/**
 * HealthComponent
 * Manages entity health, damage, healing, and death
 */
var HealthComponent = /** @class */ (function (_super) {
    __extends(HealthComponent, _super);
    /**
     * Create a new HealthComponent
     * @param maxHealth - Maximum health
     * @param regenRate - Health regeneration per second (0 = no regen)
     */
    function HealthComponent(maxHealth, regenRate) {
        if (regenRate === void 0) { regenRate = 0; }
        var _this = _super.call(this) || this;
        _this.alive = true;
        _this.timeSinceLastDamage = Infinity; // Track game time for regen delay (start at Infinity = always regenerating initially)
        _this.REGEN_DELAY = 3000; // 3 seconds before regen starts after damage
        _this.maxHealth = maxHealth;
        _this.currentHealth = maxHealth;
        _this.regenRate = regenRate;
        return _this;
    }
    /**
     * Lifecycle: Update health regeneration
     */
    HealthComponent.prototype.update = function (deltaTime) {
        if (!this.alive || this.currentHealth >= this.maxHealth) {
            return;
        }
        // Track time since last damage
        var previousTime = this.timeSinceLastDamage;
        this.timeSinceLastDamage += deltaTime;
        // Check if we've passed the regen delay threshold
        if (this.timeSinceLastDamage < this.REGEN_DELAY) {
            return; // Still in delay period
        }
        // Calculate how much time to apply regen for
        // Only count time AFTER the delay threshold
        var regenTime = deltaTime;
        if (previousTime < this.REGEN_DELAY) {
            // We crossed the threshold during this update
            // Only regenerate for time AFTER crossing the threshold
            regenTime = this.timeSinceLastDamage - this.REGEN_DELAY;
        }
        // Regenerate health
        if (this.regenRate > 0 && regenTime > 0) {
            var regenAmount = (regenTime / 1000) * this.regenRate;
            this.heal(regenAmount);
        }
    };
    /**
     * Take damage
     * @param amount - Damage amount
     * @param attackerId - ID of attacking entity (for kill tracking)
     */
    HealthComponent.prototype.takeDamage = function (amount, attackerId) {
        if (!this.alive || amount <= 0) {
            return;
        }
        // Apply damage
        var actualDamage = Math.min(amount, this.currentHealth);
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.timeSinceLastDamage = 0; // Reset regen delay timer
        // Emit damage event
        if (this.owner) {
            eventBus_1.EventBus.emit('ENTITY_DAMAGED', this.owner.id, actualDamage, this.currentHealth);
        }
        // Check for death
        if (this.currentHealth <= 0) {
            this.die(attackerId);
        }
    };
    /**
     * Heal health
     * @param amount - Healing amount
     */
    HealthComponent.prototype.heal = function (amount) {
        if (!this.alive || amount <= 0 || this.currentHealth >= this.maxHealth) {
            return;
        }
        var actualHeal = Math.min(amount, this.maxHealth - this.currentHealth);
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        // Emit heal event
        if (this.owner && actualHeal > 0) {
            eventBus_1.EventBus.emit('ENTITY_HEALED', this.owner.id, actualHeal, this.currentHealth);
        }
    };
    /**
     * Handle death
     * @param killerId - ID of entity that killed this one
     */
    HealthComponent.prototype.die = function (killerId) {
        if (!this.alive) {
            return;
        }
        this.alive = false;
        this.currentHealth = 0;
        // Emit death event
        if (this.owner) {
            eventBus_1.EventBus.emit('ENTITY_DIED', this.owner.id, killerId);
            // Destroy the owner GameObject
            this.owner.destroy();
        }
    };
    /**
     * Check if entity is alive
     */
    HealthComponent.prototype.isAlive = function () {
        return this.alive;
    };
    /**
     * Check if entity is dead
     */
    HealthComponent.prototype.isDead = function () {
        return !this.alive;
    };
    /**
     * Get current health
     */
    HealthComponent.prototype.getCurrentHealth = function () {
        return this.currentHealth;
    };
    /**
     * Get maximum health
     */
    HealthComponent.prototype.getMaxHealth = function () {
        return this.maxHealth;
    };
    /**
     * Get health as percentage (0.0 to 1.0)
     */
    HealthComponent.prototype.getHealthPercent = function () {
        if (this.maxHealth === 0) {
            return 0;
        }
        return this.currentHealth / this.maxHealth;
    };
    /**
     * Get regeneration rate
     */
    HealthComponent.prototype.getRegenRate = function () {
        return this.regenRate;
    };
    /**
     * Get time since last damage (in milliseconds)
     */
    HealthComponent.prototype.getTimeSinceLastDamage = function () {
        return this.timeSinceLastDamage;
    };
    /**
     * Check if health is below threshold
     * @param threshold - Health percentage threshold (0.0 to 1.0)
     */
    HealthComponent.prototype.isLowHealth = function (threshold) {
        return this.getHealthPercent() < threshold;
    };
    /**
     * Set max health (useful for upgrades/buffs)
     * @param newMax - New maximum health
     * @param healToMax - If true, heal to new max
     */
    HealthComponent.prototype.setMaxHealth = function (newMax, healToMax) {
        if (healToMax === void 0) { healToMax = false; }
        this.maxHealth = newMax;
        if (healToMax) {
            this.currentHealth = newMax;
        }
        else {
            // Clamp current health to new max
            this.currentHealth = Math.min(this.currentHealth, newMax);
        }
    };
    /**
     * Set regeneration rate (useful for upgrades/buffs)
     * @param newRate - New regen rate (health per second)
     */
    HealthComponent.prototype.setRegenRate = function (newRate) {
        this.regenRate = newRate;
    };
    return HealthComponent;
}(BaseComponent_1.BaseComponent));
exports.HealthComponent = HealthComponent;
