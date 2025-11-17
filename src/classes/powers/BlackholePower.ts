/**
 * BlackholePower - Queen Power: Blackhole
 * Placed AOE that pulls entities in spiral toward center with massive center damage
 */

import { IPower } from './IPower';
import { ENTITY_CONFIG } from '../../config/gameplay/entityConfig';
import { EventBus } from '../../utils/eventBus';
import { EntityManager } from '../../managers/EntityManager';
import { distance, angleBetween, clamp, getEntitiesInRadius, distanceFalloff } from '../../utils/helpers';

/**
 * Blackhole Power - Pulls entities in spiral, damages at center
 * Behavior: Create vortex, pull entities toward center each tick, massive damage to entities at center when ends
 */
export class BlackholePower implements IPower {
    public name: string = 'blackhole';
    public isUnlocked: boolean = false;
    public level: number = 1;
    public maxLevel: number = 3;
    public cooldown: number;
    public lastUsedTime: number = -Infinity;

    // Active blackhole tracking
    private activeBlackhole: {
        x: number;
        y: number;
        radius: number;
        pullStrength: number;
        damage: number;
        startTime: number;
        duration: number;
    } | null = null;

    constructor() {
        this.cooldown = ENTITY_CONFIG.QUEEN.POWERS.blackhole.cooldown;
    }

    /**
     * Use blackhole power
     * @param queenX - Queen's grid X position (unused)
     * @param queenY - Queen's grid Y position (unused)
     * @param targetX - Target X position (required)
     * @param targetY - Target Y position (required)
     * @returns True if power was successfully used
     */
    public use(_queenX: number, _queenY: number, targetX?: number, targetY?: number): boolean {
        if (!this.canUse()) return false;
        if (targetX === undefined || targetY === undefined) return false;

        // Get current level config
        const levelConfig = ENTITY_CONFIG.QUEEN.POWERS.blackhole.levels[this.level - 1];

        // Create active blackhole
        this.activeBlackhole = {
            x: targetX,
            y: targetY,
            radius: levelConfig.radius || 4,
            pullStrength: levelConfig.pullStrength || 3,
            damage: levelConfig.damage || 30,
            startTime: Date.now() / 1000,
            duration: levelConfig.duration || 3
        };

        // Update last used time
        this.lastUsedTime = Date.now() / 1000;

        // Emit blackhole created event
        EventBus.emit('BLACKHOLE_CREATED', targetX, targetY, this.activeBlackhole.radius, this.activeBlackhole.duration);

        // Schedule blackhole end
        setTimeout(() => {
            this.endBlackhole();
        }, this.activeBlackhole.duration * 1000);

        return true;
    }

    /**
     * Update blackhole pull effect (called each frame)
     * @param deltaTime - Time elapsed in seconds
     */
    public update(_deltaTime: number): void {
        if (!this.activeBlackhole) return;

        const currentTime = Date.now() / 1000;
        const elapsed = currentTime - this.activeBlackhole.startTime;

        // Check if blackhole should end
        if (elapsed >= this.activeBlackhole.duration) {
            this.endBlackhole();
            return;
        }

        // Pull all entities in radius toward center
        const entitiesInRange = getEntitiesInRadius(
            EntityManager.getInstance(),
            this.activeBlackhole.x,
            this.activeBlackhole.y,
            this.activeBlackhole.radius,
            true // active only
        );

        for (const entity of entitiesInRange) {
            // Calculate pull direction
            const angle = angleBetween(entity.gridX, entity.gridY, this.activeBlackhole.x, this.activeBlackhole.y);
            
            // Calculate pull force (stronger when closer to center)
            const dist = distance(this.activeBlackhole.x, this.activeBlackhole.y, entity.gridX, entity.gridY);
            const pullForce = this.activeBlackhole.pullStrength * distanceFalloff(dist, this.activeBlackhole.radius);

            // Calculate pull vector with spiral
            const pullX = Math.cos(angle) * pullForce;
            const pullY = Math.sin(angle) * pullForce;

            // Add tangential velocity for spiral effect (perpendicular to pull)
            const tangentAngle = angle + Math.PI / 2;
            const spiralX = Math.cos(tangentAngle) * pullForce * 0.3; // 30% of pull for spiral
            const spiralY = Math.sin(tangentAngle) * pullForce * 0.3;

            // Apply pull + spiral
            EventBus.emit('BLACKHOLE_PULL', entity.id, pullX + spiralX, pullY + spiralY);
        }
    }

    /**
     * End blackhole and apply center damage
     */
    private endBlackhole(): void {
        if (!this.activeBlackhole) return;

        // Find all entities very close to center (within 1 tile)
        const centerRadius = 1;
        const entitiesAtCenter = getEntitiesInRadius(
            EntityManager.getInstance(),
            this.activeBlackhole.x,
            this.activeBlackhole.y,
            centerRadius,
            true // active only
        );

        // Apply massive damage to entities at center
        for (const entity of entitiesAtCenter) {
            EventBus.emit('ENTITY_DAMAGED', entity.id, this.activeBlackhole.damage, 'blackhole');
        }

        // Create soot stain
        EventBus.emit('SOOT_STAIN_CREATED', this.activeBlackhole.x, this.activeBlackhole.y, 3);

        // Emit blackhole end event
        EventBus.emit('BLACKHOLE_ENDED', this.activeBlackhole.x, this.activeBlackhole.y, entitiesAtCenter.length);

        this.activeBlackhole = null;
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
