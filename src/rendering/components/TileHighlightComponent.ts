/**
 * TileHighlightComponent - Shows the tile under the mouse cursor
 * Helps debug click-to-move coordinate conversion
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { Camera } from '../Camera';
import { TILE_SIZE } from '../../world/TileSystem';
import { Renderer } from '../Renderer';

export class TileHighlightComponent implements Renderable {
    public x: number = 0;
    public y: number = 0;
    public depth: number = 1000; // Above everything else in DEBUG layer
    public layer: RenderLayer = RenderLayer.DEBUG;

    private camera: Camera;
    private renderer: Renderer;
    private currentMouseX: number = 0;
    private currentMouseY: number = 0;
    private isVisible: boolean = false;

    constructor(camera: Camera, renderer: Renderer) {
        this.camera = camera;
        this.renderer = renderer;
    }

    /**
     * Update mouse position (call this from scene's handleMouseMove)
     */
    public updateMousePosition(screenX: number, screenY: number): void {
        this.currentMouseX = screenX;
        this.currentMouseY = screenY;
        this.isVisible = true;
        this.renderer.markLayerDirty(RenderLayer.DEBUG);
    }

    /**
     * Hide the highlight
     */
    public hide(): void {
        this.isVisible = false;
        this.renderer.markLayerDirty(RenderLayer.DEBUG);
    }

    /**
     * Render the tile highlight
     */
    public render(graphics: any): void {
        if (!this.isVisible) {
            return;
        }

        // Convert screen coordinates to world coordinates
        const { x: worldX, y: worldY } = this.camera.screenToWorld(
            this.currentMouseX,
            this.currentMouseY
        );

        // Convert world coordinates to grid coordinates
        const gridX = Math.floor(worldX / TILE_SIZE);
        const gridY = Math.floor(worldY / TILE_SIZE);

        // Convert back to world coordinates (top-left of tile)
        const tileWorldX = gridX * TILE_SIZE;
        const tileWorldY = gridY * TILE_SIZE;

        // Draw highlight rectangle
        graphics.noFill();
        graphics.stroke(255, 255, 0, 200); // Yellow highlight
        graphics.strokeWeight(3);
        graphics.rect(tileWorldX, tileWorldY, TILE_SIZE, TILE_SIZE);

        // Draw crosshair at exact mouse position
        graphics.stroke(255, 0, 0, 200); // Red crosshair
        graphics.strokeWeight(2);
        const crosshairSize = 10;
        graphics.line(
            worldX - crosshairSize,
            worldY,
            worldX + crosshairSize,
            worldY
        );
        graphics.line(
            worldX,
            worldY - crosshairSize,
            worldX,
            worldY + crosshairSize
        );
    }

    public update(_deltaTime: number): void {
        // Mark dirty every frame to ensure smooth updates
        if (this.isVisible) {
            this.renderer.markLayerDirty(RenderLayer.DEBUG);
        }
    }
}
