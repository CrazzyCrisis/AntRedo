import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { FLASH_EFFECT_CONFIG } from '../../config/visualEffects';

/**
 * FlashEffectComponent - Flash a sprite with a color (damage, heal, etc.)
 * Uses CPU-based pixel manipulation to apply flash effect only to opaque pixels, respecting transparency
 */
export class FlashEffectComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.VISUAL_EFFECTS;
    public depth: number = 1000;

    private sprite: any; // p5.Image - the sprite to flash
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private color: string;
    private duration: number;
    private intensity: number;
    private pulseCount: number;
    private startTime: number;
    private isFinished: boolean = false;
    private offsetX: number;
    private offsetY: number;
    private flashedSprite: any = null; // Pre-rendered flashed sprite cache

    constructor(
        sprite: any, // p5.Image to flash
        x: number,
        y: number,
        width: number,
        height: number,
        flashConfig: { color: string; duration: number; intensity: number; pulseCount: number },
        offsetX: number = 0,
        offsetY: number = 0
    ) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = flashConfig.color;
        this.duration = flashConfig.duration;
        this.intensity = flashConfig.intensity;
        this.pulseCount = flashConfig.pulseCount;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.startTime = Date.now();
        
        // Create a tinted version of the sprite (cache for performance)
        this.createFlashedSprite();
    }

    /**
     * Create a version of the sprite with flash color applied to opaque pixels
     * This is CPU-based pixel manipulation that works in 2D mode
     */
    private createFlashedSprite(): void {
        if (!this.sprite || typeof window === 'undefined') return;

        // Parse flash color
        const r = parseInt(this.color.slice(1, 3), 16);
        const g = parseInt(this.color.slice(3, 5), 16);
        const b = parseInt(this.color.slice(5, 7), 16);

        // Create a copy of the sprite
        const p5 = window as any;
        this.flashedSprite = p5.createImage(this.sprite.width, this.sprite.height);
        this.flashedSprite.copy(this.sprite, 0, 0, this.sprite.width, this.sprite.height, 0, 0, this.sprite.width, this.sprite.height);

        // Load pixels for manipulation
        this.flashedSprite.loadPixels();
        const pixels = this.flashedSprite.pixels;

        // Apply flash color to all opaque pixels (blend with original color)
        for (let i = 0; i < pixels.length; i += 4) {
            const alpha = pixels[i + 3];
            
            if (alpha > 0) {
                // Blend original color with flash color
                // Using additive blending for bright flash effect
                pixels[i] = Math.min(255, pixels[i] + r * 0.5);     // R
                pixels[i + 1] = Math.min(255, pixels[i + 1] + g * 0.5); // G
                pixels[i + 2] = Math.min(255, pixels[i + 2] + b * 0.5); // B
                // Alpha stays the same (preserve transparency)
            }
        }

        this.flashedSprite.updatePixels();
    }

    /**
     * Update flash effect
     * @returns true if effect is finished
     */
    update(): boolean {
        if (this.isFinished) return true;

        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.isFinished = true;
            return true;
        }

        return false;
    }

    render(graphics: any): void {
        if (this.isFinished || !this.sprite || !this.flashedSprite) return;

        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;

        // Calculate pulse effect (sine wave * pulseCount)
        const pulsePhase = progress * this.pulseCount * Math.PI * 2;
        const pulseIntensity = (Math.sin(pulsePhase) + 1) / 2; // 0 to 1

        // Fade out over time
        const fadeOut = 1 - progress;

        // Combined intensity (0 to 1 range)
        const finalIntensity = this.intensity * pulseIntensity * fadeOut;

        // Lerp between original and flashed sprite based on intensity
        // Draw original sprite first
        graphics.push();
        graphics.imageMode((window as any).CENTER);
        graphics.tint(255, 255 * (1 - finalIntensity));
        graphics.image(
            this.sprite,
            this.x + this.offsetX,
            this.y + this.offsetY,
            this.width,
            this.height
        );
        graphics.noTint();

        // Draw flashed sprite on top with alpha
        graphics.tint(255, 255 * finalIntensity);
        graphics.image(
            this.flashedSprite,
            this.x + this.offsetX,
            this.y + this.offsetY,
            this.width,
            this.height
        );
        graphics.noTint();
        graphics.pop();
    }

    /**
     * Update flash position (if entity moves)
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    isExpired(): boolean {
        return this.isFinished;
    }
    
    /**
     * Cleanup resources
     */
    destroy(): void {
        // Just null out reference - p5.js garbage collection will handle cleanup
        this.flashedSprite = null;
        this.sprite = null;
        this.isFinished = true;
    }
}

/**
 * Helper function to create flash effect on an entity
 * Note: Entity sprite must be registered with VisualEffectsManager first
 */
export function createFlashEffect(
    entityId: string,
    _renderer: any, // Kept for API compatibility but not used (VFX manager handles internally)
    x: number,
    y: number,
    width: number = 32,
    height: number = 32,
    flashType: keyof typeof FLASH_EFFECT_CONFIG = 'damage',
    offsetX: number = -16,
    offsetY: number = -16
): FlashEffectComponent | null {
    // Import VisualEffectsManager to get sprite
    const { VisualEffectsManager } = require('../../managers/VisualEffectsManager');
    const vfxManager = VisualEffectsManager.getInstance();
    
    // Use VFX manager to show flash (it has sprite registry)
    vfxManager.showFlash(entityId, x, y, flashType, width, height, offsetX, offsetY);
    
    return null; // VFX manager handles creation internally
}
