import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * Represents a single part of a multi-part renderable
 */
export interface SpritePart {
    sprite: any; // p5.Image or p5.Graphics
    offsetX: number;
    offsetY: number;
    width?: number;
    height?: number;
}

/**
 * MultiPartComponent renders multiple sprites as a single entity.
 * Useful for complex objects like trees (trunk + canopy), characters (body + equipment), etc.
 * All parts render at the same depth, in order they were added.
 */
export class MultiPartComponent implements Renderable {
    public layer: RenderLayer;
    public depth: number;
    
    private parts: SpritePart[];
    private x: number;
    private y: number;

    constructor(
        x: number,
        y: number,
        layer: RenderLayer,
        depth: number,
        parts: SpritePart[] = []
    ) {
        this.x = x;
        this.y = y;
        this.layer = layer;
        this.depth = depth;
        this.parts = [...parts];
    }

    /**
     * Add a sprite part to this component
     */
    addPart(part: SpritePart): void {
        this.parts.push(part);
    }

    /**
     * Remove a sprite part by index
     */
    removePart(index: number): void {
        if (index >= 0 && index < this.parts.length) {
            this.parts.splice(index, 1);
        }
    }

    /**
     * Update position of entire multi-part entity
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Update depth for sorting
     */
    setDepth(depth: number): void {
        this.depth = depth;
    }

    /**
     * Get number of parts
     */
    getPartCount(): number {
        return this.parts.length;
    }

    /**
     * Render all parts to graphics context
     */
    render(graphics: any): void {
        this.parts.forEach(part => {
            if (!part.sprite) return;
            
            const width = part.width || part.sprite.width;
            const height = part.height || part.sprite.height;
            
            graphics.image(
                part.sprite,
                this.x + part.offsetX,
                this.y + part.offsetY,
                width,
                height
            );
        });
    }
}
