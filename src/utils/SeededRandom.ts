/**
 * SeededRandom - Simple seeded random number generator (LCG)
 * Provides deterministic random number generation for procedural content
 * 
 * Usage:
 * ```typescript
 * const random = new SeededRandom(12345);
 * const value = random.next(); // 0.0 to 1.0
 * ```
 */
export class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    /**
     * Generate next random number in sequence
     * @returns Random number between 0.0 and 1.0
     */
    next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
    
    /**
     * Get current seed value
     */
    getSeed(): number {
        return this.seed;
    }
}
