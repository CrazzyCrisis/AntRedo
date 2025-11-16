import {
    Renderer,
    RenderLayer,
    SpriteComponent,
    EventBus,
    GameEvents,
    setupEntitySpriteBinding,
    setupHealthBarBinding,
    TILE_SIZE,
    EntityManager,
    gridToWorldCenter
} from '../imports/factoryImports';
import { Queen } from '../classes/Queen';
import { ENTITY_CONFIG } from '../config/entityConfig';

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

        // 3. Create View (SpriteComponent) - MUST use world coordinates for initial position
        const { x: worldX, y: worldY } = gridToWorldCenter(gridX, gridY, TILE_SIZE);
        const spriteComponent = new SpriteComponent(
            sprite,
            worldX,
            worldY,
            RenderLayer.ENTITIES,
            gridY  // depth = Y position for sorting
        );

        // Apply configured sprite scale
        spriteComponent.scale = ENTITY_CONFIG.SPRITE_SCALES.queen;

        // Setup automatic sprite binding with helper (handles registration, movement, destruction)
        // Grid coordinates → world coordinates (centered in tile)
        setupEntitySpriteBinding(queen, spriteComponent, renderer, RenderLayer.ENTITIES);

        // Setup health bar (automatically tracks position and cleans up)
        setupHealthBarBinding(queen, renderer, RenderLayer.ABOVE_ENTITIES);

        // 4. Register with EntityManager for update() lifecycle
        EntityManager.getInstance().addEntity(queen);
        
        // 4.5. Request camera follow (MUST happen AFTER EntityManager registration)
        EventBus.emit(GameEvents.CAMERA_FOLLOW_ENTITY, queen.id);

        // 5. Additional cleanup: Listen to ENTITY_DIED and extend helper's cleanup for faction tracking
        const originalCleanup = (queen as any)._cleanup;
        const diedListener = EventBus.once('ENTITY_DIED', (entityId: string) => {
            if (entityId === queen.id) {
                QueenFactory.activeQueens.delete(factionId); // Remove from active queens
                if (originalCleanup) originalCleanup(); // Call helper's cleanup
            }
        });

        // 6. Extend cleanup to include faction tracking (handles both destroy() and death)
        (queen as any)._cleanup = () => {
            QueenFactory.activeQueens.delete(factionId); // Remove from active queens
            originalCleanup(); // Call helper's cleanup (handles ENTITY_DESTROYED)
            EventBus.off('ENTITY_DIED', diedListener);
        };

        // 7. Return Model only (View is hidden)
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
