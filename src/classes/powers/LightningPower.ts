/**
 * LightningPower - Queen Power: Lightning Strike
 * Single target instant strike with AOE knockback and soot stain
 */

import { IPower } from './IPower';
import { ENTITY_CONFIG } from '../../config/gameplay/entityConfig';
import { EventBus } from '../../utils/eventBus';
import { EntityManager } from '../../managers/EntityManager';
import { angleBetween, clamp, getEntitiesInRadius } from '../../utils/helpers';

/**
 * Lightning Power - Fast attack with knockback and soot effect
 * Behavior: Instant strike at target, knockback nearby entities, create soot stain
 */
export class LightningPower implements IPower {
    public name: string = 'lightning';
    public isUnlocked: boolean = false;
    public level: number = 1;
    public maxLevel: number = 3;
    public cooldown: number;
    public lastUsedTime: number = -Infinity;

    constructor() {
        this.cooldown = ENTITY_CONFIG.QUEEN.POWERS.lightning.cooldown;
    }

    /**
     * Use lightning power
     * @param queenX - Queen's grid X position
     * @param queenY - Queen's grid Y position
     * @param targetX - Target X position (optional, can use targetId instead)
     * @param targetY - Target Y position (optional)
     * @param targetId - Target entity ID (optional)
     * @returns True if power was successfully used
     */
    public use(_queenX: number, _queenY: number, targetX?: number, targetY?: number, targetId?: string): boolean {
        if (!this.canUse()) return false;

        // Get target position
        let strikeX = targetX;
        let strikeY = targetY;

        if (targetId) {
            const target = EntityManager.getInstance().getEntity(targetId);
            if (!target) return false;
            strikeX = target.gridX;
            strikeY = target.gridY;
        }

        if (strikeX === undefined || strikeY === undefined) return false;

        // Get current level config
        const levelConfig = ENTITY_CONFIG.QUEEN.POWERS.lightning.levels[this.level - 1];

        // Apply damage to target
        if (targetId) {
            EventBus.emit('LIGHTNING_STRIKE_DIRECT', targetId, levelConfig.damage);
        }

        // Apply knockback to all entities in radius
        const entitiesInRange = getEntitiesInRadius(
            EntityManager.getInstance(),
            strikeX!,
            strikeY!,
            levelConfig.radius || 0,
            true // active only
        );

        for (const entity of entitiesInRange) {
            // Calculate knockback direction
            const angle = angleBetween(strikeX!, strikeY!, entity.gridX, entity.gridY);
            const knockbackX = Math.cos(angle) * (levelConfig.knockback || 0);
            const knockbackY = Math.sin(angle) * (levelConfig.knockback || 0);

            EventBus.emit('ENTITY_KNOCKBACK', entity.id, knockbackX, knockbackY);
        }

        // Create soot stain
        EventBus.emit('SOOT_STAIN_CREATED', strikeX, strikeY, levelConfig.duration || 2);

        // Update last used time
        this.lastUsedTime = Date.now() / 1000; // Convert to seconds

        // Emit event with bolt count for visual effects
        // Parameters: strikeX, strikeY, damage, radius, hitCount, boltCount, queenX, queenY
        EventBus.emit('LIGHTNING_STRIKE', strikeX, strikeY, levelConfig.damage, levelConfig.radius, entitiesInRange.length, levelConfig.boltCount || 3, _queenX, _queenY);

        return true;
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
