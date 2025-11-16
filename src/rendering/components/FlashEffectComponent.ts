import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { FLASH_EFFECT_CONFIG } from '../../config/visualEffectsConfig';

/**
 * FlashEffectComponent - Flash a sprite with a color (damage, heal, etc.)
 * Draws a colored overlay on top of the sprite that pulses and fades
 */
export class FlashEffectComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.VISUAL_EFFECTS;
    public depth: number = 1000;

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

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        flashConfig: { color: string; duration: number; intensity: number; pulseCount: number },
        offsetX: number = 0,
        offsetY: number = 0
    ) {
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
        if (this.isFinished) return;

        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;

        // Calculate pulse effect (sine wave * pulseCount)
        const pulsePhase = progress * this.pulseCount * Math.PI * 2;
        const pulseIntensity = (Math.sin(pulsePhase) + 1) / 2; // 0 to 1

        // Fade out over time
        const fadeOut = 1 - progress;

        // Combined alpha
        const alpha = 255 * this.intensity * pulseIntensity * fadeOut;

        // Parse hex color
        const r = parseInt(this.color.slice(1, 3), 16);
        const g = parseInt(this.color.slice(3, 5), 16);
        const b = parseInt(this.color.slice(5, 7), 16);

        // Draw colored rectangle over sprite
        graphics.push();
        graphics.noStroke();
        graphics.fill(r, g, b, alpha);
        graphics.rect(this.x + this.offsetX, this.y + this.offsetY, this.width, this.height);
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
}

/**
 * Helper function to create flash effect on an entity
 */
export function createFlashEffect(
    renderer: any,
    x: number,
    y: number,
    width: number = 32,
    height: number = 32,
    flashType: keyof typeof FLASH_EFFECT_CONFIG = 'damage',
    offsetX: number = -16,
    offsetY: number = -16
): FlashEffectComponent {
    const config = FLASH_EFFECT_CONFIG[flashType];
    const flash = new FlashEffectComponent(x, y, width, height, config, offsetX, offsetY);
    renderer.register(flash);
    return flash;
}
