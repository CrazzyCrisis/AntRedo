import { GameObject } from './GameObject';
import { PathfindingComponent } from './components/PathfindingComponent';
import { HealthComponent } from './components/HealthComponent';
import { CombatComponent } from './components/CombatComponent';
import { EventBus, GameEvents } from '../utils/eventBus';
import { InputManager } from '../managers/InputManager';
import { ENTITY_CONFIG } from '../config/entityConfig';

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
 * Components: Pathfinding, Health, Combat (3 total)
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

    constructor(gridX: number, gridY: number, factionId: string) {
        super('queen', gridX, gridY);
        this.factionId = factionId;
        this.entityClass = 'queen'; // Set entity class for tile speed modifiers
        
        // Set movement speed (tiles per second)
        this.moveSpeed = ENTITY_CONFIG.QUEEN.speed; // Queen moves at 4 tiles/second

        // Initialize components
        this.addComponent('Pathfinding', new PathfindingComponent(1.5)); // Slower than ants
        this.addComponent('Health', new HealthComponent(ENTITY_CONFIG.QUEEN.health)); // Higher health than ants
        this.addComponent('Combat', new CombatComponent(
            ENTITY_CONFIG.QUEEN.attackDamage,
            ENTITY_CONFIG.QUEEN.attackRange, 
            ENTITY_CONFIG.QUEEN.attackGCD)); // Stronger combat

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

        // Use power
        power.lastUsedTime = currentTime;
        EventBus.emit(GameEvents.QUEEN_POWER_USED, this.id, powerName, targetX, targetY);

        return true;
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
        if (!this.isActive || !this.playerControlled) return;

        // Handle continuous movement based on held keys
        const inputManager = InputManager.getInstance();
        let moveX = 0;
        let moveY = 0;

        // Check for held movement keys
        if (inputManager.isActionPressed('moveUp')) {
            moveY = -1 * this.getSpeed();
        }
        if (inputManager.isActionPressed('moveDown')) {
            moveY = 1 * this.getSpeed();
        }
        if (inputManager.isActionPressed('moveLeft')) {
            moveX = -1 * this.getSpeed();
        }
        if (inputManager.isActionPressed('moveRight')) {
            moveX = 1 * this.getSpeed();
        }

        // Request movement (processed by GameObject with speed/deltaTime)
        if (moveX !== 0 || moveY !== 0) {
            this.requestMove(moveX, moveY);
        }

        super.update(deltaTime);
    }

    /**
     * Destroy queen
     */
    destroy(): void {
        super.destroy(); // This sets isActive = false and emits event
    }
}
