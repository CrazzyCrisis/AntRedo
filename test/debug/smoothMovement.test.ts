/**
 * Smooth Movement Diagnostic Tests
 * Tests to diagnose flickering during Queen movement
 */

import { expect } from 'chai';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { TILE_CONFIG } from '../../src/config/world/tileConfig';

describe('Smooth Movement Diagnostics', () => {
    let entity: GameObject;
    const TILE_SIZE = TILE_CONFIG.SIZE;
    
    beforeEach(() => {
        EventBus.clear();
        entity = new GameObject('test', 10, 10);
        entity.moveSpeed = 4; // 4 tiles per second (same as Queen)
    });

    describe('Smooth Position Tracking', () => {
        it('should initialize smooth position at grid center', () => {
            const smoothPos = entity.getSmoothPosition();
            expect(smoothPos.x).to.equal(10 * TILE_SIZE);
            expect(smoothPos.y).to.equal(10 * TILE_SIZE);
            expect(smoothPos.x).to.equal(entity.worldX);
            expect(smoothPos.y).to.equal(entity.worldY);
        });

        it('should emit smooth position updates while moving', () => {
            const updates: Array<{x: number, y: number}> = [];
            
            EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (id: string, x: number, y: number) => {
                if (id === entity.id) {
                    updates.push({x, y});
                }
            });

            // Move right for 3 frames at 16ms per frame
            entity.requestMove(1, 0);
            entity.update(16);
            
            entity.requestMove(1, 0);
            entity.update(16);
            
            entity.requestMove(1, 0);
            entity.update(16);

            expect(updates.length).to.equal(3, 'Should emit 3 smooth position updates');
            
            // Each update should move the entity forward
            for (let i = 1; i < updates.length; i++) {
                expect(updates[i].x).to.be.greaterThan(updates[i-1].x, 
                    `Frame ${i} should be ahead of frame ${i-1}`);
            }
        });

        it('should track continuous movement without backwards motion', () => {
            const positions: number[] = [];
            
            EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (id: string, x: number) => {
                if (id === entity.id) {
                    positions.push(x);
                }
            });

            // Simulate 10 frames of continuous rightward movement
            for (let frame = 0; frame < 10; frame++) {
                entity.requestMove(1, 0);
                entity.update(16); // 16ms per frame = ~60fps
            }

            // Verify monotonic increase (never goes backward)
            for (let i = 1; i < positions.length; i++) {
                expect(positions[i]).to.be.at.least(positions[i-1], 
                    `Position at frame ${i} should not be behind frame ${i-1}`);
            }

            console.log('Position progression:', positions);
        });
    });

    describe('Grid Crossing Detection', () => {
        it('should update grid position when crossing tile boundary', () => {
            const gridUpdates: Array<{gridX: number, gridY: number}> = [];
            
            EventBus.on(GameEvents.ENTITY_MOVED, (id: string, gridX: number, gridY: number) => {
                if (id === entity.id) {
                    gridUpdates.push({gridX, gridY});
                }
            });

            // Move right continuously until we cross a tile boundary
            // At 4 tiles/sec, 16ms per frame = 0.064 tiles per frame
            // Need ~16 frames to cross 1 tile
            for (let frame = 0; frame < 20; frame++) {
                entity.requestMove(1, 0);
                entity.update(16);
            }

            expect(gridUpdates.length).to.be.greaterThan(0, 'Should cross at least one tile boundary');
            
            // Grid position should increment by 1 each time
            if (gridUpdates.length > 0) {
                expect(gridUpdates[0].gridX).to.equal(11);
                expect(gridUpdates[0].gridY).to.equal(10);
            }
        });

        it('should not reset smooth position when grid position updates', () => {
            let smoothPosWhenGridUpdates = 0;
            let gridUpdateDetected = false;

            EventBus.on(GameEvents.ENTITY_MOVED, (id: string) => {
                if (id === entity.id) {
                    smoothPosWhenGridUpdates = entity.getSmoothPosition().x;
                    gridUpdateDetected = true;
                }
            });

            // Move until grid position updates
            for (let frame = 0; frame < 20; frame++) {
                entity.requestMove(1, 0);
                entity.update(16);
                
                if (gridUpdateDetected) {
                    break;
                }
            }

            expect(gridUpdateDetected).to.be.true;
            
            // Smooth position should be ahead of grid center, not reset to it
            const gridCenterX = entity.gridX * TILE_SIZE;
            expect(smoothPosWhenGridUpdates).to.be.greaterThan(gridCenterX,
                'Smooth position should be ahead of new grid center');
        });
    });

    describe('Movement Accumulator Behavior', () => {
        it('should accumulate movement time correctly', () => {
            // Speed is 4 tiles/second
            // At 16ms (0.016 seconds), should accumulate 0.064 tiles
            entity.requestMove(1, 0);
            entity.update(16);

            // We can't directly access moveAccumulator, but we can verify behavior
            // After 16 frames at 16ms each (~1 second), should cross 4 tiles
            const startGridX = entity.gridX;
            
            for (let frame = 0; frame < 63; frame++) { // ~1 second
                entity.requestMove(1, 0);
                entity.update(16);
            }

            const tilesTraversed = entity.gridX - startGridX;
            expect(tilesTraversed).to.be.at.least(3); // Should traverse ~4 tiles
            expect(tilesTraversed).to.be.at.most(5);
        });
    });

    describe('Sprite Position Consistency', () => {
        it('should maintain consistent smooth position when grid updates', () => {
            const smoothPositions: number[] = [];
            const gridPositions: number[] = [];
            
            EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (id: string, x: number) => {
                if (id === entity.id) {
                    smoothPositions.push(x);
                }
            });
            
            EventBus.on(GameEvents.ENTITY_MOVED, (id: string, gridX: number) => {
                if (id === entity.id) {
                    gridPositions.push(gridX * TILE_SIZE);
                    console.log(`Grid updated to ${gridX}, smooth pos: ${entity.getSmoothPosition().x}`);
                }
            });

            // Move continuously
            for (let frame = 0; frame < 25; frame++) {
                entity.requestMove(1, 0);
                entity.update(16);
            }

            // Check if smooth position ever goes backward (flickering cause)
            let foundBackwardMotion = false;
            for (let i = 1; i < smoothPositions.length; i++) {
                if (smoothPositions[i] < smoothPositions[i-1]) {
                    console.error(`FLICKER DETECTED: Frame ${i} moved backward from ${smoothPositions[i-1]} to ${smoothPositions[i]}`);
                    foundBackwardMotion = true;
                }
            }

            expect(foundBackwardMotion).to.be.false;
        });

        it('should show smooth position vs grid position divergence', () => {
            console.log('\n=== Smooth Position vs Grid Position ===');
            console.log('Frame | Grid Center | Smooth Pos | Delta');
            
            for (let frame = 0; frame < 20; frame++) {
                entity.requestMove(1, 0);
                entity.update(16);
                
                const gridCenter = entity.gridX * TILE_SIZE;
                const smoothPos = entity.getSmoothPosition().x;
                const delta = smoothPos - gridCenter;
                
                console.log(`${frame.toString().padStart(5)} | ${gridCenter.toString().padStart(11)} | ${smoothPos.toFixed(2).padStart(10)} | ${delta.toFixed(2).padStart(7)}`);
            }
        });
    });

    describe('Event Emission Patterns', () => {
        it('should emit ENTITY_MOVED less frequently than ENTITY_SMOOTH_POSITION_UPDATE', () => {
            let smoothUpdateCount = 0;
            let gridUpdateCount = 0;
            
            EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (id: string) => {
                if (id === entity.id) smoothUpdateCount++;
            });
            
            EventBus.on(GameEvents.ENTITY_MOVED, (id: string) => {
                if (id === entity.id) gridUpdateCount++;
            });

            // Move for 30 frames
            for (let frame = 0; frame < 30; frame++) {
                entity.requestMove(1, 0);
                entity.update(16);
            }

            console.log(`Smooth updates: ${smoothUpdateCount}, Grid updates: ${gridUpdateCount}`);
            
            expect(smoothUpdateCount).to.equal(30, 'Should emit smooth update every frame');
            expect(gridUpdateCount).to.be.lessThan(smoothUpdateCount, 
                'Grid updates should be less frequent than smooth updates');
        });

        it('should check for duplicate or conflicting events', () => {
            const eventLog: Array<{frame: number, type: string, x: number}> = [];
            
            EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (id: string, x: number) => {
                if (id === entity.id) {
                    eventLog.push({frame: eventLog.length, type: 'SMOOTH', x});
                }
            });
            
            EventBus.on(GameEvents.ENTITY_MOVED, (id: string, gridX: number) => {
                if (id === entity.id) {
                    eventLog.push({frame: eventLog.length, type: 'GRID', x: gridX * TILE_SIZE});
                }
            });

            // Move for 20 frames
            for (let frame = 0; frame < 20; frame++) {
                entity.requestMove(1, 0);
                entity.update(16);
            }

            console.log('\n=== Event Log ===');
            eventLog.forEach(e => {
                console.log(`Frame ${e.frame}: ${e.type.padEnd(6)} - X: ${e.x.toFixed(2)}`);
            });
        });
    });

    describe('Stop and Resume Movement', () => {
        it('should not move backward when stopping', () => {
            const positions: number[] = [];
            
            EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (id: string, x: number) => {
                if (id === entity.id) {
                    positions.push(x);
                }
            });

            // Move right for 10 frames
            for (let frame = 0; frame < 10; frame++) {
                entity.requestMove(1, 0);
                entity.update(16);
            }
            
            const positionBeforeStop = entity.getSmoothPosition().x;
            
            // Stop (don't request move)
            entity.update(16);
            
            const positionAfterStop = entity.getSmoothPosition().x;
            
            expect(positionAfterStop).to.be.at.least(positionBeforeStop,
                'Should not move backward when stopping');
        });
    });
});
