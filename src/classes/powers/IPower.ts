/**
 * IPower - Base interface for Queen Powers
 * All queen powers must implement this interface
 */

/**
 * Base interface for all queen powers
 */
export interface IPower {
    /** Unique name identifier for the power */
    name: string;

    /** Whether this power is unlocked */
    isUnlocked: boolean;

    /** Current level (1-3) */
    level: number;

    /** Maximum level this power can reach */
    maxLevel: number;

    /** Cooldown time in seconds */
    cooldown: number;

    /** Timestamp (in seconds) when power was last used */
    lastUsedTime: number;

    /**
     * Use the power
     * @param queenX - Queen's grid X position
     * @param queenY - Queen's grid Y position
     * @param targetX - Optional target X position (for aimed powers)
     * @param targetY - Optional target Y position (for aimed powers)
     * @param targetId - Optional target entity ID (for single-target powers)
     * @returns True if power was successfully used
     */
    use(queenX: number, queenY: number, targetX?: number, targetY?: number, targetId?: string): boolean;

    /**
     * Check if power can be used
     * @returns True if power is off cooldown and unlocked
     */
    canUse(): boolean;

    /**
     * Upgrade the power to next level
     * @returns True if upgrade successful
     */
    upgrade(): boolean;

    /**
     * Check if power is on cooldown
     * @returns True if still cooling down
     */
    isOnCooldown(): boolean;

    /**
     * Get remaining cooldown time in seconds
     * @param currentTime - Current game time in seconds
     * @returns Seconds remaining, or 0 if ready
     */
    getCooldownRemaining(currentTime: number): number;
}
