/**
 * OutlineRenderer - Applies outline effect to sprites using WebGL shader
 * 
 * Usage:
 * const outlineRenderer = new OutlineRenderer(p5Instance);
 * const outlined = outlineRenderer.applyOutline(sprite, outlineColor, thickness);
 * image(outlined, x, y);
 */

import { OUTLINE_VERTEX_SHADER, OUTLINE_FRAGMENT_SHADER } from './shaders/outlineShader';

export class OutlineRenderer {
    private p5Instance: any;
    private shader: any;
    private graphics: any; // WebGL graphics buffer
    private cache: Map<string, any> = new Map(); // Cache outlined sprites

    constructor(p5Instance: any) {
        this.p5Instance = p5Instance;
        
        // Create WebGL graphics buffer (same size as canvas)
        this.graphics = p5Instance.createGraphics(
            p5Instance.width,
            p5Instance.height,
            p5Instance.WEBGL
        );
        
        // Create shader
        this.shader = this.graphics.createShader(
            OUTLINE_VERTEX_SHADER,
            OUTLINE_FRAGMENT_SHADER
        );
    }

    /**
     * Apply outline effect to a sprite
     * @param sprite - p5.Image to outline
     * @param color - Outline color {r, g, b} (0-255)
     * @param thickness - Outline thickness in pixels (default: 2)
     * @returns Graphics buffer with outlined sprite
     */
    applyOutline(
        sprite: any,
        color: { r: number; g: number; b: number },
        thickness: number = 2
    ): any {
        if (!sprite || !sprite.width || !sprite.height) {
            return sprite;
        }

        // Generate cache key
        const cacheKey = `${sprite}_${color.r}_${color.g}_${color.b}_${thickness}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Create a dedicated graphics buffer for this sprite
        const buffer = this.p5Instance.createGraphics(
            sprite.width + thickness * 2,
            sprite.height + thickness * 2,
            this.p5Instance.WEBGL
        );

        // Apply shader
        buffer.shader(this.shader);
        
        // Set uniforms
        this.shader.setUniform('uTexture', sprite);
        this.shader.setUniform('uTexelSize', [
            1.0 / sprite.width,
            1.0 / sprite.height
        ]);
        this.shader.setUniform('uOutlineColor', [
            color.r / 255,
            color.g / 255,
            color.b / 255
        ]);
        this.shader.setUniform('uOutlineWidth', thickness);

        // Draw a rectangle that covers the entire buffer
        buffer.noStroke();
        buffer.fill(255);
        buffer.rectMode(this.p5Instance.CENTER);
        buffer.rect(0, 0, sprite.width, sprite.height);

        // Cache result
        this.cache.set(cacheKey, buffer);

        return buffer;
    }

    /**
     * Update buffer size when canvas resizes
     */
    updateSize(width: number, height: number): void {
        this.graphics = this.p5Instance.createGraphics(
            width,
            height,
            this.p5Instance.WEBGL
        );
        
        // Recreate shader in new graphics context
        this.shader = this.graphics.createShader(
            OUTLINE_VERTEX_SHADER,
            OUTLINE_FRAGMENT_SHADER
        );
        
        // Clear cache
        this.cache.clear();
    }

    /**
     * Clear cache (useful when sprites change)
     */
    clearCache(): void {
        this.cache.clear();
    }
}
