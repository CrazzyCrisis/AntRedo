"use strict";
/**
 * PathfindingComponent - Path Following and Navigation (MODEL)
 * Reuses existing A* Pathfinder for optimal path calculation
 * Handles movement along paths using lerp for smooth transitions
 */
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
exports.PathfindingComponent = void 0;
var BaseComponent_1 = require("./BaseComponent");
var eventBus_1 = require("../../utils/eventBus");
var Pathfinder_1 = require("../../world/Pathfinder");
var helpers_1 = require("../../utils/helpers");
/**
 * PathfindingComponent
 * Uses A* pathfinding to navigate entities through the world
 */
var PathfindingComponent = /** @class */ (function (_super) {
    __extends(PathfindingComponent, _super);
    /**
     * Create a new PathfindingComponent
     * @param speed - Movement speed in tiles per second
     */
    function PathfindingComponent(speed) {
        var _this = _super.call(this) || this;
        _this.currentPath = [];
        _this.pathIndex = 0;
        _this.moving = false;
        // Smooth movement tracking
        _this.currentProgress = 0; // 0.0 to 1.0 progress to next node
        _this.fromCol = 0;
        _this.fromRow = 0;
        _this.toCol = 0;
        _this.toRow = 0;
        _this.pathfinder = new Pathfinder_1.Pathfinder();
        _this.speed = speed;
        return _this;
    }
    /**
     * Hook: Initialize movement tracking after attach
     */
    PathfindingComponent.prototype.onAttached = function () {
        this.fromCol = this.owner.gridX;
        this.fromRow = this.owner.gridY;
    };
    /**
     * Lifecycle: Update movement along path
     */
    PathfindingComponent.prototype.update = function (deltaTime) {
        if (!this.moving || this.currentPath.length === 0) {
            return;
        }
        this.followPath(deltaTime);
    };
    /**
     * Find path to target position
     * @param targetCol - Target grid column
     * @param targetRow - Target grid row
     * @param grid - World grid for pathfinding
     */
    PathfindingComponent.prototype.findPath = function (targetCol, targetRow, grid) {
        if (!this.owner) {
            return;
        }
        // Check if already at target
        if (this.owner.gridX === targetCol && this.owner.gridY === targetRow) {
            this.clearPath();
            return;
        }
        // Validate target is in bounds and walkable
        if (!grid || grid.length === 0 || grid[0].length === 0) {
            eventBus_1.EventBus.emit('PATH_FAILED', this.owner.id, 'Invalid grid');
            return;
        }
        var rows = grid.length;
        var cols = grid[0].length;
        if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= cols) {
            eventBus_1.EventBus.emit('PATH_FAILED', this.owner.id, 'Out of bounds');
            return;
        }
        if (!grid[targetRow][targetCol].walkable) {
            eventBus_1.EventBus.emit('PATH_FAILED', this.owner.id, 'Target not walkable');
            return;
        }
        // Use A* pathfinder
        var path = this.pathfinder.findPath(this.owner.gridX, this.owner.gridY, targetCol, targetRow, grid);
        if (!path || path.length === 0) {
            this.clearPath();
            eventBus_1.EventBus.emit('PATH_FAILED', this.owner.id, 'No path found');
            return;
        }
        // Store path and start following
        this.currentPath = path;
        this.pathIndex = 0;
        this.currentProgress = 0;
        this.moving = true;
        // Skip first node if it's our current position
        if (path.length > 0 && path[0].col === this.owner.gridX && path[0].row === this.owner.gridY) {
            this.pathIndex = 1;
        }
        // Initialize movement from current position to next node
        this.fromCol = this.owner.gridX;
        this.fromRow = this.owner.gridY;
        if (this.pathIndex < path.length) {
            this.toCol = path[this.pathIndex].col;
            this.toRow = path[this.pathIndex].row;
        }
        else {
            // Path only had start node - complete immediately
            this.completePathFollowing();
            return;
        }
        eventBus_1.EventBus.emit('PATH_FOUND', this.owner.id, path.length);
    };
    /**
     * Follow the current path
     * @param deltaTime - Time elapsed in milliseconds
     */
    PathfindingComponent.prototype.followPath = function (deltaTime) {
        if (!this.owner || this.currentPath.length === 0) {
            return;
        }
        // Calculate movement progress (convert ms to seconds, multiply by tiles/second)
        var progressDelta = (deltaTime / 1000) * this.speed;
        this.currentProgress += progressDelta;
        // Check if reached next node
        if (this.currentProgress >= 1.0) {
            this.currentProgress = 0;
            this.pathIndex++;
            // Check if path complete
            if (this.pathIndex >= this.currentPath.length) {
                this.completePathFollowing();
                return;
            }
            // Move to next segment
            this.fromCol = this.owner.gridX;
            this.fromRow = this.owner.gridY;
            this.toCol = this.currentPath[this.pathIndex].col;
            this.toRow = this.currentPath[this.pathIndex].row;
        }
        // Lerp between current and next node
        var newCol = Math.round((0, helpers_1.lerp)(this.fromCol, this.toCol, this.currentProgress));
        var newRow = Math.round((0, helpers_1.lerp)(this.fromRow, this.toRow, this.currentProgress));
        // Update owner position if changed
        if (newCol !== this.owner.gridX || newRow !== this.owner.gridY) {
            this.owner.moveTo(newCol, newRow);
        }
    };
    /**
     * Complete path following and cleanup
     */
    PathfindingComponent.prototype.completePathFollowing = function () {
        if (!this.owner) {
            return;
        }
        // Snap to final position
        var finalNode = this.currentPath[this.currentPath.length - 1];
        this.owner.moveTo(finalNode.col, finalNode.row);
        // Clear path state
        this.clearPath();
        // Emit completion event
        eventBus_1.EventBus.emit('PATH_COMPLETE', this.owner.id);
    };
    /**
     * Check if path is still valid (tiles didn't become unwalkable)
     * @param grid - Current world grid
     */
    PathfindingComponent.prototype.checkPathValid = function (grid) {
        if (!this.hasPath()) {
            return true;
        }
        // Check if any node in path became unwalkable
        for (var _i = 0, _a = this.currentPath; _i < _a.length; _i++) {
            var node = _a[_i];
            if (node.row < 0 || node.row >= grid.length) {
                return false;
            }
            if (node.col < 0 || node.col >= grid[0].length) {
                return false;
            }
            if (!grid[node.row][node.col].walkable) {
                eventBus_1.EventBus.emit('PATH_BLOCKED', this.owner.id);
                this.clearPath();
                return false;
            }
        }
        return true;
    };
    /**
     * Clear current path and stop movement
     */
    PathfindingComponent.prototype.clearPath = function () {
        this.currentPath = [];
        this.pathIndex = 0;
        this.currentProgress = 0;
        this.moving = false;
    };
    /**
     * Check if component has an active path
     */
    PathfindingComponent.prototype.hasPath = function () {
        return this.currentPath.length > 0;
    };
    /**
     * Check if entity is currently moving
     */
    PathfindingComponent.prototype.isMoving = function () {
        return this.moving;
    };
    /**
     * Get next node in path
     */
    PathfindingComponent.prototype.getNextNode = function () {
        if (!this.hasPath() || this.pathIndex >= this.currentPath.length) {
            return null;
        }
        return this.currentPath[this.pathIndex];
    };
    /**
     * Get movement speed
     */
    PathfindingComponent.prototype.getSpeed = function () {
        return this.speed;
    };
    /**
     * Set movement speed
     * @param speed - New speed in tiles per second
     */
    PathfindingComponent.prototype.setSpeed = function (speed) {
        this.speed = speed;
    };
    /**
     * Enable/disable diagonal movement
     * @param allow - Whether to allow diagonal paths
     */
    PathfindingComponent.prototype.setAllowDiagonal = function (allow) {
        this.pathfinder.setAllowDiagonal(allow);
    };
    return PathfindingComponent;
}(BaseComponent_1.BaseComponent));
exports.PathfindingComponent = PathfindingComponent;
