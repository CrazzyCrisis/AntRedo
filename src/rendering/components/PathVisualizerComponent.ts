/**
 * PathVisualizerComponent - Debug visualization for pathfinding
 * Renders the current path as a line with waypoint markers
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { PathfindingComponent } from '../../classes/components/PathfindingComponent';
import { GameObject } from '../../classes/GameObject';
import { gridToWorldCenter } from '../../utils/helpers';
import { TILE_SIZE } from '../../world/TileSystem';
import { Renderer } from '../Renderer';
import { EventBus } from '../../utils/eventBus';

export class PathVisualizerComponent implements Renderable {
    public x: number = 0;
    public y: number = 0;
    public depth: number = 999;
    public layer: RenderLayer = RenderLayer.DEBUG;

    private pathfindingComponent: PathfindingComponent;
    private renderer: Renderer;
    private lastPathLength: number = 0;
    private entityId: string;

    constructor(entity: GameObject, pathfindingComponent: PathfindingComponent, renderer: Renderer) {
        this.pathfindingComponent = pathfindingComponent;
        this.renderer = renderer;
        this.entityId = entity.id;
        
        // Listen for path events to mark layer dirty immediately
        EventBus.on('PATH_FOUND', (entityId: string) => {
            if (entityId === this.entityId) {
                this.renderer.markLayerDirty(RenderLayer.DEBUG);
            }
        });
        
        EventBus.on('PATH_COMPLETE', (entityId: string) => {
            if (entityId === this.entityId) {
                this.renderer.markLayerDirty(RenderLayer.DEBUG);
            }
        });
        
        EventBus.on('PATH_FAILED', (entityId: string) => {
            if (entityId === this.entityId) {
                this.renderer.markLayerDirty(RenderLayer.DEBUG);
            }
        });
    }

    /**
     * Render the current path
     */
    public render(graphics: any): void {
        // ALWAYS draw a test marker near world origin (0,0) in world coordinates
        graphics.noStroke();
        graphics.fill(255, 0, 255, 200); // Magenta marker
        graphics.ellipse(0, 0, 100, 100); // World origin marker
        
        if (!this.pathfindingComponent.hasPath()) {
            return;
        }

        const path = (this.pathfindingComponent as any).currentPath;
        const pathIndex = (this.pathfindingComponent as any).pathIndex;

        if (!path || path.length === 0) {
            return;
        }

        // Draw path line
        graphics.stroke(0, 255, 0, 150); // Green with transparency
        graphics.strokeWeight(3);
        graphics.noFill();

        graphics.beginShape();
        for (let i = pathIndex; i < path.length; i++) {
            const node = path[i];
            const { x: worldX, y: worldY } = gridToWorldCenter(node.col, node.row, TILE_SIZE);
            graphics.vertex(worldX, worldY);
        }
        graphics.endShape();

        // Draw waypoint markers
        graphics.noStroke();
        for (let i = pathIndex; i < path.length; i++) {
            const node = path[i];
            const { x: worldX, y: worldY } = gridToWorldCenter(node.col, node.row, TILE_SIZE);
            
            // Current target waypoint is larger and yellow
            if (i === pathIndex) {
                graphics.fill(255, 255, 0, 200); // Yellow
                graphics.ellipse(worldX, worldY, 12, 12);
            } else {
                graphics.fill(0, 255, 0, 150); // Green
                graphics.ellipse(worldX, worldY, 8, 8);
            }
        }

        // Draw final destination marker
        if (path.length > 0) {
            const finalNode = path[path.length - 1];
            const { x: worldX, y: worldY } = gridToWorldCenter(finalNode.col, finalNode.row, TILE_SIZE);
            
            graphics.stroke(255, 0, 0, 200); // Red outline
            graphics.strokeWeight(2);
            graphics.noFill();
            graphics.ellipse(worldX, worldY, 20, 20);
        }
    }

    /**
     * Update position to follow entity (not needed for static debug render)
     * Mark layer dirty when path changes
     */
    public update(_deltaTime: number): void {
        // Check if path has changed
        const path = (this.pathfindingComponent as any).currentPath;
        const currentPathLength = path ? path.length : 0;
        
        if (currentPathLength !== this.lastPathLength) {
            this.lastPathLength = currentPathLength;
            this.renderer.markLayerDirty(RenderLayer.DEBUG);
        }
        
        // Also mark dirty if actively following a path (waypoint changes)
        if (this.pathfindingComponent.isMoving()) {
            this.renderer.markLayerDirty(RenderLayer.DEBUG);
        }
    }
}
