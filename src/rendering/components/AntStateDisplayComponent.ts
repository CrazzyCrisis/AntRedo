import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';

/**
 * Debug overlay component for visualizing ant AI states
 * Shows state labels, pathfinding routes, and target indicators
 * Registered on RenderLayer.DEBUG
 */
export class AntStateDisplayComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.DEBUG;
    public depth: number = 0;
    
    private antId: string;
    private x: number;
    private y: number;
    private currentState: string = 'IDLE';
    private path: Array<{x: number, y: number}> = [];
    private target: {x: number, y: number} | null = null;
    private isActive: boolean = true;
    
    // Visual settings
    private labelOffsetY: number = -20; // Above sprite
    private labelFontSize: number = 10;
    private pathColor: string = '#00FF00'; // Green for path
    private pathAlpha: number = 150;
    private targetColor: string = '#FF4444'; // Red for target
    private targetSize: number = 8;
    
    // State color mapping
    private stateColors: {[key: string]: string} = {
        'IDLE': '#888888',
        'GATHERING': '#FFD700',
        'RETURNING': '#4CAF50',
        'WANDERING': '#2196F3',
        'FLEEING': '#FF5722',
        'ATTACKING': '#F44336',
        'BUILDING': '#9C27B0',
        'FOLLOWING': '#00BCD4',
        'PATROLLING': '#607D8B',
        'DEAD': '#424242'
    };
    
    constructor(antId: string, x: number, y: number) {
        this.antId = antId;
        this.x = x;
        this.y = y;
        
        this.setupEventListeners();
    }
    
    /**
     * Subscribe to ant state changes
     */
    private setupEventListeners(): void {
        // Update state when ant changes state
        EventBus.on(GameEvents.ANT_STATE_CHANGED, (id: string, newState: string) => {
            if (id === this.antId) {
                this.currentState = newState;
            }
        });
        
        // Update position when ant moves
        EventBus.on(GameEvents.ENTITY_MOVED, (id: string, x: number, y: number) => {
            if (id === this.antId) {
                this.x = x;
                this.y = y;
            }
        });
        
        // Update path when pathfinding recalculates
        EventBus.on(GameEvents.ANT_PATH_UPDATED, (id: string, newPath: Array<{x: number, y: number}>) => {
            if (id === this.antId) {
                this.path = newPath;
            }
        });
        
        // Update target when ant acquires new target
        EventBus.on(GameEvents.ANT_TARGET_ACQUIRED, (id: string, targetX: number, targetY: number) => {
            if (id === this.antId) {
                this.target = { x: targetX, y: targetY };
            }
        });
        
        // Clear target when ant loses target
        EventBus.on(GameEvents.ANT_TARGET_LOST, (id: string) => {
            if (id === this.antId) {
                this.target = null;
            }
        });
        
        // Clean up on entity destruction
        EventBus.once(GameEvents.ENTITY_DESTROYED, (id: string) => {
            if (id === this.antId) {
                this.isActive = false;
            }
        });
    }
    
    /**
     * Update ant position manually (if not using events)
     */
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Set current state manually
     */
    public setState(state: string): void {
        this.currentState = state;
    }
    
    /**
     * Set pathfinding path
     */
    public setPath(path: Array<{x: number, y: number}>): void {
        this.path = path;
    }
    
    /**
     * Set target position
     */
    public setTarget(x: number | null, y?: number): void {
        if (x === null) {
            this.target = null;
        } else {
            this.target = { x, y: y! };
        }
    }
    
    /**
     * Toggle visibility
     */
    public setActive(active: boolean): void {
        this.isActive = active;
    }
    
    /**
     * Render debug overlay
     */
    render(graphics: any): void {
        if (!this.isActive) return;
        
        graphics.push();
        
        // 1. Draw pathfinding path (if exists)
        if (this.path.length > 1) {
            graphics.stroke(this.pathColor);
            graphics.strokeWeight(2);
            // Use alpha for path transparency
            const pathColorRGB = this.hexToRgb(this.pathColor);
            graphics.stroke(pathColorRGB.r, pathColorRGB.g, pathColorRGB.b, this.pathAlpha);
            graphics.noFill();
            
            // Draw line segments
            graphics.beginShape();
            this.path.forEach(point => {
                graphics.vertex(point.x, point.y);
            });
            graphics.endShape();
            
            // Draw waypoint dots
            graphics.fill(pathColorRGB.r, pathColorRGB.g, pathColorRGB.b, this.pathAlpha);
            graphics.noStroke();
            this.path.forEach(point => {
                graphics.circle(point.x, point.y, 4);
            });
        }
        
        // 2. Draw target indicator (if exists)
        if (this.target) {
            const targetColorRGB = this.hexToRgb(this.targetColor);
            
            // Draw target circle
            graphics.noFill();
            graphics.stroke(targetColorRGB.r, targetColorRGB.g, targetColorRGB.b);
            graphics.strokeWeight(2);
            graphics.circle(this.target.x, this.target.y, this.targetSize * 2);
            
            // Draw crosshair
            graphics.line(
                this.target.x - this.targetSize,
                this.target.y,
                this.target.x + this.targetSize,
                this.target.y
            );
            graphics.line(
                this.target.x,
                this.target.y - this.targetSize,
                this.target.x,
                this.target.y + this.targetSize
            );
            
            // Draw arrow from ant to target
            graphics.strokeWeight(1);
            graphics.stroke(targetColorRGB.r, targetColorRGB.g, targetColorRGB.b, 100);
            graphics.line(this.x, this.y, this.target.x, this.target.y);
            
            // Draw arrowhead
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            const arrowSize = 8;
            graphics.fill(targetColorRGB.r, targetColorRGB.g, targetColorRGB.b, 100);
            graphics.noStroke();
            graphics.push();
            graphics.translate(this.target.x, this.target.y);
            graphics.rotate(angle);
            graphics.triangle(0, 0, -arrowSize, -arrowSize / 2, -arrowSize, arrowSize / 2);
            graphics.pop();
        }
        
        // 3. Draw state label above ant
        const stateColor = this.stateColors[this.currentState] || '#FFFFFF';
        const stateColorRGB = this.hexToRgb(stateColor);
        
        // Background for label (semi-transparent black)
        graphics.fill(0, 0, 0, 180);
        graphics.noStroke();
        const textWidth = graphics.textWidth(this.currentState) || this.currentState.length * 7;
        const padding = 4;
        graphics.rect(
            this.x - textWidth / 2 - padding,
            this.y + this.labelOffsetY - this.labelFontSize - padding,
            textWidth + padding * 2,
            this.labelFontSize + padding * 2,
            3 // Rounded corners
        );
        
        // State text
        graphics.fill(stateColorRGB.r, stateColorRGB.g, stateColorRGB.b);
        graphics.noStroke();
        graphics.textAlign('center' as any, 'center' as any);
        graphics.textSize(this.labelFontSize);
        graphics.text(this.currentState, this.x, this.y + this.labelOffsetY);
        
        graphics.pop();
    }
    
    /**
     * Helper: Convert hex color to RGB
     */
    private hexToRgb(hex: string): {r: number, g: number, b: number} {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    /**
     * Cleanup
     */
    public destroy(): void {
        this.isActive = false;
        // EventBus listeners will be garbage collected when component is destroyed
    }
}
