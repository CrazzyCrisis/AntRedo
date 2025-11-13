import { RenderLayer } from './RenderLayer';

/**
 * Configuration for each render layer defining behavior.
 */
export interface LayerConfig {
    /** Whether to clear this framebuffer every frame */
    clearEveryFrame: boolean;
    
    /** Whether to sort renderables by depth on this layer */
    depthSort: boolean;
}

/**
 * Layer configurations for all 7 render layers.
 * Static layers (BACKGROUND, GROUND, GROUND_DECORATIONS) are not cleared every frame.
 * Dynamic layers (ENTITIES, ABOVE_ENTITIES, UI, DEBUG) are cleared every frame.
 * Only ENTITIES and ABOVE_ENTITIES layers use depth sorting.
 */
export const LAYER_CONFIGS: Record<RenderLayer, LayerConfig> = {
    [RenderLayer.BACKGROUND]: {
        clearEveryFrame: false,
        depthSort: false
    },
    [RenderLayer.GROUND]: {
        clearEveryFrame: false,
        depthSort: false
    },
    [RenderLayer.GROUND_DECORATIONS]: {
        clearEveryFrame: false,
        depthSort: false
    },
    [RenderLayer.ENTITIES]: {
        clearEveryFrame: true,
        depthSort: true
    },
    [RenderLayer.ABOVE_ENTITIES]: {
        clearEveryFrame: true,
        depthSort: true
    },
    [RenderLayer.UI]: {
        clearEveryFrame: true,
        depthSort: false
    },
    [RenderLayer.DEBUG]: {
        clearEveryFrame: true,
        depthSort: false
    }
};
