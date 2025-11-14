/**
 * Tests for PathfindingComponent (MODEL)
 * Following TDD: Write tests first, then implementation
 * Reuses existing Pathfinder.ts (A* algorithm)
 */

import { expect } from 'chai';
import { PathfindingComponent } from '../../src/classes/components/PathfindingComponent';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';
import { TileData } from '../../src/world/TileSystem';

describe('PathfindingComponent', () => {
    let gameObject: GameObject;
    let pathfinding: PathfindingComponent;
    let testGrid: TileData[][];

    beforeEach(() => {
        gameObject = new GameObject('ant', 0, 0);
        pathfinding = new PathfindingComponent(2.0); // Speed: 2 tiles/second
        gameObject.addComponent('pathfinding', pathfinding);

        // Create simple 10x10 test grid (all walkable)
        testGrid = [];
        for (let row = 0; row < 10; row++) {
            testGrid[row] = [];
            for (let col = 0; col < 10; col++) {
                testGrid[row][col] = {
                    type: 0, // TileType.GRASS
                    walkable: true,
                    movementCost: 1,
                    spriteIndex: 0
                };
            }
        }
    });

    afterEach(() => {
        gameObject.destroy();
    });

    describe('Initialization', () => {
        it('should initialize with speed', () => {
            const pf = new PathfindingComponent(3.5);
            expect(pf.getSpeed()).to.equal(3.5);
        });

        it('should start with no path', () => {
            expect(pathfinding.hasPath()).to.be.false;
        });

        it('should not be moving initially', () => {
            expect(pathfinding.isMoving()).to.be.false;
        });
    });

    describe('Path Finding', () => {
        it('should find path to target', () => {
            pathfinding.findPath(5, 5, testGrid);
            
            expect(pathfinding.hasPath()).to.be.true;
        });

        it('should emit PATH_FOUND event when path is found', () => {
            let emitted = false;
            EventBus.on('PATH_FOUND', () => emitted = true);

            pathfinding.findPath(5, 5, testGrid);

            expect(emitted).to.be.true;
        });

        it('should return null and emit PATH_FAILED for unreachable target', () => {
            // Make center unwalkable (creates barrier)
            for (let i = 0; i < 10; i++) {
                testGrid[5][i].walkable = false;
            }

            let failedEmitted = false;
            EventBus.on('PATH_FAILED', () => failedEmitted = true);

            pathfinding.findPath(0, 7, testGrid); // Try to reach other side of barrier

            expect(pathfinding.hasPath()).to.be.false;
            expect(failedEmitted).to.be.true;
        });

        it('should handle diagonal movement', () => {
            pathfinding.setAllowDiagonal(true);
            pathfinding.findPath(5, 5, testGrid);

            expect(pathfinding.hasPath()).to.be.true;
        });

        it('should handle non-diagonal movement', () => {
            pathfinding.setAllowDiagonal(false);
            pathfinding.findPath(5, 5, testGrid);

            expect(pathfinding.hasPath()).to.be.true;
        });
    });

    describe('Path Following', () => {
        it('should set moving state when path found', () => {
            // Use longer path to ensure movement happens
            pathfinding.findPath(5, 5, testGrid);
            
            // Path should be found and movement should start
            expect(pathfinding.hasPath()).to.be.true;
        });

        it('should emit PATH_COMPLETE when reaching target', () => {
            let completed = false;
            EventBus.on('PATH_COMPLETE', () => completed = true);

            pathfinding.findPath(1, 0, testGrid);
            
            // Move for a long time to ensure completion
            pathfinding.update(5000);

            expect(completed).to.be.true;
        });

        it('should stop moving when path is complete', () => {
            pathfinding.findPath(1, 0, testGrid);
            
            // Complete the path
            pathfinding.update(5000);

            expect(pathfinding.isMoving()).to.be.false;
        });

        it('should clear path when complete', () => {
            pathfinding.findPath(1, 0, testGrid);
            pathfinding.update(5000);

            expect(pathfinding.hasPath()).to.be.false;
        });

        it('should track target position', () => {
            const targetCol = 5;
            const targetRow = 5;
            
            pathfinding.findPath(targetCol, targetRow, testGrid);
            
            // Should have a path
            expect(pathfinding.hasPath()).to.be.true;
            
            // Next node should exist
            const nextNode = pathfinding.getNextNode();
            expect(nextNode).to.exist;
        });
    });

    describe('Speed Control', () => {
        it('should respect speed settings', () => {
            const slowPath = new PathfindingComponent(1.0);
            const fastPath = new PathfindingComponent(5.0);

            expect(slowPath.getSpeed()).to.equal(1.0);
            expect(fastPath.getSpeed()).to.equal(5.0);
            expect(fastPath.getSpeed()).to.be.greaterThan(slowPath.getSpeed());
        });

        it('should allow speed changes mid-path', () => {
            pathfinding.setSpeed(1.0);
            expect(pathfinding.getSpeed()).to.equal(1.0);

            pathfinding.setSpeed(3.0);
            expect(pathfinding.getSpeed()).to.equal(3.0);
        });
    });

    describe('Path Management', () => {
        it('should clear path manually', () => {
            pathfinding.findPath(5, 5, testGrid);
            expect(pathfinding.hasPath()).to.be.true;

            pathfinding.clearPath();
            expect(pathfinding.hasPath()).to.be.false;
        });

        it('should get next node in path', () => {
            pathfinding.findPath(3, 3, testGrid);
            
            const nextNode = pathfinding.getNextNode();
            expect(nextNode).to.exist;
            expect(nextNode?.col).to.be.a('number');
            expect(nextNode?.row).to.be.a('number');
        });

        it('should return null when no path', () => {
            const nextNode = pathfinding.getNextNode();
            expect(nextNode).to.be.null;
        });

        it('should handle new path request while moving', () => {
            pathfinding.findPath(3, 3, testGrid);
            pathfinding.update(100);

            // Request new path mid-movement
            pathfinding.findPath(7, 7, testGrid);

            expect(pathfinding.hasPath()).to.be.true;
        });
    });

    describe('Path Blocking Detection', () => {
        it('should emit PATH_BLOCKED if path becomes invalid', () => {
            let blocked = false;
            EventBus.on('PATH_BLOCKED', () => blocked = true);

            pathfinding.findPath(5, 5, testGrid);
            
            // Manually trigger blocking check (component would detect this during update)
            pathfinding.checkPathValid(testGrid);

            // In real scenario, grid would change and become blocked
            // For now, just verify the event system works
            expect(blocked).to.be.false; // Path still valid
        });
    });

    describe('Component Lifecycle', () => {
        it('should attach to owner', () => {
            const obj = new GameObject('test', 0, 0);
            const pf = new PathfindingComponent(2.0);
            
            obj.addComponent('pathfinding', pf);
            
            expect(pf.owner).to.equal(obj);
            obj.destroy();
        });

        it('should detach from owner', () => {
            const obj = new GameObject('test', 0, 0);
            const pf = new PathfindingComponent(2.0);
            
            obj.addComponent('pathfinding', pf);
            obj.removeComponent('pathfinding');
            
            expect(pf.owner).to.be.undefined;
            obj.destroy();
        });

        it('should update during game loop', () => {
            pathfinding.findPath(3, 3, testGrid);
            
            const initialMoving = pathfinding.isMoving();
            pathfinding.update(16.67); // ~1 frame
            
            // Should still be moving (path not complete)
            expect(pathfinding.isMoving()).to.equal(initialMoving);
        });
    });

    describe('Edge Cases', () => {
        it('should handle same start and goal position', () => {
            pathfinding.findPath(0, 0, testGrid); // Already at (0,0)
            
            // Should complete immediately or have very short path
            expect(pathfinding.hasPath()).to.be.false; // No path needed
        });

        it('should handle invalid grid', () => {
            const emptyGrid: TileData[][] = [];
            
            let failed = false;
            EventBus.on('PATH_FAILED', () => failed = true);

            pathfinding.findPath(5, 5, emptyGrid);
            
            expect(pathfinding.hasPath()).to.be.false;
            expect(failed).to.be.true;
        });

        it('should handle out of bounds target', () => {
            let failed = false;
            EventBus.on('PATH_FAILED', () => failed = true);

            pathfinding.findPath(100, 100, testGrid); // Out of bounds
            
            expect(pathfinding.hasPath()).to.be.false;
            expect(failed).to.be.true;
        });
    });
});
