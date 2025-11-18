"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queen = void 0;
var GameObject_1 = require("./GameObject");
var PathfindingComponent_1 = require("./components/PathfindingComponent");
var HealthComponent_1 = require("./components/HealthComponent");
var CombatComponent_1 = require("./components/CombatComponent");
var eventBus_1 = require("../utils/eventBus");
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
 * MODEL layer - NO RENDERING CODE
 */
var Queen = /** @class */ (function (_super) {
    __extends(Queen, _super);
    function Queen(gridX, gridY, factionId) {
        var _this = _super.call(this, 'queen', gridX, gridY) || this;
        _this.playerControlled = true;
        _this.commandRadius = 15;
        _this.powers = new Map();
        _this.keybindMap = new Map();
        _this.factionId = factionId;
        // Initialize components
        _this.addComponent('Pathfinding', new PathfindingComponent_1.PathfindingComponent(1.5)); // Slower than ants
        _this.addComponent('Health', new HealthComponent_1.HealthComponent(200)); // Higher health than ants
        _this.addComponent('Combat', new CombatComponent_1.CombatComponent(15, 3.0, 800)); // Stronger combat
        // Initialize power system
        _this.initializePowers();
        // Setup keybind listeners
        _this.setupKeybinds();
        // Setup health listener for death
        _this.setupHealthListener();
        // Request camera follow
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.CAMERA_FOLLOW_ENTITY, _this.id);
        return _this;
    }
    /**
     * Initialize default powers
     */
    Queen.prototype.initializePowers = function () {
        var _this = this;
        var defaultPowers = [
            { name: 'fireball', cooldown: 3000, maxLevel: 5 },
            { name: 'lightning', cooldown: 4000, maxLevel: 5 },
            { name: 'heal', cooldown: 5000, maxLevel: 5 },
            { name: 'summon', cooldown: 10000, maxLevel: 3 },
            { name: 'boost', cooldown: 8000, maxLevel: 5 }
        ];
        defaultPowers.forEach(function (power) {
            _this.powers.set(power.name, {
                name: power.name,
                isUnlocked: false,
                level: 1,
                maxLevel: power.maxLevel,
                cooldown: power.cooldown,
                lastUsedTime: 0
            });
        });
        // Map keybinds to powers
        this.keybindMap.set('1', 'fireball');
        this.keybindMap.set('2', 'lightning');
        this.keybindMap.set('3', 'heal');
        this.keybindMap.set('4', 'summon');
        this.keybindMap.set('5', 'boost');
    };
    /**
     * Setup keybind listeners for power activation
     */
    Queen.prototype.setupKeybinds = function () {
        var _this = this;
        eventBus_1.EventBus.on(eventBus_1.GameEvents.INPUT_KEY_PRESS, function (key) {
            if (!_this.isActive || !_this.playerControlled)
                return;
            var powerName = _this.keybindMap.get(key);
            if (powerName) {
                _this.usePower(powerName);
            }
        });
    };
    /**
     * Setup health listener for death
     */
    Queen.prototype.setupHealthListener = function () {
        var _this = this;
        eventBus_1.EventBus.on('ENTITY_DIED', function (entityId) {
            if (entityId === _this.id) {
                // Queen died - emit game over event
                eventBus_1.EventBus.emit(eventBus_1.GameEvents.QUEEN_DEATH, _this.id, _this.factionId);
                _this.isActive = false;
            }
        });
    };
    /**
     * Use a queen power
     * @param powerName Name of power to use
     * @param targetX Optional target X coordinate
     * @param targetY Optional target Y coordinate
     * @returns True if power was used successfully
     */
    Queen.prototype.usePower = function (powerName, targetX, targetY) {
        var power = this.powers.get(powerName);
        if (!power || !power.isUnlocked)
            return false;
        // Check cooldown
        var currentTime = Date.now();
        if (currentTime - power.lastUsedTime < power.cooldown) {
            return false;
        }
        // Use power
        power.lastUsedTime = currentTime;
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.QUEEN_POWER_USED, this.id, powerName, targetX, targetY);
        return true;
    };
    /**
     * Unlock a power
     * @param powerName Name of power to unlock
     */
    Queen.prototype.unlockPower = function (powerName) {
        var power = this.powers.get(powerName);
        if (!power)
            return;
        if (!power.isUnlocked) {
            power.isUnlocked = true;
            eventBus_1.EventBus.emit(eventBus_1.GameEvents.QUEEN_POWER_UNLOCKED, this.id, powerName);
        }
    };
    /**
     * Upgrade a power level
     * @param powerName Name of power to upgrade
     */
    Queen.prototype.upgradePower = function (powerName) {
        var power = this.powers.get(powerName);
        if (!power || !power.isUnlocked)
            return;
        if (power.level < power.maxLevel) {
            power.level++;
            eventBus_1.EventBus.emit(eventBus_1.GameEvents.QUEEN_POWER_UPGRADED, this.id, powerName, power.level);
        }
    };
    /**
     * Command nearby ants
     * @param radius Command radius
     * @param command Command type
     * @returns Number of ants commanded
     */
    Queen.prototype.commandAnts = function (radius, command) {
        if (!command || radius < 0)
            return 0;
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.QUEEN_COMMAND_ISSUED, this.id, command, radius);
        // In real implementation, would query nearby ants and issue commands
        // For now, return 0 (will be implemented when we have ant querying system)
        return 0;
    };
    /**
     * Interact with queen (for menus, upgrades, etc.)
     */
    Queen.prototype.interact = function () {
        eventBus_1.EventBus.emit(eventBus_1.GameEvents.QUEEN_INTERACTED, this.id);
    };
    /**
     * Get command radius
     */
    Queen.prototype.getCommandRadius = function () {
        return this.commandRadius;
    };
    /**
     * Set command radius
     * @param radius New command radius (clamped to 0+)
     */
    Queen.prototype.setCommandRadius = function (radius) {
        this.commandRadius = Math.max(0, radius);
    };
    /**
     * Get faction ID
     */
    Queen.prototype.getFactionId = function () {
        return this.factionId;
    };
    /**
     * Check if entity is enemy
     * @param other Other entity
     */
    Queen.prototype.isEnemy = function (other) {
        if (other.type !== 'queen' && other.type !== 'ant' && other.type !== 'boss') {
            return false;
        }
        // Type assertion to access factionId
        var otherWithFaction = other;
        return otherWithFaction.factionId !== this.factionId;
    };
    /**
     * Check if player controlled
     */
    Queen.prototype.isPlayerControlled = function () {
        return this.playerControlled;
    };
    /**
     * Set player control
     * @param controlled Whether player controlled
     */
    Queen.prototype.setPlayerControlled = function (controlled) {
        this.playerControlled = controlled;
    };
    /**
     * Get all powers
     */
    Queen.prototype.getPowers = function () {
        return this.powers;
    };
    /**
     * Get specific power
     * @param powerName Name of power
     */
    Queen.prototype.getPower = function (powerName) {
        return this.powers.get(powerName);
    };
    /**
     * Update queen (components update automatically via GameObject)
     * @param deltaTime Time since last update in ms
     */
    Queen.prototype.update = function (deltaTime) {
        if (!this.isActive)
            return;
        _super.prototype.update.call(this, deltaTime);
    };
    /**
     * Destroy queen
     */
    Queen.prototype.destroy = function () {
        _super.prototype.destroy.call(this); // This sets isActive = false and emits event
    };
    return Queen;
}(GameObject_1.GameObject));
exports.Queen = Queen;
