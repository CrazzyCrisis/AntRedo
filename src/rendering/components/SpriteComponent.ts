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
     * Render sprite to graphics context
     */
    render(graphics: any): void {
        if (!this.sprite) return;
        
        graphics.image(
            this.sprite,
            this.x + this.offsetX,
            this.y + this.offsetY,
            this.width,
            this.height
        );
    }
}
