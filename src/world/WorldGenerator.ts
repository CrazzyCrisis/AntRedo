/**
 * WorldGenerator - Procedural world generation using Perlin noise
 * Generates tile-based worlds with varied terrain types
 */

import { Tile, TileType, TileData } from './TileSystem';
import { WorldGenConfig, DEFAULT_WORLD_GEN_CONFIG } from '../config/worldGenConfig';
import { PerlinNoise } from '../utils/PerlinNoise';
import { EventBus, GameEvents } from '../utils/eventBus';

/**
 * WorldGenerator creates procedural tile-based worlds
 */
export class WorldGenerator {
    private noiseScale: number = 0.1;
    private config: WorldGenConfig;
    private lastWidth: number = 0;
    private lastHeight: number = 0;
    private lastSeed?: number;
    private eventUnsubscribe?: () => void;

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
     * Enable event-driven regeneration.
     * When enabled, WorldGenerator listens for WORLDGEN_REGENERATE events
     * and automatically regenerates terrain using the last generation parameters.
     * 
     * @param width Width in tiles (stored for regeneration)
     * @param height Height in tiles (stored for regeneration)
     * @param seed Optional seed (stored for regeneration)
     */
    enableEventDrivenRegeneration(width: number, height: number, seed?: number): void {
        this.lastWidth = width;
        this.lastHeight = height;
        this.lastSeed = seed;
        
        // Clean up existing listener if any
        if (this.eventUnsubscribe) {
            this.eventUnsubscribe();
        }
        
        // Listen for regeneration requests
        this.eventUnsubscribe = EventBus.on(GameEvents.WORLDGEN_REGENERATE, () => {
            const newGrid = this.generate(this.lastWidth, this.lastHeight, this.lastSeed);
            EventBus.emit(GameEvents.WORLD_GENERATED, newGrid);
        });
    }
    
    /**
     * Disable event-driven regeneration and clean up listener
     */
    disableEventDrivenRegeneration(): void {
        if (this.eventUnsubscribe) {
            this.eventUnsubscribe();
            this.eventUnsubscribe = undefined;
        }
    }

    /**
     * Generate a procedural world
     * @param width Width in tiles
     * @param height Height in tiles
     * @param seed Optional seed for deterministic generation
     * @returns 2D array of TileData [row][col]
     */
    generate(width: number, height: number, seed?: number): TileData[][] {
        // Store parameters for potential event-driven regeneration
        this.lastWidth = width;
        this.lastHeight = height;
        if (seed !== undefined) {
            this.lastSeed = seed;
        }
        
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
        const normalized = PerlinNoise.normalize(noiseValue);

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
