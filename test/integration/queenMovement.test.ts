/**
 * Integration tests for Queen movement with InputManager
 */

import { expect } from 'chai';
import { Queen } from '../../src/classes/Queen';
import { InputManager } from '../../src/managers/InputManager';
import { EventBus, GameEvents } from '../../src/utils/eventBus';

describe('Queen Movement Integration Tests', () => {
    let queen: Queen;
    let inputManager: InputManager;
    let moveEvents: Array<{ id: string; gridX: number; gridY: number }> = [];

    beforeEach(() => {
        EventBus.clear();
        moveEvents = [];
        
        // Create queen at (10, 10)
        queen = new Queen(10, 10, 'player');
        
        inputManager = InputManager.getInstance();
        
        // Listen for ENTITY_MOVED events
        EventBus.on(GameEvents.ENTITY_MOVED, (id: string, gridX: number, gridY: number) => {
            moveEvents.push({ id, gridX, gridY });
        });
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Direct Movement', () => {
        it('should move queen directly with moveTo()', () => {
            queen.moveTo(15, 20);
            
            expect(queen.gridX).to.equal(15);
            expect(queen.gridY).to.equal(20);
            expect(queen.worldX).to.equal(15 * 32); // Assuming 32px tiles
            expect(queen.worldY).to.equal(20 * 32);
        });

        it('should emit ENTITY_MOVED event when moving', () => {
            queen.moveTo(12, 13);
            
            expect(moveEvents).to.have.lengthOf(1);
            expect(moveEvents[0].gridX).to.equal(12);
            expect(moveEvents[0].gridY).to.equal(13);
        });

        it('should NOT emit ENTITY_MOVED if position unchanged', () => {
            queen.moveTo(10, 10); // Same position
            
            expect(moveEvents).to.have.lengthOf(0);
        });
    });

    describe('InputManager-Driven Movement', () => {
        it('should move up when W is pressed', () => {
            inputManager.handleKeyPress('w');
            
            if (inputManager.isActionJustPressed('moveUp')) {
                queen.moveTo(queen.gridX, queen.gridY - 1);
            }
            
            expect(queen.gridY).to.equal(9);
        });

        it('should move down when S is pressed', () => {
            inputManager.handleKeyPress('s');
            
            if (inputManager.isActionJustPressed('moveDown')) {
                queen.moveTo(queen.gridX, queen.gridY + 1);
            }
            
            expect(queen.gridY).to.equal(11);
        });

        it('should move left when A is pressed', () => {
            inputManager.handleKeyPress('a');
            
            if (inputManager.isActionJustPressed('moveLeft')) {
                queen.moveTo(queen.gridX - 1, queen.gridY);
            }
            
            expect(queen.gridX).to.equal(9);
        });

        it('should move right when D is pressed', () => {
            inputManager.handleKeyPress('d');
            
            if (inputManager.isActionJustPressed('moveRight')) {
                queen.moveTo(queen.gridX + 1, queen.gridY);
            }
            
            expect(queen.gridX).to.equal(11);
        });
    });

    describe('Multi-Frame Movement Simulation', () => {
        it('should move queen multiple times with repeated input', () => {
            const startY = queen.gridY;
            
            // Simulate 5 frames of pressing W
            for (let frame = 0; frame < 5; frame++) {
                inputManager.handleKeyPress('w');
                
                if (inputManager.isActionJustPressed('moveUp')) {
                    queen.moveTo(queen.gridX, queen.gridY - 1);
                }
                
                inputManager.update();
                inputManager.handleKeyRelease('w');
                inputManager.update();
            }
            
            expect(queen.gridY).to.equal(startY - 5);
            expect(moveEvents).to.have.lengthOf(5);
        });

        it('should handle diagonal movement (W+D)', () => {
            inputManager.handleKeyPress('w');
            inputManager.handleKeyPress('d');
            
            let targetX = queen.gridX;
            let targetY = queen.gridY;
            
            if (inputManager.isActionJustPressed('moveUp')) {
                targetY -= 1;
            }
            if (inputManager.isActionJustPressed('moveRight')) {
                targetX += 1;
            }
            
            queen.moveTo(targetX, targetY);
            
            expect(queen.gridX).to.equal(11);
            expect(queen.gridY).to.equal(9);
        });
    });

    describe('World Position Synchronization', () => {
        it('should keep worldX/worldY in sync with gridX/gridY', () => {
            for (let i = 0; i < 10; i++) {
                queen.moveTo(i, i);
                
                expect(queen.worldX).to.equal(i * 32);
                expect(queen.worldY).to.equal(i * 32);
            }
        });
    });
});
