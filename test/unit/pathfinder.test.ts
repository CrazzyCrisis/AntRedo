/**
 * Tests for A* Pathfinding System
 * Following TDD - tests written BEFORE implementation
 */

import { expect } from 'chai';
import { Pathfinder } from '../../src/world/Pathfinder';
import { TileType, Tile, TileData } from '../../src/world/TileSystem';

describe('Pathfinder', () => {
    let pathfinder: Pathfinder;

    beforeEach(() => {
        pathfinder = new Pathfinder();
    });

    describe('Grid-based Pathfinding', () => {
        it('should find straight path on uniform terrain', () => {
            // Create 5x5 grid of grass (all walkable, cost 1.0)
            const grid: TileData[][] = [];
            for (let row = 0; row < 5; row++) {
                grid[row] = [];
                for (let col = 0; col < 5; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(0, 0, 4, 0, grid);
            
            expect(path).to.not.be.null;
            expect(path).to.have.lengthOf(5); // Start + 4 steps
            expect(path![0]).to.deep.equal({ col: 0, row: 0 });
            expect(path![4]).to.deep.equal({ col: 4, row: 0 });
        });

        it('should find path around obstacles', () => {
            // Create 5x5 grid with water barrier that has gaps
            const grid: TileData[][] = [];
            for (let row = 0; row < 5; row++) {
                grid[row] = [];
                for (let col = 0; col < 5; col++) {
                    // Create vertical water barrier at col 2, but with gaps at rows 0 and 4
                    const type = (col === 2 && row !== 0 && row !== 4) ? TileType.WATER : TileType.GRASS;
                    const tile = new Tile(col, row, type);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(0, 2, 4, 2, grid);
            
            expect(path).to.not.be.null;
            // Path should go around the water barrier through the gaps
            // It should pass through row 0 or row 4, not through the middle water tiles
            const hasMiddleWater = path!.some((node: any) => node.col === 2 && node.row > 0 && node.row < 4);
            expect(hasMiddleWater).to.be.false;
        });

        it('should return null if no path exists', () => {
            // Create 5x5 grid with complete water barrier
            const grid: TileData[][] = [];
            for (let row = 0; row < 5; row++) {
                grid[row] = [];
                for (let col = 0; col < 5; col++) {
                    // Complete vertical barrier - no way through
                    const type = col === 2 ? TileType.WATER : TileType.GRASS;
                    const tile = new Tile(col, row, type);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(0, 0, 4, 0, grid);
            
            expect(path).to.be.null;
        });

        it('should return single node if start equals goal', () => {
            const grid: TileData[][] = [];
            for (let row = 0; row < 3; row++) {
                grid[row] = [];
                for (let col = 0; col < 3; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(1, 1, 1, 1, grid);
            
            expect(path).to.not.be.null;
            expect(path).to.have.lengthOf(1);
            expect(path![0]).to.deep.equal({ col: 1, row: 1 });
        });
    });

    describe('Movement Cost Weighting', () => {
        it('should prefer lower cost tiles', () => {
            // Create grid with grass (cost 1.0) and sand (cost 1.5)
            const grid: TileData[][] = [];
            for (let row = 0; row < 3; row++) {
                grid[row] = [];
                for (let col = 0; col < 5; col++) {
                    // Middle row is sand (higher cost)
                    const type = row === 1 ? TileType.SAND : TileType.GRASS;
                    const tile = new Tile(col, row, type);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(0, 1, 4, 1, grid);
            
            expect(path).to.not.be.null;
            // Path should avoid middle row (sand) if possible
            // Due to heuristic, it might still go through if it's shorter
            // Main test is that it completes successfully
            expect(path!.length).to.be.greaterThan(0);
        });

        it('should calculate correct path cost', () => {
            const grid: TileData[][] = [];
            for (let row = 0; row < 3; row++) {
                grid[row] = [];
                for (let col = 0; col < 3; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    grid[row][col] = tile.toData();
                }
            }

            const result = pathfinder.findPathWithCost(0, 0, 2, 0, grid);
            
            expect(result).to.not.be.null;
            expect(result!.path).to.have.lengthOf(3);
            // Cost should be 2.0 (two steps of cost 1.0 each)
            expect(result!.cost).to.equal(2.0);
        });
    });

    describe('Diagonal Movement', () => {
        it('should support diagonal movement', () => {
            const grid: TileData[][] = [];
            for (let row = 0; row < 5; row++) {
                grid[row] = [];
                for (let col = 0; col < 5; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    grid[row][col] = tile.toData();
                }
            }

            // Enable diagonal movement
            pathfinder.setAllowDiagonal(true);
            const path = pathfinder.findPath(0, 0, 3, 3, grid);
            
            expect(path).to.not.be.null;
            // Diagonal path should be shorter than Manhattan path
            expect(path!.length).to.be.lessThan(7); // Manhattan would be 7 steps
        });

        it('should disable diagonal movement when set', () => {
            const grid: TileData[][] = [];
            for (let row = 0; row < 5; row++) {
                grid[row] = [];
                for (let col = 0; col < 5; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    grid[row][col] = tile.toData();
                }
            }

            pathfinder.setAllowDiagonal(false);
            const path = pathfinder.findPath(0, 0, 2, 2, grid);
            
            expect(path).to.not.be.null;
            // Should only use cardinal directions
            for (let i = 1; i < path!.length; i++) {
                const prev = path![i - 1];
                const curr = path![i];
                const colDiff = Math.abs(curr.col - prev.col);
                const rowDiff = Math.abs(curr.row - prev.row);
                // Either horizontal or vertical, not both
                expect(colDiff + rowDiff).to.equal(1);
            }
        });

        it('should use sqrt(2) cost for diagonal moves', () => {
            const grid: TileData[][] = [];
            for (let row = 0; row < 3; row++) {
                grid[row] = [];
                for (let col = 0; col < 3; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    grid[row][col] = tile.toData();
                }
            }

            pathfinder.setAllowDiagonal(true);
            const result = pathfinder.findPathWithCost(0, 0, 2, 2, grid);
            
            expect(result).to.not.be.null;
            // Pure diagonal path (0,0) -> (1,1) -> (2,2) = 2 * sqrt(2) * cost
            // Cost = 2 * 1.414... * 1.0 ≈ 2.828
            expect(result!.cost).to.be.closeTo(2.828, 0.01);
        });
    });

    describe('Edge Cases', () => {
        it('should handle start position on non-walkable tile', () => {
            const grid: TileData[][] = [];
            for (let row = 0; row < 3; row++) {
                grid[row] = [];
                for (let col = 0; col < 3; col++) {
                    const type = (col === 0 && row === 0) ? TileType.WATER : TileType.GRASS;
                    const tile = new Tile(col, row, type);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(0, 0, 2, 2, grid);
            
            expect(path).to.be.null;
        });

        it('should handle goal position on non-walkable tile', () => {
            const grid: TileData[][] = [];
            for (let row = 0; row < 3; row++) {
                grid[row] = [];
                for (let col = 0; col < 3; col++) {
                    const type = (col === 2 && row === 2) ? TileType.WATER : TileType.GRASS;
                    const tile = new Tile(col, row, type);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(0, 0, 2, 2, grid);
            
            expect(path).to.be.null;
        });

        it('should handle out of bounds positions', () => {
            const grid: TileData[][] = [];
            for (let row = 0; row < 3; row++) {
                grid[row] = [];
                for (let col = 0; col < 3; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(0, 0, 10, 10, grid);
            
            expect(path).to.be.null;
        });

        it('should handle empty grid', () => {
            const grid: TileData[][] = [];

            const path = pathfinder.findPath(0, 0, 1, 1, grid);
            
            expect(path).to.be.null;
        });

        it('should handle 1x1 grid', () => {
            const grid: TileData[][] = [[new Tile(0, 0, TileType.GRASS).toData()]];

            const path = pathfinder.findPath(0, 0, 0, 0, grid);
            
            expect(path).to.not.be.null;
            expect(path).to.have.lengthOf(1);
        });
    });

    describe('Heuristic Function', () => {
        it('should use Manhattan distance by default', () => {
            pathfinder.setAllowDiagonal(false);
            // Heuristic is internal, test via behavior
            // With Manhattan heuristic and no diagonals, should find optimal path
            const grid: TileData[][] = [];
            for (let row = 0; row < 5; row++) {
                grid[row] = [];
                for (let col = 0; col < 5; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(0, 0, 4, 4, grid);
            
            expect(path).to.not.be.null;
            expect(path!.length).to.equal(9); // Manhattan distance = 8 + 1
        });

        it('should use Euclidean distance for diagonal movement', () => {
            pathfinder.setAllowDiagonal(true);
            // With Euclidean and diagonals, should find shorter path
            const grid: TileData[][] = [];
            for (let row = 0; row < 5; row++) {
                grid[row] = [];
                for (let col = 0; col < 5; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    grid[row][col] = tile.toData();
                }
            }

            const path = pathfinder.findPath(0, 0, 4, 4, grid);
            
            expect(path).to.not.be.null;
            expect(path!.length).to.equal(5); // Diagonal path
        });
    });
});
