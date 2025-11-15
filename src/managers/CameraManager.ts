import { EventBus, GameEvents } from '../utils/eventBus';
import { Camera } from '../rendering/Camera';
import { EntityManager } from './EntityManager';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';

/**
 * CameraManager - Centralized camera control and following system
 * 
 * Responsibilities:
 * - Listen to CAMERA_FOLLOW_ENTITY events
 * - Automatically follow target entities
 * - Update camera every frame
 * - Handle camera smoothing and movement
 * - Mark camera-affected layers dirty when camera moves
 * 
 * Pattern: Singleton - one camera system for the entire game
 */
export class CameraManager {
    private static instance: CameraManager | null = null;
    
    private camera: Camera | null = null;
    private renderer: Renderer | null = null;
    private followEntityId: string | null = null;
    private isFollowing: boolean = false;
    
    private constructor() {
        // Listen for camera follow requests
        EventBus.on(GameEvents.CAMERA_FOLLOW_ENTITY, (entityId: string) => {
            this.followEntity(entityId);
        });
        
        // Stop following if entity is destroyed
        EventBus.on(GameEvents.ENTITY_DESTROYED, (entityId: string) => {
            if (this.followEntityId === entityId) {
                this.stopFollowing();
            }
        });
    }
    
    static getInstance(): CameraManager {
        if (!CameraManager.instance) {
            CameraManager.instance = new CameraManager();
        }
        return CameraManager.instance;
    }
    
    /**
     * Set the camera to manage
     */
    setCamera(camera: Camera | null): void {
        this.camera = camera;
    }
    
    /**
     * Set the renderer to mark layers dirty
     */
    setRenderer(renderer: Renderer | null): void {
        this.renderer = renderer;
    }
    
    /**
     * Get the managed camera
     */
    getCamera(): Camera | null {
        return this.camera;
    }
    
    /**
     * Start following an entity by ID
     */
    followEntity(entityId: string): void {
        this.followEntityId = entityId;
        this.isFollowing = true;
        
        // Snap camera to entity position immediately (no smooth transition on first follow)
        if (this.camera) {
            const entity = EntityManager.getInstance().getEntity(entityId);
            if (entity) {
                console.log(`[CameraManager] Snapping camera to entity ${entityId} at world (${entity.worldX}, ${entity.worldY})`);
                this.camera.moveTo(entity.worldX, entity.worldY);
            } else {
                console.warn(`[CameraManager] Cannot snap camera - entity ${entityId} not found in EntityManager`);
            }
        } else {
            console.warn('[CameraManager] Cannot snap camera - no camera set');
        }
    }
    
    /**
     * Stop following the current entity
     */
    stopFollowing(): void {
        this.followEntityId = null;
        this.isFollowing = false;
    }
    
    /**
     * Update camera (call every frame)
     * Automatically follows target entity if set
     * Marks camera-affected layers dirty if camera moved
     */
    update(): void {
        if (!this.camera) return;
        
        // If following an entity, update camera target
        if (this.isFollowing && this.followEntityId) {
            const entity = EntityManager.getInstance().getEntity(this.followEntityId);
            if (entity) {
                // Follow entity's world position
                this.camera.follow(entity.worldX, entity.worldY);
            }
        }
        
        // Update camera (handles smooth following and shake)
        const cameraMoved = this.camera.update();
        
        // If camera moved, mark all camera-affected layers as dirty so they re-render
        if (cameraMoved && this.renderer) {
            this.renderer.markLayerDirty(RenderLayer.GROUND);
            this.renderer.markLayerDirty(RenderLayer.GROUND_DECORATIONS);
            this.renderer.markLayerDirty(RenderLayer.ENTITIES);
            this.renderer.markLayerDirty(RenderLayer.ABOVE_ENTITIES);
        }
    }
    
    /**
     * Move camera to position immediately
     */
    moveTo(x: number, y: number): void {
        if (this.camera) {
            this.camera.moveTo(x, y);
        }
    }
    
    /**
     * Set camera smoothing (0 = instant, 1 = no movement)
     */
    setSmoothing(smoothing: number): void {
        if (this.camera) {
            this.camera.setSmoothing(smoothing);
        }
    }
    
    /**
     * Trigger camera shake effect
     */
    shake(intensity: number, duration: number): void {
        if (this.camera) {
            this.camera.shake(intensity, duration);
        }
    }
    
    /**
     * Clear for testing
     */
    static clearInstance(): void {
        CameraManager.instance = null;
    }
}
