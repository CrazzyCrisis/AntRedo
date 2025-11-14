/**
 * A* Pathfinding System
 * Finds optimal paths through tile-based worlds with weighted movement costs
 */

import { TileData } from './TileSystem';

/**
 * Path node - represents a position in the path
 */
export interface PathNode {
    col: number;
    row: number;
}

/**
 * Path result with cost information
 */
export interface PathResult {
    path: PathNode[];
    cost: number;
}

/**
 * Internal A* node for priority queue
 */
interface AStarNode {
    col: number;
    row: number;
    g: number; // Cost from start
    h: number; // Heuristic to goal
    f: number; // Total cost (g + h)
    parent: AStarNode | null;
}

/**
 * Pathfinder - A* implementation for tile-based pathfinding
 */
export class Pathfinder {
    private allowDiagonal: boolean = true;

    /**
     * Enable or disable diagonal movement
     */
    setAllowDiagonal(allow: boolean): void {
        this.allowDiagonal = allow;
    }

    /**
     * Find path from start to goal
     * Returns array of PathNodes, or null if no path exists
     */
    findPath(
        startCol: number,
        startRow: number,
        goalCol: number,
        goalRow: number,
        grid: TileData[][]
    ): PathNode[] | null {
        const result = this.findPathWithCost(startCol, startRow, goalCol, goalRow, grid);
        return result ? result.path : null;
    }

    /**
     * Find path with cost information
     */
    findPathWithCost(
        startCol: number,
        startRow: number,
        goalCol: number,
        goalRow: number,
        grid: TileData[][]
    ): PathResult | null {
        // Validate grid
        if (!grid || grid.length === 0 || grid[0].length === 0) {
            return null;
        }

        const rows = grid.length;
        const cols = grid[0].length;

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
        const openSet: AStarNode[] = [];
        const closedSet = new Set<string>();
        
        const startNode: AStarNode = {
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
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[currentIndex].f) {
                    currentIndex = i;
                }
            }
            const current = openSet[currentIndex];

            // Check if reached goal
            if (current.col === goalCol && current.row === goalRow) {
                return this.reconstructPath(current);
            }

            // Move current from open to closed
            openSet.splice(currentIndex, 1);
            closedSet.add(this.nodeKey(current.col, current.row));

            // Check neighbors
            const neighbors = this.getNeighbors(current.col, current.row, cols, rows);
            
            for (const neighbor of neighbors) {
                const { col, row, isDiagonal } = neighbor;

                // Skip if in closed set
                if (closedSet.has(this.nodeKey(col, row))) {
                    continue;
                }

                // Skip if not walkable
                if (!grid[row][col].walkable) {
                    continue;
                }

                // For diagonal moves, check if adjacent cardinal tiles are walkable (no corner cutting)
                if (isDiagonal) {
                    const dx = col - current.col;
                    const dy = row - current.row;
                    const horizontal = grid[current.row][current.col + dx];
                    const vertical = grid[current.row + dy][current.col];
                    
                    // Can't move diagonally if both adjacent cardinals are blocked
                    if (!horizontal.walkable && !vertical.walkable) {
                        continue;
                    }
                }

                // Calculate movement cost
                const tileCost = grid[row][col].movementCost;
                const movementCost = isDiagonal ? Math.sqrt(2) * tileCost : tileCost;
                const tentativeG = current.g + movementCost;

                // Check if this path to neighbor is better
                let neighborNode = openSet.find(n => n.col === col && n.row === row);
                
                if (!neighborNode) {
                    // New node
                    neighborNode = {
                        col,
                        row,
                        g: tentativeG,
                        h: this.heuristic(col, row, goalCol, goalRow),
                        f: 0,
                        parent: current
                    };
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openSet.push(neighborNode);
                } else if (tentativeG < neighborNode.g) {
                    // Better path found
                    neighborNode.g = tentativeG;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    neighborNode.parent = current;
                }
            }
        }

        // No path found
        return null;
    }

    /**
     * Get neighbors for current position
     */
    private getNeighbors(col: number, row: number, maxCols: number, maxRows: number): Array<{ col: number; row: number; isDiagonal: boolean }> {
        const neighbors: Array<{ col: number; row: number; isDiagonal: boolean }> = [];

        // Cardinal directions
        const cardinals = [
            { col: col, row: row - 1, isDiagonal: false },     // Up
            { col: col, row: row + 1, isDiagonal: false },     // Down
            { col: col - 1, row: row, isDiagonal: false },     // Left
            { col: col + 1, row: row, isDiagonal: false }      // Right
        ];

        for (const n of cardinals) {
            if (this.isInBounds(n.col, n.row, maxCols, maxRows)) {
                neighbors.push(n);
            }
        }

        // Diagonal directions (if allowed)
        if (this.allowDiagonal) {
            const diagonals = [
                { col: col - 1, row: row - 1, isDiagonal: true }, // Up-Left
                { col: col + 1, row: row - 1, isDiagonal: true }, // Up-Right
                { col: col - 1, row: row + 1, isDiagonal: true }, // Down-Left
                { col: col + 1, row: row + 1, isDiagonal: true }  // Down-Right
            ];

            for (const n of diagonals) {
                if (this.isInBounds(n.col, n.row, maxCols, maxRows)) {
                    neighbors.push(n);
                }
            }
        }

        return neighbors;
    }

    /**
     * Heuristic function for A*
     * Uses Manhattan distance for 4-directional, Euclidean for 8-directional
     */
    private heuristic(col1: number, row1: number, col2: number, row2: number): number {
        const dx = Math.abs(col2 - col1);
        const dy = Math.abs(row2 - row1);

        if (this.allowDiagonal) {
            // Euclidean distance for diagonal movement
            return Math.sqrt(dx * dx + dy * dy);
        } else {
            // Manhattan distance for cardinal-only movement
            return dx + dy;
        }
    }

    /**
     * Check if position is in bounds
     */
    private isInBounds(col: number, row: number, maxCols: number, maxRows: number): boolean {
        return col >= 0 && col < maxCols && row >= 0 && row < maxRows;
    }

    /**
     * Create unique key for node position
     */
    private nodeKey(col: number, row: number): string {
        return `${col},${row}`;
    }

    /**
     * Reconstruct path from goal node
     */
    private reconstructPath(goalNode: AStarNode): PathResult {
        const path: PathNode[] = [];
        let current: AStarNode | null = goalNode;
        const cost = goalNode.g;

        while (current) {
            path.unshift({ col: current.col, row: current.row });
            current = current.parent;
        }

        return { path, cost };
    }
}
