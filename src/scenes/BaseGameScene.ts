/**
 * BaseGameScene - Base class for scenes with entity management
 * Provides common entity update loop for all game scenes (not just DevRoom)
 * Future-proofing: All scenes can potentially update entities
 */

import { IScene } from './IScene';
import { GameObject } from '../classes/GameObject';

/**
 * Base class for scenes that manage game entities
 * Handles entity update loop automatically
 */
export abstract class BaseGameScene implements IScene {
    protected entities: GameObject[] = [];
    protected lastUpdateTime: number = 0;

    /**
     * Register an entity to be updated by this scene
     * @param entity - Entity to register
     */
    protected registerEntity(entity: GameObject): void {
        if (!this.entities.includes(entity)) {
            this.entities.push(entity);
        }
    }

    /**
     * Unregister an entity from updates
     * @param entity - Entity to unregister
     */
    protected unregisterEntity(entity: GameObject): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    /**
     * Clear all registered entities
     */
    protected clearAllEntities(): void {
        this.entities = [];
    }

    /**
     * Update all registered entities
     * Should be called in scene's update() method
     * @param deltaTime - Time since last frame in milliseconds
     */
    protected updateEntities(deltaTime: number): void {
        for (const entity of this.entities) {
            if (entity.isActive) {
                entity.update(deltaTime);
            }
        }
    }

    /**
     * Calculate delta time since last update
     * @returns Delta time in milliseconds
     */
    protected calculateDeltaTime(): number {
        const currentTime = Date.now();
        const deltaTime = this.lastUpdateTime === 0 ? 16 : currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        return deltaTime;
    }

    // IScene interface - must be implemented by subclasses
    abstract enter(): void;
    abstract exit(): void;
    abstract update(deltaTime: number): void;
    abstract handleMouseClick(x: number, y: number): void;
    abstract handleMouseMove(x: number, y: number): void;
    abstract handleMouseUp(x: number, y: number): void;
    abstract onResize(width: number, height: number): void;
}
