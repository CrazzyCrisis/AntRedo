/**
 * Tests for Tile System (TileType, TileData, Tile class)
 * Following TDD - tests written BEFORE implementation
 */

import { expect } from 'chai';
import { TileType, TileData, Tile, TILE_PROPERTIES } from '../../src/world/TileSystem';

describe('TileSystem', () => {
    describe('TileType Enum', () => {
        it('should define all available tile types', () => {
            expect(TileType.GRASS).to.exist;
            expect(TileType.DIRT).to.exist;
            expect(TileType.STONE).to.exist;
            expect(TileType.SAND).to.exist;
            expect(TileType.WATER).to.exist;
            expect(TileType.CAVE_FLOOR).to.exist;
            expect(TileType.CAVE_WALL).to.exist;
        });

        it('should have unique numeric values', () => {
            const values = Object.values(TileType).filter(v => typeof v === 'number');
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).to.equal(values.length);
        });
    });

    describe('TILE_PROPERTIES', () => {
        it('should define properties for all tile types', () => {
            expect(TILE_PROPERTIES[TileType.GRASS]).to.exist;
            expect(TILE_PROPERTIES[TileType.DIRT]).to.exist;
            expect(TILE_PROPERTIES[TileType.STONE]).to.exist;
            expect(TILE_PROPERTIES[TileType.WATER]).to.exist;
        });

        it('should define walkable property for each tile', () => {
            expect(TILE_PROPERTIES[TileType.GRASS].walkable).to.be.a('boolean');
            expect(TILE_PROPERTIES[TileType.WATER].walkable).to.be.a('boolean');
        });

        it('should define movementCost for each tile', () => {
            expect(TILE_PROPERTIES[TileType.GRASS].movementCost).to.be.a('number');
            expect(TILE_PROPERTIES[TileType.GRASS].movementCost).to.be.greaterThan(0);
        });

        it('should define spriteIndex for each tile', () => {
            expect(TILE_PROPERTIES[TileType.GRASS].spriteIndex).to.be.a('number');
            expect(TILE_PROPERTIES[TileType.GRASS].spriteIndex).to.be.at.least(0);
        });

        it('should make water non-walkable', () => {
            expect(TILE_PROPERTIES[TileType.WATER].walkable).to.be.false;
        });

        it('should make grass walkable with low cost', () => {
            expect(TILE_PROPERTIES[TileType.GRASS].walkable).to.be.true;
            expect(TILE_PROPERTIES[TileType.GRASS].movementCost).to.equal(1.0);
        });

        it('should make sand walkable with higher cost than grass', () => {
            expect(TILE_PROPERTIES[TileType.SAND].walkable).to.be.true;
            expect(TILE_PROPERTIES[TileType.SAND].movementCost).to.be.greaterThan(
                TILE_PROPERTIES[TileType.GRASS].movementCost
            );
        });

        it('should assign unique sprite indices', () => {
            const indices = Object.values(TILE_PROPERTIES).map(p => p.spriteIndex);
            const uniqueIndices = new Set(indices);
            expect(uniqueIndices.size).to.equal(indices.length);
        });
    });

    describe('Tile Class', () => {
        describe('Initialization', () => {
            it('should create tile with grid position and type', () => {
                const tile = new Tile(5, 10, TileType.GRASS);
                expect(tile.col).to.equal(5);
                expect(tile.row).to.equal(10);
                expect(tile.type).to.equal(TileType.GRASS);
            });

            it('should load properties from TILE_PROPERTIES', () => {
                const tile = new Tile(0, 0, TileType.WATER);
                expect(tile.walkable).to.equal(TILE_PROPERTIES[TileType.WATER].walkable);
                expect(tile.movementCost).to.equal(TILE_PROPERTIES[TileType.WATER].movementCost);
                expect(tile.spriteIndex).to.equal(TILE_PROPERTIES[TileType.WATER].spriteIndex);
            });

            it('should create grass tile correctly', () => {
                const tile = new Tile(1, 2, TileType.GRASS);
                expect(tile.walkable).to.be.true;
                expect(tile.movementCost).to.equal(1.0);
            });

            it('should create water tile correctly', () => {
                const tile = new Tile(3, 4, TileType.WATER);
                expect(tile.walkable).to.be.false;
            });
        });

        describe('World Position Conversion', () => {
            it('should convert grid position to world coordinates', () => {
                const tile = new Tile(2, 3, TileType.GRASS);
                const worldPos = tile.getWorldPosition();
                
                // TILE_SIZE = 32, so (2,3) -> (64, 96)
                expect(worldPos.x).to.equal(64);
                expect(worldPos.y).to.equal(96);
            });

            it('should provide world center position', () => {
                const tile = new Tile(1, 1, TileType.GRASS);
                const center = tile.getWorldCenter();
                
                // Center should be at tile position + half tile size: (1*32+16, 1*32+16) = (48, 48)
                expect(center.x).to.equal(48);
                expect(center.y).to.equal(48);
            });
        });

        describe('Neighbor Queries', () => {
            it('should calculate neighbor grid positions (4-directional)', () => {
                const tile = new Tile(5, 5, TileType.GRASS);
                const neighbors = tile.getNeighbor4Positions();
                
                expect(neighbors).to.have.lengthOf(4);
                expect(neighbors).to.deep.include({ col: 5, row: 4 }); // Up
                expect(neighbors).to.deep.include({ col: 5, row: 6 }); // Down
                expect(neighbors).to.deep.include({ col: 4, row: 5 }); // Left
                expect(neighbors).to.deep.include({ col: 6, row: 5 }); // Right
            });

            it('should calculate neighbor grid positions (8-directional)', () => {
                const tile = new Tile(5, 5, TileType.GRASS);
                const neighbors = tile.getNeighbor8Positions();
                
                expect(neighbors).to.have.lengthOf(8);
                expect(neighbors).to.deep.include({ col: 4, row: 4 }); // Up-Left
                expect(neighbors).to.deep.include({ col: 6, row: 6 }); // Down-Right
            });
        });

        describe('Distance Calculations', () => {
            it('should calculate Manhattan distance to another position', () => {
                const tile = new Tile(0, 0, TileType.GRASS);
                const distance = tile.manhattanDistanceTo(3, 4);
                
                expect(distance).to.equal(7); // |3-0| + |4-0| = 7
            });

            it('should calculate Euclidean distance to another position', () => {
                const tile = new Tile(0, 0, TileType.GRASS);
                const distance = tile.euclideanDistanceTo(3, 4);
                
                expect(distance).to.equal(5); // sqrt(3^2 + 4^2) = 5
            });

            it('should calculate distance to tile at same position as 0', () => {
                const tile = new Tile(5, 5, TileType.GRASS);
                expect(tile.manhattanDistanceTo(5, 5)).to.equal(0);
                expect(tile.euclideanDistanceTo(5, 5)).to.equal(0);
            });
        });

        describe('Type Checking', () => {
            it('should check if tile is specific type', () => {
                const tile = new Tile(0, 0, TileType.WATER);
                expect(tile.isType(TileType.WATER)).to.be.true;
                expect(tile.isType(TileType.GRASS)).to.be.false;
            });

            it('should check if tile is in type group', () => {
                const caveTile = new Tile(0, 0, TileType.CAVE_FLOOR);
                expect(caveTile.isOneOf([TileType.CAVE_FLOOR, TileType.CAVE_WALL])).to.be.true;
                expect(caveTile.isOneOf([TileType.GRASS, TileType.DIRT])).to.be.false;
            });
        });

        describe('TileData Interface', () => {
            it('should convert to TileData format for storage', () => {
                const tile = new Tile(2, 3, TileType.SAND);
                const data: TileData = tile.toData();
                
                expect(data.type).to.equal(TileType.SAND);
                expect(data.walkable).to.equal(tile.walkable);
                expect(data.movementCost).to.equal(tile.movementCost);
                expect(data.spriteIndex).to.equal(tile.spriteIndex);
            });

            it('should create Tile from TileData', () => {
                const data: TileData = {
                    type: TileType.STONE,
                    walkable: true,
                    movementCost: 1.3,
                    spriteIndex: 2
                };
                
                const tile = Tile.fromData(5, 10, data);
                expect(tile.col).to.equal(5);
                expect(tile.row).to.equal(10);
                expect(tile.type).to.equal(data.type);
                // Properties come from TILE_PROPERTIES, not data
                expect(tile.walkable).to.equal(TILE_PROPERTIES[TileType.STONE].walkable);
                expect(tile.movementCost).to.equal(TILE_PROPERTIES[TileType.STONE].movementCost);
            });
        });
    });
});
