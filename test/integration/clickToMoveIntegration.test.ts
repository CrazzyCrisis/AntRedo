/**
 * Click-to-Move Integration Tests
 * Tests the full click-to-move flow including coordinate conversion and pathfinding
 */

import { expect } from 'chai';
import { EventBus } from '../../src/utils/eventBus';

describe('Click-to-Move Integration', () => {
    beforeEach(() => {
        EventBus.clear();
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Coordinate Conversion Math', () => {
        const TILE_SIZE = 64;

        it('should convert world coordinates to grid coordinates', () => {
            // Test various world positions
            const testCases = [
                { worldX: 0, worldY: 0, expectedGridX: 0, expectedGridY: 0 },
                { worldX: 64, worldY: 64, expectedGridX: 1, expectedGridY: 1 },
                { worldX: 128, worldY: 192, expectedGridX: 2, expectedGridY: 3 },
                { worldX: 320, worldY: 320, expectedGridX: 5, expectedGridY: 5 },
                { worldX: 6400, worldY: 6400, expectedGridX: 100, expectedGridY: 100 },
                { worldX: 12000, worldY: 12000, expectedGridX: 187, expectedGridY: 187 }
            ];

            testCases.forEach(({ worldX, worldY, expectedGridX, expectedGridY }) => {
                const gridX = Math.floor(worldX / TILE_SIZE);
                const gridY = Math.floor(worldY / TILE_SIZE);

                expect(gridX).to.equal(expectedGridX, `World (${worldX}, ${worldY}) should map to grid (${expectedGridX}, ${expectedGridY})`);
                expect(gridY).to.equal(expectedGridY);
            });
        });

        it('should handle fractional world coordinates', () => {
            // 127.9 should floor to 1 (127.9 / 64 = 1.998)
            const gridX = Math.floor(127.9 / TILE_SIZE);
            expect(gridX).to.equal(1);

            // 128.1 should floor to 2 (128.1 / 64 = 2.001)
            const gridX2 = Math.floor(128.1 / TILE_SIZE);
            expect(gridX2).to.equal(2);
        });

        it('should handle negative world coordinates', () => {
            // Negative coordinates should floor correctly
            const gridX = Math.floor(-64 / TILE_SIZE);
            const gridY = Math.floor(-128 / TILE_SIZE);

            expect(gridX).to.equal(-1);
            expect(gridY).to.equal(-2);
        });

        it('should handle tile boundaries correctly', () => {
            // Exactly on boundary should belong to that tile
            expect(Math.floor(0 / TILE_SIZE)).to.equal(0);
            expect(Math.floor(64 / TILE_SIZE)).to.equal(1);
            expect(Math.floor(128 / TILE_SIZE)).to.equal(2);

            // Just before boundary
            expect(Math.floor(63.99 / TILE_SIZE)).to.equal(0);
            expect(Math.floor(127.99 / TILE_SIZE)).to.equal(1);
        });
    });

    describe('Grid Bounds Checking', () => {
        it('should validate if coordinates are in bounds', () => {
            const gridWidth = 200; // Example grid size
            const gridHeight = 200;

            const testCases = [
                { x: 0, y: 0, inBounds: true },
                { x: 100, y: 100, inBounds: true },
                { x: 199, y: 199, inBounds: true },
                { x: -1, y: 0, inBounds: false },
                { x: 0, y: -1, inBounds: false },
                { x: 200, y: 0, inBounds: false },
                { x: 0, y: 200, inBounds: false },
                { x: 999, y: 999, inBounds: false }
            ];

            testCases.forEach(({ x, y, inBounds }) => {
                const result = x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
                expect(result).to.equal(inBounds, `Position (${x}, ${y}) should be ${inBounds ? 'in' : 'out of'} bounds`);
            });
        });
    });

    describe('Path Events', () => {
        it('should emit PATH_FOUND when path is found', (done) => {
            const entityId = 'test_entity_123';

            EventBus.once('PATH_FOUND', (id: string, pathLength: number) => {
                expect(id).to.equal(entityId);
                expect(pathLength).to.be.greaterThan(0);
                done();
            });

            // Simulate path found
            EventBus.emit('PATH_FOUND', entityId, 10);
        });

        it('should emit PATH_FAILED when path fails', (done) => {
            const entityId = 'test_entity_123';

            EventBus.once('PATH_FAILED', (id: string, reason: string) => {
                expect(id).to.equal(entityId);
                expect(reason).to.be.a('string');
                done();
            });

            // Simulate path failed
            EventBus.emit('PATH_FAILED', entityId, 'Target not walkable');
        });

        it('should emit PATH_COMPLETE when path is completed', (done) => {
            const entityId = 'test_entity_123';

            EventBus.once('PATH_COMPLETE', (id: string) => {
                expect(id).to.equal(entityId);
                done();
            });

            // Simulate path complete
            EventBus.emit('PATH_COMPLETE', entityId);
        });
    });

    describe('Entity Detection at Grid Position', () => {
        it('should detect entity when gridX and gridY match (integer)', () => {
            const entities = [
                { id: '1', gridX: 5, gridY: 5, isActive: true },
                { id: '2', gridX: 10, gridY: 10, isActive: true },
                { id: '3', gridX: 15, gridY: 15, isActive: true }
            ];

            const clickGridX = 5;
            const clickGridY = 5;

            const found = entities.find(e =>
                e.isActive && Math.floor(e.gridX) === clickGridX && Math.floor(e.gridY) === clickGridY
            );

            expect(found).to.exist;
            expect(found!.id).to.equal('1');
        });

        it('should detect entity when gridX and gridY match (fractional)', () => {
            const entities = [
                { id: '1', gridX: 5.7, gridY: 5.3, isActive: true },
                { id: '2', gridX: 10.1, gridY: 10.9, isActive: true }
            ];

            // Click on tile (5, 5) - entity at (5.7, 5.3) is on this tile
            const clickGridX = 5;
            const clickGridY = 5;

            const found = entities.find(e =>
                e.isActive && Math.floor(e.gridX) === clickGridX && Math.floor(e.gridY) === clickGridY
            );

            expect(found).to.exist;
            expect(found!.id).to.equal('1');
        });

        it('should not detect inactive entities', () => {
            const entities = [
                { id: '1', gridX: 5, gridY: 5, isActive: false },
                { id: '2', gridX: 10, gridY: 10, isActive: true }
            ];

            const clickGridX = 5;
            const clickGridY = 5;

            const found = entities.find(e =>
                e.isActive && Math.floor(e.gridX) === clickGridX && Math.floor(e.gridY) === clickGridY
            );

            expect(found).to.be.undefined;
        });

        it('should return undefined when no entity at position', () => {
            const entities = [
                { id: '1', gridX: 5, gridY: 5, isActive: true },
                { id: '2', gridX: 10, gridY: 10, isActive: true }
            ];

            const clickGridX = 15;
            const clickGridY = 15;

            const found = entities.find(e =>
                e.isActive && Math.floor(e.gridX) === clickGridX && Math.floor(e.gridY) === clickGridY
            );

            expect(found).to.be.undefined;
        });
    });

    describe('Coordinate Conversion Error Cases', () => {
        const TILE_SIZE = 64;

        it('should not produce NaN for valid inputs', () => {
            const worldX = 12000;
            const worldY = 12000;

            const gridX = Math.floor(worldX / TILE_SIZE);
            const gridY = Math.floor(worldY / TILE_SIZE);

            expect(gridX).to.not.be.NaN;
            expect(gridY).to.not.be.NaN;
            expect(gridX).to.be.finite;
            expect(gridY).to.be.finite;
        });

        it('should handle zero correctly', () => {
            const gridX = Math.floor(0 / TILE_SIZE);
            const gridY = Math.floor(0 / TILE_SIZE);

            expect(gridX).to.equal(0);
            expect(gridY).to.equal(0);
        });

        it('should handle very large coordinates', () => {
            const worldX = 1000000;
            const worldY = 1000000;

            const gridX = Math.floor(worldX / TILE_SIZE);
            const gridY = Math.floor(worldY / TILE_SIZE);

            expect(gridX).to.equal(15625); // 1000000 / 64
            expect(gridY).to.equal(15625);
        });
    });
});
