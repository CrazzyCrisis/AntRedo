/**
 * Focused Camera Diagnostic Tests
 * Test camera update logic in isolation to find the bug
 */

import { expect } from 'chai';
import { Camera } from '../../src/rendering/Camera';

describe('Camera Update Logic Diagnostic Tests', () => {
    let camera: Camera;

    beforeEach(() => {
        camera = new Camera(0, 0, 800, 600);
    });

    describe('CRITICAL: follow() and update() timing', () => {
        it('should NOT move camera if update() called before follow()', () => {
            camera.update(); // Called FIRST (wrong order)
            camera.follow(1000, 1000); // Called SECOND
            
            // Camera should still be at origin
            expect(camera.x).to.equal(0);
            expect(camera.y).to.equal(0);
        });

        it('should move camera if follow() called before update()', () => {
            camera.follow(1000, 1000); // Called FIRST (correct order)
            camera.update(); // Called SECOND
            
            // Camera should have moved towards target
            expect(camera.x).to.be.greaterThan(0);
            expect(camera.y).to.be.greaterThan(0);
        });

        it('should continue following if follow() set again after update()', () => {
            camera.follow(500, 500);
            camera.update();
            
            const positionAfterFirstUpdate = camera.x;
            
            // Set follow again (like in game loop)
            camera.follow(500, 500);
            camera.update();
            
            // Camera should have moved closer
            expect(camera.x).to.be.greaterThan(positionAfterFirstUpdate);
        });
    });

    describe('Smoothing Effect on Movement', () => {
        it('should move 90% of distance with smoothing=0.1', () => {
            camera.setSmoothing(0.1);
            camera.follow(1000, 0);
            camera.update();
            
            // With smoothing 0.1, camera moves (1 - 0.1) = 0.9 of distance
            const expectedX = 1000 * 0.9;
            expect(camera.x).to.be.closeTo(expectedX, 1);
        });

        it('should barely move with smoothing=0.9', () => {
            camera.setSmoothing(0.9);
            camera.follow(1000, 0);
            camera.update();
            
            // With smoothing 0.9, camera moves (1 - 0.9) = 0.1 of distance
            const expectedX = 1000 * 0.1;
            expect(camera.x).to.be.closeTo(expectedX, 1);
        });

        it('should move instantly with smoothing=0', () => {
            camera.setSmoothing(0);
            camera.follow(1000, 500);
            camera.update();
            
            // With no smoothing, camera should reach target immediately
            expect(camera.x).to.equal(1000);
            expect(camera.y).to.equal(500);
        });
    });

    describe('moveTo() vs follow()', () => {
        it('should jump immediately with moveTo(), ignoring smoothing', () => {
            camera.setSmoothing(0.9); // High smoothing
            camera.moveTo(1000, 1000);
            
            // Should jump immediately, no update() needed
            expect(camera.x).to.equal(1000);
            expect(camera.y).to.equal(1000);
        });

        it('should clear follow target when moveTo() called', () => {
            camera.follow(500, 500);
            camera.moveTo(100, 100);
            
            // Update should NOT move camera (target cleared)
            camera.update();
            
            expect(camera.x).to.equal(100);
            expect(camera.y).to.equal(100);
        });
    });

    describe('Target Tracking', () => {
        it('should store follow target internally', () => {
            camera.follow(1500, 2000);
            
            const targetX = (camera as any).targetX;
            const targetY = (camera as any).targetY;
            
            expect(targetX).to.equal(1500);
            expect(targetY).to.equal(2000);
        });

        it('should clear target when moveTo() called', () => {
            camera.follow(1500, 2000);
            camera.moveTo(0, 0);
            
            const targetX = (camera as any).targetX;
            const targetY = (camera as any).targetY;
            
            expect(targetX).to.be.null;
            expect(targetY).to.be.null;
        });

        it('should update target with new follow() call', () => {
            camera.follow(1000, 1000);
            
            let target1 = (camera as any).targetX;
            expect(target1).to.equal(1000);
            
            camera.follow(2000, 2000);
            
            let target2 = (camera as any).targetX;
            expect(target2).to.equal(2000);
        });
    });

    describe('Real-World Scenario: Game Loop', () => {
        it('should simulate typical game loop pattern', () => {
            let queenX = 3200; // Queen world position
            let queenY = 2400;
            
            // Frame 1: Initialize
            camera.moveTo(queenX, queenY);
            expect(camera.x).to.equal(queenX);
            
            // Frame 2-5: Queen moves, camera follows
            for (let frame = 0; frame < 4; frame++) {
                queenX += 32; // Move 1 tile right
                camera.follow(queenX, queenY);
                camera.update();
            }
            
            // Camera should have moved right
            expect(camera.x).to.be.greaterThan(3200);
            expect(camera.x).to.be.lessThan(queenX); // Not caught up yet due to smoothing
        });

        it('should track moving target over many frames', () => {
            let targetX = 100;
            const positions: number[] = [];
            
            for (let frame = 0; frame < 20; frame++) {
                targetX += 10; // Target keeps moving
                camera.follow(targetX, 0);
                camera.update();
                positions.push(camera.x);
            }
            
            // Camera should be continuously moving
            for (let i = 1; i < positions.length; i++) {
                expect(positions[i]).to.be.greaterThan(positions[i - 1]);
            }
        });
    });

    describe('DIAGNOSTIC: Reproduce Showcase Bug', () => {
        it('should reproduce exact showcase pattern', () => {
            // Scene enter(): moveTo queen position
            const queenSpawnX = 100 * 32; // Grid 100 = world 3200
            const queenSpawnY = 75 * 32;  // Grid 75 = world 2400
            
            camera.moveTo(queenSpawnX, queenSpawnY);
            
            console.log(`\n=== Scene Enter ===`);
            console.log(`Camera after moveTo: (${camera.x}, ${camera.y})`);
            expect(camera.x).to.equal(queenSpawnX);
            expect(camera.y).to.equal(queenSpawnY);
            
            // Queen moves via input
            const newQueenX = 101 * 32; // Moved 1 tile right
            const newQueenY = 75 * 32;
            
            console.log(`\n=== Queen Moved (via input) ===`);
            console.log(`Queen new position: (${newQueenX}, ${newQueenY})`);
            
            // Scene update() pattern (BEFORE fix):
            // 1. camera.update() - WRONG ORDER
            // 2. handleQueenMovement()
            // 3. camera.follow(queen.worldX, queen.worldY)
            
            console.log(`\n=== WRONG ORDER (Bug) ===`);
            camera.moveTo(queenSpawnX, queenSpawnY); // Reset
            camera.update(); // Called FIRST - target not set yet!
            camera.follow(newQueenX, newQueenY); // Called SECOND
            
            console.log(`Camera after wrong order: (${camera.x}, ${camera.y})`);
            console.log(`Camera target: (${(camera as any).targetX}, ${(camera as any).targetY})`);
            expect(camera.x).to.equal(queenSpawnX); // Didn't move!
            
            // Scene update() pattern (AFTER fix):
            // 1. handleQueenMovement()
            // 2. camera.follow(queen.worldX, queen.worldY)
            // 3. camera.update() - CORRECT ORDER
            
            console.log(`\n=== CORRECT ORDER (Fixed) ===`);
            camera.moveTo(queenSpawnX, queenSpawnY); // Reset
            camera.follow(newQueenX, newQueenY); // Called FIRST
            camera.update(); // Called SECOND
            
            console.log(`Camera after correct order: (${camera.x}, ${camera.y})`);
            console.log(`Camera target: (${(camera as any).targetX}, ${(camera as any).targetY})`);
            expect(camera.x).to.be.greaterThan(queenSpawnX); // DID move!
        });
    });
});
