/**
 * CommandManager - Queen Command System (CONTROLLER)
 * Singleton manager for issuing commands from queens to ants
 * Handles command routing, targeting, and autonomous mode overrides
 */

import {
    Ant,
    Queen,
    EventBus,
    distance
} from '../imports/managerImports';
import { EntityManager } from './EntityManager';

/**
 * Command types queens can issue to ants
 */
export enum CommandType {
    MOVE_TO = 'MOVE_TO',
    ATTACK_TARGET = 'ATTACK_TARGET',
    GATHER_RESOURCE = 'GATHER_RESOURCE',
    BUILD_BUILDING = 'BUILD_BUILDING',
    FOLLOW_QUEEN = 'FOLLOW_QUEEN',
    CHANGE_STATE = 'CHANGE_STATE'
}

/**
 * Command structure
 */
export interface Command {
    type: CommandType;
    targetId?: string;
    targetPosition?: { x: number; y: number };
    targetState?: string;
}

/**
 * CommandManager manages queen-to-ant commands
 */
export class CommandManager {
    private static instance: CommandManager;
    private activeCommands: Map<string, Command>; // antId → Command

    private constructor() {
        this.activeCommands = new Map();
        this.setupEventListeners();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): CommandManager {
        if (!CommandManager.instance) {
            CommandManager.instance = new CommandManager();
        }
        return CommandManager.instance;
    }

    /**
     * Setup EventBus listeners
     */
    private setupEventListeners(): void {
        // Listen for command completion to restore autonomous mode
        EventBus.on('ANT_TASK_COMPLETED', (antId: string) => {
            this.onTaskCompleted(antId);
        });

        // Listen for ant death to cleanup commands
        EventBus.on('ANT_DIED', (antId: string) => {
            this.cancelCommand(antId);
        });

        // Listen for resource depletion
        EventBus.on('RESOURCE_DEPLETED', (resourceId: string) => {
            this.onResourceDepleted(resourceId);
        });

        // Listen for target death
        EventBus.on('ENTITY_DESTROYED', (entityId: string) => {
            this.onEntityDestroyed(entityId);
        });
    }

    /**
     * Issue a command from queen to ants in radius
     * @param queenId - Queen ID issuing command
     * @param commandType - Type of command
     * @param radius - Radius to select ants
     * @param targetId - Optional target entity ID
     * @param targetPosition - Optional target position
     * @param targetState - Optional target state for CHANGE_STATE
     * @returns Number of ants commanded
     */
    public issueCommand(
        queenId: string,
        commandType: CommandType,
        radius: number,
        targetId?: string,
        targetPosition?: { x: number; y: number },
        targetState?: string
    ): number {
        const queen = EntityManager.getInstance().getEntity(queenId) as Queen;
        if (!queen) return 0;

        // Get ants in radius
        const ants = this.getAntsInRadius(queen.gridX, queen.gridY, radius);

        // Issue command to each ant
        for (const ant of ants) {
            this.commandAnt(ant, commandType, targetId, targetPosition, targetState);
        }

        EventBus.emit('QUEEN_COMMAND_ISSUED', queenId, commandType, ants.length);
        return ants.length;
    }

    /**
     * Command a specific ant
     * @param ant - Ant to command
     * @param commandType - Command type
     * @param targetId - Optional target ID
     * @param targetPosition - Optional position
     * @param targetState - Optional state
     */
    private commandAnt(
        ant: Ant,
        commandType: CommandType,
        targetId?: string,
        targetPosition?: { x: number; y: number },
        targetState?: string
    ): void {
        // Disable autonomous mode
        const aiBehavior = ant.getComponent('AIBehaviorComponent');
        if (aiBehavior) {
            (aiBehavior as any).isAutonomous = false;
        }

        // Store command
        const command: Command = {
            type: commandType,
            targetId,
            targetPosition,
            targetState
        };
        this.activeCommands.set(ant.id, command);

        // Execute command
        switch (commandType) {
            case CommandType.MOVE_TO:
                if (targetPosition) {
                    EventBus.emit('ANT_COMMANDED_MOVE', ant.id, targetPosition.x, targetPosition.y);
                }
                break;

            case CommandType.ATTACK_TARGET:
                if (targetId) {
                    EventBus.emit('ANT_COMMANDED_ATTACK', ant.id, targetId);
                }
                break;

            case CommandType.GATHER_RESOURCE:
                if (targetId) {
                    EventBus.emit('ANT_COMMANDED_GATHER', ant.id, targetId);
                }
                break;

            case CommandType.BUILD_BUILDING:
                if (targetId) {
                    EventBus.emit('ANT_COMMANDED_BUILD', ant.id, targetId);
                }
                break;

            case CommandType.FOLLOW_QUEEN:
                if (targetId) {
                    EventBus.emit('ANT_COMMANDED_FOLLOW', ant.id, targetId);
                }
                break;

            case CommandType.CHANGE_STATE:
                if (targetState) {
                    EventBus.emit('ANT_COMMANDED_CHANGE_STATE', ant.id, targetState);
                }
                break;
        }

        EventBus.emit('ANT_COMMANDED', ant.id, commandType);
    }

    /**
     * Get all ants within radius of position
     * @param gridX - Center X position
     * @param gridY - Center Y position
     * @param radius - Search radius
     * @returns Array of ants
     */
    public getAntsInRadius(gridX: number, gridY: number, radius: number): Ant[] {
        const entityManager = EntityManager.getInstance();
        const allEntities = entityManager.getAllEntities();
        const ants: Ant[] = [];

        for (const entity of allEntities) {
            if (!(entity instanceof Ant)) continue;
            if (!entity.isActive) continue;

            const dist = distance(gridX, gridY, entity.gridX, entity.gridY);
            if (dist <= radius) {
                ants.push(entity);
            }
        }

        return ants;
    }

    /**
     * Cancel command for an ant and restore autonomous mode
     * @param antId - Ant ID
     */
    public cancelCommand(antId: string): void {
        const command = this.activeCommands.get(antId);
        if (!command) return;

        this.activeCommands.delete(antId);

        // Restore autonomous mode
        const ant = EntityManager.getInstance().getEntity(antId) as Ant;
        if (ant) {
            const aiBehavior = ant.getComponent('AIBehaviorComponent');
            if (aiBehavior) {
                (aiBehavior as any).isAutonomous = true;
            }
        }

        EventBus.emit('ANT_COMMAND_CANCELLED', antId);
    }

    /**
     * Handle ant task completion - restore autonomous mode
     * @param antId - Ant ID
     */
    private onTaskCompleted(antId: string): void {
        this.cancelCommand(antId);
    }

    /**
     * Handle resource depletion - cancel gather commands for that resource
     * @param resourceId - Resource ID
     */
    private onResourceDepleted(resourceId: string): void {
        for (const [antId, command] of this.activeCommands.entries()) {
            if (command.type === CommandType.GATHER_RESOURCE && command.targetId === resourceId) {
                this.cancelCommand(antId);
            }
        }
    }

    /**
     * Handle entity destruction - cancel commands targeting it
     * @param entityId - Entity ID
     */
    private onEntityDestroyed(entityId: string): void {
        for (const [antId, command] of this.activeCommands.entries()) {
            if (command.targetId === entityId) {
                this.cancelCommand(antId);
            }
        }
    }

    /**
     * Get active command for an ant
     * @param antId - Ant ID
     * @returns Command or undefined
     */
    public getCommand(antId: string): Command | undefined {
        return this.activeCommands.get(antId);
    }

    /**
     * Check if ant has active command
     * @param antId - Ant ID
     * @returns True if ant is commanded
     */
    public hasCommand(antId: string): boolean {
        return this.activeCommands.has(antId);
    }

    /**
     * Clear all commands (for testing)
     */
    public clear(): void {
        // Restore autonomous mode for all commanded ants
        for (const antId of this.activeCommands.keys()) {
            const ant = EntityManager.getInstance().getEntity(antId) as Ant;
            if (ant) {
                const aiBehavior = ant.getComponent('AIBehaviorComponent');
                if (aiBehavior) {
                    (aiBehavior as any).isAutonomous = true;
                }
            }
        }

        this.activeCommands.clear();
    }

    /**
     * Reinitialize EventBus listeners (for testing after EventBus.clear())
     */
    public reinitializeListeners(): void {
        this.setupEventListeners();
    }
}
