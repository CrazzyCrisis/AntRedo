/**
 * ProjectileFactory - Projectile Entity Factory (VIEW + MODEL)
 * Creates Projectile entities with automatic rendering setup
 * Handles both homing and straight-line projectiles
 */

import { Projectile } from '../classes/Projectile';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { SpriteComponent } from '../rendering/components/SpriteComponent';
import { EntityManager } from '../managers/EntityManager';
import { EventBus } from '../utils/eventBus';
import { setupEntitySpriteBinding } from '../utils/helpers';

/**
 * ProjectileFactory creates Projectile entities with automatic rendering and entity management.
 * 
 * Pattern:
 * 1. Create Projectile model with target, damage, speed, type
 * 2. Create SpriteComponent for rendering on ABOVE_ENTITIES layer
 * 3. Register sprite with Renderer
 * 4. Register with EntityManager for collision queries
 * 5. Listen to movement events to update sprite position and rotation
 * 6. Listen to hit/expiration events to cleanup sprite
 * 7. Return Projectile model only (rendering is invisible to caller)
 * 
 * Usage:
 *   const projectile = ProjectileFactory.create(
 *     renderer, sprite, 5, 5, 'enemy_ant_id', 30, 4.0, 'homing', 'boss_id'
 *   );
 */
export class ProjectileFactory {
    /**
     * Create a projectile with automatic rendering registration
     * @param renderer - The game renderer
     * @param sprite - The projectile sprite image
     * @param startGridX - Starting grid X position
     * @param startGridY - Starting grid Y position
     * @param targetId - Target entity ID (null for straight projectiles without target)
     * @param damage - Damage dealt on hit
     * @param speed - Movement speed in pixels per second
     * @param projectileType - Type ('homing' or 'straight')
     * @param ownerId - ID of entity that fired this projectile
     * @returns Projectile model (rendering is handled internally)
     */
    static create(
        renderer: Renderer,
        sprite: any,
        startGridX: number,
        startGridY: number,
        targetId: string | null,
        damage: number,
        speed: number,
        projectileType: 'homing' | 'straight',
        ownerId: string
    ): Projectile {
        // Create the projectile model
        const projectile = new Projectile(
            startGridX,
            startGridY,
            targetId,
            damage,
            speed,
            projectileType,
            ownerId
        );

        // Create sprite component on ABOVE_ENTITIES layer (projectiles fly over ground)
        const spriteComponent = new SpriteComponent(
            sprite,
            startGridX,
            startGridY,
            RenderLayer.ABOVE_ENTITIES,
            1000, // High depth to render above everything
            16, // width (small projectile)
            16, // height
            -8, // offsetX to center sprite
            -8  // offsetY to center sprite
        );

        // Register with EntityManager for collision detection
        EntityManager.getInstance().addEntity(projectile);

        // Setup automatic sprite binding with helper (handles registration, movement, destruction)
        setupEntitySpriteBinding(projectile, spriteComponent, renderer, RenderLayer.ABOVE_ENTITIES, (coord) => coord);

        // Additional cleanup: Listen to projectile-specific events (hit, expire)
        const originalCleanup = (projectile as any)._cleanup;

        const hitListener = EventBus.once('PROJECTILE_HIT', (projectileId: string) => {
            if (projectileId === projectile.id && originalCleanup) {
                originalCleanup(); // Call helper's cleanup
            }
        });

        const expireListener = EventBus.once('PROJECTILE_EXPIRED', (projectileId: string) => {
            if (projectileId === projectile.id && originalCleanup) {
                originalCleanup(); // Call helper's cleanup
            }
        });

        // Extend cleanup to include projectile-specific listeners
        (projectile as any)._cleanup = () => {
            originalCleanup();
            EventBus.off('PROJECTILE_HIT', hitListener);
            EventBus.off('PROJECTILE_EXPIRED', expireListener);
        };

        return projectile;
    }
}
