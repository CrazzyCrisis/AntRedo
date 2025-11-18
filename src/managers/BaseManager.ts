/**
 * BaseManager - Abstract base class for singleton managers
 * Extracts common patterns: singleton, EventBus subscriptions, cleanup
 */

/**
 * Abstract base class for singleton managers
 * Provides:
 * - Singleton pattern boilerplate
 * - EventBus subscription management
 * - Automatic cleanup
 */
export abstract class BaseManager {
    /**
     * EventBus unsubscribe functions for automatic cleanup
     */
    protected eventUnsubscribers: Array<() => void> = [];

    /**
     * Subscribe to EventBus event and track for automatic cleanup
     * @param event Event name to listen to
     * @param handler Event handler function
     * @returns Unsubscribe function (also tracked automatically)
     */
    protected subscribe(event: string, handler: (...args: any[]) => void): () => void {
        // Import EventBus dynamically to avoid circular dependencies
        const { EventBus } = require('../utils/eventBus');
        const unsubscribe = EventBus.on(event, handler);
        this.eventUnsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Subscribe to EventBus event (one-time) and track for automatic cleanup
     * @param event Event name to listen to
     * @param handler Event handler function
     * @returns Unsubscribe function (also tracked automatically)
     */
    protected subscribeOnce(event: string, handler: (...args: any[]) => void): () => void {
        const { EventBus } = require('../utils/eventBus');
        const unsubscribe = EventBus.once(event, handler);
        this.eventUnsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Emit an EventBus event
     * @param event Event name
     * @param args Event arguments
     */
    protected emit(event: string, ...args: any[]): void {
        const { EventBus } = require('../utils/eventBus');
        EventBus.emit(event, ...args);
    }

    /**
     * Cleanup all EventBus subscriptions
     * Should be called in subclass cleanup() method
     */
    protected cleanupSubscriptions(): void {
        this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
        this.eventUnsubscribers = [];
    }

    /**
     * Override this for manager-specific cleanup
     */
    public abstract cleanup(): void;
}

/**
 * Singleton mixin type for managers
 * Usage:
 * ```typescript
 * export class MyManager extends BaseManager {
 *     private static instance: MyManager;
 *     
 *     private constructor() {
 *         super();
 *         // Setup...
 *     }
 *     
 *     public static getInstance(): MyManager {
 *         if (!MyManager.instance) {
 *             MyManager.instance = new MyManager();
 *         }
 *         return MyManager.instance;
 *     }
 *     
 *     public cleanup(): void {
 *         this.cleanupSubscriptions();
 *         // Additional cleanup...
 *     }
 * }
 * ```
 */
