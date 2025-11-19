/**
 * RandomMovementComponent
 * Handles random directional movement for autonomous entities
 */

import { BaseComponent } from './BaseComponent';

export class RandomMovementComponent extends BaseComponent {
    private randomMoveTimer: number = 0;
    private randomMoveInterval: number = 2000 + Math.random() * 2000; // 2-4 seconds
    private currentMoveX: number = 0; // Current movement direction X
    private currentMoveY: number = 0; // Current movement direction Y
    private moveDuration: number = 0; // How long to move in current direction
    private moveElapsed: number = 0; // Time spent moving in current direction
    private enabled: boolean = true;

    constructor() {
        super();
    }

    /**
     * Enable or disable random movement
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        
        // Reset movement when disabled
        if (!enabled) {
            this.currentMoveX = 0;
            this.currentMoveY = 0;
            this.moveElapsed = 0;
        }
    }

    /**
     * Check if random movement is enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Update random movement behavior
     */
    public update(deltaTime: number): void {
        if (!this.enabled || !this.owner) {
            return;
        }

        this.randomMoveTimer += deltaTime;
        
        // Check if we need a new random direction
        if (this.randomMoveTimer >= this.randomMoveInterval) {
            this.randomMoveTimer = 0;
            this.randomMoveInterval = 2000 + Math.random() * 2000; // Next decision in 2-4 seconds
            
            // Random direction: -1, 0, or 1 for X and Y
            const directions = [-1, 0, 1];
            this.currentMoveX = directions[Math.floor(Math.random() * 3)];
            this.currentMoveY = directions[Math.floor(Math.random() * 3)];
            
            // Set move duration (500-1500ms)
            this.moveDuration = 500 + Math.random() * 1000;
            this.moveElapsed = 0;
        }
        
        // Continue moving in current direction
        if (this.moveElapsed < this.moveDuration) {
            this.moveElapsed += deltaTime;
            this.owner.requestMove(this.currentMoveX, this.currentMoveY);
        } else {
            // Stop moving after duration
            this.owner.requestMove(0, 0);
        }
    }

    /**
     * Reset random movement state
     */
    public reset(): void {
        this.randomMoveTimer = 0;
        this.randomMoveInterval = 2000 + Math.random() * 2000;
        this.currentMoveX = 0;
        this.currentMoveY = 0;
        this.moveDuration = 0;
        this.moveElapsed = 0;
    }
}
