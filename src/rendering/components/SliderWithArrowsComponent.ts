import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * SliderWithArrowsComponent - Enhanced slider with increment/decrement arrows
 * 
 * Combines SliderComponent drag interaction with arrow buttons for fine control.
 * Default arrow step is 1% (0.01) of the value range.
 * 
 * Layout: [◀] [======●======] [▶]
 * 
 * Features:
 * - Drag slider handle for continuous adjustment
 * - Click arrows for precise 1% increments/decrements
 * - Hover highlighting on arrows and track
 * - Configurable arrow step size
 * - onChange callback for all value changes
 */
export class SliderWithArrowsComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0;
    public x: number;
    public y: number;
    public sprite: any;
    public id: string;
    public scale: number = 1.0;

    private min: number;
    private max: number;
    private value: number;
    private arrowStep: number = 0.01; // 1% by default
    private dragging: boolean = false;
    private changeCallback?: (value: number) => void;

    // Hover states
    private leftArrowHover: boolean = false;
    private rightArrowHover: boolean = false;
    private trackHover: boolean = false;

    // Dimensions
    private readonly ARROW_SIZE = 20;
    private readonly ARROW_MARGIN = 10;

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
     * Get current value
     */
    getValue(): number {
        return this.value;
    }

    /**
     * Set value (clamped to bounds)
     */
    setValue(value: number): void {
        const newValue = this.clamp(value);
        if (newValue !== this.value) {
            this.value = newValue;
            if (this.changeCallback) {
                this.changeCallback(this.value);
            }
        }
    }

    /**
     * Increment value by arrow step
     */
    incrementByArrow(): void {
        this.setValue(this.value + this.arrowStep);
    }

    /**
     * Decrement value by arrow step
     */
    decrementByArrow(): void {
        this.setValue(this.value - this.arrowStep);
    }

    /**
     * Set custom arrow step amount
     */
    setArrowStep(step: number): void {
        this.arrowStep = step;
    }

    /**
     * Set onChange callback
     */
    onChange(callback: (value: number) => void): void {
        this.changeCallback = callback;
    }

    /**
     * Check if dragging
     */
    isDragging(): boolean {
        return this.dragging;
    }

    /**
     * Check if mouse is over slider track
     */
    isMouseOverTrack(mouseX: number, mouseY: number): boolean {
        const trackWidth = this.sprite.width * this.scale;
        const trackHeight = this.sprite.height * this.scale;
        const trackX = this.x;
        const trackY = this.y;

        return (
            mouseX >= trackX - trackWidth / 2 &&
            mouseX <= trackX + trackWidth / 2 &&
            mouseY >= trackY - trackHeight / 2 &&
            mouseY <= trackY + trackHeight / 2
        );
    }

    /**
     * Check if mouse is over left arrow
     */
    isMouseOverLeftArrow(mouseX: number, mouseY: number): boolean {
        const trackWidth = this.sprite.width * this.scale;
        const leftArrowX = this.x - trackWidth / 2 - this.ARROW_MARGIN - this.ARROW_SIZE / 2;
        const leftArrowY = this.y;

        return (
            mouseX >= leftArrowX - this.ARROW_SIZE / 2 &&
            mouseX <= leftArrowX + this.ARROW_SIZE / 2 &&
            mouseY >= leftArrowY - this.ARROW_SIZE / 2 &&
            mouseY <= leftArrowY + this.ARROW_SIZE / 2
        );
    }

    /**
     * Check if mouse is over right arrow
     */
    isMouseOverRightArrow(mouseX: number, mouseY: number): boolean {
        const trackWidth = this.sprite.width * this.scale;
        const rightArrowX = this.x + trackWidth / 2 + this.ARROW_MARGIN + this.ARROW_SIZE / 2;
        const rightArrowY = this.y;

        return (
            mouseX >= rightArrowX - this.ARROW_SIZE / 2 &&
            mouseX <= rightArrowX + this.ARROW_SIZE / 2 &&
            mouseY >= rightArrowY - this.ARROW_SIZE / 2 &&
            mouseY <= rightArrowY + this.ARROW_SIZE / 2
        );
    }

    /**
     * Hover state queries
     */
    isLeftArrowHovered(): boolean {
        return this.leftArrowHover;
    }

    isRightArrowHovered(): boolean {
        return this.rightArrowHover;
    }

    isTrackHovered(): boolean {
        return this.trackHover;
    }

    /**
     * Handle mouse down (start dragging)
     */
    handleMouseDown(mouseX: number, mouseY: number): void {
        if (this.isMouseOverTrack(mouseX, mouseY)) {
            this.dragging = true;
            this.updateValueFromMouseX(mouseX);
        }
    }

    /**
     * Handle mouse up (stop dragging)
     */
    handleMouseUp(): void {
        this.dragging = false;
    }

    /**
     * Handle mouse move (update hover states and drag)
     */
    handleMouseMove(mouseX: number, mouseY: number): void {
        // Update hover states
        this.leftArrowHover = this.isMouseOverLeftArrow(mouseX, mouseY);
        this.rightArrowHover = this.isMouseOverRightArrow(mouseX, mouseY);
        this.trackHover = this.isMouseOverTrack(mouseX, mouseY);

        // Update value if dragging
        if (this.dragging) {
            this.updateValueFromMouseX(mouseX);
        }
    }

    /**
     * Handle click (arrow buttons)
     */
    handleClick(mouseX: number, mouseY: number): void {
        // Ignore arrow clicks while dragging
        if (this.dragging) return;

        if (this.isMouseOverLeftArrow(mouseX, mouseY)) {
            this.decrementByArrow();
        } else if (this.isMouseOverRightArrow(mouseX, mouseY)) {
            this.incrementByArrow();
        } else if (this.isMouseOverTrack(mouseX, mouseY)) {
            // Allow clicking on track to jump to position
            this.updateValueFromMouseX(mouseX);
        }
    }

    /**
     * Update value based on mouse X position on track
     */
    private updateValueFromMouseX(mouseX: number): void {
        const trackWidth = this.sprite.width * this.scale;
        const trackLeft = this.x - trackWidth / 2;
        const trackRight = this.x + trackWidth / 2;

        // Clamp mouse to track bounds
        const clampedX = Math.max(trackLeft, Math.min(trackRight, mouseX));

        // Calculate percentage along track
        const percentage = (clampedX - trackLeft) / trackWidth;

        // Map to value range
        const newValue = this.min + percentage * (this.max - this.min);
        this.setValue(newValue);
    }

    /**
     * Clamp value to min/max bounds
     */
    private clamp(value: number): number {
        return Math.max(this.min, Math.min(this.max, value));
    }

    /**
     * Calculate handle position on track
     */
    private getHandleX(): number {
        if (this.max === this.min) return this.x;

        const trackWidth = this.sprite.width * this.scale;
        const percentage = (this.value - this.min) / (this.max - this.min);
        return this.x - trackWidth / 2 + percentage * trackWidth;
    }

    /**
     * Render slider with arrows
     */
    render(graphics: any): void {
        graphics.push();

        const trackWidth = this.sprite.width * this.scale;
        const trackHeight = this.sprite.height * this.scale;

        // Render left arrow
        this.renderArrow(graphics, 'left');

        // Render slider track
        if (this.trackHover || this.dragging) {
            graphics.fill(80, 80, 100);
        } else {
            graphics.fill(60, 60, 70);
        }
        graphics.stroke(100);
        graphics.strokeWeight(2);
        graphics.rect(
            this.x - trackWidth / 2,
            this.y - trackHeight / 2,
            trackWidth,
            trackHeight,
            trackHeight / 2
        );

        // Render handle
        const handleX = this.getHandleX();
        const handleRadius = trackHeight * 0.8;

        if (this.dragging) {
            graphics.fill(150, 200, 255);
        } else if (this.trackHover) {
            graphics.fill(120, 150, 200);
        } else {
            graphics.fill(100, 140, 200);
        }
        graphics.stroke(200);
        graphics.strokeWeight(2);
        graphics.circle(handleX, this.y, handleRadius);

        // Render right arrow
        this.renderArrow(graphics, 'right');

        graphics.pop();
    }

    /**
     * Render arrow button (left or right)
     */
    private renderArrow(graphics: any, direction: 'left' | 'right'): void {
        const trackWidth = this.sprite.width * this.scale;
        const arrowX = direction === 'left'
            ? this.x - trackWidth / 2 - this.ARROW_MARGIN - this.ARROW_SIZE / 2
            : this.x + trackWidth / 2 + this.ARROW_MARGIN + this.ARROW_SIZE / 2;

        const isHovered = direction === 'left' ? this.leftArrowHover : this.rightArrowHover;

        // Arrow background
        if (isHovered) {
            graphics.fill(100, 140, 200);
        } else {
            graphics.fill(60, 60, 70);
        }
        graphics.stroke(100);
        graphics.strokeWeight(2);
        graphics.rect(
            arrowX - this.ARROW_SIZE / 2,
            this.y - this.ARROW_SIZE / 2,
            this.ARROW_SIZE,
            this.ARROW_SIZE,
            4
        );

        // Arrow symbol (◀ or ▶)
        graphics.fill(255);
        graphics.noStroke();
        graphics.textAlign((window as any).CENTER, (window as any).CENTER);
        graphics.textSize(14);
        const symbol = direction === 'left' ? '◀' : '▶';
        graphics.text(symbol, arrowX, this.y);
    }
}
