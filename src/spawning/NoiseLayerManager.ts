/**
 * NoiseLayerManager - Manages multiple Perlin noise layers for procedural generation
 * Used for: resource distribution, enemy placement density, decoration patterns
 * 
 * Pattern:
 * - Create named layers with different scales/octaves for varied patterns
 * - Sample at world positions to get density/probability values
 * - Use for both spawn validation and clustering algorithms
 */

import { PerlinNoise } from '../utils/PerlinNoise';
import { NoiseLayers } from '../config/gameplay/spawnConfig';

/**
 * Configuration for a single noise layer
 */
export interface NoiseLayerConfig {
    scale: number;      // Frequency of noise (lower = larger features)
    octaves: number;    // Detail levels (more = more detail)
    persistence: number; // Amplitude falloff per octave (0-1)
    lacunarity: number; // Frequency multiplier per octave (typically 2.0)
}

/**
 * A single noise layer with its generator and config
 */
export class NoiseLayer {
    private noise: PerlinNoise;
    private config: NoiseLayerConfig;

    constructor(seed: number, config: NoiseLayerConfig) {
        this.noise = new PerlinNoise(seed);
        this.config = config;
    }

    /**
     * Sample noise at world position
     * @returns Value in range [0, 1]
     */
    public sample(x: number, y: number): number {
        const scaledX = x * this.config.scale;
        const scaledY = y * this.config.scale;

        let value = 0;
        let amplitude = 1.0;
        let frequency = 1.0;
        let maxValue = 0;

        // Multi-octave sampling
        for (let i = 0; i < this.config.octaves; i++) {
            const sampleX = scaledX * frequency;
            const sampleY = scaledY * frequency;
            
            // PerlinNoise.noise returns [-1, 1], map to [0, 1]
            const noiseValue = (this.noise.noise(sampleX, sampleY) + 1) * 0.5;
            
            value += noiseValue * amplitude;
            maxValue += amplitude;

            amplitude *= this.config.persistence;
            frequency *= this.config.lacunarity;
        }

        // Normalize to [0, 1]
        return value / maxValue;
    }

    public getConfig(): Readonly<NoiseLayerConfig> {
        return this.config;
    }
}

/**
 * Manages multiple named noise layers
 * Pattern: Create layers for different purposes (resources, enemies, decorations)
 */
export class NoiseLayerManager {
    private layers: Map<string, NoiseLayer> = new Map();
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Create a new noise layer
     * @param name Identifier for this layer (e.g., 'resources', 'enemies', 'decorations')
     * @param config Noise parameters
     */
    public createLayer(name: string, config: NoiseLayerConfig): NoiseLayer {
        // Use seed + hash of name for layer-specific seed
        const layerSeed = this.seed + this.hashString(name);
        const layer = new NoiseLayer(layerSeed, config);
        this.layers.set(name, layer);
        return layer;
    }

    /**
     * Get existing layer by name
     * @throws Error if layer doesn't exist
     */
    public getLayer(name: string): NoiseLayer {
        const layer = this.layers.get(name);
        if (!layer) {
            throw new Error(`Noise layer "${name}" not found. Available layers: ${Array.from(this.layers.keys()).join(', ')}`);
        }
        return layer;
    }

    /**
     * Check if layer exists
     */
    public hasLayer(name: string): boolean {
        return this.layers.has(name);
    }

    /**
     * Sample noise at world position from specific layer
     * @returns Value in range [0, 1]
     */
    public sampleAt(layerName: string, x: number, y: number): number {
        return this.getLayer(layerName).sample(x, y);
    }

    /**
     * Remove a layer
     */
    public removeLayer(name: string): boolean {
        return this.layers.delete(name);
    }

    /**
     * Clear all layers
     */
    public clear(): void {
        this.layers.clear();
    }

    /**
     * Get all layer names
     */
    public getLayerNames(): string[] {
        return Array.from(this.layers.keys());
    }

    /**
     * Initialize layers from NoiseLayers config
     * Pattern: Call this with DEFAULT_SPAWN_CONFIG.noiseLayers at level start
     */
    public initializeFromConfig(config: NoiseLayers): void {
        // Convert simple config to full NoiseLayerConfig with sensible defaults
        const defaultOctaves = 3;
        const defaultPersistence = 0.5;
        const defaultLacunarity = 2.0;

        this.createLayer('resources', {
            scale: config.resources.scale,
            octaves: defaultOctaves,
            persistence: defaultPersistence,
            lacunarity: defaultLacunarity
        });

        this.createLayer('enemies', {
            scale: config.enemies.scale,
            octaves: defaultOctaves,
            persistence: defaultPersistence,
            lacunarity: defaultLacunarity
        });

        this.createLayer('decorations', {
            scale: config.decorations.scale,
            octaves: defaultOctaves,
            persistence: defaultPersistence,
            lacunarity: defaultLacunarity
        });
    }

    /**
     * Simple string hash for deterministic layer seeds
     */
    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}
