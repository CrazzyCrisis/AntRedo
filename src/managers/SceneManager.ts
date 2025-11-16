import { IScene } from '../scenes/IScene';
import { EventBus, GameEvents } from '../utils/eventBus';
import { EnvironmentEffectsManager } from './EnvironmentEffectsManager';
import { EntityManager } from './EntityManager';
import { GameStateManager } from './GameStateManager';

/**
 * SceneManager - Singleton for managing game scenes
 * Handles scene lifecycle (enter/exit) and forwards input events
 * Also manages cross-scene systems like environment effects
 */
export class SceneManager {
    private static instance: SceneManager;
    private currentScene: IScene | null = null;
    private currentSceneName: string = '';
    private environmentEffects: EnvironmentEffectsManager;

    private constructor() {
        // Private constructor for singleton
        this.environmentEffects = EnvironmentEffectsManager.getInstance();
        
        // Listen for scene changes to update environment effects TileGrid
        EventBus.on(GameEvents.SCENE_CHANGE, () => {
            const tileGrid = GameStateManager.getInstance().getTileGrid();
            if (tileGrid) {
                this.environmentEffects.setTileGrid(tileGrid);
            }
        });
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

        // Update environment effects with current TileGrid
        const tileGrid = GameStateManager.getInstance().getTileGrid();
        if (tileGrid) {
            this.environmentEffects.setTileGrid(tileGrid);
        }

        // Emit scene change event
        EventBus.emit(GameEvents.SCENE_CHANGE, sceneName, previousSceneName);
    }

    /**
     * Update current scene (call every frame)
     * Also updates cross-scene systems like environment effects
     */
    public update(): void {
        if (this.currentScene) {
            this.currentScene.update();
        }
        
        // Update environment effects (water damage, swimming particles, etc.)
        const entities = EntityManager.getInstance().getAllEntities();
        if (entities.length > 0) {
            this.environmentEffects.update(entities);
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
    handleMouseMove(x: number, y: number): void {
        if (this.currentScene) {
            this.currentScene.handleMouseMove(x, y);
        }
    }
    
    /**
     * Forward mouse up to current scene
     */
    handleMouseUp(x: number, y: number): void {
        if (this.currentScene) {
            this.currentScene.handleMouseUp(x, y);
        }
    }
    
    /**
     * Forward window resize to current scene
     */
    handleResize(width: number, height: number): void {
        if (this.currentScene) {
            this.currentScene.onResize(width, height);
        }
    }
    
    /**
     * Forward key press to current scene
     */
    public handleKeyPress(key: string | number): void {
        if (this.currentScene && this.currentScene.handleKeyPress) {
            this.currentScene.handleKeyPress(key);
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
