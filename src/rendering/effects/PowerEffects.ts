/**
 * Power Visual Effects
 * Creates visual effects for Queen powers
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { Renderer } from '../Renderer';

/**
 * Base class for temporary visual effects
 */
abstract class TemporaryEffect implements Renderable {
    public layer: RenderLayer;
    public depth: number;
    protected x: number;
    protected y: number;
    protected lifetime: number; // Total duration in seconds
    protected elapsed: number = 0; // Time elapsed
    protected isComplete: boolean = false;

    constructor(x: number, y: number, layer: RenderLayer, depth: number, lifetime: number) {
        this.x = x;
        this.y = y;
        this.layer = layer;
        this.depth = depth;
        this.lifetime = lifetime;
    }

    /**
     * Update effect (called every frame)
     */
    update(deltaTime: number): void {
        this.elapsed += deltaTime;
        if (this.elapsed >= this.lifetime) {
            this.isComplete = true;
        }
    }

    /**
     * Get completion status
     */
    getIsComplete(): boolean {
        return this.isComplete;
    }

    /**
     * Get progress (0 to 1)
     */
    getProgress(): number {
        return Math.min(this.elapsed / this.lifetime, 1);
    }

    abstract render(graphics: any): void;
}

/**
 * Lightning bolt effect
 */
export class LightningEffect extends TemporaryEffect {
    private segments: { x: number; y: number }[];

    constructor(fromX: number, fromY: number, toX: number, toY: number) {
        super(toX, toY, RenderLayer.ABOVE_ENTITIES, toY, 0.3); // 300ms duration
        
        // Generate jagged lightning path
        this.segments = this.generateLightningPath(fromX, fromY, toX, toY);
    }

    private generateLightningPath(x1: number, y1: number, x2: number, y2: number): { x: number; y: number }[] {
        const segments: { x: number; y: number }[] = [];
        const numSegments = 8;
        const jitter = 15; // Max perpendicular offset

        segments.push({ x: x1, y: y1 });

        for (let i = 1; i < numSegments; i++) {
            const t = i / numSegments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            // Add perpendicular jitter
            const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
            const offset = (Math.random() - 0.5) * jitter * 2;
            
            segments.push({
                x: x + Math.cos(angle) * offset,
                y: y + Math.sin(angle) * offset
            });
        }

        segments.push({ x: x2, y: y2 });
        return segments;
    }

    render(graphics: any): void {
        const progress = this.getProgress();
        const alpha = 255 * (1 - progress); // Fade out

        graphics.stroke(200, 200, 255, alpha); // Blue-white lightning
        graphics.strokeWeight(3);

        for (let i = 0; i < this.segments.length - 1; i++) {
            graphics.line(
                this.segments[i].x,
                this.segments[i].y,
                this.segments[i + 1].x,
                this.segments[i + 1].y
            );
        }
    }
}

/**
 * Explosion effect (for fireball)
 */
export class ExplosionEffect extends TemporaryEffect {
    private radius: number;
    private maxRadius: number;

    constructor(x: number, y: number, maxRadius: number) {
        super(x, y, RenderLayer.ABOVE_ENTITIES, y, 0.5); // 500ms duration
        this.radius = 0;
        this.maxRadius = maxRadius;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        const progress = this.getProgress();
        this.radius = this.maxRadius * progress;
    }

    render(graphics: any): void {
        const progress = this.getProgress();
        const alpha = 255 * (1 - progress); // Fade out

        // Outer ring (fire)
        graphics.fill(255, 100, 0, alpha);
        graphics.noStroke();
        graphics.circle(this.x, this.y, this.radius * 2);

        // Inner ring (bright)
        graphics.fill(255, 200, 0, alpha * 1.5);
        graphics.circle(this.x, this.y, this.radius * 1.5);
    }
}

/**
 * Blackhole vortex effect
 */
export class BlackholeEffect extends TemporaryEffect {
    private radius: number;
    private rotation: number = 0;

    constructor(x: number, y: number, radius: number, duration: number) {
        super(x, y, RenderLayer.ABOVE_ENTITIES, y, duration);
        this.radius = radius;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        this.rotation += deltaTime * 2; // Rotate over time
    }

    render(graphics: any): void {
        const progress = this.getProgress();
        const alpha = 180 * (1 - progress * 0.5); // Fade slightly

        graphics.push();
        graphics.translate(this.x, this.y);
        graphics.rotate(this.rotation);

        // Draw spiral
        graphics.noFill();
        graphics.stroke(100, 0, 150, alpha); // Purple
        graphics.strokeWeight(3);
        
        const spiralTurns = 3;
        graphics.beginShape();
        for (let i = 0; i <= 100; i++) {
            const t = i / 100;
            const angle = t * Math.PI * 2 * spiralTurns;
            const r = this.radius * t;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            graphics.vertex(x, y);
        }
        graphics.endShape();

        graphics.pop();
    }
}

/**
 * Tidalwave expanding ring effect
 */
export class TidalwaveEffect extends TemporaryEffect {
    private radius: number;
    private maxRadius: number;

    constructor(x: number, y: number, maxRadius: number) {
        super(x, y, RenderLayer.ABOVE_ENTITIES, y, 0.6); // 600ms duration
        this.radius = 0;
        this.maxRadius = maxRadius;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        const progress = this.getProgress();
        this.radius = this.maxRadius * progress;
    }

    render(graphics: any): void {
        const progress = this.getProgress();
        const alpha = 200 * (1 - progress); // Fade out

        graphics.noFill();
        graphics.stroke(0, 150, 255, alpha); // Blue water
        graphics.strokeWeight(4);
        graphics.circle(this.x, this.y, this.radius * 2);
        
        // Inner ripple
        graphics.strokeWeight(2);
        graphics.circle(this.x, this.y, this.radius * 1.5);
    }
}

/**
 * Screen flash effect (for Final Flash)
 */
export class ScreenFlashEffect extends TemporaryEffect {
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        super(0, 0, RenderLayer.UI, 9999, 1.0); // 1 second duration, top of UI
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    render(graphics: any): void {
        const progress = this.getProgress();
        let alpha = 0;
        
        if (progress < 0.2) {
            // Quick flash in
            alpha = 255 * (progress / 0.2);
        } else {
            // Slower fade out
            alpha = 255 * (1 - ((progress - 0.2) / 0.8));
        }

        graphics.fill(255, 255, 255, alpha);
        graphics.noStroke();
        graphics.rect(0, 0, this.canvasWidth, this.canvasHeight);
    }
}

/**
 * Soot stain effect (left on ground after lightning/blackhole)
 */
export class SootStainEffect extends TemporaryEffect {
    private radius: number;

    constructor(x: number, y: number, radius: number, duration: number) {
        super(x, y, RenderLayer.GROUND_DECORATIONS, y - 1, duration); // Under entities
        this.radius = radius;
    }

    render(graphics: any): void {
        const progress = this.getProgress();
        const alpha = 150 * (1 - progress * 0.5); // Slow fade

        graphics.fill(30, 30, 30, alpha); // Dark gray/black
        graphics.noStroke();
        graphics.circle(this.x, this.y, this.radius * 2);
    }
}

/**
 * Effect Manager - Handles effect lifecycle
 */
export class EffectManager {
    private static instance: EffectManager;
    private effects: TemporaryEffect[] = [];
    private renderer: Renderer;
    private unregisterFunctions: Map<TemporaryEffect, () => void> = new Map();

    private constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.setupEventListeners();
    }

    static initialize(renderer: Renderer): EffectManager {
        if (!EffectManager.instance) {
            EffectManager.instance = new EffectManager(renderer);
        }
        return EffectManager.instance;
    }

    static getInstance(): EffectManager {
        if (!EffectManager.instance) {
            throw new Error('EffectManager not initialized. Call initialize() first.');
        }
        return EffectManager.instance;
    }

    private setupEventListeners(): void {
        // Lightning strike
        EventBus.on(GameEvents.LIGHTNING_STRIKE, (targetX: number, targetY: number, queenX: number, queenY: number, radius: number) => {
            this.createLightning(queenX, queenY, targetX, targetY);
            this.createSootStain(targetX, targetY, radius * 0.5, 10); // 10 seconds
        });

        // Fireball explosion
        EventBus.on(GameEvents.FIREBALL_EXPLODE, (x: number, y: number, radius: number) => {
            this.createExplosion(x, y, radius);
        });

        // Blackhole
        EventBus.on(GameEvents.BLACKHOLE_ACTIVATED, (x: number, y: number, radius: number, duration: number) => {
            this.createBlackhole(x, y, radius, duration);
            this.createSootStain(x, y, radius * 0.6, 15); // 15 seconds
        });

        // Tidalwave
        EventBus.on(GameEvents.TIDALWAVE_ACTIVATED, (x: number, y: number, radius: number) => {
            this.createTidalwave(x, y, radius);
        });

        // Final Flash
        EventBus.on(GameEvents.FINALFLASH_ACTIVATED, (canvasWidth: number, canvasHeight: number) => {
            this.createScreenFlash(canvasWidth, canvasHeight);
        });
    }

    createLightning(fromX: number, fromY: number, toX: number, toY: number): void {
        const effect = new LightningEffect(fromX, fromY, toX, toY);
        this.addEffect(effect);
    }

    createExplosion(x: number, y: number, radius: number): void {
        const effect = new ExplosionEffect(x, y, radius);
        this.addEffect(effect);
    }

    createBlackhole(x: number, y: number, radius: number, duration: number): void {
        const effect = new BlackholeEffect(x, y, radius, duration);
        this.addEffect(effect);
    }

    createTidalwave(x: number, y: number, radius: number): void {
        const effect = new TidalwaveEffect(x, y, radius);
        this.addEffect(effect);
    }

    createScreenFlash(canvasWidth: number, canvasHeight: number): void {
        const effect = new ScreenFlashEffect(canvasWidth, canvasHeight);
        this.addEffect(effect);
    }

    createSootStain(x: number, y: number, radius: number, duration: number): void {
        const effect = new SootStainEffect(x, y, radius, duration);
        this.addEffect(effect);
    }

    private addEffect(effect: TemporaryEffect): void {
        this.effects.push(effect);
        const unregister = this.renderer.register(effect);
        this.unregisterFunctions.set(effect, unregister);
    }

    /**
     * Update all effects (call every frame)
     */
    update(deltaTime: number): void {
        // Update and remove completed effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update(deltaTime);

            if (effect.getIsComplete()) {
                // Unregister from renderer
                const unregister = this.unregisterFunctions.get(effect);
                if (unregister) {
                    unregister();
                    this.unregisterFunctions.delete(effect);
                }
                // Remove from array
                this.effects.splice(i, 1);
            }
        }
    }

    /**
     * Clear all effects
     */
    clear(): void {
        this.effects.forEach(effect => {
            const unregister = this.unregisterFunctions.get(effect);
            if (unregister) unregister();
        });
        this.effects = [];
        this.unregisterFunctions.clear();
    }
}
