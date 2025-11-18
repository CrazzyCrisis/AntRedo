/**
 * NumberInputComponent - Reusable numeric input with increment/decrement arrows
 * 
 * Features:
 * - Text input box for direct numeric entry
 * - Left/Right arrow buttons for fine-tuning (+/-3% by default)
 * - Value bounds enforcement
 * - Focus state management
 * - Hover visual feedback
 * - onChange callback support
 * 
 * Usage:
 * ```typescript
 * const input = new NumberInputComponent(x, y, min, max, initialValue, 'my_input');
 * input.onChange((value) => console.log('New value:', value));
 * input.setStep(0.05); // Custom step amount
 * ```
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

// p5.js constants
declare const CENTER: any;
declare const LEFT: any;
declare const RIGHT: any;

export class NumberInputComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 10;
    public id: string;
    public x: number;
    public y: number;
    
    private min: number;
    private max: number;
    private value: number;
    private step: number = 0.03; // Default 3%
    
    // Dimensions
    private readonly width: number = 80;
    private readonly height: number = 24;
    private readonly arrowWidth: number = 20;
    private readonly arrowHeight: number = 20;
    
    // State
    private focused: boolean = false;
    private hovered: boolean = false;
    private leftArrowHovered: boolean = false;
    private rightArrowHovered: boolean = false;
    private textBuffer: string = ''; // Buffer for building up text input
    private isFirstInput: boolean = false; // Track if this is first input after focus
    
    // Callback
    private onChangeCallback: ((value: number) => void) | null = null;
    
    constructor(
        x: number,
        y: number,
        min: number,
        max: number,
        initialValue: number,
        id: string
    ) {
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
    setValue(newValue: number): void {
        const clamped = this.clamp(newValue);
        if (clamped !== this.value) {
            this.value = clamped;
            if (this.onChangeCallback) {
                this.onChangeCallback(this.value);
            }
        }
    }
    
    /**
     * Register onChange callback
     */
    onChange(callback: (value: number) => void): void {
        this.onChangeCallback = callback;
    }
    
    /**
     * Set step amount for increment/decrement
     */
    setStep(step: number): void {
        this.step = step;
    }
    
    /**
     * Increment value by step
     */
    increment(): void {
        this.setValue(this.value + this.step);
    }
    
    /**
     * Decrement value by step
     */
    decrement(): void {
        this.setValue(this.value - this.step);
    }
    
    /**
     * Clamp value to min/max bounds
     */
    private clamp(val: number): number {
        return Math.max(this.min, Math.min(this.max, val));
    }
    
    /**
     * Check if mouse is over input box
     */
    isMouseOver(mouseX: number, mouseY: number): boolean {
        return (
            mouseX >= this.x &&
            mouseX <= this.x + this.width &&
            mouseY >= this.y - this.height / 2 &&
            mouseY <= this.y + this.height / 2
        );
    }
    
    /**
     * Check if mouse is over left arrow
     */
    isLeftArrowHovered(mouseX: number, mouseY: number): boolean {
        const arrowX = this.x - this.arrowWidth - 5;
        const arrowY = this.y;
        return (
            mouseX >= arrowX &&
            mouseX <= arrowX + this.arrowWidth &&
            mouseY >= arrowY - this.arrowHeight / 2 &&
            mouseY <= arrowY + this.arrowHeight / 2
        );
    }
    
    /**
     * Check if mouse is over right arrow
     */
    isRightArrowHovered(mouseX: number, mouseY: number): boolean {
        const arrowX = this.x + this.width + 5;
        const arrowY = this.y;
        return (
            mouseX >= arrowX &&
            mouseX <= arrowX + this.arrowWidth &&
            mouseY >= arrowY - this.arrowHeight / 2 &&
            mouseY <= arrowY + this.arrowHeight / 2
        );
    }
    
    /**
     * Handle mouse click
     */
    handleClick(mouseX: number, mouseY: number): void {
        // Check arrows first
        if (this.isLeftArrowHovered(mouseX, mouseY)) {
            this.decrement();
            return;
        }
        
        if (this.isRightArrowHovered(mouseX, mouseY)) {
            this.increment();
            return;
        }
        
        // Check input box
        if (this.isMouseOver(mouseX, mouseY)) {
            this.focused = true;
            this.textBuffer = this.value.toFixed(2); // Initialize buffer with current value (selected)
            this.isFirstInput = true; // Mark that first input should replace all
        } else {
            this.unfocus();
        }
    }
    
    /**
     * Unfocus and commit any text buffer changes
     */
    unfocus(): void {
        if (this.focused && this.textBuffer) {
            const parsed = parseFloat(this.textBuffer);
            if (!isNaN(parsed)) {
                const clamped = Math.max(this.min, Math.min(this.max, parsed));
                this.setValue(clamped);
            }
        }
        this.focused = false;
        this.textBuffer = '';
        this.isFirstInput = false;
    }
    
    /**
     * Handle mouse move (for hover states)
     */
    handleMouseMove(mouseX: number, mouseY: number): void {
        this.leftArrowHovered = this.isLeftArrowHovered(mouseX, mouseY);
        this.rightArrowHovered = this.isRightArrowHovered(mouseX, mouseY);
    }
    
    /**
     * Handle text input (when focused)
     * First input after focus replaces the selected text, subsequent inputs append
     * Multi-character strings are parsed as complete input (e.g., '0.75')
     */
    handleTextInput(input: string): void {
        if (!this.focused) return;
        
        // Handle multi-character input (complete string like '0.75')
        if (input.length > 1) {
            const parsed = parseFloat(input);
            if (!isNaN(parsed)) {
                const clamped = Math.max(this.min, Math.min(this.max, parsed));
                this.setValue(clamped);
                this.textBuffer = clamped.toFixed(2);
            }
            this.isFirstInput = false;
            return;
        }
        
        // Single character input handling
        
        // Handle special keys
        if (input === 'Backspace') {
            this.textBuffer = this.textBuffer.slice(0, -1);
            this.isFirstInput = false;
            return;
        }
        
        if (input === 'Enter') {
            this.unfocus();
            return;
        }
        
        if (input === 'Escape') {
            this.textBuffer = this.value.toFixed(2);
            this.unfocus();
            return;
        }
        
        // Only accept numeric characters, decimal point, and minus sign
        if (!/^[0-9.-]$/.test(input)) {
            return; // Reject non-numeric input
        }
        
        // First input after focus - replace all selected text
        if (this.isFirstInput) {
            // Prevent invalid starts
            if (input === '.') {
                this.textBuffer = '0.';
            } else {
                this.textBuffer = input;
            }
            this.isFirstInput = false;
        } else {
            // Subsequent inputs - append character
            
            // Prevent multiple decimal points
            if (input === '.' && this.textBuffer.includes('.')) return;
            
            // Prevent multiple minus signs, and only allow at start
            if (input === '-' && (this.textBuffer.includes('-') || this.textBuffer.length > 0)) return;
            
            this.textBuffer += input;
        }
        
        // Try to parse and update value in real-time
        const parsed = parseFloat(this.textBuffer);
        if (!isNaN(parsed)) {
            const clamped = Math.max(this.min, Math.min(this.max, parsed));
            this.setValue(clamped);
        }
    }
    
    /**
     * Set hovered state
     */
    setHovered(hovered: boolean): void {
        this.hovered = hovered;
    }
    
    /**
     * Get hovered state
     */
    isHovered(): boolean {
        return this.hovered;
    }
    
    /**
     * Check if focused
     */
    isFocused(): boolean {
        return this.focused;
    }
    
    /**
     * Render the component
     */
    render(graphics: any): void {
        // Render left arrow
        this.renderArrow(graphics, this.x - this.arrowWidth - 5, this.y, 'left');
        
        // Render input box
        this.renderInputBox(graphics);
        
        // Render right arrow
        this.renderArrow(graphics, this.x + this.width + 5, this.y, 'right');
    }
    
    /**
     * Render an arrow button
     */
    private renderArrow(graphics: any, x: number, y: number, direction: 'left' | 'right'): void {
        const isHovered = direction === 'left' ? this.leftArrowHovered : this.rightArrowHovered;
        
        // Arrow background
        graphics.fill(isHovered ? 100 : 60);
        graphics.stroke(isHovered ? 180 : 120);
        graphics.strokeWeight(1);
        graphics.rect(
            x,
            y - this.arrowHeight / 2,
            this.arrowWidth,
            this.arrowHeight,
            3
        );
        
        // Arrow symbol
        graphics.fill(255);
        graphics.noStroke();
        graphics.textSize(14);
        graphics.textAlign(CENTER, CENTER);
        graphics.text(direction === 'left' ? '◀' : '▶', x + this.arrowWidth / 2, y);
    }
    
    /**
     * Render input box
     */
    private renderInputBox(graphics: any): void {
        // Background
        graphics.fill(this.focused ? 50 : 40);
        graphics.stroke(this.focused ? 100 : 80);
        graphics.strokeWeight(this.focused ? 2 : 1);
        graphics.rect(
            this.x,
            this.y - this.height / 2,
            this.width,
            this.height,
            3
        );
        
        // Value text
        graphics.fill(255);
        graphics.noStroke();
        graphics.textSize(12);
        graphics.textAlign(CENTER, CENTER);
        
        // Show text buffer when focused, otherwise show value
        const displayText = this.focused && this.textBuffer ? this.textBuffer : this.value.toFixed(2);
        graphics.text(displayText, this.x + this.width / 2, this.y);
        
        // Show cursor when focused
        if (this.focused) {
            const textWidth = graphics.textWidth(displayText);
            const cursorX = this.x + this.width / 2 + textWidth / 2 + 2;
            graphics.stroke(255);
            graphics.strokeWeight(1);
            graphics.line(cursorX, this.y - 6, cursorX, this.y + 6);
        }
    }
}
