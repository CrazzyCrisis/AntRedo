/**
 * Snap Diagnostics - Debug snap behavior with detailed logging
 */

import { expect } from 'chai';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';

describe('Snap Diagnostics - Debug Mode', () => {
    let gameObject: GameObject;

    beforeEach(() => {
        EventBus.clear();
        gameObject = new GameObject('test', 10, 10);
    });

    afterEach(() => {
        gameObject.destroy();
        EventBus.clear();
    });

    describe('Initial State Verification', () => {
        it('should start at exact tile center', () => {
            console.log('\n=== Initial State ===');
            console.log('gridX:', gameObject.gridX);
            console.log('gridY:', gameObject.gridY);
            console.log('worldX:', gameObject.worldX);
            console.log('worldY:', gameObject.worldY);
            
            const smoothPos = gameObject.getSmoothPosition();
            console.log('smoothWorldX:', smoothPos.x);
            console.log('smoothWorldY:', smoothPos.y);
            
            expect(gameObject.gridX).to.equal(10);
            expect(gameObject.gridY).to.equal(10);
        });
    });

    describe('Right Movement Snap', () => {
        it('should snap correctly after moving right', () => {
            console.log('\n=== RIGHT MOVEMENT TEST ===');
            
            // Start position
            console.log('Start - Grid:', gameObject.gridX, gameObject.gridY);
            const startSmooth = gameObject.getSmoothPosition();
            console.log('Start - Smooth:', startSmooth.x, startSmooth.y);
            
            // Move right
            gameObject.requestMove(1, 0);
            console.log('\nAfter requestMove(1, 0):');
            
            // Simulate movement for 100ms
            gameObject.update(100);
            const afterMove = gameObject.getSmoothPosition();
            console.log('After 100ms movement:');
            console.log('  Grid:', gameObject.gridX, gameObject.gridY);
            console.log('  Smooth:', afterMove.x, afterMove.y);
            console.log('  Distance moved X:', afterMove.x - startSmooth.x);
            console.log('  Distance moved Y:', afterMove.y - startSmooth.y);
            
            // Stop moving
            gameObject.requestMove(0, 0);
            gameObject.update(16);
            console.log('\nAfter stop (one frame):');
            console.log('  Grid:', gameObject.gridX, gameObject.gridY);
            const afterStop = gameObject.getSmoothPosition();
            console.log('  Smooth:', afterStop.x, afterStop.y);
            
            // Calculate which tile we're in based on smooth position
            const tileX = Math.floor(afterStop.x / 32); // Use correct TILE_SIZE
            const tileY = Math.floor(afterStop.y / 32);
            console.log('  Tile based on smooth pos:', tileX, tileY);
            console.log('  Expected snap target:', (tileX * 32) + 16, (tileY * 32) + 16);
            
            // Track first few snap frames
            console.log('\nSnap animation frames:');
            for (let i = 0; i < 5; i++) {
                gameObject.update(16);
                const pos = gameObject.getSmoothPosition();
                const currTileX = Math.floor(pos.x / 32);
                const currTileY = Math.floor(pos.y / 32);
                console.log(`  Frame ${i+1}: Smooth (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}) -> Tile (${currTileX}, ${currTileY})`);
            }
            
            // Let snap complete
            for (let i = 0; i < 95; i++) {
                gameObject.update(16);
            }
            const final = gameObject.getSmoothPosition();
            console.log('\nFinal position after snap:');
            console.log('  Grid:', gameObject.gridX, gameObject.gridY);
            console.log('  Smooth:', final.x, final.y);
            
            const finalTileX = Math.floor(final.x / 48);
            const finalTileY = Math.floor(final.y / 48);
            console.log('  Final tile based on smooth:', finalTileX, finalTileY);
            
            // Y should NOT change
            expect(gameObject.gridY).to.equal(10, 'Y grid position should not change when moving right');
        });
    });

    describe('Left Movement Snap', () => {
        it('should snap correctly after moving left', () => {
            console.log('\n=== LEFT MOVEMENT TEST ===');
            
            const startSmooth = gameObject.getSmoothPosition();
            console.log('Start - Grid:', gameObject.gridX, gameObject.gridY);
            console.log('Start - Smooth:', startSmooth.x, startSmooth.y);
            
            // Move left
            gameObject.requestMove(-1, 0);
            gameObject.update(100);
            const afterMove = gameObject.getSmoothPosition();
            console.log('After 100ms left movement:');
            console.log('  Grid:', gameObject.gridX, gameObject.gridY);
            console.log('  Smooth:', afterMove.x, afterMove.y);
            console.log('  Distance moved X:', afterMove.x - startSmooth.x);
            console.log('  Distance moved Y:', afterMove.y - startSmooth.y);
            
            const tileX = Math.floor(afterMove.x / 48);
            const tileY = Math.floor(afterMove.y / 48);
            console.log('  Tile based on smooth pos:', tileX, tileY);
            
            // Stop
            gameObject.requestMove(0, 0);
            gameObject.update(16);
            
            // Let snap complete
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            const final = gameObject.getSmoothPosition();
            console.log('\nFinal position:');
            console.log('  Grid:', gameObject.gridX, gameObject.gridY);
            console.log('  Smooth:', final.x, final.y);
            
            // Y should NOT change
            expect(gameObject.gridY).to.equal(10, 'Y grid position should not change when moving left');
        });
    });

    describe('Down Movement Snap', () => {
        it('should snap correctly after moving down', () => {
            console.log('\n=== DOWN MOVEMENT TEST ===');
            
            const startSmooth = gameObject.getSmoothPosition();
            console.log('Start - Grid:', gameObject.gridX, gameObject.gridY);
            console.log('Start - Smooth:', startSmooth.x, startSmooth.y);
            
            // Move down
            gameObject.requestMove(0, 1);
            gameObject.update(100);
            const afterMove = gameObject.getSmoothPosition();
            console.log('After 100ms down movement:');
            console.log('  Grid:', gameObject.gridX, gameObject.gridY);
            console.log('  Smooth:', afterMove.x, afterMove.y);
            console.log('  Distance moved X:', afterMove.x - startSmooth.x);
            console.log('  Distance moved Y:', afterMove.y - startSmooth.y);
            
            // Stop
            gameObject.requestMove(0, 0);
            gameObject.update(16);
            
            // Let snap complete
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            const final = gameObject.getSmoothPosition();
            console.log('\nFinal position:');
            console.log('  Grid:', gameObject.gridX, gameObject.gridY);
            console.log('  Smooth:', final.x, final.y);
            
            // X should NOT change
            expect(gameObject.gridX).to.equal(10, 'X grid position should not change when moving down');
        });
    });

    describe('Up Movement Snap', () => {
        it('should snap correctly after moving up', () => {
            console.log('\n=== UP MOVEMENT TEST ===');
            
            const startSmooth = gameObject.getSmoothPosition();
            console.log('Start - Grid:', gameObject.gridX, gameObject.gridY);
            console.log('Start - Smooth:', startSmooth.x, startSmooth.y);
            
            // Move up
            gameObject.requestMove(0, -1);
            gameObject.update(100);
            const afterMove = gameObject.getSmoothPosition();
            console.log('After 100ms up movement:');
            console.log('  Grid:', gameObject.gridX, gameObject.gridY);
            console.log('  Smooth:', afterMove.x, afterMove.y);
            console.log('  Distance moved X:', afterMove.x - startSmooth.x);
            console.log('  Distance moved Y:', afterMove.y - startSmooth.y);
            
            // Stop
            gameObject.requestMove(0, 0);
            gameObject.update(16);
            
            // Let snap complete
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            const final = gameObject.getSmoothPosition();
            console.log('\nFinal position:');
            console.log('  Grid:', gameObject.gridX, gameObject.gridY);
            console.log('  Smooth:', final.x, final.y);
            
            // X should NOT change
            expect(gameObject.gridX).to.equal(10, 'X grid position should not change when moving up');
        });
    });

    describe('Tile Center Calculation', () => {
        it('should calculate tile centers correctly', () => {
            console.log('\n=== TILE CENTER CALCULATION ===');
            
            // Test tile 10,10 center
            const tileCenterX = (10 * 48) + (48 / 2);
            const tileCenterY = (10 * 48) + (48 / 2);
            console.log('Tile (10, 10) center should be:', tileCenterX, tileCenterY);
            
            // Test what tile different positions are in
            const testPositions = [
                { x: 504, y: 504, desc: 'Center of tile 10,10' },
                { x: 480, y: 504, desc: 'Left edge of tile 10,10' },
                { x: 528, y: 504, desc: 'Right edge of tile 10,10' },
                { x: 504, y: 480, desc: 'Top edge of tile 10,10' },
                { x: 504, y: 528, desc: 'Bottom edge of tile 10,10' },
                { x: 510, y: 510, desc: 'Slightly off-center in tile 10,10' },
                { x: 474, y: 504, desc: 'Just left of tile boundary' },
                { x: 534, y: 504, desc: 'Just right of tile boundary' }
            ];
            
            testPositions.forEach(pos => {
                const tileX = Math.floor(pos.x / 48);
                const tileY = Math.floor(pos.y / 48);
                console.log(`\n${pos.desc}:`);
                console.log(`  Position: (${pos.x}, ${pos.y})`);
                console.log(`  Calculated tile: (${tileX}, ${tileY})`);
                console.log(`  Expected center: (${(tileX * 48) + 24}, ${(tileY * 48) + 24})`);
            });
        });
    });
});
