import {
    Renderer,
    RenderLayer,
    SpriteComponent,
    setupEntitySpriteBinding,
    TILE_SIZE
} from '../imports/factoryImports';
import { Ant } from '../classes/Ant';
import { AntJobComponent } from '../classes/components/AntJobComponent';

/**
 * AntFactory creates Ant entities with automatic rendering setup.
 * Demonstrates Factory Pattern - hides rendering complexity from game code.
 * 
 * Pattern:
 * 1. Create Ant model (with all 9 components)
 * 2. Create SpriteComponent for rendering
 * 3. Register sprite with Renderer on ENTITIES layer
 * 4. Listen to ENTITY_MOVED events to update sprite position
 * 5. Listen to ENTITY_DESTROYED events to cleanup sprite
 * 6. Return Ant model only (rendering is invisible to caller)
 * 
 * Usage:
 *   const ant = AntFactory.create(renderer, sprite, 5, 10, 'player_faction');
 *   // Ant is fully set up with rendering - developer never touches rendering code!
 */
export class AntFactory {
    /**
     * Create an ant with automatic rendering registration
     * @param renderer - The game renderer
     * @param sprite - The ant sprite image
     * @param gridX - Initial grid X position
     * @param gridY - Initial grid Y position
     * @param factionId - Faction identifier for team
     * @param jobType - Initial job (default: GATHERER)
     * @returns Ant model (rendering is handled internally)
     */
    static create(
        renderer: Renderer,
        sprite: any,
        gridX: number,
        gridY: number,
        factionId: string,
        jobType: number = AntJobComponent.JOB_GATHERER
    ): Ant {
        // Create the ant model with all 9 components
        const ant = new Ant(gridX, gridY, factionId);

        // Set initial job if not default
        if (jobType !== AntJobComponent.JOB_GATHERER) {
            ant.setJob(jobType);
        }

        // Create sprite component with Y-position as depth for proper sorting
        const spriteComponent = new SpriteComponent(
            sprite,
            gridX,
            gridY,
            RenderLayer.ENTITIES,
            gridY, // Y-coordinate determines depth (ants behind trees)
            32, // width
            32, // height
            -16, // offsetX to center sprite
            -16  // offsetY to center sprite
        );

        // Setup automatic sprite binding with helper (handles registration, movement, destruction)
        // Grid coordinates → world coordinates (multiply by TILE_SIZE)
        setupEntitySpriteBinding(ant, spriteComponent, renderer, RenderLayer.ENTITIES, (coord) => coord * TILE_SIZE);

        return ant;
    }
}
