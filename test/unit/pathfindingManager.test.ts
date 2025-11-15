/**
 * Unit Tests for PathfindingManager
 * Tests grid initialization, blocking/unblocking, path finding, and building updates
 */

import { expect } from 'chai';
import { PathfindingManager } from '../../src/managers/PathfindingManager';
import { EventBus } from '../../src/utils/eventBus';
import { TileData } from '../../src/world/TileSystem';

describe('PathfindingManager', () => {
    let manager: PathfindingManager;

    beforeEach(() => {
        EventBus.clear();
        manager = PathfindingManager.getInstance();
        manager.reinitializeListeners(); // Restore EventBus listeners after clear
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Initialization', () => {
        it('should be a singleton', () => {
            const instance1 = PathfindingManager.getInstance();
            const instance2 = PathfindingManager.getInstance();
            expect(instance1).to.equal(instance2);
        });

        it('should initialize grid with dimensions', () => {
            manager.initializeGrid(20, 20, true);
            
            const dimensions = manager.getGridDimensions();
            expect(dimensions.width).to.equal(20);
            expect(dimensions.height).to.equal(20);
        });

        it('should emit PATHFINDING_GRID_INITIALIZED event', (done) => {
            EventBus.once('PATHFINDING_GRID_INITIALIZED', (width, height) => {
                expect(width).to.equal(30);
                expect(height).to.equal(25);
                done();
            });
            
            manager.initializeGrid(30, 25, true);
        });

        it('should initialize all tiles as walkable by default', () => {
            manager.initializeGrid(10, 10, true);
            
            expect(manager.isWalkable(0, 0)).to.be.true;
            expect(manager.isWalkable(5, 5)).to.be.true;
            expect(manager.isWalkable(9, 9)).to.be.true;
        });

        it('should initialize all tiles as blocked when specified', () => {
            manager.initializeGrid(10, 10, false);
            
            expect(manager.isWalkable(0, 0)).to.be.false;
            expect(manager.isWalkable(5, 5)).to.be.false;
        });

        it('should initialize from TileData grid', () => {
            const tileGrid: TileData[][] = [];
            for (let row = 0; row < 15; row++) {
                const rowData: TileData[] = [];
                for (let col = 0; col < 15; col++) {
                    rowData.push({
                        type: 0,
                        walkable: true,
                        movementCost: 1.0,
                        spriteIndex: 0
                    });
                }
                tileGrid.push(rowData);
            }
            
            manager.initializeFromTileGrid(tileGrid);
            
            const dimensions = manager.getGridDimensions();
            expect(dimensions.width).to.equal(15);
            expect(dimensions.height).to.equal(15);
        });

        it('should handle WORLD_GENERATED event', (done) => {
            const tileGrid: TileData[][] = [];
            for (let row = 0; row < 10; row++) {
                const rowData: TileData[] = [];
                for (let col = 0; col < 10; col++) {
                    rowData.push({
                        type: 0,
                        walkable: true,
                        movementCost: 1.0,
                        spriteIndex: 0
                    });
                }
                tileGrid.push(rowData);
            }
            
            EventBus.once('PATHFINDING_GRID_INITIALIZED', () => {
                const dimensions = manager.getGridDimensions();
                expect(dimensions.width).to.equal(10);
                expect(dimensions.height).to.equal(10);
                done();
            });
            
            EventBus.emit('WORLD_GENERATED', tileGrid);
        });
    });

    describe('Grid Manipulation', () => {
        beforeEach(() => {
            manager.initializeGrid(20, 20, true);
        });

        it('should mark single tile as blocked', () => {
            manager.updateGrid(5, 5, false);
            expect(manager.isWalkable(5, 5)).to.be.false;
        });

        it('should mark single tile as walkable', () => {
            manager.updateGrid(5, 5, false);
            manager.updateGrid(5, 5, true);
            expect(manager.isWalkable(5, 5)).to.be.true;
        });

        it('should mark multiple tiles as blocked', () => {
            const tiles = [
                { col: 5, row: 5 },
                { col: 6, row: 5 },
                { col: 5, row: 6 }
            ];
            
            manager.markBlocked(tiles);
            
            expect(manager.isWalkable(5, 5)).to.be.false;
            expect(manager.isWalkable(6, 5)).to.be.false;
            expect(manager.isWalkable(5, 6)).to.be.false;
        });

        it('should emit PATHFINDING_TILES_BLOCKED event', (done) => {
            EventBus.once('PATHFINDING_TILES_BLOCKED', (count) => {
                expect(count).to.equal(3);
                done();
            });
            
            manager.markBlocked([
                { col: 5, row: 5 },
                { col: 6, row: 5 },
                { col: 7, row: 5 }
            ]);
        });

        it('should mark multiple tiles as walkable', () => {
            const tiles = [
                { col: 5, row: 5 },
                { col: 6, row: 5 }
            ];
            
            manager.markBlocked(tiles);
            manager.markWalkable(tiles);
            
            expect(manager.isWalkable(5, 5)).to.be.true;
            expect(manager.isWalkable(6, 5)).to.be.true;
        });

        it('should emit PATHFINDING_TILES_UNBLOCKED event', (done) => {
            manager.markBlocked([
                { col: 5, row: 5 },
                { col: 6, row: 5 }
            ]);
            
            EventBus.once('PATHFINDING_TILES_UNBLOCKED', (count) => {
                expect(count).to.equal(2);
                done();
            });
            
            manager.markWalkable([
                { col: 5, row: 5 },
                { col: 6, row: 5 }
            ]);
        });

        it('should handle out of bounds updates gracefully', () => {
            expect(() => manager.updateGrid(-1, -1, false)).to.not.throw();
            expect(() => manager.updateGrid(100, 100, false)).to.not.throw();
        });

        it('should handle empty tile arrays', () => {
            expect(() => manager.markBlocked([])).to.not.throw();
            expect(() => manager.markWalkable([])).to.not.throw();
        });
    });

    describe('Pathfinding', () => {
        beforeEach(() => {
            manager.initializeGrid(20, 20, true);
        });

        it('should find path between two points', () => {
            const path = manager.findPath(0, 0, 5, 5);
            
            expect(path).to.not.be.null;
            expect(path!.length).to.be.greaterThan(0);
        });

        it('should find path around obstacle', () => {
            // Create obstacle
            manager.markBlocked([
                { col: 5, row: 5 },
                { col: 5, row: 6 },
                { col: 5, row: 7 }
            ]);
            
            const path = manager.findPath(0, 6, 10, 6);
            
            expect(path).to.not.be.null;
            // Path should go around obstacle
            const blockedInPath = path!.some(node => node.col === 5 && (node.row === 5 || node.row === 6 || node.row === 7));
            expect(blockedInPath).to.be.false;
        });

        it('should return null when no path exists', () => {
            // Block complete vertical line
            for (let row = 0; row < 20; row++) {
                manager.markBlocked([{ col: 10, row }]);
            }
            
            const path = manager.findPath(5, 10, 15, 10);
            expect(path).to.be.null;
        });

        it('should find path with cost information', () => {
            const result = manager.findPathWithCost(0, 0, 5, 5);
            
            expect(result).to.not.be.null;
            expect(result!.path).to.be.an('array');
            expect(result!.cost).to.be.a('number').and.greaterThan(0);
        });

        it('should return null for path without grid', () => {
            // Create fresh manager without grid
            (manager as any).grid = null;
            
            const path = manager.findPath(0, 0, 5, 5);
            expect(path).to.be.null;
        });

        it('should allow toggling diagonal movement', () => {
            manager.setAllowDiagonal(false);
            const path1 = manager.findPath(0, 0, 2, 2);
            
            manager.setAllowDiagonal(true);
            const path2 = manager.findPath(0, 0, 2, 2);
            
            // Diagonal path should be shorter
            expect(path2!.length).to.be.lessThan(path1!.length);
        });
    });

    describe('Building Integration', () => {
        beforeEach(() => {
            manager.initializeGrid(20, 20, true);
        });

        it('should block tiles on BUILDING_PATHFINDING_BLOCK event', () => {
            const tiles = [
                { col: 10, row: 10 },
                { col: 11, row: 10 },
                { col: 10, row: 11 },
                { col: 11, row: 11 }
            ];
            
            EventBus.emit('BUILDING_PATHFINDING_BLOCK', tiles);
            
            expect(manager.isWalkable(10, 10)).to.be.false;
            expect(manager.isWalkable(11, 10)).to.be.false;
            expect(manager.isWalkable(10, 11)).to.be.false;
            expect(manager.isWalkable(11, 11)).to.be.false;
        });

        it('should unblock tiles on BUILDING_PATHFINDING_UNBLOCK event', () => {
            const tiles = [
                { col: 10, row: 10 },
                { col: 11, row: 10 }
            ];
            
            EventBus.emit('BUILDING_PATHFINDING_BLOCK', tiles);
            expect(manager.isWalkable(10, 10)).to.be.false;
            
            EventBus.emit('BUILDING_PATHFINDING_UNBLOCK', tiles);
            expect(manager.isWalkable(10, 10)).to.be.true;
        });

        it('should handle variable building sizes', () => {
            // 3x2 building
            const tiles = [
                { col: 5, row: 5 },
                { col: 6, row: 5 },
                { col: 7, row: 5 },
                { col: 5, row: 6 },
                { col: 6, row: 6 },
                { col: 7, row: 6 }
            ];
            
            manager.markBlocked(tiles);
            
            tiles.forEach(tile => {
                expect(manager.isWalkable(tile.col, tile.row)).to.be.false;
            });
        });

        it.skip('should update pathfinding after building placement', () => {
            // Create path before building
            const pathBefore = manager.findPath(0, 10, 19, 10);
            expect(pathBefore).to.not.be.null;
            const lengthBefore = pathBefore!.length;
            
            // Place building blocking the path
            const tiles = [
                { col: 10, row: 9 },
                { col: 10, row: 10 },
                { col: 10, row: 11 }
            ];
            manager.markBlocked(tiles);
            
            // Path should now route around
            const pathAfter = manager.findPath(0, 10, 19, 10);
            expect(pathAfter).to.not.be.null;
            expect(pathAfter!.length).to.be.greaterThan(lengthBefore);
        });

        it.skip('should update pathfinding after building destruction', () => {
            const tiles = [
                { col: 10, row: 10 }
            ];
            
            manager.markBlocked(tiles);
            const pathBlocked = manager.findPath(9, 10, 11, 10);
            const lengthBlocked = pathBlocked ? pathBlocked.length : 999;
            
            manager.markWalkable(tiles);
            const pathOpen = manager.findPath(9, 10, 11, 10);
            
            expect(pathOpen!.length).to.be.lessThan(lengthBlocked);
        });
    });

    describe('Walkability Queries', () => {
        beforeEach(() => {
            manager.initializeGrid(20, 20, true);
        });

        it('should check if tile is walkable', () => {
            expect(manager.isWalkable(10, 10)).to.be.true;
            
            manager.updateGrid(10, 10, false);
            expect(manager.isWalkable(10, 10)).to.be.false;
        });

        it('should return false for out of bounds', () => {
            expect(manager.isWalkable(-1, 5)).to.be.false;
            expect(manager.isWalkable(5, -1)).to.be.false;
            expect(manager.isWalkable(100, 5)).to.be.false;
            expect(manager.isWalkable(5, 100)).to.be.false;
        });

        it('should return false when grid not initialized', () => {
            (manager as any).grid = null;
            expect(manager.isWalkable(5, 5)).to.be.false;
        });

        it('should get grid dimensions', () => {
            const dimensions = manager.getGridDimensions();
            expect(dimensions.width).to.equal(20);
            expect(dimensions.height).to.equal(20);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero-size grid', () => {
            manager.initializeGrid(0, 0, true);
            const dimensions = manager.getGridDimensions();
            expect(dimensions.width).to.equal(0);
            expect(dimensions.height).to.equal(0);
        });

        it('should handle very large grids', () => {
            manager.initializeGrid(1000, 1000, true);
            const dimensions = manager.getGridDimensions();
            expect(dimensions.width).to.equal(1000);
            expect(dimensions.height).to.equal(1000);
        });

        it('should handle repeated initialization', () => {
            manager.initializeGrid(10, 10, true);
            manager.initializeGrid(20, 20, false);
            
            const dimensions = manager.getGridDimensions();
            expect(dimensions.width).to.equal(20);
            expect(dimensions.height).to.equal(20);
        });

        it('should handle blocking then unblocking same tiles rapidly', () => {
            const tiles = [{ col: 10, row: 10 }];
            
            for (let i = 0; i < 10; i++) {
                manager.markBlocked(tiles);
                manager.markWalkable(tiles);
            }
            
            expect(manager.isWalkable(10, 10)).to.be.true;
        });

        it('should handle path finding without initialization', () => {
            (manager as any).grid = null;
            const path = manager.findPath(0, 0, 5, 5);
            expect(path).to.be.null;
        });

        it('should handle finding path to same position', () => {
            manager.initializeGrid(20, 20, true);
            const path = manager.findPath(5, 5, 5, 5);
            
            // Should return empty or single-node path
            expect(path).to.not.be.null;
            expect(path!.length).to.be.lessThanOrEqual(1);
        });

        it('should handle blocking all tiles', () => {
            manager.initializeGrid(5, 5, true);
            
            const tiles = [];
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    tiles.push({ col, row });
                }
            }
            
            manager.markBlocked(tiles);
            
            const path = manager.findPath(0, 0, 4, 4);
            expect(path).to.be.null;
        });
    });
});
