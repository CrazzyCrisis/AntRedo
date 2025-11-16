import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { WATER_EFFECT_CONFIG } from '../../config/environmentEffectsConfig';

/**
 * WaterParticleComponent - Individual water particle for swimming effect
 */
export class WaterParticleComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.VISUAL_EFFECTS;
    public depth: number = 999;

    private x: number;
    private y: number;
    private velocityX: number;
    private velocityY: number;
    private color: string;
    private size: number;
    private startTime: number;
    private lifetime: number;
    private isExpired: boolean = false;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = 2 + Math.random() * 2; // 2-4 pixel particles
        this.startTime = Date.now();
        this.lifetime = WATER_EFFECT_CONFIG.particles.lifetime;

        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * WATER_EFFECT_CONFIG.particles.spreadRadius;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = -WATER_EFFECT_CONFIG.particles.floatSpeed - Math.random() * 20; // Float upward
    }

    update(): boolean {
        if (this.isExpired) return true;

        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.lifetime;

        if (progress >= 1) {
            this.isExpired = true;
            return true;
        }

        // Update position
        const deltaTime = 16.67 / 1000; // Assume ~60fps
        this.x += this.velocityX * deltaTime * 60;
        this.y += this.velocityY * deltaTime * 60;

        // Slow down over time
        this.velocityX *= 0.98;
        this.velocityY *= 0.98;

        return false;
    }

    render(graphics: any): void {
        if (this.isExpired) return;

        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.lifetime;

        // Calculate alpha (fade out)
        let alpha = 255;
        if (progress > WATER_EFFECT_CONFIG.particles.fadeStart) {
            const fadeProgress = (progress - WATER_EFFECT_CONFIG.particles.fadeStart) / 
                                (1 - WATER_EFFECT_CONFIG.particles.fadeStart);
            alpha = 255 * (1 - fadeProgress);
        }

        // Parse hex color
        const r = parseInt(this.color.slice(1, 3), 16);
        const g = parseInt(this.color.slice(3, 5), 16);
        const b = parseInt(this.color.slice(5, 7), 16);

        graphics.noStroke();
        graphics.fill(r, g, b, alpha);
        graphics.ellipse(this.x, this.y, this.size, this.size);
    }

    isFinished(): boolean {
        return this.isExpired;
    }
}
