/**
 * Ant Entity
 * Player-controlled or autonomous ant with job system, hunger, and full component integration
 */

import { GameObject } from './GameObject';
import { StateMachineComponent, EntityState } from './components/StateMachineComponent';
import { PathfindingComponent } from './components/PathfindingComponent';
import { HealthComponent } from './components/HealthComponent';
import { CombatComponent } from './components/CombatComponent';
import { InventoryComponent } from './components/InventoryComponent';
import { VisionComponent } from './components/VisionComponent';
import { AIBehaviorComponent } from './components/AIBehaviorComponent';
import { AntJobComponent } from './components/AntJobComponent';
import { HungerComponent } from './components/HungerComponent';
import { ENTITY_CONFIG } from '../config/entityConfig';
import { distance } from '../utils/helpers';

export class Ant extends GameObject {
    private factionId: string;
    private randomMoveTimer: number = 0;
    private randomMoveInterval: number = 2000 + Math.random() * 2000; // 2-4 seconds
    private currentMoveX: number = 0; // Current movement direction X
    private currentMoveY: number = 0; // Current movement direction Y
    private moveDuration: number = 0; // How long to move in current direction
    private moveElapsed: number = 0; // Time spent moving in current direction
    
    // Hazard avoidance state
    private fleeingHazard: boolean = false;
    private fleeStartTime: number = 0;
    private fleeSafePosition: { x: number, y: number } | null = null;

    /**
     * Create ant entity with all components
     * @param gridX Starting grid X position
     * @param gridY Starting grid Y position
     * @param factionId Faction identifier for team/color
     */
    constructor(gridX: number, gridY: number, factionId: string) {
        super('ant', gridX, gridY);

        this.factionId = factionId;
        this.entityClass = 'ant'; // Set entity class for tile speed modifiers
        
        // Disable snapping for AI-controlled ants (they use pathfinding)
        this.enableSnapping = false;

        // Initialize all components
        this.initializeComponents();
    }

    /**
     * Initialize and attach all ant components
     */
    private initializeComponents(): void {
        // State machine for behavior states
        const stateMachine = new StateMachineComponent(EntityState.IDLE);
        this.addComponent('StateMachine', stateMachine);

        // Pathfinding for movement
        const pathfinding = new PathfindingComponent(2.0); // Speed 2.0 grid/second
        this.addComponent('Pathfinding', pathfinding);

        // Health system
        const health = new HealthComponent(100, 0, 'ant', this.factionId); // Max health 100, food-based healing
        this.addComponent('Health', health);

        // Combat system
        const combat = new CombatComponent(10, 2.5, 1000); // 10 damage, 2.5 range, 1s cooldown
        this.addComponent('Combat', combat);

        // Inventory for carrying resources
        const inventory = new InventoryComponent(10); // Capacity 10
        this.addComponent('Inventory', inventory);

        // Vision for detection
        const vision = new VisionComponent(8, 360); // 8 grid range, 360 degrees (circle vision)
        this.addComponent('Vision', vision);

        // AI behavior
        const aiBehavior = new AIBehaviorComponent();
        this.addComponent('AIBehavior', aiBehavior);

        // Job system with default GATHERER priorities [1,1,1,1]
        const antJob = new AntJobComponent([1, 1, 1, 1]);
        antJob.assignJob(AntJobComponent.JOB_GATHERER); // Default job
        this.addComponent('AntJob', antJob);

        // Hunger system
        const hunger = new HungerComponent(100); // Max hunger 100
        this.addComponent('Hunger', hunger);
    }

    /**
     * Get ant's faction ID
     */
    public getFactionId(): string {
        return this.factionId;
    }

    /**
     * Check if another entity is an enemy
     */
    public isEnemy(other: Ant): boolean {
        return this.factionId !== other.factionId;
    }

    /**
     * Set ant's job type
     */
    public setJob(jobType: number): void {
        const jobComponent = this.getComponent('AntJob') as AntJobComponent;
        jobComponent.assignJob(jobType);
    }

    /**
     * Check if ant is gatherer
     */
    public isGatherer(): boolean {
        const jobComponent = this.getComponent('AntJob') as AntJobComponent;
        return jobComponent.isGatherer();
    }

    /**
     * Check if ant is builder
     */
    public isBuilder(): boolean {
        const jobComponent = this.getComponent('AntJob') as AntJobComponent;
        return jobComponent.isBuilder();
    }

    /**
     * Check if ant is warrior
     */
    public isWarrior(): boolean {
        const jobComponent = this.getComponent('AntJob') as AntJobComponent;
        return jobComponent.isWarrior();
    }

    /**
     * Check if ant is scout
     */
    public isScout(): boolean {
        const jobComponent = this.getComponent('AntJob') as AntJobComponent;
        return jobComponent.isScout();
    }

    /**
     * Set autonomous mode (AI control)
     */
    public setAutonomous(autonomous: boolean): void {
        const aiBehavior = this.getComponent('AIBehavior') as AIBehaviorComponent;
        aiBehavior.setAutonomous(autonomous);
    }

    /**
     * Check if ant is autonomous
     */
    public isAutonomous(): boolean {
        const aiBehavior = this.getComponent('AIBehavior') as AIBehaviorComponent;
        return aiBehavior.isAutonomous();
    }

    /**
     * Update ant and all components
     */
    public update(deltaTime: number): void {
        if (!this.isActive) {
            return;
        }

        // Check for hazard avoidance (higher priority than random movement)
        this.checkHazardAvoidance();

        // If fleeing hazard, skip random movement
        if (this.fleeingHazard) {
            // Check if we've reached safety or timed out
            this.updateFleeingState();
        } else {
            // Random movement for testing collision system
            this.randomMoveTimer += deltaTime;
            
            // Check if we need a new random direction
            if (this.randomMoveTimer >= this.randomMoveInterval) {
                this.randomMoveTimer = 0;
                this.randomMoveInterval = 2000 + Math.random() * 2000; // Next decision in 2-4 seconds
                
                // Random direction: -1, 0, or 1 for X and Y
                const directions = [-1, 0, 1];
                this.currentMoveX = directions[Math.floor(Math.random() * 3)];
                this.currentMoveY = directions[Math.floor(Math.random() * 3)];
                
                // Set move duration (500-1500ms)
                this.moveDuration = 500 + Math.random() * 1000;
                this.moveElapsed = 0;
            }
            
            // Continue moving in current direction
            if (this.moveElapsed < this.moveDuration) {
                this.moveElapsed += deltaTime;
                this.requestMove(this.currentMoveX, this.currentMoveY);
            } else {
                // Stop moving after duration
                this.requestMove(0, 0);
            }
        }

        // Update all components through GameObject base class
        super.update(deltaTime);
    }

    /**
     * Check if ant should flee from recent hazard damage
     */
    private checkHazardAvoidance(): void {
        // Get hazard avoidance config for ants
        const config = ENTITY_CONFIG.HAZARD_AVOIDANCE.ant;
        
        // Check if hazard avoidance is enabled
        if (!config.ENABLED) {
            return;
        }

        // Don't start new flee if already fleeing
        if (this.fleeingHazard) {
            return;
        }

        // Get components
        const health = this.getComponent('Health') as HealthComponent;
        const stateMachine = this.getComponent('StateMachine') as StateMachineComponent;
        
        if (!health || !stateMachine) {
            return;
        }

        // Check if we took hazard damage recently
        const lastHazardDamage = health.lastHazardDamage;
        if (!lastHazardDamage) {
            return;
        }

        // Check if damage is recent
        const now = Date.now();
        const timeSinceDamage = now - lastHazardDamage.timestamp;
        if (timeSinceDamage > config.RECENT_DAMAGE_THRESHOLD_MS) {
            return;
        }

        // Check current state - don't flee if in combat
        const currentState = stateMachine.getCurrentState();
        if (currentState === EntityState.ATTACKING || currentState === EntityState.COMBAT) {
            return;
        }

        // Check health threshold (ants always flee regardless of health)
        const healthRatio = health.getCurrentHealth() / health.getMaxHealth();
        if (healthRatio < config.MIN_HEALTH_TO_FLEE) {
            return; // Below minimum health (ant config should have MIN_HEALTH_TO_FLEE: 1.0 so always passes)
        }

        // Start fleeing
        this.startFleeingHazard(lastHazardDamage.tileX!, lastHazardDamage.tileY!);
    }

    /**
     * Start fleeing from hazard tile
     */
    private startFleeingHazard(hazardTileX: number, hazardTileY: number): void {
        const config = ENTITY_CONFIG.HAZARD_AVOIDANCE.ant;
        
        // Calculate direction away from hazard
        const directionX = this.gridX - hazardTileX;
        const directionY = this.gridY - hazardTileY;
        
        // Normalize direction
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
        if (magnitude === 0) {
            // Already at hazard position? Just pick a random direction
            const angle = Math.random() * Math.PI * 2;
            const normX = Math.cos(angle);
            const normY = Math.sin(angle);
            
            // Calculate safe position
            this.fleeSafePosition = {
                x: Math.round(this.gridX + normX * config.FLEE_DISTANCE),
                y: Math.round(this.gridY + normY * config.FLEE_DISTANCE)
            };
        } else {
            const normX = directionX / magnitude;
            const normY = directionY / magnitude;
            
            // Calculate safe position FLEE_DISTANCE away
            this.fleeSafePosition = {
                x: Math.round(this.gridX + normX * config.FLEE_DISTANCE),
                y: Math.round(this.gridY + normY * config.FLEE_DISTANCE)
            };
        }

        // Set state
        this.fleeingHazard = true;
        this.fleeStartTime = Date.now();

        // Update state machine
        const stateMachine = this.getComponent('StateMachine') as StateMachineComponent;
        if (stateMachine) {
            stateMachine.setState(EntityState.FLEEING_HAZARD);
        }

        // Store flee direction for direct movement (simplified - no pathfinding for now)
        // Calculate normalized direction vector
        const dirX = this.fleeSafePosition.x - this.gridX;
        const dirY = this.fleeSafePosition.y - this.gridY;
        const dist = Math.sqrt(dirX * dirX + dirY * dirY);
        
        if (dist > 0) {
            this.currentMoveX = Math.sign(dirX);
            this.currentMoveY = Math.sign(dirY);
        }
    }

    /**
     * Update fleeing state - check if reached safety or timed out
     */
    private updateFleeingState(): void {
        if (!this.fleeingHazard || !this.fleeSafePosition) {
            return;
        }

        const config = ENTITY_CONFIG.HAZARD_AVOIDANCE.ant;
        const now = Date.now();
        
        // Check timeout
        if (now - this.fleeStartTime > config.FLEE_TIMEOUT_MS) {
            this.stopFleeingHazard();
            return;
        }

        // Check if reached safe position (within 1.5 tiles)
        const distToSafe = distance(
            this.gridX, this.gridY,
            this.fleeSafePosition.x, this.fleeSafePosition.y
        );
        
        if (distToSafe < 1.5) {
            this.stopFleeingHazard();
            return;
        }

        // Continue moving in flee direction
        this.requestMove(this.currentMoveX, this.currentMoveY);
    }

    /**
     * Stop fleeing and return to normal behavior
     */
    private stopFleeingHazard(): void {
        this.fleeingHazard = false;
        this.fleeSafePosition = null;

        // Return to idle state
        const stateMachine = this.getComponent('StateMachine') as StateMachineComponent;
        if (stateMachine) {
            stateMachine.setState(EntityState.IDLE);
        }

        // Clear last hazard damage so we don't immediately flee again
        const health = this.getComponent('Health') as HealthComponent;
        if (health) {
            health.lastHazardDamage = null;
        }
    }
}
