/**
 * Minimap UI Component
 * Shows overhead view of entire map with entity markers
 * Click to navigate camera or queen to location
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { drawUIPanel, isPointInRect, clamp } from '../../utils/helpers';
import { Camera } from '../Camera';
import { TileGrid } from '../../world/TileGrid';
import { TILE_SIZE, TileType } from '../../world/TileSystem';

// Declare p5.js global functions
declare const createGraphics: any;

interface MinimapMarker {
    id: string;
    type: 'queen' | 'ant' | 'resource' | 'building' | 'enemy' | 'boss';
    worldX: number;
    worldY: number;
    color: string;
    size: number;
}

/**
 * MinimapComponent - Overhead tactical map view
 * Shows entire game world in miniature with entity markers
 */
export class MinimapComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 950; // High depth to appear on top
    
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private worldWidth: number;
    private worldHeight: number;
    private camera: Camera | null = null;
    private tileGrid: TileGrid | null = null;
    
    private markers: Map<string, MinimapMarker>;
    private backgroundColor: string = '#1a1a1a';
    private borderColor: string = '#4a4a4a';
    private viewportColor: string = '#ffff00'; // Yellow viewport rectangle
    
    // Cached world rendering
    private worldCache: any = null; // p5.Graphics buffer
    private cacheNeedsUpdate: boolean = true;
    
    // Interaction state
    private isHovered: boolean = false;

    constructor(x: number, y: number, width: number, height: number, worldWidth: number, worldHeight: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.markers = new Map();
        
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for entity movements
        EventBus.on(GameEvents.ENTITY_MOVED, (entityId: string, worldX: number, worldY: number) => {
            const marker = this.markers.get(entityId);
            if (marker) {
                marker.worldX = worldX;
                marker.worldY = worldY;
            } else {
                // Marker doesn't exist - entity might have spawned before minimap was created
                console.warn(`[Minimap] ENTITY_MOVED for unknown marker: ${entityId}`);
            }
        });
        
        // Listen for entity creation/destruction
        EventBus.on(GameEvents.ENTITY_ADDED, (entityId: string, type: string, worldX: number, worldY: number) => {
            this.addMinimapMarker(type, worldX, worldY, entityId);
        });
        
        EventBus.on(GameEvents.ENTITY_REMOVED, (entityId: string) => {
            this.removeMinimapMarker(entityId);
        });
        
        // Listen for queen creation (special marker)
        EventBus.on(GameEvents.QUEEN_CREATED, (queenId: string, gridX: number, gridY: number) => {
            const worldX = gridX * TILE_SIZE;
            const worldY = gridY * TILE_SIZE;
            this.addMinimapMarker('queen', worldX, worldY, queenId);
        });
        
        // Resource markers disabled - too much visual clutter
        // EventBus.on(GameEvents.RESOURCE_CREATED, ...)
        
        // Listen for building placement
        EventBus.on(GameEvents.BUILDING_PLACED, (buildingId: string, gridX: number, gridY: number) => {
            const worldX = gridX * TILE_SIZE;
            const worldY = gridY * TILE_SIZE;
            this.addMinimapMarker('building', worldX, worldY, buildingId);
        });
        
        // Listen for building destruction
        EventBus.on(GameEvents.BUILDING_DESTROYED, (buildingId: string) => {
            this.removeMinimapMarker(buildingId);
        });
        
        // Listen for boss creation
        EventBus.on(GameEvents.BOSS_CREATED, (bossId: string, gridX: number, gridY: number) => {
            const worldX = gridX * TILE_SIZE;
            const worldY = gridY * TILE_SIZE;
            this.addMinimapMarker('boss', worldX, worldY, bossId);
        });
        
        // Listen for ant creation
        EventBus.on(GameEvents.ANT_CREATED, (antId: string, gridX: number, gridY: number) => {
            const worldX = gridX * TILE_SIZE;
            const worldY = gridY * TILE_SIZE;
            this.addMinimapMarker('ant', worldX, worldY, antId);
        });
        
        // Listen for entity deaths
        EventBus.on(GameEvents.ENTITY_DIED, (entityId: string) => {
            this.removeMinimapMarker(entityId);
        });
        
        // Listen for resource depletion
        EventBus.on(GameEvents.RESOURCE_DEPLETED, (resourceId: string) => {
            this.removeMinimapMarker(resourceId);
        });
    }

    /**
     * Set camera reference for viewport display
     */
    setCamera(camera: Camera): void {
        this.camera = camera;
    }

    /**
     * Set tile grid for cached world rendering
     */
    setTileGrid(tileGrid: TileGrid): void {
        this.tileGrid = tileGrid;
        this.cacheNeedsUpdate = true;
        console.log(`[Minimap] TileGrid set - ${tileGrid.getWidth()}x${tileGrid.getHeight()} tiles - cache will render on next frame`);
    }

    /**
     * Add marker to minimap
     */
    addMinimapMarker(type: string, worldX: number, worldY: number, id?: string): void {
        const markerId = id || `marker_${Date.now()}_${Math.random()}`;
        
        // Determine marker color and size based on type
        let color: string;
        let size: number;
        
        switch (type) {
            case 'queen':
                color = '#ffff00'; // Yellow
                size = 8;
                break;
            case 'ant':
                color = '#00ff00'; // Green
                size = 3;
                break;
            case 'resource':
                color = '#00ffff'; // Cyan
                size = 4;
                break;
            case 'building':
                color = '#8b4513'; // Brown
                size = 6;
                break;
            case 'enemy':
            case 'boss':
                color = '#ff0000'; // Red
                size = 8;
                break;
            default:
                color = '#ffffff'; // White
                size = 3;
        }
        
        const marker: MinimapMarker = {
            id: markerId,
            type: type as any,
            worldX,
            worldY,
            color,
            size
        };
        
        this.markers.set(markerId, marker);
    }

    /**
     * Remove marker from minimap
     */
    removeMinimapMarker(id: string): void {
        this.markers.delete(id);
    }

    /**
     * Update entity position on minimap
     */
    updateEntityPosition(id: string, worldX: number, worldY: number): void {
        const marker = this.markers.get(id);
        if (marker) {
            marker.worldX = worldX;
            marker.worldY = worldY;
        }
    }

    /**
     * Convert world coordinates to minimap coordinates
     */
    private worldToMinimapX(worldX: number): number {
        return this.x + (worldX / this.worldWidth) * this.width;
    }

    private worldToMinimapY(worldY: number): number {
        return this.y + (worldY / this.worldHeight) * this.height;
    }

    /**
     * Convert minimap coordinates to world coordinates
     */
    private minimapToWorldX(minimapX: number): number {
        const relativeX = (minimapX - this.x) / this.width;
        const worldX = relativeX * this.worldWidth;
        return worldX;
    }

    private minimapToWorldY(minimapY: number): number {
        const relativeY = (minimapY - this.y) / this.height;
        const worldY = relativeY * this.worldHeight;
        return worldY;
    }

    /**
     * Handle mouse click on minimap
     */
    handleClick(mouseX: number, mouseY: number): boolean {
        // Use centerOrigin=false since minimap x,y is top-left corner, not center
        if (!isPointInRect(mouseX, mouseY, this.x, this.y, this.width, this.height, false)) {
            return false; // Click not on minimap
        }
        // Convert minimap coords to world coords
        const worldX = this.minimapToWorldX(mouseX);
        const worldY = this.minimapToWorldY(mouseY);
        
        // Emit stop following event FIRST (before moving camera)
        EventBus.emit(GameEvents.CAMERA_STOP_FOLLOWING);
        
        // Then emit camera move event
        EventBus.emit(GameEvents.MINIMAP_CLICKED, worldX, worldY);
        
        return true; // Click was on minimap
    }

    /**
     * Handle mouse movement for hover state
     */
    handleMouseMove(mouseX: number, mouseY: number): void {
        const wasHovered = this.isHovered;
        // Use centerOrigin=false since minimap x,y is top-left corner, not center
        this.isHovered = isPointInRect(mouseX, mouseY, this.x, this.y, this.width, this.height, false);
        
        // Emit hover events
        if (this.isHovered && !wasHovered) {
            EventBus.emit(GameEvents.MINIMAP_HOVER_START);
        } else if (!this.isHovered && wasHovered) {
            EventBus.emit(GameEvents.MINIMAP_HOVER_END);
        }
    }

    /**
     * Set minimap position
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Set world dimensions (for proper scaling)
     */
    setWorldDimensions(width: number, height: number): void {
        this.worldWidth = width;
        this.worldHeight = height;
        this.cacheNeedsUpdate = true; // Recache when world size changes
    }

    /**
     * Invalidate world cache (call when tiles change)
     */
    invalidateCache(): void {
        this.cacheNeedsUpdate = true;
    }

    /**
     * Populate minimap with existing entities (call after minimap creation)
     * Use EntityManager to find all existing entities
     */
    populateExistingEntities(): void {
        // Import EntityManager dynamically to avoid circular dependency
        const { EntityManager } = require('../../managers/EntityManager');
        const entities = EntityManager.getInstance().getAllEntities();
        
        console.log(`[Minimap] Populating with ${entities.length} existing entities`);
        
        for (const entity of entities) {
            // Determine entity type and add marker
            let markerType: string;
            if (entity.entityClass === 'queen') {
                markerType = 'queen';
            } else if (entity.entityClass === 'ant') {
                markerType = 'ant';
            } else if (entity.entityClass === 'resource') {
                continue; // Skip resources - too much clutter
            } else if (entity.entityClass === 'building') {
                markerType = 'building';
            } else if (entity.entityClass === 'boss') {
                markerType = 'boss';
            } else {
                continue; // Skip unknown entity types
            }
            
            // Get world position - some entities use x/y, others use gridX/gridY
            let worldX = entity.x;
            let worldY = entity.y;
            
            // If x/y are undefined, try gridX/gridY (resources, buildings)
            if (worldX === undefined && entity.gridX !== undefined) {
                worldX = entity.gridX * TILE_SIZE;
            }
            if (worldY === undefined && entity.gridY !== undefined) {
                worldY = entity.gridY * TILE_SIZE;
            }
            
            // Skip if still no valid position
            if (worldX === undefined || worldY === undefined) {
                console.warn(`[Minimap] Skipping ${markerType} ${entity.id} - no valid position`);
                continue;
            }
            
            this.addMinimapMarker(markerType, worldX, worldY, entity.id);
        }
        
        console.log(`[Minimap] ✅ Populated with ${this.markers.size} markers`);
    }

    /**
     * Render cached world to off-screen buffer
     */
    private renderWorldCache(): void {
        if (!this.tileGrid) {
            console.warn('[Minimap] Cannot render cache - no TileGrid set');
            return;
        }

        console.log('[Minimap] Rendering world cache...');
        
        // Create graphics buffer if needed (use global createGraphics from p5.js)
        if (!this.worldCache) {
            this.worldCache = createGraphics(this.width, this.height);
            console.log(`[Minimap] Created graphics buffer: ${this.width}x${this.height}`);
        }

        // Clear and render world
        this.worldCache.background(this.backgroundColor);
        
        const gridWidth = this.tileGrid.getWidth();
        const gridHeight = this.tileGrid.getHeight();
        
        // Calculate scale factors
        const scaleX = this.width / (gridWidth * TILE_SIZE);
        const scaleY = this.height / (gridHeight * TILE_SIZE);
        
        // Render tiles as colored pixels
        this.worldCache.noStroke();
        
        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                const tile = this.tileGrid.getTileDataAt(col, row);
                if (!tile) continue;
                
                // Map tile type to minimap color
                let tileColor: string;
                switch (tile.type) {
                    case TileType.GRASS:
                        tileColor = '#2d5016'; // Dark green
                        break;
                    case TileType.DIRT:
                        tileColor = '#3d2817'; // Brown
                        break;
                    case TileType.STONE:
                        tileColor = '#4a4a4a'; // Gray
                        break;
                    case TileType.WATER:
                        tileColor = '#1a3a52'; // Dark blue
                        break;
                    case TileType.SAND:
                    case TileType.SAND_DARK:
                        tileColor = '#5a4a2a'; // Sandy brown
                        break;
                    default:
                        tileColor = '#2a2a2a'; // Default dark gray
                }
                
                // Calculate minimap position
                const minimapX = col * TILE_SIZE * scaleX;
                const minimapY = row * TILE_SIZE * scaleY;
                const tileWidth = TILE_SIZE * scaleX;
                const tileHeight = TILE_SIZE * scaleY;
                
                this.worldCache.fill(tileColor);
                this.worldCache.rect(minimapX, minimapY, tileWidth, tileHeight);
            }
        }
        
        this.cacheNeedsUpdate = false;
        console.log('✅ Minimap world cache rendered');
    }

    render(graphics: any): void {
        // Update world cache if needed
        if (this.cacheNeedsUpdate && this.tileGrid) {
            // Render world cache (uses global p5 createGraphics)
            this.renderWorldCache();
        }
        
        // Draw cached world if available
        if (this.worldCache) {
            graphics.image(this.worldCache, this.x, this.y);
        } else if (this.tileGrid) {
            console.warn('[Minimap] Has TileGrid but no cache - should have rendered');
        } else {
            // Fallback: Draw background panel
            drawUIPanel(
                graphics,
                this.x,
                this.y,
                this.width,
                this.height,
                this.backgroundColor,
                0.9
            );
        }
        
        // Draw border (brighter when hovered)
        graphics.stroke(this.isHovered ? '#ffff00' : this.borderColor);
        graphics.strokeWeight(this.isHovered ? 3 : 2);
        graphics.noFill();
        graphics.rect(this.x, this.y, this.width, this.height);
        
        // Draw markers
        graphics.noStroke();
        for (const marker of this.markers.values()) {
            const minimapX = this.worldToMinimapX(marker.worldX);
            const minimapY = this.worldToMinimapY(marker.worldY);
            
            // Clamp to minimap bounds
            const clampedX = clamp(minimapX, this.x, this.x + this.width);
            const clampedY = clamp(minimapY, this.y, this.y + this.height);
            
            // Draw marker
            graphics.fill(marker.color);
            
            if (marker.type === 'building') {
                // Draw buildings as rectangles
                graphics.rect(clampedX - marker.size/2, clampedY - marker.size/2, marker.size, marker.size);
            } else {
                // Draw other entities as circles
                graphics.circle(clampedX, clampedY, marker.size);
            }
        }
        
        // Draw viewport rectangle (FIXED: use camera canvas dimensions)
        if (this.camera) {
            // Get camera's canvas dimensions (these should match the actual game viewport)
            const cameraViewportWidth = 800; // TODO: Get from camera or config
            const cameraViewportHeight = 600; // TODO: Get from camera or config
            
            // Calculate viewport bounds in world space
            const viewportLeft = this.camera.x - cameraViewportWidth / 2;
            const viewportTop = this.camera.y - cameraViewportHeight / 2;
            
            // Convert to minimap coordinates
            const viewportX = this.worldToMinimapX(viewportLeft);
            const viewportY = this.worldToMinimapY(viewportTop);
            const viewportW = (cameraViewportWidth / this.worldWidth) * this.width;
            const viewportH = (cameraViewportHeight / this.worldHeight) * this.height;
            
            graphics.noFill();
            graphics.stroke(this.viewportColor);
            graphics.strokeWeight(2);
            graphics.rect(viewportX, viewportY, viewportW, viewportH);
        }
        
        // Draw title
        graphics.fill('#ffffff');
        graphics.noStroke();
        graphics.textAlign(graphics.CENTER, graphics.TOP);
        graphics.textSize(12);
        graphics.text('MAP', this.x + this.width/2, this.y - 18);
    }

    /**
     * Cleanup event listeners
     */
    destroy(): void {
        // EventBus cleanup handled by EventBus.clear() in tests
        this.markers.clear();
        
        // Cleanup graphics buffer
        if (this.worldCache) {
            this.worldCache.remove();
            this.worldCache = null;
        }
    }
}
