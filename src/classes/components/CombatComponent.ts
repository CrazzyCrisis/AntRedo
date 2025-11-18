/**
 * CombatComponent - Attack and Combat Management (MODEL)
 * Handles attack execution, cooldowns, range validation, and target tracking
 * Used by: Ants (Warrior priority), Queen (all powers), Boss (melee + projectiles)
 */

import { BaseComponent } from './BaseComponent';
import { GameObject } from '../GameObject';
import { EventBus } from '../../utils/eventBus';
import { GameEvents } from '../../utils/eventBus';

/**
 * CombatComponent
 * Manages entity combat, attacks, cooldowns, and targeting
 */
export class CombatComponent extends BaseComponent {
    private attackDamage: number;
    private attackRange: number;
    private attackCooldown: number;        // Milliseconds between attacks
    private targetId: string | null = null;
    private attacking: boolean = false;
    private remainingCooldown: number = 0; // Track cooldown time remaining

    /**
     * Create a new CombatComponent
     * @param attackDamage - Damage dealt per attack
     * @param attackRange - Maximum range for attacks (in grid units)
     * @param attackCooldown - Cooldown between attacks (milliseconds)
     */
    constructor(attackDamage: number, attackRange: number, attackCooldown: number) {
        super();
        this.attackDamage = Math.max(0, attackDamage); // Clamp to zero
        this.attackRange = Math.max(0, attackRange);
        this.attackCooldown = Math.max(0, attackCooldown);
    }

    /**
     * Hook: Cleanup combat state before detach
     */
    protected onDetaching(): void {
        this.clearTarget();
        this.attacking = false;
        this.remainingCooldown = 0;
    }

    /**
     * Lifecycle: Update cooldown timer
     */
    update(deltaTime: number): void {
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
    }

    /**
     * Execute attack on target
     * @param target - Target GameObject
     * @returns True if attack executed, false if failed
     */
    public attack(target: GameObject): boolean {
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
        EventBus.emit(GameEvents.ENTITY_ATTACKED, this.owner.id, target.id, this.attackDamage);

        return true;
    }

    /**
     * Check if entity can attack (cooldown ready)
     */
    public canAttack(): boolean {
        return this.remainingCooldown === 0;
    }

    /**
     * Check if target is within attack range
     * @param target - Target GameObject
     */
    public isInRange(target: GameObject): boolean {
        if (!target || !this.owner) {
            return false;
        }

        // Calculate grid distance (Euclidean)
        const dx = target.gridX - this.owner.gridX;
        const dy = target.gridY - this.owner.gridY;
        const gridDistance = Math.sqrt(dx * dx + dy * dy);

        return gridDistance <= this.attackRange;
    }

    /**
     * Set current target
     * @param targetId - ID of target entity
     */
    public setTarget(targetId: string): void {
        this.targetId = targetId;
    }

    /**
     * Clear current target
     */
    public clearTarget(): void {
        this.targetId = null;
    }

    /**
     * Get current target ID
     */
    public getTarget(): string | null {
        return this.targetId;
    }

    /**
     * Check if currently attacking
     */
    public isAttacking(): boolean {
        return this.attacking;
    }

    /**
     * Get remaining cooldown time
     */
    public getRemainingCooldown(): number {
        return Math.max(0, this.remainingCooldown);
    }

    /**
     * Get attack damage
     */
    public getAttackDamage(): number {
        return this.attackDamage;
    }

    /**
     * Set attack damage (for buffs/debuffs)
     * @param damage - New damage value
     */
    public setAttackDamage(damage: number): void {
        this.attackDamage = Math.max(0, damage);
    }

    /**
     * Get attack range
     */
    public getAttackRange(): number {
        return this.attackRange;
    }

    /**
     * Set attack range (for buffs/debuffs)
     * @param range - New range value
     */
    public setAttackRange(range: number): void {
        this.attackRange = Math.max(0, range);
    }

    /**
     * Get attack cooldown
     */
    public getAttackCooldown(): number {
        return this.attackCooldown;
    }

    /**
     * Set attack cooldown (for buffs/debuffs)
     * @param cooldown - New cooldown value (milliseconds)
     */
    public setAttackCooldown(cooldown: number): void {
        this.attackCooldown = Math.max(0, cooldown);
    }
}
