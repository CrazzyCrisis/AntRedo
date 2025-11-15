import { RenderLayer } from './RenderLayer';
import { Renderable } from './Renderable';
import { FramebufferManager } from './FramebufferManager';
import { LAYER_CONFIGS } from './LayerConfig';

/**
 * Renderer manages all renderables, organizes them by layer, and handles
 * drawing to framebuffers with depth sorting and dirty flag optimization.
 */
export class Renderer {
    private framebufferManager: FramebufferManager;
    private renderables: Map<RenderLayer, Renderable[]>;
    private p5Instance: any;
    private camera: any | null = null;

    constructor(p5Instance: any, width: number, height: number) {
        this.p5Instance = p5Instance;
        this.framebufferManager = new FramebufferManager(p5Instance, width, height);
        this.renderables = new Map();

        // Initialize empty arrays for each layer
        Object.values(RenderLayer).forEach(layer => {
            if (typeof layer === 'number') {
                this.renderables.set(layer, []);
            }
        });
    }

    /**
     * Update renderer dimensions (for window resize)
     */
    updateDimensions(width: number, height: number): void {
        this.framebufferManager.updateDimensions(width, height);
        this.markAllLayersDirty();
    }

    /**
     * Register a renderable on its designated layer.
     * Returns an unregister function.
     */
    register(renderable: Renderable): () => void {
        const layer = renderable.layer;
        const layerArray = this.renderables.get(layer);
        
        if (layerArray) {
            layerArray.push(renderable);
            this.markLayerDirty(layer);
        }

        // Return unregister function
        return () => {
            this.unregister(renderable);
        };
    }

    /**
     * Unregister a renderable from its layer
     */
    private unregister(renderable: Renderable): void {
        const layer = renderable.layer;
        const layerArray = this.renderables.get(layer);
        
        if (layerArray) {
            const index = layerArray.indexOf(renderable);
            if (index > -1) {
                layerArray.splice(index, 1);
                this.markLayerDirty(layer);
            }
        }
    }

    /**
     * Mark a specific layer as dirty (needs redraw)
     */
    markLayerDirty(layer: RenderLayer): void {
        this.framebufferManager.markDirty(layer);
    }

    /**
     * Mark all layers as dirty
     */
    markAllLayersDirty(): void {
        this.framebufferManager.markAllDirty();
    }

    /**
     * Set the camera for rendering transformations
     */
    setCamera(camera: any | null): void {
        this.camera = camera;
    }

    /**
     * Render all layers in order
     */
    render(): void {
        // Render each layer in order
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
            this.renderLayer(layer);
        });

        // Composite all layers to main canvas
        this.compositeLayers();
    }

    /**
     * Render a specific layer
     */
    private renderLayer(layer: RenderLayer): void {
        // Skip if layer is not dirty
        if (!this.framebufferManager.isDirty(layer)) {
            return;
        }

        const fb = this.framebufferManager.getFramebuffer(layer);
        const layerConfig = LAYER_CONFIGS[layer];
        const renderables = this.renderables.get(layer) || [];

        // Clear framebuffer when layer is dirty (being re-rendered)
        // This is essential when camera moves - even static layers need clearing
        // to prevent duplication with new camera transform
        this.framebufferManager.clearFramebuffer(layer);

        // Disable smoothing for pixel art layers (crisp rendering)
        // Sort renderables if layer uses depth sorting
        let sortedRenderables = renderables;
        if (layerConfig.depthSort) {
            sortedRenderables = [...renderables].sort((a, b) => a.depth - b.depth);
        }

        // Apply camera transform if camera exists (but NOT for UI/DEBUG layers)
        const applyCameraTransform = this.camera && layer !== RenderLayer.UI && layer !== RenderLayer.DEBUG;
        if (applyCameraTransform) {
            fb.push();
            this.camera.applyTransform(fb);
        }

        // Render all renderables on this layer
        sortedRenderables.forEach(renderable => {
            renderable.render(fb);
        });

        if (applyCameraTransform) {
            fb.pop();
        }

        // Clear dirty flag after rendering
        this.framebufferManager.clearDirtyFlag(layer);
    }

    /**
     * Composite all layer framebuffers to the main canvas
     */
    private compositeLayers(): void {
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
            const fb = this.framebufferManager.getFramebuffer(layer);
            this.p5Instance.image(fb, 0, 0);
        });
    }
}
