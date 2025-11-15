import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

// p5.js constants and functions
declare const CENTER: any;
declare const LEFT: any;
declare const RIGHT: any;

/**
 * TextRenderable - Simple text display component
 * Renders text at a specific position with configurable style
 */
export class TextRenderable implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0;
    public x: number;
    public y: number;
    public sprite: any = null; // Not used for text
    public id: string;
    
    private text: string;
    private textSize: number;
    private color: number;
    private align: any = CENTER;

    constructor(text: string, x: number, y: number, textSize: number = 16, color: number = 255, id: string) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.textSize = textSize;
        this.color = color;
        this.id = id;
    }

    /**
     * Set text content
     */
    setText(text: string): void {
        this.text = text;
    }

    /**
     * Set text alignment (CENTER, LEFT, RIGHT)
     */
    setAlign(align: any): void {
        this.align = align;
    }

    /**
     * Set text color
     */
    setColor(color: number): void {
        this.color = color;
    }

    /**
     * Render text
     */
    render(graphics: any): void {
        graphics.push();
        
        // Enable smooth rendering for better text quality
        graphics.smooth();
        graphics.strokeJoin(graphics.ROUND);
        graphics.fill(this.color);
        graphics.strokeWeight(2);
        graphics.stroke("black");
        graphics.textAlign(this.align, CENTER);
        graphics.textSize(this.textSize);
        graphics.textStyle(graphics.NORMAL);
        
        // Use default font for consistency
        graphics.textFont('Arial');
        
        graphics.text(this.text, this.x, this.y);
        graphics.pop();
    }
}
