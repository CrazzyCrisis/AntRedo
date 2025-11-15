import { Queen } from '../classes/Queen';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { SpriteComponent } from '../rendering/components/SpriteComponent';
import { EventBus } from '../utils/eventBus';
import { setupEntitySpriteBinding } from '../utils/helpers';

/**
 * QueenFactory - CONTROLLER
 * Bridges Queen Model and SpriteComponent View
 * 
 * SINGLETON PATTERN: Only one Queen can exist at a time per faction
 * 
 * Responsibilities:
 * - Create Queen models (enforces single Queen per faction)
 * - Create and register sprite components
 * - Wire EventBus communication between Model and View
 * - Handle camera follow
 * - Manage cleanup on death
 * 
 * Pattern: Factory hides all rendering complexity from game code
 * Usage: const queen = QueenFactory.create(renderer, sprite, gridX, gridY, factionId);
 */
export class QueenFactory {
    private static activeQueens: Map<string, Queen> = new Map();

    /**
     * Create a new Queen entity with automatic rendering
     * ENFORCES: Only one Queen per faction can exist
     * 
     * @param renderer Renderer instance for sprite registration
     * @param sprite p5.Image sprite for queen
     * @param gridX Grid X position
     * @param gridY Grid Y position
     * @param factionId Faction ID for team identification
     * @returns Queen model (rendering is hidden)
     * @throws Error if Queen already exists for this faction
     */
    static create(
        renderer: Renderer,
        sprite: any,
        gridX: number,
        gridY: number,
        factionId: string
    ): Queen {
        // Enforce single Queen per faction
        if (QueenFactory.activeQueens.has(factionId)) {
            throw new Error(`Queen already exists for faction '${factionId}'. Only one Queen per faction is allowed.`);
        }
        // 1. Create Model (Queen with 3 components)
        const queen = new Queen(gridX, gridY, factionId);

        // 2. Register Queen as active for this faction
        QueenFactory.activeQueens.set(factionId, queen);

        // 3. Create View (SpriteComponent)
        const spriteComponent = new SpriteComponent(
            sprite,
            gridX,
            gridY,
            RenderLayer.ENTITIES,
            gridY  // depth = Y position for sorting
        );

        // 3. Setup automatic sprite binding with helper (handles registration, movement, destruction)
        setupEntitySpriteBinding(queen, spriteComponent, renderer, RenderLayer.ENTITIES, (coord) => coord);

        // 4. Additional cleanup: Listen to ENTITY_DIED for faction tracking (specific to queens)
        const originalCleanup = (queen as any)._cleanup;
        const diedListener = EventBus.once('ENTITY_DIED', (entityId: string) => {
            if (entityId === queen.id) {
                QueenFactory.activeQueens.delete(factionId); // Remove from active queens
                if (originalCleanup) originalCleanup(); // Call helper's cleanup
            }
        });

        // 5. Extend cleanup to include faction tracking and died listener
        (queen as any)._cleanup = () => {
            QueenFactory.activeQueens.delete(factionId); // Remove from active queens
            originalCleanup();
            EventBus.off('ENTITY_DIED', diedListener);
        };

        // 8. Return Model only (View is hidden)
        return queen;
    }

    /**
     * Get active Queen for a faction
     * @param factionId Faction ID
     * @returns Queen instance or undefined
     */
    static getQueen(factionId: string): Queen | undefined {
        return QueenFactory.activeQueens.get(factionId);
    }

    /**
     * Check if Queen exists for faction
     * @param factionId Faction ID
     * @returns True if Queen exists
     */
    static hasQueen(factionId: string): boolean {
        return QueenFactory.activeQueens.has(factionId);
    }

    /**
     * Get all active Queens
     * @returns Array of all Queen instances
     */
    static getAllQueens(): Queen[] {
        return Array.from(QueenFactory.activeQueens.values());
    }

    /**
     * Clear all active Queens (for testing/cleanup)
     */
    static clearAll(): void {
        QueenFactory.activeQueens.clear();
    }
}
