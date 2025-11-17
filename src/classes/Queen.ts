import { GameObject } from './GameObject';
import { PathfindingComponent } from './components/PathfindingComponent';
import { HealthComponent } from './components/HealthComponent';
import { CombatComponent } from './components/CombatComponent';
import { VisionComponent } from './components/VisionComponent';
import { InventoryComponent } from './components/InventoryComponent';
import { ResourceGatheringComponent } from './components/ResourceGatheringComponent';
import { StateMachineComponent, EntityState } from './components/StateMachineComponent';
import { EventBus, GameEvents } from '../utils/eventBus';
import { InputManager } from '../managers/InputManager';
import { ENTITY_CONFIG } from '../config/gameplay/entityConfig';
import { distance } from '../utils/helpers';

/**
 * QueenPower interface for power system
 */
export interface QueenPower {
    name: string;
    isUnlocked: boolean;
    level: number;
    maxLevel: number;
    cooldown: number;  // milliseconds
    lastUsedTime: number;
}

/**
 * Queen class - player-controlled entity with power system
 * 
 * Components: Pathfinding, Health, Combat, Vision, Inventory, ResourceGathering (6 total)
 * 
 * Features:
 * - Power system with unlock/upgrade/cooldown mechanics
 * - Command radius for ant army
 * - Camera follow integration
 * - Keybind input (1-5 for powers)
 * - Death triggers game over
 * 
 * MODEL layer
 */
export class Queen extends GameObject {
    private factionId: string;
    private playerControlled: boolean = true;
    private commandRadius: number = 15;
    private powers: Map<string, QueenPower> = new Map();
    private keybindMap: Map<string, string> = new Map();
    // @ts-expect-error - Used in constructor to pass to ResourceGatheringComponent
    private entityManager: any;
    
    // Hazard avoidance state
    private fleeingHazard: boolean = false;
    private fleeStartTime: number = 0;
    private fleeSafePosition: { x: number, y: number } | null = null;

    constructor(gridX: number, gridY: number, factionId: string, entityManager?: any) {
        super('queen', gridX, gridY);
        this.factionId = factionId;
        this.entityClass = 'queen'; // Set entity class for tile speed modifiers
        this.entityManager = entityManager;
        
        // Set movement speed (tiles per second) from config
        this.moveSpeed = ENTITY_CONFIG.QUEEN.speed;

        // Initialize components
        this.addComponent('StateMachine', new StateMachineComponent(EntityState.IDLE));
        this.addComponent('Pathfinding', new PathfindingComponent(ENTITY_CONFIG.QUEEN.speed)); // Use same speed as player control
        this.addComponent('Health', new HealthComponent(ENTITY_CONFIG.QUEEN.health, 0, 'queen', factionId)); // Higher health than ants, food-based healing
        this.addComponent('Combat', new CombatComponent(
            ENTITY_CONFIG.QUEEN.attackDamage,
            ENTITY_CONFIG.QUEEN.attackRange, 
            ENTITY_CONFIG.QUEEN.attackGCD)); // Stronger combat
        this.addComponent('Vision', new VisionComponent(10, 360)); // 10 grid range, 360 degrees (circle vision)
        this.addComponent('Inventory', new InventoryComponent(50)); // Queen has larger inventory (50 vs ant's 10)
        
        // Add resource gathering component if EntityManager is available
        if (entityManager) {
            this.addComponent('ResourceGathering', new ResourceGatheringComponent(entityManager));
        }

        // Initialize power system
        this.initializePowers();

        // Setup keybind listeners
        this.setupKeybinds();

        // Setup health listener for death
        this.setupHealthListener();
        
        // Camera follow will be requested by QueenFactory after EntityManager registration
    }

    /**
     * Initialize default powers from config
     */
    private initializePowers(): void {
        const powersConfig = ENTITY_CONFIG.QUEEN.POWERS;
        const keybindsConfig = ENTITY_CONFIG.QUEEN.KEYBINDS;

        // Iterate over powers Record object
        Object.entries(powersConfig).forEach(([powerName, powerConfig]) => {
            this.powers.set(powerName, {
                name: powerName,
                isUnlocked: false,
                level: 1,
                maxLevel: 3, // All powers have 3 levels in config
                cooldown: powerConfig.cooldown * 1000, // Convert seconds to ms
                lastUsedTime: 0
            });
        });

        // Map keybinds to powers from config
        Object.entries(keybindsConfig).forEach(([powerName, key]) => {
            this.keybindMap.set(key, powerName);
        });
        
        // Listen for PowerManager initialization and sync unlock status
        EventBus.once('QUEEN_POWERS_INITIALIZED', (queenId: string) => {
            if (queenId === this.id) {
                // Unlock basic powers (lightning, fireball, blackhole, tidalwave)
                this.unlockPower('lightning');
                this.unlockPower('fireball');
                this.unlockPower('blackhole');
                this.unlockPower('tidalwave');
                // finalFlash stays locked until all others are level 3
            }
        });
    }

    /**
     * Setup keybind listeners for power activation
     */
    private setupKeybinds(): void {
        EventBus.on(GameEvents.INPUT_KEY_PRESS, (key: string) => {
            if (!this.isActive || !this.playerControlled) return;

            const powerName = this.keybindMap.get(key);
            if (powerName) {
                this.usePower(powerName);
            }
        });
    }

    /**
     * Setup health listener for death
     */
    private setupHealthListener(): void {
        EventBus.on('ENTITY_DIED', (entityId: string) => {
            if (entityId === this.id) {
                // Queen died - emit game over event
                EventBus.emit(GameEvents.QUEEN_DEATH, this.id, this.factionId);
                this.isActive = false;
            }
        });
    }

    /**
     * Use a queen power
     * @param powerName Name of power to use
     * @param targetX Optional target X coordinate
     * @param targetY Optional target Y coordinate
     * @returns True if power was used successfully
     */
    usePower(powerName: string, targetX?: number, targetY?: number): boolean {
        const power = this.powers.get(powerName);
        if (!power || !power.isUnlocked) return false;

        // Check cooldown
        const currentTime = Date.now();
        if (currentTime - power.lastUsedTime < power.cooldown) {
            return false;
        }

        // Trigger PowerManager to actually use the power
        const { PowerManager } = require('../managers/PowerManager');
        const powerManager = PowerManager.getInstance();
        
        // PowerManager handles the actual power logic and visual effects
        const success = powerManager.usePower(
            this.id,
            powerName,
            this.gridX,
            this.gridY,
            targetX,
            targetY
        );
        
        if (success) {
            // Update local cooldown tracking
            power.lastUsedTime = currentTime;
            EventBus.emit(GameEvents.QUEEN_POWER_USED, this.id, powerName, targetX, targetY);
        }

        return success;
    }

    /**
     * Unlock a power
     * @param powerName Name of power to unlock
     */
    unlockPower(powerName: string): void {
        const power = this.powers.get(powerName);
        if (!power) return;

        if (!power.isUnlocked) {
            power.isUnlocked = true;
            EventBus.emit(GameEvents.QUEEN_POWER_UNLOCKED, this.id, powerName);
        }
    }

    /**
     * Upgrade a power level
     * @param powerName Name of power to upgrade
     */
    upgradePower(powerName: string): void {
        const power = this.powers.get(powerName);
        if (!power || !power.isUnlocked) return;

        if (power.level < power.maxLevel) {
            power.level++;
            EventBus.emit(GameEvents.QUEEN_POWER_UPGRADED, this.id, powerName, power.level);
        }
    }

    /**
     * Command nearby ants
     * @param radius Command radius
     * @param command Command type
     * @returns Number of ants commanded
     */
    commandAnts(radius: number, command: string): number {
        if (!command || radius < 0) return 0;

        EventBus.emit(GameEvents.QUEEN_COMMAND_ISSUED, this.id, command, radius);

        // In real implementation, would query nearby ants and issue commands
        // For now, return 0 (will be implemented when we have ant querying system)
        return 0;
    }

    /**
     * Interact with queen (for menus, upgrades, etc.)
     */
    interact(): void {
        EventBus.emit(GameEvents.QUEEN_INTERACTED, this.id);
    }

    /**
     * Get command radius
     */
    getCommandRadius(): number {
        return this.commandRadius;
    }

    /**
     * Set command radius
     * @param radius New command radius (clamped to 0+)
     */
    setCommandRadius(radius: number): void {
        this.commandRadius = Math.max(0, radius);
    }

    /**
     * Get faction ID
     */
    getFactionId(): string {
        return this.factionId;
    }

    /**
     * Check if entity is enemy
     * @param other Other entity
     */
    isEnemy(other: GameObject): boolean {
        if (other.type !== 'queen' && other.type !== 'ant' && other.type !== 'boss') {
            return false;
        }

        // Type assertion to access factionId
        const otherWithFaction = other as any;
        return otherWithFaction.factionId !== this.factionId;
    }

    /**
     * Check if player controlled
     */
    isPlayerControlled(): boolean {
        return this.playerControlled;
    }

    /**
     * Set player control
     * @param controlled Whether player controlled
     */
    setPlayerControlled(controlled: boolean): void {
        this.playerControlled = controlled;
    }

    /**
     * Get all powers
     */
    getPowers(): Map<string, QueenPower> {
        return this.powers;
    }

    /**
     * Get specific power
     * @param powerName Name of power
     */
    getPower(powerName: string): QueenPower | undefined {
        return this.powers.get(powerName);
    }

    /**
     * Get speed
     */
    getSpeed(): number {
        return this.moveSpeed;
    }

    /**
     * Update queen (components update automatically via GameObject)
     * Handles continuous movement when keys are held
     * @param deltaTime Time since last update in ms
     */
    update(deltaTime: number): void {
        if (!this.isActive) return;

        // Check for hazard avoidance (overrides player control when health is low)
        this.checkHazardAvoidance();

        // If fleeing hazard, use pathfinding instead of manual control
        if (this.fleeingHazard) {
            this.updateFleeingState();
            super.update(deltaTime);
            return;
        }

        // Normal player-controlled movement
        if (!this.playerControlled) {
            super.update(deltaTime);
            return;
        }

        // Handle continuous movement based on held keys
        const inputManager = InputManager.getInstance();
        let moveX = 0;
        let moveY = 0;

        // Check for held movement keys (direction only, speed applied in processMovement)
        if (inputManager.isActionPressed('moveUp')) {
            moveY = -1;
        }
        if (inputManager.isActionPressed('moveDown')) {
            moveY = 1;
        }
        if (inputManager.isActionPressed('moveLeft')) {
            moveX = -1;
        }
        if (inputManager.isActionPressed('moveRight')) {
            moveX = 1;
        }

        // Request movement (processed by GameObject with speed/deltaTime)
        if (moveX !== 0 || moveY !== 0) {
            // Cancel pathfinding when user takes manual control
            const pathfindingComponent = this.getComponent('Pathfinding') as PathfindingComponent;
            if (pathfindingComponent && pathfindingComponent.hasPath()) {
                pathfindingComponent.clearPath();
            }
            
            this.requestMove(moveX, moveY);
        }

        super.update(deltaTime);
    }

    /**
     * Check if queen should flee from recent hazard damage
     */
    private checkHazardAvoidance(): void {
        // Get hazard avoidance config for queens
        const config = ENTITY_CONFIG.HAZARD_AVOIDANCE.queen;
        
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

        // Check health threshold (queens only flee below 70% health)
        const healthRatio = health.getCurrentHealth() / health.getMaxHealth();
        if (healthRatio >= config.MIN_HEALTH_TO_FLEE) {
            return; // Above threshold, don't flee
        }

        // Start fleeing
        this.startFleeingHazard(lastHazardDamage.tileX!, lastHazardDamage.tileY!);
    }

    /**
     * Start fleeing from hazard tile
     */
    private startFleeingHazard(hazardTileX: number, hazardTileY: number): void {
        const config = ENTITY_CONFIG.HAZARD_AVOIDANCE.queen;
        
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
    }

    /**
     * Update fleeing state - check if reached safety or timed out
     */
    private updateFleeingState(): void {
        if (!this.fleeingHazard || !this.fleeSafePosition) {
            return;
        }

        const config = ENTITY_CONFIG.HAZARD_AVOIDANCE.queen;
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

        // Calculate direction to safe position and move
        const dirX = this.fleeSafePosition.x - this.gridX;
        const dirY = this.fleeSafePosition.y - this.gridY;
        
        // Normalize and move (direction only, speed applied in processMovement)
        const dist = Math.sqrt(dirX * dirX + dirY * dirY);
        if (dist > 0) {
            this.requestMove(Math.sign(dirX), Math.sign(dirY));
        }
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

    /**
     * Destroy queen
     */
    destroy(): void {
        super.destroy(); // This sets isActive = false and emits event
    }
}
