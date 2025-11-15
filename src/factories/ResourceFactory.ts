/**
 * ResourceFactory - Resource Entity Factory (VIEW + MODEL)
 * Creates Resource entities with automatic rendering setup
 * Hides rendering complexity from game code
 */

import { Resource } from '../classes/Resource';
import { ResourceType } from '../config/entityConfig';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { SpriteComponent } from '../rendering/components/SpriteComponent';
import { EntityManager } from '../managers/EntityManager';
import { EventBus } from '../utils/eventBus';
import { setupEntitySpriteBinding } from '../utils/helpers';

/**
 * ResourceFactory creates Resource entities with automatic rendering and entity management.
 * 
 * Pattern:
 * 1. Create Resource model with type and amount
 * 2. Create SpriteComponent for rendering on GROUND_DECORATIONS layer
 * 3. Register sprite with Renderer
 * 4. Register with EntityManager for spatial queries
 * 5. Listen to RESOURCE_DEPLETED event to cleanup sprite
 * 6. Return Resource model only (rendering is invisible to caller)
 * 
 * Usage:
 *   const resource = ResourceFactory.create(renderer, foodSprite, 10, 10, 'food', 50);
 */
export class ResourceFactory {
    /**
     * Create a resource with automatic rendering registration
     * @param renderer - The game renderer
     * @param sprite - The resource sprite image
     * @param gridX - Grid X position
     * @param gridY - Grid Y position
     * @param resourceType - Type of resource (food, wood, stone, magicCrystal)
     * @param amount - Optional amount override (uses config default if not provided)
     * @returns Resource model (rendering is handled internally)
     */
    static create(
        renderer: Renderer,
        sprite: any,
        gridX: number,
        gridY: number,
        resourceType: ResourceType,
        amount?: number
    ): Resource {
        // Create the resource model
        const resource = new Resource(gridX, gridY, resourceType, amount);

        // Create sprite component on GROUND_DECORATIONS layer
        // Resources don't need depth sorting since they're on the ground
        const spriteComponent = new SpriteComponent(
            sprite,
            gridX,
            gridY,
            RenderLayer.GROUND_DECORATIONS,
            0, // Static depth for ground decorations
            32, // width
            32, // height
            -16, // offsetX to center sprite
            -16  // offsetY to center sprite
        );

        // Register with EntityManager for spatial queries (ants need to find resources)
        EntityManager.getInstance().addEntity(resource);

        // Setup automatic sprite binding with helper (handles registration, movement, destruction)
        setupEntitySpriteBinding(resource, spriteComponent, renderer, RenderLayer.GROUND_DECORATIONS, (coord) => coord);

        // Additional cleanup: Listen to resource depletion (specific to resources)
        const originalCleanup = (resource as any)._cleanup;
        const depleteListener = EventBus.once('RESOURCE_DEPLETED', (resourceId: string) => {
            if (resourceId === resource.id && originalCleanup) {
                originalCleanup(); // Call helper's cleanup
            }
        });

        // Extend cleanup to include depletion listener
        (resource as any)._cleanup = () => {
            originalCleanup();
            EventBus.off('RESOURCE_DEPLETED', depleteListener);
        };

        return resource;
    }
}
