import { GameObject } from './GameObject';
import { TILE_SIZE } from '../world/TileSystem';

/**
 * Decoration Model (MVC Pattern)
 * 
 * Represents a decorative ground element (flowers, stones, grass tufts, etc.)
 * Extends GameObject to participate in cleanup system and entity lifecycle.
 * 
 * View: SpriteComponent (registered via DecorationFactory)
 * Controller: DecorationFactory
 */
export class Decoration extends GameObject {
    public readonly decorationType: string; // Type of decoration (e.g., 'flower', 'stone', 'grass')
    
    /**
     * Create a new Decoration
     * @param decorationType - Type of decoration for visual identification
     * @param gridX - Grid column position
     * @param gridY - Grid row position
     */
    constructor(decorationType: string, gridX: number, gridY: number) {
        super('decoration', gridX, gridY, TILE_SIZE);
        this.decorationType = decorationType;
    }

    /**
     * Decorations are static - no update logic needed
     */
    public update(deltaTime: number): void {
        // Decorations are purely visual, no behavior
        super.update(deltaTime);
    }
}
