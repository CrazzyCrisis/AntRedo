import { PerlinNoise } from '../utils/PerlinNoise';
import { SpawnRuleValidator } from './SpawnRule';
import { SpawnConstraints } from '../config/gameplay/spawnConfig';

/**
 * Point in 2D space
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Rectangular bounds
 */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * ClusterSpawner
 * Provides various algorithms for spawning entities in clusters
 */
export class ClusterSpawner {
    /**
     * Spawn entities in a radial cluster around a center point
     * Natural-looking scattered placement with some randomness
     * 
     * @param center Center point of the cluster
     * @param count Number of entities to spawn
     * @param radius Maximum radius from center
     * @param constraints Spawn validation constraints
     * @param tileGrid Tile grid for validation
     * @param entityManager Entity manager for validation
     * @param noiseGen Optional noise generator for validation
     * @returns Array of valid spawn points
     */
    static spawnRadialCluster(
        center: Point,
        count: number,
        radius: number,
        constraints: SpawnConstraints,
        tileGrid: any,
        entityManager: any,
        noiseGen?: PerlinNoise
    ): Point[] {
        const points: Point[] = [];
        const maxAttempts = count * 10; // Prevent infinite loops
        let attempts = 0;

        while (points.length < count && attempts < maxAttempts) {
            attempts++;

            // Random angle (0 to 2π)
            const angle = Math.random() * Math.PI * 2;
            
            // Random distance (weighted towards outer radius for more spread)
            const distance = Math.sqrt(Math.random()) * radius;

            const x = center.x + Math.cos(angle) * distance;
            const y = center.y + Math.sin(angle) * distance;

            // Validate position
            const validation = SpawnRuleValidator.canSpawnAt(
                x, y, constraints, tileGrid, entityManager, noiseGen
            );

            if (validation.valid) {
                points.push({ x, y });
            }
        }

        return points;
    }

    /**
     * Spawn entities using Poisson disk sampling
     * Creates even distribution with minimum distance between points
     * Great for resources and decorations
     * 
     * @param bounds Area to spawn within
     * @param minDistance Minimum distance between spawn points
     * @param constraints Spawn validation constraints
     * @param tileGrid Tile grid for validation
     * @param entityManager Entity manager for validation
     * @param noiseGen Optional noise generator for validation
     * @param maxAttempts Maximum attempts per point
     * @returns Array of valid spawn points
     */
    static spawnPoissonDisk(
        bounds: Bounds,
        minDistance: number,
        constraints: SpawnConstraints,
        tileGrid: any,
        entityManager: any,
        noiseGen?: PerlinNoise,
        maxAttempts: number = 30
    ): Point[] {
        const points: Point[] = [];
        const grid: (Point | null)[][] = [];
        const cellSize = minDistance / Math.SQRT2;
        const gridWidth = Math.ceil(bounds.width / cellSize);
        const gridHeight = Math.ceil(bounds.height / cellSize);

        // Initialize grid
        for (let i = 0; i < gridHeight; i++) {
            grid[i] = new Array(gridWidth).fill(null);
        }

        // Helper to get grid cell
        const getCell = (x: number, y: number): [number, number] => {
            const col = Math.floor((x - bounds.x) / cellSize);
            const row = Math.floor((y - bounds.y) / cellSize);
            return [col, row];
        };

        // Helper to check if point is too close to others
        const isFarEnough = (point: Point): boolean => {
            const [col, row] = getCell(point.x, point.y);
            
            // Check neighboring cells
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const checkRow = row + dy;
                    const checkCol = col + dx;
                    
                    if (checkRow >= 0 && checkRow < gridHeight &&
                        checkCol >= 0 && checkCol < gridWidth) {
                        const neighbor = grid[checkRow][checkCol];
                        if (neighbor) {
                            const dist = Math.sqrt(
                                Math.pow(point.x - neighbor.x, 2) +
                                Math.pow(point.y - neighbor.y, 2)
                            );
                            if (dist < minDistance) {
                                return false;
                            }
                        }
                    }
                }
            }
            return true;
        };

        // Start with random initial point
        const firstPoint: Point = {
            x: bounds.x + Math.random() * bounds.width,
            y: bounds.y + Math.random() * bounds.height
        };

        const validation = SpawnRuleValidator.canSpawnAt(
            firstPoint.x, firstPoint.y, constraints, tileGrid, entityManager, noiseGen
        );

        if (validation.valid) {
            points.push(firstPoint);
            const [col, row] = getCell(firstPoint.x, firstPoint.y);
            grid[row][col] = firstPoint;
        }

        // Active list of points to generate around
        const active: Point[] = [...points];

        while (active.length > 0) {
            const activeIndex = Math.floor(Math.random() * active.length);
            const activePoint = active[activeIndex];
            let found = false;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // Generate random point around active point
                const angle = Math.random() * Math.PI * 2;
                const distance = minDistance + Math.random() * minDistance;
                const newPoint: Point = {
                    x: activePoint.x + Math.cos(angle) * distance,
                    y: activePoint.y + Math.sin(angle) * distance
                };

                // Check if within bounds
                if (newPoint.x < bounds.x || newPoint.x >= bounds.x + bounds.width ||
                    newPoint.y < bounds.y || newPoint.y >= bounds.y + bounds.height) {
                    continue;
                }

                // Check if far enough from other points
                if (!isFarEnough(newPoint)) {
                    continue;
                }

                // Validate spawn constraints
                const pointValidation = SpawnRuleValidator.canSpawnAt(
                    newPoint.x, newPoint.y, constraints, tileGrid, entityManager, noiseGen
                );

                if (pointValidation.valid) {
                    points.push(newPoint);
                    const [col, row] = getCell(newPoint.x, newPoint.y);
                    grid[row][col] = newPoint;
                    active.push(newPoint);
                    found = true;
                    break;
                }
            }

            if (!found) {
                active.splice(activeIndex, 1);
            }
        }

        return points;
    }

    /**
     * Spawn entities following Perlin noise patterns
     * Creates natural-looking veins and features
     * 
     * @param bounds Area to spawn within
     * @param noiseGen Perlin noise generator
     * @param threshold Min/max noise values to spawn within
     * @param density Probability of spawning (0-1)
     * @param sampleDistance Distance between sample points
     * @param constraints Spawn validation constraints
     * @param tileGrid Tile grid for validation
     * @param entityManager Entity manager for validation
     * @returns Array of valid spawn points
     */
    static spawnNoiseCluster(
        bounds: Bounds,
        noiseGen: PerlinNoise,
        threshold: { min: number; max: number },
        density: number,
        sampleDistance: number,
        constraints: SpawnConstraints,
        tileGrid: any,
        entityManager: any
    ): Point[] {
        const points: Point[] = [];

        // Sample grid across bounds
        for (let y = bounds.y; y < bounds.y + bounds.height; y += sampleDistance) {
            for (let x = bounds.x; x < bounds.x + bounds.width; x += sampleDistance) {
                // Sample noise at this position
                const noiseValue = noiseGen.noise(x, y);
                
                // Normalize to 0-1 range
                const normalizedNoise = (noiseValue + 1) / 2;

                // Check if within threshold
                if (normalizedNoise >= threshold.min && normalizedNoise <= threshold.max) {
                    // Apply density probability
                    if (Math.random() < density) {
                        // Validate spawn constraints
                        const validation = SpawnRuleValidator.canSpawnAt(
                            x, y, constraints, tileGrid, entityManager, noiseGen
                        );

                        if (validation.valid) {
                            // Add small random offset for natural variation
                            const offsetX = (Math.random() - 0.5) * sampleDistance * 0.5;
                            const offsetY = (Math.random() - 0.5) * sampleDistance * 0.5;
                            points.push({ x: x + offsetX, y: y + offsetY });
                        }
                    }
                }
            }
        }

        return points;
    }

    /**
     * Spawn entities in a grid formation
     * Useful for structured enemy patrols or organized bases
     * 
     * @param center Center point of the grid
     * @param rows Number of rows
     * @param cols Number of columns
     * @param spacing Distance between grid points
     * @param constraints Spawn validation constraints
     * @param tileGrid Tile grid for validation
     * @param entityManager Entity manager for validation
     * @param noiseGen Optional noise generator for validation
     * @param offsetVariation Random offset variation (0-1)
     * @returns Array of valid spawn points
     */
    static spawnGridFormation(
        center: Point,
        rows: number,
        cols: number,
        spacing: number,
        constraints: SpawnConstraints,
        tileGrid: any,
        entityManager: any,
        noiseGen?: PerlinNoise,
        offsetVariation: number = 0.2
    ): Point[] {
        const points: Point[] = [];

        // Calculate grid bounds
        const gridWidth = (cols - 1) * spacing;
        const gridHeight = (rows - 1) * spacing;
        const startX = center.x - gridWidth / 2;
        const startY = center.y - gridHeight / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Base position
                let x = startX + col * spacing;
                let y = startY + row * spacing;

                // Add random offset for natural look
                if (offsetVariation > 0) {
                    x += (Math.random() - 0.5) * spacing * offsetVariation;
                    y += (Math.random() - 0.5) * spacing * offsetVariation;
                }

                // Validate position
                const validation = SpawnRuleValidator.canSpawnAt(
                    x, y, constraints, tileGrid, entityManager, noiseGen
                );

                if (validation.valid) {
                    points.push({ x, y });
                }
            }
        }

        return points;
    }

    /**
     * Spawn entities in a line formation
     * Useful for walls, barriers, or patrol paths
     * 
     * @param start Start point
     * @param end End point
     * @param count Number of entities to spawn
     * @param constraints Spawn validation constraints
     * @param tileGrid Tile grid for validation
     * @param entityManager Entity manager for validation
     * @param noiseGen Optional noise generator for validation
     * @returns Array of valid spawn points
     */
    static spawnLineFormation(
        start: Point,
        end: Point,
        count: number,
        constraints: SpawnConstraints,
        tileGrid: any,
        entityManager: any,
        noiseGen?: PerlinNoise
    ): Point[] {
        const points: Point[] = [];

        for (let i = 0; i < count; i++) {
            // Interpolate along line
            const t = i / (count - 1);
            const x = start.x + (end.x - start.x) * t;
            const y = start.y + (end.y - start.y) * t;

            // Validate position
            const validation = SpawnRuleValidator.canSpawnAt(
                x, y, constraints, tileGrid, entityManager, noiseGen
            );

            if (validation.valid) {
                points.push({ x, y });
            }
        }

        return points;
    }
}
