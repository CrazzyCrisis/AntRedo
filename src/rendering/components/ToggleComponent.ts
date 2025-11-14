import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * ToggleComponent - Boolean toggle switch UI component
 * Supports on/off states, click interaction, and onChange callbacks
 * Used for enable/disable settings like mute, effects, etc.
 */
export class ToggleComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0;
    public x: number;
    public y: number;
    public sprite: any;
    public id: string;
    public scale: number = 1.0;
    public isHovered: boolean = false;

    private state: boolean;
    private label: string = '';
    private changeCallback?: (state: boolean) => void;

    constructor(sprite: any, x: number, y: number, initialState: boolean, id: string) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.state = initialState;
        this.id = id;
    }

    /**
     * Check if toggle is on
     */
    isOn(): boolean {
        return this.state;
    }

    /**
     * Set toggle state
     */
    setOn(state: boolean): void {
        if (state !== this.state) {
            this.state = state;
            if (this.changeCallback) {
                this.changeCallback(this.state);
            }
        }
    }

    /**
     * Toggle state (flip between on/off)
     */
    toggle(): void {
        this.setOn(!this.state);
    }

    /**
     * Set onChange callback
     */
    onChange(callback: (state: boolean) => void): void {
        this.changeCallback = callback;
    }

    /**
     * Set label text
     */
    setLabel(label: string): void {
        this.label = label;
    }

    /**
     * Get label text
     */
    getLabel(): string {
        return this.label;
    }

    /**
     * Check if mouse is over toggle
     */
    isMouseOver(mouseX: number, mouseY: number): boolean {
        const width = this.sprite.width * this.scale;
        const height = this.sprite.height * this.scale;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        return (
            mouseX >= this.x - halfWidth &&
            mouseX <= this.x + halfWidth &&
            mouseY >= this.y - halfHeight &&
            mouseY <= this.y + halfHeight
        );
    }

    /**
     * Handle click (toggle state)
     */
    handleClick(mouseX: number, mouseY: number): void {
        if (this.isMouseOver(mouseX, mouseY)) {
            this.toggle();
        }
    }

    /**
     * Handle mouse move (update hover state)
     */
    handleMouseMove(mouseX: number, mouseY: number): void {
        this.isHovered = this.isMouseOver(mouseX, mouseY);
    }

    /**
     * Set hover state
     */
    setHovered(hovered: boolean): void {
        this.isHovered = hovered;
    }

    /**
     * Render toggle switch
     */
    render(graphics: any): void {
        graphics.push();

        const width = this.sprite.width * this.scale;
        const height = this.sprite.height * this.scale;

        // Draw track/background
        if (this.state) {
            graphics.fill(100, 200, 100); // Green when on
        } else {
            graphics.fill(200, 100, 100); // Red when off
        }
        
        if (this.isHovered) {
            graphics.strokeWeight(3);
            graphics.stroke(255, 255, 150);
        } else {
            graphics.strokeWeight(2);
            graphics.stroke(0);
        }
        
        graphics.rect(this.x - width / 2, this.y - height / 2, width, height, height / 2);

        // Draw handle/knob
        const handleRadius = height * 0.4;
        const handleX = this.state
            ? this.x + width / 4  // Right side when on
            : this.x - width / 4; // Left side when off

        graphics.fill(255);
        graphics.stroke(0);
        graphics.strokeWeight(2);
        graphics.ellipse(handleX, this.y, handleRadius * 2, handleRadius * 2);

        graphics.pop();
    }
}
