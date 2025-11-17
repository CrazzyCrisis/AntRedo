/**
 * BaseScene - Abstract base class for all scenes
 * Handles common initialization like BuildingPlacementManager, Camera, Renderer
 * Provides centralized lifecycle management and dependency injection
 */

import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { Camera } from '../rendering/Camera';
import { CameraManager } from '../managers/CameraManager';
import { BuildingPlacementManager } from '../managers/BuildingPlacementManager';
import { TileGrid } from '../world/TileGrid';

export abstract class BaseScene implements IScene {
    protected renderer: Renderer;
    protected camera: Camera;
    protected canvasWidth: number;
    protected canvasHeight: number;
    protected buildingPlacementManager: BuildingPlacementManager;
    
    constructor(renderer: Renderer, canvasWidth: number, canvasHeight: number) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Get camera from CameraManager singleton
        const cam = CameraManager.getInstance().getCamera();
        if (!cam) {
            throw new Error('[BaseScene] Camera not initialized in CameraManager!');
        }
        this.camera = cam;
        
        // Get BuildingPlacementManager singleton
        this.buildingPlacementManager = BuildingPlacementManager.getInstance();
    }
    
    /**
     * Initialize BuildingPlacementManager with scene-specific dependencies
     * Call this after TileGrid is created in your scene
     * @param tileGrid - The TileGrid instance
     * @param factionId - Faction ID for resource checking (e.g., 'player')
     * @param buildingSprites - Map of building type to sprite for ghost preview
     */
    protected initializeBuildingPlacement(
        tileGrid: TileGrid,
        factionId: string,
        buildingSprites?: Record<string, any>
    ): void {
        this.buildingPlacementManager.initialize(
            this.renderer,
            this.camera,
            tileGrid,
            factionId
        );
        
        if (buildingSprites) {
            this.buildingPlacementManager.registerBuildingSprites(buildingSprites as any);
        }
        
        console.log(`[BaseScene] ✅ BuildingPlacementManager initialized`);
    }
    
    // Abstract methods - must be implemented by subclasses
    abstract enter(): void;
    abstract exit(): void;
    abstract update(deltaTime: number): void;
    abstract handleMouseClick(x: number, y: number): void;
    abstract handleMouseMove(x: number, y: number): void;
    abstract handleMouseUp(x: number, y: number): void;
    abstract onResize(width: number, height: number): void;
    
    // Optional method - can be overridden by subclasses
    handleKeyPress?(key: string | number): void;
}
