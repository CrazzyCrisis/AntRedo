/**
 * Boss - Enemy Boss Entity (MODEL)
 * Extends GameObject with patrol behavior, vision cone detection, and projectile attacks
 * Patrols until detecting weakest ant, then chases and attacks
 */

import { GameObject } from './GameObject';
import { StateMachineComponent, EntityState } from './components/StateMachineComponent';
import { PathfindingComponent } from './components/PathfindingComponent';
import { HealthComponent } from './components/HealthComponent';
import { CombatComponent } from './components/CombatComponent';
import { VisionComponent } from './components/VisionComponent';
import { AIBehaviorComponent } from './components/AIBehaviorComponent';
import { EventBus } from '../utils/eventBus';
import { ENTITY_CONFIG } from '../config/entityConfig';

export class Boss extends GameObject {
    // Patrol system
    public patrolPath: Array<{gridX: number; gridY: number}>;
    public patrolIndex: number;
    
    // Combat system
    public projectileType: 'homing' | 'straight';
    public weakestTargetId: string | null;
    
    // Components
    private stateMachine: StateMachineComponent;
    private pathfinding: PathfindingComponent;
    private health: HealthComponent;
    private combat: CombatComponent;
    private vision: VisionComponent;
    private aiBehavior: AIBehaviorComponent;

    constructor(gridX: number, gridY: number, patrolPath: Array<{gridX: number; gridY: number}>, projectileType: 'homing' | 'straight' = 'homing') {
        super('boss', gridX, gridY);
        
        this.entityClass = 'boss'; // Set entity class for tile speed modifiers (faster on stone!)
        
        // Disable snapping for AI-controlled boss (uses pathfinding)
        this.enableSnapping = false;
        
        // Initialize boss properties
        this.patrolPath = patrolPath;
        this.patrolIndex = 0;
        this.projectileType = projectileType;
        this.weakestTargetId = null;
        
        // Create and attach components
        this.stateMachine = new StateMachineComponent(EntityState.PATROLLING);
        this.pathfinding = new PathfindingComponent(ENTITY_CONFIG.BOSS.speed);
        this.health = new HealthComponent(ENTITY_CONFIG.BOSS.health, ENTITY_CONFIG.BOSS.health);
        this.combat = new CombatComponent(
            ENTITY_CONFIG.BOSS.attackDamage,
            ENTITY_CONFIG.BOSS.attackRange,
            ENTITY_CONFIG.BOSS.PROJECTILE.fireCooldown
        );
        this.vision = new VisionComponent(
            ENTITY_CONFIG.BOSS.VISION.coneDistance,
            ENTITY_CONFIG.BOSS.VISION.coneAngle
        );
        this.aiBehavior = new AIBehaviorComponent();
        
        // Attach components to GameObject
        this.addComponent('stateMachine', this.stateMachine);
        this.addComponent('pathfinding', this.pathfinding);
        this.addComponent('health', this.health);
        this.addComponent('combat', this.combat);
        this.addComponent('vision', this.vision);
        this.addComponent('aiBehavior', this.aiBehavior);
        
        // Boss is always autonomous
        this.aiBehavior.setAutonomous(true);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Emit creation event
        EventBus.emit('BOSS_CREATED', this.id, gridX, gridY);
    }

    /**
     * Setup EventBus listeners
     */
    private setupEventListeners(): void {
        // Listen for death
        EventBus.on('ENTITY_DIED', (entityId: string) => {
            if (entityId === this.id) {
                EventBus.emit('BOSS_DIED', this.id);
            }
        });
    }

    /**
     * Set patrol path
     * @param path - Array of grid positions to patrol
     */
    public setPatrolPath(path: Array<{gridX: number; gridY: number}>): void {
        this.patrolPath = path;
        this.patrolIndex = 0;
    }

    /**
     * Find weakest target in vision
     * Uses EntityManager to query all ants, finds one with lowest health
     * @param visibleEntities - Array of entities in vision cone
     * @returns ID of weakest ant or null if none found
     */
    public findWeakestTarget(visibleEntities: GameObject[]): string | null {
        let weakestAnt: GameObject | null = null;
        let lowestHealth = Infinity;
        
        for (const entity of visibleEntities) {
            // Only target ants
            if (entity.type !== 'ant') {
                continue;
            }
            
            // Check health component
            const healthComp = entity.getComponent('health') as HealthComponent | undefined;
            if (!healthComp || !healthComp.isAlive()) {
                continue;
            }
            
            // Track weakest
            if (healthComp.getCurrentHealth() < lowestHealth) {
                lowestHealth = healthComp.getCurrentHealth();
                weakestAnt = entity;
            }
        }
        
        return weakestAnt ? weakestAnt.id : null;
    }

    /**
     * Shoot projectile at target
     * Emits BOSS_PROJECTILE_FIRED event for factory to create projectile
     * @param targetId - Target entity ID
     */
    public shootProjectile(targetId: string): void {
        if (!this.combat.canAttack()) {
            return;
        }
        
        // Emit projectile creation event (factory will handle actual combat)
        EventBus.emit('BOSS_PROJECTILE_FIRED', this.id, targetId, this.projectileType);
        EventBus.emit('BOSS_ATTACKING', this.id, targetId);
    }

    /**
     * Resume patrol behavior
     * Moves to next waypoint in patrol path
     */
    public resumePatrol(): void {
        this.weakestTargetId = null;
        this.stateMachine.setState(EntityState.PATROLLING);
        
        // Set patrol speed
        this.pathfinding.setSpeed(ENTITY_CONFIG.BOSS.patrolSpeed);
        
        // Find path to next patrol waypoint
        if (this.patrolPath.length > 0) {
            const nextWaypoint = this.patrolPath[this.patrolIndex];
            // Note: PathfindingComponent.findPath requires grid parameter
            // This should be injected via PathfindingManager
            // For now, we just track the path request
            EventBus.emit('BOSS_PATH_REQUEST', this.id, nextWaypoint.gridX, nextWaypoint.gridY);
            
            EventBus.emit('BOSS_PATROLLING', this.id, this.patrolIndex);
        }
    }

    /**
     * Update patrol index when reaching waypoint
     */
    private advancePatrolWaypoint(): void {
        this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
    }

    /**
     * Custom update logic for Boss AI
     * Implements patrol → detect → chase → attack loop
     */
    public update(deltaTime: number): void {
        // Call parent update (updates all components)
        super.update(deltaTime);
        
        if (!this.isActive || !this.health.isAlive()) {
            return;
        }
        
        // Boss AI state machine
        const currentState = this.stateMachine.getCurrentState();
        
        switch (currentState) {
            case EntityState.PATROLLING:
                this.handlePatrolState();
                break;
                
            case EntityState.ATTACKING:
                this.handleAttackState();
                break;
        }
    }

    /**
     * Handle patrol state logic
     * Scans for targets, moves to next waypoint
     */
    private handlePatrolState(): void {
        // Check if reached current waypoint
        if (!this.pathfinding.hasPath() || !this.pathfinding.isMoving()) {
            // Advance to next waypoint
            this.advancePatrolWaypoint();
            
            if (this.patrolPath.length > 0) {
                const nextWaypoint = this.patrolPath[this.patrolIndex];
                EventBus.emit('BOSS_PATH_REQUEST', this.id, nextWaypoint.gridX, nextWaypoint.gridY);
            }
        }
        
        // Scan for targets using vision component
        // Vision component handles detection automatically via EventBus
        // We just check if we have a detected target
        const detectedEntities = this.vision.getDetectedEntities();
        
        if (detectedEntities.size > 0) {
            // Need to get actual entity objects to find weakest
            // This would normally come from EntityManager query
            // For now, just target the first detected entity
            const targetId = Array.from(detectedEntities)[0];
            this.weakestTargetId = targetId;
            
            // Transition to attack state
            this.stateMachine.setState(EntityState.ATTACKING);
            this.pathfinding.setSpeed(ENTITY_CONFIG.BOSS.speed);
            
            EventBus.emit('BOSS_TARGET_ACQUIRED', this.id, targetId);
        }
    }

    /**
     * Handle attack state logic
     * Chase target and fire projectiles
     */
    private handleAttackState(): void {
        if (!this.weakestTargetId) {
            // Lost target, resume patrol
            this.resumePatrol();
            return;
        }
        
        // Get target entity from EntityManager (would be injected in real implementation)
        // For now, we emit event and let factory/manager handle targeting
        
        // Try to shoot projectile
        if (this.combat.canAttack()) {
            this.shootProjectile(this.weakestTargetId);
        }
        
        // Check if target is still in vision
        const detectedEntities = this.vision.getDetectedEntities();
        if (!detectedEntities.has(this.weakestTargetId)) {
            // Lost sight of target, resume patrol
            this.resumePatrol();
        }
    }
}
