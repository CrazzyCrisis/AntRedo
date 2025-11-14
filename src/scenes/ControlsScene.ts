import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { KeybindComponent } from '../rendering/components/KeybindComponent';
import { ButtonComponent } from '../rendering/components/ButtonComponent';
import { EventBus, GameEvents } from '../utils/eventBus';
import { InputManager } from '../managers/InputManager';
import { KeyBindings } from '../config/defaultSettings';
import { CONTROLS_LAYOUT } from '../config/menuLayout';

/**
 * Controls Settings Scene
 * Allows player to rebind keys for all game actions
 * Features:
 * - KeybindComponent for each action (MOVE_UP, MOVE_DOWN, etc.)
 * - Conflict detection UI
 * - Reset to defaults button
 * - Back button navigation
 * - Persistence via InputManager → SettingsManager → localStorage
 */
export class ControlsScene implements IScene {
    private renderer: Renderer;
    private canvasWidth: number;
    private canvasHeight: number;
    private inputManager: InputManager;

    // UI Components
    private keybindComponents: KeybindComponent[] = [];
    private backButton!: ButtonComponent;
    private resetButton?: ButtonComponent;

    // Sprites (passed in constructor for testability)
    private sprites: {
        keybindSprite: any;
        buttonSprite: any;
    };

    // Unregister functions from renderer
    private unregisterFunctions: Array<() => void> = [];

    // EventBus unsubscribe functions
    private eventUnsubscribes: Array<() => void> = [];

    constructor(
        renderer: Renderer,
        canvasWidth: number,
        canvasHeight: number,
        sprites: {
            keybindSprite: any;
            buttonSprite: any;
        }
    ) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.sprites = sprites;
        this.inputManager = InputManager.getInstance();
    }

    enter(): void {
        this.createComponents();
        this.registerComponents();
        this.setupEventListeners();
    }

    exit(): void {
        // Unregister all components from renderer
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];

        // Unsubscribe from all events
        this.eventUnsubscribes.forEach(unsub => unsub());
        this.eventUnsubscribes = [];

        // Clear component references
        this.keybindComponents = [];
    }

    update(): void {
        // Update button pulse animations
        if (this.backButton) {
            this.backButton.update();
        }
        if (this.resetButton) {
            this.resetButton.update();
        }
    }

    handleMouseClick(x: number, y: number): void {
        // Find which keybind was clicked (if any)
        let clickedKeybind = null;
        for (const keybind of this.keybindComponents) {
            if (keybind.isMouseOver(x, y)) {
                clickedKeybind = keybind;
                break;
            }
        }

        // If a keybind was clicked, stop all others before toggling the clicked one
        if (clickedKeybind) {
            this.keybindComponents.forEach(kb => {
                if (kb !== clickedKeybind && kb.isListening()) {
                    kb.stopListening();
                }
            });
            // Now toggle the clicked keybind
            clickedKeybind.handleClick(x, y);
        }

        // Check back button
        if (this.backButton.isMouseOver(x, y)) {
            this.backButton.handleClick(x, y);
        }

        // Check reset button
        if (this.resetButton && this.resetButton.isMouseOver(x, y)) {
            this.resetButton.handleClick(x, y);
        }
    }

    handleMouseMove(x: number, y: number): void {
        // Update hover state for all keybinds
        this.keybindComponents.forEach(keybind => {
            keybind.setHovered(keybind.isMouseOver(x, y));
        });

        // Update back button hover
        if (this.backButton) {
            this.backButton.setHovered(this.backButton.isMouseOver(x, y));
        }

        // Update reset button hover
        if (this.resetButton) {
            this.resetButton.setHovered(this.resetButton.isMouseOver(x, y));
        }
    }

    handleMouseUp(_x: number, _y: number): void {
        // Controls scene doesn't need mouse up handling currently
    }
    
    onResize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        // Recreate components with new positions
        // First, unregister old components
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];
        this.keybindComponents = [];
        
        // Recreate with new dimensions
        this.createComponents();
        
        // Mark UI layer as dirty to trigger redraw with new dimensions
        this.renderer.markLayerDirty(RenderLayer.UI);
    }

    private createComponents(): void {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;

        // Define all actions to create keybinds for
        const actions: Array<{ action: keyof KeyBindings; layoutKey: keyof typeof CONTROLS_LAYOUT; label: string }> = [
            { action: 'moveUp', layoutKey: 'MOVE_UP', label: 'Move Up' },
            { action: 'moveDown', layoutKey: 'MOVE_DOWN', label: 'Move Down' },
            { action: 'moveLeft', layoutKey: 'MOVE_LEFT', label: 'Move Left' },
            { action: 'moveRight', layoutKey: 'MOVE_RIGHT', label: 'Move Right' },
            { action: 'interact', layoutKey: 'INTERACT', label: 'Interact' },
            { action: 'openInventory', layoutKey: 'ATTACK', label: 'Inventory' }, // Using ATTACK position
            { action: 'pause', layoutKey: 'PAUSE', label: 'Pause' }
        ];

        // Create keybind component for each action
        actions.forEach(({ action, layoutKey }) => {
            const layout = CONTROLS_LAYOUT[layoutKey];
            const x = centerX + (layout.offsetX * halfWidth);
            const y = centerY - (layout.offsetY * halfHeight); // Note: subtract for Y

            const keybind = new KeybindComponent(
                this.sprites.keybindSprite,
                x,
                y,
                action,
                this.inputManager.getKeyBinding(action as keyof KeyBindings),
                `keybind_${action}`
            );

            // Set up onChange callback to update InputManager
            keybind.onChange((_keys: string[], actionName: string) => {
                const newKeys = keybind.getKeys();
                // Check for conflicts
                const conflicts: string[] = [];
                newKeys.forEach((key: string) => {
                    const conflictingActions = this.inputManager.getConflicts(key);
                    conflictingActions.forEach((conflictAction: string) => {
                        if (conflictAction !== actionName && !conflicts.includes(conflictAction)) {
                            conflicts.push(conflictAction);
                        }
                    });
                });

                // Update conflict state
                if (conflicts.length > 0) {
                    keybind.setConflict(true, conflicts);
                } else {
                    keybind.setConflict(false, []);
                }

                // Update InputManager (force rebind to overwrite conflicts)
                if (newKeys.length === 1) {
                    this.inputManager.rebindKey(action, newKeys[0], true);
                } else if (newKeys.length > 1) {
                    // For multiple keys, rebind to first key, then add rest
                    this.inputManager.rebindKey(action, newKeys[0], true);
                    for (let i = 1; i < newKeys.length; i++) {
                        this.inputManager.addKeyBinding(action, newKeys[i], true);
                    }
                }
            });

            this.keybindComponents.push(keybind);
        });

        // Create back button
        const backLayout = CONTROLS_LAYOUT.BACK_BUTTON;
        const backX = centerX + (backLayout.offsetX * halfWidth);
        const backY = centerY - (backLayout.offsetY * halfHeight);
        
        this.backButton = new ButtonComponent(
            this.sprites.buttonSprite,
            backX,
            backY,
            'back_button'
        );
        this.backButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_BACK_CLICKED);
        });

        // Optional: Create reset button (if RESET_BUTTON exists in layout)
        if ('RESET_BUTTON' in CONTROLS_LAYOUT) {
            const resetLayout = (CONTROLS_LAYOUT as any).RESET_BUTTON;
            const resetX = centerX + (resetLayout.offsetX * halfWidth);
            const resetY = centerY - (resetLayout.offsetY * halfHeight);
            
            this.resetButton = new ButtonComponent(
                this.sprites.buttonSprite,
                resetX,
                resetY,
                'reset_button'
            );
            this.resetButton.onClick(() => {
                this.inputManager.resetToDefaults();
                // Sync all keybind components
                this.syncAllKeybinds();
            });
        }
    }

    private registerComponents(): void {
        // Register all keybind components
        this.keybindComponents.forEach(keybind => {
            this.unregisterFunctions.push(this.renderer.register(keybind));
        });

        // Register back button
        this.unregisterFunctions.push(this.renderer.register(this.backButton));

        // Register reset button if it exists
        if (this.resetButton) {
            this.unregisterFunctions.push(this.renderer.register(this.resetButton));
        }
    }

    private setupEventListeners(): void {
        // Listen for keybind changes (from external sources like InputManager reset)
        const keybindChangedUnsub = EventBus.on(GameEvents.SETTING_KEYBIND_CHANGED, (actionName: string) => {
            this.syncKeybind(actionName);
        });
        this.eventUnsubscribes.push(keybindChangedUnsub);
    }

    /**
     * Sync a specific keybind component with InputManager state
     */
    private syncKeybind(actionName: string): void {
        const keybind = this.keybindComponents.find(kb => kb.getActionName() === actionName);
        if (keybind) {
            const keys = this.inputManager.getKeyBinding(actionName as keyof KeyBindings);
            
            // Temporarily disable onChange to prevent circular updates
            const originalCallback = keybind['changeCallback'];
            keybind['changeCallback'] = undefined;
            
            keybind.setKeys(keys);
            
            // Restore onChange callback
            keybind['changeCallback'] = originalCallback;

            // Update conflict state
            const conflicts: string[] = [];
            keys.forEach((key: string) => {
                const conflictingActions = this.inputManager.getConflicts(key);
                conflictingActions.forEach((conflictAction: string) => {
                    if (conflictAction !== actionName && !conflicts.includes(conflictAction)) {
                        conflicts.push(conflictAction);
                    }
                });
            });

            if (conflicts.length > 0) {
                keybind.setConflict(true, conflicts);
            } else {
                keybind.setConflict(false, []);
            }
        }
    }

    /**
     * Sync all keybind components (used after reset)
     */
    private syncAllKeybinds(): void {
        this.keybindComponents.forEach(keybind => {
            const actionName = keybind.getActionName();
            this.syncKeybind(actionName);
        });
    }
}
