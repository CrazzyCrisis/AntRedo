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
    
    private markers: Map<string, MinimapMarker>;
    private backgroundColor: string = '#1a1a1a';
    private borderColor: string = '#4a4a4a';
    private viewportColor: string = '#ffff00'; // Yellow viewport rectangle
    
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
            const worldX = gridX * 16; // TODO: Get tile size from config
            const worldY = gridY * 16;
            this.addMinimapMarker('queen', worldX, worldY, queenId);
        });
        
        // Listen for resource spawns
        EventBus.on(GameEvents.RESOURCE_CREATED, (resourceId: string, gridX: number, gridY: number, _resourceType: string) => {
            const worldX = gridX * 16;
            const worldY = gridY * 16;
            this.addMinimapMarker('resource', worldX, worldY, resourceId);
        });
        
        // Listen for building placement
        EventBus.on(GameEvents.BUILDING_PLACED, (buildingId: string, gridX: number, gridY: number) => {
            const worldX = gridX * 16;
            const worldY = gridY * 16;
            this.addMinimapMarker('building', worldX, worldY, buildingId);
        });
        
        // Listen for building destruction
        EventBus.on(GameEvents.BUILDING_DESTROYED, (buildingId: string) => {
            this.removeMinimapMarker(buildingId);
        });
        
        // Listen for boss creation
        EventBus.on(GameEvents.BOSS_CREATED, (bossId: string, gridX: number, gridY: number) => {
            const worldX = gridX * 16;
            const worldY = gridY * 16;
            this.addMinimapMarker('boss', worldX, worldY, bossId);
        });
        
        // Listen for ant creation
        EventBus.on(GameEvents.ANT_CREATED, (antId: string, gridX: number, gridY: number) => {
            const worldX = gridX * 16;
            const worldY = gridY * 16;
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
        return relativeX * this.worldWidth;
    }

    private minimapToWorldY(minimapY: number): number {
        const relativeY = (minimapY - this.y) / this.height;
        return relativeY * this.worldHeight;
    }

    /**
     * Handle mouse click on minimap
     */
    handleClick(mouseX: number, mouseY: number): boolean {
        if (!isPointInRect(mouseX, mouseY, this.x, this.y, this.width, this.height)) {
            return false; // Click not on minimap
        }
        
        // Convert minimap coords to world coords
        const worldX = this.minimapToWorldX(mouseX);
        const worldY = this.minimapToWorldY(mouseY);
        
        // Emit event to move camera/queen
        EventBus.emit(GameEvents.MINIMAP_CLICKED, worldX, worldY);
        return true; // Click was on minimap
    }

    /**
     * Handle mouse movement for hover state
     */
    handleMouseMove(mouseX: number, mouseY: number): void {
        const wasHovered = this.isHovered;
        this.isHovered = isPointInRect(mouseX, mouseY, this.x, this.y, this.width, this.height);
        
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
    }

    render(graphics: any): void {
        // Draw background panel
        drawUIPanel(
            graphics,
            this.x,
            this.y,
            this.width,
            this.height,
            this.backgroundColor,
            0.9
        );
        
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
        
        // Draw viewport rectangle
        if (this.camera) {
            const viewportX = this.worldToMinimapX(this.camera.x - 400); // Half canvas width
            const viewportY = this.worldToMinimapY(this.camera.y - 300); // Half canvas height
            const viewportW = (800 / this.worldWidth) * this.width;
            const viewportH = (600 / this.worldHeight) * this.height;
            
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
    }
}
