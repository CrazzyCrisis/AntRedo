/**
 * VisualEffectsManager - Centralized management of all visual effects
 * Handles damage numbers, flashes, floating text, etc.
 * 
 * Uses EventBus to respond to game events and spawn appropriate effects
 */

import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';
import { DamageNumberComponent } from '../rendering/components/DamageNumberComponent';
import { DAMAGE_NUMBER_CONFIG, FLASH_EFFECT_CONFIG } from '../config/visualEffects';
import { Renderer } from '../rendering/Renderer';

export class VisualEffectsManager extends BaseManager {
    private static instance: VisualEffectsManager;
    private renderer: Renderer | null = null;
    private activeEffects: Set<any> = new Set();
    private entitySpriteComponents: Map<string, any> = new Map(); // Map entityId -> SpriteComponent/AnimatedSpriteSheetComponent
    private activeFlashes: Map<string, NodeJS.Timeout> = new Map(); // Map entityId -> animation interval ID

    private constructor() {
        super();
        this.setupEventListeners();
    }

    public static getInstance(): VisualEffectsManager {
        if (!VisualEffectsManager.instance) {
            VisualEffectsManager.instance = new VisualEffectsManager();
        }
        return VisualEffectsManager.instance;
    }

    /**
     * Set the renderer (must be called during game initialization)
     */
    public setRenderer(renderer: Renderer): void {
        this.renderer = renderer;
    }

    /**
     * Register a sprite component for an entity (so flash effects can use it)
     * Call this when creating entities with sprites
     */
    public registerEntitySpriteComponent(entityId: string, spriteComponent: any): void {
        this.entitySpriteComponents.set(entityId, spriteComponent);
    }

    /**
     * Unregister entity sprite component (call when entity is destroyed)
     */
    public unregisterEntitySpriteComponent(entityId: string): void {
        // Clear any active flash animation
        const flashInterval = this.activeFlashes.get(entityId);
        if (flashInterval) {
            clearInterval(flashInterval);
            this.activeFlashes.delete(entityId);
        }
        
        this.entitySpriteComponents.delete(entityId);
    }

    /**
     * Setup event listeners for automatic effect spawning
     */
    private setupEventListeners(): void {
        // Listen for entity damage events
        this.subscribe(GameEvents.ENTITY_DAMAGE, (entityId: string, amount: number, x: number, y: number, isCritical?: boolean) => {
            this.showDamageNumber(x, y, -amount, DAMAGE_NUMBER_CONFIG.colors.physical, isCritical);
            this.showFlash(entityId, x, y, isCritical ? 'critical' : 'damage');
        });

        // Listen for healing events
        this.subscribe(GameEvents.ENTITY_HEALED, (entityId: string, amount: number, x: number, y: number) => {
            this.showDamageNumber(x, y, amount, DAMAGE_NUMBER_CONFIG.colors.healing);
            this.showFlash(entityId, x, y, 'heal');
        });

        // Listen for entity death
        this.subscribe(GameEvents.ENTITY_DIED, (entityId: string, x: number, y: number) => {
            this.showFlash(entityId, x, y, 'death', 32, 32);
            // Clean up sprite reference
            this.unregisterEntitySpriteComponent(entityId);
        });
    }

    /**
     * Show a damage number at the specified position
     */
    public showDamageNumber(
        x: number,
        y: number,
        value: number,
        color?: string,
        isCritical: boolean = false
    ): void {
        if (!this.renderer) {
            console.warn('[VFX] Renderer not set, cannot show damage number');
            return;
        }

        const damageNumber = new DamageNumberComponent(x, y, value, color, isCritical);
        const unregister = this.renderer.register(damageNumber);
        this.activeEffects.add(damageNumber);

        // Auto-cleanup when finished
        const checkInterval = setInterval(() => {
            if (damageNumber.isExpired()) {
                clearInterval(checkInterval);
                this.activeEffects.delete(damageNumber);
                unregister();
            }
        }, 100);
    }

    /**
     * Show a flash effect on an entity by applying tint to its sprite
     */
    public showFlash(
        entityId: string,
        _x: number, // Kept for API compatibility
        _y: number, // Kept for API compatibility
        flashType: keyof typeof FLASH_EFFECT_CONFIG = 'damage',
        _width: number = 16, // Kept for API compatibility
        _height: number = 16, // Kept for API compatibility
        _offsetX: number = -8, // Kept for API compatibility
        _offsetY: number = -8 // Kept for API compatibility
    ): void {
        // Get the sprite component for this entity
        const spriteComponent = this.entitySpriteComponents.get(entityId);
        if (!spriteComponent || !spriteComponent.setTint) {
            console.warn(`[VFX] No sprite component registered for entity ${entityId}, cannot show flash`);
            return;
        }

        // Clear any existing flash animation for this entity
        const existingFlash = this.activeFlashes.get(entityId);
        if (existingFlash) {
            clearInterval(existingFlash);
        }

        const config = FLASH_EFFECT_CONFIG[flashType];
        const startTime = Date.now();

        // Parse hex color
        const r = parseInt(config.color.slice(1, 3), 16);
        const g = parseInt(config.color.slice(3, 5), 16);
        const b = parseInt(config.color.slice(5, 7), 16);

        // Animate the tint over time
        const flashInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / config.duration;

            if (progress >= 1) {
                // Animation complete - remove tint
                spriteComponent.setTint(null);
                clearInterval(flashInterval);
                this.activeFlashes.delete(entityId);
                if (this.renderer) {
                    this.renderer.markLayerDirty(spriteComponent.layer);
                }
                return;
            }

            // Calculate pulse effect (sine wave * pulseCount)
            const pulsePhase = progress * config.pulseCount * Math.PI * 2;
            const pulseIntensity = (Math.sin(pulsePhase) + 1) / 2; // 0 to 1

            // Fade out over time
            const fadeOut = 1 - progress;

            // Combined intensity
            const finalIntensity = config.intensity * pulseIntensity * fadeOut;

            // Apply tint with calculated intensity (use alpha for intensity)
            spriteComponent.setTint({
                r: r,
                g: g,
                b: b,
                a: 255 * finalIntensity * 0.8 // Scale down a bit so sprite is still visible
            });

            // Mark layer dirty to trigger re-render
            if (this.renderer) {
                this.renderer.markLayerDirty(spriteComponent.layer);
            }
        }, 16); // ~60 FPS

        this.activeFlashes.set(entityId, flashInterval);
    }

    /**
     * Update all active effects (call from game loop)
     */
    public update(): void {
        this.activeEffects.forEach(effect => {
            if (effect.update && typeof effect.update === 'function') {
                effect.update();
            }
        });
    }

    /**
     * Clear all active effects
     */
    public clearAllEffects(): void {
        this.activeEffects.clear();
    }

    /**
     * Cleanup
     */
    public cleanup(): void {
        this.cleanupSubscriptions();
        this.clearAllEffects();
        this.renderer = null;
    }
}
