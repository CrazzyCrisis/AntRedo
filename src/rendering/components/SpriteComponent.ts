import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';

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
    private combatOffsetX: number = 0; // Combat animation offset (in tiles)
    private combatOffsetY: number = 0; // Combat animation offset (in tiles)
    private entityId: string | null = null; // For combat animation tracking
    private tintColor: { r: number; g: number; b: number; a?: number } | null = null;
    public scale: number = 1;
    public rotation: number = 0; // Radians
    private unsubscribeOffset: (() => void) | null = null; // Cleanup function

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
        
        // Handle null sprites gracefully
        if (sprite) {
            this.width = width || sprite.width;
            this.height = height || sprite.height;
        } else {
            this.width = width || 16; // Default tile size
            this.height = height || 16;
        }
        
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
        if (sprite) {
            this.width = sprite.width;
            this.height = sprite.height;
        }
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
     * Set entity ID for combat animation tracking
     */
    setEntityId(entityId: string): void {
        this.entityId = entityId;
        
        // Subscribe to sprite offset changes for combat animations
        this.unsubscribeOffset = EventBus.on(GameEvents.SPRITE_OFFSET_CHANGED, 
            (id: string, offsetX: number, offsetY: number) => {
                if (id === this.entityId) {
                    this.combatOffsetX = offsetX;
                    this.combatOffsetY = offsetY;
                }
            }
        );
    }

    /**
     * Cleanup event listeners
     */
    destroy(): void {
        if (this.unsubscribeOffset) {
            this.unsubscribeOffset();
            this.unsubscribeOffset = null;
        }
    }

    /**
     * Render sprite to graphics context
     */
    render(graphics: any): void {
        // Set image mode to CENTER so sprites are drawn from their center
        graphics.imageMode((window as any).CENTER);
        
        // If no sprite, render bright magenta placeholder
        if (!this.sprite) {
            console.warn(`⚠️ NULL sprite at (${this.x}, ${this.y}) layer=${this.layer} depth=${this.depth}`);
            graphics.fill(255, 0, 255); // Magenta
            graphics.stroke(255, 255, 0); // Yellow border
            graphics.strokeWeight(2);
            graphics.rect(
                this.x + this.offsetX,
                this.y + this.offsetY,
                this.width * this.scale,
                this.height * this.scale
            );
            
            // Draw X through it
            graphics.stroke(0);
            graphics.strokeWeight(1);
            graphics.line(
                this.x + this.offsetX,
                this.y + this.offsetY,
                this.x + this.offsetX + this.width * this.scale,
                this.y + this.offsetY + this.height * this.scale
            );
            graphics.line(
                this.x + this.offsetX + this.width * this.scale,
                this.y + this.offsetY,
                this.x + this.offsetX,
                this.y + this.offsetY + this.height * this.scale
            );
            return;
        }
        
        // Debug: Validate sprite before using
        if (!this.sprite.width || !this.sprite.height) {
            console.error(`❌ INVALID sprite at (${this.x}, ${this.y}):`, this.sprite);
            console.error('  Keys:', Object.keys(this.sprite || {}));
            console.error('  Type:', typeof this.sprite);
            return;
        }
        
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
        
        // Calculate final position with combat animation offset (tile-based offset * 16px)
        const TILE_SIZE = 16;
        const finalOffsetX = this.offsetX + (this.combatOffsetX * TILE_SIZE);
        const finalOffsetY = this.offsetY + (this.combatOffsetY * TILE_SIZE);
        
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
                this.x + finalOffsetX,
                this.y + finalOffsetY,
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
