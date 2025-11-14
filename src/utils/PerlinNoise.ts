/**
 * PerlinNoise - Simple 2D Perlin noise implementation
 * Generates smooth, continuous noise values for procedural generation
 * 
 * Features:
 * - Seeded for deterministic generation
 * - Returns values in range [-1, 1]
 * - Smooth interpolation using fade function
 * 
 * Usage:
 * ```typescript
 * const noise = new PerlinNoise(12345);
 * const value = noise.noise(x, y); // -1.0 to 1.0
 * const normalized = (value + 1) / 2; // 0.0 to 1.0
 * ```
 */

import { SeededRandom } from './SeededRandom';

export class PerlinNoise {
    private permutation: number[];

    constructor(seed: number) {
        const random = new SeededRandom(seed);
        
        // Generate permutation table
        this.permutation = [];
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }

        // Shuffle using seeded random
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(random.next() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }

        // Duplicate for wrapping
        this.permutation = this.permutation.concat(this.permutation);
    }

    /**
     * Smooth fade function for interpolation
     */
    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Linear interpolation
     */
    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    /**
     * Gradient function for Perlin noise
     */
    private grad(hash: number, x: number, y: number): number {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    /**
     * Generate 2D Perlin noise value at coordinates
     * @param x X coordinate
     * @param y Y coordinate
     * @returns Noise value in range [-1, 1]
     */
    noise(x: number, y: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const a = this.permutation[X] + Y;
        const b = this.permutation[X + 1] + Y;

        return this.lerp(v,
            this.lerp(u, this.grad(this.permutation[a], x, y), this.grad(this.permutation[b], x - 1, y)),
            this.lerp(u, this.grad(this.permutation[a + 1], x, y - 1), this.grad(this.permutation[b + 1], x - 1, y - 1))
        );
    }
    
    /**
     * Normalize noise value from [-1, 1] to [0, 1]
     */
    static normalize(value: number): number {
        return (value + 1) / 2;
    }
}
