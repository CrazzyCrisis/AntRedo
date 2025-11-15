/**
 * Integration tests for InputManager key handling flow
 */

import { expect } from 'chai';
import { InputManager } from '../../src/managers/InputManager';
import { EventBus } from '../../src/utils/eventBus';

describe('InputManager Flow Integration Tests', () => {
    let inputManager: InputManager;

    beforeEach(() => {
        // Clear EventBus
        EventBus.clear();
        
        // Get fresh InputManager instance
        inputManager = InputManager.getInstance();
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Key Press/Release Flow', () => {
        it('should track key press correctly', () => {
            inputManager.handleKeyPress('w');
            
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
            expect(inputManager.isActionJustPressed('moveUp')).to.be.true;
        });

        it('should track key release correctly', () => {
            inputManager.handleKeyPress('w');
            inputManager.update(); // Clear justPressed
            inputManager.handleKeyRelease('w');
            
            expect(inputManager.isActionPressed('moveUp')).to.be.false;
            expect(inputManager.isActionJustReleased('moveUp')).to.be.true;
        });

        it('should clear justPressed after update()', () => {
            inputManager.handleKeyPress('w');
            
            expect(inputManager.isActionJustPressed('moveUp')).to.be.true;
            
            inputManager.update();
            
            expect(inputManager.isActionJustPressed('moveUp')).to.be.false;
            expect(inputManager.isActionPressed('moveUp')).to.be.true; // Still held
        });

        it('should clear justReleased after update()', () => {
            inputManager.handleKeyPress('w');
            inputManager.update();
            inputManager.handleKeyRelease('w');
            
            expect(inputManager.isActionJustReleased('moveUp')).to.be.true;
            
            inputManager.update();
            
            expect(inputManager.isActionJustReleased('moveUp')).to.be.false;
        });
    });

    describe('Frame Timing (Critical for Game Loop)', () => {
        it('should detect input BEFORE update() clears flags', () => {
            // Simulate frame N: key pressed
            inputManager.handleKeyPress('w');
            
            // Game logic checks input (should detect)
            const detected = inputManager.isActionJustPressed('moveUp');
            expect(detected).to.be.true;
            
            // End of frame: update clears flags
            inputManager.update();
            
            // Next frame: should NOT detect (already cleared)
            const detectedAgain = inputManager.isActionJustPressed('moveUp');
            expect(detectedAgain).to.be.false;
        });

        it('should handle rapid key presses across frames', () => {
            // Frame 1: Press W
            inputManager.handleKeyPress('w');
            expect(inputManager.isActionJustPressed('moveUp')).to.be.true;
            inputManager.update();
            
            // Frame 2: Still held
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
            expect(inputManager.isActionJustPressed('moveUp')).to.be.false;
            inputManager.update();
            
            // Frame 3: Release
            inputManager.handleKeyRelease('w');
            expect(inputManager.isActionJustReleased('moveUp')).to.be.true;
            inputManager.update();
            
            // Frame 4: Press again
            inputManager.handleKeyPress('w');
            expect(inputManager.isActionJustPressed('moveUp')).to.be.true;
        });
    });

    describe('Multiple Key Bindings', () => {
        it('should detect action with multiple keys (w or ArrowUp)', () => {
            inputManager.handleKeyPress('ArrowUp');
            
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
            expect(inputManager.isActionJustPressed('moveUp')).to.be.true;
        });

        it('should detect either key for same action', () => {
            // Press 'w'
            inputManager.handleKeyPress('w');
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
            inputManager.handleKeyRelease('w');
            inputManager.update();
            
            // Press 'ArrowUp'
            inputManager.handleKeyPress('ArrowUp');
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
        });
    });

    describe('Action Detection', () => {
        it('should detect all movement actions', () => {
            inputManager.handleKeyPress('w');
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
            
            inputManager.handleKeyPress('s');
            expect(inputManager.isActionPressed('moveDown')).to.be.true;
            
            inputManager.handleKeyPress('a');
            expect(inputManager.isActionPressed('moveLeft')).to.be.true;
            
            inputManager.handleKeyPress('d');
            expect(inputManager.isActionPressed('moveRight')).to.be.true;
        });

        it('should handle simultaneous key presses', () => {
            inputManager.handleKeyPress('w');
            inputManager.handleKeyPress('d');
            
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
            expect(inputManager.isActionPressed('moveRight')).to.be.true;
        });
    });

    describe('Key Binding Lookup', () => {
        it('should return correct keys for action', () => {
            const keys = inputManager.getKeyBinding('moveUp');
            
            expect(keys).to.include('w');
            expect(keys).to.include('ArrowUp');
        });

        it('should check if key is bound to action', () => {
            expect(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.true;
            expect(inputManager.isKeyBoundToAction('s', 'moveUp')).to.be.false;
        });
    });

    describe('Real-World Scenario: Player Movement', () => {
        it('should handle typical WASD movement pattern', () => {
            const movements: string[] = [];
            
            // Frame 1: Press W, move up
            inputManager.handleKeyPress('w');
            if (inputManager.isActionJustPressed('moveUp')) {
                movements.push('up');
            }
            inputManager.update();
            
            // Frame 2: Still holding W, no new movement
            if (inputManager.isActionJustPressed('moveUp')) {
                movements.push('up');
            }
            inputManager.update();
            
            // Frame 3: Release W, press D, move right
            inputManager.handleKeyRelease('w');
            inputManager.handleKeyPress('d');
            if (inputManager.isActionJustPressed('moveRight')) {
                movements.push('right');
            }
            inputManager.update();
            
            // Should have moved up once, then right once
            expect(movements).to.deep.equal(['up', 'right']);
        });
    });
});
