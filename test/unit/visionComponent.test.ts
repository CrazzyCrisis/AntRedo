/**
 * VisionComponent Tests (TDD - RED phase)
 * Tests for vision detection, cone/circle vision, and entity tracking
 */

import { expect } from 'chai';
import { VisionComponent } from '../../src/classes/components/VisionComponent';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';
import { GameEvents } from '../../src/utils/eventBus';

describe('VisionComponent', () => {
    let vision: VisionComponent;
    let owner: GameObject;
    let target: GameObject;

    beforeEach(() => {
        // Clear EventBus before each test
        EventBus.clear();

        // Create owner and target GameObjects
        owner = new GameObject('ant', 5, 5);
        target = new GameObject('enemy', 8, 5);

        // Create vision component with circle vision (360 degrees, range 5)
        vision = new VisionComponent(5, 360);
        vision.onAttach(owner);
    });

    describe('Initialization', () => {
        it('should initialize with vision range', () => {
            expect(vision.getVisionRange()).to.equal(5);
        });

        it('should initialize with vision angle', () => {
            expect(vision.getVisionAngle()).to.equal(360);
        });

        it('should start with no detected entities', () => {
            expect(vision.getDetectedEntities().size).to.equal(0);
        });

        it('should default vision direction to 0', () => {
            expect(vision.getVisionDirection()).to.equal(0);
        });
    });

    describe('Circle Vision (360 degrees)', () => {
        it('should detect entity within range', () => {
            const canSee = vision.canSee(target);
            expect(canSee).to.be.true;
        });

        it('should not detect entity outside range', () => {
            const farTarget = new GameObject('enemy', 20, 20);
            const canSee = vision.canSee(farTarget);
            expect(canSee).to.be.false;
        });

        it('should detect entity at exact range boundary', () => {
            const edgeTarget = new GameObject('enemy', 10, 5); // Distance = 5
            const canSee = vision.canSee(edgeTarget);
            expect(canSee).to.be.true;
        });

        it('should detect entities in all directions', () => {
            const north = new GameObject('enemy', 5, 2);
            const south = new GameObject('enemy', 5, 8);
            const east = new GameObject('enemy', 8, 5);
            const west = new GameObject('enemy', 2, 5);

            expect(vision.canSee(north)).to.be.true;
            expect(vision.canSee(south)).to.be.true;
            expect(vision.canSee(east)).to.be.true;
            expect(vision.canSee(west)).to.be.true;
        });

        it('should detect entity at same position', () => {
            const samePos = new GameObject('enemy', 5, 5);
            const canSee = vision.canSee(samePos);
            expect(canSee).to.be.true;
        });
    });

    describe('Cone Vision', () => {
        beforeEach(() => {
            // Create cone vision (90 degree cone, facing right = 0 radians)
            vision = new VisionComponent(5, 90);
            vision.onAttach(owner);
            vision.setVisionDirection(0); // Facing right (east)
        });

        it('should detect entity directly ahead', () => {
            const ahead = new GameObject('enemy', 8, 5); // To the right
            expect(vision.canSee(ahead)).to.be.true;
        });

        it('should detect entity within cone angle', () => {
            const withinCone = new GameObject('enemy', 7, 6); // Slightly up-right
            expect(vision.canSee(withinCone)).to.be.true;
        });

        it('should not detect entity outside cone angle', () => {
            const behind = new GameObject('enemy', 2, 5); // Behind (left)
            expect(vision.canSee(behind)).to.be.false;
        });

        it('should not detect entity perpendicular to cone', () => {
            const perpendicular = new GameObject('enemy', 5, 2); // Directly north
            expect(vision.canSee(perpendicular)).to.be.false;
        });

        it('should respect cone angle limits', () => {
            // 90 degree cone = 45 degrees on each side
            const justInside = new GameObject('enemy', 7, 7); // ~45 degrees
            const justOutside = new GameObject('enemy', 5, 8); // ~90 degrees (outside)
            
            expect(vision.canSee(justInside)).to.be.true;
            expect(vision.canSee(justOutside)).to.be.false;
        });
    });

    describe('Vision Direction', () => {
        beforeEach(() => {
            vision = new VisionComponent(5, 90);
            vision.onAttach(owner);
        });

        it('should set vision direction', () => {
            vision.setVisionDirection(Math.PI / 2); // 90 degrees (north)
            expect(vision.getVisionDirection()).to.equal(Math.PI / 2);
        });

        it('should detect based on updated direction', () => {
            vision.setVisionDirection(Math.PI); // 180 degrees (west)
            
            const west = new GameObject('enemy', 2, 5);
            const east = new GameObject('enemy', 8, 5);
            
            expect(vision.canSee(west)).to.be.true;
            expect(vision.canSee(east)).to.be.false;
        });

        it('should handle negative angles', () => {
            vision.setVisionDirection(-Math.PI / 2); // -90 degrees (south)
            const south = new GameObject('enemy', 5, 8);
            expect(vision.canSee(south)).to.be.true;
        });

        it('should handle angles greater than 2π', () => {
            vision.setVisionDirection(Math.PI * 3); // 540 degrees = 180 degrees
            const west = new GameObject('enemy', 2, 5);
            expect(vision.canSee(west)).to.be.true;
        });
    });

    describe('Visible Entities Tracking', () => {
        it('should track visible entities', () => {
            const entities = [
                new GameObject('enemy', 6, 5),
                new GameObject('enemy', 7, 5),
                new GameObject('enemy', 20, 20)
            ];

            const visible = vision.getVisibleEntities(entities);
            expect(visible.length).to.equal(2);
        });

        it('should return empty array when no entities visible', () => {
            const entities = [
                new GameObject('enemy', 20, 20),
                new GameObject('enemy', 30, 30)
            ];

            const visible = vision.getVisibleEntities(entities);
            expect(visible.length).to.equal(0);
        });

        it('should update detected entities set', () => {
            const entities = [
                new GameObject('enemy', 6, 5),
                new GameObject('enemy', 7, 5)
            ];

            vision.getVisibleEntities(entities);
            expect(vision.getDetectedEntities().size).to.equal(2);
        });

        it('should emit ENTITY_DETECTED for newly visible entities', (done) => {
            const entity = new GameObject('enemy', 6, 5);
            let eventCount = 0;

            EventBus.on(GameEvents.ENTITY_DETECTED, (observerId: string, targetId: string) => {
                eventCount++;
                expect(observerId).to.equal(owner.id);
                expect(targetId).to.equal(entity.id);
                
                if (eventCount === 1) {
                    done();
                }
            });

            vision.getVisibleEntities([entity]);
        });

        it('should emit ENTITY_LOST when entity leaves vision', (done) => {
            const entity = new GameObject('enemy', 6, 5);
            
            // First see the entity
            vision.getVisibleEntities([entity]);

            EventBus.once(GameEvents.ENTITY_LOST, (observerId: string, targetId: string) => {
                expect(observerId).to.equal(owner.id);
                expect(targetId).to.equal(entity.id);
                done();
            });

            // Move entity out of range
            entity.moveTo(20, 20);
            vision.getVisibleEntities([entity]);
        });

        it('should not emit duplicate ENTITY_DETECTED events', () => {
            const entity = new GameObject('enemy', 6, 5);
            let eventCount = 0;

            EventBus.on(GameEvents.ENTITY_DETECTED, () => {
                eventCount++;
            });

            // See entity twice
            vision.getVisibleEntities([entity]);
            vision.getVisibleEntities([entity]);

            expect(eventCount).to.equal(1); // Should only emit once
        });

        it('should handle empty entity array', () => {
            const visible = vision.getVisibleEntities([]);
            expect(visible.length).to.equal(0);
        });
    });

    describe('Vision Range Changes', () => {
        it('should set new vision range', () => {
            vision.setVisionRange(10);
            expect(vision.getVisionRange()).to.equal(10);
        });

        it('should detect entities with increased range', () => {
            const farTarget = new GameObject('enemy', 12, 5);
            
            expect(vision.canSee(farTarget)).to.be.false;
            
            vision.setVisionRange(10);
            expect(vision.canSee(farTarget)).to.be.true;
        });

        it('should not detect entities with decreased range', () => {
            expect(vision.canSee(target)).to.be.true;
            
            vision.setVisionRange(2);
            expect(vision.canSee(target)).to.be.false;
        });

        it('should handle zero range', () => {
            vision.setVisionRange(0);
            const samePos = new GameObject('enemy', 5, 5);
            expect(vision.canSee(samePos)).to.be.true; // Same position should still be visible
        });

        it('should clamp negative range to zero', () => {
            vision.setVisionRange(-5);
            expect(vision.getVisionRange()).to.equal(0);
        });
    });

    describe('Vision Angle Changes', () => {
        beforeEach(() => {
            vision = new VisionComponent(5, 90);
            vision.onAttach(owner);
        });

        it('should set new vision angle', () => {
            vision.setVisionAngle(180);
            expect(vision.getVisionAngle()).to.equal(180);
        });

        it('should detect more entities with wider angle', () => {
            vision.setVisionDirection(0); // Face right
            const behind = new GameObject('enemy', 2, 5);
            
            expect(vision.canSee(behind)).to.be.false;
            
            vision.setVisionAngle(360); // Full circle
            expect(vision.canSee(behind)).to.be.true;
        });

        it('should detect fewer entities with narrower angle', () => {
            vision.setVisionAngle(360); // Start with full circle
            vision.setVisionDirection(0);
            
            const behind = new GameObject('enemy', 2, 5);
            expect(vision.canSee(behind)).to.be.true;
            
            vision.setVisionAngle(45); // Narrow cone
            expect(vision.canSee(behind)).to.be.false;
        });

        it('should clamp negative angle to zero', () => {
            vision.setVisionAngle(-90);
            expect(vision.getVisionAngle()).to.equal(0);
        });

        it('should allow angles greater than 360', () => {
            vision.setVisionAngle(720);
            expect(vision.getVisionAngle()).to.equal(720);
        });
    });

    describe('Component Lifecycle', () => {
        it('should attach to owner', () => {
            const newVision = new VisionComponent(5, 360);
            const newOwner = new GameObject('ant', 0, 0);

            newVision.onAttach(newOwner);
            expect(newVision.owner).to.equal(newOwner);
        });

        it('should detach from owner', () => {
            vision.onDetach();
            expect(vision.owner).to.be.undefined;
        });

        it('should clear detected entities on detach', () => {
            const entities = [new GameObject('enemy', 6, 5)];
            vision.getVisibleEntities(entities);
            
            vision.onDetach();
            expect(vision.getDetectedEntities().size).to.equal(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle null target in canSee', () => {
            const canSee = vision.canSee(null as any);
            expect(canSee).to.be.false;
        });

        it('should handle undefined target in canSee', () => {
            const canSee = vision.canSee(undefined as any);
            expect(canSee).to.be.false;
        });

        it('should handle very large vision range', () => {
            vision.setVisionRange(1000000);
            const farTarget = new GameObject('enemy', 10000, 10000);
            expect(vision.canSee(farTarget)).to.be.true;
        });

        it('should handle very narrow cone (1 degree)', () => {
            vision = new VisionComponent(5, 1);
            vision.onAttach(owner);
            vision.setVisionDirection(0);
            
            const exactlyAhead = new GameObject('enemy', 8, 5);
            const slightlyOff = new GameObject('enemy', 8, 6);
            
            expect(vision.canSee(exactlyAhead)).to.be.true;
            expect(vision.canSee(slightlyOff)).to.be.false;
        });

        it('should handle entity at owner position', () => {
            const samePos = new GameObject('enemy', 5, 5);
            expect(vision.canSee(samePos)).to.be.true;
        });

        it('should handle rapid direction changes', () => {
            vision = new VisionComponent(5, 90);
            vision.onAttach(owner);
            
            for (let i = 0; i < 10; i++) {
                vision.setVisionDirection(i * Math.PI / 4);
            }
            
            expect(vision.getVisionDirection()).to.be.closeTo(9 * Math.PI / 4, 0.001);
        });

        it('should handle seeing owner entity', () => {
            const canSee = vision.canSee(owner);
            expect(canSee).to.be.true; // Can always see self
        });

        it('should filter out owner from visible entities', () => {
            const entities = [owner, new GameObject('enemy', 6, 5)];
            const visible = vision.getVisibleEntities(entities);
            
            // Should not include owner in visible entities
            expect(visible.length).to.equal(1);
            expect(visible[0].id).to.not.equal(owner.id);
        });
    });
});
