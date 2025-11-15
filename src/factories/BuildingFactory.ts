/**
 * BuildingFactory - Building Entity Factory (VIEW + MODEL)
 * Creates Building entities with automatic rendering setup
 * Handles construction site vs completed building sprites
 * Manages pathfinding grid updates
 */

import {
    Renderer,
    RenderLayer,
    SpriteComponent,
    EntityManager,
    EventBus,
    setupEntitySpriteBinding,
    TILE_SIZE,
    BuildingType,
    gridToWorldCenter
} from '../imports/factoryImports';
import { Building } from '../classes/Building';

/**
 * BuildingFactory creates Building entities with automatic rendering and entity management.
 * 
 * Pattern:
 * 1. Create Building model with type and size
 * 2. Create SpriteComponent for construction site (initial state)
 * 3. Register sprite with Renderer on GROUND_DECORATIONS layer
 * 4. Register with EntityManager
 * 5. Emit pathfinding block event for occupied tiles
 * 6. Listen to construction/leveling events to update sprite
 * 7. Return Building model only (rendering is invisible to caller)
 * 
 * Usage:
 *   const building = BuildingFactory.create(
 *     renderer, constructionSprite, completedSprite, 
 *     10, 10, 'warehouse'
 *   );
 */
export class BuildingFactory {
    /**
     * Create a building with automatic rendering registration
     * @param renderer - The game renderer
     * @param constructionSprite - Sprite for construction site
     * @param completedSprite - Sprite for completed building
     * @param gridX - Grid X position (top-left corner)
     * @param gridY - Grid Y position (top-left corner)
     * @param buildingType - Type of building (warehouse, barracks, tower)
     * @returns Building model (rendering is handled internally)
     */
    static create(
        renderer: Renderer,
        constructionSprite: any,
        completedSprite: any,
        gridX: number,
        gridY: number,
        buildingType: BuildingType
    ): Building {
        // Create the building model (starts in construction state)
        const building = new Building(gridX, gridY, buildingType);

        // Create sprite component starting with construction sprite
        // MUST use world coordinates for initial position (centered in tile)
        const { x: worldX, y: worldY } = gridToWorldCenter(gridX, gridY, TILE_SIZE);
        const spriteComponent = new SpriteComponent(
            constructionSprite,
            worldX,
            worldY,
            RenderLayer.GROUND_DECORATIONS,
            0, // Static depth for buildings
            building.size.width * 16, // Width in pixels (tile size 16)
            building.size.height * 16, // Height in pixels
            0, // No offset (aligned to grid)
            0
        );

        // Register with EntityManager
        EntityManager.getInstance().addEntity(building);

        // Emit event for pathfinding blocking
        const occupiedTiles = building.getOccupiedTiles();
        EventBus.emit('BUILDING_PATHFINDING_BLOCK', building.id, occupiedTiles);

        // Setup automatic sprite binding with helper (handles registration, movement, destruction)
        // Grid coordinates → world coordinates (centered in tile)
        setupEntitySpriteBinding(building, spriteComponent, renderer, RenderLayer.GROUND_DECORATIONS, (coord) => coord * TILE_SIZE + TILE_SIZE / 2);

        // Additional listeners specific to buildings
        const originalCleanup = (building as any)._cleanup;

        // Listen to construction completion to swap sprite
        const completionListener = EventBus.on('BUILDING_COMPLETED', (buildingId: string) => {
            if (buildingId === building.id) {
                spriteComponent.setSprite(completedSprite);
                renderer.markLayerDirty(RenderLayer.GROUND_DECORATIONS);
            }
        });

        // Listen to construction progress to update sprite (optional: show progress)
        const progressListener = EventBus.on('CONSTRUCTION_PROGRESS', (buildingId: string, _progress: number) => {
            if (buildingId === building.id) {
                renderer.markLayerDirty(RenderLayer.GROUND_DECORATIONS);
            }
        });

        // Listen to level up events to potentially update sprite
        const levelUpListener = EventBus.on('BUILDING_LEVELED_UP', (buildingId: string, _newLevel: number) => {
            if (buildingId === building.id) {
                renderer.markLayerDirty(RenderLayer.GROUND_DECORATIONS);
            }
        });

        // Listen to destruction to unblock pathfinding
        const destroyListener = EventBus.once('BUILDING_DESTROYED', (buildingId: string) => {
            if (buildingId === building.id) {
                EventBus.emit('BUILDING_PATHFINDING_UNBLOCK', building.id, occupiedTiles);
                if (originalCleanup) originalCleanup();
            }
        });

        // Extend cleanup to include building-specific listeners and pathfinding unblock
        (building as any)._cleanup = () => {
            EventBus.emit('BUILDING_PATHFINDING_UNBLOCK', building.id, occupiedTiles);
            originalCleanup();
            EventBus.off('BUILDING_COMPLETED', completionListener);
            EventBus.off('CONSTRUCTION_PROGRESS', progressListener);
            EventBus.off('BUILDING_LEVELED_UP', levelUpListener);
            EventBus.off('BUILDING_DESTROYED', destroyListener);
        };

        return building;
    }
}
