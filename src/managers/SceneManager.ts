import { IScene } from '../scenes/IScene';
import { EventBus, GameEvents } from '../utils/eventBus';

/**
 * SceneManager - Singleton for managing game scenes
 * Handles scene lifecycle (enter/exit) and forwards input events
 */
export class SceneManager {
    private static instance: SceneManager;
    private currentScene: IScene | null = null;
    private currentSceneName: string = '';

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SceneManager {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager();
        }
        return SceneManager.instance;
    }

    /**
     * Switch to a new scene
     * @param scene - Scene instance to switch to
     * @param sceneName - Optional name for the scene
     */
    public switchScene(scene: IScene, sceneName: string = ''): void {
        const previousSceneName = this.currentSceneName;

        // Call exit on current scene
        if (this.currentScene) {
            this.currentScene.exit();
        }

        // Set new scene
        this.currentScene = scene;
        this.currentSceneName = sceneName;

        // Call enter on new scene
        this.currentScene.enter();

        // Emit scene change event
        EventBus.emit(GameEvents.SCENE_CHANGE, sceneName, previousSceneName);
    }

    /**
     * Update current scene (call every frame)
     */
    public update(): void {
        if (this.currentScene) {
            this.currentScene.update();
        }
    }

    /**
     * Forward mouse click to current scene
     */
    public handleMouseClick(x: number, y: number): void {
        if (this.currentScene) {
            this.currentScene.handleMouseClick(x, y);
        }
    }

    /**
     * Forward mouse move to current scene
     */
    public handleMouseMove(x: number, y: number): void {
        if (this.currentScene) {
            this.currentScene.handleMouseMove(x, y);
        }
    }

    /**
     * Get current scene
     */
    public getCurrentScene(): IScene | null {
        return this.currentScene;
    }

    /**
     * Get current scene name
     */
    public getCurrentSceneName(): string {
        return this.currentSceneName;
    }
}
