import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { DAMAGE_NUMBER_CONFIG } from '../../config/visualEffects';

/**
 * DamageNumberComponent - Floating damage/healing numbers
 * Automatically floats upward and fades out over time
 */
export class DamageNumberComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.VISUAL_EFFECTS;
    public depth: number = 1000; // Always on top of entities

    private x: number;
    private y: number;
    private startY: number;
    private text: string;
    private color: string;
    private startTime: number;
    private duration: number;
    private floatDistance: number;
    private scale: number;
    private scaleStart: number;
    private scaleEnd: number;
    private fadeStartTime: number;
    private isFinished: boolean = false;

    constructor(
        x: number,
        y: number,
        value: number,
        color?: string,
        isCritical: boolean = false
    ) {
        // Add random offset
        this.x = x + (Math.random() * DAMAGE_NUMBER_CONFIG.randomOffsetX * 2 - DAMAGE_NUMBER_CONFIG.randomOffsetX);
        this.y = y + DAMAGE_NUMBER_CONFIG.offsetY;
        this.startY = this.y;

        // Format text
        const prefix = value > 0 ? '+' : '';
        this.text = prefix + Math.abs(value).toString();
        
        // Use provided color or default physical damage color
        this.color = color || DAMAGE_NUMBER_CONFIG.colors.physical;

        // Configure duration and scale
        if (isCritical) {
            this.duration = DAMAGE_NUMBER_CONFIG.criticalDuration;
            this.scaleStart = DAMAGE_NUMBER_CONFIG.criticalScale;
            this.scaleEnd = DAMAGE_NUMBER_CONFIG.criticalScale * 0.8;
        } else {
            this.duration = DAMAGE_NUMBER_CONFIG.duration;
            this.scaleStart = DAMAGE_NUMBER_CONFIG.scaleStart;
            this.scaleEnd = DAMAGE_NUMBER_CONFIG.scaleEnd;
        }

        this.floatDistance = DAMAGE_NUMBER_CONFIG.floatDistance;
        this.fadeStartTime = DAMAGE_NUMBER_CONFIG.fadeStartTime;
        this.scale = this.scaleStart;
        this.startTime = Date.now();
    }

    /**
     * Update animation
     * @returns true if effect is finished and should be removed
     */
    update(): boolean {
        if (this.isFinished) return true;

        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // Float upward
        this.y = this.startY - (this.floatDistance * progress);

        // Scale animation (start big, shrink slightly)
        this.scale = this.scaleStart + (this.scaleEnd - this.scaleStart) * progress;

        // Check if finished
        if (progress >= 1) {
            this.isFinished = true;
            return true;
        }

        return false;
    }

    render(graphics: any): void {
        if (this.isFinished) return;

        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // Calculate alpha (fade out after fadeStartTime)
        let alpha = 255;
        if (progress > this.fadeStartTime) {
            const fadeProgress = (progress - this.fadeStartTime) / (1 - this.fadeStartTime);
            alpha = 255 * (1 - fadeProgress);
        }

        graphics.push();
        graphics.translate(this.x, this.y);
        graphics.scale(this.scale);

        // Draw text with stroke for visibility
        graphics.textAlign(graphics.CENTER, graphics.CENTER);
        graphics.textSize(DAMAGE_NUMBER_CONFIG.fontSize);
        graphics.textStyle(graphics.BOLD);

        // Parse hex color to RGB
        const r = parseInt(this.color.slice(1, 3), 16);
        const g = parseInt(this.color.slice(3, 5), 16);
        const b = parseInt(this.color.slice(5, 7), 16);

        // Black outline for visibility
        graphics.stroke(0, 0, 0, alpha);
        graphics.strokeWeight(3);
        graphics.fill(r, g, b, alpha);
        graphics.text(this.text, 0, 0);

        graphics.pop();
    }

    isExpired(): boolean {
        return this.isFinished;
    }
}
