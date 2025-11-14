import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

/**
 * KeybindComponent - Keybind display and rebinding UI component
 * Displays current key bindings and handles rebinding with conflict detection
 * Used in control settings for rebinding game actions
 */
export class KeybindComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 0;
    public x: number;
    public y: number;
    public sprite: any;
    public id: string;
    public scale: number = 1.0;
    public isHovered: boolean = false;

    private actionName: string;
    private keys: string[];
    private listening: boolean = false;
    private hasConflictState: boolean = false;
    private conflictingActions: string[] = [];
    private changeCallback?: (keys: string[], action: string) => void;

    constructor(sprite: any, x: number, y: number, actionName: string, keys: string[], id: string) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.actionName = actionName;
        this.keys = keys;
        this.id = id;
    }

    /**
     * Get action name
     */
    getActionName(): string {
        return this.actionName;
    }

    /**
     * Get current keys
     */
    getKeys(): string[] {
        return [...this.keys]; // Return copy
    }

    /**
     * Set keys
     */
    setKeys(keys: string[]): void {
        // Check if keys actually changed
        if (this.keysEqual(this.keys, keys)) {
            return;
        }

        this.keys = [...keys];
        if (this.changeCallback) {
            this.changeCallback(this.keys, this.actionName);
        }
    }

    /**
     * Check if listening for key input
     */
    isListening(): boolean {
        return this.listening;
    }

    /**
     * Start listening for key input
     */
    startListening(): void {
        this.listening = true;
    }

    /**
     * Stop listening for key input
     */
    stopListening(): void {
        this.listening = false;
    }

    /**
     * Toggle listening state
     */
    toggleListening(): void {
        this.listening = !this.listening;
    }

    /**
     * Handle key press (when listening)
     */
    handleKeyPress(key: string): void {
        if (!this.listening) return;

        // Ignore empty or whitespace keys
        if (!key || key.trim().length === 0) {
            return;
        }

        // Set the new key and stop listening
        this.setKeys([key]);
        this.stopListening();
    }

    /**
     * Check if has conflict
     */
    hasConflict(): boolean {
        return this.hasConflictState;
    }

    /**
     * Get conflicting actions
     */
    getConflictingActions(): string[] {
        return [...this.conflictingActions];
    }

    /**
     * Set conflict state
     */
    setConflict(hasConflict: boolean, conflictingActions: string[]): void {
        this.hasConflictState = hasConflict;
        this.conflictingActions = conflictingActions;
    }

    /**
     * Set onChange callback
     */
    onChange(callback: (keys: string[], action: string) => void): void {
        this.changeCallback = callback;
    }

    /**
     * Get display text for keys
     */
    getDisplayText(): string {
        if (this.listening) {
            return 'Press any key...';
        }

        if (this.keys.length === 0) {
            return 'None';
        }

        // Format keys for display
        return this.keys.join(', ');
    }

    /**
     * Check if mouse is over component
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
     * Handle click (start listening)
     */
    handleClick(mouseX: number, mouseY: number): void {
        if (this.isMouseOver(mouseX, mouseY)) {
            this.startListening();
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
     * Compare two key arrays for equality
     */
    private keysEqual(keys1: string[], keys2: string[]): boolean {
        if (keys1.length !== keys2.length) return false;
        for (let i = 0; i < keys1.length; i++) {
            if (keys1[i] !== keys2[i]) return false;
        }
        return true;
    }

    /**
     * Render keybind component
     */
    render(graphics: any): void {
        graphics.push();

        const width = this.sprite.width * this.scale;
        const height = this.sprite.height * this.scale;

        // Background color based on state
        if (this.listening) {
            graphics.fill(255, 255, 150); // Yellow when listening
        } else if (this.hasConflictState) {
            graphics.fill(255, 150, 150); // Red when conflict
        } else if (this.isHovered) {
            graphics.fill(220);
        } else {
            graphics.fill(255);
        }

        graphics.stroke(0);
        graphics.strokeWeight(2);
        graphics.rect(this.x - width / 2, this.y - height / 2, width, height);

        // Draw action name (left side)
        graphics.fill(0);
        graphics.textAlign(graphics.LEFT, graphics.CENTER);
        graphics.textSize(14);
        graphics.text(this.actionName, this.x - width / 2 + 10, this.y);

        // Draw keys (right side)
        const displayText = this.getDisplayText();
        graphics.textAlign(graphics.CENTER, graphics.CENTER);
        graphics.textSize(12);
        graphics.text(displayText, this.x + width / 4, this.y);

        // Draw conflict warning if present
        if (this.hasConflictState && this.conflictingActions.length > 0) {
            graphics.fill(200, 0, 0);
            graphics.textAlign(graphics.CENTER, graphics.CENTER);
            graphics.textSize(10);
            const conflictText = `Conflicts with: ${this.conflictingActions.join(', ')}`;
            graphics.text(conflictText, this.x, this.y + height / 2 + 12);
        }

        graphics.pop();
    }
}
