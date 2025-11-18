/**
 * CombatVisualHandler - Visual feedback for combat system
 * 
 * Handles visual effects for melee combat:
 * - Sprite offset animations (charge pullback, lunge forward, return)
 * - Camera shake (queen only)
 * - Combat sounds (proximity-based to queen)
 * - Particle effects on impact
 * 
 * Listens to CombatManager events:
 * - COMBAT_CHARGE_START
 * - COMBAT_LUNGE_START
 * - COMBAT_LUNGE_END
 * - ENTITY_ATTACKED
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { distance } from '../utils/helpers';
import { EntityManager } from '../managers/EntityManager';
import { AudioManager } from '../managers/AudioManager';

interface SpriteOffset {
    entityId: string;
    offsetX: number;
    offsetY: number;
    startTime: number;
    duration: number;
}

export class CombatVisualHandler {
    private static instance: CombatVisualHandler;
    
    private entityManager: EntityManager;
    private audioManager: AudioManager;
    
    // Track sprite offsets for visual animation
    private activeOffsets: Map<string, SpriteOffset> = new Map();
    
    // Configuration
    private readonly CHARGE_DISTANCE = 0.25;  // Tiles to pull back
    private readonly LUNGE_DISTANCE = 0.5;    // Tiles to lunge forward
    private readonly AUDIO_RANGE = 15;        // Grid units - queen hears combat within this range
    private readonly CAMERA_SHAKE_INTENSITY = 8; // Pixels
    private readonly CAMERA_SHAKE_DURATION = 200; // ms
    
    private constructor() {
        this.entityManager = EntityManager.getInstance();
        this.audioManager = AudioManager.getInstance();
        
        this.setupListeners();
    }
    
    public static getInstance(): CombatVisualHandler {
        if (!CombatVisualHandler.instance) {
            CombatVisualHandler.instance = new CombatVisualHandler();
        }
        return CombatVisualHandler.instance;
    }
    
    /**
     * Setup event listeners for combat visual feedback
     */
    private setupListeners(): void {
        // Phase 1: Charge (pull back)
        EventBus.on(GameEvents.COMBAT_CHARGE_START, (attackerId: string, targetId: string) => {
            this.handleChargeStart(attackerId, targetId);
        });
        
        // Phase 2: Lunge (rush forward)
        EventBus.on(GameEvents.COMBAT_LUNGE_START, (attackerId: string, targetId: string) => {
            this.handleLungeStart(attackerId, targetId);
        });
        
        // Phase 3: Return to position
        EventBus.on(GameEvents.COMBAT_LUNGE_END, (attackerId: string) => {
            this.handleLungeEnd(attackerId);
        });
        
        // Impact: Sound, particles, camera shake (queen only)
        EventBus.on(GameEvents.ENTITY_ATTACKED, (attackerId: string, targetId: string, damage: number) => {
            this.handleImpact(attackerId, targetId, damage);
        });
    }
    
    /**
     * Handle charge start - pull back sprite
     */
    private handleChargeStart(attackerId: string, targetId: string): void {
        const attacker = this.entityManager.getEntity(attackerId);
        const target = this.entityManager.getEntity(targetId);
        
        if (!attacker || !target) return;
        
        // Calculate direction vector (away from target)
        const dx = attacker.gridX - target.gridX;
        const dy = attacker.gridY - target.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return;
        
        // Normalize and apply charge distance
        const chargeX = (dx / dist) * this.CHARGE_DISTANCE;
        const chargeY = (dy / dist) * this.CHARGE_DISTANCE;
        
        // Store offset for sprite rendering
        this.activeOffsets.set(attackerId, {
            entityId: attackerId,
            offsetX: chargeX,
            offsetY: chargeY,
            startTime: Date.now(),
            duration: 150
        });
        
        // Emit event for sprite components to apply offset
        EventBus.emit(GameEvents.SPRITE_OFFSET_CHANGED, attackerId, chargeX, chargeY);
    }
    
    /**
     * Handle lunge start - rush forward sprite
     */
    private handleLungeStart(attackerId: string, targetId: string): void {
        const attacker = this.entityManager.getEntity(attackerId);
        const target = this.entityManager.getEntity(targetId);
        
        if (!attacker || !target) return;
        
        // Calculate direction vector (toward target)
        const dx = target.gridX - attacker.gridX;
        const dy = target.gridY - attacker.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return;
        
        // Normalize and apply lunge distance
        const lungeX = (dx / dist) * this.LUNGE_DISTANCE;
        const lungeY = (dy / dist) * this.LUNGE_DISTANCE;
        
        // Update offset
        this.activeOffsets.set(attackerId, {
            entityId: attackerId,
            offsetX: lungeX,
            offsetY: lungeY,
            startTime: Date.now(),
            duration: 150
        });
        
        // Emit event for sprite components
        EventBus.emit(GameEvents.SPRITE_OFFSET_CHANGED, attackerId, lungeX, lungeY);
        
        // Play whoosh sound if queen is nearby
        this.playProximitySoundEffect('combat_whoosh', attacker.gridX, attacker.gridY);
    }
    
    /**
     * Handle lunge end - return to original position
     */
    private handleLungeEnd(attackerId: string): void {
        // Clear offset (return to 0, 0)
        this.activeOffsets.delete(attackerId);
        EventBus.emit(GameEvents.SPRITE_OFFSET_CHANGED, attackerId, 0, 0);
    }
    
    /**
     * Handle impact - sound, particles, camera shake (queen only)
     */
    private handleImpact(_attackerId: string, targetId: string, damage: number): void {
        const target = this.entityManager.getEntity(targetId);
        if (!target) return;
        
        // Play impact sound if queen is nearby
        this.playProximitySoundEffect('combat_impact', target.gridX, target.gridY);
        
        // Emit particle effect at target position
        EventBus.emit(GameEvents.PARTICLE_SPAWN, 'combat_impact', target.gridX, target.gridY, {
            count: Math.min(damage, 10), // More particles for higher damage
            color: [220, 50, 50],        // Red particles
            velocity: 2,
            lifetime: 500
        });
        
        // Camera shake ONLY if target is queen
        if (target.type === 'queen') {
            this.triggerCameraShake();
        }
    }
    
    /**
     * Play sound effect only if queen is within audio range
     * Note: Currently uses AudioManager.play() which doesn't support volume multipliers.
     * Volume is controlled by category (SFX) volume settings in AudioManager.
     * For full proximity-based volume, would need AudioManager enhancement.
     */
    private playProximitySoundEffect(soundId: string, x: number, y: number): void {
        // Find player queen (assumes 'player' faction)
        const allEntities = this.entityManager.getAllEntities();
        const playerQueen = allEntities.find(e => e.type === 'queen' && (e as any).factionId === 'player');
        
        if (!playerQueen) return;
        
        // Check distance to queen
        const dist = distance(playerQueen.gridX, playerQueen.gridY, x, y);
        
        if (dist <= this.AUDIO_RANGE) {
            // Play sound if within range (uses category volume from AudioManager)
            // TODO: Add distance-based volume scaling to AudioManager for spatial audio
            this.audioManager.play(soundId as any);
        }
    }
    
    /**
     * Trigger camera shake effect
     */
    private triggerCameraShake(): void {
        EventBus.emit(GameEvents.CAMERA_SHAKE, this.CAMERA_SHAKE_INTENSITY, this.CAMERA_SHAKE_DURATION);
    }
    
    /**
     * Get current sprite offset for entity
     */
    public getSpriteOffset(entityId: string): { x: number; y: number } | null {
        const offset = this.activeOffsets.get(entityId);
        if (!offset) return null;
        
        // Check if offset expired
        if (Date.now() - offset.startTime > offset.duration) {
            this.activeOffsets.delete(entityId);
            return null;
        }
        
        return { x: offset.offsetX, y: offset.offsetY };
    }
    
    /**
     * Clear all active offsets (for cleanup/reset)
     */
    public clearAllOffsets(): void {
        this.activeOffsets.forEach((offset) => {
            EventBus.emit(GameEvents.SPRITE_OFFSET_CHANGED, offset.entityId, 0, 0);
        });
        this.activeOffsets.clear();
    }
    
    /**
     * Update - cleanup expired offsets
     */
    public update(): void {
        const now = Date.now();
        
        for (const [entityId, offset] of this.activeOffsets.entries()) {
            if (now - offset.startTime > offset.duration) {
                this.activeOffsets.delete(entityId);
                EventBus.emit(GameEvents.SPRITE_OFFSET_CHANGED, entityId, 0, 0);
            }
        }
    }
}
