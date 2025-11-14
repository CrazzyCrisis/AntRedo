/**
 * PauseMenuScene - Pause overlay with world preset management
 * Allows saving and loading world presets
 */

import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { EventBus, GameEvents } from '../utils/eventBus';
import { RenderLayer } from '../rendering/RenderLayer';
import { WorldPresetManager } from '../world/WorldPresetManager';
import { InputManager } from '../managers/InputManager';

export class PauseMenuScene implements IScene {
    private renderer: Renderer;
    private canvasWidth: number;
    private canvasHeight: number;
    private unregisterFunctions: Array<() => void> = [];
    private selectedPreset: string | null = null;
    private hoveredPreset: string | null = null;
    private scrollOffset: number = 0;
    private inputManager: InputManager;
    private lastClickTime: number = 0;
    private lastClickedPreset: string | null = null;
    
    constructor(
        renderer: Renderer, 
        canvasWidth: number, 
        canvasHeight: number
    ) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.inputManager = InputManager.getInstance();
    }

    enter(): void {
        this.createPauseMenu();
    }

    private createPauseMenu(): void {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        // Semi-transparent overlay
        const overlay = {
            id: 'pause_overlay',
            layer: RenderLayer.UI,
            depth: 0,
            render: (graphics: any) => {
                graphics.fill(0, 0, 0, 150);
                graphics.noStroke();
                graphics.rect(0, 0, this.canvasWidth, this.canvasHeight);
            }
        };
        this.unregisterFunctions.push(this.renderer.register(overlay));

        // Menu panel
        const menuPanel = {
            id: 'pause_menu_panel',
            layer: RenderLayer.UI,
            depth: 1,
            render: (graphics: any) => {
                const panelWidth = 600;
                const panelHeight = 500;
                const panelX = centerX - panelWidth / 2;
                const panelY = centerY - panelHeight / 2;

                // Panel background
                graphics.fill(40, 40, 50);
                graphics.stroke(100, 100, 120);
                graphics.strokeWeight(2);
                graphics.rect(panelX, panelY, panelWidth, panelHeight, 10);

                // Title
                graphics.fill(255);
                graphics.noStroke();
                graphics.textAlign((window as any).CENTER, (window as any).TOP);
                graphics.textSize(32);
                graphics.text('PAUSE MENU', centerX, panelY + 20);

                // Section: Save Current World
                graphics.textSize(20);
                graphics.textAlign((window as any).LEFT, (window as any).TOP);
                graphics.text('Save Current World:', panelX + 30, panelY + 80);

                // Section: Load Preset
                graphics.text('Saved Presets:', panelX + 30, panelY + 150);

                // Preset list
                const presets = WorldPresetManager.loadAllPresets();
                const listY = panelY + 180;

                if (presets.length === 0) {
                    graphics.textSize(16);
                    graphics.fill(150);
                    graphics.textAlign((window as any).CENTER, (window as any).TOP);
                    graphics.text('No saved presets', centerX, listY + 80);
                } else {
                    graphics.textSize(14);
                    graphics.textAlign((window as any).LEFT, (window as any).TOP);
                    
                    const visiblePresets = presets.slice(this.scrollOffset, this.scrollOffset + 5);
                    
                    visiblePresets.forEach((preset, index) => {
                        const itemY = listY + index * 40;
                        const isSelected = this.selectedPreset === preset.name;
                        const isHovered = this.hoveredPreset === preset.name;
                        
                        // Highlight selected or hovered
                        if (isSelected) {
                            graphics.fill(60, 120, 180, 100);
                            graphics.noStroke();
                            graphics.rect(panelX + 30, itemY - 5, panelWidth - 60, 35, 5);
                        } else if (isHovered) {
                            graphics.fill(80, 80, 100, 80);
                            graphics.noStroke();
                            graphics.rect(panelX + 30, itemY - 5, panelWidth - 60, 35, 5);
                        }
                        
                        // Preset name
                        graphics.fill(255);
                        graphics.text(preset.name, panelX + 40, itemY);
                        
                        // Preset info (seed and date)
                        graphics.fill(180);
                        graphics.textSize(11);
                        const date = new Date(preset.timestamp).toLocaleString();
                        graphics.text(`Seed: ${preset.seed} | ${date}`, panelX + 40, itemY + 18);
                        graphics.textSize(14);
                    });
                }

                // Instructions
                graphics.textSize(14);
                graphics.fill(200);
                graphics.textAlign((window as any).CENTER, (window as any).TOP);
                
                // Get keybind display strings
                const pauseKeys = this.inputManager.getKeyBinding('pause').map(k => k === 'Escape' ? 'ESC' : k.toUpperCase()).join('/');
                const saveKeys = this.inputManager.getKeyBinding('saveWorld').map(k => k.toUpperCase()).join('/');
                const loadKeys = this.inputManager.getKeyBinding('loadWorld').map(k => k.toUpperCase()).join('/');
                const deleteKeys = this.inputManager.getKeyBinding('deleteWorld').map(k => k.toUpperCase()).join('/');
                
                graphics.text(`${pauseKeys}: Resume | ${saveKeys}: Save | Click preset then ${loadKeys}: Load | ${deleteKeys}: Delete`, 
                    centerX, panelY + panelHeight - 35);
            }
        };
        this.unregisterFunctions.push(this.renderer.register(menuPanel));

        // Mark UI dirty
        this.renderer.markLayerDirty(RenderLayer.UI);
    }

    exit(): void {
        // Cleanup
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];
        this.selectedPreset = null;
    }

    update(): void {
        // Mark UI dirty for animations
        this.renderer.markLayerDirty(RenderLayer.UI);
    }

    handleMouseClick(x: number, y: number): void {
        // Check if clicking on a preset in the list
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const panelWidth = 600;
        const panelHeight = 500;
        const panelX = centerX - panelWidth / 2;
        const panelY = centerY - panelHeight / 2;
        const listY = panelY + 180;

        const presets = WorldPresetManager.loadAllPresets();
        const visiblePresets = presets.slice(this.scrollOffset, this.scrollOffset + 5);

        visiblePresets.forEach((preset, index) => {
            const itemY = listY + index * 40;
            const itemHeight = 35;
            
            if (x >= panelX + 30 && x <= panelX + panelWidth - 30 &&
                y >= itemY - 5 && y <= itemY - 5 + itemHeight) {
                
                const now = Date.now();
                
                // Check for double-click (within 300ms on same preset)
                if (this.lastClickedPreset === preset.name && (now - this.lastClickTime) < 300) {
                    // Double-click detected - load preset immediately
                    const loadedPreset = WorldPresetManager.loadPreset(preset.name);
                    if (loadedPreset) {
                        EventBus.emit(GameEvents.LOAD_WORLD_PRESET, loadedPreset);
                    }
                } else {
                    // Single click - just select
                    this.selectedPreset = preset.name;
                    this.lastClickedPreset = preset.name;
                    this.lastClickTime = now;
                }
            }
        });
    }

    handleMouseMove(x: number, y: number): void {
        // Calculate preset list area (same bounds as click detection)
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const panelWidth = 600;
        const panelHeight = 500;
        const panelX = centerX - panelWidth / 2;
        const panelY = centerY - panelHeight / 2;
        const listY = panelY + 180;
        
        // Check if mouse is within preset list area
        if (x >= panelX + 30 && x <= panelX + panelWidth - 30 &&
            y >= listY - 5 && y <= listY + 200) {
            
            const presets = WorldPresetManager.loadAllPresets();
            const visiblePresets = presets.slice(this.scrollOffset, this.scrollOffset + 5);
            
            // Find which preset is being hovered (if any)
            let newHoveredPreset: string | null = null;
            visiblePresets.forEach((preset, index) => {
                const itemY = listY + index * 40;
                if (y >= itemY - 5 && y <= itemY + 30) {
                    newHoveredPreset = preset.name;
                }
            });
            
            // Update hover state and mark dirty if changed
            if (this.hoveredPreset !== newHoveredPreset) {
                this.hoveredPreset = newHoveredPreset;
                this.renderer.markLayerDirty(RenderLayer.UI);
            }
        } else {
            // Mouse outside preset list - clear hover
            if (this.hoveredPreset !== null) {
                this.hoveredPreset = null;
                this.renderer.markLayerDirty(RenderLayer.UI);
            }
        }
    }

    handleKeyPress(key: string | number): void {
        const keyStr = key.toString();
        
        // Pause - Resume game
        if (this.inputManager.isKeyBoundToAction(keyStr, 'pause')) {
            EventBus.emit(GameEvents.GAME_RESUME);
            return;
        }

        // Save World
        if (this.inputManager.isKeyBoundToAction(keyStr, 'saveWorld')) {
            const presetName = prompt('Enter a name for this world preset:');
            if (presetName && presetName.trim()) {
                EventBus.emit(GameEvents.SAVE_WORLD_PRESET, presetName.trim());
                alert(`World "${presetName}" saved!`);
            }
            return;
        }

        // Load World
        if (this.inputManager.isKeyBoundToAction(keyStr, 'loadWorld') && this.selectedPreset) {
            const preset = WorldPresetManager.loadPreset(this.selectedPreset);
            if (preset) {
                EventBus.emit(GameEvents.LOAD_WORLD_PRESET, preset);
            }
            return;
        }

        // Delete World
        if (this.inputManager.isKeyBoundToAction(keyStr, 'deleteWorld') && this.selectedPreset) {
            if (confirm(`Delete preset "${this.selectedPreset}"?`)) {
                WorldPresetManager.deletePreset(this.selectedPreset);
                this.selectedPreset = null;
            }
            return;
        }
    }
}
