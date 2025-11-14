import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * SliderComponent - Interactive slider for numeric value selection
 * Supports dragging, min/max ranges, and onChange callbacks
 * Used for volume controls, camera smoothing, and other numeric settings
 */
export class SliderComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0;
    public x: number;
    public y: number;
    public sprite: any;
    public id: string;
    public scale: number = 1.0;
    public isHovered: boolean = false;

    private min: number;
    private max: number;
    private value: number;
    private dragging: boolean = false;
    private changeCallback?: (value: number) => void;

    constructor(sprite: any, x: number, y: number, min: number, max: number, initialValue: number, id: string) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.min = min;
        this.max = max;
        this.value = this.clamp(initialValue);
        this.id = id;
    }

    /**
     * Get minimum value
     */
    getMin(): number {
        return this.min;
    }

    /**
     * Get maximum value
     */
    getMax(): number {
        return this.max;
    }

    /**
     * Get current value
     */
    getValue(): number {
        return this.value;
    }

    /**
     * Set value (clamped to range)
     */
    setValue(newValue: number): void {
        const clamped = this.clamp(newValue);
        if (clamped !== this.value) {
            this.value = clamped;
            if (this.changeCallback) {
                this.changeCallback(this.value);
            }
        }
    }

    /**
     * Set onChange callback
     */
    onChange(callback: (value: number) => void): void {
        this.changeCallback = callback;
    }

    /**
     * Check if mouse is over slider track
     */
    isMouseOver(mouseX: number, mouseY: number): boolean {
        const trackWidth = this.sprite.width * this.scale;
        const trackHeight = this.sprite.height * this.scale;
        const halfWidth = trackWidth / 2;
        const halfHeight = trackHeight / 2;

        return (
            mouseX >= this.x - halfWidth &&
            mouseX <= this.x + halfWidth &&
            mouseY >= this.y - halfHeight &&
            mouseY <= this.y + halfHeight
        );
    }

    /**
     * Handle mouse down (start dragging)
     */
    handleMouseDown(mouseX: number, mouseY: number): void {
        if (this.isMouseOver(mouseX, mouseY)) {
            this.dragging = true;
            this.updateValueFromMouse(mouseX);
        }
    }

    /**
     * Handle mouse drag (update value)
     */
    handleMouseDrag(mouseX: number, _mouseY: number): void {
        if (this.dragging) {
            this.updateValueFromMouse(mouseX);
        }
    }

    /**
     * Handle mouse up (stop dragging)
     */
    handleMouseUp(): void {
        this.dragging = false;
    }

    /**
     * Handle mouse move (update hover state)
     */
    handleMouseMove(mouseX: number, mouseY: number): void {
        this.isHovered = this.isMouseOver(mouseX, mouseY);
    }

    /**
     * Check if currently dragging
     */
    isDragging(): boolean {
        return this.dragging;
    }

    /**
     * Set hover state
     */
    setHovered(hovered: boolean): void {
        this.isHovered = hovered;
    }

    /**
     * Get handle position in screen coordinates
     */
    getHandlePosition(): number {
        const trackWidth = this.sprite.width * this.scale;
        const leftEdge = this.x - trackWidth / 2;
        const t = this.normalizeValue();
        return leftEdge + t * trackWidth;
    }

    /**
     * Update value from mouse X position
     */
    private updateValueFromMouse(mouseX: number): void {
        const trackWidth = this.sprite.width * this.scale;
        const leftEdge = this.x - trackWidth / 2;
        const rightEdge = this.x + trackWidth / 2;

        // Clamp mouse to track bounds
        const clampedX = Math.max(leftEdge, Math.min(rightEdge, mouseX));

        // Convert to normalized position (0-1)
        const t = (clampedX - leftEdge) / trackWidth;

        // Convert to value in range
        const newValue = this.min + t * (this.max - this.min);
        this.setValue(newValue);
    }

    /**
     * Normalize current value to 0-1 range
     */
    private normalizeValue(): number {
        if (this.max === this.min) {
            return 0;
        }
        return (this.value - this.min) / (this.max - this.min);
    }

    /**
     * Clamp value to min/max range
     */
    private clamp(val: number): number {
        return Math.max(this.min, Math.min(this.max, val));
    }

    /**
     * Render slider with track and handle
     */
    render(graphics: any): void {
        graphics.push();

        // Draw track
        const trackWidth = this.sprite.width * this.scale;
        const trackHeight = this.sprite.height * this.scale;
        
        graphics.fill(150);
        graphics.rect(this.x - trackWidth / 2, this.y - trackHeight / 2, trackWidth, trackHeight);

        // Draw filled portion
        const handleX = this.getHandlePosition();
        const fillWidth = handleX - (this.x - trackWidth / 2);
        graphics.fill(100, 150, 255);
        graphics.rect(this.x - trackWidth / 2, this.y - trackHeight / 2, fillWidth, trackHeight);

        // Draw handle
        const handleSize = trackHeight * 1.5;
        if (this.isHovered || this.dragging) {
            graphics.fill(150, 200, 255);
        } else {
            graphics.fill(255);
        }
        graphics.stroke(0);
        graphics.strokeWeight(2);
        graphics.ellipse(handleX, this.y, handleSize, handleSize);

        graphics.pop();
    }
}
