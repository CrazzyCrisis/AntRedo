/**
 * FinalFlashPower - Queen Power: Final Flash (Ultimate)
 * Screen-wide instant kill for all non-friendly entities
 * Requires all other powers at level 3 to unlock
 */

import { IPower } from './IPower';
import { ENTITY_CONFIG } from '../../config/gameplay/entityConfig';
import { EventBus } from '../../utils/eventBus';
import { EntityManager } from '../../managers/EntityManager';
import { FactionManager } from '../../managers/FactionManager';
import { clamp, isEntityEnemy } from '../../utils/helpers';

/**
 * Final Flash Power - Ultimate ability, screen-wide devastation
 * Behavior: Kills all non-friendly entities on screen, very long cooldown
 */
export class FinalFlashPower implements IPower {
    public name: string = 'finalFlash';
    public isUnlocked: boolean = false;
    public level: number = 1;
    public maxLevel: number = 3;
    public cooldown: number;
    public lastUsedTime: number = -Infinity;
    private queenFactionId: string | null = null;

    constructor(queenFactionId?: string) {
        this.cooldown = ENTITY_CONFIG.QUEEN.POWERS.finalFlash.cooldown;
        this.queenFactionId = queenFactionId || null;
    }

    /**
     * Set queen's faction ID for enemy detection
     * @param factionId - Faction ID of the queen
     */
    public setQueenFaction(factionId: string): void {
        this.queenFactionId = factionId;
    }

    /**
     * Use final flash power
     * @param queenX - Queen's grid X position
     * @param queenY - Queen's grid Y position
     * @returns True if power was successfully used
     */
    public use(queenX: number, queenY: number): boolean {
        if (!this.canUse()) return false;

        // Get current level config
        const levelConfig = ENTITY_CONFIG.QUEEN.POWERS.finalFlash.levels[this.level - 1];
        const damage = levelConfig.damage || 1000;

        // Get ALL active entities (screen-wide effect)
        const allEntities = EntityManager.getInstance().getAllEntities().filter(entity => entity.isActive);

        let killedCount = 0;

        // Damage all enemy entities
        for (const entity of allEntities) {
            // Check if entity is enemy
            const isEnemy = isEntityEnemy(
                EntityManager.getInstance(),
                FactionManager.getInstance(),
                entity.id,
                this.queenFactionId
            );
            if (!isEnemy) continue; // Don't kill friendly entities

            // Apply massive damage (instant kill)
            EventBus.emit('ENTITY_DAMAGED', entity.id, damage, 'finalFlash');
            killedCount++;
        }

        // Update last used time
        this.lastUsedTime = Date.now() / 1000;

        // Emit final flash event
        EventBus.emit('FINALFLASH_ACTIVATED', queenX, queenY, killedCount);

        return true;
    }

    /**
     * Check if power can be used
     * Must be unlocked and off cooldown
     * @returns True if power is off cooldown and unlocked
     */
    public canUse(): boolean {
        return this.isUnlocked && !this.isOnCooldown();
    }

    /**
     * Check if unlock requirements are met (all other powers level 3)
     * This should be called externally by PowerManager
     * @param otherPowersMaxed - True if all other powers are level 3
     * @returns True if can be unlocked
     */
    public checkUnlockRequirements(otherPowersMaxed: boolean): boolean {
        return otherPowersMaxed;
    }

    /**
     * Unlock the power (called by PowerManager when requirements met)
     */
    public unlock(): void {
        this.isUnlocked = true;
        EventBus.emit('QUEEN_POWER_UNLOCKED', this.name);
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
