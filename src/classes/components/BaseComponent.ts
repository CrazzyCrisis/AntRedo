/**
 * BaseComponent - Abstract base class for all components
 * Eliminates lifecycle boilerplate (onAttach/onDetach owner management)
 * All components should extend this instead of implementing IComponent directly
 */

import { IComponent } from './IComponent';
import { GameObject } from '../GameObject';

export abstract class BaseComponent implements IComponent {
    public owner!: GameObject;
    
    /**
     * Lifecycle: Attach to GameObject
     * Automatically sets owner reference and calls onAttached() hook
     */
    onAttach(owner: GameObject): void {
        this.owner = owner;
        this.onAttached();
    }
    
    /**
     * Lifecycle: Detach from GameObject
     * Automatically calls onDetaching() hook and clears owner reference
     */
    onDetach(): void {
        // Call hook BEFORE clearing owner so subclass can access it
        this.onDetaching();
        this.owner = undefined!;
    }
    
    /**
     * Hook: Called after owner is set (override for custom attach logic)
     * Example: Subscribe to EventBus events, initialize component state
     */
    protected onAttached(): void {
        // Override in subclass if needed
    }
    
    /**
     * Hook: Called before owner is cleared (override for custom detach logic)
     * Example: Unsubscribe from EventBus events, cleanup resources
     */
    protected onDetaching(): void {
        // Override in subclass if needed
    }
    
    /**
     * Lifecycle: Update component (must be implemented by subclass)
     * @param deltaTime - Time since last update in milliseconds
     */
    abstract update(deltaTime: number): void;
}
