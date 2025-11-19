import { EventBus, GameEvents } from '../utils/eventBus';
import { Camera } from '../rendering/Camera';
import { EntityManager } from './EntityManager';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { CAMERA_CONFIG } from '../config/systems/cameraConfig';
import { InputManager } from './InputManager';

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
    private wasPreviouslyFollowing: boolean = false;
    
    // Timer system for temporary camera movement (minimap clicks, arrow keys)
    private followResumeTimer: number = 0;
    
    private constructor() {
        // Listen for camera follow requests
        EventBus.on(GameEvents.CAMERA_FOLLOW_ENTITY, (entityId: string) => {
            this.followEntity(entityId);
        });
        
        // Listen for manual camera stop (minimap clicks)
        EventBus.on(GameEvents.CAMERA_STOP_FOLLOWING, () => {
            this.stopFollowingTemporarily();
        });
        
        // Listen for resume following request
        EventBus.on(GameEvents.CAMERA_RESUME_FOLLOWING, () => {
            this.resumeFollowing();
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
        this.wasPreviouslyFollowing = false;
        this.followResumeTimer = 0;
    }
    
    /**
     * Temporarily stop following (for minimap clicks, arrow keys)
     * Will automatically resume after timer expires
     * @param customDelay Optional custom delay in milliseconds (defaults to config value)
     */
    stopFollowingTemporarily(customDelay?: number): void {
        if (this.isFollowing) {
            this.wasPreviouslyFollowing = true;
            this.isFollowing = false;
            this.followResumeTimer = customDelay ?? CAMERA_CONFIG.FOLLOW_RESUME_DELAY;
            const seconds = this.followResumeTimer / 1000;
            console.log(`[CameraManager] Stopped following temporarily - will resume in ${seconds}s`);
        }
    }
    
    /**
     * Resume following the previously followed entity
     */
    resumeFollowing(): void {
        if (this.wasPreviouslyFollowing && this.followEntityId) {
            this.isFollowing = true;
            this.wasPreviouslyFollowing = false;
            this.followResumeTimer = 0;
            console.log('[CameraManager] Resumed following entity');
        }
    }
    
    /**
     * Update camera (call every frame)
     * Automatically follows target entity if set
     * Marks camera-affected layers dirty if camera moved
     */
    update(): void {
        if (!this.camera) return;
        
        // Handle camera movement with held keys (before updating follow timer)
        this.handleCameraMovement();
        
        // Update follow resume timer (16.67ms per frame at 60fps)
        if (this.followResumeTimer > 0) {
            this.followResumeTimer -= 16.67;
            if (this.followResumeTimer <= 0) {
                this.followResumeTimer = 0;
                EventBus.emit(GameEvents.CAMERA_RESUME_FOLLOWING);
            }
        }
        
        // If following an entity, update camera target
        if (this.isFollowing && this.followEntityId) {
            const entity = EntityManager.getInstance().getEntity(this.followEntityId);
            if (entity) {
                // Follow entity's smooth position for smooth camera movement
                const smoothPos = entity.getSmoothPosition();
                this.camera.follow(smoothPos.x, smoothPos.y);
            }
        }
        
        // Update camera (handles smooth following and shake)
        const cameraMoved = this.camera.update();
        
        // If camera moved, mark all camera-affected layers as dirty so they re-render
        // (All layers except UI and DEBUG are camera-aware)
        if (cameraMoved && this.renderer) {
            this.renderer.markLayerDirty(RenderLayer.GROUND);
            this.renderer.markLayerDirty(RenderLayer.GROUND_DECORATIONS);
            this.renderer.markLayerDirty(RenderLayer.ENTITIES);
            this.renderer.markLayerDirty(RenderLayer.ABOVE_ENTITIES);
            this.renderer.markLayerDirty(RenderLayer.VISUAL_EFFECTS);
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
     * Set camera deadzone (bounding box where camera doesn't move)
     * @param width - Width of deadzone in pixels (0 = no deadzone)
     * @param height - Height of deadzone in pixels (0 = no deadzone)
     */
    setDeadzone(width: number, height: number): void {
        if (this.camera) {
            this.camera.setDeadzone(width, height);
        }
    }
    
    /**
     * Handle camera movement with held keys via InputManager
     * Allows smooth camera panning when keys are held
     * Separate from queen movement to avoid conflicts
     */
    private handleCameraMovement(): void {
        if (!this.camera) return;
        
        const inputManager = InputManager.getInstance();
        const moveSpeed = CAMERA_CONFIG.ARROW_MOVE_SPEED;
        
        let moveX = 0;
        let moveY = 0;
        
        // Check camera movement keys (separate from moveUp/Down/Left/Right)
        if (inputManager.isActionPressed('cameraMoveUp')) {
            moveY = -moveSpeed;
        }
        if (inputManager.isActionPressed('cameraMoveDown')) {
            moveY = moveSpeed;
        }
        if (inputManager.isActionPressed('cameraMoveLeft')) {
            moveX = -moveSpeed;
        }
        if (inputManager.isActionPressed('cameraMoveRight')) {
            moveX = moveSpeed;
        }
        
        // Move camera if any camera movement keys are pressed
        if (moveX !== 0 || moveY !== 0) {
            this.camera.moveTo(this.camera.x + moveX, this.camera.y + moveY);
            
            // Reset timer while keys are held (prevents snap back during continuous movement)
            if (this.wasPreviouslyFollowing) {
                this.followResumeTimer = CAMERA_CONFIG.ARROW_MOVE_DELAY;
            } else {
                // First time moving camera - stop following and set timer
                this.stopFollowingTemporarily(CAMERA_CONFIG.ARROW_MOVE_DELAY);
            }
            
            // Mark layers dirty to force redraw after camera move
            if (this.renderer) {
                this.renderer.markLayerDirty(RenderLayer.GROUND);
                this.renderer.markLayerDirty(RenderLayer.GROUND_DECORATIONS);
                this.renderer.markLayerDirty(RenderLayer.ENTITIES);
                this.renderer.markLayerDirty(RenderLayer.ABOVE_ENTITIES);
                this.renderer.markLayerDirty(RenderLayer.VISUAL_EFFECTS);
            }
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
