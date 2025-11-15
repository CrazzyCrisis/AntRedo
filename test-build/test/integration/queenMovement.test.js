"use strict";
/**
 * Integration tests for Queen movement with InputManager
 */
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var Queen_1 = require("../../src/classes/Queen");
var InputManager_1 = require("../../src/managers/InputManager");
var eventBus_1 = require("../../src/utils/eventBus");
describe('Queen Movement Integration Tests', function () {
    var queen;
    var inputManager;
    var moveEvents = [];
    beforeEach(function () {
        eventBus_1.EventBus.clear();
        moveEvents = [];
        // Create queen at (10, 10)
        queen = new Queen_1.Queen(10, 10, 'player');
        inputManager = InputManager_1.InputManager.getInstance();
        // Listen for ENTITY_MOVED events
        eventBus_1.EventBus.on(eventBus_1.GameEvents.ENTITY_MOVED, function (id, gridX, gridY) {
            moveEvents.push({ id: id, gridX: gridX, gridY: gridY });
        });
    });
    afterEach(function () {
        eventBus_1.EventBus.clear();
    });
    describe('Direct Movement', function () {
        it('should move queen directly with moveTo()', function () {
            queen.moveTo(15, 20);
            (0, chai_1.expect)(queen.gridX).to.equal(15);
            (0, chai_1.expect)(queen.gridY).to.equal(20);
            (0, chai_1.expect)(queen.worldX).to.equal(15 * 32); // Assuming 32px tiles
            (0, chai_1.expect)(queen.worldY).to.equal(20 * 32);
        });
        it('should emit ENTITY_MOVED event when moving', function () {
            queen.moveTo(12, 13);
            (0, chai_1.expect)(moveEvents).to.have.lengthOf(1);
            (0, chai_1.expect)(moveEvents[0].gridX).to.equal(12);
            (0, chai_1.expect)(moveEvents[0].gridY).to.equal(13);
        });
        it('should NOT emit ENTITY_MOVED if position unchanged', function () {
            queen.moveTo(10, 10); // Same position
            (0, chai_1.expect)(moveEvents).to.have.lengthOf(0);
        });
    });
    describe('InputManager-Driven Movement', function () {
        it('should move up when W is pressed', function () {
            inputManager.handleKeyPress('w');
            if (inputManager.isActionJustPressed('moveUp')) {
                queen.moveTo(queen.gridX, queen.gridY - 1);
            }
            (0, chai_1.expect)(queen.gridY).to.equal(9);
        });
        it('should move down when S is pressed', function () {
            inputManager.handleKeyPress('s');
            if (inputManager.isActionJustPressed('moveDown')) {
                queen.moveTo(queen.gridX, queen.gridY + 1);
            }
            (0, chai_1.expect)(queen.gridY).to.equal(11);
        });
        it('should move left when A is pressed', function () {
            inputManager.handleKeyPress('a');
            if (inputManager.isActionJustPressed('moveLeft')) {
                queen.moveTo(queen.gridX - 1, queen.gridY);
            }
            (0, chai_1.expect)(queen.gridX).to.equal(9);
        });
        it('should move right when D is pressed', function () {
            inputManager.handleKeyPress('d');
            if (inputManager.isActionJustPressed('moveRight')) {
                queen.moveTo(queen.gridX + 1, queen.gridY);
            }
            (0, chai_1.expect)(queen.gridX).to.equal(11);
        });
    });
    describe('Multi-Frame Movement Simulation', function () {
        it('should move queen multiple times with repeated input', function () {
            var startY = queen.gridY;
            // Simulate 5 frames of pressing W
            for (var frame = 0; frame < 5; frame++) {
                inputManager.handleKeyPress('w');
                if (inputManager.isActionJustPressed('moveUp')) {
                    queen.moveTo(queen.gridX, queen.gridY - 1);
                }
                inputManager.update();
                inputManager.handleKeyRelease('w');
                inputManager.update();
            }
            (0, chai_1.expect)(queen.gridY).to.equal(startY - 5);
            (0, chai_1.expect)(moveEvents).to.have.lengthOf(5);
        });
        it('should handle diagonal movement (W+D)', function () {
            inputManager.handleKeyPress('w');
            inputManager.handleKeyPress('d');
            var targetX = queen.gridX;
            var targetY = queen.gridY;
            if (inputManager.isActionJustPressed('moveUp')) {
                targetY -= 1;
            }
            if (inputManager.isActionJustPressed('moveRight')) {
                targetX += 1;
            }
            queen.moveTo(targetX, targetY);
            (0, chai_1.expect)(queen.gridX).to.equal(11);
            (0, chai_1.expect)(queen.gridY).to.equal(9);
        });
    });
    describe('World Position Synchronization', function () {
        it('should keep worldX/worldY in sync with gridX/gridY', function () {
            for (var i = 0; i < 10; i++) {
                queen.moveTo(i, i);
                (0, chai_1.expect)(queen.worldX).to.equal(i * 32);
                (0, chai_1.expect)(queen.worldY).to.equal(i * 32);
            }
        });
    });
});
