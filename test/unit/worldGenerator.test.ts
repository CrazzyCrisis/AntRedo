/**
 * Tests for WorldGenerator
 * Following TDD - tests written BEFORE implementation
 */

import { expect } from 'chai';
import { WorldGenerator } from '../../src/world/WorldGenerator';
import { TileType } from '../../src/world/TileSystem';

describe('WorldGenerator', () => {
    let generator: WorldGenerator;

    beforeEach(() => {
        generator = new WorldGenerator();
    });

    describe('Basic Generation', () => {
        it('should generate a grid with specified dimensions', () => {
            const grid = generator.generate(10, 10);
            
            expect(grid).to.be.an('array');
            expect(grid.length).to.equal(10); // rows
            expect(grid[0].length).to.equal(10); // cols
        });

        it('should generate tiles with valid types', () => {
            const grid = generator.generate(5, 5);
            
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const tile = grid[row][col];
                    expect(tile).to.have.property('type');
                    expect(tile).to.have.property('walkable');
                    expect(tile).to.have.property('movementCost');
                    expect(tile).to.have.property('spriteIndex');
                }
            }
        });

        it('should handle different dimensions', () => {
            const grid1 = generator.generate(3, 7);
            expect(grid1.length).to.equal(7);
            expect(grid1[0].length).to.equal(3);

            const grid2 = generator.generate(20, 15);
            expect(grid2.length).to.equal(15);
            expect(grid2[0].length).to.equal(20);
        });

        it('should handle minimum dimensions', () => {
            const grid = generator.generate(1, 1);
            expect(grid.length).to.equal(1);
            expect(grid[0].length).to.equal(1);
        });
    });

    describe('Seeded Generation', () => {
        it('should generate same world with same seed', () => {
            const grid1 = generator.generate(10, 10, 42);
            const grid2 = generator.generate(10, 10, 42);

            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    expect(grid1[row][col].type).to.equal(grid2[row][col].type);
                }
            }
        });

        it('should generate different worlds with different seeds', () => {
            const grid1 = generator.generate(10, 10, 42);
            const grid2 = generator.generate(10, 10, 123);

            let hasDifference = false;
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    if (grid1[row][col].type !== grid2[row][col].type) {
                        hasDifference = true;
                        break;
                    }
                }
                if (hasDifference) break;
            }

            expect(hasDifference).to.be.true;
        });

        it('should use random seed if not provided', () => {
            const grid1 = generator.generate(10, 10);
            const grid2 = generator.generate(10, 10);

            // Extremely unlikely to be identical without seed
            let hasDifference = false;
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    if (grid1[row][col].type !== grid2[row][col].type) {
                        hasDifference = true;
                        break;
                    }
                }
                if (hasDifference) break;
            }

            expect(hasDifference).to.be.true;
        });
    });

    describe('Tile Distribution', () => {
        it('should generate multiple tile types', () => {
            const grid = generator.generate(20, 20, 42);
            const types = new Set<TileType>();

            for (let row = 0; row < 20; row++) {
                for (let col = 0; col < 20; col++) {
                    types.add(grid[row][col].type);
                }
            }

            expect(types.size).to.be.greaterThan(1);
        });

        it('should have walkable and non-walkable tiles', () => {
            const grid = generator.generate(20, 20, 42);
            let hasWalkable = false;
            let hasNonWalkable = false;

            for (let row = 0; row < 20; row++) {
                for (let col = 0; col < 20; col++) {
                    if (grid[row][col].walkable) {
                        hasWalkable = true;
                    } else {
                        hasNonWalkable = true;
                    }
                }
            }

            expect(hasWalkable).to.be.true;
            expect(hasNonWalkable).to.be.true;
        });

        it('should use grass as common tile type', () => {
            const grid = generator.generate(20, 20, 42);
            let grassCount = 0;

            for (let row = 0; row < 20; row++) {
                for (let col = 0; col < 20; col++) {
                    if (grid[row][col].type === TileType.GRASS) {
                        grassCount++;
                    }
                }
            }

            expect(grassCount).to.be.greaterThan(0);
        });
    });

    describe('Noise Configuration', () => {
        it('should allow setting noise scale', () => {
            generator.setNoiseScale(0.1);
            const grid1 = generator.generate(10, 10, 42);

            generator.setNoiseScale(0.5);
            const grid2 = generator.generate(10, 10, 42);

            // Different scales should produce different results
            let hasDifference = false;
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    if (grid1[row][col].type !== grid2[row][col].type) {
                        hasDifference = true;
                        break;
                    }
                }
                if (hasDifference) break;
            }

            expect(hasDifference).to.be.true;
        });

        it('should have default noise scale', () => {
            const scale = generator.getNoiseScale();
            expect(scale).to.be.a('number');
            expect(scale).to.be.greaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle large grids', () => {
            const grid = generator.generate(100, 100);
            expect(grid.length).to.equal(100);
            expect(grid[0].length).to.equal(100);
        });

        it('should generate valid tile data for all positions', () => {
            const grid = generator.generate(10, 10, 42);

            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const tile = grid[row][col];
                    expect(tile.type).to.be.a('number');
                    expect(tile.walkable).to.be.a('boolean');
                    expect(tile.movementCost).to.be.a('number');
                    expect(tile.spriteIndex).to.be.a('number');
                }
            }
        });
    });
});
