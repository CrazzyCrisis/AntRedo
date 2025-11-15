/**
 * SafeZone - Protected area around queen/spawn point where enemies cannot spawn
 * 
 * Features:
 * - Circular boundary detection for spawn validation
 * - Timer-based expansion after initial safe period
 * - EventBus integration for safe zone events
 * 
 * Pattern:
 * - Create at level start around queen position
 * - Check isPositionSafe() before spawning enemies
 * - Call update() each frame to handle timer/expansion
 * - Listen to SAFE_ZONE_EXPIRED event for gameplay changes
 */

import { EventBus } from '../utils/eventBus';
import { GameEvents } from '../utils/eventBus';
import { SafeZoneConfig } from '../config/spawnConfig';

/**
 * Safe zone state for serialization/debugging
 */
export interface SafeZoneState {
    centerX: number;
    centerY: number;
    initialRadius: number;
    currentRadius: number;
    maxRadius: number;
    isActive: boolean;
    remainingTime: number;
    expansionRate: number;
}

/**
 * SafeZone - Protected area preventing enemy spawns
 */
export class SafeZone {
    private centerX: number;
    private centerY: number;
    private initialRadius: number;
    private currentRadius: number;
    private maxRadius: number;
    private expansionRate: number; // units per second
    private timer: number; // milliseconds until expansion starts
    private isActive: boolean;
    private hasExpired: boolean;

    constructor(centerX: number, centerY: number, config: SafeZoneConfig) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.initialRadius = config.radius;
        this.currentRadius = config.radius;
        this.maxRadius = config.radius * 2; // Default: can expand to 2x initial size
        this.expansionRate = config.radius / 10; // Default: contracts over ~10 seconds
        this.timer = (config.duration ?? 60) * 1000; // Convert seconds to ms, default 60s
        this.isActive = true;
        this.hasExpired = false;
    }

    /**
     * Update safe zone timer and expansion
     * @param deltaTime Time since last frame in milliseconds
     */
    public update(deltaTime: number): void {
        if (!this.isActive) return;

        // Count down timer
        if (this.timer > 0) {
            this.timer -= deltaTime;
            
            // Timer expired - start expansion
            if (this.timer <= 0) {
                this.timer = 0;
                EventBus.emit(GameEvents.SAFE_ZONE_EXPIRED, this.centerX, this.centerY);
            }
        }

        // Expand radius after timer expires
        if (this.timer === 0 && this.currentRadius > 0) {
            const expansionAmount = (this.expansionRate * deltaTime) / 1000; // Convert ms to seconds
            this.currentRadius = Math.max(0, this.currentRadius - expansionAmount);

            // Check if fully contracted
            if (this.currentRadius === 0 && !this.hasExpired) {
                this.hasExpired = true;
                this.isActive = false;
                EventBus.emit(GameEvents.SAFE_ZONE_FULLY_CONTRACTED, this.centerX, this.centerY);
            }
        }
    }

    /**
     * Check if position is inside safe zone
     * @returns true if position is protected (enemies cannot spawn here)
     */
    public isPositionSafe(x: number, y: number): boolean {
        if (!this.isActive || this.currentRadius === 0) return false;

        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSquared = this.currentRadius * this.currentRadius;

        return distanceSquared <= radiusSquared;
    }

    /**
     * Get distance from position to safe zone edge
     * @returns Negative if inside zone, positive if outside
     */
    public getDistanceToEdge(x: number, y: number): number {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance - this.currentRadius;
    }

    /**
     * Check if safe zone is still active
     */
    public getIsActive(): boolean {
        return this.isActive;
    }

    /**
     * Get current radius
     */
    public getCurrentRadius(): number {
        return this.currentRadius;
    }

    /**
     * Get center position
     */
    public getCenter(): { x: number; y: number } {
        return { x: this.centerX, y: this.centerY };
    }

    /**
     * Get remaining time before expansion starts (milliseconds)
     */
    public getRemainingTime(): number {
        return Math.max(0, this.timer);
    }

    /**
     * Get safe zone state for serialization/debugging
     */
    public getState(): SafeZoneState {
        return {
            centerX: this.centerX,
            centerY: this.centerY,
            initialRadius: this.initialRadius,
            currentRadius: this.currentRadius,
            maxRadius: this.maxRadius,
            isActive: this.isActive,
            remainingTime: this.timer,
            expansionRate: this.expansionRate
        };
    }

    /**
     * Manually deactivate safe zone
     */
    public deactivate(): void {
        if (this.isActive) {
            this.isActive = false;
            this.currentRadius = 0;
            EventBus.emit(GameEvents.SAFE_ZONE_DEACTIVATED, this.centerX, this.centerY);
        }
    }

    /**
     * Manually expand safe zone (e.g., player builds defensive structures)
     */
    public expandRadius(amount: number): void {
        if (!this.isActive) return;
        this.currentRadius = Math.min(this.maxRadius, this.currentRadius + amount);
    }

    /**
     * Reset safe zone to initial state
     */
    reset(config: SafeZoneConfig): void {
        this.initialRadius = config.radius;
        this.currentRadius = config.radius;
        this.maxRadius = config.radius * 2;
        this.expansionRate = config.radius / 10;
        this.timer = (config.duration ?? 60) * 1000;
        this.isActive = true;
        this.hasExpired = false;
    }
}
