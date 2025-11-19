/**
 * Click-to-Move Pathfinding Integration Tests
 * Tests the full click-to-move workflow including pathfinding
 */

import { expect } from 'chai';
import { TileGrid } from '../../src/world/TileGrid';
import { TileType, TileData } from '../../src/world/TileSystem';
import { PathfindingComponent } from '../../src/classes/components/PathfindingComponent';
import { Queen } from '../../src/classes/Queen';
import { EventBus } from '../../src/utils/eventBus';

describe('Click-to-Move Pathfinding Integration', () => {
    let tileGrid: TileGrid;
    let queen: Queen;
    let pathfinding: PathfindingComponent;

    beforeEach(() => {
        // Clear EventBus
        EventBus.clear();

        // Create a simple 10x10 walkable grid
        const gridData: TileData[][] = [];
        for (let row = 0; row < 10; row++) {
            gridData[row] = [];
            for (let col = 0; col < 10; col++) {
                gridData[row][col] = {
                    type: TileType.GRASS,
                    walkable: true,
                    movementCost: 1.0,
                    spriteIndex: 0
                };
            }
        }

        tileGrid = new TileGrid(gridData);

        // Create queen at (5, 5) - requires gridX, gridY, factionId
        queen = new Queen(5, 5, 'player');
        pathfinding = queen.getComponent('Pathfinding') as PathfindingComponent;
    });

    describe('Grid Walkability Checks', () => {
        it('should report correct walkability for tiles', () => {
            expect(tileGrid.isWalkable(5, 5)).to.be.true;
            expect(tileGrid.isWalkable(0, 0)).to.be.true;
            expect(tileGrid.isWalkable(9, 9)).to.be.true;
        });

        it('should report false for out-of-bounds tiles', () => {
            expect(tileGrid.isWalkable(-1, 0)).to.be.false;
            expect(tileGrid.isWalkable(0, -1)).to.be.false;
            expect(tileGrid.isWalkable(10, 5)).to.be.false;
            expect(tileGrid.isWalkable(5, 10)).to.be.false;
        });

        it('should report false for unwalkable tiles', () => {
            // Make tile (3, 3) unwalkable
            const grid = tileGrid.getGrid();
            grid[3][3].walkable = false;
            
            expect(tileGrid.isWalkable(3, 3)).to.be.false;
            expect(tileGrid.isWalkable(3, 4)).to.be.true; // Adjacent tile still walkable
        });
    });

    describe('Pathfinding to Adjacent Tiles', () => {
        it('should find path to tile directly above', () => {
            const targetX = 5;
            const targetY = 4; // One tile up
            
            let pathFound = false;
            let foundPathLength = 0;

            EventBus.once('PATH_FOUND', (_entityId: string, pathLength: number) => {
                pathFound = true;
                foundPathLength = pathLength;
            });

            pathfinding.findPath(targetX, targetY, tileGrid.getGrid());
            
            expect(pathFound).to.be.true;
            expect(foundPathLength).to.be.greaterThan(0);
            expect(pathfinding.hasPath()).to.be.true;
        });

        it('should find path to tile directly below', () => {
            const targetX = 5;
            const targetY = 6; // One tile down
            
            let pathFound = false;
            let foundPathLength = 0;

            EventBus.once('PATH_FOUND', (_entityId: string, pathLength: number) => {
                pathFound = true;
                foundPathLength = pathLength;
            });

            pathfinding.findPath(targetX, targetY, tileGrid.getGrid());
            
            expect(pathFound).to.be.true;
            expect(foundPathLength).to.be.greaterThan(0);
            expect(pathfinding.hasPath()).to.be.true;
        });

        it('should find path to tile directly left', () => {
            const targetX = 4;
            const targetY = 5; // One tile left
            
            let pathFound = false;
            let foundPathLength = 0;

            EventBus.once('PATH_FOUND', (_entityId: string, pathLength: number) => {
                pathFound = true;
                foundPathLength = pathLength;
            });

            pathfinding.findPath(targetX, targetY, tileGrid.getGrid());
            
            expect(pathFound).to.be.true;
            expect(foundPathLength).to.be.greaterThan(0);
            expect(pathfinding.hasPath()).to.be.true;
        });

        it('should find path to tile directly right', () => {
            const targetX = 6;
            const targetY = 5; // One tile right
            
            let pathFound = false;
            let foundPathLength = 0;

            EventBus.once('PATH_FOUND', (_entityId: string, pathLength: number) => {
                pathFound = true;
                foundPathLength = pathLength;
            });

            pathfinding.findPath(targetX, targetY, tileGrid.getGrid());
            
            expect(pathFound).to.be.true;
            expect(foundPathLength).to.be.greaterThan(0);
            expect(pathfinding.hasPath()).to.be.true;
        });

        it('should find path to diagonal tile', () => {
            const targetX = 6;
            const targetY = 6; // Diagonal
            
            let pathFound = false;
            let foundPathLength = 0;

            EventBus.once('PATH_FOUND', (_entityId: string, pathLength: number) => {
                pathFound = true;
                foundPathLength = pathLength;
            });

            pathfinding.findPath(targetX, targetY, tileGrid.getGrid());
            
            expect(pathFound).to.be.true;
            expect(foundPathLength).to.be.greaterThan(0);
            expect(pathfinding.hasPath()).to.be.true;
        });
    });

    describe('Pathfinding to Distant Tiles', () => {
        it('should find path to corner (0, 0)', () => {
            const targetX = 0;
            const targetY = 0;
            
            let pathFound = false;
            let foundPathLength = 0;

            EventBus.once('PATH_FOUND', (_entityId: string, pathLength: number) => {
                pathFound = true;
                foundPathLength = pathLength;
            });

            pathfinding.findPath(targetX, targetY, tileGrid.getGrid());
            
            expect(pathFound).to.be.true;
            expect(foundPathLength).to.be.greaterThan(5); // At least 5 tiles away
            expect(pathfinding.hasPath()).to.be.true;
        });

        it('should find path to corner (9, 9)', () => {
            const targetX = 9;
            const targetY = 9;
            
            let pathFound = false;
            let foundPathLength = 0;

            EventBus.once('PATH_FOUND', (_entityId: string, pathLength: number) => {
                pathFound = true;
                foundPathLength = pathLength;
            });

            pathfinding.findPath(targetX, targetY, tileGrid.getGrid());
            
            expect(pathFound).to.be.true;
            expect(foundPathLength).to.be.greaterThan(5); // At least 5 tiles away
            expect(pathfinding.hasPath()).to.be.true;
        });
    });

    describe('Pathfinding Failure Cases', () => {
        it('should fail to find path to unwalkable tile', () => {
            // Make target tile unwalkable
            const grid = tileGrid.getGrid();
            grid[7][7].walkable = false;
            
            let pathFailed = false;
            let failureReason = '';

            EventBus.once('PATH_FAILED', (_entityId: string, reason: string) => {
                pathFailed = true;
                failureReason = reason;
            });

            pathfinding.findPath(7, 7, grid);
            
            expect(pathFailed).to.be.true;
            expect(failureReason).to.include('not walkable');
            expect(pathfinding.hasPath()).to.be.false;
        });

        it('should fail to find path to out-of-bounds tile', () => {
            let pathFailed = false;
            let failureReason = '';
            
            EventBus.once('PATH_FAILED', (_entityId: string, reason: string) => {
                pathFailed = true;
                failureReason = reason;
            });

            pathfinding.findPath(15, 15, tileGrid.getGrid());
            
            expect(pathFailed).to.be.true;
            expect(failureReason).to.include('Out of bounds');
            expect(pathfinding.hasPath()).to.be.false;
        });

        it('should fail to find path when surrounded by walls', () => {
            // Surround target with walls
            const grid = tileGrid.getGrid();
            const targetX = 7;
            const targetY = 7;
            
            // Build wall around target
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue; // Skip center
                    const wallX = targetX + dx;
                    const wallY = targetY + dy;
                    if (wallX >= 0 && wallX < 10 && wallY >= 0 && wallY < 10) {
                        grid[wallY][wallX].walkable = false;
                    }
                }
            }
            
            let pathFailed = false;
            let failureReason = '';

            EventBus.once('PATH_FAILED', (_entityId: string, reason: string) => {
                pathFailed = true;
                failureReason = reason;
            });

            pathfinding.findPath(targetX, targetY, grid);
            
            expect(pathFailed).to.be.true;
            expect(failureReason).to.include('No path found');
            expect(pathfinding.hasPath()).to.be.false;
        });
    });

    describe('Real-World Scenario: Large World Grid', () => {
        it('should handle pathfinding in 200x200 grid', () => {
            // Create larger grid like DevRoom (200x200)
            const largeGridData: TileData[][] = [];
            for (let row = 0; row < 200; row++) {
                largeGridData[row] = [];
                for (let col = 0; col < 200; col++) {
                    largeGridData[row][col] = {
                        type: TileType.GRASS,
                        walkable: true,
                        movementCost: 1.0,
                        spriteIndex: 0
                    };
                }
            }

            const largeTileGrid = new TileGrid(largeGridData);
            const largeQueen = new Queen(100, 100, 'player'); // Center spawn like DevRoom
            const largePathfinding = largeQueen.getComponent('Pathfinding') as PathfindingComponent;

            // Try to path to nearby tile
            const targetX = 101;
            const targetY = 101;
            
            let pathFound = false;
            let foundPathLength = 0;

            EventBus.once('PATH_FOUND', (_entityId: string, pathLength: number) => {
                pathFound = true;
                foundPathLength = pathLength;
            });

            largePathfinding.findPath(targetX, targetY, largeTileGrid.getGrid());
            
            expect(pathFound).to.be.true;
            expect(foundPathLength).to.be.greaterThan(0);
            expect(largePathfinding.hasPath()).to.be.true;
        }).timeout(5000); // Allow extra time for large grid

        it('should handle pathfinding to edge of 200x200 grid', () => {
            // Create larger grid
            const largeGridData: TileData[][] = [];
            for (let row = 0; row < 200; row++) {
                largeGridData[row] = [];
                for (let col = 0; col < 200; col++) {
                    largeGridData[row][col] = {
                        type: TileType.GRASS,
                        walkable: true,
                        movementCost: 1.0,
                        spriteIndex: 0
                    };
                }
            }

            const largeTileGrid = new TileGrid(largeGridData);
            const largeQueen = new Queen(100, 100, 'player');
            const largePathfinding = largeQueen.getComponent('Pathfinding') as PathfindingComponent;

            // Try to path to edge
            const targetX = 199;
            const targetY = 199;
            
            let pathFound = false;
            let foundPathLength = 0;

            EventBus.once('PATH_FOUND', (_entityId: string, pathLength: number) => {
                pathFound = true;
                foundPathLength = pathLength;
            });

            largePathfinding.findPath(targetX, targetY, largeTileGrid.getGrid());
            
            expect(pathFound).to.be.true;
            expect(foundPathLength).to.be.greaterThan(50); // Should be ~140 tiles away
            expect(largePathfinding.hasPath()).to.be.true;
        }).timeout(5000);
    });
});

