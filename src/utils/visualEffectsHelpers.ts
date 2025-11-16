/**
 * Visual Effects Helpers
 * Convenient functions for spawning visual effects
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { VFX_PRESETS } from '../config/visualEffects';

/**
 * Show damage on an entity (spawns damage number + flash)
 * @param entityId Entity ID
 * @param amount Damage amount (negative for damage, positive for healing)
 * @param x World X position
 * @param y World Y position
 * @param isCritical Whether this is a critical hit
 */
export function showDamage(
    entityId: string,
    amount: number,
    x: number,
    y: number,
    isCritical: boolean = false
): void {
    EventBus.emit(GameEvents.ENTITY_DAMAGE, entityId, amount, x, y, isCritical);
}

/**
 * Show healing on an entity
 */
export function showHealing(
    entityId: string,
    amount: number,
    x: number,
    y: number
): void {
    EventBus.emit(GameEvents.ENTITY_HEALED, entityId, amount, x, y);
}

/**
 * Show death effect on an entity
 */
export function showDeath(
    entityId: string,
    x: number,
    y: number
): void {
    EventBus.emit(GameEvents.ENTITY_DIED, entityId, x, y);
}

// Export presets for easy access
export { VFX_PRESETS };
