/**
 * ClusterSpawner Unit Tests
 * Tests spawn position generation algorithms
 */

import { expect } from 'chai';
import { ClusterSpawner } from '../../src/spawning/ClusterSpawner';
import { TileType } from '../../src/world/TileSystem';

describe('ClusterSpawner Position Generation', () => {
    let mockTileGrid: any[][];
    
    beforeEach(() => {
        // Create 200x200 test grid (same as DevRoom)
        mockTileGrid = [];
        for (let row = 0; row < 200; row++) {
            mockTileGrid[row] = [];
            for (let col = 0; col < 200; col++) {
                mockTileGrid[row][col] = {
                    type: TileType.GRASS,
                    walkable: true,
                    movementCost: 1.0,
                    spriteIndex: 0
                };
            }
        }
    });

    describe('Radial Cluster Spawning', () => {
        it('should generate positions around center point', () => {
            const center = { x: 100, y: 100 };
            const count = 10;
            const radius = 5;
            const constraints = {
                allowedTileTypes: [TileType.GRASS]
            };

            const positions = ClusterSpawner.spawnRadialCluster(
                center,
                count,
                radius,
                constraints,
                mockTileGrid,
                null
            );

            console.log(`[Test] Generated ${positions.length} positions around (${center.x}, ${center.y}) with radius ${radius}`);
            positions.forEach((pos, i) => {
                const distance = Math.sqrt(Math.pow(pos.x - center.x, 2) + Math.pow(pos.y - center.y, 2));
                console.log(`  Position ${i}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}) - distance: ${distance.toFixed(2)}`);
            });

            expect(positions.length).to.be.greaterThan(0);
            expect(positions.length).to.be.lessThanOrEqual(count);

            // Check all positions are within radius
            positions.forEach(pos => {
                const distance = Math.sqrt(
                    Math.pow(pos.x - center.x, 2) + 
                    Math.pow(pos.y - center.y, 2)
                );
                expect(distance).to.be.lessThanOrEqual(radius);
            });
        });

        it('should generate positions in grid coordinate space', () => {
            const center = { x: 100, y: 100 };
            const count = 5;
            const radius = 10;
            const constraints = {
                allowedTileTypes: [TileType.GRASS]
            };

            const positions = ClusterSpawner.spawnRadialCluster(
                center,
                count,
                radius,
                constraints,
                mockTileGrid,
                null
            );

            console.log(`[Test] Coordinate space check for center (${center.x}, ${center.y}):`);
            positions.forEach(pos => {
                console.log(`  Generated: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
                
                // Positions should be in similar magnitude to center
                expect(pos.x).to.be.greaterThan(85);
                expect(pos.x).to.be.lessThan(115);
                expect(pos.y).to.be.greaterThan(85);
                expect(pos.y).to.be.lessThan(115);
            });
        });

        it('should spread positions around center', () => {
            const center = { x: 100, y: 100 };
            const count = 20;
            const radius = 8;
            const constraints = {
                allowedTileTypes: [TileType.GRASS]
            };

            const positions = ClusterSpawner.spawnRadialCluster(
                center,
                count,
                radius,
                constraints,
                mockTileGrid,
                null
            );

            // Calculate average position
            let avgX = 0, avgY = 0;
            positions.forEach(pos => {
                avgX += pos.x;
                avgY += pos.y;
            });
            avgX /= positions.length;
            avgY /= positions.length;

            console.log(`[Test] Average position: (${avgX.toFixed(2)}, ${avgY.toFixed(2)}) vs center (${center.x}, ${center.y})`);

            // Average should be close to center (within 2 units)
            expect(Math.abs(avgX - center.x)).to.be.lessThan(2);
            expect(Math.abs(avgY - center.y)).to.be.lessThan(2);
        });
    });

    describe('Poisson Disk Sampling', () => {
        it('should generate evenly spaced positions', () => {
            const bounds = {
                x: 90,
                y: 90,
                width: 20,
                height: 20
            };
            const minDistance = 3;
            const constraints = {
                allowedTileTypes: [TileType.GRASS]
            };

            const positions = ClusterSpawner.spawnPoissonDisk(
                bounds,
                minDistance,
                constraints,
                mockTileGrid,
                null
            );

            console.log(`[Test] Poisson disk generated ${positions.length} positions`);
            console.log(`  Bounds: (${bounds.x}, ${bounds.y}) to (${bounds.x + bounds.width}, ${bounds.y + bounds.height})`);
            
            expect(positions.length).to.be.greaterThan(0);

            // Check all positions within bounds
            positions.forEach((pos, i) => {
                console.log(`  Position ${i}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
                
                expect(pos.x).to.be.at.least(bounds.x);
                expect(pos.x).to.be.at.most(bounds.x + bounds.width);
                expect(pos.y).to.be.at.least(bounds.y);
                expect(pos.y).to.be.at.most(bounds.y + bounds.height);
            });

            // Check minimum distance between all pairs
            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    const dist = Math.sqrt(
                        Math.pow(positions[i].x - positions[j].x, 2) +
                        Math.pow(positions[i].y - positions[j].y, 2)
                    );
                    expect(dist).to.be.at.least(minDistance);
                }
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle small radius gracefully', () => {
            const center = { x: 100, y: 100 };
            const count = 5;
            const radius = 1;
            const constraints = {
                allowedTileTypes: [TileType.GRASS]
            };

            const positions = ClusterSpawner.spawnRadialCluster(
                center,
                count,
                radius,
                constraints,
                mockTileGrid,
                null
            );

            console.log(`[Test] Small radius (${radius}) generated ${positions.length} positions`);
            expect(positions.length).to.be.greaterThan(0);
        });

        it('should handle center at grid boundaries', () => {
            const center = { x: 10, y: 10 };
            const count = 5;
            const radius = 5;
            const constraints = {
                allowedTileTypes: [TileType.GRASS]
            };

            const positions = ClusterSpawner.spawnRadialCluster(
                center,
                count,
                radius,
                constraints,
                mockTileGrid,
                null
            );

            console.log(`[Test] Near boundary center (${center.x}, ${center.y}) generated ${positions.length} positions`);
            expect(positions.length).to.be.greaterThan(0);
            
            positions.forEach(pos => {
                expect(pos.x).to.be.at.least(0);
                expect(pos.y).to.be.at.least(0);
                expect(pos.x).to.be.lessThan(200);
                expect(pos.y).to.be.lessThan(200);
            });
        });
    });
});
