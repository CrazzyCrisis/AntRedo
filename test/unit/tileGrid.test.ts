/**
 * Tests for TileGrid - Tile Query System
 * Following TDD - tests written BEFORE implementation
 */

import { expect } from 'chai';
import { TileGrid } from '../../src/world/TileGrid';
import { Tile, TileType, TileData, TILE_SIZE } from '../../src/world/TileSystem';

describe('TileGrid', () => {
    let grid: TileGrid;

    beforeEach(() => {
        // Create a simple 5x5 grid for testing
        const tiles: TileData[][] = [];
        for (let row = 0; row < 5; row++) {
            tiles[row] = [];
            for (let col = 0; col < 5; col++) {
                // Create a simple pattern: water at edges, grass in middle
                let type = TileType.GRASS;
                if (row === 0 || row === 4 || col === 0 || col === 4) {
                    type = TileType.WATER;
                }
                const tile = new Tile(col, row, type);
                tiles[row][col] = tile.toData();
            }
        }
        grid = new TileGrid(tiles);
    });

    describe('Initialization', () => {
        it('should create grid with correct dimensions', () => {
            expect(grid.getWidth()).to.equal(5);
            expect(grid.getHeight()).to.equal(5);
        });

        it('should store tile data correctly', () => {
            const tileData = grid.getTileDataAt(2, 2);
            expect(tileData).to.not.be.null;
            expect(tileData!.type).to.equal(TileType.GRASS);
        });

        it('should handle empty grid', () => {
            const emptyGrid = new TileGrid([]);
            expect(emptyGrid.getWidth()).to.equal(0);
            expect(emptyGrid.getHeight()).to.equal(0);
        });
    });

    describe('Grid Coordinate Queries', () => {
        it('should get tile data by grid coordinates', () => {
            const tileData = grid.getTileDataAt(1, 1);
            expect(tileData).to.not.be.null;
            expect(tileData!.type).to.equal(TileType.GRASS);
        });

        it('should return null for out of bounds grid coordinates', () => {
            expect(grid.getTileDataAt(-1, 0)).to.be.null;
            expect(grid.getTileDataAt(0, -1)).to.be.null;
            expect(grid.getTileDataAt(10, 0)).to.be.null;
            expect(grid.getTileDataAt(0, 10)).to.be.null;
        });

        it('should get tile at edge of grid', () => {
            const tileData = grid.getTileDataAt(0, 0);
            expect(tileData).to.not.be.null;
            expect(tileData!.type).to.equal(TileType.WATER);
        });
    });

    describe('World Coordinate Queries', () => {
        it('should get tile data by world coordinates', () => {
            // World coords for grid (2, 2) = (32, 32) center = (40, 40)
            const tileData = grid.getTileAtWorldPos(40, 40);
            expect(tileData).to.not.be.null;
            expect(tileData!.type).to.equal(TileType.GRASS);
        });

        it('should get tile at world coordinate edges', () => {
            // Grid (0, 0) = world (0, 0) to (16, 16)
            const tileData = grid.getTileAtWorldPos(8, 8);
            expect(tileData).to.not.be.null;
            expect(tileData!.type).to.equal(TileType.WATER);
        });

        it('should return null for world coordinates outside grid', () => {
            const worldSize = 5 * TILE_SIZE; // 80 pixels
            expect(grid.getTileAtWorldPos(-10, 0)).to.be.null;
            expect(grid.getTileAtWorldPos(0, -10)).to.be.null;
            expect(grid.getTileAtWorldPos(worldSize + 10, 0)).to.be.null;
            expect(grid.getTileAtWorldPos(0, worldSize + 10)).to.be.null;
        });

        it('should handle world coordinates at tile boundaries', () => {
            // Test at exact boundary between tiles
            const tileData = grid.getTileAtWorldPos(16, 16);
            expect(tileData).to.not.be.null;
        });
    });

    describe('Tile Property Queries', () => {
        it('should check if position is walkable (grid coords)', () => {
            expect(grid.isWalkable(2, 2)).to.be.true;  // Grass
            expect(grid.isWalkable(0, 0)).to.be.false; // Water
        });

        it('should check if world position is walkable', () => {
            expect(grid.isWalkableWorld(40, 40)).to.be.true;  // Grass
            expect(grid.isWalkableWorld(8, 8)).to.be.false;   // Water
        });

        it('should return false for walkable check on out of bounds', () => {
            expect(grid.isWalkable(-1, 0)).to.be.false;
            expect(grid.isWalkableWorld(-10, 0)).to.be.false;
        });

        it('should get movement cost at grid position', () => {
            const grassCost = grid.getMovementCost(2, 2);
            expect(grassCost).to.equal(1.0); // Grass movement cost
        });

        it('should get movement cost at world position', () => {
            const grassCost = grid.getMovementCostWorld(40, 40);
            expect(grassCost).to.equal(1.0);
        });

        it('should return Infinity for movement cost on non-walkable tiles', () => {
            expect(grid.getMovementCost(0, 0)).to.equal(Infinity); // Water
        });

        it('should return Infinity for out of bounds movement cost', () => {
            expect(grid.getMovementCost(-1, 0)).to.equal(Infinity);
            expect(grid.getMovementCostWorld(-10, 0)).to.equal(Infinity);
        });
    });

    describe('Bounds Checking', () => {
        it('should check if grid coordinates are in bounds', () => {
            expect(grid.isInBounds(0, 0)).to.be.true;
            expect(grid.isInBounds(4, 4)).to.be.true;
            expect(grid.isInBounds(2, 2)).to.be.true;
        });

        it('should return false for out of bounds grid coordinates', () => {
            expect(grid.isInBounds(-1, 0)).to.be.false;
            expect(grid.isInBounds(0, -1)).to.be.false;
            expect(grid.isInBounds(5, 0)).to.be.false;
            expect(grid.isInBounds(0, 5)).to.be.false;
        });

        it('should check if world coordinates are in grid', () => {
            expect(grid.isInWorldBounds(0, 0)).to.be.true;
            expect(grid.isInWorldBounds(40, 40)).to.be.true;
            expect(grid.isInWorldBounds(79, 79)).to.be.true; // 5*16-1
        });

        it('should return false for out of bounds world coordinates', () => {
            expect(grid.isInWorldBounds(-1, 0)).to.be.false;
            expect(grid.isInWorldBounds(0, -1)).to.be.false;
            expect(grid.isInWorldBounds(80, 0)).to.be.false;
            expect(grid.isInWorldBounds(0, 80)).to.be.false;
        });
    });

    describe('Grid Access', () => {
        it('should provide direct access to underlying grid data', () => {
            const gridData = grid.getGrid();
            expect(gridData).to.be.an('array');
            expect(gridData.length).to.equal(5);
            expect(gridData[0].length).to.equal(5);
        });

        it('should return readonly grid reference', () => {
            const gridData = grid.getGrid();
            // Grid should be the actual reference, not a copy
            expect(gridData[2][2].type).to.equal(TileType.GRASS);
        });
    });

    describe('Pathfinding Integration', () => {
        it('should provide grid in format compatible with Pathfinder', () => {
            const gridData = grid.getGrid();
            // Pathfinder expects TileData[][]
            expect(gridData[0][0]).to.have.property('type');
            expect(gridData[0][0]).to.have.property('walkable');
            expect(gridData[0][0]).to.have.property('movementCost');
            expect(gridData[0][0]).to.have.property('spriteIndex');
        });
    });

    describe('Tile Type Queries', () => {
        it('should get tile type at grid position', () => {
            expect(grid.getTileType(2, 2)).to.equal(TileType.GRASS);
            expect(grid.getTileType(0, 0)).to.equal(TileType.WATER);
        });

        it('should get tile type at world position', () => {
            expect(grid.getTileTypeWorld(40, 40)).to.equal(TileType.GRASS);
            expect(grid.getTileTypeWorld(8, 8)).to.equal(TileType.WATER);
        });

        it('should return null for tile type out of bounds', () => {
            expect(grid.getTileType(-1, 0)).to.be.null;
            expect(grid.getTileTypeWorld(-10, 0)).to.be.null;
        });
    });

    describe('Edge Cases', () => {
        it('should handle 1x1 grid', () => {
            const tile = new Tile(0, 0, TileType.GRASS);
            const smallGrid = new TileGrid([[tile.toData()]]);
            
            expect(smallGrid.getWidth()).to.equal(1);
            expect(smallGrid.getHeight()).to.equal(1);
            expect(smallGrid.getTileDataAt(0, 0)).to.not.be.null;
        });

        it('should handle non-square grids', () => {
            // 3 rows, 5 cols
            const tiles: TileData[][] = [];
            for (let row = 0; row < 3; row++) {
                tiles[row] = [];
                for (let col = 0; col < 5; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    tiles[row][col] = tile.toData();
                }
            }
            const rectGrid = new TileGrid(tiles);
            
            expect(rectGrid.getWidth()).to.equal(5);
            expect(rectGrid.getHeight()).to.equal(3);
        });

        it('should handle large grid efficiently', () => {
            // Create 100x100 grid
            const tiles: TileData[][] = [];
            for (let row = 0; row < 100; row++) {
                tiles[row] = [];
                for (let col = 0; col < 100; col++) {
                    const tile = new Tile(col, row, TileType.GRASS);
                    tiles[row][col] = tile.toData();
                }
            }
            const largeGrid = new TileGrid(tiles);
            
            // Should be able to query without performance issues
            const start = Date.now();
            for (let i = 0; i < 1000; i++) {
                largeGrid.getTileAtWorldPos(800, 800);
            }
            const elapsed = Date.now() - start;
            
            expect(elapsed).to.be.lessThan(100); // Should be very fast
        });
    });

    describe('Coordinate Conversion Helpers', () => {
        it('should convert world to grid coordinates', () => {
            const result = grid.worldToGrid(40, 40);
            expect(result).to.not.be.null;
            expect(result!.col).to.equal(2);
            expect(result!.row).to.equal(2);
        });

        it('should handle world coordinates at tile boundaries', () => {
            const result = grid.worldToGrid(16, 16);
            expect(result).to.not.be.null;
            expect(result!.col).to.equal(1);
            expect(result!.row).to.equal(1);
        });

        it('should convert grid to world coordinates', () => {
            const { x, y } = grid.gridToWorld(2, 2);
            expect(x).to.equal(32);
            expect(y).to.equal(32);
        });

        it('should return null for world to grid conversion outside bounds', () => {
            const result = grid.worldToGrid(-10, -10);
            expect(result).to.be.null;
        });
    });
});
