import { RenderLayer } from './RenderLayer';

/**
 * FramebufferManager handles creation and management of p5.Graphics framebuffers
 * for each render layer, along with dirty flags for optimization.
 */
export class FramebufferManager {
    private framebuffers: Map<RenderLayer, any>;
    private dirtyFlags: Map<RenderLayer, boolean>;
    private p5Instance: any;
    private width: number;
    private height: number;

    constructor(p5Instance: any, width: number, height: number) {
        this.p5Instance = p5Instance;
        this.width = width;
        this.height = height;
        this.framebuffers = new Map();
        this.dirtyFlags = new Map();

        this.initializeFramebuffers();
    }

    /**
     * Create framebuffers for all 7 layers
     */
    private initializeFramebuffers(): void {
        const layers = [
            RenderLayer.BACKGROUND,
            RenderLayer.GROUND,
            RenderLayer.GROUND_DECORATIONS,
            RenderLayer.ENTITIES,
            RenderLayer.ABOVE_ENTITIES,
            RenderLayer.UI,
            RenderLayer.DEBUG
        ];

        layers.forEach(layer => {
            const fb = this.p5Instance.createGraphics(this.width, this.height);
            this.framebuffers.set(layer, fb);
            this.dirtyFlags.set(layer, true); // All layers start dirty
        });
    }

    /**
     * Get framebuffer for a specific layer
     */
    getFramebuffer(layer: RenderLayer): any {
        return this.framebuffers.get(layer);
    }

    /**
     * Check if a layer is marked as dirty
     */
    isDirty(layer: RenderLayer): boolean {
        return this.dirtyFlags.get(layer) || false;
    }

    /**
     * Mark a specific layer as dirty (needs redraw)
     */
    markDirty(layer: RenderLayer): void {
        this.dirtyFlags.set(layer, true);
    }

    /**
     * Clear dirty flag for a specific layer
     */
    clearDirtyFlag(layer: RenderLayer): void {
        this.dirtyFlags.set(layer, false);
    }

    /**
     * Mark all layers as dirty
     */
    markAllDirty(): void {
        this.dirtyFlags.forEach((_, layer) => {
            this.dirtyFlags.set(layer, true);
        });
    }

    /**
     * Clear a specific framebuffer
     */
    clearFramebuffer(layer: RenderLayer): void {
        const fb = this.framebuffers.get(layer);
        if (fb) {
            fb.clear();
        }
    }

    /**
     * Clear all framebuffers
     */
    clearAllFramebuffers(): void {
        this.framebuffers.forEach(fb => {
            fb.clear();
        });
    }
}
