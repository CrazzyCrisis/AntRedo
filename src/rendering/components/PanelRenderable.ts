import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { drawUIPanel } from '../../utils/helpers';

// p5.js constants
declare const CORNER: any;

/**
 * PanelRenderable - Advanced panel component with texture support
 * Supports solid colors, tiled textures, and border textures
 * 
 * Usage:
 * - Solid color: Pass backgroundColor string
 * - Tiled texture: Call setBackgroundTexture(image)
 * - Border texture: Call setBorderTexture(image, borderWidth)
 */
export class PanelRenderable implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = -100; // Draw behind other UI elements
    public x: number;
    public y: number;
    public sprite: any = null; // Not used for panels
    public id: string;
    
    private width: number;
    private height: number;
    private backgroundColor: string;
    private alpha: number;
    private cornerRadius: number;
    
    // Texture support
    private backgroundTexture: any = null;
    private borderTexture: any = null;
    private borderWidth: number = 0;
    private textureScale: number = 1.0; // Scale for tiled textures

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        id: string,
        backgroundColor: string = '#2C2C2C',
        alpha: number = 200,
        cornerRadius: number = 8
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.id = id;
        this.backgroundColor = backgroundColor;
        this.alpha = alpha;
        this.cornerRadius = cornerRadius;
    }

    /**
     * Update panel size
     */
    setSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    /**
     * Update panel position
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Set background color
     */
    setBackgroundColor(color: string): void {
        this.backgroundColor = color;
    }

    /**
     * Set alpha (transparency)
     */
    setAlpha(alpha: number): void {
        this.alpha = alpha;
    }

    /**
     * Set background texture for tiled rendering
     * @param texture - p5.Image to tile across the panel
     * @param scale - Scale factor for the texture (default 1.0)
     */
    setBackgroundTexture(texture: any, scale: number = 1.0): void {
        this.backgroundTexture = texture;
        this.textureScale = scale;
    }

    /**
     * Clear background texture (return to solid color)
     */
    clearBackgroundTexture(): void {
        this.backgroundTexture = null;
    }

    /**
     * Set border texture
     * @param texture - p5.Image for the border
     * @param borderWidth - Width of the border in pixels
     */
    setBorderTexture(texture: any, borderWidth: number): void {
        this.borderTexture = texture;
        this.borderWidth = borderWidth;
    }

    /**
     * Clear border texture
     */
    clearBorderTexture(): void {
        this.borderTexture = null;
        this.borderWidth = 0;
    }

    /**
     * Render panel with textures or solid color
     */
    render(graphics: any): void {
        graphics.push();

        // Draw background (solid color or tiled texture)
        if (this.backgroundTexture) {
            this.renderTiledBackground(graphics);
        } else {
            // Use drawUIPanel helper for solid color
            drawUIPanel(
                graphics,
                this.x,
                this.y,
                this.width,
                this.height,
                this.backgroundColor,
                this.alpha,
                this.cornerRadius
            );
        }

        // Draw border texture if set
        if (this.borderTexture && this.borderWidth > 0) {
            this.renderBorder(graphics);
        }

        graphics.pop();
    }

    /**
     * Render tiled background texture
     */
    private renderTiledBackground(graphics: any): void {
        if (!this.backgroundTexture) return;

        // Create clipping mask for rounded corners
        graphics.push();
        graphics.noStroke();
        graphics.fill(255); // White fill for mask
        graphics.rect(this.x, this.y, this.width, this.height, this.cornerRadius);
        
        // Use blend mode to clip
        graphics.drawingContext.save();
        graphics.drawingContext.clip();

        // Tile the texture across the panel
        const texWidth = this.backgroundTexture.width * this.textureScale;
        const texHeight = this.backgroundTexture.height * this.textureScale;

        graphics.tint(255, this.alpha); // Apply alpha to texture

        for (let x = this.x; x < this.x + this.width; x += texWidth) {
            for (let y = this.y; y < this.y + this.height; y += texHeight) {
                graphics.image(
                    this.backgroundTexture,
                    x,
                    y,
                    texWidth,
                    texHeight
                );
            }
        }

        graphics.drawingContext.restore();
        graphics.pop();
    }

    /**
     * Render border texture around the panel
     * Uses 9-slice scaling for corners and edges
     */
    private renderBorder(graphics: any): void {
        if (!this.borderTexture || this.borderWidth <= 0) return;

        graphics.push();
        graphics.tint(255, this.alpha);

        const bw = this.borderWidth;
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        // Top edge
        for (let i = x + bw; i < x + w - bw; i += this.borderTexture.width) {
            graphics.image(this.borderTexture, i, y - bw, this.borderTexture.width, bw);
        }

        // Bottom edge
        for (let i = x + bw; i < x + w - bw; i += this.borderTexture.width) {
            graphics.image(this.borderTexture, i, y + h, this.borderTexture.width, bw);
        }

        // Left edge
        for (let i = y + bw; i < y + h - bw; i += this.borderTexture.height) {
            graphics.image(this.borderTexture, x - bw, i, bw, this.borderTexture.height);
        }

        // Right edge
        for (let i = y + bw; i < y + h - bw; i += this.borderTexture.height) {
            graphics.image(this.borderTexture, x + w, i, bw, this.borderTexture.height);
        }

        // Corners (you can enhance this with corner-specific textures)
        graphics.image(this.borderTexture, x - bw, y - bw, bw, bw); // Top-left
        graphics.image(this.borderTexture, x + w, y - bw, bw, bw); // Top-right
        graphics.image(this.borderTexture, x - bw, y + h, bw, bw); // Bottom-left
        graphics.image(this.borderTexture, x + w, y + h, bw, bw); // Bottom-right

        graphics.pop();
    }
}
