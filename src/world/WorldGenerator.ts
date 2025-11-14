/**
 * WorldGenerator - Procedural world generation using Perlin noise
 * Generates tile-based worlds with varied terrain types
 */

import { Tile, TileType, TileData } from './TileSystem';
import { WorldGenConfig, DEFAULT_WORLD_GEN_CONFIG } from '../config/worldGenConfig';

/**
 * Simple seeded random number generator (LCG)
 */
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}

/**
 * Simple Perlin noise implementation
 */
class PerlinNoise {
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

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    private grad(hash: number, x: number, y: number): number {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

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
}

/**
 * WorldGenerator creates procedural tile-based worlds
 */
export class WorldGenerator {
    private noiseScale: number = 0.1;
    private config: WorldGenConfig;

    constructor(config?: WorldGenConfig) {
        this.config = config || { ...DEFAULT_WORLD_GEN_CONFIG };
        this.noiseScale = this.config.noiseScale;
    }

    /**
     * Update world generation configuration
     */
    setConfig(config: WorldGenConfig): void {
        this.config = { ...config };
        this.noiseScale = config.noiseScale;
    }

    /**
     * Get current world generation configuration
     */
    getConfig(): WorldGenConfig {
        return { ...this.config };
    }

    /**
     * Set noise scale (affects terrain feature size)
     * Lower values = larger features, higher values = more detail
     * @param scale Noise scale (typical range: 0.05 - 0.3)
     */
    setNoiseScale(scale: number): void {
        this.noiseScale = scale;
        this.config.noiseScale = scale;
    }

    /**
     * Get current noise scale
     */
    getNoiseScale(): number {
        return this.noiseScale;
    }

    /**
     * Generate a procedural world
     * @param width Width in tiles
     * @param height Height in tiles
     * @param seed Optional seed for deterministic generation
     * @returns 2D array of TileData [row][col]
     */
    generate(width: number, height: number, seed?: number): TileData[][] {
        // Use provided seed or generate random one
        const actualSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
        
        const noise = new PerlinNoise(actualSeed);
        const grid: TileData[][] = [];

        for (let row = 0; row < height; row++) {
            grid[row] = [];
            for (let col = 0; col < width; col++) {
                const tileType = this.selectTileType(noise, col, row);
                const tile = new Tile(col, row, tileType);
                grid[row][col] = tile.toData();
            }
        }

        return grid;
    }

    /**
     * Select tile type based on Perlin noise value
     * Uses configured thresholds for tile distribution
     * @param noise Perlin noise generator
     * @param col Column position
     * @param row Row position
     * @returns TileType
     */
    private selectTileType(noise: PerlinNoise, col: number, row: number): TileType {
        // Sample noise at this position
        const noiseValue = noise.noise(col * this.noiseScale, row * this.noiseScale);
        
        // Normalize noise from [-1, 1] to [0, 1]
        const normalized = (noiseValue + 1) / 2;

        // Use configured thresholds to select tile type
        const enabledThresholds = this.config.tileThresholds.filter(t => t.enabled);
        
        for (const threshold of enabledThresholds) {
            if (normalized < threshold.threshold) {
                return threshold.tileType;
            }
        }

        // Fallback to last enabled tile type
        return enabledThresholds[enabledThresholds.length - 1]?.tileType || TileType.GRASS;
    }
}
