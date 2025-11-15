/**
 * Integration tests for Camera movement and following
 */

import { expect } from 'chai';
import { Camera } from '../../src/rendering/Camera';

describe('Camera Integration Tests', () => {
    let camera: Camera;
    const canvasWidth = 800;
    const canvasHeight = 600;

    beforeEach(() => {
        camera = new Camera(0, 0, canvasWidth, canvasHeight);
    });

    describe('Immediate Movement', () => {
        it('should move camera immediately with moveTo()', () => {
            camera.moveTo(100, 200);
            
            expect(camera.x).to.equal(100);
            expect(camera.y).to.equal(200);
        });

        it('should clear follow target when using moveTo()', () => {
            camera.follow(500, 500);
            camera.moveTo(100, 100);
            camera.update();
            
            // Should stay at moveTo position, not follow
            expect(camera.x).to.equal(100);
            expect(camera.y).to.equal(100);
        });
    });

    describe('Smooth Following', () => {
        it('should move towards follow target when update() is called', () => {
            camera.follow(1000, 1000);
            
            const initialX = camera.x;
            const initialY = camera.y;
            
            camera.update();
            
            // Camera should have moved towards target
            expect(camera.x).to.be.greaterThan(initialX);
            expect(camera.y).to.be.greaterThan(initialY);
        });

        it('should eventually reach follow target after multiple updates', () => {
            const targetX = 500;
            const targetY = 300;
            
            camera.follow(targetX, targetY);
            
            // Update many times
            for (let i = 0; i < 100; i++) {
                camera.update();
            }
            
            // Should be very close to target (within 1 pixel)
            expect(Math.abs(camera.x - targetX)).to.be.lessThan(1);
            expect(Math.abs(camera.y - targetY)).to.be.lessThan(1);
        });

        it('should follow moving target smoothly', () => {
            let targetX = 0;
            let targetY = 0;
            
            for (let i = 0; i < 10; i++) {
                targetX += 10;
                targetY += 10;
                camera.follow(targetX, targetY);
                camera.update();
            }
            
            // Camera should have moved significantly
            expect(camera.x).to.be.greaterThan(50);
            expect(camera.y).to.be.greaterThan(50);
        });
    });

    describe('Coordinate Conversion', () => {
        it('should convert world to screen coordinates correctly', () => {
            camera.moveTo(100, 100);
            
            // Object at camera position should be at screen center
            const result = camera.worldToScreen(100, 100);
            
            expect(result.x).to.equal(canvasWidth / 2);
            expect(result.y).to.equal(canvasHeight / 2);
        });

        it('should convert screen to world coordinates correctly', () => {
            camera.moveTo(100, 100);
            
            // Screen center should map to camera position
            const result = camera.screenToWorld(canvasWidth / 2, canvasHeight / 2);
            
            expect(result.x).to.equal(100);
            expect(result.y).to.equal(100);
        });

        it('should have inverse conversion (world->screen->world)', () => {
            camera.moveTo(250, 350);
            
            const worldX = 500;
            const worldY = 600;
            
            const screen = camera.worldToScreen(worldX, worldY);
            const world = camera.screenToWorld(screen.x, screen.y);
            
            expect(world.x).to.be.closeTo(worldX, 0.01);
            expect(world.y).to.be.closeTo(worldY, 0.01);
        });
    });

    describe('Viewport Culling', () => {
        it('should detect if point is in view', () => {
            camera.moveTo(400, 300);
            
            // Point at camera position (screen center) should be visible
            expect(camera.isInView(400, 300)).to.be.true;
            
            // Point far away should not be visible
            expect(camera.isInView(10000, 10000)).to.be.false;
        });

        it('should detect if rectangle is in view', () => {
            camera.moveTo(400, 300);
            
            // Rectangle around camera should be visible
            expect(camera.isRectInView(350, 250, 100, 100)).to.be.true;
            
            // Rectangle far away should not be visible
            expect(camera.isRectInView(10000, 10000, 50, 50)).to.be.false;
        });
    });

    describe('Smoothing Control', () => {
        it('should follow faster with lower smoothing value', () => {
            const fastCamera = new Camera(0, 0, canvasWidth, canvasHeight);
            const slowCamera = new Camera(0, 0, canvasWidth, canvasHeight);
            
            fastCamera.setSmoothing(0.05); // Less smoothing = faster
            slowCamera.setSmoothing(0.9);  // More smoothing = slower
            
            fastCamera.follow(1000, 1000);
            slowCamera.follow(1000, 1000);
            
            fastCamera.update();
            slowCamera.update();
            
            // Fast camera should move more
            expect(fastCamera.x).to.be.greaterThan(slowCamera.x);
            expect(fastCamera.y).to.be.greaterThan(slowCamera.y);
        });
    });
});
