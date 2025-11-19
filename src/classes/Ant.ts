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
import { RandomMovementComponent } from './components/RandomMovementComponent';
import { HazardAvoidanceComponent } from './components/HazardAvoidanceComponent';

export class Ant extends GameObject {
    private factionId: string;

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

        // Random movement behavior
        const randomMovement = new RandomMovementComponent();
        this.addComponent('RandomMovement', randomMovement);

        // Hazard avoidance behavior
        const hazardAvoidance = new HazardAvoidanceComponent('ant');
        this.addComponent('HazardAvoidance', hazardAvoidance);
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

        // Get components
        const hazardAvoidance = this.getComponent('HazardAvoidance') as HazardAvoidanceComponent;
        const randomMovement = this.getComponent('RandomMovement') as RandomMovementComponent;

        // Hazard avoidance has higher priority than random movement
        if (hazardAvoidance && hazardAvoidance.isFleeing()) {
            // Disable random movement while fleeing
            if (randomMovement) {
                randomMovement.setEnabled(false);
            }
        } else {
            // Re-enable random movement when not fleeing
            if (randomMovement && !randomMovement.isEnabled()) {
                randomMovement.setEnabled(true);
            }
        }

        // Update all components through GameObject base class
        super.update(deltaTime);
    }
}
