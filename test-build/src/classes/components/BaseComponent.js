"use strict";
/**
 * BaseComponent - Abstract base class for all components
 * Eliminates lifecycle boilerplate (onAttach/onDetach owner management)
 * All components should extend this instead of implementing IComponent directly
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseComponent = void 0;
var BaseComponent = /** @class */ (function () {
    function BaseComponent() {
    }
    /**
     * Lifecycle: Attach to GameObject
     * Automatically sets owner reference and calls onAttached() hook
     */
    BaseComponent.prototype.onAttach = function (owner) {
        this.owner = owner;
        this.onAttached();
    };
    /**
     * Lifecycle: Detach from GameObject
     * Automatically calls onDetaching() hook and clears owner reference
     */
    BaseComponent.prototype.onDetach = function () {
        // Call hook BEFORE clearing owner so subclass can access it
        this.onDetaching();
        this.owner = undefined;
    };
    /**
     * Hook: Called after owner is set (override for custom attach logic)
     * Example: Subscribe to EventBus events, initialize component state
     */
    BaseComponent.prototype.onAttached = function () {
        // Override in subclass if needed
    };
    /**
     * Hook: Called before owner is cleared (override for custom detach logic)
     * Example: Unsubscribe from EventBus events, cleanup resources
     */
    BaseComponent.prototype.onDetaching = function () {
        // Override in subclass if needed
    };
    return BaseComponent;
}());
exports.BaseComponent = BaseComponent;
