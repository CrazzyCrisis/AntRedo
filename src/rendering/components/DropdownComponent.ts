import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * DropdownComponent - Dropdown selection UI component
 * Supports multiple options, expansion/collapse, and onChange callbacks
 * Used for multi-choice settings like colorblind modes, text sizes, etc.
 */
export class DropdownComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0;
    public x: number;
    public y: number;
    public sprite: any;
    public id: string;
    public scale: number = 1.0;
    public isHovered: boolean = false;

    private options: string[];
    private selectedIndex: number;
    private expanded: boolean = false;
    private label: string = '';
    private hoveredOption: number = -1;
    private changeCallback?: (value: string, index: number) => void;

    constructor(sprite: any, x: number, y: number, options: string[], id: string) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.options = options;
        this.selectedIndex = options.length > 0 ? 0 : -1;
        this.id = id;
    }

    /**
     * Get all options
     */
    getOptions(): string[] {
        return this.options;
    }

    /**
     * Get number of options
     */
    getOptionsCount(): number {
        return this.options.length;
    }

    /**
     * Get selected index
     */
    getSelectedIndex(): number {
        return this.selectedIndex;
    }

    /**
     * Get selected value
     */
    getSelectedValue(): string {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.options.length) {
            return this.options[this.selectedIndex];
        }
        return '';
    }

    /**
     * Set selected index (clamped to valid range)
     */
    setSelectedIndex(index: number): void {
        if (this.options.length === 0) return;

        const clampedIndex = Math.max(0, Math.min(this.options.length - 1, index));
        if (clampedIndex !== this.selectedIndex) {
            this.selectedIndex = clampedIndex;
            if (this.changeCallback) {
                this.changeCallback(this.getSelectedValue(), this.selectedIndex);
            }
        }
    }

    /**
     * Set selected by value
     */
    setSelectedValue(value: string): void {
        const index = this.options.indexOf(value);
        if (index !== -1) {
            this.setSelectedIndex(index);
        }
    }

    /**
     * Select next option (with wrapping)
     */
    selectNext(): void {
        if (this.options.length === 0) return;
        this.setSelectedIndex((this.selectedIndex + 1) % this.options.length);
    }

    /**
     * Select previous option (with wrapping)
     */
    selectPrevious(): void {
        if (this.options.length === 0) return;
        this.setSelectedIndex((this.selectedIndex - 1 + this.options.length) % this.options.length);
    }

    /**
     * Check if dropdown is expanded
     */
    isExpanded(): boolean {
        return this.expanded;
    }

    /**
     * Set expanded state
     */
    setExpanded(expanded: boolean): void {
        this.expanded = expanded;
        if (!expanded) {
            this.hoveredOption = -1;
        }
    }

    /**
     * Toggle expanded state
     */
    toggleExpanded(): void {
        this.setExpanded(!this.expanded);
    }

    /**
     * Set onChange callback
     */
    onChange(callback: (value: string, index: number) => void): void {
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
     * Get hovered option index (-1 if none)
     */
    getHoveredOption(): number {
        return this.hoveredOption;
    }

    /**
     * Check if mouse is over main button
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
     * Get option index at mouse position (when expanded)
     */
    getOptionAtPosition(mouseX: number, mouseY: number): number {
        if (!this.expanded) return -1;

        const width = this.sprite.width * this.scale;
        const height = this.sprite.height * this.scale;
        const halfWidth = width / 2;

        // Check if within horizontal bounds
        if (mouseX < this.x - halfWidth || mouseX > this.x + halfWidth) {
            return -1;
        }

        // Check each option's vertical bounds
        for (let i = 0; i < this.options.length; i++) {
            const optionY = this.y + (i + 1) * height;
            if (mouseY >= optionY - height / 2 && mouseY <= optionY + height / 2) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Handle click
     */
    handleClick(mouseX: number, mouseY: number): void {
        // Check if clicking main button
        if (this.isMouseOver(mouseX, mouseY)) {
            this.toggleExpanded();
            return;
        }

        // Check if clicking an option (when expanded)
        if (this.expanded) {
            const optionIndex = this.getOptionAtPosition(mouseX, mouseY);
            if (optionIndex !== -1) {
                this.setSelectedIndex(optionIndex);
                this.setExpanded(false);
                return;
            }

            // Clicked outside - collapse
            this.setExpanded(false);
        }
    }

    /**
     * Handle mouse move (update hover state)
     */
    handleMouseMove(mouseX: number, mouseY: number): void {
        this.isHovered = this.isMouseOver(mouseX, mouseY);

        if (this.expanded) {
            this.hoveredOption = this.getOptionAtPosition(mouseX, mouseY);
        } else {
            this.hoveredOption = -1;
        }
    }

    /**
     * Set hover state
     */
    setHovered(hovered: boolean): void {
        this.isHovered = hovered;
    }

    /**
     * Get total height when expanded
     */
    getExpandedHeight(): number {
        const height = this.sprite.height * this.scale;
        return height * (this.options.length + 1);
    }

    /**
     * Render dropdown
     */
    render(graphics: any): void {
        graphics.push();

        const width = this.sprite.width * this.scale;
        const height = this.sprite.height * this.scale;

        // Draw main button
        if (this.isHovered && !this.expanded) {
            graphics.fill(200);
        } else {
            graphics.fill(255);
        }
        graphics.stroke(0);
        graphics.strokeWeight(2);
        graphics.rect(this.x - width / 2, this.y - height / 2, width, height);

        // Draw selected value text
        graphics.fill(0);
        graphics.textAlign(graphics.CENTER, graphics.CENTER);
        graphics.textSize(14);
        graphics.text(this.getSelectedValue(), this.x, this.y);

        // Draw arrow indicator
        const arrowX = this.x + width / 2 - 15;
        const arrowY = this.y;
        graphics.fill(0);
        graphics.triangle(
            arrowX - 5, arrowY - 3,
            arrowX + 5, arrowY - 3,
            arrowX, arrowY + 3
        );

        // Draw options (when expanded)
        if (this.expanded) {
            for (let i = 0; i < this.options.length; i++) {
                const optionY = this.y + (i + 1) * height;

                // Highlight hovered or selected option
                if (i === this.hoveredOption) {
                    graphics.fill(220);
                } else if (i === this.selectedIndex) {
                    graphics.fill(230);
                } else {
                    graphics.fill(255);
                }

                graphics.stroke(0);
                graphics.strokeWeight(2);
                graphics.rect(this.x - width / 2, optionY - height / 2, width, height);

                // Draw option text
                graphics.fill(0);
                graphics.textAlign(graphics.CENTER, graphics.CENTER);
                graphics.textSize(14);
                graphics.text(this.options[i], this.x, optionY);
            }
        }

        graphics.pop();
    }
}
