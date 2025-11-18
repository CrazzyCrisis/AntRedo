import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { TILE_CONFIG } from '../../config/world/tileConfig';

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
    // DISABLED: Outline rendering
    // private outlineColor: { r: number; g: number; b: number } | null = null; // Outline color
    // private outlineThickness: number = 2; // Outline thickness in pixels
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
            this.width = width || TILE_CONFIG.SIZE; // Default tile size
            this.height = height || TILE_CONFIG.SIZE;
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
     * Get raw sprite image (for VFX manager)
     */
    getSprite(): any {
        return this.sprite;
    }

    /**
     * Update sprite image (preserves custom width/height if already set)
     */
    setSprite(sprite: any, resetDimensions: boolean = false): void {
        this.sprite = sprite;
        // Only reset dimensions if explicitly requested
        if (sprite && resetDimensions) {
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
     * Set outline effect - DISABLED
     * @param color RGB color object {r, g, b} (0-255) or null to disable outline
     * @param thickness Outline thickness in pixels (default: 2)
     */
    /* setOutline(color: { r: number; g: number; b: number } | null, thickness: number = 2): void {
        this.outlineColor = color;
        this.outlineThickness = thickness;
    } */

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
        
        // Subscribe to hover events for outline - DISABLED
        const hoverStartListener = EventBus.on('ENTITY_HOVER_START', (id: string) => {
            if (id === this.entityId) {
                // DISABLED: this.setOutline({ r: 255, g: 255, b: 0 }, 2); // Yellow outline on hover
            }
        });
        
        const hoverEndListener = EventBus.on('ENTITY_HOVER_END', (id: string) => {
            if (id === this.entityId) {
                // DISABLED: this.setOutline(null); // Remove outline
            }
        });
        
        // Store cleanup functions
        const originalUnsubscribe = this.unsubscribeOffset;
        this.unsubscribeOffset = () => {
            if (originalUnsubscribe) originalUnsubscribe();
            EventBus.off('ENTITY_HOVER_START', hoverStartListener);
            EventBus.off('ENTITY_HOVER_END', hoverEndListener);
        };
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
        // If no sprite, render bright magenta placeholder
        if (!this.sprite) {
            graphics.imageMode((window as any).CORNER);  // Reset to corner for placeholder rectangles
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
            // Translate to the position (no centering offset needed - we'll use CENTER mode)
            graphics.translate(this.x + this.offsetX, this.y + this.offsetY);
            if (this.rotation !== 0) graphics.rotate(this.rotation);
            if (this.scale !== 1) graphics.scale(this.scale);
            
            // Use CENTER mode so image is drawn centered at the translated position
            graphics.imageMode((window as any).CENTER);
        } else {
            // For non-transformed sprites, use CENTER mode
            graphics.imageMode((window as any).CENTER);
        }
        
        // Apply tint if set (for faction recoloring)
        if (this.tintColor) {
            if (this.tintColor.a !== undefined) {
                graphics.tint(this.tintColor.r, this.tintColor.g, this.tintColor.b, this.tintColor.a);
            } else {
                graphics.tint(this.tintColor.r, this.tintColor.g, this.tintColor.b);
            }
        }
        
        // Calculate final position with combat animation offset (tile-based offset * TILE_CONFIG.SIZE px)
        const finalOffsetX = this.combatOffsetX * TILE_CONFIG.SIZE;
        const finalOffsetY = this.combatOffsetY * TILE_CONFIG.SIZE;
        
        // Draw outline first if enabled
        // DISABLED: Outline rendering
        // if (this.outlineColor) {
        //     this.drawOutline(graphics, finalOffsetX, finalOffsetY);
        // }
        
        // Draw sprite (always centered at position due to CENTER imageMode)
        if (this.rotation !== 0 || this.scale !== 1) {
            // Transformed: draw at origin (0,0) since we already translated
            graphics.image(
                this.sprite,
                finalOffsetX,
                finalOffsetY,
                this.width,
                this.height
            );
        } else {
            // Non-transformed: draw at world position
            graphics.image(
                this.sprite,
                this.x + this.offsetX + finalOffsetX,
                this.y + this.offsetY + finalOffsetY,
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

    /**
     * Draw outline by sampling sprite pixels and detecting edges
     * CPU-based method - samples sprite pixels and draws outline manually
     * DISABLED - not currently in use
     */
    /* private drawOutline(graphics: any, finalOffsetX: number, finalOffsetY: number): void {
        if (!this.outlineColor || !this.sprite) return;

        // Sample sprite pixels to find edges
        this.sprite.loadPixels();
        const pixels = this.sprite.pixels;
        const w = this.sprite.width;
        const h = this.sprite.height;

        // Set outline color
        graphics.stroke(this.outlineColor.r, this.outlineColor.g, this.outlineColor.b);
        graphics.strokeWeight(this.outlineThickness);
        graphics.noFill();

        // Sample grid for outline detection (check every few pixels for performance)
        const step = 1; // Sample every pixel
        
        for (let y = 0; y < h; y += step) {
            for (let x = 0; x < w; x += step) {
                const idx = (y * w + x) * 4;
                const alpha = pixels[idx + 3];

                // If current pixel is opaque, check neighbors for transparent pixels
                if (alpha > 128) {
                    let hasTransparentNeighbor = false;

                    // Check 8 neighbors
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;

                            const nx = x + dx;
                            const ny = y + dy;

                            // Check bounds
                            if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
                                hasTransparentNeighbor = true;
                                break;
                            }

                            const nIdx = (ny * w + nx) * 4;
                            const nAlpha = pixels[nIdx + 3];

                            if (nAlpha <= 128) {
                                hasTransparentNeighbor = true;
                                break;
                            }
                        }
                        if (hasTransparentNeighbor) break;
                    }

                    // If edge pixel, draw outline point
                    if (hasTransparentNeighbor) {
                        // Convert sprite space to world space
                        const worldX = x - w / 2;
                        const worldY = y - h / 2;

                        if (this.rotation !== 0 || this.scale !== 1) {
                            // Transformed: draw at sprite-local coordinates
                            graphics.point(worldX + finalOffsetX, worldY + finalOffsetY);
                        } else {
                            // Non-transformed: draw at world position
                            graphics.point(
                                this.x + this.offsetX + worldX + finalOffsetX,
                                this.y + this.offsetY + worldY + finalOffsetY
                            );
                        }
                    }
                }
            }
        }
    } */
}
