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
    public scale: number = 1.0;
    
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
        const halfWidth = (this.sprite.width * this.scale) / 2;
        const halfHeight = (this.sprite.height * this.scale) / 2;
        
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
     * Render button with scale and pulse effect
     */
    render(graphics: any): void {
        const pulseScale = this.getPulseScale();
        const totalScale = this.scale * pulseScale;
        
        graphics.push();
        
        // Check if sprite is a real p5.js image or mock object
        const isRealImage = this.sprite && typeof this.sprite === 'object' && 'width' in this.sprite && this.sprite.width !== undefined;
        
        if (isRealImage && this.sprite.pixels !== undefined) {
            // Real p5.js image - use image() function
            graphics.translate(this.x, this.y);
            graphics.scale(totalScale, totalScale);
            graphics.image(
                this.sprite,
                -this.sprite.width / 2,
                -this.sprite.height / 2
            );
        } else {
            // Mock sprite or no sprite - draw procedural button
            const width = this.sprite.width * totalScale;
            const height = this.sprite.height * totalScale;
            
            if (this.isHovered) {
                graphics.fill(150, 200, 255); // Hover color
                graphics.strokeWeight(3);
                graphics.stroke(255, 255, 150);
            } else {
                graphics.fill(200, 200, 200); // Normal color
                graphics.strokeWeight(2);
                graphics.stroke(100);
            }
            
            graphics.rect(
                this.x - width / 2,
                this.y - height / 2,
                width,
                height,
                height / 4 // Rounded corners
            );
            
            // Draw text label if id exists
            graphics.fill(0);
            graphics.noStroke();
            graphics.textAlign(graphics.CENTER, graphics.CENTER);
            graphics.textSize(height * 0.4);
            graphics.text(this.id || 'Button', this.x, this.y);
        }
        
        graphics.pop();
    }
}
