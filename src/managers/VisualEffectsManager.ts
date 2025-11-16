/**
 * VisualEffectsManager - Centralized management of all visual effects
 * Handles damage numbers, flashes, floating text, etc.
 * 
 * Uses EventBus to respond to game events and spawn appropriate effects
 */

import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';
import { DamageNumberComponent } from '../rendering/components/DamageNumberComponent';
import { FlashEffectComponent } from '../rendering/components/FlashEffectComponent';
import { DAMAGE_NUMBER_CONFIG, FLASH_EFFECT_CONFIG } from '../config/visualEffects';
import { Renderer } from '../rendering/Renderer';

export class VisualEffectsManager extends BaseManager {
    private static instance: VisualEffectsManager;
    private renderer: Renderer | null = null;
    private activeEffects: Set<any> = new Set();

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
     * Setup event listeners for automatic effect spawning
     */
    private setupEventListeners(): void {
        // Listen for entity damage events
        this.subscribe(GameEvents.ENTITY_DAMAGE, (_entityId: string, amount: number, x: number, y: number, isCritical?: boolean) => {
            this.showDamageNumber(x, y, -amount, DAMAGE_NUMBER_CONFIG.colors.physical, isCritical);
            this.showFlash(x, y, isCritical ? 'critical' : 'damage');
        });

        // Listen for healing events
        this.subscribe(GameEvents.ENTITY_HEALED, (_entityId: string, amount: number, x: number, y: number) => {
            this.showDamageNumber(x, y, amount, DAMAGE_NUMBER_CONFIG.colors.healing);
            this.showFlash(x, y, 'heal');
        });

        // Listen for entity death
        this.subscribe(GameEvents.ENTITY_DIED, (_entityId: string, x: number, y: number) => {
            this.showFlash(x, y, 'death', 32, 32);
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
     * Show a flash effect on an entity
     */
    public showFlash(
        x: number,
        y: number,
        flashType: keyof typeof FLASH_EFFECT_CONFIG = 'damage',
        width: number = 16,
        height: number = 16,
        offsetX: number = -8,
        offsetY: number = -8
    ): void {
        if (!this.renderer) {
            console.warn('[VFX] Renderer not set, cannot show flash');
            return;
        }

        const config = FLASH_EFFECT_CONFIG[flashType];
        const flash = new FlashEffectComponent(x, y, width, height, config, offsetX, offsetY);
        const unregister = this.renderer.register(flash);
        this.activeEffects.add(flash);

        // Auto-cleanup when finished
        const checkInterval = setInterval(() => {
            if (flash.isExpired()) {
                clearInterval(checkInterval);
                this.activeEffects.delete(flash);
                unregister();
            }
        }, 50);
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
