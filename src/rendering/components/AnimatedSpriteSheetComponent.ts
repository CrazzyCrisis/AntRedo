import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { EntityState } from '../../classes/components/StateMachineComponent';

/**
 * Animation configuration for a single animation state
 */
export interface AnimationConfig {
    row: number;              // Grid row (0-indexed)
    startCol: number;         // Starting column (0-indexed)
    endCol: number;           // Ending column (inclusive)
    frameWidth: number;       // Width of each frame in pixels
    frameHeight: number;      // Height of each frame in pixels
    speed: number;            // Game frames to wait between animation frames (default: 5)
    loop: boolean;            // Loop animation or play once
}

/**
 * AnimatedSpriteSheetComponent - Grid-based spritesheet animation (Godot-style)
 * Extracts frames from spritesheet grid and animates them with frame-based timing.
 * Integrates with EventBus for automatic state-driven animation switching.
 */
export class AnimatedSpriteSheetComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.ENTITIES;
    public depth: number = 0;

    private spritesheet: any; // p5.Image
    private x: number;
    private y: number;
    public scale: number = 1;  // Public for factory configuration
    private rotation: number = 0;

    // Animation data
    private animations: Map<string, AnimationConfig> = new Map();
    private currentAnimationName: string | null = null;
    private currentFrame: number = 0;
    private frameCounter: number = 0; // Frame-based timing counter

    // EventBus integration
    private ownerEntityId: string | null = null;
    private stateToAnimationMap: Map<EntityState, string> | null = null;
    private unsubscribeStateChange: (() => void) | null = null;
    private unsubscribeMovement: (() => void) | null = null;
    private unsubscribeSmoothMovement: (() => void) | null = null;

    // Movement tracking
    private isMoving: boolean = false;
    private lastMoveTime: number = 0;
    private readonly MOVEMENT_TIMEOUT_MS: number = 100; // Consider stopped after 100ms of no movement

    // Debug tracking
    private debugJobType: string | null = null;

    // Offsets for centering
    private offsetX: number = 0;
    private offsetY: number = 0;

    // Outline rendering
    private outlineColor: { r: number; g: number; b: number } | null = null;
    private outlineThickness: number = 2;
    private unsubscribeHover: (() => void) | null = null;

    // Tint color for visual effects (flash, etc.)
    private tintColor: { r: number; g: number; b: number; a?: number } | null = null;

    constructor(spritesheet: any, x: number, y: number, debugJobType?: string) {
        this.spritesheet = spritesheet;
        this.x = x;
        this.y = y;
        this.debugJobType = debugJobType || null;
    }

    /**
     * Add an animation state
     * @param name Animation name (e.g., 'idle', 'walk', 'attack')
     * @param config Animation configuration
     */
    addAnimation(name: string, config: AnimationConfig): void {
        this.animations.set(name, config);
    }

    /**
     * Play an animation
     * @param name Animation name
     * @param force Force restart if already playing this animation
     * @returns true if animation switched, false if already playing
     */
    playAnimation(name: string, force: boolean = false): boolean {
        if (!this.animations.has(name)) {
            console.warn(`Animation '${name}' not found`);
            return false;
        }

        // Skip if already playing same animation (unless forced)
        if (this.currentAnimationName === name && !force) {
            return false;
        }

        this.currentAnimationName = name;
        this.currentFrame = 0;
        this.frameCounter = 0;
        return true;
    }

    /**
     * Get raw spritesheet (for VFX manager)
     */
    getSprite(): any {
        return this.spritesheet;
    }

    /**
     * Get current animation name
     */
    getCurrentAnimation(): string | null {
        return this.currentAnimationName;
    }

    /**
     * Set tint color for visual effects (flash, faction recoloring, etc.)
     * @param color RGB color object {r, g, b, a?} (0-255) or null to disable tint
     */
    setTint(color: { r: number; g: number; b: number; a?: number } | null): void {
        this.tintColor = color;
    }

    /**
     * Setup EventBus integration for state-driven animations
     * @param entityId Owner entity ID
     * @param stateMap Mapping of EntityState to animation name
     */
    setOwnerEntity(entityId: string, stateMap: Map<EntityState, string>): void {
        this.ownerEntityId = entityId;
        this.stateToAnimationMap = stateMap;

        // Subscribe to state changes
        this.unsubscribeStateChange = EventBus.on(
            GameEvents.ENTITY_STATE_CHANGED,
            (id: string, _oldState: EntityState, newState: EntityState) => {
                // Only respond to this entity's state changes
                if (id !== this.ownerEntityId) return;

                // Map state to animation
                const animationName = this.stateToAnimationMap?.get(newState);
                if (animationName) {
                    this.playAnimation(animationName);
                }
            }
        );

        // Subscribe to hover events for outline
        const hoverStartListener = EventBus.on('ENTITY_HOVER_START', (id: string) => {
            if (id === this.ownerEntityId) {
                this.setOutline({ r: 255, g: 255, b: 0 }, 2); // Yellow outline on hover
            }
        });
        
        const hoverEndListener = EventBus.on('ENTITY_HOVER_END', (id: string) => {
            if (id === this.ownerEntityId) {
                this.setOutline(null); // Remove outline
            }
        });
        
        // Store cleanup function for hover listeners
        this.unsubscribeHover = () => {
            EventBus.off('ENTITY_HOVER_START', hoverStartListener);
            EventBus.off('ENTITY_HOVER_END', hoverEndListener);
        };

        // Subscribe to movement events for automatic idle/walk switching
        // Listen to both ENTITY_MOVED (grid position changes) and ENTITY_SMOOTH_POSITION_UPDATE (every frame during movement)
        this.unsubscribeMovement = EventBus.on(
            GameEvents.ENTITY_MOVED,
            (id: string, _gridX: number, _gridY: number) => {
                // Only respond to this entity's movement
                if (id !== this.ownerEntityId) return;

                // Entity is moving - switch to walk animation if idle
                this.lastMoveTime = Date.now();
                if (!this.isMoving) {
                    this.isMoving = true;
                    if (this.currentAnimationName === 'idle') {
                        this.playAnimation('walk');
                        if (this.debugJobType === 'builder') {
                            console.log('[BUILDER] Movement detected (ENTITY_MOVED) → switching to walk');
                        }
                    }
                }
            }
        );

        // Also listen to smooth position updates for continuous movement detection
        this.unsubscribeSmoothMovement = EventBus.on(
            GameEvents.ENTITY_SMOOTH_POSITION_UPDATE,
            (id: string, _smoothX: number, _smoothY: number) => {
                // Only respond to this entity's movement
                if (id !== this.ownerEntityId) return;

                // Update last move time - entity is actively moving
                this.lastMoveTime = Date.now();
                if (!this.isMoving) {
                    this.isMoving = true;
                    if (this.currentAnimationName === 'idle') {
                        this.playAnimation('walk');
                        if (this.debugJobType === 'builder') {
                            console.log('[BUILDER] Smooth movement detected → switching to walk');
                        }
                    }
                }
            }
        );
    }

    /**
     * Update animation (advance frame counter)
     * Call once per game frame
     */
    update(): void {
        // Check if entity has stopped moving (timeout-based)
        if (this.isMoving) {
            const timeSinceLastMove = Date.now() - this.lastMoveTime;
            if (timeSinceLastMove > this.MOVEMENT_TIMEOUT_MS) {
                this.isMoving = false;
                // Switch back to idle if currently walking
                if (this.currentAnimationName === 'walk') {
                    this.playAnimation('idle');
                    if (this.debugJobType === 'builder') {
                        console.log('[BUILDER] Movement stopped → switching to idle');
                    }
                }
            }
        }

        if (!this.currentAnimationName) return;

        const config = this.animations.get(this.currentAnimationName);
        if (!config) return;

        // Increment frame counter
        this.frameCounter++;

        // Check if it's time to advance frame
        if (this.frameCounter >= config.speed) {
            const prevFrame = this.currentFrame;
            this.frameCounter = 0;

            const totalFrames = config.endCol - config.startCol + 1;
            this.currentFrame++;

            // Handle looping vs one-shot
            if (config.loop) {
                // Loop back to start
                if (this.currentFrame >= totalFrames) {
                    this.currentFrame = 0;
                }
            } else {
                // Clamp to last frame
                if (this.currentFrame >= totalFrames) {
                    this.currentFrame = totalFrames - 1;
                }
            }

            // Debug: Log builder frame transitions
            if (this.debugJobType === 'builder') {
                console.log(`[BUILDER] Animation: ${this.currentAnimationName} | Frame: ${prevFrame} → ${this.currentFrame} | Total frames: ${totalFrames} | Speed: ${config.speed} | Range: col ${config.startCol}-${config.endCol}`);
            }
        }
    }

    /**
     * Set position
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Set depth for sorting
     */
    setDepth(depth: number): void {
        this.depth = depth;
    }

    /**
     * Set render layer
     */
    setLayer(layer: RenderLayer): void {
        this.layer = layer;
    }

    /**
     * Set scale
     */
    setScale(scale: number): void {
        this.scale = scale;
    }

    /**
     * Set rotation (radians)
     */
    setRotation(rotation: number): void {
        this.rotation = rotation;
    }

    /**
     * Set offset for centering sprite
     */
    setOffset(offsetX: number, offsetY: number): void {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    /**
     * Draw outline around sprite
     */
    private drawOutline(graphics: any, config: AnimationConfig, _srcX: number, _srcY: number, _currentCol: number): void {
        if (!this.outlineColor) return;

        // Draw outline as a rect for animated sprites
        graphics.stroke(this.outlineColor.r, this.outlineColor.g, this.outlineColor.b);
        graphics.strokeWeight(this.outlineThickness);
        graphics.noFill();

        const drawX = this.x + this.offsetX;
        const drawY = this.y + this.offsetY;
        const drawWidth = config.frameWidth * this.scale;
        const drawHeight = config.frameHeight * this.scale;
        
        graphics.rect(drawX, drawY, drawWidth, drawHeight);
    }

    /**
     * Render current animation frame
     */
    render(graphics: any): void {
        // Handle null spritesheet (render placeholder)
        if (!this.spritesheet) {
            console.warn('AnimatedSpriteSheetComponent: null spritesheet');
            this.renderPlaceholder(graphics);
            return;
        }

        // No animation playing
        if (!this.currentAnimationName) {
            console.warn('AnimatedSpriteSheetComponent: no animation playing');
            this.renderPlaceholder(graphics);
            return;
        }

        const config = this.animations.get(this.currentAnimationName);
        if (!config) {
            console.warn(`AnimatedSpriteSheetComponent: animation '${this.currentAnimationName}' not found`);
            this.renderPlaceholder(graphics);
            return;
        }

        // Calculate source position in spritesheet grid
        const currentCol = config.startCol + this.currentFrame;
        const srcX = currentCol * config.frameWidth;
        const srcY = config.row * config.frameHeight;

        // Draw outline if enabled (before main sprite)
        if (this.outlineColor) {
            this.drawOutline(graphics, config, srcX, srcY, currentCol);
        }

        // Apply tint if set
        if (this.tintColor) {
            if (this.tintColor.a !== undefined) {
                graphics.tint(this.tintColor.r, this.tintColor.g, this.tintColor.b, this.tintColor.a);
            } else {
                graphics.tint(this.tintColor.r, this.tintColor.g, this.tintColor.b);
            }
        }

        // Apply transforms if needed
        const needsTransform = this.rotation !== 0 || this.scale !== 1;
        if (needsTransform) {
            graphics.push();
            graphics.translate(
                this.x + this.offsetX + (config.frameWidth * this.scale) / 2,
                this.y + this.offsetY + (config.frameHeight * this.scale) / 2
            );
            if (this.rotation !== 0) graphics.rotate(this.rotation);
            if (this.scale !== 1) graphics.scale(this.scale);
        }

        // Extract frame from spritesheet
        // Use createImage + image() instead of copy() so tint works properly
        const p5 = window as any;
        const frameImg = p5.createImage(config.frameWidth, config.frameHeight);
        frameImg.copy(
            this.spritesheet,
            srcX,
            srcY,
            config.frameWidth,
            config.frameHeight,
            0,
            0,
            config.frameWidth,
            config.frameHeight
        );

        // Draw the extracted frame (this respects tint)
        graphics.imageMode(p5.CORNER);
        if (needsTransform) {
            graphics.image(
                frameImg,
                -(config.frameWidth * this.scale) / 2,
                -(config.frameHeight * this.scale) / 2,
                config.frameWidth * this.scale,
                config.frameHeight * this.scale
            );
        } else {
            graphics.image(
                frameImg,
                this.x + this.offsetX,
                this.y + this.offsetY,
                config.frameWidth,
                config.frameHeight
            );
        }

        // Reset tint after drawing
        if (this.tintColor) {
            graphics.noTint();
        }

        // Restore transform
        if (needsTransform) {
            graphics.pop();
        }
    }

    /**
     * Render magenta placeholder (null sprite or no animation)
     */
    private renderPlaceholder(graphics: any): void {
        graphics.fill(255, 0, 255); // Magenta
        graphics.stroke(255, 255, 0); // Yellow border
        graphics.strokeWeight(2);
        graphics.rect(this.x + this.offsetX, this.y + this.offsetY, 32, 32);

        // Draw X through it
        graphics.stroke(0);
        graphics.strokeWeight(1);
        graphics.line(
            this.x + this.offsetX,
            this.y + this.offsetY,
            this.x + this.offsetX + 32,
            this.y + this.offsetY + 32
        );
        graphics.line(
            this.x + this.offsetX + 32,
            this.y + this.offsetY,
            this.x + this.offsetX,
            this.y + this.offsetY + 32
        );
    }

    /**
     * Set outline for hover effect
     * @param color RGB color or null to disable
     * @param thickness Outline thickness in pixels
     */
    setOutline(color: { r: number; g: number; b: number } | null, thickness: number = 2): void {
        this.outlineColor = color;
        this.outlineThickness = thickness;
    }

    /**
     * Cleanup (unsubscribe from EventBus)
     */
    cleanup(): void {
        if (this.unsubscribeStateChange) {
            this.unsubscribeStateChange();
            this.unsubscribeStateChange = null;
        }
        if (this.unsubscribeMovement) {
            this.unsubscribeMovement();
            this.unsubscribeMovement = null;
        }
        if (this.unsubscribeSmoothMovement) {
            this.unsubscribeSmoothMovement();
            this.unsubscribeSmoothMovement = null;
        }
        if (this.unsubscribeHover) {
            this.unsubscribeHover();
            this.unsubscribeHover = null;
        }
    }
}
