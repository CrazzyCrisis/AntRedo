import { RenderLayer } from './RenderLayer';

/**
 * Renderable interface must be implemented by all objects that can be rendered.
 * Used by the Renderer to manage and draw entities on different layers.
 */
export interface Renderable {
    /** The layer this renderable should be drawn on */
    layer: RenderLayer;
    
    /** Depth value for sorting within a layer (higher = drawn later/in front) */
    depth: number;
    
    /**
     * Render this object to the given graphics context
     * @param graphics - p5.Graphics framebuffer or main canvas
     */
    render(graphics: any): void;
}
