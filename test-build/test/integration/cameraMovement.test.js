"use strict";
/**
 * Integration tests for Camera movement and following
 */
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var Camera_1 = require("../../src/rendering/Camera");
describe('Camera Integration Tests', function () {
    var camera;
    var canvasWidth = 800;
    var canvasHeight = 600;
    beforeEach(function () {
        camera = new Camera_1.Camera(0, 0, canvasWidth, canvasHeight);
    });
    describe('Immediate Movement', function () {
        it('should move camera immediately with moveTo()', function () {
            camera.moveTo(100, 200);
            (0, chai_1.expect)(camera.x).to.equal(100);
            (0, chai_1.expect)(camera.y).to.equal(200);
        });
        it('should clear follow target when using moveTo()', function () {
            camera.follow(500, 500);
            camera.moveTo(100, 100);
            camera.update();
            // Should stay at moveTo position, not follow
            (0, chai_1.expect)(camera.x).to.equal(100);
            (0, chai_1.expect)(camera.y).to.equal(100);
        });
    });
    describe('Smooth Following', function () {
        it('should move towards follow target when update() is called', function () {
            camera.follow(1000, 1000);
            var initialX = camera.x;
            var initialY = camera.y;
            camera.update();
            // Camera should have moved towards target
            (0, chai_1.expect)(camera.x).to.be.greaterThan(initialX);
            (0, chai_1.expect)(camera.y).to.be.greaterThan(initialY);
        });
        it('should eventually reach follow target after multiple updates', function () {
            var targetX = 500;
            var targetY = 300;
            camera.follow(targetX, targetY);
            // Update many times
            for (var i = 0; i < 100; i++) {
                camera.update();
            }
            // Should be very close to target (within 1 pixel)
            (0, chai_1.expect)(Math.abs(camera.x - targetX)).to.be.lessThan(1);
            (0, chai_1.expect)(Math.abs(camera.y - targetY)).to.be.lessThan(1);
        });
        it('should follow moving target smoothly', function () {
            var targetX = 0;
            var targetY = 0;
            for (var i = 0; i < 10; i++) {
                targetX += 10;
                targetY += 10;
                camera.follow(targetX, targetY);
                camera.update();
            }
            // Camera should have moved significantly
            (0, chai_1.expect)(camera.x).to.be.greaterThan(50);
            (0, chai_1.expect)(camera.y).to.be.greaterThan(50);
        });
    });
    describe('Coordinate Conversion', function () {
        it('should convert world to screen coordinates correctly', function () {
            camera.moveTo(100, 100);
            // Object at camera position should be at screen center
            var result = camera.worldToScreen(100, 100);
            (0, chai_1.expect)(result.x).to.equal(canvasWidth / 2);
            (0, chai_1.expect)(result.y).to.equal(canvasHeight / 2);
        });
        it('should convert screen to world coordinates correctly', function () {
            camera.moveTo(100, 100);
            // Screen center should map to camera position
            var result = camera.screenToWorld(canvasWidth / 2, canvasHeight / 2);
            (0, chai_1.expect)(result.x).to.equal(100);
            (0, chai_1.expect)(result.y).to.equal(100);
        });
        it('should have inverse conversion (world->screen->world)', function () {
            camera.moveTo(250, 350);
            var worldX = 500;
            var worldY = 600;
            var screen = camera.worldToScreen(worldX, worldY);
            var world = camera.screenToWorld(screen.x, screen.y);
            (0, chai_1.expect)(world.x).to.be.closeTo(worldX, 0.01);
            (0, chai_1.expect)(world.y).to.be.closeTo(worldY, 0.01);
        });
    });
    describe('Viewport Culling', function () {
        it('should detect if point is in view', function () {
            camera.moveTo(400, 300);
            // Point at camera position (screen center) should be visible
            (0, chai_1.expect)(camera.isInView(400, 300)).to.be.true;
            // Point far away should not be visible
            (0, chai_1.expect)(camera.isInView(10000, 10000)).to.be.false;
        });
        it('should detect if rectangle is in view', function () {
            camera.moveTo(400, 300);
            // Rectangle around camera should be visible
            (0, chai_1.expect)(camera.isRectInView(350, 250, 100, 100)).to.be.true;
            // Rectangle far away should not be visible
            (0, chai_1.expect)(camera.isRectInView(10000, 10000, 50, 50)).to.be.false;
        });
    });
    describe('Smoothing Control', function () {
        it('should follow faster with lower smoothing value', function () {
            var fastCamera = new Camera_1.Camera(0, 0, canvasWidth, canvasHeight);
            var slowCamera = new Camera_1.Camera(0, 0, canvasWidth, canvasHeight);
            fastCamera.setSmoothing(0.05); // Less smoothing = faster
            slowCamera.setSmoothing(0.9); // More smoothing = slower
            fastCamera.follow(1000, 1000);
            slowCamera.follow(1000, 1000);
            fastCamera.update();
            slowCamera.update();
            // Fast camera should move more
            (0, chai_1.expect)(fastCamera.x).to.be.greaterThan(slowCamera.x);
            (0, chai_1.expect)(fastCamera.y).to.be.greaterThan(slowCamera.y);
        });
    });
});
