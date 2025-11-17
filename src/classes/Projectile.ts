/**
 * Projectile - Moving Projectile Entity (MODEL)
 * Supports homing and straight-line movement with collision detection
 * Used by Boss attacks and Queen powers (Fireball)
 */

import { GameObject } from './GameObject';
import { EventBus } from '../utils/eventBus';
import { angleBetween, vectorNormalize, normalizeAngle, distance } from '../utils/helpers';
import { ENTITY_CONFIG } from '../config/gameplay/entityConfig';

export class Projectile extends GameObject {
    public damage: number;
    public speed: number;
    public targetId: string | null;
    public ownerId: string;
    public projectileType: 'homing' | 'straight';
    public lifeTime: number;  // Seconds remaining
    private maxLifeTime: number = 10;  // Max 10 seconds before expiring
    
    // Movement direction (for straight projectiles)
    private directionX: number = 0;
    private directionY: number = 0;

    constructor(
        startGridX: number,
        startGridY: number,
        targetId: string | null,
        damage: number,
        speed: number,
        projectileType: 'homing' | 'straight',
        ownerId: string
    ) {
        super('projectile', startGridX, startGridY, 8);  // Small collision box
        
        this.damage = damage;
        this.speed = speed;
        this.targetId = targetId;
        this.ownerId = ownerId;
        this.projectileType = projectileType;
        this.lifeTime = this.maxLifeTime;
        
        // For straight projectiles, calculate initial direction
        if (projectileType === 'straight' && targetId) {
            this.calculateInitialDirection();
        }
        
        // Emit creation event
        EventBus.emit('PROJECTILE_CREATED', this.id, startGridX, startGridY, projectileType);
    }

    /**
     * Calculate initial direction for straight-line projectiles
     * Stores normalized direction vector
     */
    private calculateInitialDirection(): void {
        // This would normally get target position from EntityManager
        // For now, we'll set a default direction
        // The factory or manager should call setDirection() after creation
        this.directionX = 1;
        this.directionY = 0;
    }

    /**
     * Set movement direction (for straight projectiles)
     * @param targetX - Target X position
     * @param targetY - Target Y position
     */
    public setDirection(targetX: number, targetY: number): void {
        const angle = angleBetween(this.worldX, this.worldY, targetX, targetY);
        this.directionX = Math.cos(angle);
        this.directionY = Math.sin(angle);
        
        // Normalize to ensure consistent speed
        const normalized = vectorNormalize(this.directionX, this.directionY);
        this.directionX = normalized.x;
        this.directionY = normalized.y;
    }

    /**
     * Move towards target (for homing projectiles)
     * Uses turn speed from config to gradually adjust direction
     * @param deltaTime - Time elapsed since last update (seconds)
     */
    public moveTowardsTarget(deltaTime: number): void {
        if (this.projectileType === 'homing') {
            this.updateHomingDirection();
        }
        
        // Move in current direction
        const moveDistance = this.speed * deltaTime;
        const newWorldX = this.worldX + (this.directionX * moveDistance);
        const newWorldY = this.worldY + (this.directionY * moveDistance);
        
        // Convert back to grid position
        const tileSize = 16; // TODO: Get from config
        const newGridX = Math.floor(newWorldX / tileSize);
        const newGridY = Math.floor(newWorldY / tileSize);
        
        // Update position
        this.moveTo(newGridX, newGridY);
    }

    /**
     * Update homing direction to track target
     * Gradually turns towards target using turn speed
     */
    public updateHomingDirection(): void {
        if (!this.targetId) {
            return; // No target, continue straight
        }
        
        // This would normally get target from EntityManager
        // For now, we emit event and let manager handle it
        EventBus.emit('PROJECTILE_NEEDS_TARGET_POSITION', this.id, this.targetId);
        
        // The manager should call updateDirectionTowards() with target position
    }

    /**
     * Update direction to move towards specific position
     * Used by homing projectiles
     * @param targetX - Target X world position
     * @param targetY - Target Y world position
     */
    public updateDirectionTowards(targetX: number, targetY: number): void {
        // Check if target is out of homing range
        const dist = distance(this.worldX, this.worldY, targetX, targetY);
        if (dist > ENTITY_CONFIG.BOSS.PROJECTILE.HOMING.homingRange * 16) { // Convert tiles to pixels
            return; // Out of range, stop homing
        }
        
        // Calculate desired angle to target
        const desiredAngle = angleBetween(this.worldX, this.worldY, targetX, targetY);
        
        // Calculate current angle
        const currentAngle = Math.atan2(this.directionY, this.directionX);
        
        // Calculate angle difference
        let angleDiff = desiredAngle - currentAngle;
        angleDiff = normalizeAngle(angleDiff);
        
        // Apply turn speed limit
        const turnSpeed = ENTITY_CONFIG.BOSS.PROJECTILE.HOMING.turnSpeed * (Math.PI / 180); // Convert to radians
        const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);
        
        // Calculate new angle
        const newAngle = currentAngle + turnAmount;
        
        // Update direction
        this.directionX = Math.cos(newAngle);
        this.directionY = Math.sin(newAngle);
    }

    /**
     * Handle collision with target
     * @param targetId - ID of entity hit
     */
    public onHit(targetId: string): void {
        EventBus.emit('PROJECTILE_HIT', this.id, targetId, this.damage, this.ownerId);
        this.destroy();
    }

    /**
     * Update projectile lifetime and movement
     * @param deltaTime - Time elapsed (seconds)
     */
    public update(deltaTime: number): void {
        super.update(deltaTime);
        
        if (!this.isActive) {
            return;
        }
        
        // Update lifetime
        this.lifeTime -= deltaTime;
        
        // Check if expired
        if (this.lifeTime <= 0) {
            this.expire();
            return;
        }
        
        // Move projectile
        this.moveTowardsTarget(deltaTime);
    }

    /**
     * Expire projectile (lifetime ran out)
     */
    private expire(): void {
        EventBus.emit('PROJECTILE_EXPIRED', this.id);
        this.destroy();
    }

    /**
     * Get current direction vector
     */
    public getDirection(): { x: number; y: number } {
        return { x: this.directionX, y: this.directionY };
    }

    /**
     * Get remaining lifetime as percentage
     */
    public getLifeTimePercent(): number {
        return (this.lifeTime / this.maxLifeTime) * 100;
    }
}
