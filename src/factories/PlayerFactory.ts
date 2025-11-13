import { Player } from '../classes/Player';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { SpriteComponent } from '../rendering/components/SpriteComponent';
import { EventBus, GameEvents } from '../utils/eventBus';

/**
 * PlayerFactory creates Player entities with automatic rendering setup.
 * Demonstrates Factory Pattern - hides rendering complexity from game code.
 * 
 * Usage:
 *   const player = PlayerFactory.create(renderer, sprite, 100, 200);
 *   // Player is now fully set up with rendering - developer never touches rendering code!
 */
export class PlayerFactory {
    /**
     * Create a player with automatic rendering registration
     * @param renderer - The game renderer
     * @param sprite - The player sprite image
     * @param x - Initial X position
     * @param y - Initial Y position
     * @returns Player model (rendering is handled internally)
     */
    static create(renderer: Renderer, sprite: any, x: number, y: number): Player {
        // Create the player model
        const player = new Player(x, y);

        // Create sprite component with Y-position as depth for proper sorting
        const spriteComponent = new SpriteComponent(
            sprite,
            player.x,
            player.y,
            RenderLayer.ENTITIES,
            player.y, // Y-coordinate determines depth (sprites behind trees)
            32, // width
            32, // height
            -16, // offsetX to center
            -16  // offsetY to center
        );

        // Register with renderer (renderer manages it from now on)
        const unregister = renderer.register(spriteComponent);

        // Listen to player movement and update sprite position + depth
        const moveListener = EventBus.on(GameEvents.PLAYER_MOVE, (newX: number, newY: number) => {
            spriteComponent.setPosition(newX, newY);
            spriteComponent.setDepth(newY); // Update depth for proper layering
            renderer.markLayerDirty(RenderLayer.ENTITIES);
        });

        // Listen to player death to clean up rendering
        const deathListener = EventBus.once(GameEvents.PLAYER_DEATH, () => {
            unregister(); // Remove from renderer
            EventBus.off(GameEvents.PLAYER_MOVE, moveListener);
        });

        // Store cleanup function on player for manual cleanup if needed
        (player as any)._cleanup = () => {
            unregister();
            EventBus.off(GameEvents.PLAYER_MOVE, moveListener);
            EventBus.off(GameEvents.PLAYER_DEATH, deathListener);
        };

        return player;
    }
}
