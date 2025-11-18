"use strict";
/**
 * Integration tests for InputManager key handling flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var InputManager_1 = require("../../src/managers/InputManager");
var eventBus_1 = require("../../src/utils/eventBus");
describe('InputManager Flow Integration Tests', function () {
    var inputManager;
    beforeEach(function () {
        // Clear EventBus
        eventBus_1.EventBus.clear();
        // Get fresh InputManager instance
        inputManager = InputManager_1.InputManager.getInstance();
    });
    afterEach(function () {
        eventBus_1.EventBus.clear();
    });
    describe('Key Press/Release Flow', function () {
        it('should track key press correctly', function () {
            inputManager.handleKeyPress('w');
            (0, chai_1.expect)(inputManager.isActionPressed('moveUp')).to.be.true;
            (0, chai_1.expect)(inputManager.isActionJustPressed('moveUp')).to.be.true;
        });
        it('should track key release correctly', function () {
            inputManager.handleKeyPress('w');
            inputManager.update(); // Clear justPressed
            inputManager.handleKeyRelease('w');
            (0, chai_1.expect)(inputManager.isActionPressed('moveUp')).to.be.false;
            (0, chai_1.expect)(inputManager.isActionJustReleased('moveUp')).to.be.true;
        });
        it('should clear justPressed after update()', function () {
            inputManager.handleKeyPress('w');
            (0, chai_1.expect)(inputManager.isActionJustPressed('moveUp')).to.be.true;
            inputManager.update();
            (0, chai_1.expect)(inputManager.isActionJustPressed('moveUp')).to.be.false;
            (0, chai_1.expect)(inputManager.isActionPressed('moveUp')).to.be.true; // Still held
        });
        it('should clear justReleased after update()', function () {
            inputManager.handleKeyPress('w');
            inputManager.update();
            inputManager.handleKeyRelease('w');
            (0, chai_1.expect)(inputManager.isActionJustReleased('moveUp')).to.be.true;
            inputManager.update();
            (0, chai_1.expect)(inputManager.isActionJustReleased('moveUp')).to.be.false;
        });
    });
    describe('Frame Timing (Critical for Game Loop)', function () {
        it('should detect input BEFORE update() clears flags', function () {
            // Simulate frame N: key pressed
            inputManager.handleKeyPress('w');
            // Game logic checks input (should detect)
            var detected = inputManager.isActionJustPressed('moveUp');
            (0, chai_1.expect)(detected).to.be.true;
            // End of frame: update clears flags
            inputManager.update();
            // Next frame: should NOT detect (already cleared)
            var detectedAgain = inputManager.isActionJustPressed('moveUp');
            (0, chai_1.expect)(detectedAgain).to.be.false;
        });
        it('should handle rapid key presses across frames', function () {
            // Frame 1: Press W
            inputManager.handleKeyPress('w');
            (0, chai_1.expect)(inputManager.isActionJustPressed('moveUp')).to.be.true;
            inputManager.update();
            // Frame 2: Still held
            (0, chai_1.expect)(inputManager.isActionPressed('moveUp')).to.be.true;
            (0, chai_1.expect)(inputManager.isActionJustPressed('moveUp')).to.be.false;
            inputManager.update();
            // Frame 3: Release
            inputManager.handleKeyRelease('w');
            (0, chai_1.expect)(inputManager.isActionJustReleased('moveUp')).to.be.true;
            inputManager.update();
            // Frame 4: Press again
            inputManager.handleKeyPress('w');
            (0, chai_1.expect)(inputManager.isActionJustPressed('moveUp')).to.be.true;
        });
    });
    describe('Multiple Key Bindings', function () {
        it('should detect action with multiple keys (w or ArrowUp)', function () {
            inputManager.handleKeyPress('ArrowUp');
            (0, chai_1.expect)(inputManager.isActionPressed('moveUp')).to.be.true;
            (0, chai_1.expect)(inputManager.isActionJustPressed('moveUp')).to.be.true;
        });
        it('should detect either key for same action', function () {
            // Press 'w'
            inputManager.handleKeyPress('w');
            (0, chai_1.expect)(inputManager.isActionPressed('moveUp')).to.be.true;
            inputManager.handleKeyRelease('w');
            inputManager.update();
            // Press 'ArrowUp'
            inputManager.handleKeyPress('ArrowUp');
            (0, chai_1.expect)(inputManager.isActionPressed('moveUp')).to.be.true;
        });
    });
    describe('Action Detection', function () {
        it('should detect all movement actions', function () {
            inputManager.handleKeyPress('w');
            (0, chai_1.expect)(inputManager.isActionPressed('moveUp')).to.be.true;
            inputManager.handleKeyPress('s');
            (0, chai_1.expect)(inputManager.isActionPressed('moveDown')).to.be.true;
            inputManager.handleKeyPress('a');
            (0, chai_1.expect)(inputManager.isActionPressed('moveLeft')).to.be.true;
            inputManager.handleKeyPress('d');
            (0, chai_1.expect)(inputManager.isActionPressed('moveRight')).to.be.true;
        });
        it('should handle simultaneous key presses', function () {
            inputManager.handleKeyPress('w');
            inputManager.handleKeyPress('d');
            (0, chai_1.expect)(inputManager.isActionPressed('moveUp')).to.be.true;
            (0, chai_1.expect)(inputManager.isActionPressed('moveRight')).to.be.true;
        });
    });
    describe('Key Binding Lookup', function () {
        it('should return correct keys for action', function () {
            var keys = inputManager.getKeyBinding('moveUp');
            (0, chai_1.expect)(keys).to.include('w');
            (0, chai_1.expect)(keys).to.include('ArrowUp');
        });
        it('should check if key is bound to action', function () {
            (0, chai_1.expect)(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.true;
            (0, chai_1.expect)(inputManager.isKeyBoundToAction('s', 'moveUp')).to.be.false;
        });
    });
    describe('Real-World Scenario: Player Movement', function () {
        it('should handle typical WASD movement pattern', function () {
            var movements = [];
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
            (0, chai_1.expect)(movements).to.deep.equal(['up', 'right']);
        });
    });
});
