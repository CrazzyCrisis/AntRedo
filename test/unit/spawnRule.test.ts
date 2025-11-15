/**
 * SpawnRule Unit Tests
 * Tests spawn validation logic and coordinate handling
 */

import { expect } from 'chai';
import { SpawnRuleValidator } from '../../src/spawning/SpawnRule';
import { TileType } from '../../src/world/TileSystem';

describe('SpawnRule Validation', () => {
    let mockTileGrid: any[][];
    
    beforeEach(() => {
        // Create 10x10 test grid with mixed tile types
        mockTileGrid = [];
        for (let row = 0; row < 10; row++) {
            mockTileGrid[row] = [];
            for (let col = 0; col < 10; col++) {
                // Checkerboard pattern: grass and dirt
                mockTileGrid[row][col] = {
                    type: (row + col) % 2 === 0 ? TileType.GRASS : TileType.DIRT,
                    walkable: true,
                    movementCost: 1.0,
                    spriteIndex: 0
                };
            }
        }
        
        // Add some water tiles (non-walkable) in corners
        mockTileGrid[0][0] = { type: TileType.WATER, walkable: false, movementCost: Infinity, spriteIndex: 5 };
        mockTileGrid[0][9] = { type: TileType.WATER, walkable: false, movementCost: Infinity, spriteIndex: 5 };
    });

    describe('Coordinate System', () => {
        it('should accept grid coordinates directly', () => {
            const constraints = {
                allowedTileTypes: [TileType.GRASS, TileType.DIRT, TileType.SAND]
            };

            // Test grid position (5, 5) - should be valid
            const result = SpawnRuleValidator.canSpawnAt(
                5, 5,
                constraints,
                mockTileGrid,
                null
            );

            expect(result.valid).to.be.true;
        });

        it('should reject out of bounds coordinates', () => {
            const constraints = {
                allowedTileTypes: [TileType.GRASS, TileType.DIRT]
            };

            // Test position outside grid
            const result = SpawnRuleValidator.canSpawnAt(
                15, 15,
                constraints,
                mockTileGrid,
                null
            );

            expect(result.valid).to.be.false;
            expect(result.reason).to.include('out of bounds');
        });

        it('should handle negative coordinates', () => {
            const constraints = {
                allowedTileTypes: [TileType.GRASS, TileType.DIRT]
            };

            const result = SpawnRuleValidator.canSpawnAt(
                -1, -1,
                constraints,
                mockTileGrid,
                null
            );

            expect(result.valid).to.be.false;
        });

        it('should floor decimal coordinates', () => {
            const constraints = {
                allowedTileTypes: [TileType.GRASS, TileType.DIRT]
            };

            // 5.7 should floor to 5
            const result = SpawnRuleValidator.canSpawnAt(
                5.7, 5.9,
                constraints,
                mockTileGrid,
                null
            );

            expect(result.valid).to.be.true;
        });
    });

    describe('Tile Type Validation', () => {
        it('should validate allowed tile types using TileType enum', () => {
            const constraints = {
                allowedTileTypes: [TileType.GRASS, TileType.DIRT]
            };

            // Position (1, 1) should be DIRT (checkerboard)
            const result = SpawnRuleValidator.canSpawnAt(
                1, 1,
                constraints,
                mockTileGrid,
                null
            );

            expect(result.valid).to.be.true;
        });

        it('should reject disallowed tile types', () => {
            const constraints = {
                allowedTileTypes: [TileType.GRASS, TileType.DIRT]
            };

            // Position (0, 0) is WATER
            const result = SpawnRuleValidator.canSpawnAt(
                0, 0,
                constraints,
                mockTileGrid,
                null
            );

            expect(result.valid).to.be.false;
            expect(result.reason).to.include('not in allowed types');
        });

        it('should handle TileType enum numbers correctly', () => {
            // GRASS = 0, DIRT = 1
            const constraints = {
                allowedTileTypes: [TileType.GRASS] // Only grass (0)
            };

            // Position (0, 2) should be GRASS (even sum)
            const result = SpawnRuleValidator.canSpawnAt(
                2, 0,
                constraints,
                mockTileGrid,
                null
            );

            expect(result.valid).to.be.true;
        });
    });

    describe('Distance Validation', () => {
        it('should validate minimum distance from entities', () => {
            const mockEntityManager = {
                getAllEntities: () => [
                    { x: 5, y: 5 }
                ]
            };

            const constraints = {
                allowedTileTypes: [TileType.GRASS, TileType.DIRT],
                minDistanceFromEntities: 3
            };

            // Position (7, 7) is distance 2.83 from (5, 5) - should fail
            const result1 = SpawnRuleValidator.canSpawnAt(
                7, 7,
                constraints,
                mockTileGrid,
                mockEntityManager
            );

            expect(result1.valid).to.be.false;
            expect(result1.reason).to.include('Too close to entity');

            // Position (9, 9) is distance 5.66 from (5, 5) - should pass
            const result2 = SpawnRuleValidator.canSpawnAt(
                9, 9,
                constraints,
                mockTileGrid,
                mockEntityManager
            );

            expect(result2.valid).to.be.true;
        });
    });

    describe('Default Constraints', () => {
        it('should provide ant constraints with correct TileType enums', () => {
            const constraints = SpawnRuleValidator.getDefaultConstraints('ant');
            
            expect(constraints.allowedTileTypes).to.include(TileType.GRASS);
            expect(constraints.allowedTileTypes).to.include(TileType.DIRT);
            expect(constraints.allowedTileTypes).to.include(TileType.SAND);
            expect(constraints.minDistanceFromEntities).to.equal(8);
        });

        it('should provide resource constraints with correct TileType enums', () => {
            const constraints = SpawnRuleValidator.getDefaultConstraints('resource');
            
            expect(constraints.allowedTileTypes).to.include(TileType.GRASS);
            expect(constraints.allowedTileTypes).to.include(TileType.DIRT);
            expect(constraints.allowedTileTypes).to.include(TileType.SAND);
            expect(constraints.allowedTileTypes).to.include(TileType.STONE);
            expect(constraints.minDistanceFromEntities).to.equal(16);
        });
    });
});
