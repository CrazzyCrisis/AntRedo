import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { drawUIPanel } from '../../utils/helpers';

/**
 * QueenPortraitComponent - Displays decorative queen portrait in bottom left
 * Shows queen sprite in ornate frame, optional animated ant border
 */
export class QueenPortraitComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 900; // Below queen commands (850)
    
    private x: number;
    private y: number;
    private size: number = 128;
    
    private queenSprite: any | null = null;
    private frameSprite: any | null = null;
    
    // Animated border ant
    private animatedBorderEnabled: boolean = false;
    private borderAntSprite: any | null = null;
    private antAngle: number = 0; // Radians around border
    private antSpeed: number = 0.02; // Radians per frame
    private antOffset: number = 8; // Distance from frame edge
    
    // Panel styling
    private backgroundColor: string = '#2C2416';
    private backgroundAlpha: number = 0.85;
    private frameColor: string = '#8B7355';
    private frameWidth: number = 4;
    
    constructor(x: number, y: number, queenSprite?: any, frameSprite?: any) {
        this.x = x;
        this.y = y;
        
        if (queenSprite) {
            this.queenSprite = queenSprite;
        }
        
        if (frameSprite) {
            this.frameSprite = frameSprite;
        }
    }
    
    /**
     * Set queen sprite
     */
    public setQueenSprite(sprite: any): void {
        this.queenSprite = sprite;
    }
    
    /**
     * Set decorative frame sprite
     */
    public setFrameSprite(sprite: any): void {
        this.frameSprite = sprite;
    }
    
    /**
     * Enable/disable animated ant running around border
     */
    public setAnimatedBorder(enabled: boolean, antSprite?: any): void {
        this.animatedBorderEnabled = enabled;
        if (antSprite) {
            this.borderAntSprite = antSprite;
        }
    }
    
    /**
     * Set position
     */
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Update animation state
     */
    public update(): void {
        if (this.animatedBorderEnabled) {
            // Rotate ant around border (counterclockwise)
            this.antAngle += this.antSpeed;
            if (this.antAngle > Math.PI * 2) {
                this.antAngle -= Math.PI * 2;
            }
        }
    }
    
    /**
     * Render queen portrait
     */
    render(graphics: any): void {
        graphics.push();
        
        // Draw background panel
        const padding = 12;
        const panelSize = this.size + (padding * 2);
        const panelX = this.x - panelSize / 2;
        const panelY = this.y - panelSize / 2;
        
        drawUIPanel(graphics, panelX, panelY, panelSize, panelSize, this.backgroundColor, this.backgroundAlpha, 8);
        
        // Draw ornate frame border
        graphics.noFill();
        graphics.stroke(this.frameColor);
        graphics.strokeWeight(this.frameWidth);
        graphics.rect(
            this.x - (this.size / 2) - 2,
            this.y - (this.size / 2) - 2,
            this.size + 4,
            this.size + 4,
            4
        );
        
        // Draw inner golden accent line
        graphics.stroke('#D4AF37');
        graphics.strokeWeight(1);
        graphics.rect(
            this.x - (this.size / 2),
            this.y - (this.size / 2),
            this.size,
            this.size,
            2
        );
        
        // Draw queen sprite (if available)
        if (this.queenSprite) {
            graphics.imageMode('center' as any);
            graphics.noSmooth(); // Disable smoothing for crisp pixel art
            graphics.image(this.queenSprite, this.x, this.y, this.size, this.size);
        } else {
            // Placeholder: Draw queen emoji if no sprite
            graphics.fill(255, 215, 0); // Gold
            graphics.textAlign('center' as any, 'center' as any);
            graphics.textSize(64);
            graphics.text('👑', this.x, this.y);
        }
        
        // Draw decorative frame overlay (if available)
        if (this.frameSprite) {
            graphics.imageMode('center' as any);
            graphics.image(this.frameSprite, this.x, this.y, panelSize, panelSize);
        }
        
        // Draw animated border ant (if enabled)
        if (this.animatedBorderEnabled && this.borderAntSprite) {
            const radius = (this.size / 2) + this.antOffset + padding;
            const antX = this.x + Math.cos(this.antAngle) * radius;
            const antY = this.y + Math.sin(this.antAngle) * radius;
            
            graphics.push();
            graphics.translate(antX, antY);
            
            // Rotate ant to face direction of movement (tangent to circle)
            const tangentAngle = this.antAngle + Math.PI / 2;
            graphics.rotate(tangentAngle);
            
            graphics.imageMode('center' as any);
            graphics.image(this.borderAntSprite, 0, 0, 24, 24);
            graphics.pop();
        }
        
        graphics.pop();
    }
}
