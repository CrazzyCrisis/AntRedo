/**
 * BuildingPlacementManager - Ghost Sprite and Building Placement Validation
 * Handles visual preview, grid snapping, multi-tile validation, and placement confirmation
 * Singleton pattern with EventBus integration for keyboard cancellation
 */

import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';
import { BuildingType, getBuildingByType } from '../config/buildings/buildingConfig';
import { TileType, TILE_SIZE } from '../world/TileSystem';
import { Renderable } from '../rendering/Renderable';
import { RenderLayer } from '../rendering/RenderLayer';
import { worldToGrid, gridToWorldCenter } from '../utils/helpers';

/**
 * Validation state for building placement
 */
type ValidationState = 'valid' | 'invalid_terrain' | 'insufficient_resources' | 'collision';

/**
 * Ghost sprite component for visual preview
 */
class GhostSpriteComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.ENTITIES;
    public depth: number = 500;
    public visible: boolean = true;
    
    public x: number = 0;
    public y: number = 0;
    public sprite: any = null;
    public tintColor: string = '#FFFFFF';
    public alpha: number = 128; // Semi-transparent
    public width: number = 128; // Default size (2x2 tiles)
    public height: number = 128;
    
    constructor(sprite: any, x: number, y: number, width: number = 128, height: number = 128) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    render(graphics: any): void {
        if (!this.sprite || !this.visible) return;
        
        graphics.push();
        graphics.tint(this.tintColor);
        graphics.imageMode((window as any).CENTER);
        graphics.image(this.sprite, this.x, this.y, this.width, this.height);
        graphics.pop();
    }
}

/**
 * BuildingPlacementManager
 * Manages ghost sprite preview and validation for building placement
 */
export class BuildingPlacementManager extends BaseManager {
    private static instance: BuildingPlacementManager;
    
    private renderer: any = null;
    private camera: any = null;
    private tileGrid: any = null;
    private factionId: string = '';
    
    private isPlacementActive: boolean = false;
    private currentBuildingType: BuildingType | null = null;
    private ghostSprite: GhostSpriteComponent | null = null;
    private ghostUnregister: (() => void) | null = null;
    
    private currentGridX: number = 0;
    private currentGridY: number = 0;
    private validationState: ValidationState = 'valid';
    
    // Building sprite registry for ghost preview
    private buildingSprites: Map<BuildingType, any> = new Map();
    
    private constructor() {
        super();
        
        // Subscribe to keyboard input for cancellation
        this.subscribe(GameEvents.INPUT_KEY_PRESS, (key: string) => {
            if (this.isPlacementActive && key === 'Escape') {
                this.cancelPlacement();
            }
        });
        
        // Subscribe to resource updates for real-time validation
        this.subscribe(GameEvents.RESOURCE_UPDATED, () => {
            if (this.isPlacementActive && this.ghostSprite) {
                this.validatePlacement();
                this.updateGhostTint();
                
                // Mark renderer layer dirty for redraw
                if (this.renderer) {
                    this.renderer.markLayerDirty(RenderLayer.ENTITIES);
                }
            }
        });
    }
    
    public static getInstance(): BuildingPlacementManager {
        if (!BuildingPlacementManager.instance) {
            BuildingPlacementManager.instance = new BuildingPlacementManager();
        }
        return BuildingPlacementManager.instance;
    }
    
    /**
     * Initialize manager with dependencies
     * @param renderer - Renderer instance
     * @param camera - Camera instance
     * @param tileGrid - TileGrid instance
     * @param factionId - Faction ID for resource checking
     */
    public initialize(renderer: any, camera: any, tileGrid: any, factionId: string): void {
        this.renderer = renderer;
        this.camera = camera;
        this.tileGrid = tileGrid;
        this.factionId = factionId;
    }
    
    /**
     * Register building sprites for ghost preview
     * @param sprites - Map of building type to sprite
     */
    public registerBuildingSprites(sprites: Record<BuildingType, any>): void {
        this.buildingSprites.clear();
        for (const [type, sprite] of Object.entries(sprites)) {
            this.buildingSprites.set(type as BuildingType, sprite);
        }
    }
    
    /**
     * Activate building placement mode
     * @param buildingType - Type of building to place
     */
    public activatePlacement(buildingType: BuildingType): void {
        this.isPlacementActive = true;
        this.currentBuildingType = buildingType;
        this.validationState = 'valid';
        
        // Get sprite for this building type
        const sprite = this.buildingSprites.get(buildingType);
        
        // Get building config for size
        const config = getBuildingByType(buildingType);
        const width = (config.size?.width || 2) * TILE_SIZE;
        const height = (config.size?.height || 2) * TILE_SIZE;
        
        // Create ghost sprite with correct dimensions
        this.ghostSprite = new GhostSpriteComponent(sprite, 0, 0, width, height);
        
        // Register ghost sprite with renderer
        if (this.renderer) {
            this.ghostUnregister = this.renderer.register(this.ghostSprite);
        }
        
        this.emit(GameEvents.BUILDING_PLACEMENT_STARTED, buildingType);
        console.log(`[BuildingPlacement] ✅ Placement mode activated for ${buildingType}`);
    }
    
    /**
     * Update ghost sprite position and validation
     * @param screenX - Mouse X in screen coordinates
     * @param screenY - Mouse Y in screen coordinates
     */
    public updateGhostPosition(screenX: number, screenY: number): void {
        if (!this.isPlacementActive || !this.ghostSprite || !this.camera || !this.currentBuildingType) return;
        
        // Convert screen to world coordinates
        const worldPos = this.camera.screenToWorld(screenX, screenY);
        
        // Convert world to grid coordinates
        const gridPos = worldToGrid(worldPos.x, worldPos.y, TILE_SIZE);
        this.currentGridX = gridPos.col;
        this.currentGridY = gridPos.row;
        
        // Get building size for multi-tile positioning
        const config = getBuildingByType(this.currentBuildingType);
        const centerOffsetX = ((config.size?.width || 2) - 1) * 0.5;
        const centerOffsetY = ((config.size?.height || 2) - 1) * 0.5;
        const centerGridX = this.currentGridX + centerOffsetX;
        const centerGridY = this.currentGridY + centerOffsetY;
        
        // Snap ghost to grid center (accounting for building size)
        const snappedPos = gridToWorldCenter(centerGridX, centerGridY, TILE_SIZE);
        this.ghostSprite.x = snappedPos.x;
        this.ghostSprite.y = snappedPos.y;
        
        // Validate placement
        this.validatePlacement();
        
        // Update ghost tint based on validation
        this.updateGhostTint();
        
        // Mark renderer layer dirty for redraw
        if (this.renderer) {
            this.renderer.markLayerDirty(RenderLayer.ENTITIES);
        }
    }
    
    /**
     * Validate current placement position
     */
    private validatePlacement(): void {
        if (!this.currentBuildingType) {
            this.validationState = 'valid';
            return;
        }
        
        const config = getBuildingByType(this.currentBuildingType);
        
        // Check terrain for all tiles in footprint
        const footprint = this.getBuildingFootprint(this.currentGridX, this.currentGridY, config.size?.width || 2, config.size?.height || 2);
        
        for (const tile of footprint) {
            const tileData = this.tileGrid.getTileDataAt(tile.x, tile.y);
            if (!tileData || !this.isTerrainValid(tileData.type, config.allowedTerrain)) {
                this.validationState = 'invalid_terrain';
                return;
            }
        }
        
        // Check collision with existing buildings
        const { EntityManager } = require('./EntityManager');
        const allEntities = EntityManager.getInstance().getAllEntities();
        
        for (const entity of allEntities) {
            if (entity.type === 'building' && entity.isActive) {
                const building = entity as any; // Building instance
                const occupiedTiles = building.getOccupiedTiles();
                
                // Check if any footprint tile overlaps with occupied tiles
                for (const footprintTile of footprint) {
                    for (const occupiedTile of occupiedTiles) {
                        if (footprintTile.x === occupiedTile.gridX && footprintTile.y === occupiedTile.gridY) {
                            this.validationState = 'collision';
                            return;
                        }
                    }
                }
            }
        }
        
        // Check resources
        const { ResourceManager } = require('./ResourceManager');
        if (!ResourceManager.getInstance().canAfford(this.factionId, config.costs)) {
            this.validationState = 'insufficient_resources';
            return;
        }
        
        this.validationState = 'valid';
    }
    
    /**
     * Get all grid tiles in building footprint
     * @param gridX - Top-left grid X
     * @param gridY - Top-left grid Y
     * @param width - Building width in tiles
     * @param height - Building height in tiles
     */
    private getBuildingFootprint(gridX: number, gridY: number, width: number, height: number): Array<{x: number, y: number}> {
        const tiles: Array<{x: number, y: number}> = [];
        
        for (let x = gridX; x < gridX + width; x++) {
            for (let y = gridY; y < gridY + height; y++) {
                tiles.push({ x, y });
            }
        }
        
        return tiles;
    }
    
    /**
     * Check if terrain type is valid for building
     * @param tileType - Terrain type
     * @param allowedTerrain - Allowed terrain types
     */
    private isTerrainValid(tileType: TileType, allowedTerrain: TileType[]): boolean {
        return allowedTerrain.includes(tileType);
    }
    
    /**
     * Update ghost sprite tint based on validation state
     */
    private updateGhostTint(): void {
        if (!this.ghostSprite) return;
        
        switch (this.validationState) {
            case 'valid':
                this.ghostSprite.tintColor = '#00FF00'; // Green
                break;
            case 'invalid_terrain':
            case 'collision':
                this.ghostSprite.tintColor = '#FF0000'; // Red
                break;
            case 'insufficient_resources':
                this.ghostSprite.tintColor = '#FFFF00'; // Yellow
                break;
        }
    }
    
    /**
     * Attempt to place building at current position
     * Emits success or failure events
     */
    public attemptPlacement(): void {
        console.log(`[BuildingPlacement] attemptPlacement called`);
        console.log(`[BuildingPlacement] - isPlacementActive: ${this.isPlacementActive}`);
        console.log(`[BuildingPlacement] - currentBuildingType: ${this.currentBuildingType}`);
        console.log(`[BuildingPlacement] - validationState: ${this.validationState}`);
        console.log(`[BuildingPlacement] - currentGridX: ${this.currentGridX}, currentGridY: ${this.currentGridY}`);
        
        if (!this.isPlacementActive || !this.currentBuildingType) {
            console.warn(`[BuildingPlacement] Cannot place - placement not active or no building type`);
            return;
        }
        
        if (this.validationState === 'valid') {
            console.log(`[BuildingPlacement] ✅ Validation passed - emitting BUILDING_CONSTRUCTION_STARTED`);
            // Emit construction started event
            const config = getBuildingByType(this.currentBuildingType);
            
            this.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: this.currentBuildingType,
                gridX: this.currentGridX,
                gridY: this.currentGridY,
                factionId: this.factionId,
                costs: config.costs
            });
            
            // Cancel placement after successful placement
            this.cancelPlacement();
        } else {
            console.warn(`[BuildingPlacement] ❌ Validation failed: ${this.validationState}`);
            
            // Emit invalid placement event
            const config = getBuildingByType(this.currentBuildingType);
            
            this.emit(GameEvents.BUILDING_PLACEMENT_INVALID, {
                reason: this.validationState,
                position: { x: this.currentGridX, y: this.currentGridY },
                costs: config.costs
            });
            
            // Do NOT cancel placement - let user adjust position
        }
    }
    
    /**
     * Cancel current placement
     */
    public cancelPlacement(): void {
        // Destroy ghost sprite
        if (this.ghostUnregister) {
            this.ghostUnregister();
            this.ghostUnregister = null;
        }
        
        this.ghostSprite = null;
        this.isPlacementActive = false;
        this.currentBuildingType = null;
        this.validationState = 'valid';
        
        this.emit(GameEvents.BUILDING_PLACEMENT_CANCELLED);
    }
    
    /**
     * Cleanup manager
     */
    public cleanup(): void {
        if (this.isPlacementActive) {
            this.cancelPlacement();
        }
        
        this.cleanupSubscriptions();
        this.renderer = null;
        this.camera = null;
        this.tileGrid = null;
    }
}
