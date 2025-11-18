/**
 * CombatManager - Handles combat AI and visual attack sequences
 * 
 * Orchestrates melee combat between ants of different factions:
 * - Listens for ENTITY_DETECTED events from VisionComponent
 * - Checks if detected entity is an enemy (FactionManager.isEnemy)
 * - Initiates attack sequence with visual feedback
 * - Manages attack animations and damage dealing
 * 
 * Visual Attack Sequence:
 * 1. COMBAT_CHARGE_START - entity pulls back slightly (prep animation)
 * 2. COMBAT_LUNGE_START - entity rushes forward rapidly
 * 3. ENTITY_ATTACKED - damage is dealt at impact moment
 * 4. COMBAT_LUNGE_END - entity returns to original tile
 */

import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';
import { EntityManager } from './EntityManager';
import { FactionManager } from './FactionManager';
import { distance } from '../utils/helpers';

export class CombatManager extends BaseManager {
    private static instance: CombatManager;
    
    private entityManager: EntityManager;
    private factionManager: FactionManager;
    
    // Track ongoing combats to prevent duplicate attacks
    private activeCombats: Set<string> = new Set(); // Format: "attackerId:targetId"
    
    private constructor() {
        super();
        
        this.entityManager = EntityManager.getInstance();
        this.factionManager = FactionManager.getInstance();
        
        this.setupListeners();
    }
    
    public static getInstance(): CombatManager {
        if (!CombatManager.instance) {
            CombatManager.instance = new CombatManager();
        }
        return CombatManager.instance;
    }
    
    /**
     * Setup event listeners for combat AI
     */
    private setupListeners(): void {
        // Listen for entity detection (from VisionComponent)
        this.subscribe(GameEvents.ENTITY_DETECTED, (observerId: string, targetId: string) => {
            this.onEntityDetected(observerId, targetId);
        });
        
        // Listen for entity lost (stop combat)
        this.subscribe(GameEvents.ENTITY_LOST, (observerId: string, targetId: string) => {
            this.onEntityLost(observerId, targetId);
        });
        
        // Listen for entity destroyed (cleanup active combats)
        this.subscribe(GameEvents.ENTITY_DESTROYED, (entityId: string) => {
            this.onEntityDestroyed(entityId);
        });
    }
    
    /**
     * Handle entity detection - check if enemy and initiate combat
     */
    private onEntityDetected(observerId: string, targetId: string): void {
        console.log(`[CombatManager] Entity detected: ${observerId} sees ${targetId}`);
        
        const observer = this.entityManager.getEntity(observerId);
        const target = this.entityManager.getEntity(targetId);
        
        if (!observer || !target) {
            console.log(`[CombatManager] Entity not found - observer:${!!observer} target:${!!target}`);
            return;
        }
        
        console.log(`[CombatManager] Entity types: observer=${observer.type} target=${target.type}`);
        
        // Ants and Queens engage in auto-combat
        const validTypes = ['ant', 'queen'];
        if (!validTypes.includes(observer.type) || !validTypes.includes(target.type)) {
            console.log(`[CombatManager] Not ant/queen - skipping`);
            return;
        }
        
        // Check if entities are enemies
        const observerFaction = (observer as any).factionId;
        const targetFaction = (target as any).factionId;
        
        console.log(`[CombatManager] Factions: observer=${observerFaction} target=${targetFaction}`);
        
        if (!observerFaction || !targetFaction) {
            console.log(`[CombatManager] Missing faction IDs`);
            return;
        }
        if (!this.factionManager.isEnemy(observerFaction, targetFaction)) {
            console.log(`[CombatManager] Not enemies - skipping`);
            return;
        }
        
        console.log(`[CombatManager] Enemies confirmed! Checking combat state...`);
        
        // Check if already engaged in combat with this target
        const combatKey = `${observerId}:${targetId}`;
        if (this.activeCombats.has(combatKey)) {
            console.log(`[CombatManager] Already in combat`);
            return;
        }
        
        // Get combat component
        const combatComponent = observer.getComponent('Combat') as any;
        if (!combatComponent) {
            console.log(`[CombatManager] No combat component`);
            return;
        }
        
        // Check if in melee range (adjacent or 1-2 tiles away)
        const dist = distance(observer.gridX, observer.gridY, target.gridX, target.gridY);
        const attackRange = combatComponent.getAttackRange();
        
        console.log(`[CombatManager] Distance: ${dist.toFixed(2)} | Attack range: ${attackRange}`);
        
        if (dist <= attackRange) {
            console.log(`[CombatManager] IN RANGE! Initiating melee attack...`);
            // Initiate melee attack sequence
            this.initiateMeleeAttack(observer, target, combatComponent);
        } else {
            console.log(`[CombatManager] Out of range`);
        }
    }
    
    /**
     * Initiate visual melee attack sequence
     */
    private initiateMeleeAttack(attacker: any, target: any, combatComponent: any): void {
        // Mark combat as active
        const combatKey = `${attacker.id}:${target.id}`;
        this.activeCombats.add(combatKey);
        
        // Check if can attack (cooldown)
        if (!combatComponent.canAttack()) {
            this.activeCombats.delete(combatKey);
            return;
        }
        
        // Phase 1: Charge up (pull back slightly) - 150ms
        this.emit(GameEvents.COMBAT_CHARGE_START, attacker.id, target.id, attacker.gridX, attacker.gridY);
        
        setTimeout(() => {
            // Phase 2: Lunge forward rapidly - 100ms
            this.emit(GameEvents.COMBAT_LUNGE_START, attacker.id, target.id, target.gridX, target.gridY);
            
            setTimeout(() => {
                // Phase 3: Deal damage at impact
                const success = combatComponent.attack(target);
                
                if (success) {
                    // Apply damage to target
                    const healthComponent = target.getComponent('Health');
                    if (healthComponent) {
                        const damage = combatComponent.getAttackDamage();
                        healthComponent.takeDamage(damage, attacker.id);
                    }
                }
                
                // Phase 4: Return to original position - 150ms
                setTimeout(() => {
                    this.emit(GameEvents.COMBAT_LUNGE_END, attacker.id, attacker.gridX, attacker.gridY);
                    
                    // Mark combat as complete after return animation
                    setTimeout(() => {
                        this.activeCombats.delete(combatKey);
                    }, 150);
                }, 100);
            }, 150);
        }, 150);
    }
    
    /**
     * Handle entity lost from vision - stop combat
     */
    private onEntityLost(observerId: string, targetId: string): void {
        const combatKey = `${observerId}:${targetId}`;
        this.activeCombats.delete(combatKey);
    }
    
    /**
     * Handle entity destroyed - cleanup all combats involving this entity
     */
    private onEntityDestroyed(entityId: string): void {
        // Remove all combats involving this entity
        for (const combatKey of this.activeCombats) {
            if (combatKey.includes(entityId)) {
                this.activeCombats.delete(combatKey);
            }
        }
    }
    
    /**
     * Check if entity is currently in combat
     */
    public isInCombat(entityId: string): boolean {
        for (const combatKey of this.activeCombats) {
            if (combatKey.includes(entityId)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get all active combat pairs
     */
    public getActiveCombats(): string[] {
        return Array.from(this.activeCombats);
    }
    
    /**
     * Clear all active combats (for testing/cleanup)
     */
    public clearCombats(): void {
        this.activeCombats.clear();
    }
    
    /**
     * Cleanup
     */
    public cleanup(): void {
        this.clearCombats();
        this.cleanupSubscriptions();
    }
}
