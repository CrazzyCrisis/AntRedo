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
    GameEvents,
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
     * Create a building with automatic rendering setup
     * @param renderer - Renderer instance
     * @param constructionSprite - Sprite for construction state
     * @param completedSprite - Sprite for completed state
     * @param gridX - Grid X position (top-left corner)
     * @param gridY - Grid Y position (top-left corner)
     * @param buildingType - Type of building (warehouse, barracks, tower)
     * @param factionId - Faction ID for building ownership
     * @returns Building model (rendering is handled internally)
     */
    static create(
        renderer: Renderer,
        constructionSprite: any,
        completedSprite: any,
        gridX: number,
        gridY: number,
        buildingType: BuildingType,
        factionId: string
    ): Building {
        // Create the building model (starts in construction state)
        const building = new Building(gridX, gridY, buildingType, factionId);

        // Create sprite component starting with construction sprite
        // For multi-tile buildings, center sprite on the middle of occupied area
        // 2x2 building: center should be at gridX+0.5, gridY+0.5 in tile coordinates
        const centerOffsetX = (building.size.width - 1) * 0.5;
        const centerOffsetY = (building.size.height - 1) * 0.5;
        const centerGridX = gridX + centerOffsetX;
        const centerGridY = gridY + centerOffsetY;
        const { x: worldX, y: worldY } = gridToWorldCenter(centerGridX, centerGridY, TILE_SIZE);
        
        const spriteComponent = new SpriteComponent(
            constructionSprite,
            worldX,
            worldY,
            RenderLayer.GROUND_DECORATIONS,
            0, // Static depth for buildings
            building.size.width * 32, // Width in pixels (2x scale for larger sprites)
            building.size.height * 32, // Height in pixels (2x scale for larger sprites)
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
        setupEntitySpriteBinding(building, spriteComponent, renderer, RenderLayer.GROUND_DECORATIONS);

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

        // Emit CONSTRUCTION_SITE_CREATED for ant job system
        EventBus.emit(GameEvents.CONSTRUCTION_SITE_CREATED, {
            buildingId: building.id,
            gridX: building.gridX,
            gridY: building.gridY,
            buildingType: building.buildingType,
            sizeWidth: building.size.width,
            sizeHeight: building.size.height,
            factionId: building.factionId
        });

        return building;
    }
}
