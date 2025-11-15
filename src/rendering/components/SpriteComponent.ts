import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * SpriteComponent renders a single sprite at a position.
 * Implements Renderable interface for use with Renderer.
 */
export class SpriteComponent implements Renderable {
    public layer: RenderLayer;
    public depth: number;
    
    private sprite: any; // p5.Image or p5.Graphics
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private offsetX: number;
    private offsetY: number;
    private tintColor: { r: number; g: number; b: number; a?: number } | null = null;
    public scale: number = 1;
    public rotation: number = 0; // Radians

    constructor(
        sprite: any,
        x: number,
        y: number,
        layer: RenderLayer,
        depth: number,
        width?: number,
        height?: number,
        offsetX: number = 0,
        offsetY: number = 0
    ) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.layer = layer;
        this.depth = depth;
        this.width = width || sprite.width;
        this.height = height || sprite.height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    /**
     * Update sprite position
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Update sprite image
     */
    setSprite(sprite: any): void {
        this.sprite = sprite;
        this.width = sprite.width;
        this.height = sprite.height;
    }

    /**
     * Update depth for sorting
     */
    setDepth(depth: number): void {
        this.depth = depth;
    }

    /**
     * Set tint color for faction recoloring
     * @param color RGB color object {r, g, b} (0-255) or null to disable tint
     */
    setTint(color: { r: number; g: number; b: number; a?: number } | null): void {
        this.tintColor = color;
    }

    /**
     * Set scale (multiplier for width/height)
     */
    setScale(scale: number): void {
        this.scale = scale;
    }

    /**
     * Set rotation in radians
     */
    setRotation(rotation: number): void {
        this.rotation = rotation;
    }

    /**
     * Render sprite to graphics context
     */
    render(graphics: any): void {
        if (!this.sprite) return;
        
        // Save graphics state if transform needed
        if (this.rotation !== 0 || this.scale !== 1) {
            graphics.push();
            graphics.translate(this.x + this.offsetX + (this.width * this.scale) / 2, 
                             this.y + this.offsetY + (this.height * this.scale) / 2);
            if (this.rotation !== 0) graphics.rotate(this.rotation);
            if (this.scale !== 1) graphics.scale(this.scale);
        }
        
        // Apply tint if set (for faction recoloring)
        if (this.tintColor) {
            if (this.tintColor.a !== undefined) {
                graphics.tint(this.tintColor.r, this.tintColor.g, this.tintColor.b, this.tintColor.a);
            } else {
                graphics.tint(this.tintColor.r, this.tintColor.g, this.tintColor.b);
            }
        }
        
        // Draw sprite (centered if transformed, otherwise top-left)
        if (this.rotation !== 0 || this.scale !== 1) {
            graphics.image(
                this.sprite,
                -(this.width * this.scale) / 2,
                -(this.height * this.scale) / 2,
                this.width * this.scale,
                this.height * this.scale
            );
        } else {
            graphics.image(
                this.sprite,
                this.x + this.offsetX,
                this.y + this.offsetY,
                this.width,
                this.height
            );
        }
        
        // Reset tint after drawing
        if (this.tintColor) {
            graphics.noTint();
        }
        
        // Restore graphics state if transformed
        if (this.rotation !== 0 || this.scale !== 1) {
            graphics.pop();
        }
    }
}
