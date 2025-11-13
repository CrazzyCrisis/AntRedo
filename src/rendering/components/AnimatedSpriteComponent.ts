import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * AnimatedSpriteComponent - Renders a sprite with vertical hover animation
 * Used for animated UI elements like floating titles
 */
export class AnimatedSpriteComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0;
    public x: number;
    public y: number;
    public sprite: any;
    public animationSpeed: number = 0.05;
    public amplitude: number = 5;
    
    private animationTime: number = 0;

    constructor(sprite: any, x: number, y: number) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
    }

    /**
     * Update animation state (call once per frame)
     */
    update(): void {
        this.animationTime += this.animationSpeed;
    }

    /**
     * Get current vertical offset from animation
     */
    getAnimationOffset(): number {
        return Math.sin(this.animationTime) * this.amplitude;
    }

    /**
     * Set animation speed (radians per frame)
     */
    setAnimationSpeed(speed: number): void {
        this.animationSpeed = speed;
    }

    /**
     * Set animation amplitude (vertical movement range)
     */
    setAmplitude(amplitude: number): void {
        this.amplitude = amplitude;
    }

    /**
     * Set position
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Render sprite with animation offset
     */
    render(graphics: any): void {
        const offset = this.getAnimationOffset();
        const renderY = this.y + offset;
        
        graphics.image(
            this.sprite,
            this.x - this.sprite.width / 2,
            renderY - this.sprite.height / 2
        );
    }
}
