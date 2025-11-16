/**
 * DepletionBarComponent - Visual Depletion Bar for Resources
 * Displays remaining yield above resources being harvested
 * Shows how much is left before resource is fully depleted
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { GATHERING_BEHAVIOR } from '../../config/resourceGatheringConfig';

export class DepletionBarComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.ABOVE_ENTITIES;
    public depth: number;
    
    private x: number;
    private y: number;
    private progress: number;          // Depletion progress (0-1, 1 = fully depleted)
    private width: number;
    private height: number;
    private offsetY: number;           // Vertical offset from owner
    private fillColor: string;
    private backgroundColor: string;
    private borderColor: string;
    private visible: boolean;

    /**
     * Create a depletion bar
     * @param x - World X position
     * @param y - World Y position
     * @param width - Bar width in pixels
     * @param height - Bar height in pixels
     * @param offsetY - Vertical offset from owner (negative = above)
     * @param fillColor - Fill color hex string
     * @param backgroundColor - Background color hex string
     * @param borderColor - Border color hex string
     */
    constructor(
        x: number,
        y: number,
        width: number = GATHERING_BEHAVIOR.DEPLETION_BAR.WIDTH,
        height: number = GATHERING_BEHAVIOR.DEPLETION_BAR.HEIGHT,
        offsetY: number = GATHERING_BEHAVIOR.DEPLETION_BAR.OFFSET_Y,
        fillColor: string = GATHERING_BEHAVIOR.DEPLETION_BAR.FILL_COLOR,
        backgroundColor: string = GATHERING_BEHAVIOR.DEPLETION_BAR.BACKGROUND_COLOR,
        borderColor: string = GATHERING_BEHAVIOR.DEPLETION_BAR.BORDER_COLOR
    ) {
        this.x = x;
        this.y = y;
        this.depth = y; // Use Y for depth sorting
        this.progress = 0; // Start at 0 (full)
        this.width = width;
        this.height = height;
        this.offsetY = offsetY;
        this.fillColor = fillColor;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.visible = false;
    }

    /**
     * Set depletion progress (0-1, 1 = fully depleted)
     */
    public setProgress(progress: number): void {
        this.progress = Math.max(0, Math.min(1, progress));
    }

    /**
     * Get current depletion progress
     */
    public getProgress(): number {
        return this.progress;
    }

    /**
     * Show the depletion bar
     */
    public show(): void {
        this.visible = true;
    }

    /**
     * Hide the depletion bar
     */
    public hide(): void {
        this.visible = false;
    }

    /**
     * Check if visible
     */
    public isVisible(): boolean {
        return this.visible;
    }

    /**
     * Update position to follow owner
     * @param ownerX - Owner's world X position
     * @param ownerY - Owner's world Y position
     */
    public updatePosition(ownerX: number, ownerY: number): void {
        this.x = ownerX;
        this.y = ownerY + this.offsetY;
        this.depth = this.y; // Update depth for sorting
    }

    /**
     * Render the depletion bar (shows remaining, not depleted)
     */
    public render(graphics: any): void {
        if (!this.visible) return;

        const halfWidth = this.width / 2;
        const x = this.x - halfWidth;
        const y = this.y;

        // Background
        graphics.fill(this.backgroundColor);
        graphics.noStroke();
        graphics.rect(x, y, this.width, this.height);

        // Remaining fill (inverse of depletion progress)
        const remaining = 1 - this.progress;
        if (remaining > 0) {
            graphics.fill(this.fillColor);
            graphics.noStroke();
            graphics.rect(x, y, this.width * remaining, this.height);
        }

        // Border
        graphics.noFill();
        graphics.stroke(this.borderColor);
        graphics.strokeWeight(1);
        graphics.rect(x, y, this.width, this.height);
    }

    /**
     * Get depth for sorting (use Y position)
     */
    public getDepth(): number {
        return this.depth;
    }
}

