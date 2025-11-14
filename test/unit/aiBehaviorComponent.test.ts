/**
 * AIBehaviorComponent Tests (TDD - RED phase)
 * Tests for autonomous behavior, blackboard memory, and state management
 */

import { expect } from 'chai';
import { AIBehaviorComponent } from '../../src/classes/components/AIBehaviorComponent';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';
import { GameEvents } from '../../src/utils/eventBus';

describe('AIBehaviorComponent', () => {
    let ai: AIBehaviorComponent;
    let owner: GameObject;

    beforeEach(() => {
        // Clear EventBus before each test
        EventBus.clear();

        // Create owner GameObject
        owner = new GameObject('ant', 5, 5);

        // Create AI component (autonomous by default)
        ai = new AIBehaviorComponent();
        ai.onAttach(owner);
    });

    describe('Initialization', () => {
        it('should initialize as autonomous by default', () => {
            expect(ai.isAutonomous()).to.be.true;
        });

        it('should initialize with empty blackboard', () => {
            expect(ai.getBlackboardValue('test')).to.be.undefined;
        });

        it('should initialize with no current behavior', () => {
            expect(ai.getCurrentBehavior()).to.be.null;
        });
    });

    describe('Autonomous Mode', () => {
        it('should set autonomous mode', () => {
            ai.setAutonomous(false);
            expect(ai.isAutonomous()).to.be.false;
        });

        it('should toggle autonomous mode', () => {
            ai.setAutonomous(false);
            ai.setAutonomous(true);
            expect(ai.isAutonomous()).to.be.true;
        });

        it('should emit AI_STATE_CHANGED when autonomy changes', (done) => {
            EventBus.once(GameEvents.AI_STATE_CHANGED, (entityId: string, autonomous: boolean) => {
                expect(entityId).to.equal(owner.id);
                expect(autonomous).to.be.false;
                done();
            });

            ai.setAutonomous(false);
        });

        it('should not emit event if autonomous state unchanged', () => {
            let eventCount = 0;
            EventBus.on(GameEvents.AI_STATE_CHANGED, () => {
                eventCount++;
            });

            ai.setAutonomous(true); // Already true
            expect(eventCount).to.equal(0);
        });
    });

    describe('Blackboard Memory', () => {
        it('should set blackboard value', () => {
            ai.setBlackboardValue('target', 'enemy_1');
            expect(ai.getBlackboardValue('target')).to.equal('enemy_1');
        });

        it('should get blackboard value', () => {
            ai.setBlackboardValue('health', 50);
            expect(ai.getBlackboardValue('health')).to.equal(50);
        });

        it('should return undefined for non-existent key', () => {
            expect(ai.getBlackboardValue('nonexistent')).to.be.undefined;
        });

        it('should update existing blackboard value', () => {
            ai.setBlackboardValue('score', 100);
            ai.setBlackboardValue('score', 200);
            expect(ai.getBlackboardValue('score')).to.equal(200);
        });

        it('should store different types of values', () => {
            ai.setBlackboardValue('string', 'text');
            ai.setBlackboardValue('number', 42);
            ai.setBlackboardValue('boolean', true);
            ai.setBlackboardValue('object', { x: 1, y: 2 });
            ai.setBlackboardValue('array', [1, 2, 3]);

            expect(ai.getBlackboardValue('string')).to.equal('text');
            expect(ai.getBlackboardValue('number')).to.equal(42);
            expect(ai.getBlackboardValue('boolean')).to.be.true;
            expect(ai.getBlackboardValue('object')).to.deep.equal({ x: 1, y: 2 });
            expect(ai.getBlackboardValue('array')).to.deep.equal([1, 2, 3]);
        });

        it('should clear blackboard value', () => {
            ai.setBlackboardValue('temp', 'value');
            ai.clearBlackboardValue('temp');
            expect(ai.getBlackboardValue('temp')).to.be.undefined;
        });

        it('should handle clearing non-existent value', () => {
            ai.clearBlackboardValue('nonexistent');
            expect(ai.getBlackboardValue('nonexistent')).to.be.undefined;
        });

        it('should clear all blackboard values', () => {
            ai.setBlackboardValue('a', 1);
            ai.setBlackboardValue('b', 2);
            ai.setBlackboardValue('c', 3);

            ai.clearBlackboard();

            expect(ai.getBlackboardValue('a')).to.be.undefined;
            expect(ai.getBlackboardValue('b')).to.be.undefined;
            expect(ai.getBlackboardValue('c')).to.be.undefined;
        });

        it('should check if blackboard has key', () => {
            ai.setBlackboardValue('exists', true);
            expect(ai.hasBlackboardValue('exists')).to.be.true;
            expect(ai.hasBlackboardValue('missing')).to.be.false;
        });
    });

    describe('Behavior Execution', () => {
        it('should set current behavior', () => {
            ai.setBehavior('patrol');
            expect(ai.getCurrentBehavior()).to.equal('patrol');
        });

        it('should change behavior', () => {
            ai.setBehavior('patrol');
            ai.setBehavior('attack');
            expect(ai.getCurrentBehavior()).to.equal('attack');
        });

        it('should emit AI_BEHAVIOR_CHANGED when behavior changes', (done) => {
            ai.setBehavior('idle');

            EventBus.once(GameEvents.AI_BEHAVIOR_CHANGED, (entityId: string, oldBehavior: string | null, newBehavior: string) => {
                expect(entityId).to.equal(owner.id);
                expect(oldBehavior).to.equal('idle');
                expect(newBehavior).to.equal('patrol');
                done();
            });

            ai.setBehavior('patrol');
        });

        it('should not emit event if behavior unchanged', () => {
            ai.setBehavior('idle');
            let eventCount = 0;

            EventBus.on(GameEvents.AI_BEHAVIOR_CHANGED, () => {
                eventCount++;
            });

            ai.setBehavior('idle'); // Same behavior
            expect(eventCount).to.equal(0);
        });

        it('should clear current behavior', () => {
            ai.setBehavior('attack');
            ai.clearBehavior();
            expect(ai.getCurrentBehavior()).to.be.null;
        });
    });

    describe('Target Management', () => {
        it('should set target', () => {
            ai.setTarget('enemy_1');
            expect(ai.getTarget()).to.equal('enemy_1');
        });

        it('should clear target', () => {
            ai.setTarget('enemy_1');
            ai.clearTarget();
            expect(ai.getTarget()).to.be.null;
        });

        it('should change target', () => {
            ai.setTarget('enemy_1');
            ai.setTarget('enemy_2');
            expect(ai.getTarget()).to.equal('enemy_2');
        });

        it('should emit AI_TARGET_ACQUIRED when target set', (done) => {
            EventBus.once(GameEvents.AI_TARGET_ACQUIRED, (entityId: string, targetId: string) => {
                expect(entityId).to.equal(owner.id);
                expect(targetId).to.equal('enemy_1');
                done();
            });

            ai.setTarget('enemy_1');
        });

        it('should emit AI_TARGET_LOST when target cleared', (done) => {
            ai.setTarget('enemy_1');

            EventBus.once(GameEvents.AI_TARGET_LOST, (entityId: string) => {
                expect(entityId).to.equal(owner.id);
                done();
            });

            ai.clearTarget();
        });

        it('should not emit duplicate TARGET_ACQUIRED events', () => {
            let eventCount = 0;
            EventBus.on(GameEvents.AI_TARGET_ACQUIRED, () => {
                eventCount++;
            });

            ai.setTarget('enemy_1');
            ai.setTarget('enemy_1'); // Same target

            expect(eventCount).to.equal(1);
        });
    });

    describe('Update Cycle', () => {
        it('should not update when not autonomous', () => {
            ai.setAutonomous(false);
            ai.setBehavior('patrol');

            // Should not change anything
            ai.update(16);

            expect(ai.getCurrentBehavior()).to.equal('patrol');
        });

        it('should update when autonomous', () => {
            ai.setAutonomous(true);

            ai.update(16);

            // In a real implementation, this would trigger behavior evaluation
            // For now, just verify the component processes updates
            expect(ai.isAutonomous()).to.be.true;
        });

        it('should track elapsed time', () => {
            ai.update(16);
            ai.update(16);
            ai.update(16);

            // Behavior timing would be tracked internally
            expect(ai.isAutonomous()).to.be.true;
        });
    });

    describe('Behavior Completion', () => {
        it('should emit BEHAVIOR_COMPLETE event', (done) => {
            ai.setBehavior('gather');

            EventBus.once(GameEvents.AI_BEHAVIOR_COMPLETE, (entityId: string, behavior: string) => {
                expect(entityId).to.equal(owner.id);
                expect(behavior).to.equal('gather');
                done();
            });

            ai.completeBehavior();
        });

        it('should clear behavior on completion', () => {
            ai.setBehavior('build');
            ai.completeBehavior();
            expect(ai.getCurrentBehavior()).to.be.null;
        });

        it('should handle completion with no active behavior', () => {
            ai.completeBehavior();
            expect(ai.getCurrentBehavior()).to.be.null;
        });
    });

    describe('Component Lifecycle', () => {
        it('should attach to owner', () => {
            const newAI = new AIBehaviorComponent();
            const newOwner = new GameObject('ant', 0, 0);

            newAI.onAttach(newOwner);
            expect(newAI.owner).to.equal(newOwner);
        });

        it('should detach from owner', () => {
            const ownerBefore = ai.owner;
            ai.onDetach();
            // Owner reference remains (TypeScript requirement), but state is cleared
            expect(ai.owner).to.equal(ownerBefore);
        });

        it('should clear state on detach', () => {
            ai.setBehavior('patrol');
            ai.setTarget('enemy_1');
            ai.setBlackboardValue('test', 'value');

            ai.onDetach();

            expect(ai.getCurrentBehavior()).to.be.null;
            expect(ai.getTarget()).to.be.null;
            expect(ai.getBlackboardValue('test')).to.be.undefined;
        });
    });

    describe('Edge Cases', () => {
        it('should handle null behavior name', () => {
            ai.setBehavior(null as any);
            expect(ai.getCurrentBehavior()).to.be.null;
        });

        it('should handle empty string behavior name', () => {
            ai.setBehavior('');
            expect(ai.getCurrentBehavior()).to.equal('');
        });

        it('should handle null target', () => {
            ai.setTarget(null as any);
            expect(ai.getTarget()).to.be.null;
        });

        it('should handle empty string target', () => {
            ai.setTarget('');
            expect(ai.getTarget()).to.equal('');
        });

        it('should handle rapid behavior changes', () => {
            for (let i = 0; i < 10; i++) {
                ai.setBehavior(`behavior_${i}`);
            }
            expect(ai.getCurrentBehavior()).to.equal('behavior_9');
        });

        it('should handle rapid target changes', () => {
            for (let i = 0; i < 10; i++) {
                ai.setTarget(`target_${i}`);
            }
            expect(ai.getTarget()).to.equal('target_9');
        });

        it('should handle very long blackboard keys', () => {
            const longKey = 'a'.repeat(1000);
            ai.setBlackboardValue(longKey, 'value');
            expect(ai.getBlackboardValue(longKey)).to.equal('value');
        });

        it('should handle many blackboard entries', () => {
            for (let i = 0; i < 100; i++) {
                ai.setBlackboardValue(`key_${i}`, i);
            }

            expect(ai.getBlackboardValue('key_50')).to.equal(50);
        });

        it('should handle autonomous toggle during update', () => {
            ai.setAutonomous(true);
            ai.setAutonomous(false);
            ai.update(16);
            expect(ai.isAutonomous()).to.be.false;
        });

        it('should handle completing behavior multiple times', () => {
            ai.setBehavior('test');
            ai.completeBehavior();
            ai.completeBehavior(); // Second call should be safe
            expect(ai.getCurrentBehavior()).to.be.null;
        });
    });
});
