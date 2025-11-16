import {
    Renderer,
    RenderLayer,
    AnimatedSpriteSheetComponent,
    setupEntitySpriteBinding,
    setupHealthBarBinding,
    TILE_SIZE,
    EntityManager,
    gridToWorldCenter,
    JOB_TO_ANIMATION_MAP,
    JOB_TO_SPRITESHEET_MAP
} from '../imports/factoryImports';
import { Ant } from '../classes/Ant';
import { AntJobComponent } from '../classes/components/AntJobComponent';
import { EntityState } from '../classes/components/StateMachineComponent';
import { getEntitySpritesheet } from '../sketch';

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
     * @param gridX - Initial grid X position
     * @param gridY - Initial grid Y position
     * @param factionId - Faction identifier for team
     * @param jobType - Initial job (default: GATHERER)
     * @returns Ant model (rendering is handled internally)
     */
    static create(
        renderer: Renderer,
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

        // Get spritesheet for this job type
        const spritesheetName = (JOB_TO_SPRITESHEET_MAP as any)[jobType] || 'default';
        const spritesheet = getEntitySpritesheet(spritesheetName);

        // Get animations for this job type
        const animations = (JOB_TO_ANIMATION_MAP as any)[jobType];

        // Create animated sprite component
        // MUST use world coordinates for initial position (centered in tile)
        const { x: worldX, y: worldY } = gridToWorldCenter(gridX, gridY, TILE_SIZE);
        
        // Get debug name for logging
        const debugJobName = spritesheetName.toLowerCase();
        
        const animatedSprite = new AnimatedSpriteSheetComponent(
            spritesheet,
            worldX,
            worldY,
            debugJobName
        );
        
        // Center the sprite (32x32 frames, so offset by -16, -16)
        animatedSprite.setOffset(-16, -16);
        
        // Set depth for proper sorting (Y-coordinate determines depth - ants behind trees)
        animatedSprite.setDepth(gridY);
        animatedSprite.setLayer(RenderLayer.ENTITIES);

        // Add all animations for this ant's job
        if (animations) {
            animatedSprite.addAnimation('idle', animations.idle);
            animatedSprite.addAnimation('walk', animations.walk);
            animatedSprite.addAnimation('attack', animations.attack);
            animatedSprite.addAnimation('gather', animations.gather);
            animatedSprite.addAnimation('build', animations.build);
            animatedSprite.addAnimation('die', animations.die);
        }

        // Map entity states to animation names
        const stateToAnimationMap = new Map<EntityState, string>([
            [EntityState.IDLE, 'idle'],
            [EntityState.FOLLOWING, 'walk'],
            [EntityState.PATROLLING, 'walk'],
            [EntityState.SCOUTING, 'walk'],
            [EntityState.RETURNING, 'walk'],
            [EntityState.ATTACKING, 'attack'],
            [EntityState.COMBAT, 'attack'],
            [EntityState.GATHERING, 'gather'],
            [EntityState.BUILDING, 'build'],
            [EntityState.HEALING, 'idle']
        ]);

        // Connect animated sprite to entity's state machine
        animatedSprite.setOwnerEntity(ant.id, stateToAnimationMap);

        // Start with idle animation
        animatedSprite.playAnimation('idle');

        // Setup automatic sprite binding with helper (handles registration, movement, destruction)
        setupEntitySpriteBinding(ant, animatedSprite, renderer, RenderLayer.ENTITIES);

        // Setup health bar (automatically tracks position and cleans up)
        setupHealthBarBinding(ant, renderer, RenderLayer.ABOVE_ENTITIES);

        // Register with EntityManager for update() lifecycle
        EntityManager.getInstance().addEntity(ant);

        return ant;
    }
}
