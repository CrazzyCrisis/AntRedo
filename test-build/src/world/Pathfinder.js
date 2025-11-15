"use strict";
/**
 * A* Pathfinding System
 * Finds optimal paths through tile-based worlds with weighted movement costs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pathfinder = void 0;
/**
 * Pathfinder - A* implementation for tile-based pathfinding
 */
var Pathfinder = /** @class */ (function () {
    function Pathfinder() {
        this.allowDiagonal = true;
    }
    /**
     * Enable or disable diagonal movement
     */
    Pathfinder.prototype.setAllowDiagonal = function (allow) {
        this.allowDiagonal = allow;
    };
    /**
     * Find path from start to goal
     * Returns array of PathNodes, or null if no path exists
     */
    Pathfinder.prototype.findPath = function (startCol, startRow, goalCol, goalRow, grid) {
        var result = this.findPathWithCost(startCol, startRow, goalCol, goalRow, grid);
        return result ? result.path : null;
    };
    /**
     * Find path with cost information
     */
    Pathfinder.prototype.findPathWithCost = function (startCol, startRow, goalCol, goalRow, grid) {
        // Validate grid
        if (!grid || grid.length === 0 || grid[0].length === 0) {
            return null;
        }
        var rows = grid.length;
        var cols = grid[0].length;
        // Validate positions
        if (!this.isInBounds(startCol, startRow, cols, rows) ||
            !this.isInBounds(goalCol, goalRow, cols, rows)) {
            return null;
        }
        // Check if start/goal are walkable
        if (!grid[startRow][startCol].walkable || !grid[goalRow][goalCol].walkable) {
            return null;
        }
        // If start equals goal
        if (startCol === goalCol && startRow === goalRow) {
            return {
                path: [{ col: startCol, row: startRow }],
                cost: 0
            };
        }
        // Initialize A* structures
        var openSet = [];
        var closedSet = new Set();
        var startNode = {
            col: startCol,
            row: startRow,
            g: 0,
            h: this.heuristic(startCol, startRow, goalCol, goalRow),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);
        while (openSet.length > 0) {
            // Get node with lowest f score
            var currentIndex = 0;
            for (var i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[currentIndex].f) {
                    currentIndex = i;
                }
            }
            var current = openSet[currentIndex];
            // Check if reached goal
            if (current.col === goalCol && current.row === goalRow) {
                return this.reconstructPath(current);
            }
            // Move current from open to closed
            openSet.splice(currentIndex, 1);
            closedSet.add(this.nodeKey(current.col, current.row));
            // Check neighbors
            var neighbors = this.getNeighbors(current.col, current.row, cols, rows);
            var _loop_1 = function (neighbor) {
                var col = neighbor.col, row = neighbor.row, isDiagonal = neighbor.isDiagonal;
                // Skip if in closed set
                if (closedSet.has(this_1.nodeKey(col, row))) {
                    return "continue";
                }
                // Skip if not walkable
                if (!grid[row][col].walkable) {
                    return "continue";
                }
                // For diagonal moves, check if adjacent cardinal tiles are walkable (no corner cutting)
                if (isDiagonal) {
                    var dx = col - current.col;
                    var dy = row - current.row;
                    var horizontal = grid[current.row][current.col + dx];
                    var vertical = grid[current.row + dy][current.col];
                    // Can't move diagonally if both adjacent cardinals are blocked
                    if (!horizontal.walkable && !vertical.walkable) {
                        return "continue";
                    }
                }
                // Calculate movement cost
                var tileCost = grid[row][col].movementCost;
                var movementCost = isDiagonal ? Math.sqrt(2) * tileCost : tileCost;
                var tentativeG = current.g + movementCost;
                // Check if this path to neighbor is better
                var neighborNode = openSet.find(function (n) { return n.col === col && n.row === row; });
                if (!neighborNode) {
                    // New node
                    neighborNode = {
                        col: col,
                        row: row,
                        g: tentativeG,
                        h: this_1.heuristic(col, row, goalCol, goalRow),
                        f: 0,
                        parent: current
                    };
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openSet.push(neighborNode);
                }
                else if (tentativeG < neighborNode.g) {
                    // Better path found
                    neighborNode.g = tentativeG;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    neighborNode.parent = current;
                }
            };
            var this_1 = this;
            for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
                var neighbor = neighbors_1[_i];
                _loop_1(neighbor);
            }
        }
        // No path found
        return null;
    };
    /**
     * Get neighbors for current position
     */
    Pathfinder.prototype.getNeighbors = function (col, row, maxCols, maxRows) {
        var neighbors = [];
        // Cardinal directions
        var cardinals = [
            { col: col, row: row - 1, isDiagonal: false }, // Up
            { col: col, row: row + 1, isDiagonal: false }, // Down
            { col: col - 1, row: row, isDiagonal: false }, // Left
            { col: col + 1, row: row, isDiagonal: false } // Right
        ];
        for (var _i = 0, cardinals_1 = cardinals; _i < cardinals_1.length; _i++) {
            var n = cardinals_1[_i];
            if (this.isInBounds(n.col, n.row, maxCols, maxRows)) {
                neighbors.push(n);
            }
        }
        // Diagonal directions (if allowed)
        if (this.allowDiagonal) {
            var diagonals = [
                { col: col - 1, row: row - 1, isDiagonal: true }, // Up-Left
                { col: col + 1, row: row - 1, isDiagonal: true }, // Up-Right
                { col: col - 1, row: row + 1, isDiagonal: true }, // Down-Left
                { col: col + 1, row: row + 1, isDiagonal: true } // Down-Right
            ];
            for (var _a = 0, diagonals_1 = diagonals; _a < diagonals_1.length; _a++) {
                var n = diagonals_1[_a];
                if (this.isInBounds(n.col, n.row, maxCols, maxRows)) {
                    neighbors.push(n);
                }
            }
        }
        return neighbors;
    };
    /**
     * Heuristic function for A*
     * Uses Manhattan distance for 4-directional, Euclidean for 8-directional
     */
    Pathfinder.prototype.heuristic = function (col1, row1, col2, row2) {
        var dx = Math.abs(col2 - col1);
        var dy = Math.abs(row2 - row1);
        if (this.allowDiagonal) {
            // Euclidean distance for diagonal movement
            return Math.sqrt(dx * dx + dy * dy);
        }
        else {
            // Manhattan distance for cardinal-only movement
            return dx + dy;
        }
    };
    /**
     * Check if position is in bounds
     */
    Pathfinder.prototype.isInBounds = function (col, row, maxCols, maxRows) {
        return col >= 0 && col < maxCols && row >= 0 && row < maxRows;
    };
    /**
     * Create unique key for node position
     */
    Pathfinder.prototype.nodeKey = function (col, row) {
        return "".concat(col, ",").concat(row);
    };
    /**
     * Reconstruct path from goal node
     */
    Pathfinder.prototype.reconstructPath = function (goalNode) {
        var path = [];
        var current = goalNode;
        var cost = goalNode.g;
        while (current) {
            path.unshift({ col: current.col, row: current.row });
            current = current.parent;
        }
        return { path: path, cost: cost };
    };
    return Pathfinder;
}());
exports.Pathfinder = Pathfinder;
