/**
 * DecorationFactory - Creates Decoration entities with rendering (MVC Pattern)
 * 
 * Factory Pattern: Hides rendering complexity from game code
 * - Creates Decoration model (data)
 * - Creates SpriteComponent view (rendering)
 * - Binds them together with automatic cleanup
 * 
 * Usage:
 * const decoration = DecorationFactory.create(renderer, sprite, gridX, gridY, 'flower');
 */

import { Renderer, RenderLayer, SpriteComponent, setupEntitySpriteBinding } from '../imports/factoryImports';
import { Decoration } from '../classes/Decoration';

export class DecorationFactory {
    /**
     * Create a new Decoration with rendering
     * @param renderer - Renderer instance to register sprite with
     * @param sprite - p5.Image sprite to display
     * @param gridX - Grid column position
     * @param gridY - Grid row position
     * @param decorationType - Type identifier (e.g., 'flower', 'stone')
     * @returns Decoration model instance
     */
    static create(
        renderer: Renderer,
        sprite: any,
        gridX: number,
        gridY: number,
        decorationType: string = 'generic'
    ): Decoration {
        // 1. Create MODEL (data/state)
        const decoration = new Decoration(decorationType, gridX, gridY);
        
        // 2. Create VIEW (rendering) - sprites on GROUND_DECORATIONS layer
        const spriteComponent = new SpriteComponent(
            sprite,
            decoration.worldX,
            decoration.worldY,
            RenderLayer.GROUND_DECORATIONS,
            0, // Static depth for ground decorations
            16, // width (decorations are typically 16x16)
            16, // height
            -8, // offsetX to center sprite
            -8  // offsetY to center sprite
        );
        
        // 3. Bind model to view with automatic cleanup (helper eliminates 15 lines of boilerplate)
        setupEntitySpriteBinding(
            decoration,
            spriteComponent,
            renderer,
            RenderLayer.GROUND_DECORATIONS
        );
        
        // Return model to calling code (view is abstracted away)
        return decoration;
    }
}
