"use strict";
/**
 * CombatComponent - Attack and Combat Management (MODEL)
 * Handles attack execution, cooldowns, range validation, and target tracking
 * Used by: Ants (Warrior priority), Queen (all powers), Boss (melee + projectiles)
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
exports.CombatComponent = void 0;
var BaseComponent_1 = require("./BaseComponent");
var eventBus_1 = require("../../utils/eventBus");
var eventBus_2 = require("../../utils/eventBus");
/**
 * CombatComponent
 * Manages entity combat, attacks, cooldowns, and targeting
 */
var CombatComponent = /** @class */ (function (_super) {
    __extends(CombatComponent, _super);
    /**
     * Create a new CombatComponent
     * @param attackDamage - Damage dealt per attack
     * @param attackRange - Maximum range for attacks (in grid units)
     * @param attackCooldown - Cooldown between attacks (milliseconds)
     */
    function CombatComponent(attackDamage, attackRange, attackCooldown) {
        var _this = _super.call(this) || this;
        _this.targetId = null;
        _this.attacking = false;
        _this.remainingCooldown = 0; // Track cooldown time remaining
        _this.attackDamage = Math.max(0, attackDamage); // Clamp to zero
        _this.attackRange = Math.max(0, attackRange);
        _this.attackCooldown = Math.max(0, attackCooldown);
        return _this;
    }
    /**
     * Hook: Cleanup combat state before detach
     */
    CombatComponent.prototype.onDetaching = function () {
        this.clearTarget();
        this.attacking = false;
        this.remainingCooldown = 0;
    };
    /**
     * Lifecycle: Update cooldown timer
     */
    CombatComponent.prototype.update = function (deltaTime) {
        if (this.remainingCooldown > 0) {
            this.remainingCooldown -= deltaTime;
            // Clamp to zero
            if (this.remainingCooldown < 0) {
                this.remainingCooldown = 0;
            }
        }
        // Clear attacking state when cooldown finishes
        if (this.remainingCooldown === 0 && this.attacking) {
            this.attacking = false;
        }
    };
    /**
     * Execute attack on target
     * @param target - Target GameObject
     * @returns True if attack executed, false if failed
     */
    CombatComponent.prototype.attack = function (target) {
        if (!target || !this.owner) {
            return false;
        }
        // Check cooldown
        if (!this.canAttack()) {
            return false;
        }
        // Check range
        if (!this.isInRange(target)) {
            return false;
        }
        // Execute attack
        this.attacking = true;
        this.targetId = target.id;
        this.remainingCooldown = this.attackCooldown;
        // Emit attack event
        eventBus_1.EventBus.emit(eventBus_2.GameEvents.ENTITY_ATTACKED, this.owner.id, target.id, this.attackDamage);
        return true;
    };
    /**
     * Check if entity can attack (cooldown ready)
     */
    CombatComponent.prototype.canAttack = function () {
        return this.remainingCooldown === 0;
    };
    /**
     * Check if target is within attack range
     * @param target - Target GameObject
     */
    CombatComponent.prototype.isInRange = function (target) {
        if (!target || !this.owner) {
            return false;
        }
        // Calculate grid distance (Euclidean)
        var dx = target.gridX - this.owner.gridX;
        var dy = target.gridY - this.owner.gridY;
        var gridDistance = Math.sqrt(dx * dx + dy * dy);
        return gridDistance <= this.attackRange;
    };
    /**
     * Set current target
     * @param targetId - ID of target entity
     */
    CombatComponent.prototype.setTarget = function (targetId) {
        this.targetId = targetId;
    };
    /**
     * Clear current target
     */
    CombatComponent.prototype.clearTarget = function () {
        this.targetId = null;
    };
    /**
     * Get current target ID
     */
    CombatComponent.prototype.getTarget = function () {
        return this.targetId;
    };
    /**
     * Check if currently attacking
     */
    CombatComponent.prototype.isAttacking = function () {
        return this.attacking;
    };
    /**
     * Get remaining cooldown time
     */
    CombatComponent.prototype.getRemainingCooldown = function () {
        return Math.max(0, this.remainingCooldown);
    };
    /**
     * Get attack damage
     */
    CombatComponent.prototype.getAttackDamage = function () {
        return this.attackDamage;
    };
    /**
     * Set attack damage (for buffs/debuffs)
     * @param damage - New damage value
     */
    CombatComponent.prototype.setAttackDamage = function (damage) {
        this.attackDamage = Math.max(0, damage);
    };
    /**
     * Get attack range
     */
    CombatComponent.prototype.getAttackRange = function () {
        return this.attackRange;
    };
    /**
     * Set attack range (for buffs/debuffs)
     * @param range - New range value
     */
    CombatComponent.prototype.setAttackRange = function (range) {
        this.attackRange = Math.max(0, range);
    };
    /**
     * Get attack cooldown
     */
    CombatComponent.prototype.getAttackCooldown = function () {
        return this.attackCooldown;
    };
    /**
     * Set attack cooldown (for buffs/debuffs)
     * @param cooldown - New cooldown value (milliseconds)
     */
    CombatComponent.prototype.setAttackCooldown = function (cooldown) {
        this.attackCooldown = Math.max(0, cooldown);
    };
    return CombatComponent;
}(BaseComponent_1.BaseComponent));
exports.CombatComponent = CombatComponent;
