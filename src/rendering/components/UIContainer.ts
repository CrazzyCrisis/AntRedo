import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * UIContainer - Groups UI elements with relative positioning
 * Manages child component layout and rendering
 */
export class UIContainer implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0;
    public x: number;
    public y: number;
    public children: Renderable[] = [];
    
    private childOffsets: Map<Renderable, { x: number; y: number }> = new Map();

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Add child component with relative positioning
     */
    addChild(child: Renderable, relativeX?: number, relativeY?: number): void {
        // Store original relative offset
        const offsetX = relativeX !== undefined ? relativeX : (child as any).x || 0;
        const offsetY = relativeY !== undefined ? relativeY : (child as any).y || 0;
        
        this.childOffsets.set(child, { x: offsetX, y: offsetY });
        this.children.push(child);
        
        // Update child position
        this.updateChildPosition(child);
    }

    /**
     * Remove child component
     */
    removeChild(child: Renderable): void {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            this.childOffsets.delete(child);
        }
    }

    /**
     * Set container position and update all children
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        
        // Update all child positions
        this.children.forEach(child => this.updateChildPosition(child));
    }

    /**
     * Center container horizontally within canvas width
     */
    centerHorizontally(canvasWidth: number): void {
        this.x = canvasWidth / 2;
        
        // Update all child positions
        this.children.forEach(child => this.updateChildPosition(child));
    }

    /**
     * Update child position based on container position
     */
    private updateChildPosition(child: Renderable): void {
        const offset = this.childOffsets.get(child);
        if (offset && 'x' in child && 'y' in child) {
            (child as any).x = this.x + offset.x;
            (child as any).y = this.y + offset.y;
        }
    }

    /**
     * Render all children
     */
    render(_graphics: any): void {
        // Container itself doesn't render anything
        // Children are rendered by the Renderer
    }
}
