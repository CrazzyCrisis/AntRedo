import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { Camera } from '../../src/rendering/Camera';

describe('Camera', () => {
    let camera: Camera;

    beforeEach(() => {
        camera = new Camera(400, 300); // Center at 400, 300 (800x600 canvas)
    });

    describe('initialization', () => {
        it('should initialize at given position', () => {
            expect(camera.x).to.equal(400);
            expect(camera.y).to.equal(300);
        });

        it('should have default smoothing', () => {
            // Smoothing should exist and be between 0-1
            expect(camera).to.have.property('smoothing');
        });
    });

    describe('immediate movement', () => {
        it('should move to target immediately with moveTo', () => {
            camera.moveTo(500, 400);
            
            expect(camera.x).to.equal(500);
            expect(camera.y).to.equal(400);
        });

        it('should update position with multiple moveTo calls', () => {
            camera.moveTo(100, 100);
            expect(camera.x).to.equal(100);
            
            camera.moveTo(200, 200);
            expect(camera.x).to.equal(200);
            expect(camera.y).to.equal(200);
        });
    });

    describe('smooth following', () => {
        it('should follow target with smoothing', () => {
            camera.follow(500, 400);
            camera.update();
            
            // Should move towards target, but not reach it immediately
            expect(camera.x).to.be.greaterThan(400);
            expect(camera.x).to.be.lessThan(500);
            expect(camera.y).to.be.greaterThan(300);
            expect(camera.y).to.be.lessThan(400);
        });

        it('should eventually reach target with multiple updates', () => {
            camera.follow(500, 400);
            
            // Update many times
            for (let i = 0; i < 100; i++) {
                camera.update();
            }
            
            // Should be very close to target
            expect(Math.abs(camera.x - 500)).to.be.lessThan(1);
            expect(Math.abs(camera.y - 400)).to.be.lessThan(1);
        });

        it('should update target position with new follow call', () => {
            camera.follow(500, 400);
            camera.update();
            
            const midX = camera.x;
            const midY = camera.y;
            
            // Change target
            camera.follow(300, 200);
            camera.update();
            
            // Should now move towards new target
            expect(camera.x).to.be.lessThan(midX);
            expect(camera.y).to.be.lessThan(midY);
        });

        it('should not move if no follow target set', () => {
            const startX = camera.x;
            const startY = camera.y;
            
            camera.update();
            
            expect(camera.x).to.equal(startX);
            expect(camera.y).to.equal(startY);
        });
    });

    describe('smoothing control', () => {
        it('should allow setting smoothing value', () => {
            camera.setSmoothing(0.5);
            expect(camera.smoothing).to.equal(0.5);
        });

        it('should move faster with lower smoothing', () => {
            const camera1 = new Camera(400, 300);
            const camera2 = new Camera(400, 300);
            
            camera1.setSmoothing(0.1);
            camera2.setSmoothing(0.9);
            
            camera1.follow(500, 400);
            camera2.follow(500, 400);
            
            camera1.update();
            camera2.update();
            
            // Lower smoothing (0.1) should move more per update
            const distance1 = Math.abs(camera1.x - 400);
            const distance2 = Math.abs(camera2.x - 400);
            
            expect(distance1).to.be.greaterThan(distance2);
        });

        it('should handle smoothing = 0 (instant movement)', () => {
            camera.setSmoothing(0);
            camera.follow(500, 400);
            camera.update();
            
            expect(camera.x).to.equal(500);
            expect(camera.y).to.equal(400);
        });
    });

    describe('world to screen conversion', () => {
        it('should convert world coordinates to screen coordinates', () => {
            camera.moveTo(400, 300);
            
            // Camera is at 400, 300 (canvas center)
            // World position 400, 300 should be at screen center
            const screenPos = camera.worldToScreen(400, 300);
            
            expect(screenPos.x).to.equal(400);
            expect(screenPos.y).to.equal(300);
        });

        it('should offset coordinates based on camera position', () => {
            camera.moveTo(0, 0);
            
            // Camera at top-left, world 100, 100 should be offset by canvas center
            const screenPos = camera.worldToScreen(100, 100);
            
            expect(screenPos.x).to.equal(100 + 400);
            expect(screenPos.y).to.equal(100 + 300);
        });
    });

    describe('screen to world conversion', () => {
        it('should convert screen coordinates to world coordinates', () => {
            camera.moveTo(400, 300);
            
            // Screen center should map to camera position
            const worldPos = camera.screenToWorld(400, 300);
            
            expect(worldPos.x).to.equal(400);
            expect(worldPos.y).to.equal(300);
        });

        it('should be inverse of worldToScreen', () => {
            camera.moveTo(200, 150);
            
            const worldX = 500;
            const worldY = 400;
            
            const screen = camera.worldToScreen(worldX, worldY);
            const backToWorld = camera.screenToWorld(screen.x, screen.y);
            
            expect(backToWorld.x).to.be.closeTo(worldX, 0.01);
            expect(backToWorld.y).to.be.closeTo(worldY, 0.01);
        });
    });

    describe('apply transform', () => {
        it('should have applyTransform method', () => {
            expect(camera.applyTransform).to.be.a('function');
        });

        it('should accept graphics object', () => {
            const mockGraphics = {
                translate: function(x: number, y: number) {
                    this._translateX = x;
                    this._translateY = y;
                },
                _translateX: 0,
                _translateY: 0
            };
            
            camera.moveTo(100, 100);
            camera.applyTransform(mockGraphics as any);
            
            // Should have called translate
            expect(mockGraphics._translateX).to.not.equal(0);
        });
    });

    describe('bounds checking', () => {
        it('should check if point is in view', () => {
            camera.moveTo(400, 300);
            
            // Point near camera should be in view
            expect(camera.isInView(400, 300)).to.be.true;
            expect(camera.isInView(450, 350)).to.be.true;
        });

        it('should return false for points far from camera', () => {
            camera.moveTo(400, 300);
            
            // Point very far away should not be in view
            expect(camera.isInView(10000, 10000)).to.be.false;
        });

        it('should check if rectangle is in view', () => {
            camera.moveTo(400, 300);
            
            // Rectangle overlapping camera view
            expect(camera.isRectInView(300, 200, 100, 100)).to.be.true;
        });

        it('should return false for rectangles outside view', () => {
            camera.moveTo(400, 300);
            
            // Rectangle far away
            expect(camera.isRectInView(10000, 10000, 50, 50)).to.be.false;
        });
    });

    describe('shake effect', () => {
        it('should have shake method', () => {
            expect(camera.shake).to.be.a('function');
        });

        it('should apply temporary offset when shaking', () => {
            const originalX = camera.x;
            const originalY = camera.y;
            
            camera.shake(10, 0.5); // Intensity 10, duration 0.5s
            camera.update();
            
            // Position should remain the same
            expect(camera.x).to.equal(originalX);
            expect(camera.y).to.equal(originalY);
            
            // But worldToScreen should be affected by shake offset
            const screen1 = camera.worldToScreen(400, 300);
            camera.update();
            const screen2 = camera.worldToScreen(400, 300);
            
            // Shake should cause screen coordinates to vary
            const hasShake = screen1.x !== screen2.x || screen1.y !== screen2.y;
            expect(hasShake).to.be.true;
        });

        it('should return to original position after shake duration', () => {
            camera.moveTo(400, 300);
            camera.shake(10, 0.1); // Short duration
            
            // Update many times (simulate time passing)
            for (let i = 0; i < 100; i++) {
                camera.update();
            }
            
            // Should be back to original position
            expect(camera.x).to.be.closeTo(400, 0.1);
            expect(camera.y).to.be.closeTo(300, 0.1);
        });
    });
});


