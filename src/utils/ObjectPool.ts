/**
 * ObjectPool - Generic object pooling for performance optimization
 * Reuses objects instead of creating/destroying them repeatedly
 * 
 * Usage:
 * ```typescript
 * const particlePool = new ObjectPool(
 *     () => new Particle(),           // Factory function
 *     (particle) => particle.reset(), // Reset function
 *     50                              // Initial size
 * );
 * 
 * const particle = particlePool.acquire();
 * // ... use particle
 * particlePool.release(particle);
 * ```
 */

export class ObjectPool<T> {
    private available: T[] = [];
    private inUse: Set<T> = new Set();
    private factory: () => T;
    private reset: (obj: T) => void;
    private maxSize: number;

    /**
     * Create an object pool
     * @param factory - Function that creates new objects
     * @param reset - Function that resets objects to default state
     * @param initialSize - Number of objects to pre-create
     * @param maxSize - Maximum pool size (default: Infinity)
     */
    constructor(
        factory: () => T,
        reset: (obj: T) => void,
        initialSize: number = 10,
        maxSize: number = Infinity
    ) {
        this.factory = factory;
        this.reset = reset;
        this.maxSize = maxSize;

        // Pre-create initial objects
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.factory());
        }
    }

    /**
     * Get an object from the pool
     * Creates a new one if pool is empty
     */
    public acquire(): T {
        let obj: T;

        if (this.available.length > 0) {
            obj = this.available.pop()!;
        } else {
            obj = this.factory();
        }

        this.inUse.add(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     * Resets the object and makes it available for reuse
     */
    public release(obj: T): void {
        if (!this.inUse.has(obj)) {
            console.warn('[ObjectPool] Attempting to release object not in use');
            return;
        }

        this.inUse.delete(obj);
        this.reset(obj);

        // Only keep if under max size
        if (this.available.length < this.maxSize) {
            this.available.push(obj);
        }
    }

    /**
     * Release multiple objects at once
     */
    public releaseMany(objects: T[]): void {
        objects.forEach(obj => this.release(obj));
    }

    /**
     * Get pool statistics
     */
    public getStats(): { available: number; inUse: number; total: number } {
        return {
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size
        };
    }

    /**
     * Clear the pool completely
     */
    public clear(): void {
        this.available = [];
        this.inUse.clear();
    }
}
