import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * ButtonComponent - Interactive button with hover pulse animation
 * Handles mouse detection and click callbacks
 */
export class ButtonComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0;
    public x: number;
    public y: number;
    public sprite: any;
    public id: string;
    public isHovered: boolean = false;
    public pulseSpeed: number = 0.1;
    
    private pulseTime: number = 0;
    private clickCallback?: () => void;

    constructor(sprite: any, x: number, y: number, id: string) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.id = id;
    }

    /**
     * Check if mouse is over button
     */
    isMouseOver(mouseX: number, mouseY: number): boolean {
        const halfWidth = this.sprite.width / 2;
        const halfHeight = this.sprite.height / 2;
        
        return (
            mouseX >= this.x - halfWidth &&
            mouseX <= this.x + halfWidth &&
            mouseY >= this.y - halfHeight &&
            mouseY <= this.y + halfHeight
        );
    }

    /**
     * Set hover state
     */
    setHovered(hovered: boolean): void {
        this.isHovered = hovered;
        if (!hovered) {
            this.pulseTime = 0; // Reset pulse when not hovered
        }
    }

    /**
     * Update pulse animation (call once per frame)
     */
    update(): void {
        if (this.isHovered) {
            this.pulseTime += this.pulseSpeed;
        } else {
            this.pulseTime = 0;
        }
    }

    /**
     * Get current pulse scale factor
     */
    getPulseScale(): number {
        if (!this.isHovered) {
            return 1.0;
        }
        return 1.0 + Math.sin(this.pulseTime) * 0.05; // 5% pulse
    }

    /**
     * Set pulse speed (radians per frame)
     */
    setPulseSpeed(speed: number): void {
        this.pulseSpeed = speed;
    }

    /**
     * Set click callback
     */
    onClick(callback: () => void): void {
        this.clickCallback = callback;
    }

    /**
     * Handle click at position
     */
    handleClick(mouseX: number, mouseY: number): void {
        if (this.isMouseOver(mouseX, mouseY) && this.clickCallback) {
            this.clickCallback();
        }
    }

    /**
     * Set position
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Render button with pulse scale
     */
    render(graphics: any): void {
        const scale = this.getPulseScale();
        
        graphics.push();
        graphics.translate(this.x, this.y);
        graphics.scale(scale, scale);
        graphics.image(
            this.sprite,
            -this.sprite.width / 2,
            -this.sprite.height / 2
        );
        graphics.pop();
    }
}
