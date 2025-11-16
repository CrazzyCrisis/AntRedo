/**
 * HealthBarComponent - Visual health bar display above entities
 * 
 * Features:
 * - Appears above entity when health is not full
 * - Shows on damage/heal events (even if already at max after overheal attempt)
 * - Fades out after DISPLAY_DURATION with no changes
 * - Color-coded: Green (high health), Yellow (medium), Red (low)
 * - Smooth health transitions with lerp animation
 * 
 * Usage:
 * ```typescript
 * const healthBar = new HealthBarComponent(entityId, x, y, maxHealth);
 * healthBar.updateHealth(currentHealth, maxHealth);
 * healthBar.setPosition(x, y); // Called each frame to follow entity
 * ```
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus } from '../../utils/eventBus';
import { lerp } from '../../utils/helpers';

export class HealthBarComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.ABOVE_ENTITIES;
    public depth: number;
    
    private entityId: string;
    private x: number;
    private y: number;
    private currentHealth: number;
    private displayHealth: number; // For smooth lerp animation
    private maxHealth: number;
    
    // Display settings
    private barWidth: number = 32;
    private barHeight: number = 4;
    private offsetY: number = -20; // Pixels above entity
    private borderThickness: number = 1;
    
    // Timing and visibility
    private lastChangeTime: number = 0;
    private readonly DISPLAY_DURATION: number = 3000; // 3 seconds after last change
    private readonly FADE_DURATION: number = 500; // 0.5 second fade out
    private alpha: number = 255; // Current opacity
    
    // Animation
    private readonly LERP_SPEED: number = 0.15; // Health bar fill animation speed
    
    constructor(entityId: string, x: number, y: number, currentHealth: number, maxHealth: number) {
        this.entityId = entityId;
        this.x = x;
        this.y = y;
        this.currentHealth = currentHealth;
        this.displayHealth = currentHealth; // Start at current
        this.maxHealth = maxHealth;
        this.depth = y; // Render at entity's Y position for proper sorting
        
        this.setupEventListeners();
        
        // Show immediately if not at full health
        if (currentHealth < maxHealth) {
            this.lastChangeTime = Date.now();
        }
    }
    
    /**
     * Subscribe to health-related events for this entity
     */
    private setupEventListeners(): void {
        // Listen for damage events
        EventBus.on('ENTITY_DAMAGED', (entityId: string, _damage: number, newHealth: number) => {
            if (entityId === this.entityId) {
                this.updateHealth(newHealth, this.maxHealth);
                this.lastChangeTime = Date.now(); // Reset timer on damage
            }
        });
        
        // Listen for heal events
        EventBus.on('ENTITY_HEALED', (entityId: string, _healAmount: number, newHealth: number) => {
            if (entityId === this.entityId) {
                this.updateHealth(newHealth, this.maxHealth);
                this.lastChangeTime = Date.now(); // Reset timer on heal
            }
        });
    }
    
    /**
     * Update health values
     * @param currentHealth - New current health
     * @param maxHealth - New max health (for when entity gets buffed/debuffed)
     */
    public updateHealth(currentHealth: number, maxHealth?: number): void {
        this.currentHealth = currentHealth;
        if (maxHealth !== undefined) {
            this.maxHealth = maxHealth;
        }
        
        // Reset display timer (show bar)
        this.lastChangeTime = Date.now();
    }
    
    /**
     * Update position to follow entity
     * @param x - Entity center X
     * @param y - Entity center Y
     */
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.depth = y; // Update depth for sorting
    }
    
    /**
     * Check if health bar should be visible
     */
    private shouldDisplay(): boolean {
        // Always show if not at full health
        if (this.currentHealth < this.maxHealth) {
            return true;
        }
        
        // Show for DISPLAY_DURATION after last change (even if at full health from overheal attempt)
        const timeSinceChange = Date.now() - this.lastChangeTime;
        return timeSinceChange < this.DISPLAY_DURATION + this.FADE_DURATION;
    }
    
    /**
     * Calculate current alpha for fade effect
     */
    private calculateAlpha(): number {
        const timeSinceChange = Date.now() - this.lastChangeTime;
        
        // Not at full health? Full opacity
        if (this.currentHealth < this.maxHealth) {
            return 255;
        }
        
        // Within display duration? Full opacity
        if (timeSinceChange < this.DISPLAY_DURATION) {
            return 255;
        }
        
        // Fading out
        const fadeProgress = (timeSinceChange - this.DISPLAY_DURATION) / this.FADE_DURATION;
        return Math.max(0, 255 * (1 - fadeProgress));
    }
    
    /**
     * Get health bar fill color based on health percentage
     */
    private getHealthColor(): { r: number; g: number; b: number } {
        const healthPercent = this.currentHealth / this.maxHealth;
        
        if (healthPercent > 0.6) {
            // Green (healthy)
            return { r: 50, g: 200, b: 50 };
        } else if (healthPercent > 0.3) {
            // Yellow (wounded)
            return { r: 220, g: 200, b: 50 };
        } else {
            // Red (critical)
            return { r: 220, g: 50, b: 50 };
        }
    }
    
    /**
     * Render health bar above entity
     */
    render(graphics: any): void {
        // Check if should display
        if (!this.shouldDisplay()) {
            return;
        }
        
        // Animate display health toward current health (smooth lerp)
        this.displayHealth = lerp(this.displayHealth, this.currentHealth, this.LERP_SPEED);
        
        // Calculate alpha for fade effect
        this.alpha = this.calculateAlpha();
        
        graphics.push();
        
        // Position above entity
        const barX = this.x - this.barWidth / 2;
        const barY = this.y + this.offsetY;
        
        // Draw background (dark gray border)
        graphics.fill(40, 40, 40, this.alpha);
        graphics.noStroke();
        graphics.rect(
            barX - this.borderThickness,
            barY - this.borderThickness,
            this.barWidth + (this.borderThickness * 2),
            this.barHeight + (this.borderThickness * 2)
        );
        
        // Draw background (black interior)
        graphics.fill(0, 0, 0, this.alpha);
        graphics.rect(barX, barY, this.barWidth, this.barHeight);
        
        // Calculate fill width
        const healthPercent = Math.max(0, Math.min(1, this.displayHealth / this.maxHealth));
        const fillWidth = this.barWidth * healthPercent;
        
        // Draw health fill (color-coded)
        const color = this.getHealthColor();
        graphics.fill(color.r, color.g, color.b, this.alpha);
        graphics.rect(barX, barY, fillWidth, this.barHeight);
        
        graphics.pop();
    }
    
    /**
     * Cleanup event listeners
     */
    public destroy(): void {
        // EventBus listeners will be garbage collected
        // Note: In production, you'd want to store unsubscribe functions and call them here
    }
}
