"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputManager = void 0;
var eventBus_1 = require("../utils/eventBus");
var SettingsManager_1 = require("./SettingsManager");
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
var InputManager = /** @class */ (function () {
    function InputManager() {
        var _this = this;
        // Input state tracking
        this.currentlyPressed = new Set(); // Currently held keys
        this.justPressed = new Set(); // Keys pressed this frame
        this.justReleased = new Set(); // Keys released this frame
        this.settingsManager = SettingsManager_1.SettingsManager.getInstance();
        this.keyBindings = this.settingsManager.getKeyBindings();
        // Listen for global settings reset only
        eventBus_1.EventBus.on(eventBus_1.GameEvents.SETTINGS_RESET, function () {
            // Reload from SettingsManager after global reset
            _this.keyBindings = _this.settingsManager.getKeyBindings();
        });
        // Note: We don't listen to SETTING_KEYBIND_CHANGED because:
        // 1. When WE make changes, we already have the updated state
        // 2. External code should use InputManager methods, not SettingsManager directly
        // 3. This avoids circular event loops
    }
    InputManager.getInstance = function () {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    };
    /**
     * Get all keys bound to an action
     */
    InputManager.prototype.getKeyBinding = function (action) {
        var keys = this.keyBindings[action];
        return keys ? __spreadArray([], keys, true) : []; // Return copy to prevent mutation
    };
    /**
     * Check if a specific key is bound to an action
     */
    InputManager.prototype.isKeyBoundToAction = function (key, action) {
        var keys = this.keyBindings[action];
        return keys ? keys.includes(key) : false;
    };
    /**
     * Get the action that a key is bound to (returns first match)
     */
    InputManager.prototype.getActionForKey = function (key) {
        for (var action in this.keyBindings) {
            if (this.keyBindings[action].includes(key)) {
                return action;
            }
        }
        return null;
    };
    /**
     * Rebind an action to a single key (replaces all existing bindings)
     */
    InputManager.prototype.rebindKey = function (action, newKey, force) {
        if (force === void 0) { force = false; }
        // Validate key
        if (!newKey || newKey.trim() === '') {
            return { success: false };
        }
        // Check for conflicts
        if (!force) {
            var conflictingAction = this.getActionForKey(newKey);
            if (conflictingAction && conflictingAction !== action) {
                return { success: false, conflict: conflictingAction };
            }
        }
        else {
            // Force mode: remove key from all other actions
            this.removeKeyFromAllActions(newKey);
        }
        // Set new binding
        this.keyBindings[action] = [newKey];
        this.saveAndEmit(action);
        return { success: true };
    };
    /**
     * Add an additional key to an action (multi-key support)
     */
    InputManager.prototype.addKeyBinding = function (action, newKey, force) {
        if (force === void 0) { force = false; }
        // Check if key already bound to this action
        if (this.isKeyBoundToAction(newKey, action)) {
            return { success: true }; // Already bound, no-op
        }
        // Check for conflicts
        if (!force) {
            var conflictingAction = this.getActionForKey(newKey);
            if (conflictingAction) {
                return { success: false, conflict: conflictingAction };
            }
        }
        else {
            // Force mode: remove key from all other actions
            this.removeKeyFromAllActions(newKey);
        }
        // Add to existing bindings
        this.keyBindings[action] = __spreadArray(__spreadArray([], this.keyBindings[action], true), [newKey], false);
        this.saveAndEmit(action);
        return { success: true };
    };
    /**
     * Remove a specific key from an action
     */
    InputManager.prototype.removeKeyBinding = function (action, keyToRemove) {
        var keys = this.keyBindings[action];
        // Don't allow removing the last key
        if (keys.length <= 1) {
            return { success: false };
        }
        this.keyBindings[action] = keys.filter(function (k) { return k !== keyToRemove; });
        this.saveAndEmit(action);
        return { success: true };
    };
    /**
     * Reset all keybinds to defaults
     */
    InputManager.prototype.resetToDefaults = function () {
        this.settingsManager.resetToDefaults();
        this.keyBindings = this.settingsManager.getKeyBindings();
        // Emit events for all actions
        for (var action in this.keyBindings) {
            eventBus_1.EventBus.emit(eventBus_1.GameEvents.SETTING_KEYBIND_CHANGED, action, this.keyBindings[action]);
        }
    };
    /**
     * Get all actions a key is bound to (for conflict detection)
     */
    InputManager.prototype.getConflicts = function (key) {
        var conflicts = [];
        for (var action in this.keyBindings) {
            if (this.keyBindings[action].includes(key)) {
                conflicts.push(action);
            }
        }
        return conflicts;
    };
    /**
     * Export current keybinds (for save/load)
     */
    InputManager.prototype.exportKeybinds = function () {
        return JSON.parse(JSON.stringify(this.keyBindings)); // Deep clone
    };
    /**
     * Import keybinds (for save/load)
     */
    InputManager.prototype.importKeybinds = function (bindings) {
        this.keyBindings = JSON.parse(JSON.stringify(bindings)); // Deep clone
        this.settingsManager.setKeyBindings(this.keyBindings);
        // Emit events for all actions
        for (var action in this.keyBindings) {
            eventBus_1.EventBus.emit(eventBus_1.GameEvents.SETTING_KEYBIND_CHANGED, action, this.keyBindings[action]);
        }
    };
    /**
     * Handle key press (call from sketch.ts or input system)
     */
    InputManager.prototype.handleKeyPress = function (key) {
        if (!this.currentlyPressed.has(key)) {
            this.currentlyPressed.add(key);
            this.justPressed.add(key);
        }
    };
    /**
     * Handle key release (call from sketch.ts or input system)
     */
    InputManager.prototype.handleKeyRelease = function (key) {
        this.currentlyPressed.delete(key);
        this.justReleased.add(key);
    };
    /**
     * Check if action is currently pressed
     */
    InputManager.prototype.isActionPressed = function (action) {
        var _this = this;
        var keys = this.keyBindings[action];
        return keys.some(function (key) { return _this.currentlyPressed.has(key); });
    };
    /**
     * Check if action was just pressed this frame
     */
    InputManager.prototype.isActionJustPressed = function (action) {
        var _this = this;
        var keys = this.keyBindings[action];
        return keys.some(function (key) { return _this.justPressed.has(key); });
    };
    /**
     * Check if action was just released this frame
     */
    InputManager.prototype.isActionJustReleased = function (action) {
        var _this = this;
        var keys = this.keyBindings[action];
        return keys.some(function (key) { return _this.justReleased.has(key); });
    };
    /**
     * Update input state (call once per frame)
     * Clears "just pressed" and "just released" flags
     */
    InputManager.prototype.update = function () {
        this.justPressed.clear();
        this.justReleased.clear();
    };
    // Private helper methods
    InputManager.prototype.removeKeyFromAllActions = function (key) {
        for (var action in this.keyBindings) {
            var keys = this.keyBindings[action];
            // Only remove if not the last key
            if (keys.length > 1) {
                this.keyBindings[action] = keys.filter(function (k) { return k !== key; });
            }
        }
    };
    InputManager.prototype.saveAndEmit = function (action) {
        // Save to SettingsManager
        this.settingsManager.setKeyBindings(this.keyBindings);
        // Emit event for this specific action
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.SETTING_KEYBIND_CHANGED, action, this.keyBindings[action]);
    };
    InputManager.instance = null;
    return InputManager;
}());
exports.InputManager = InputManager;
