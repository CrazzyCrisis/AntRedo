/**
 * WorldGenConfigMenu - UI panel for configuring world generation parameters
 * Allows live editing of noise scale and tile distribution thresholds
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { SliderWithArrowsComponent } from './SliderWithArrowsComponent';
import { ToggleComponent } from './ToggleComponent';
import { NumberInputComponent } from './NumberInputComponent';
import { WorldGenConfig, sortThresholdsByValue } from '../../config/worldGenConfig';
import { TileType } from '../../world/TileSystem';
import { EventBus, GameEvents } from '../../utils/eventBus';

export class WorldGenConfigMenu implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 100; // Above most UI
    public id: string = 'worldgen_config_menu';
    
    private x: number;
    private y: number;
    private width: number = 350;
    private height: number = 550; // Increased height for priority inputs
    private config: WorldGenConfig;
    private visible: boolean = false;
    
    private noiseScaleSlider: SliderWithArrowsComponent;
    private tileThresholdInputs: Map<number, NumberInputComponent> = new Map();
    private tileEnabledToggles: Map<number, ToggleComponent> = new Map();
    private tilePriorityInputs: Map<number, NumberInputComponent> = new Map();
    
    // Debounce for regeneration
    private regenerateDebounceTimer: number | null = null;
    private readonly REGENERATE_DEBOUNCE_MS: number = 300;
    private isRegenerating: boolean = false;
    
    constructor(x: number, y: number, initialConfig: WorldGenConfig) {
        this.x = x;
        this.y = y;
        this.config = { ...initialConfig };
        
        // Create noise scale slider
        const mockSliderSprite = { width: 200, height: 20 } as any;
        this.noiseScaleSlider = new SliderWithArrowsComponent(
            mockSliderSprite,
            this.x + 120,
            this.y + 50,
            0.05,
            0.5,
            this.config.noiseScale,
            'worldgen_noise_scale'
        );
        this.noiseScaleSlider.setArrowStep(0.01); // 1% step for noise scale
        this.noiseScaleSlider.onChange((value) => {
            this.config.noiseScale = value;
            this.emitConfigChange();
        });
        
        // Create sliders and toggles for each tile threshold
        const mockToggleSprite = { width: 30, height: 15 } as any;
        this.config.tileThresholds.forEach((threshold, index) => {
            const yOffset = 120 + index * 60; // Spacing for input rows
            
            // Threshold input (left of priority input)
            const thresholdInput = new NumberInputComponent(
                this.x + 80,
                this.y + yOffset,
                0.0,
                1.0,
                threshold.threshold,
                `worldgen_threshold_${index}`
            );
            thresholdInput.setStep(0.01); // 1% step for thresholds
            thresholdInput.onChange((value) => {
                this.config.tileThresholds[index].threshold = value;
                this.reorderThresholds();
                this.emitConfigChange();
            });
            this.tileThresholdInputs.set(index, thresholdInput);
            
            // Enabled toggle
            const toggle = new ToggleComponent(
                mockToggleSprite,
                this.x + 30,
                this.y + yOffset,
                threshold.enabled,
                `worldgen_toggle_${index}`
            );
            toggle.onChange((enabled) => {
                this.config.tileThresholds[index].enabled = enabled;
                this.emitConfigChange();
            });
            this.tileEnabledToggles.set(index, toggle);
            
            // Priority input (right of threshold input)
            const priorityInput = new NumberInputComponent(
                this.x + 210,
                this.y + yOffset,
                0,
                100,
                threshold.priority,
                `worldgen_priority_${index}`
            );
            priorityInput.setStep(1); // Integer steps for priority
            priorityInput.onChange((value) => {
                this.config.tileThresholds[index].priority = Math.round(value);
                this.emitConfigChange();
            });
            this.tilePriorityInputs.set(index, priorityInput);
        });
    }
    
    /**
     * Show the menu
     */
    show(): void {
        this.visible = true;
    }
    
    /**
     * Hide the menu
     */
    hide(): void {
        this.visible = false;
        // Cancel any pending regeneration when hiding
        if (this.regenerateDebounceTimer !== null) {
            clearTimeout(this.regenerateDebounceTimer);
            this.regenerateDebounceTimer = null;
        }
        this.isRegenerating = false;
    }
    
    /**
     * Toggle visibility
     */
    toggle(): void {
        this.visible = !this.visible;
    }
    
    /**
     * Check if visible
     */
    isVisible(): boolean {
        return this.visible;
    }
    
    /**
     * Update config from external source
     */
    setConfig(config: WorldGenConfig): void {
        this.config = { ...config };
        this.noiseScaleSlider.setValue(config.noiseScale);
        this.syncUIToConfig();
    }
    
    /**
     * Get current config
     */
    getConfig(): WorldGenConfig {
        return { ...this.config };
    }
    
    /**
     * Emit config change event and trigger debounced regeneration
     */
    private emitConfigChange(): void {
        EventBus.emit(GameEvents.WORLDGEN_CONFIG_CHANGED, this.getConfig());
        this.scheduleRegeneration();
    }
    
    /**
     * Reorder thresholds by value and update UI
     */
    private reorderThresholds(): void {
        // Sort thresholds
        this.config.tileThresholds = sortThresholdsByValue(this.config.tileThresholds);
        
        // Emit threshold changed event
        EventBus.emit(GameEvents.WORLDGEN_THRESHOLD_CHANGED, this.config.tileThresholds);
        
        // Update UI components to match new order
        this.syncUIToConfig();
    }
    
    /**
     * Sync all UI components with current config order
     */
    private syncUIToConfig(): void {
        this.config.tileThresholds.forEach((threshold, index) => {
            const thresholdInput = this.tileThresholdInputs.get(index);
            const toggle = this.tileEnabledToggles.get(index);
            const priorityInput = this.tilePriorityInputs.get(index);
            if (thresholdInput) thresholdInput.setValue(threshold.threshold);
            if (toggle) toggle.setOn(threshold.enabled);
            if (priorityInput) priorityInput.setValue(threshold.priority);
        });
    }
    
    /**
     * Schedule a debounced world regeneration
     * Prevents excessive regenerations during rapid slider adjustments
     */
    private scheduleRegeneration(): void {
        // Clear existing timer
        if (this.regenerateDebounceTimer !== null) {
            clearTimeout(this.regenerateDebounceTimer);
        }
        
        // Set regenerating flag immediately for UI feedback
        this.isRegenerating = true;
        
        // Schedule regeneration after debounce period
        this.regenerateDebounceTimer = setTimeout(() => {
            EventBus.emit(GameEvents.WORLDGEN_REGENERATE);
            this.regenerateDebounceTimer = null;
            // Keep isRegenerating true briefly to show "Regenerating..." text
            setTimeout(() => {
                this.isRegenerating = false;
            }, 100);
        }, this.REGENERATE_DEBOUNCE_MS) as any;
    }
    
    /**
     * Update sliders (for dragging)
     */
    update(): void {
        // Sliders don't have update method, dragging is handled in mouse events
    }
    
    /**
     * Handle mouse click
     */
    handleMouseClick(x: number, y: number): void {
        if (!this.visible) return;
        
        // Check noise scale slider
        if (this.noiseScaleSlider.isMouseOverTrack(x, y) || 
            this.noiseScaleSlider.isMouseOverLeftArrow(x, y) || 
            this.noiseScaleSlider.isMouseOverRightArrow(x, y)) {
            this.noiseScaleSlider.handleMouseDown(x, y);
            this.noiseScaleSlider.handleClick(x, y);
            this.unfocusAllInputs(); // Unfocus inputs when clicking other components
            return;
        }
        
        // Check threshold inputs (box + arrows)
        for (const input of this.tileThresholdInputs.values()) {
            if (input.isMouseOver(x, y) || input.isLeftArrowHovered(x, y) || input.isRightArrowHovered(x, y)) {
                this.unfocusAllInputs(); // Unfocus others first
                input.handleClick(x, y);
                return;
            }
        }
        
        // Check toggles
        for (const toggle of this.tileEnabledToggles.values()) {
            if (toggle.isMouseOver(x, y)) {
                toggle.handleClick(x, y);
                this.unfocusAllInputs(); // Unfocus inputs when clicking toggle
                return;
            }
        }
        
        // Check priority inputs (box + arrows)
        for (const input of this.tilePriorityInputs.values()) {
            if (input.isMouseOver(x, y) || input.isLeftArrowHovered(x, y) || input.isRightArrowHovered(x, y)) {
                this.unfocusAllInputs(); // Unfocus others first
                input.handleClick(x, y);
                return;
            }
        }
        
        // Clicked elsewhere in menu - unfocus all
        this.unfocusAllInputs();
    }
    
    /**
     * Unfocus all input components
     */
    private unfocusAllInputs(): void {
        this.tileThresholdInputs.forEach(input => input.unfocus());
        this.tilePriorityInputs.forEach(input => input.unfocus());
    }
    
    /**
     * Handle mouse release
     */
    handleMouseUp(): void {
        if (!this.visible) return;
        
        this.noiseScaleSlider.handleMouseUp();
        // NumberInputComponent doesn't need handleMouseUp - only slider does
    }
    
    /**
     * Handle mouse move (for hover and dragging)
     */
    handleMouseMove(x: number, y: number): void {
        if (!this.visible) return;
        
        // Update hover states and handle dragging
        this.noiseScaleSlider.handleMouseMove(x, y);
        if (this.noiseScaleSlider.isDragging()) {
            this.noiseScaleSlider.handleMouseDown(x, y);
        }
        
        this.tileThresholdInputs.forEach(input => {
            input.handleMouseMove(x, y);
        });
        
        this.tileEnabledToggles.forEach(toggle => {
            toggle.setHovered(toggle.isMouseOver(x, y));
        });
        
        this.tilePriorityInputs.forEach(input => {
            input.handleMouseMove(x, y);
        });
    }
    
    /**
     * Handle text input (for NumberInputComponent)
     */
    handleTextInput(key: string): void {
        if (!this.visible) return;
        
        // Handle threshold inputs
        this.tileThresholdInputs.forEach(input => {
            if (input.isFocused()) {
                input.handleTextInput(key);
            }
        });
        
        // Handle priority inputs
        this.tilePriorityInputs.forEach(input => {
            if (input.isFocused()) {
                input.handleTextInput(key);
            }
        });
    }
    
    /**
     * Render the menu
     */
    render(graphics: any): void {
        if (!this.visible) return;
        
        // Panel background
        graphics.fill(30, 30, 40, 230);
        graphics.stroke(100, 100, 120);
        graphics.strokeWeight(2);
        graphics.rect(this.x, this.y, this.width, this.height, 10);
        
        // Title
        graphics.fill(255);
        graphics.noStroke();
        graphics.textSize(18);
        graphics.textAlign((window as any).CENTER, (window as any).TOP);
        graphics.text('World Generation Config', this.x + this.width / 2, this.y + 15);
        
        // Noise Scale section
        graphics.textSize(14);
        graphics.textAlign((window as any).LEFT, (window as any).TOP);
        graphics.text('Noise Scale:', this.x + 20, this.y + 45);
        graphics.text(this.config.noiseScale.toFixed(3), this.x + 250, this.y + 45);
        this.noiseScaleSlider.render(graphics);
        
        // Tile Thresholds section
        graphics.textSize(16);
        graphics.text('Tile Distribution:', this.x + 20, this.y + 85);
        
        graphics.textSize(12);
        this.config.tileThresholds.forEach((threshold, index) => {
            const yOffset = 120 + index * 60; // Updated spacing
            const tileTypeName = this.getTileTypeName(threshold.tileType);
            
            // Render toggle
            const toggle = this.tileEnabledToggles.get(index);
            if (toggle) toggle.render(graphics);
            
            // Render tile name label below toggle
            graphics.textAlign((window as any).CENTER, (window as any).TOP);
            graphics.fill(threshold.enabled ? 255 : 120);
            graphics.noStroke();
            graphics.textSize(10);
            graphics.text(tileTypeName, this.x + 30, this.y + yOffset + 10);
            
            // Render threshold input (left)
            const thresholdInput = this.tileThresholdInputs.get(index);
            if (thresholdInput && threshold.enabled) {
                thresholdInput.render(graphics);
                
                // Label below threshold input
                graphics.textAlign((window as any).CENTER, (window as any).TOP);
                graphics.fill(200);
                graphics.textSize(9);
                graphics.text('Threshold', thresholdInput.x + 40, this.y + yOffset + 15);
            }
            
            // Render priority input (right)
            const priorityInput = this.tilePriorityInputs.get(index);
            if (priorityInput && threshold.enabled) {
                priorityInput.render(graphics);
                
                // Label below priority input
                graphics.textAlign((window as any).CENTER, (window as any).TOP);
                graphics.fill(200);
                graphics.textSize(9);
                graphics.text('Priority', priorityInput.x + 40, this.y + yOffset + 15);
            }
        });
        
        // Status message at bottom
        graphics.textAlign((window as any).CENTER, (window as any).TOP);
        if (this.isRegenerating) {
            graphics.fill(255, 200, 0);
            graphics.textSize(14);
            graphics.text('⚡ Regenerating world...', this.x + this.width / 2, this.y + this.height - 30);
        } else {
            graphics.fill(200);
            graphics.textSize(12);
            graphics.text('Changes debounced by 300ms', this.x + this.width / 2, this.y + this.height - 25);
        }
    }
    
    /**
     * Get human-readable tile type name
     */
    private getTileTypeName(tileType: TileType): string {
        const names: { [key: number]: string } = {
            [TileType.GRASS]: 'Grass',
            [TileType.DIRT]: 'Dirt',
            [TileType.STONE]: 'Stone',
            [TileType.SAND]: 'Sand',
            [TileType.WATER]: 'Water',
            [TileType.MOSS]: 'Moss'
        };
        return names[tileType] || 'Unknown';
    }
}
