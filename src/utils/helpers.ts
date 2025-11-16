// Utility helper functions

// Generate random integer between min and max (inclusive)
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Calculate distance between two points
export function distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Clamp value between min and max
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

// Map value from one range to another
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Check if point is inside rectangle
export function pointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

// Check if point is inside circle
export function pointInCircle(px: number, py: number, cx: number, cy: number, radius: number): boolean {
    return distance(px, py, cx, cy) <= radius;
}

// Check if two rectangles intersect
export function rectIntersect(r1x: number, r1y: number, r1w: number, r1h: number, r2x: number, r2y: number, r2w: number, r2h: number): boolean {
    return !(r2x > r1x + r1w || r2x + r2w < r1x || r2y > r1y + r1h || r2y + r2h < r1y);
}

// Check if two circles intersect
export function circleIntersect(c1x: number, c1y: number, r1: number, c2x: number, c2y: number, r2: number): boolean {
    return distance(c1x, c1y, c2x, c2y) <= r1 + r2;
}

// Generate random float between min and max
export function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

// Pick random element from array
export function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// Shuffle array (Fisher-Yates algorithm)
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Calculate angle between two points (in radians)
export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Convert degrees to radians
export function degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees
export function radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
}

// Normalize angle to range [0, 2π)
export function normalizeAngle(angle: number): number {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
}

// Get perpendicular angle (rotate by 90 degrees / π/2 radians)
export function perpendicularAngle(angle: number): number {
    return angle + Math.PI / 2;
}

// Calculate fade-out alpha based on progress (0-1)
export function fadeOutAlpha(progress: number, maxAlpha: number = 255): number {
    return maxAlpha * (1 - progress);
}

// Calculate fade-in alpha based on progress (0-1)
export function fadeInAlpha(progress: number, maxAlpha: number = 255): number {
    return maxAlpha * progress;
}

// Deep clone an object (simple version)
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

// Debounce function calls
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: number;
    return function (this: any, ...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    };
}

// Throttle function calls
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function (this: any, ...args: Parameters<T>) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// Format time in MM:SS format
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate percentage
export function percentage(value: number, total: number): number {
    return total === 0 ? 0 : (value / total) * 100;
}

// Ease functions for animations
type EaseFunction = (t: number) => number;

export const ease: Record<string, EaseFunction> = {
    linear: (t: number) => t,
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1)
};

// Grid/Tile utilities
export interface GridCell {
    col: number;
    row: number;
}

export interface WorldPosition {
    x: number;
    y: number;
}

export function worldToGrid(x: number, y: number, tileSize: number): GridCell {
    return {
        col: Math.floor(x / tileSize),
        row: Math.floor(y / tileSize)
    };
}

export function gridToWorld(col: number, row: number, tileSize: number): WorldPosition {
    return {
        x: col * tileSize,
        y: row * tileSize
    };
}

export function gridToWorldCenter(col: number, row: number, tileSize: number): WorldPosition {
    return {
        x: col * tileSize + tileSize / 2,
        y: row * tileSize + tileSize / 2
    };
}

/**
 * Tile position options for flexible entity placement
 * Allows up to 9 entities per tile by placing them at different positions
 */
export type TilePosition = 'TL' | 'T' | 'TR' | 'L' | 'C' | 'R' | 'BL' | 'B' | 'BR';

/**
 * Convert grid coordinates to world coordinates with flexible positioning within the tile
 * @param col - Grid column
 * @param row - Grid row
 * @param tileSize - Size of one tile in pixels
 * @param position - Position within tile (TL=top-left, T=top-center, TR=top-right, L=left, C=center, R=right, BL=bottom-left, B=bottom, BR=bottom-right)
 * @returns World position with specified offset within tile
 */
export function gridToWorldPosition(col: number, row: number, tileSize: number, position: TilePosition = 'C'): WorldPosition {
    const baseX = col * tileSize;
    const baseY = row * tileSize;
    const quarter = tileSize / 4;
    const half = tileSize / 2;
    const threeQuarters = tileSize * 3 / 4;
    
    const offsets: Record<TilePosition, { x: number; y: number }> = {
        'TL': { x: quarter, y: quarter },           // Top-left
        'T':  { x: half, y: quarter },              // Top-center
        'TR': { x: threeQuarters, y: quarter },     // Top-right
        'L':  { x: quarter, y: half },              // Left-center
        'C':  { x: half, y: half },                 // Center (default)
        'R':  { x: threeQuarters, y: half },        // Right-center
        'BL': { x: quarter, y: threeQuarters },     // Bottom-left
        'B':  { x: half, y: threeQuarters },        // Bottom-center
        'BR': { x: threeQuarters, y: threeQuarters } // Bottom-right
    };
    
    const offset = offsets[position];
    return {
        x: baseX + offset.x,
        y: baseY + offset.y
    };
}

// Get neighboring grid cells (4-directional)
export function getNeighbors4(col: number, row: number): GridCell[] {
    return [
        { col: col, row: row - 1 },     // top
        { col: col + 1, row: row },     // right
        { col: col, row: row + 1 },     // bottom
        { col: col - 1, row: row }      // left
    ];
}

// Get neighboring grid cells (8-directional)
export function getNeighbors8(col: number, row: number): GridCell[] {
    return [
        { col: col - 1, row: row - 1 }, // top-left
        { col: col, row: row - 1 },     // top
        { col: col + 1, row: row - 1 }, // top-right
        { col: col + 1, row: row },     // right
        { col: col + 1, row: row + 1 }, // bottom-right
        { col: col, row: row + 1 },     // bottom
        { col: col - 1, row: row + 1 }, // bottom-left
        { col: col - 1, row: row }      // left
    ];
}

// Vector utilities (useful for p5.Vector)
export function vectorMagnitude(x: number, y: number): number {
    return Math.sqrt(x * x + y * y);
}

export function vectorNormalize(x: number, y: number): WorldPosition {
    const mag = vectorMagnitude(x, y);
    return mag > 0 ? { x: x / mag, y: y / mag } : { x: 0, y: 0 };
}

export function vectorLimit(x: number, y: number, max: number): WorldPosition {
    const mag = vectorMagnitude(x, y);
    if (mag > max) {
        const normalized = vectorNormalize(x, y);
        return { x: normalized.x * max, y: normalized.y * max };
    }
    return { x, y };
}

// Calculate Manhattan distance (grid distance)
export function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

// Check if value is within range
export function inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

// Wrap value around min/max (useful for toroidal worlds)
export function wrap(value: number, min: number, max: number): number {
    const range = max - min;
    return value < min ? max - (min - value) % range : min + (value - min) % range;
}

// Color utilities
export interface RGB {
    r: number;
    g: number;
    b: number;
}

export function hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function lerpColor(color1: string, color2: string, t: number): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    if (!c1 || !c2) return color1;
    
    return rgbToHex(
        Math.round(lerp(c1.r, c2.r, t)),
        Math.round(lerp(c1.g, c2.g, t)),
        Math.round(lerp(c1.b, c2.b, t))
    );
}

// FPS counter
export class FPSCounter {
    private frames: number[] = [];
    
    update(): void {
        const now = Date.now();
        this.frames.push(now);
        // Keep only last second of frames
        while (this.frames.length > 0 && this.frames[0] < now - 1000) {
            this.frames.shift();
        }
    }
    
    getFPS(): number {
        return this.frames.length;
    }
}

// Simple timer class
export class Timer {
    private elapsed: number = 0;
    private running: boolean = false;
    
    constructor(private duration: number) {}
    
    start(): void {
        this.running = true;
        this.elapsed = 0;
    }
    
    stop(): void {
        this.running = false;
    }
    
    reset(): void {
        this.elapsed = 0;
    }
    
    update(deltaTime: number): void {
        if (this.running) {
            this.elapsed += deltaTime;
        }
    }
    
    isFinished(): boolean {
        return this.elapsed >= this.duration;
    }
    
    getProgress(): number {
        return clamp(this.elapsed / this.duration, 0, 1);
    }
}

// Simple state machine helper
export class StateMachine<T extends string = string> {
    private currentState: T;
    private previousState: T | null = null;
    
    constructor(initialState: T) {
        this.currentState = initialState;
    }
    
    setState(newState: T): void {
        this.previousState = this.currentState;
        this.currentState = newState;
    }
    
    is(state: T): boolean {
        return this.currentState === state;
    }
    
    wasState(state: T): boolean {
        return this.previousState === state;
    }
    
    getCurrentState(): T {
        return this.currentState;
    }
    
    getPreviousState(): T | null {
        return this.previousState;
    }
}

// Array chunk utility
export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// Remove element from array
export function removeFromArray<T>(array: T[], element: T): T[] {
    const index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}

// Weighted random choice
export function weightedRandomChoice<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    return items[items.length - 1];
}

// Check if arrays are equal
export function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value === arr2[index]);
}

// Get unique values from array
export function uniqueArray<T>(array: T[]): T[] {
    return [...new Set(array)];
}

// Sum array values
export function sumArray(array: number[]): number {
    return array.reduce((sum, val) => sum + val, 0);
}

// Average array values
export function averageArray(array: number[]): number {
    return array.length === 0 ? 0 : sumArray(array) / array.length;
}

// ============================================================================
// ENTITY/POWER HELPERS (for power system and entity queries)
// ============================================================================

/**
 * Get all entities within radius of a position
 * @param entityManager - EntityManager instance
 * @param centerX - Center X position
 * @param centerY - Center Y position
 * @param radius - Search radius
 * @param activeOnly - Only return active entities (default true)
 * @returns Array of entities within radius
 */
export function getEntitiesInRadius(
    entityManager: any,
    centerX: number,
    centerY: number,
    radius: number,
    activeOnly: boolean = true
): any[] {
    return entityManager.getAllEntities().filter((entity: any) => {
        if (activeOnly && !entity.isActive) return false;
        const dist = distance(centerX, centerY, entity.gridX, entity.gridY);
        return dist <= radius;
    });
}

/**
 * Check if entity is enemy to a faction
 * @param entityManager - EntityManager instance
 * @param factionManager - FactionManager instance
 * @param entityId - Entity ID to check
 * @param referenceFactionId - Faction ID to compare against
 * @returns True if entity is enemy
 */
export function isEntityEnemy(
    entityManager: any,
    factionManager: any,
    entityId: string,
    referenceFactionId: string | null
): boolean {
    // If no faction system, all entities are enemies
    if (!referenceFactionId) return true;

    // Get entity from EntityManager
    const entity = entityManager.getEntity(entityId);
    if (!entity) return false;

    // Check if entity has faction ID property
    const entityFactionId = entity.factionId;
    if (!entityFactionId) return true; // No faction = enemy

    // Use FactionManager to check if enemy
    return factionManager.isEnemy(referenceFactionId, entityFactionId);
}

/**
 * Calculate falloff factor based on distance (1.0 at center, 0.0 at edge)
 * @param currentDistance - Current distance from center
 * @param maxDistance - Maximum distance (edge of radius)
 * @returns Falloff factor (0.0 to 1.0)
 */
export function distanceFalloff(currentDistance: number, maxDistance: number): number {
    if (maxDistance === 0) return 1;
    return clamp(1 - (currentDistance / maxDistance), 0, 1);
}

/**
 * Apply knockback/push force with distance falloff
 * @param sourceX - Source X position (center of force)
 * @param sourceY - Source Y position
 * @param targetX - Target X position (entity being pushed)
 * @param targetY - Target Y position
 * @param maxForce - Maximum force at center
 * @param radius - Radius of effect
 * @returns {x, y} vector for force
 */
export function calculatePushForce(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    maxForce: number,
    radius: number
): { x: number; y: number } {
    const angle = angleBetween(sourceX, sourceY, targetX, targetY);
    const dist = distance(sourceX, sourceY, targetX, targetY);
    const falloff = distanceFalloff(dist, radius);
    const actualForce = maxForce * falloff;

    return {
        x: Math.cos(angle) * actualForce,
        y: Math.sin(angle) * actualForce
    };
}

// ============================================================================
// FACTORY PATTERN HELPERS
// ============================================================================

/**
 * Setup automatic sprite-to-entity binding with EventBus listeners
 * Handles sprite registration, ENTITY_MOVED tracking, ENTITY_DESTROYED cleanup
 * @param entity - GameObject to bind sprite to
 * @param sprite - SpriteComponent to register
 * @param renderer - Renderer instance
 * @param layer - RenderLayer for sprite
 * @param gridToWorldFn - Function to convert grid coordinates to world coordinates
 */
export function setupEntitySpriteBinding(
    entity: any,
    sprite: any,
    renderer: any,
    layer: any
): void {
    // Import dynamically to avoid circular dependencies
    const { EventBus, GameEvents } = require('./eventBus');
    
    // Register sprite with renderer
    const unregister = renderer.register(sprite);
    
    // Listen for smooth position updates - update sprite position for smooth rendering
    const smoothMoveListener = EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (entityId: string, smoothX: number, smoothY: number) => {
        if (entityId === entity.id) {
            sprite.setPosition(smoothX, smoothY);
            renderer.markLayerDirty(layer);
        }
    });
    
    // Listen for grid position updates - update depth sorting only (not visual position)
    const moveListener = EventBus.on(GameEvents.ENTITY_MOVED, (entityId: string, _gridX: number, gridY: number) => {
        if (entityId === entity.id) {
            sprite.setDepth(gridY);
            renderer.markLayerDirty(layer);
        }
    });
    
    // Listen for entity destruction - cleanup sprite
    // CRITICAL: Use EventBus.on() NOT once() because once() unsubscribes after first event,
    // and we need to check entity.id for every ENTITY_DESTROYED event
    const destroyListener = EventBus.on(GameEvents.ENTITY_DESTROYED, (entityId: string) => {
        if (entityId === entity.id) {
            unregister();
            EventBus.off(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, smoothMoveListener);
            EventBus.off(GameEvents.ENTITY_MOVED, moveListener);
            EventBus.off(GameEvents.ENTITY_DESTROYED, destroyListener);
        }
    });
    
    // Store cleanup function on entity for manual cleanup
    entity._cleanup = () => {
        unregister();
        EventBus.off(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, smoothMoveListener);
        EventBus.off(GameEvents.ENTITY_MOVED, moveListener);
        EventBus.off(GameEvents.ENTITY_DESTROYED, destroyListener);
    };
}

// ============================================================================
// EVENTBUS EMIT HELPERS
// ============================================================================

/**
 * Create a tile background renderable for static scenes (menus, etc.)
 * Generates procedural tile world and returns a renderable object for the Renderer.
 * 
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param tileSprites - Map of tile type to sprite image
 * @param _tileEdgeSprites - Map of frill path to sprite image (optional, reserved for future use)
 * @param seed - Random seed for world generation (default: 42)
 * @param worldGenConfig - World generation config (optional, uses DEFAULT_WORLD_GEN_CONFIG)
 * @returns Object with renderable and unregister function
 * 
 * @example
 * ```typescript
 * const { renderable, cleanup } = createTileBackgroundRenderable(
 *     800, 600, tileSprites, tileEdgeSprites
 * );
 * const unregister = renderer.register(renderable);
 * // Later: cleanup()
 * ```
 */
export function createTileBackgroundRenderable(
    canvasWidth: number,
    canvasHeight: number,
    tileSprites: { [key: number]: any },
    _tileEdgeSprites?: { [path: string]: any },
    seed: number = Date.now(),
    worldGenConfig?: any
): { renderable: any; cleanup: () => void } {
    // Dynamic imports to avoid circular dependencies
    const { WorldGenerator } = require('../world/WorldGenerator');
    const { TileGrid } = require('../world/TileGrid');
    const { TILE_SIZE } = require('../world/TileSystem');
    const { TILE_CONFIG } = require('../config/tileConfig');
    const { DEFAULT_WORLD_GEN_CONFIG } = require('../config/worldGenConfig');
    const { RenderLayer } = require('../rendering/RenderLayer');
    
    // Calculate world size to cover canvas
    const worldWidth = Math.ceil(canvasWidth / TILE_SIZE) + 4; // Extra tiles for coverage
    const worldHeight = Math.ceil(canvasHeight / TILE_SIZE) + 4;
    
    // Generate world
    const config = worldGenConfig || DEFAULT_WORLD_GEN_CONFIG;
    const worldGenerator = new WorldGenerator(config);
    const gridData = worldGenerator.generate(worldWidth, worldHeight, seed);
    const tileGrid = new TileGrid(gridData);
    
    // Calculate offset to center world around (0, 0)
    const offsetX = -(worldWidth * TILE_SIZE) / 2;
    const offsetY = -(worldHeight * TILE_SIZE) / 2;
    
    // Create renderable
    const renderable = {
        depth: 0,
        layer: RenderLayer.GROUND,
        render: (graphics: any) => {
            const grid = tileGrid.getGrid();
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const tile = grid[row][col];
                    const x = (col * TILE_SIZE) + offsetX; // Apply offset to center
                    const y = (row * TILE_SIZE) + offsetY; // Apply offset to center
                    
                    if (TILE_CONFIG.USE_SPRITES && tileSprites[tile.type]) {
                        graphics.image(tileSprites[tile.type], x, y, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        }
    };
    
    return {
        renderable,
        cleanup: () => {
            // Cleanup if needed in future (currently no resources to clean)
        }
    };
}

/**
 * Emit entity event with owner.id check
 * Common pattern: if (this.owner) { EventBus.emit(..., this.owner.id, ...) }
 * @param entity - Entity or component owner (must have .id property)
 * @param eventName - Event name to emit
 * @param args - Additional event arguments
 */
export function emitEntityEvent(
    entity: any,
    eventName: string,
    ...args: any[]
): void {
    if (entity) {
        const { EventBus } = require('./eventBus');
        EventBus.emit(eventName, entity.id, ...args);
    }
}

/**
 * Emit destruction event and destroy entity
 * Common pattern: EventBus.emit('X_DESTROYED', id, type); entity.destroy();
 * @param entity - GameObject to destroy (must have .id, .type, .destroy())
 * @param eventName - Event name to emit before destruction
 */
export function destroyAndEmit(entity: any, eventName: string): void {
    const { EventBus } = require('./eventBus');
    EventBus.emit(eventName, entity.id, entity.type);
    entity.destroy();
}

// ============================================================================
// UI RENDERING HELPERS
// ============================================================================

/**
 * Draw radial cooldown overlay (counter-clockwise progress indicator)
 * Draws a darkened icon + radial "pie slice" that shrinks as cooldown progresses
 * Common pattern for ability/power cooldowns in games
 * 
 * @param graphics - p5.Graphics context to draw on
 * @param x - Center X position of the icon
 * @param y - Center Y position of the icon
 * @param size - Diameter of the cooldown circle
 * @param progress - Cooldown progress (0 = ready, 1 = full cooldown)
 * @param darkenAlpha - Alpha value for darkening overlay (default 150)
 * @param radialColor - Color of radial overlay (default semi-transparent black)
 * 
 * @example
 * // Power on 50% cooldown
 * drawRadialCooldown(graphics, powerX, powerY, 64, 0.5);
 * 
 * // Custom styling
 * drawRadialCooldown(graphics, x, y, 48, progress, 180, '#FF0000');
 */
export function drawRadialCooldown(
    graphics: any,
    x: number,
    y: number,
    size: number,
    progress: number,
    darkenAlpha: number = 150,
    radialColor: string = '#000000'
): void {
    graphics.push();
    
    // 1. Draw darkening overlay on entire icon
    if (progress > 0) {
        graphics.fill(0, 0, 0, darkenAlpha);
        graphics.noStroke();
        graphics.circle(x, y, size);
    }
    
    // 2. Draw radial cooldown "pie slice"
    if (progress > 0) {
        // Convert hex color to RGB
        const rgb = hexToRgb(radialColor);
        if (rgb) {
            graphics.fill(rgb.r, rgb.g, rgb.b, 180);
        } else {
            graphics.fill(0, 0, 0, 180);
        }
        graphics.noStroke();
        
        // Calculate angles (counter-clockwise from top)
        const startAngle = -Math.PI / 2; // Top (270° / -90°)
        const sweepAngle = progress * Math.PI * 2; // Full circle = 2π
        
        // Draw arc (PIE mode for filled wedge)
        graphics.arc(
            x, y,
            size, size,
            startAngle,
            startAngle + sweepAngle,
            'PIE' as any
        );
    }
    
    graphics.pop();
}

/**
 * Draw UI panel with rounded corners and semi-transparent background
 * Common pattern for all UI components (resource display, power bar, etc.)
 * 
 * @param graphics - p5.Graphics context to draw on
 * @param x - X position (top-left corner)
 * @param y - Y position (top-left corner)
 * @param width - Panel width
 * @param height - Panel height
 * @param backgroundColor - Hex color string (default dark gray)
 * @param alpha - Background alpha transparency (0-255, default 200)
 * @param cornerRadius - Rounded corner radius (default 8)
 * 
 * @example
 * // Standard UI panel
 * drawUIPanel(graphics, 10, 10, 200, 100);
 * 
 * // Custom styling
 * drawUIPanel(graphics, x, y, w, h, '#3C3C3C', 180, 12);
 */
export function drawUIPanel(
    graphics: any,
    x: number,
    y: number,
    width: number,
    height: number,
    backgroundColor: string = '#2C2C2C',
    alpha: number = 200,
    cornerRadius: number = 8
): void {
    const rgb = hexToRgb(backgroundColor);
    if (rgb) {
        graphics.fill(rgb.r, rgb.g, rgb.b, alpha);
    } else {
        graphics.fill(44, 44, 44, alpha); // Fallback to default gray
    }
    graphics.noStroke();
    graphics.rect(x, y, width, height, cornerRadius);
}

/**
 * Format number with comma thousands separators
 * Common pattern for displaying resource counts, population, etc.
 * 
 * @param num - Number to format
 * @returns Formatted string with commas (e.g., 1000 → "1,000")
 * 
 * @example
 * formatNumberWithCommas(1000) // "1,000"
 * formatNumberWithCommas(1234567) // "1,234,567"
 */
export function formatNumberWithCommas(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Smooth animation helper using lerp interpolation
 * Returns new value that smoothly transitions toward target
 * Common pattern for UI animations (expand/collapse, fade, slide)
 * 
 * @param current - Current value
 * @param target - Target value
 * @param speed - Interpolation speed (0-1, default 0.2)
 * @param snapThreshold - Snap to target when within this distance (default 1)
 * @returns New current value
 * 
 * @example
 * // Smooth height animation
 * this.currentHeight = smoothTransition(this.currentHeight, targetHeight, 0.2, 1);
 * 
 * // Faster animation
 * this.alpha = smoothTransition(this.alpha, 255, 0.4, 2);
 */
export function smoothTransition(
    current: number,
    target: number,
    speed: number = 0.2,
    snapThreshold: number = 1
): number {
    const newValue = current + (target - current) * speed;
    
    // Snap to target when close enough
    if (Math.abs(newValue - target) < snapThreshold) {
        return target;
    }
    
    return newValue;
}

// ============================================================================
// BUTTON/INTERACTION HELPERS
// ============================================================================

/**
 * Check if point is inside a rectangle (button bounds checking)
 * Common pattern for all clickable UI elements
 * 
 * @param pointX - Mouse/point X coordinate
 * @param pointY - Mouse/point Y coordinate
 * @param rectX - Rectangle center X (or top-left if centerOrigin=false)
 * @param rectY - Rectangle center Y (or top-left if centerOrigin=false)
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param centerOrigin - If true, rectX/rectY are center point (default true)
 * @returns True if point is inside rectangle
 * 
 * @example
 * // Center-origin button (most common for UI)
 * if (isPointInRect(mouseX, mouseY, buttonX, buttonY, 64, 64)) {
 *     // Button clicked
 * }
 * 
 * // Top-left origin
 * if (isPointInRect(mouseX, mouseY, panelX, panelY, 200, 100, false)) {
 *     // Panel clicked
 * }
 */
export function isPointInRect(
    pointX: number,
    pointY: number,
    rectX: number,
    rectY: number,
    width: number,
    height: number,
    centerOrigin: boolean = true
): boolean {
    if (centerOrigin) {
        return (
            pointX >= rectX - width / 2 &&
            pointX <= rectX + width / 2 &&
            pointY >= rectY - height / 2 &&
            pointY <= rectY + height / 2
        );
    } else {
        return (
            pointX >= rectX &&
            pointX <= rectX + width &&
            pointY >= rectY &&
            pointY <= rectY + height
        );
    }
}

/**
 * Calculate button positions for horizontal button bar layout
 * Common pattern for power bar, command buttons, etc.
 * Returns array of x positions centered around baseX
 * 
 * @param baseX - Center X position for the entire button bar
 * @param buttonCount - Number of buttons
 * @param buttonSize - Width of each button
 * @param spacing - Distance between button centers
 * @returns Array of x positions for each button
 * 
 * @example
 * // 4 buttons centered at x=400
 * const positions = calculateButtonBarPositions(400, 4, 56, 70);
 * // Returns: [265, 335, 405, 475] (buttons centered around 400)
 */
export function calculateButtonBarPositions(
    baseX: number,
    buttonCount: number,
    buttonSize: number,
    spacing: number
): number[] {
    const positions: number[] = [];
    const totalWidth = (buttonCount * spacing) - (spacing - buttonSize);
    const startX = baseX - totalWidth / 2 + buttonSize / 2;
    
    for (let i = 0; i < buttonCount; i++) {
        positions.push(startX + (i * spacing));
    }
    
    return positions;
}

/**
 * Get button color based on state (normal/hover/selected/disabled)
 * Common pattern for all interactive buttons
 * Returns hex color string
 * 
 * @param isEnabled - Whether button is enabled
 * @param isSelected - Whether button is selected
 * @param isHovered - Whether button is hovered
 * @param colors - Color scheme object with normal/hover/selected/disabled colors
 * @returns Hex color string
 * 
 * @example
 * const colors = {
 *     normal: '#444444',
 *     hover: '#555555',
 *     selected: '#4CAF50',
 *     disabled: '#222222'
 * };
 * const color = getButtonStateColor(enabled, selected, hovered, colors);
 */
export function getButtonStateColor(
    isEnabled: boolean,
    isSelected: boolean,
    isHovered: boolean,
    colors: {
        normal: string,
        hover: string,
        selected: string,
        disabled: string
    }
): string {
    if (!isEnabled) return colors.disabled;
    if (isSelected) return colors.selected;
    if (isHovered) return colors.hover;
    return colors.normal;
}

