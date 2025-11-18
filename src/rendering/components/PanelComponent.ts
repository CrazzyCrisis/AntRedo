import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * Simple panel component for background bars/panels
 * Renders a rectangular panel with configurable color and transparency
 */
export class PanelComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0; // Render behind other UI elements
    
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private color: string;
    private alpha: number;
    private cornerRadius: number;
    
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        color: string = '#808080',
        alpha: number = 100,
        cornerRadius: number = 0
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.alpha = alpha;
        this.cornerRadius = cornerRadius;
    }
    
    /**
     * Set position
     */
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Set size
     */
    public setSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }
    
    /**
     * Set color
     */
    public setColor(color: string, alpha?: number): void {
        this.color = color;
        if (alpha !== undefined) {
            this.alpha = alpha;
        }
    }
    
    /**
     * Render the panel
     */
    render(graphics: any): void {
        graphics.push();
        graphics.noStroke();
        
        // Parse hex color to RGB
        const hex = this.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        graphics.fill(r, g, b, this.alpha);
        
        if (this.cornerRadius > 0) {
            graphics.rect(this.x, this.y, this.width, this.height, this.cornerRadius);
        } else {
            graphics.rect(this.x, this.y, this.width, this.height);
        }
        
        graphics.pop();
    }
    
    /**
     * Cleanup
     */
    public destroy(): void {
        // Nothing to clean up
    }
}
