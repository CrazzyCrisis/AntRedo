/**
 * GameStateManager - Central game state authority
 * Single source of truth for game state, emits EventBus notifications on changes
 * 
 * Pattern: Manager owns state, EventBus notifies observers
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { TileGrid } from '../world/TileGrid';

/**
 * GameStateManager manages core game state
 * Singleton pattern ensures single source of truth
 */
export class GameStateManager {
    private static instance: GameStateManager | null = null;

    private playing: boolean = false;
    private paused: boolean = false;
    private currentLevel: number = 0;
    private tileGrid: TileGrid | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance
     */
    static getInstance(): GameStateManager {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }

    /**
     * Check if game is currently playing
     */
    isPlaying(): boolean {
        return this.playing;
    }

    /**
     * Check if game is paused
     */
    isPaused(): boolean {
        return this.paused;
    }

    /**
     * Get current level number
     */
    getCurrentLevel(): number {
        return this.currentLevel;
    }

    /**
     * Get current tile grid (world map)
     * @returns TileGrid or null if no world loaded
     */
    getTileGrid(): TileGrid | null {
        return this.tileGrid;
    }

    /**
     * Set playing state
     */
    setPlaying(playing: boolean): void {
        this.playing = playing;
    }

    /**
     * Set paused state
     */
    setPaused(paused: boolean): void {
        this.paused = paused;
    }

    /**
     * Start game (sets playing to true, emits GAME_START event)
     */
    startGame(): void {
        this.playing = true;
        this.paused = false;
        EventBus.emit(GameEvents.GAME_START);
    }

    /**
     * Pause game (emits GAME_PAUSE event)
     */
    pauseGame(): void {
        this.paused = true;
        EventBus.emit(GameEvents.GAME_PAUSE);
    }

    /**
     * Resume game (emits GAME_RESUME event)
     */
    resumeGame(): void {
        this.paused = false;
        EventBus.emit(GameEvents.GAME_RESUME);
    }

    /**
     * Set current level
     * @param level Level number
     */
    setLevel(level: number): void {
        if (this.currentLevel !== level) {
            this.currentLevel = level;
            EventBus.emit(GameEvents.LEVEL_CHANGED, level);
        }
    }

    /**
     * Set tile grid (world map)
     * @param grid TileGrid to use as current world
     */
    setTileGrid(grid: TileGrid): void {
        this.tileGrid = grid;
        EventBus.emit(GameEvents.WORLD_LOADED, grid);
    }

    /**
     * Clear tile grid
     */
    clearTileGrid(): void {
        this.tileGrid = null;
    }

    /**
     * Get world dimensions in tiles
     * @returns {width, height} in tile units
     */
    getWorldDimensions(): { width: number; height: number } {
        if (!this.tileGrid) {
            return { width: 0, height: 0 };
        }
        return {
            width: this.tileGrid.getWidth(),
            height: this.tileGrid.getHeight()
        };
    }

    /**
     * Reset all game state to defaults
     */
    reset(): void {
        this.playing = false;
        this.paused = false;
        this.currentLevel = 0;
        this.tileGrid = null;
        EventBus.emit(GameEvents.GAME_RESET);
    }
}
