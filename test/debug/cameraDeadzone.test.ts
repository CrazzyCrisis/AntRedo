import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { Camera } from '../../src/rendering/Camera';

describe('Camera Deadzone Tests', () => {
    let camera: Camera;
    
    beforeEach(() => {
        camera = new Camera(0, 0, 800, 600);
    });
    
    describe('Deadzone Initialization', () => {
        it('should default to 0 deadzone (no deadzone)', () => {
            camera.follow(100, 100);
            const moved = camera.update();
            
            // With no deadzone, camera should move towards target immediately
            expect(moved).to.be.true;
            expect(camera.x).to.be.greaterThan(0);
        });
        
        it('should allow setting deadzone', () => {
            camera.setDeadzone(200, 150);
            
            // Camera should have deadzone set (we can't directly check private properties)
            // But we can test behavior
            camera.follow(50, 50); // Small movement within deadzone
            const moved = camera.update();
            
            // Should NOT move (target within deadzone)
            expect(moved).to.be.false;
            expect(camera.x).to.equal(0);
            expect(camera.y).to.equal(0);
        });
    });
    
    describe('Deadzone Behavior', () => {
        beforeEach(() => {
            camera.setDeadzone(200, 150); // 200px wide, 150px tall
            camera.setSmoothing(0); // Instant movement for easier testing
        });
        
        it('should NOT move camera if target within deadzone', () => {
            // Deadzone is 200x150, so half-width = 100, half-height = 75
            // Target at (50, 50) is within deadzone
            camera.follow(50, 50);
            camera.update();
            
            expect(camera.x).to.equal(0);
            expect(camera.y).to.equal(0);
        });
        
        it('should move camera if target outside deadzone horizontally', () => {
            // Target at (150, 0) - outside horizontal deadzone (>100px)
            camera.follow(150, 0);
            camera.update();
            
            // Camera should move, but only by (distance - deadzoneHalfWidth)
            // 150 - 100 = 50 pixels of movement
            expect(camera.x).to.be.greaterThan(0);
            expect(camera.y).to.equal(0); // No vertical movement
        });
        
        it('should move camera if target outside deadzone vertically', () => {
            // Target at (0, 100) - outside vertical deadzone (>75px)
            camera.follow(0, 100);
            camera.update();
            
            expect(camera.x).to.equal(0); // No horizontal movement
            expect(camera.y).to.be.greaterThan(0);
        });
        
        it('should move camera if target outside deadzone diagonally', () => {
            // Target at (150, 100) - outside both horizontal and vertical deadzone
            camera.follow(150, 100);
            camera.update();
            
            expect(camera.x).to.be.greaterThan(0);
            expect(camera.y).to.be.greaterThan(0);
        });
        
        it('should clamp movement to deadzone edge', () => {
            camera.setSmoothing(0); // Instant movement
            
            // Target at (120, 0) - slightly outside deadzone (20px beyond)
            // Half deadzone = 100, so target is at 120, movement should be 120-100 = 20
            camera.follow(120, 0);
            camera.update();
            
            expect(camera.x).to.equal(20);
            expect(camera.y).to.equal(0);
        });
    });
    
    describe('Deadzone with Smoothing', () => {
        it('should combine deadzone and smoothing', () => {
            camera.setDeadzone(200, 150);
            camera.setSmoothing(0.5); // 50% smoothing
            
            // Target outside deadzone
            camera.follow(200, 0);
            camera.update();
            
            // Should move, but not full distance due to smoothing
            expect(camera.x).to.be.greaterThan(0);
            expect(camera.x).to.be.lessThan(100); // Shouldn't reach full (200-100) = 100
        });
    });
    
    describe('Negative Deadzone Values', () => {
        it('should handle zero deadzone (no deadzone)', () => {
            camera.setDeadzone(0, 0);
            camera.follow(50, 50);
            camera.update();
            
            // Should move immediately with no deadzone
            expect(camera.x).to.be.greaterThan(0);
            expect(camera.y).to.be.greaterThan(0);
        });
    });
});
