"use strict";
/**
 * GameObject - Base Entity Class (MODEL)
 * Pure data class with component system
 * No rendering code - only data and EventBus emissions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameObject = void 0;
var eventBus_1 = require("../utils/eventBus");
var helpers_1 = require("../utils/helpers");
var devRoomConfig_1 = require("../config/devRoomConfig");
var GameObject = /** @class */ (function () {
    /**
     * Create a new GameObject
     * @param type - Entity type identifier
     * @param gridX - Grid column position
     * @param gridY - Grid row position
     * @param collisionSize - Size of collision box (default: TILE_SIZE from config)
     */
    function GameObject(type, gridX, gridY, collisionSize) {
        if (collisionSize === void 0) { collisionSize = devRoomConfig_1.DEV_ROOM_CONFIG.TILES.SIZE; }
        // World position (in pixels)
        this.worldX = 0;
        this.worldY = 0;
        this.id = this.generateId(type);
        this.type = type;
        this.gridX = gridX;
        this.gridY = gridY;
        this.isActive = true;
        this.collisionWidth = collisionSize;
        this.collisionHeight = collisionSize;
        this.components = new Map();
        // Calculate world position from grid position
        this.updateWorldPosition();
    }
    /**
     * Generate unique ID for this entity
     * Format: type_timestamp_random
     */
    GameObject.prototype.generateId = function (type) {
        return "".concat(type, "_").concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    /**
     * Update world position based on grid position
     */
    GameObject.prototype.updateWorldPosition = function () {
        this.worldX = this.gridX * devRoomConfig_1.DEV_ROOM_CONFIG.TILES.SIZE;
        this.worldY = this.gridY * devRoomConfig_1.DEV_ROOM_CONFIG.TILES.SIZE;
    };
    /**
     * Move entity to new grid position
     * Emits ENTITY_MOVED event if position changes
     */
    GameObject.prototype.moveTo = function (gridX, gridY) {
        // Check if position actually changed
        if (this.gridX === gridX && this.gridY === gridY) {
            return;
        }
        this.gridX = gridX;
        this.gridY = gridY;
        this.updateWorldPosition();
        // Emit movement event
        eventBus_1.EventBus.emit('ENTITY_MOVED', this.id, gridX, gridY);
    };
    /**
     * Add a component to this entity
     * @param name - Component identifier
     * @param component - Component instance
     */
    GameObject.prototype.addComponent = function (name, component) {
        this.components.set(name, component);
        component.onAttach(this);
    };
    /**
     * Get a component by name
     * @param name - Component identifier
     * @returns Component instance or undefined
     */
    GameObject.prototype.getComponent = function (name) {
        return this.components.get(name);
    };
    /**
     * Check if entity has a component
     * @param name - Component identifier
     */
    GameObject.prototype.hasComponent = function (name) {
        return this.components.has(name);
    };
    /**
     * Remove a component from this entity
     * @param name - Component identifier
     */
    GameObject.prototype.removeComponent = function (name) {
        var component = this.components.get(name);
        if (component) {
            component.onDetach();
            this.components.delete(name);
        }
    };
    /**
     * Check collision with another GameObject
     * Uses rectangle collision from helpers
     * @param other - Other GameObject to check against
     * @returns true if colliding
     */
    GameObject.prototype.isCollidingWith = function (other) {
        return (0, helpers_1.rectIntersect)(this.worldX, this.worldY, this.collisionWidth, this.collisionHeight, other.worldX, other.worldY, other.collisionWidth, other.collisionHeight);
    };
    /**
     * Update this entity and all its components
     * @param deltaTime - Time elapsed since last update (milliseconds)
     */
    GameObject.prototype.update = function (deltaTime) {
        if (!this.isActive) {
            return;
        }
        // Update all components
        this.components.forEach(function (component) {
            component.update(deltaTime);
        });
    };
    /**
     * Destroy this entity
     * Marks as inactive, removes all components, emits destruction event
     */
    GameObject.prototype.destroy = function () {
        var _this = this;
        if (!this.isActive) {
            return; // Already destroyed
        }
        this.isActive = false;
        // Remove all components
        var componentNames = Array.from(this.components.keys());
        componentNames.forEach(function (name) {
            _this.removeComponent(name);
        });
        // Emit destruction event
        eventBus_1.EventBus.emit('ENTITY_DESTROYED', this.id, this.type);
    };
    return GameObject;
}());
exports.GameObject = GameObject;
