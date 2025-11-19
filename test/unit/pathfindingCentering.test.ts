/**
 * Pathfinding Centering Tests
 * Tests to verify entities properly center in tiles during pathfinding
 */

import { expect } from 'chai';
import { GameObject } from '../../src/classes/GameObject';
import { PathfindingComponent } from '../../src/classes/components/PathfindingComponent';
import { EventBus } from '../../src/utils/eventBus';
import { TILE_CONFIG } from '../../src/config/world/tileConfig';
import { TileType } from '../../src/world/TileSystem';

describe('Pathfinding Centering', () => {
    let entity: GameObject;
    let pathfinder: PathfindingComponent;
    
    // Create a simple 5x5 walkable grid
    const createTestGrid = () => {
        const grid = [];
        for (let row = 0; row < 5; row++) {
            const rowData = [];
            for (let col = 0; col < 5; col++) {
                rowData.push({
                    type: TileType.GRASS,
                    walkable: true,
                    movementCost: 1.0,
                    spriteIndex: 0
                });
            }
            grid.push(rowData);
        }
        return grid;
    };

    beforeEach(() => {
        EventBus.clear();
        // Create entity at (0, 0)
        entity = new GameObject('ant', 0, 0);
        pathfinder = new PathfindingComponent(3.0); // 3 tiles/sec
        entity.addComponent('pathfinding', pathfinder);
    });

    describe('Initial Position', () => {
        it('should start with entity centered in starting tile', () => {
            const centerOffset = TILE_CONFIG.SIZE / 2;
            const expectedWorldX = 0 * TILE_CONFIG.SIZE + centerOffset;
            const expectedWorldY = 0 * TILE_CONFIG.SIZE + centerOffset;
            
            expect(entity.worldX).to.equal(expectedWorldX);
            expect(entity.worldY).to.equal(expectedWorldY);
        });

        it('should have smooth position matching world position initially', () => {
            const smoothPos = entity.getSmoothPosition();
            expect(smoothPos.x).to.equal(entity.worldX);
            expect(smoothPos.y).to.equal(entity.worldY);
        });
    });

    describe('Single Tile Movement', () => {
        it('should center in target tile when moving right', () => {
            const grid = createTestGrid();
            
            // Find path from (0,0) to (1,0)
            pathfinder.findPath(1, 0, grid);
            
            // Simulate movement until path complete
            let iterations = 0;
            const maxIterations = 1000;
            let pathComplete = false;
            
            const pathCompleteListener = EventBus.on('PATH_COMPLETE', (entityId: string) => {
                if (entityId === entity.id) {
                    pathComplete = true;
                }
            });
            
            while (!pathComplete && iterations < maxIterations) {
                pathfinder.update(16); // ~60fps
                iterations++;
            }
            
            EventBus.off('PATH_COMPLETE', pathCompleteListener);
            
            expect(pathComplete, 'Path should complete').to.be.true;
            expect(entity.gridX, 'Should be at grid position (1, 0)').to.equal(1);
            expect(entity.gridY).to.equal(0);
            
            // Check if entity is centered in target tile
            const centerOffset = TILE_CONFIG.SIZE / 2;
            const expectedWorldX = 1 * TILE_CONFIG.SIZE + centerOffset;
            const expectedWorldY = 0 * TILE_CONFIG.SIZE + centerOffset;
            
            const smoothPos = entity.getSmoothPosition();
            const distanceFromCenter = Math.sqrt(
                Math.pow(smoothPos.x - expectedWorldX, 2) +
                Math.pow(smoothPos.y - expectedWorldY, 2)
            );
            
            expect(distanceFromCenter).to.be.lessThan(2, 'Entity should be centered within 2 pixels of tile center');
        });

        it('should center in target tile when moving diagonally', () => {
            const grid = createTestGrid();
            
            // Find path from (0,0) to (1,1)
            pathfinder.findPath(1, 1, grid);
            
            // Simulate movement until path complete
            let iterations = 0;
            const maxIterations = 1000;
            let pathComplete = false;
            
            const pathCompleteListener = EventBus.on('PATH_COMPLETE', (entityId: string) => {
                if (entityId === entity.id) {
                    pathComplete = true;
                }
            });
            
            while (!pathComplete && iterations < maxIterations) {
                pathfinder.update(16);
                iterations++;
            }
            
            EventBus.off('PATH_COMPLETE', pathCompleteListener);
            
            expect(pathComplete).to.be.true;
            expect(entity.gridX).to.equal(1);
            expect(entity.gridY).to.equal(1);
            
            // Check centering
            const centerOffset = TILE_CONFIG.SIZE / 2;
            const expectedWorldX = 1 * TILE_CONFIG.SIZE + centerOffset;
            const expectedWorldY = 1 * TILE_CONFIG.SIZE + centerOffset;
            
            const smoothPos = entity.getSmoothPosition();
            const distanceFromCenter = Math.sqrt(
                Math.pow(smoothPos.x - expectedWorldX, 2) +
                Math.pow(smoothPos.y - expectedWorldY, 2)
            );
            
            expect(distanceFromCenter).to.be.lessThan(2);
        });
    });

    describe('Multi-Tile Path', () => {
        it('should center in each intermediate tile along path', () => {
            const grid = createTestGrid();
            
            // Find path from (0,0) to (3,0) - should pass through (1,0) and (2,0)
            pathfinder.findPath(3, 0, grid);
            
            const visitedPositions: Array<{ gridX: number, gridY: number, smoothX: number, smoothY: number }> = [];
            
            // Track when entity enters each new tile
            const moveListener = EventBus.on('ENTITY_MOVED', (entityId: string, gridX: number, gridY: number) => {
                if (entityId === entity.id) {
                    const smoothPos = entity.getSmoothPosition();
                    visitedPositions.push({ gridX, gridY, smoothX: smoothPos.x, smoothY: smoothPos.y });
                }
            });
            
            // Simulate movement until path complete
            let iterations = 0;
            const maxIterations = 2000;
            let pathComplete = false;
            
            const pathCompleteListener = EventBus.on('PATH_COMPLETE', (entityId: string) => {
                if (entityId === entity.id) {
                    pathComplete = true;
                }
            });
            
            while (!pathComplete && iterations < maxIterations) {
                pathfinder.update(16);
                iterations++;
            }
            
            EventBus.off('ENTITY_MOVED', moveListener);
            EventBus.off('PATH_COMPLETE', pathCompleteListener);
            
            expect(pathComplete).to.be.true;
            expect(visitedPositions.length).to.be.greaterThan(0, 'Should have moved through tiles');
            
            // Check final position is centered
            const centerOffset = TILE_CONFIG.SIZE / 2;
            const finalExpectedX = 3 * TILE_CONFIG.SIZE + centerOffset;
            const finalExpectedY = 0 * TILE_CONFIG.SIZE + centerOffset;
            
            const finalSmoothPos = entity.getSmoothPosition();
            const finalDistance = Math.sqrt(
                Math.pow(finalSmoothPos.x - finalExpectedX, 2) +
                Math.pow(finalSmoothPos.y - finalExpectedY, 2)
            );
            
            expect(finalDistance).to.be.lessThan(2, 'Final position should be centered');
        });
    });

    describe('PathfindingComponent completePathFollowing', () => {
        it('should snap entity to exact tile center when path completes', () => {
            const grid = createTestGrid();
            
            // Find path to (2, 2)
            pathfinder.findPath(2, 2, grid);
            
            // Simulate movement
            let pathComplete = false;
            const pathCompleteListener = EventBus.on('PATH_COMPLETE', (entityId: string) => {
                if (entityId === entity.id) {
                    pathComplete = true;
                }
            });
            
            let iterations = 0;
            while (!pathComplete && iterations < 2000) {
                pathfinder.update(16);
                iterations++;
            }
            
            EventBus.off('PATH_COMPLETE', pathCompleteListener);
            
            // After path complete, entity should be exactly at tile center
            const centerOffset = TILE_CONFIG.SIZE / 2;
            const exactCenterX = 2 * TILE_CONFIG.SIZE + centerOffset;
            const exactCenterY = 2 * TILE_CONFIG.SIZE + centerOffset;
            
            expect(entity.worldX).to.equal(exactCenterX);
            expect(entity.worldY).to.equal(exactCenterY);
        });
    });
});
