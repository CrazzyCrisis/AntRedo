/**
 * IScene interface - All scenes must implement this
 * Used by SceneManager for lifecycle management
 */
export interface IScene {
    /**
     * Called when scene becomes active
     * Use this to load assets, setup UI, register event listeners
     */
    enter(): void;

    /**
     * Called when scene is deactivated
     * Use this to cleanup resources, unregister listeners, unregister renderables
     */
    exit(): void;

    /**
     * Called every frame while scene is active
     * Use this for animations, game logic, etc.
     */
    update(): void;

    /**
     * Called when mouse is clicked
     * @param x - Mouse X coordinate
     * @param y - Mouse Y coordinate
     */
    handleMouseClick(x: number, y: number): void;

    /**
     * Called when mouse moves
     * @param x - Mouse X coordinate
     * @param y - Mouse Y coordinate
     */
    handleMouseMove(x: number, y: number): void;
}
