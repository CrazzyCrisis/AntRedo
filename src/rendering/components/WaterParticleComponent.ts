import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { WATER_PARTICLE_CONFIG } from '../../config/visualEffects/waterParticleConfig';
import { MOTION_PATTERNS } from '../../config/visualEffects/particleMotionPatterns';

/**
 * WaterParticleComponent - Individual water particle for swimming effect
 * Uses configurable motion patterns and appearance settings
 */
export class WaterParticleComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.VISUAL_EFFECTS;
    public depth: number = 999;

    private startX: number;
    private startY: number;
    private color: string;
    private size: number;
    private startTime: number;
    private lifetime: number;
    private isExpired: boolean = false;
    private randomSeed: number;

    constructor(x: number, y: number, color: string, size?: number) {
        this.startX = x;
        this.startY = y;
        this.color = color;
        
        // Use provided size or calculate from config
        if (size !== undefined) {
            this.size = size;
        } else {
            const sizeRange = WATER_PARTICLE_CONFIG.size.max - WATER_PARTICLE_CONFIG.size.min;
            this.size = WATER_PARTICLE_CONFIG.size.min + Math.random() * sizeRange;
        }
        
        this.startTime = Date.now();
        
        // Lifetime with variance
        const lifetimeRange = WATER_PARTICLE_CONFIG.lifetime.max - WATER_PARTICLE_CONFIG.lifetime.min;
        this.lifetime = WATER_PARTICLE_CONFIG.lifetime.min + Math.random() * lifetimeRange;
        
        // Random seed for motion pattern variation
        this.randomSeed = Math.random();
    }

    render(graphics: any): void {
        if (this.isExpired) return;

        const elapsed = Date.now() - this.startTime;
        const age = elapsed / this.lifetime; // 0 to 1

        // Check if expired
        if (age >= 1) {
            this.isExpired = true;
            return;
        }

        // Get position from motion pattern
        const motionPattern = MOTION_PATTERNS[WATER_PARTICLE_CONFIG.motionPattern];
        const { x, y } = motionPattern(age, this.startX, this.startY, this.randomSeed);

        // Calculate alpha (fade over lifetime)
        const alphaRange = WATER_PARTICLE_CONFIG.alphaStart - WATER_PARTICLE_CONFIG.alphaEnd;
        const alpha = (WATER_PARTICLE_CONFIG.alphaStart - age * alphaRange) * 255;

        // Parse hex color
        const r = parseInt(this.color.slice(1, 3), 16);
        const g = parseInt(this.color.slice(3, 5), 16);
        const b = parseInt(this.color.slice(5, 7), 16);

        graphics.noStroke();
        graphics.fill(r, g, b, alpha);
        graphics.ellipse(x, y, this.size, this.size);
    }

    isFinished(): boolean {
        return this.isExpired;
    }
}
