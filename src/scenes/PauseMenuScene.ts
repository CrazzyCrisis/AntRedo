/**
 * PauseMenuScene - Pause overlay with world preset management
 * Allows saving and loading world presets
 */

import {
    IScene,
    Renderer,
    EventBus,
    GameEvents,
    RenderLayer,
    WorldPresetManager,
    InputManager
} from '../imports/sceneImports';

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
    private worldGenConfigButtonBounds: { x: number; y: number; width: number; height: number } | null = null;
    private worldGenConfigButtonHovered: boolean = false;
    
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
                // Recalculate center on every render to handle window resize
                const currentCenterX = this.canvasWidth / 2;
                const currentCenterY = this.canvasHeight / 2;
                
                const panelWidth = 600;
                const panelHeight = 500;
                const panelX = currentCenterX - panelWidth / 2;
                const panelY = currentCenterY - panelHeight / 2;

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
                graphics.text('PAUSE MENU', currentCenterX, panelY + 20);

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
                    graphics.text('No saved presets', currentCenterX, listY + 80);
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
                    currentCenterX, panelY + panelHeight - 35);
                
                // World Gen Config Toggle
                graphics.textSize(14);
                graphics.fill(255);
                graphics.textAlign((window as any).LEFT, (window as any).TOP);
                graphics.text('World Gen Config', panelX + 70, panelY + panelHeight - 80);
            }
        };
        this.unregisterFunctions.push(this.renderer.register(menuPanel));
        
        // Create world gen config button (custom renderable)
        const buttonWidth = 140;
        const buttonHeight = 35;
        const buttonX = centerX - 230;
        const buttonY = centerY + 200;
        
        this.worldGenConfigButtonBounds = {
            x: buttonX - buttonWidth / 2,
            y: buttonY - buttonHeight / 2,
            width: buttonWidth,
            height: buttonHeight
        };
        
        const worldGenButton = {
            id: 'worldgen_config_button',
            layer: RenderLayer.UI,
            depth: 10,
            render: (graphics: any) => {
                const bounds = this.worldGenConfigButtonBounds!;
                
                // Button background
                graphics.fill(this.worldGenConfigButtonHovered ? 80 : 60);
                graphics.stroke(this.worldGenConfigButtonHovered ? 150 : 100);
                graphics.strokeWeight(2);
                graphics.rect(bounds.x, bounds.y, bounds.width, bounds.height, 5);
                
                // Button text
                graphics.fill(255);
                graphics.noStroke();
                graphics.textSize(14);
                graphics.textAlign(graphics.CENTER, graphics.CENTER);
                graphics.text('World Config', buttonX, buttonY);
            }
        };
        this.unregisterFunctions.push(this.renderer.register(worldGenButton));

        // Mark UI dirty
        this.renderer.markLayerDirty(RenderLayer.UI);
    }

    exit(): void {
        // Cleanup
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];
        this.selectedPreset = null;
    }

    update(_deltaTime: number): void {
        // Mark UI dirty for animations
        this.renderer.markLayerDirty(RenderLayer.UI);
    }

    handleMouseClick(x: number, y: number): void {
        // Check world gen config button first
        if (this.worldGenConfigButtonBounds) {
            const bounds = this.worldGenConfigButtonBounds;
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                // Open world gen config menu and close pause menu
                EventBus.emit(GameEvents.WORLDGEN_CONFIG_MENU_TOGGLE, true);
                EventBus.emit(GameEvents.GAME_RESUME);
                return;
            }
        }
        
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
        // Update button hover state
        if (this.worldGenConfigButtonBounds) {
            const bounds = this.worldGenConfigButtonBounds;
            this.worldGenConfigButtonHovered = (
                x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height
            );
        }
        
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
        
        // Debug logging

        
        // Ctrl+S - Save World Preset (check if CONTROL key is held down)
        if ((keyStr === 's' || keyStr === 'S')) {
            // Check if Control key (keyCode 17) is currently pressed
            const keyIsDown = (window as any).keyIsDown;
            const CONTROL = 17;
            
            if (keyIsDown && keyIsDown(CONTROL)) {

                // Show save dialog
                const presetName = prompt('Enter a name for this world preset:');
                if (presetName && presetName.trim()) {
                    EventBus.emit(GameEvents.SAVE_WORLD_PRESET, presetName.trim());

                }
            } else {

            }
            return;
        }
        
        // Pause - Resume game
        if (this.inputManager.isKeyBoundToAction(keyStr, 'pause')) {
            EventBus.emit(GameEvents.GAME_RESUME);
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

    handleMouseUp(_x: number, _y: number): void {
        // Pause menu doesn't need mouse up handling currently
    }
    
    onResize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        // Update button bounds to match new center
        if (this.worldGenConfigButtonBounds) {
            const centerX = width / 2;
            const centerY = height / 2;
            const buttonX = centerX - 230;
            const buttonY = centerY + 200;
            const buttonWidth = 140;
            const buttonHeight = 35;
            
            this.worldGenConfigButtonBounds = {
                x: buttonX - buttonWidth / 2,
                y: buttonY - buttonHeight / 2,
                width: buttonWidth,
                height: buttonHeight
            };
        }
        
        // Mark UI layer as dirty to trigger redraw with new dimensions
        this.renderer.markLayerDirty(RenderLayer.UI);
    }
}
