import { EventBus, GameEvents } from '../utils/eventBus';
import { SettingsManager } from './SettingsManager';
import { KeyBindings } from '../config/defaultSettings';

/**
 * Result of a keybind operation
 */
interface KeyBindResult {
    success: boolean;
    conflict?: string; // Action name that has a conflict
}

/**
 * InputManager - Manages keyboard input bindings and state tracking
 * 
 * Responsibilities:
 * - Load/save keybinds from SettingsManager
 * - Handle key rebinding with conflict detection
 * - Track input state (pressed, just pressed, just released)
 * - Support multi-key bindings per action
 * - Emit events on keybind changes
 * 
 * Integration:
 * - Singleton pattern for global access
 * - Listens to SETTINGS_RESET and SETTING_KEYBIND_CHANGED events
 * - Saves changes back to SettingsManager
 */
export class InputManager {
    private static instance: InputManager | null = null;

    private keyBindings: KeyBindings;
    private settingsManager: SettingsManager;

    // Input state tracking
    private currentlyPressed: Set<string> = new Set(); // Currently held keys
    private justPressed: Set<string> = new Set();      // Keys pressed this frame
    private justReleased: Set<string> = new Set();     // Keys released this frame

    private constructor() {
        this.settingsManager = SettingsManager.getInstance();
        this.keyBindings = this.settingsManager.getKeyBindings();

        // Listen for global settings reset only
        EventBus.on(GameEvents.SETTINGS_RESET, () => {
            // Reload from SettingsManager after global reset
            this.keyBindings = this.settingsManager.getKeyBindings();
        });
        
        // Note: We don't listen to SETTING_KEYBIND_CHANGED because:
        // 1. When WE make changes, we already have the updated state
        // 2. External code should use InputManager methods, not SettingsManager directly
        // 3. This avoids circular event loops
    }

    public static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    /**
     * Get all keys bound to an action
     */
    public getKeyBinding(action: keyof KeyBindings): string[] {
        const keys = this.keyBindings[action];
        return keys ? [...keys] : []; // Return copy to prevent mutation
    }

    /**
     * Check if a specific key is bound to an action
     */
    public isKeyBoundToAction(key: string, action: keyof KeyBindings): boolean {
        const keys = this.keyBindings[action];
        return keys ? keys.includes(key) : false;
    }

    /**
     * Get the action that a key is bound to (returns first match)
     */
    public getActionForKey(key: string): keyof KeyBindings | null {
        for (const action in this.keyBindings) {
            if (this.keyBindings[action as keyof KeyBindings].includes(key)) {
                return action as keyof KeyBindings;
            }
        }
        return null;
    }

    /**
     * Rebind an action to a single key (replaces all existing bindings)
     */
    public rebindKey(action: keyof KeyBindings, newKey: string, force: boolean = false): KeyBindResult {
        // Validate key
        if (!newKey || newKey.trim() === '') {
            return { success: false };
        }

        // Check for conflicts
        if (!force) {
            const conflictingAction = this.getActionForKey(newKey);
            if (conflictingAction && conflictingAction !== action) {
                return { success: false, conflict: conflictingAction };
            }
        } else {
            // Force mode: remove key from all other actions
            this.removeKeyFromAllActions(newKey);
        }

        // Set new binding
        this.keyBindings[action] = [newKey];
        this.saveAndEmit(action);

        return { success: true };
    }

    /**
     * Add an additional key to an action (multi-key support)
     */
    public addKeyBinding(action: keyof KeyBindings, newKey: string, force: boolean = false): KeyBindResult {
        // Check if key already bound to this action
        if (this.isKeyBoundToAction(newKey, action)) {
            return { success: true }; // Already bound, no-op
        }

        // Check for conflicts
        if (!force) {
            const conflictingAction = this.getActionForKey(newKey);
            if (conflictingAction) {
                return { success: false, conflict: conflictingAction };
            }
        } else {
            // Force mode: remove key from all other actions
            this.removeKeyFromAllActions(newKey);
        }

        // Add to existing bindings
        this.keyBindings[action] = [...this.keyBindings[action], newKey];
        this.saveAndEmit(action);

        return { success: true };
    }

    /**
     * Remove a specific key from an action
     */
    public removeKeyBinding(action: keyof KeyBindings, keyToRemove: string): KeyBindResult {
        const keys = this.keyBindings[action];
        
        // Don't allow removing the last key
        if (keys.length <= 1) {
            return { success: false };
        }

        this.keyBindings[action] = keys.filter(k => k !== keyToRemove);
        this.saveAndEmit(action);

        return { success: true };
    }

    /**
     * Reset all keybinds to defaults
     */
    public resetToDefaults(): void {
        this.settingsManager.resetToDefaults();
        this.keyBindings = this.settingsManager.getKeyBindings();

        // Emit events for all actions
        for (const action in this.keyBindings) {
            EventBus.emit(
                GameEvents.SETTING_KEYBIND_CHANGED,
                action,
                this.keyBindings[action as keyof KeyBindings]
            );
        }
    }

    /**
     * Get all actions a key is bound to (for conflict detection)
     */
    public getConflicts(key: string): string[] {
        const conflicts: string[] = [];
        for (const action in this.keyBindings) {
            if (this.keyBindings[action as keyof KeyBindings].includes(key)) {
                conflicts.push(action);
            }
        }
        return conflicts;
    }

    /**
     * Export current keybinds (for save/load)
     */
    public exportKeybinds(): KeyBindings {
        return JSON.parse(JSON.stringify(this.keyBindings)); // Deep clone
    }

    /**
     * Import keybinds (for save/load)
     */
    public importKeybinds(bindings: KeyBindings): void {
        this.keyBindings = JSON.parse(JSON.stringify(bindings)); // Deep clone
        this.settingsManager.setKeyBindings(this.keyBindings);

        // Emit events for all actions
        for (const action in this.keyBindings) {
            EventBus.emit(
                GameEvents.SETTING_KEYBIND_CHANGED,
                action,
                this.keyBindings[action as keyof KeyBindings]
            );
        }
    }

    /**
     * Handle key press (call from sketch.ts or input system)
     */
    public handleKeyPress(key: string): void {
        if (!this.currentlyPressed.has(key)) {
            this.currentlyPressed.add(key);
            this.justPressed.add(key);
        }
    }

    /**
     * Handle key release (call from sketch.ts or input system)
     */
    public handleKeyRelease(key: string): void {
        this.currentlyPressed.delete(key);
        this.justReleased.add(key);
    }

    /**
     * Check if action is currently pressed
     */
    public isActionPressed(action: keyof KeyBindings): boolean {
        const keys = this.keyBindings[action];
        return keys.some(key => this.currentlyPressed.has(key));
    }

    /**
     * Check if action was just pressed this frame
     */
    public isActionJustPressed(action: keyof KeyBindings): boolean {
        const keys = this.keyBindings[action];
        return keys.some(key => this.justPressed.has(key));
    }

    /**
     * Check if action was just released this frame
     */
    public isActionJustReleased(action: keyof KeyBindings): boolean {
        const keys = this.keyBindings[action];
        return keys.some(key => this.justReleased.has(key));
    }

    /**
     * Update input state (call once per frame)
     * Clears "just pressed" and "just released" flags
     */
    public update(): void {
        this.justPressed.clear();
        this.justReleased.clear();
    }

    // Private helper methods

    private removeKeyFromAllActions(key: string): void {
        for (const action in this.keyBindings) {
            const keys = this.keyBindings[action as keyof KeyBindings];
            // Only remove if not the last key
            if (keys.length > 1) {
                this.keyBindings[action as keyof KeyBindings] = keys.filter(k => k !== key);
            }
        }
    }

    private saveAndEmit(action: keyof KeyBindings): void {
        // Save to SettingsManager
        this.settingsManager.setKeyBindings(this.keyBindings);

        // Emit event for this specific action
        EventBus.emit(
            GameEvents.SETTING_KEYBIND_CHANGED,
            action,
            this.keyBindings[action]
        );
    }
}
