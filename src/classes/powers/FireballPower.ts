/**
 * FireballPower - Queen Power: Fireball
 * Aimed projectile with AOE explosion and burn status
 */

import { IPower } from './IPower';
import { ENTITY_CONFIG } from '../../config/gameplay/entityConfig';
import { EventBus } from '../../utils/eventBus';
import { EntityManager } from '../../managers/EntityManager';
import { distance, clamp, getEntitiesInRadius } from '../../utils/helpers';

/**
 * Fireball Power - Projectile with explosion and burn effect
 * Behavior: Create projectile, on impact create explosion, apply burn status to all in radius
 */
export class FireballPower implements IPower {
    public name: string = 'fireball';
    public isUnlocked: boolean = false;
    public level: number = 1;
    public maxLevel: number = 3;
    public cooldown: number;
    public lastUsedTime: number = -Infinity;

    constructor() {
        this.cooldown = ENTITY_CONFIG.QUEEN.POWERS.fireball.cooldown;
    }

    /**
     * Use fireball power
     * @param queenX - Queen's grid X position
     * @param queenY - Queen's grid Y position
     * @param targetX - Target X position (required for aimed shot)
     * @param targetY - Target Y position (required for aimed shot)
     * @returns True if power was successfully used
     */
    public use(queenX: number, queenY: number, targetX?: number, targetY?: number): boolean {
        if (!this.canUse()) return false;
        if (targetX === undefined || targetY === undefined) return false;

        // Get current level config
        const levelConfig = ENTITY_CONFIG.QUEEN.POWERS.fireball.levels[this.level - 1];

        // Check if target is in range
        const dist = distance(queenX, queenY, targetX, targetY);
        if (dist > (levelConfig.range || 10)) return false;

        // Create fireball projectile (will be handled by ProjectileFactory in integration)
        // For now, emit event for immediate explosion at target
        this.explode(targetX, targetY, levelConfig.damage, levelConfig.radius || 2, levelConfig.duration || 3);

        // Update last used time
        this.lastUsedTime = Date.now() / 1000;

        // Emit power used event
        EventBus.emit('FIREBALL_LAUNCHED', queenX, queenY, targetX, targetY, this.level);

        return true;
    }

    /**
     * Create explosion at position
     * @param x - Explosion X position
     * @param y - Explosion Y position
     * @param damage - Base damage
     * @param radius - AOE radius
     * @param burnDuration - Burn effect duration
     */
    private explode(x: number, y: number, damage: number, radius: number, burnDuration: number): void {
        // Get all entities in explosion radius
        const entitiesInRange = getEntitiesInRadius(
            EntityManager.getInstance(),
            x,
            y,
            radius,
            true // active only
        );

        // Apply damage and burn status to all entities
        for (const entity of entitiesInRange) {
            // Apply initial explosion damage
            EventBus.emit('ENTITY_DAMAGED', entity.id, damage, 'fireball');

            // Apply burn status (damage over time)
            EventBus.emit('ENTITY_BURNING', entity.id, burnDuration, damage * 0.2); // 20% of damage per tick
        }

        // Emit explosion event
        EventBus.emit('FIREBALL_EXPLODE', x, y, radius, damage, entitiesInRange.length);
    }

    /**
     * Check if power can be used
     * @returns True if power is off cooldown and unlocked
     */
    public canUse(): boolean {
        return this.isUnlocked && !this.isOnCooldown();
    }

    /**
     * Upgrade the power to next level
     * @returns True if upgrade successful
     */
    public upgrade(): boolean {
        if (this.level >= this.maxLevel) return false;

        this.level++;
        EventBus.emit('QUEEN_POWER_UPGRADED', this.name, this.level);
        return true;
    }

    /**
     * Check if power is on cooldown
     * @returns True if still cooling down
     */
    public isOnCooldown(): boolean {
        return this.getCooldownRemaining(Date.now() / 1000) > 0;
    }

    /**
     * Get remaining cooldown time in seconds
     * @param currentTime - Current game time in seconds
     * @returns Seconds remaining, or 0 if ready
     */
    public getCooldownRemaining(currentTime: number): number {
        const timeSinceUse = currentTime - this.lastUsedTime;
        const remaining = this.cooldown - timeSinceUse;
        return clamp(remaining, 0, this.cooldown);
    }
}
