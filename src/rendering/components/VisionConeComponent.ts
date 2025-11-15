/**
 * Vision Cone Debug Visualization
 * Renders boss vision cone for debugging
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { normalizeAngle } from '../../utils/helpers';

/**
 * VisionConeComponent - Debug visualization for entity vision cones
 */
export class VisionConeComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.DEBUG;
    public depth: number;
    
    private x: number;
    private y: number;
    private direction: number; // Radians
    private angle: number; // Cone angle in radians
    private range: number;
    private detectedEntities: Set<string> = new Set();
    private isActive: boolean = true;

    constructor(
        x: number,
        y: number,
        direction: number,
        angle: number,
        range: number,
        depth: number = 0
    ) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.angle = angle;
        this.range = range;
        this.depth = depth;
    }

    /**
     * Update vision cone position and direction
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Update vision direction
     */
    setDirection(direction: number): void {
        this.direction = normalizeAngle(direction);
    }

    /**
     * Update vision parameters
     */
    setVisionParams(angle: number, range: number): void {
        this.angle = angle;
        this.range = range;
    }

    /**
     * Mark entities as detected (for color change)
     */
    setDetectedEntities(entityIds: Set<string>): void {
        this.detectedEntities = entityIds;
    }

    /**
     * Toggle visibility
     */
    setActive(active: boolean): void {
        this.isActive = active;
    }

    /**
     * Render vision cone
     */
    render(graphics: any): void {
        if (!this.isActive) return;

        graphics.push();
        graphics.translate(this.x, this.y);

        // Determine color based on detection
        const hasDetection = this.detectedEntities.size > 0;
        const fillColor = hasDetection 
            ? [100, 255, 100, 60]  // Green when detecting
            : [255, 100, 100, 60]; // Red when not detecting
        const strokeColor = hasDetection
            ? [100, 255, 100, 150]
            : [255, 100, 100, 150];

        // Draw cone using arc
        graphics.fill(...fillColor);
        graphics.stroke(...strokeColor);
        graphics.strokeWeight(2);

        // Calculate start and end angles for arc
        const halfAngle = this.angle / 2;
        const startAngle = this.direction - halfAngle;
        const endAngle = this.direction + halfAngle;

        // Draw filled arc (cone shape)
        graphics.arc(0, 0, this.range * 2, this.range * 2, startAngle, endAngle, graphics.PIE || 'pie');

        // Draw direction indicator (line pointing forward)
        graphics.stroke(...strokeColor);
        graphics.strokeWeight(3);
        const dirX = Math.cos(this.direction) * this.range;
        const dirY = Math.sin(this.direction) * this.range;
        graphics.line(0, 0, dirX, dirY);

        // Draw range circle outline
        graphics.noFill();
        graphics.stroke(...strokeColor);
        graphics.strokeWeight(1);
        graphics.circle(0, 0, this.range * 2);

        graphics.pop();

        // Draw detected entity markers
        if (hasDetection) {
            this.detectedEntities.forEach(() => {
                // Visual indicator could be enhanced with entity positions
                // For now, just show detection via cone color
            });
        }
    }

    /**
     * Check if a point is inside the vision cone
     * Useful for testing
     */
    isPointInCone(targetX: number, targetY: number): boolean {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check range
        if (distance > this.range) return false;

        // Check angle
        const angleToTarget = Math.atan2(dy, dx);
        const normalizedTarget = normalizeAngle(angleToTarget);
        const normalizedDirection = normalizeAngle(this.direction);
        
        let angleDiff = Math.abs(normalizedTarget - normalizedDirection);
        // Handle wrap-around
        if (angleDiff > Math.PI) {
            angleDiff = Math.PI * 2 - angleDiff;
        }

        return angleDiff <= this.angle / 2;
    }
}
