/**
 * BossFactory - Boss Entity Factory (VIEW + MODEL)
 * Creates Boss entities with automatic rendering setup
 * Hides rendering complexity from game code
 */

import {
    Renderer,
    RenderLayer,
    SpriteComponent,
    EntityManager,
    EventBus,
    GameEvents,
    setupEntitySpriteBinding,
    setupHealthBarBinding,
    TILE_SIZE,
    gridToWorldCenter
} from '../imports/factoryImports';
import { Boss } from '../classes/Boss';
import { ENTITY_CONFIG } from '../config/gameplay/entityConfig';

/**
 * BossFactory creates Boss entities with automatic rendering and entity management.
 * 
 * Pattern:
 * 1. Create Boss model with patrol path and projectile type
 * 2. Create SpriteComponent for rendering
 * 3. Register sprite with Renderer on ENTITIES layer
 * 4. Register with EntityManager for queries
 * 5. Listen to movement/destruction events for sprite updates
 * 6. Return Boss model only (rendering is invisible to caller)
 * 
 * Usage:
 *   const patrolPath = [{gridX: 5, gridY: 5}, {gridX: 10, gridY: 5}];
 *   const boss = BossFactory.create(renderer, sprite, 5, 5, patrolPath, 'homing');
 */
export class BossFactory {
    /**
     * Create a boss with automatic rendering registration
     * @param renderer - The game renderer
     * @param sprite - The boss sprite image
     * @param gridX - Initial grid X position
     * @param gridY - Initial grid Y position
     * @param patrolPath - Array of grid positions for patrol route
     * @param projectileType - Type of projectile ('homing' or 'straight')
     * @returns Boss model (rendering is handled internally)
     */
    static create(
        renderer: Renderer,
        sprite: any,
        gridX: number,
        gridY: number,
        patrolPath: Array<{gridX: number; gridY: number}>,
        projectileType: 'homing' | 'straight' = 'homing'
    ): Boss {
        // Create the boss model with all components
        const boss = new Boss(gridX, gridY, patrolPath, projectileType);

        // Create sprite component with Y-position as depth for proper sorting
        // MUST use world coordinates for initial position (centered in tile)
        const { x: worldX, y: worldY } = gridToWorldCenter(gridX, gridY, TILE_SIZE);
        const spriteComponent = new SpriteComponent(
            sprite,
            worldX,
            worldY,
            RenderLayer.ENTITIES,
            gridY, // Y-coordinate determines depth
            32, // width (use base size, scale will multiply)
            32, // height
            -16, // offsetX to center sprite
            -16  // offsetY to center sprite
        );

        // Apply configured sprite scale (boss is 2x larger)
        spriteComponent.scale = ENTITY_CONFIG.SPRITE_SCALES.boss;

        // Register with EntityManager for spatial queries
        EntityManager.getInstance().addEntity(boss);

        // Setup automatic sprite binding with helper (handles registration, movement, destruction)
        // Grid coordinates → world coordinates (centered in tile)
        setupEntitySpriteBinding(boss, spriteComponent, renderer, RenderLayer.ENTITIES);

        // Setup health bar (automatically tracks position and cleans up)
        setupHealthBarBinding(boss, renderer, RenderLayer.VISUAL_EFFECTS);
        
        // Emit BOSS_CREATED for minimap
        EventBus.emit(GameEvents.BOSS_CREATED, boss.id, gridX, gridY);

        return boss;
    }
}
