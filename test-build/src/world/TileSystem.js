"use strict";
/**
 * Tile System - Core tile types, properties, and Tile class
 * Provides foundation for procedural generation and A* pathfinding
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tile = exports.TILE_SIZE = exports.TILE_PROPERTIES = exports.TileType = void 0;
var devRoomConfig_1 = require("../config/devRoomConfig");
/**
 * Enum defining all available tile types
 * Maps to sprites in assets/images/16x16 Tiles/
 */
var TileType;
(function (TileType) {
    TileType[TileType["GRASS"] = 0] = "GRASS";
    TileType[TileType["DIRT"] = 1] = "DIRT";
    TileType[TileType["STONE"] = 2] = "STONE";
    TileType[TileType["SAND"] = 3] = "SAND";
    TileType[TileType["SAND_DARK"] = 4] = "SAND_DARK";
    TileType[TileType["WATER"] = 5] = "WATER";
    TileType[TileType["FARMLAND"] = 6] = "FARMLAND";
    TileType[TileType["MOSS"] = 7] = "MOSS";
    TileType[TileType["PEBBLE_1"] = 8] = "PEBBLE_1";
    TileType[TileType["PEBBLE_2"] = 9] = "PEBBLE_2";
    TileType[TileType["PEBBLE_3"] = 10] = "PEBBLE_3";
    TileType[TileType["CAVE_FLOOR"] = 11] = "CAVE_FLOOR";
    TileType[TileType["CAVE_WALL"] = 12] = "CAVE_WALL";
    TileType[TileType["CAVE_DIRT"] = 13] = "CAVE_DIRT";
    TileType[TileType["CAVE_DARK"] = 14] = "CAVE_DARK";
    TileType[TileType["CAVE_WATER"] = 15] = "CAVE_WATER";
    TileType[TileType["ANTHILL"] = 16] = "ANTHILL";
})(TileType || (exports.TileType = TileType = {}));
/**
 * Tile properties lookup table
 * Defines gameplay characteristics for each tile type
 */
exports.TILE_PROPERTIES = (_a = {},
    _a[TileType.GRASS] = { walkable: true, movementCost: 1.0, spriteIndex: 0 },
    _a[TileType.DIRT] = { walkable: true, movementCost: 1.1, spriteIndex: 1 },
    _a[TileType.STONE] = { walkable: true, movementCost: 1.3, spriteIndex: 2 },
    _a[TileType.SAND] = { walkable: true, movementCost: 1.5, spriteIndex: 3 },
    _a[TileType.SAND_DARK] = { walkable: true, movementCost: 1.5, spriteIndex: 4 },
    _a[TileType.WATER] = { walkable: false, movementCost: Infinity, spriteIndex: 5 },
    _a[TileType.FARMLAND] = { walkable: true, movementCost: 1.2, spriteIndex: 6 },
    _a[TileType.MOSS] = { walkable: true, movementCost: 1.1, spriteIndex: 7 },
    _a[TileType.PEBBLE_1] = { walkable: true, movementCost: 1.0, spriteIndex: 8 },
    _a[TileType.PEBBLE_2] = { walkable: true, movementCost: 1.0, spriteIndex: 9 },
    _a[TileType.PEBBLE_3] = { walkable: true, movementCost: 1.0, spriteIndex: 10 },
    _a[TileType.CAVE_FLOOR] = { walkable: true, movementCost: 1.0, spriteIndex: 11 },
    _a[TileType.CAVE_WALL] = { walkable: false, movementCost: Infinity, spriteIndex: 12 },
    _a[TileType.CAVE_DIRT] = { walkable: true, movementCost: 1.2, spriteIndex: 13 },
    _a[TileType.CAVE_DARK] = { walkable: false, movementCost: Infinity, spriteIndex: 14 },
    _a[TileType.CAVE_WATER] = { walkable: false, movementCost: Infinity, spriteIndex: 15 },
    _a[TileType.ANTHILL] = { walkable: false, movementCost: Infinity, spriteIndex: 16 },
    _a);
/**
 * Tile size constant (from config)
 */
exports.TILE_SIZE = devRoomConfig_1.DEV_ROOM_CONFIG.TILES.SIZE;
/**
 * Tile class - Represents a single tile in the world grid
 * Contains position, type, and provides utility methods for pathfinding
 */
var Tile = /** @class */ (function () {
    function Tile(col, row, type) {
        this.col = col;
        this.row = row;
        this.type = type;
        // Load properties from lookup table
        var props = exports.TILE_PROPERTIES[type];
        this.walkable = props.walkable;
        this.movementCost = props.movementCost;
        this.spriteIndex = props.spriteIndex;
    }
    /**
     * Get world position (top-left corner of tile)
     */
    Tile.prototype.getWorldPosition = function () {
        return {
            x: this.col * exports.TILE_SIZE,
            y: this.row * exports.TILE_SIZE
        };
    };
    /**
     * Get world center position (center of tile)
     */
    Tile.prototype.getWorldCenter = function () {
        return {
            x: this.col * exports.TILE_SIZE + exports.TILE_SIZE / 2,
            y: this.row * exports.TILE_SIZE + exports.TILE_SIZE / 2
        };
    };
    /**
     * Get 4-directional neighbor positions (up, down, left, right)
     */
    Tile.prototype.getNeighbor4Positions = function () {
        return [
            { col: this.col, row: this.row - 1 }, // Up
            { col: this.col, row: this.row + 1 }, // Down
            { col: this.col - 1, row: this.row }, // Left
            { col: this.col + 1, row: this.row } // Right
        ];
    };
    /**
     * Get 8-directional neighbor positions (including diagonals)
     */
    Tile.prototype.getNeighbor8Positions = function () {
        return [
            { col: this.col, row: this.row - 1 }, // Up
            { col: this.col, row: this.row + 1 }, // Down
            { col: this.col - 1, row: this.row }, // Left
            { col: this.col + 1, row: this.row }, // Right
            { col: this.col - 1, row: this.row - 1 }, // Up-Left
            { col: this.col + 1, row: this.row - 1 }, // Up-Right
            { col: this.col - 1, row: this.row + 1 }, // Down-Left
            { col: this.col + 1, row: this.row + 1 } // Down-Right
        ];
    };
    /**
     * Calculate Manhattan distance to another grid position
     */
    Tile.prototype.manhattanDistanceTo = function (col, row) {
        return Math.abs(this.col - col) + Math.abs(this.row - row);
    };
    /**
     * Calculate Euclidean distance to another grid position
     */
    Tile.prototype.euclideanDistanceTo = function (col, row) {
        var dx = this.col - col;
        var dy = this.row - row;
        return Math.sqrt(dx * dx + dy * dy);
    };
    /**
     * Check if tile is a specific type
     */
    Tile.prototype.isType = function (type) {
        return this.type === type;
    };
    /**
     * Check if tile is one of multiple types
     */
    Tile.prototype.isOneOf = function (types) {
        return types.includes(this.type);
    };
    /**
     * Convert to TileData format for storage
     */
    Tile.prototype.toData = function () {
        return {
            type: this.type,
            walkable: this.walkable,
            movementCost: this.movementCost,
            spriteIndex: this.spriteIndex
        };
    };
    /**
     * Create Tile from TileData
     */
    Tile.fromData = function (col, row, data) {
        var tile = new Tile(col, row, data.type);
        return tile;
    };
    return Tile;
}());
exports.Tile = Tile;
