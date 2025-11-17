/**
 * TidalwavePower - Queen Power: Tidalwave
 * Defensive wave radiating from queen, pushes all non-friendly entities back
 */

import { IPower } from './IPower';
import { ENTITY_CONFIG } from '../../config/gameplay/entityConfig';
import { EventBus } from '../../utils/eventBus';
import { EntityManager } from '../../managers/EntityManager';
import { FactionManager } from '../../managers/FactionManager';
import { clamp, getEntitiesInRadius, isEntityEnemy, calculatePushForce } from '../../utils/helpers';

/**
 * Tidalwave Power - Pushes enemies back from queen
 * Behavior: Radial wave from queen, pushes all non-faction entities, deals damage
 */
export class TidalwavePower implements IPower {
    public name: string = 'tidalwave';
    public isUnlocked: boolean = false;
    public level: number = 1;
    public maxLevel: number = 3;
    public cooldown: number;
    public lastUsedTime: number = -Infinity;
    private queenFactionId: string | null = null;

    constructor(queenFactionId?: string) {
        this.cooldown = ENTITY_CONFIG.QUEEN.POWERS.tidalwave.cooldown;
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
     * Use tidalwave power
     * @param queenX - Queen's grid X position
     * @param queenY - Queen's grid Y position
     * @returns True if power was successfully used
     */
    public use(queenX: number, queenY: number): boolean {
        if (!this.canUse()) return false;

        // Get current level config
        const levelConfig = ENTITY_CONFIG.QUEEN.POWERS.tidalwave.levels[this.level - 1];
        const radius = levelConfig.radius || 6;
        const pushStrength = levelConfig.pushStrength || 10;
        const damage = levelConfig.damage || 40;

        // Get all entities in radius
        const entitiesInRange = getEntitiesInRadius(
            EntityManager.getInstance(),
            queenX,
            queenY,
            radius,
            true // active only
        );

        let pushedCount = 0;

        // Push and damage non-friendly entities
        for (const entity of entitiesInRange) {
            // Check if entity is enemy (if faction system available)
            const isEnemy = isEntityEnemy(
                EntityManager.getInstance(),
                FactionManager.getInstance(),
                entity.id,
                this.queenFactionId
            );
            if (!isEnemy) continue; // Don't push friendly entities

            // Calculate push force with distance falloff
            const pushForce = calculatePushForce(
                queenX,
                queenY,
                entity.gridX,
                entity.gridY,
                pushStrength,
                radius
            );

            // Apply push
            EventBus.emit('ENTITY_KNOCKBACK', entity.id, pushForce.x, pushForce.y);

            // Apply damage
            EventBus.emit('ENTITY_DAMAGED', entity.id, damage, 'tidalwave');

            pushedCount++;
        }

        // Update last used time
        this.lastUsedTime = Date.now() / 1000;

        // Emit tidalwave event
        EventBus.emit('TIDALWAVE_PUSH', queenX, queenY, radius, damage, pushedCount);

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
