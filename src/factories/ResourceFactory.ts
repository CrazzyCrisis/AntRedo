/**
 * ResourceFactory - Resource Entity Factory (VIEW + MODEL)
 * Creates Resource entities with automatic rendering setup
 * Hides rendering complexity from game code
 */

import {
    Renderer,
    RenderLayer,
    SpriteComponent,
    EntityManager,
    EventBus,
    setupEntitySpriteBinding,
    TILE_SIZE,
    ResourceType,
    gridToWorldPosition,
    TilePosition
} from '../imports/factoryImports';
import { Resource } from '../classes/Resource';

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
 *   // Single resource centered on tile
 *   const resource = ResourceFactory.create(renderer, foodSprite, 10, 10, 'food', 50);
 * 
 *   // Multiple resources on same tile at different positions
 *   const food1 = ResourceFactory.create(renderer, foodSprite, 10, 10, 'food', 50, 'TL');
 *   const food2 = ResourceFactory.create(renderer, foodSprite, 10, 10, 'food', 50, 'TR');
 *   const wood = ResourceFactory.create(renderer, woodSprite, 10, 10, 'wood', 30, 'BL');
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
     * @param position - Optional position within tile (TL, T, TR, L, C, R, BL, B, BR). Defaults to 'C' (center). Allows up to 9 resources per tile.
     * @returns Resource model (rendering is handled internally)
     */
    static create(
        renderer: Renderer,
        sprite: any,
        gridX: number,
        gridY: number,
        resourceType: ResourceType,
        amount?: number,
        position: TilePosition = 'C'
    ): Resource {
        // Create the resource model
        const resource = new Resource(gridX, gridY, resourceType, amount);

        // Create sprite component on GROUND_DECORATIONS layer
        // Resources don't need depth sorting since they're on the ground
        // MUST use world coordinates for initial position with flexible positioning
        const { x: worldX, y: worldY } = gridToWorldPosition(gridX, gridY, TILE_SIZE, position);
        const spriteComponent = new SpriteComponent(
            sprite,
            worldX,
            worldY,
            RenderLayer.GROUND_DECORATIONS,
            0, // Static depth for ground decorations
            32, // width
            32, // height
            -16, // offsetX to center sprite
            -16  // offsetY to center sprite
        );

        // Register with EntityManager for spatial queries (ants need to find resources)
        EntityManager.getInstance().addEntity(resource);

        // Calculate the offset from base tile position for this position slot
        const positionOffset = gridToWorldPosition(0, 0, TILE_SIZE, position);
        
        // Setup automatic sprite binding with helper (handles registration, movement, destruction)
        // Grid coordinates → world coordinates with position offset
        setupEntitySpriteBinding(resource, spriteComponent, renderer, RenderLayer.GROUND_DECORATIONS, 
            (coord) => coord * TILE_SIZE + positionOffset.x);

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
