/**
 * IComponent Interface
 * Base interface for all entity components
 * Components add behavior to GameObject entities
 */

import { GameObject } from '../GameObject';

export interface IComponent {
    /**
     * Reference to the GameObject that owns this component
     */
    owner: GameObject;

    /**
     * Called when component is attached to a GameObject
     * @param owner - The GameObject this component is attached to
     */
    onAttach(owner: GameObject): void;

    /**
     * Called when component is detached from a GameObject
     */
    onDetach(): void;

    /**
     * Called every frame to update component behavior
     * @param deltaTime - Time elapsed since last update (in milliseconds)
     */
    update(deltaTime: number): void;
}
