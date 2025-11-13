import { EventBus, GameEvents } from '../utils/eventBus';

/**
 * Player model - data only, no rendering logic.
 * Follows MVC pattern - this is the MODEL.
 */
export class Player {
    public x: number;
    public y: number;
    public health: number;
    public maxHealth: number;
    public speed: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 5;

        // Emit spawn event
        EventBus.emit(GameEvents.PLAYER_SPAWN, this.x, this.y);
    }

    /**
     * Move player to new position
     */
    moveTo(x: number, y: number): void {
        this.x = x;
        this.y = y;
        EventBus.emit(GameEvents.PLAYER_MOVE, this.x, this.y);
    }

    /**
     * Move player by delta
     */
    move(dx: number, dy: number): void {
        this.moveTo(this.x + dx, this.y + dy);
    }

    /**
     * Take damage
     */
    takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
        EventBus.emit(GameEvents.PLAYER_DAMAGE, amount, this.health);

        if (this.health <= 0) {
            EventBus.emit(GameEvents.PLAYER_DEATH);
        }
    }

    /**
     * Heal player
     */
    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
        EventBus.emit(GameEvents.PLAYER_HEAL, amount, this.health);
    }
}
