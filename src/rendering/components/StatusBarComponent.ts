/**
 * StatusBarComponent - Generic status bar display above entities
 * 
 * Generic, configurable status bar for health, hunger, oxygen, stamina, etc.
 * Colors, events, and visual settings defined in statusBarConfig.ts
 * 
 * Features:
 * - Appears above entity when value is not full or recently changed
 * - Configurable events per bar type (damaged/healed/restored)
 * - Fades out after display duration with no changes
 * - Color-coded with threshold-based colors from config
 * - Smooth value transitions with lerp animation
 * - Supports multiple bars per entity with different offsets
 * 
 * Usage:
 * ```typescript
 * const healthBar = new StatusBarComponent(entityId, x, y, 'health', maxHealth);
 * const hungerBar = new StatusBarComponent(entityId, x, y, 'hunger', maxHunger);
 * healthBar.updateValue(currentHealth, maxHealth);
 * healthBar.setPosition(x, y); // Called each frame to follow entity
 * ```
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus } from '../../utils/eventBus';
import { lerp } from '../../utils/helpers';
import { STATUS_BAR_CONFIGS, DEFAULT_STATUS_BAR_VISUAL, StatusBarConfig } from '../../config/statusBarConfig';

export class StatusBarComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.ABOVE_ENTITIES;
    public depth: number;
    
    private entityId: string;
    private x: number;
    private y: number;
    private currentValue: number;
    private displayValue: number; // For smooth lerp animation
    private maxValue: number;
    private config: StatusBarConfig;
    
    // Display settings (from config + defaults)
    private barWidth: number;
    private barHeight: number;
    private offsetY: number;
    private borderThickness: number;
    
    // Timing and visibility
    private lastUpdateTime: number = Date.now();
    private displayDuration: number;
    private fadeDuration: number;
    private lerpSpeed: number;
    
    // Event cleanup
    private unsubscribeFunctions: Array<() => void> = [];
    
    constructor(
        entityId: string,
        x: number,
        y: number,
        barType: string = 'health',
        maxValue: number = 100,
        customWidth?: number,
        customHeight?: number,
        customOffsetY?: number
    ) {
        this.entityId = entityId;
        this.x = x;
        this.y = y;
        this.maxValue = maxValue;
        this.currentValue = maxValue;
        this.displayValue = maxValue;
        this.depth = y;
        
        // Get config for this bar type
        this.config = STATUS_BAR_CONFIGS[barType] || STATUS_BAR_CONFIGS.health;
        
        // Merge config visual settings with defaults and custom values
        const visualConfig = this.config.visual || {};
        this.barWidth = customWidth ?? visualConfig.width ?? DEFAULT_STATUS_BAR_VISUAL.width;
        this.barHeight = customHeight ?? visualConfig.height ?? DEFAULT_STATUS_BAR_VISUAL.height;
        this.offsetY = customOffsetY ?? visualConfig.offsetY ?? DEFAULT_STATUS_BAR_VISUAL.offsetY;
        this.borderThickness = visualConfig.borderThickness ?? DEFAULT_STATUS_BAR_VISUAL.borderThickness;
        
        this.displayDuration = DEFAULT_STATUS_BAR_VISUAL.displayDuration;
        this.fadeDuration = DEFAULT_STATUS_BAR_VISUAL.fadeDuration;
        this.lerpSpeed = DEFAULT_STATUS_BAR_VISUAL.lerpSpeed;
        
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners based on bar type configuration
     */
    private setupEventListeners(): void {
        const events = this.config.events;
        
        // Listen for damage/depletion events
        if (events.damaged) {
            const unsubDamaged = EventBus.on(events.damaged, (targetEntityId: string) => {
                if (targetEntityId === this.entityId) {
                    this.lastUpdateTime = Date.now();
                }
            });
            this.unsubscribeFunctions.push(unsubDamaged);
        }
        
        // Listen for heal/restoration events
        if (events.healed) {
            const unsubHealed = EventBus.on(events.healed, (targetEntityId: string) => {
                if (targetEntityId === this.entityId) {
                    this.lastUpdateTime = Date.now();
                }
            });
            this.unsubscribeFunctions.push(unsubHealed);
        }
    }
    
    /**
     * Update current value and max value
     */
    public updateValue(newValue: number, newMaxValue?: number): void {
        this.currentValue = newValue;
        if (newMaxValue !== undefined) {
            this.maxValue = newMaxValue;
        }
        this.lastUpdateTime = Date.now();
    }
    
    /**
     * Update bar position (called each frame to follow entity)
     */
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.depth = y;
    }
    
    /**
     * Get color based on current value percentage and config thresholds
     */
    private getBarColor(): { r: number; g: number; b: number } {
        const percentage = this.currentValue / this.maxValue;
        
        // Find the appropriate color based on thresholds (sorted high to low)
        for (const colorThreshold of this.config.colors) {
            if (percentage >= colorThreshold.threshold) {
                return colorThreshold.color;
            }
        }
        
        // Fallback to last color (lowest threshold)
        return this.config.colors[this.config.colors.length - 1].color;
    }
    
    /**
     * Calculate alpha based on time since last update
     */
    private calculateAlpha(): number {
        const timeSinceUpdate = Date.now() - this.lastUpdateTime;
        
        // Full opacity during display duration
        if (timeSinceUpdate < this.displayDuration) {
            return 255;
        }
        
        // Fade out during fade duration
        const fadeProgress = (timeSinceUpdate - this.displayDuration) / this.fadeDuration;
        return Math.max(0, 255 * (1 - fadeProgress));
    }
    
    /**
     * Determine if bar should be visible
     */
    private shouldDisplay(): boolean {
        // Always show if not at full value
        if (this.currentValue < this.maxValue) {
            return true;
        }
        
        // Show for display duration + fade duration after reaching full
        const timeSinceUpdate = Date.now() - this.lastUpdateTime;
        return timeSinceUpdate < (this.displayDuration + this.fadeDuration);
    }
    
    public render(p: any): void {
        if (!this.shouldDisplay()) return;
        
        // Smooth lerp animation
        this.displayValue = lerp(this.displayValue, this.currentValue, this.lerpSpeed);
        
        const alpha = this.calculateAlpha();
        if (alpha <= 0) return;
        
        const color = this.getBarColor();
        const fillWidth = (this.displayValue / this.maxValue) * this.barWidth;
        
        const barX = this.x - this.barWidth / 2;
        const barY = this.y + this.offsetY;
        
        p.push();
        
        // Border
        p.stroke(0, 0, 0, alpha);
        p.strokeWeight(this.borderThickness);
        p.noFill();
        p.rect(barX, barY, this.barWidth, this.barHeight);
        
        // Background (dark gray)
        p.noStroke();
        p.fill(40, 40, 40, alpha);
        p.rect(barX + this.borderThickness, barY + this.borderThickness, 
               this.barWidth - this.borderThickness * 2, 
               this.barHeight - this.borderThickness * 2);
        
        // Foreground (colored fill)
        if (fillWidth > 0) {
            p.fill(color.r, color.g, color.b, alpha);
            p.rect(barX + this.borderThickness, barY + this.borderThickness, 
                   fillWidth - this.borderThickness * 2, 
                   this.barHeight - this.borderThickness * 2);
        }
        
        p.pop();
    }
    
    /**
     * Cleanup event listeners
     */
    public destroy(): void {
        this.unsubscribeFunctions.forEach(unsub => unsub());
        this.unsubscribeFunctions = [];
    }
}
