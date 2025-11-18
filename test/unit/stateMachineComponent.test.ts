/**
 * Tests for StateMachineComponent (MODEL)
 * Following TDD: Write tests first, then implementation
 */

import { expect } from 'chai';
import { StateMachineComponent, EntityState } from '../../src/classes/components/StateMachineComponent';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';

describe('StateMachineComponent', () => {
    let gameObject: GameObject;
    let stateMachine: StateMachineComponent;

    beforeEach(() => {
        gameObject = new GameObject('test', 0, 0);
        stateMachine = new StateMachineComponent(EntityState.IDLE);
        gameObject.addComponent('stateMachine', stateMachine);
    });

    afterEach(() => {
        gameObject.destroy();
    });

    describe('Initialization', () => {
        it('should initialize with given state', () => {
            const sm = new StateMachineComponent(EntityState.GATHERING);
            expect(sm.getCurrentState()).to.equal(EntityState.GATHERING);
        });

        it('should have empty previous state on init', () => {
            expect(stateMachine.getPreviousState()).to.be.undefined;
        });

        it('should have empty state history on init', () => {
            expect(stateMachine.getStateHistory()).to.be.an('array').that.is.empty;
        });
    });

    describe('State Transitions', () => {
        it('should transition to new state', () => {
            stateMachine.setState(EntityState.GATHERING);
            expect(stateMachine.getCurrentState()).to.equal(EntityState.GATHERING);
        });

        it('should store previous state after transition', () => {
            stateMachine.setState(EntityState.GATHERING);
            stateMachine.setState(EntityState.COMBAT);
            
            expect(stateMachine.getPreviousState()).to.equal(EntityState.GATHERING);
        });

        it('should record state history', () => {
            stateMachine.setState(EntityState.GATHERING);
            stateMachine.setState(EntityState.COMBAT);
            stateMachine.setState(EntityState.IDLE);

            const history = stateMachine.getStateHistory();
            expect(history).to.have.lengthOf(3);
            expect(history[0]).to.equal(EntityState.GATHERING);
            expect(history[1]).to.equal(EntityState.COMBAT);
            expect(history[2]).to.equal(EntityState.IDLE);
        });

        it('should emit STATE_CHANGED event on transition', () => {
            let emitted = false;
            let capturedOldState: EntityState | undefined;
            let capturedNewState: EntityState | undefined;

            EventBus.on('STATE_CHANGED', (_entityId: string, oldState: EntityState, newState: EntityState) => {
                emitted = true;
                capturedOldState = oldState;
                capturedNewState = newState;
            });

            stateMachine.setState(EntityState.COMBAT);

            expect(emitted).to.be.true;
            expect(capturedOldState).to.equal(EntityState.IDLE);
            expect(capturedNewState).to.equal(EntityState.COMBAT);
        });

        it('should not emit event if state unchanged', () => {
            let emitCount = 0;
            EventBus.on('STATE_CHANGED', () => emitCount++);

            stateMachine.setState(EntityState.IDLE); // Already in IDLE
            expect(emitCount).to.equal(0);
        });

        it('should support optional transition reason', () => {
            let capturedReason: string | undefined;

            EventBus.on('STATE_CHANGED', (_id: string, _old: EntityState, _new: EntityState, reason?: string) => {
                capturedReason = reason;
            });

            stateMachine.transitionTo(EntityState.COMBAT, 'Enemy detected');

            expect(capturedReason).to.equal('Enemy detected');
        });
    });

    describe('State Queries', () => {
        it('should check if in specific state', () => {
            stateMachine.setState(EntityState.GATHERING);
            
            expect(stateMachine.isInState(EntityState.GATHERING)).to.be.true;
            expect(stateMachine.isInState(EntityState.COMBAT)).to.be.false;
        });

        it('should check if in any of multiple states', () => {
            stateMachine.setState(EntityState.GATHERING);
            
            expect(stateMachine.isInAnyState([EntityState.GATHERING, EntityState.BUILDING])).to.be.true;
            expect(stateMachine.isInAnyState([EntityState.COMBAT, EntityState.IDLE])).to.be.false;
        });

        it('should get state duration', () => {
            stateMachine.setState(EntityState.GATHERING);
            
            // Simulate time passing
            stateMachine.update(100);
            stateMachine.update(50);
            
            expect(stateMachine.getStateDuration()).to.equal(150);
        });

        it('should reset state duration on transition', () => {
            stateMachine.setState(EntityState.GATHERING);
            stateMachine.update(100);
            
            expect(stateMachine.getStateDuration()).to.equal(100);
            
            stateMachine.setState(EntityState.COMBAT);
            expect(stateMachine.getStateDuration()).to.equal(0);
        });
    });

    describe('History Management', () => {
        it('should limit history size', () => {
            // Transition many times
            for (let i = 0; i < 15; i++) {
                stateMachine.setState(i % 2 === 0 ? EntityState.GATHERING : EntityState.COMBAT);
            }

            const history = stateMachine.getStateHistory();
            expect(history.length).to.be.lessThanOrEqual(10); // Max history size
        });

        it('should clear history', () => {
            stateMachine.setState(EntityState.GATHERING);
            stateMachine.setState(EntityState.COMBAT);
            
            stateMachine.clearHistory();
            
            expect(stateMachine.getStateHistory()).to.be.empty;
            expect(stateMachine.getCurrentState()).to.equal(EntityState.COMBAT); // State unchanged
        });
    });

    describe('Component Lifecycle', () => {
        it('should attach to owner', () => {
            const obj = new GameObject('test', 0, 0);
            const sm = new StateMachineComponent(EntityState.IDLE);
            
            obj.addComponent('stateMachine', sm);
            
            expect(sm.owner).to.equal(obj);
        });

        it('should detach from owner', () => {
            const obj = new GameObject('test', 0, 0);
            const sm = new StateMachineComponent(EntityState.IDLE);
            
            obj.addComponent('stateMachine', sm);
            obj.removeComponent('stateMachine');
            
            // Component should still exist but be detached
            expect(sm.owner).to.be.undefined;
        });

        it('should update state duration', () => {
            stateMachine.update(16.67); // ~1 frame at 60fps
            expect(stateMachine.getStateDuration()).to.be.closeTo(16.67, 0.1);
        });
    });

    describe('All Entity States', () => {
        it('should support all defined states', () => {
            const states: EntityState[] = [
                EntityState.IDLE,
                EntityState.GATHERING,
                EntityState.COMBAT,
                EntityState.FOLLOWING,
                EntityState.BUILDING,
                EntityState.PATROLLING,
                EntityState.ATTACKING,
                EntityState.SCOUTING,
                EntityState.HEALING,
                EntityState.RETURNING
            ];

            states.forEach(state => {
                stateMachine.setState(state);
                expect(stateMachine.getCurrentState()).to.equal(state);
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid state changes', () => {
            stateMachine.setState(EntityState.GATHERING);
            stateMachine.setState(EntityState.COMBAT);
            stateMachine.setState(EntityState.IDLE);
            stateMachine.setState(EntityState.BUILDING);

            expect(stateMachine.getCurrentState()).to.equal(EntityState.BUILDING);
            expect(stateMachine.getPreviousState()).to.equal(EntityState.IDLE);
        });

        it('should handle transition back to previous state', () => {
            stateMachine.setState(EntityState.GATHERING);
            stateMachine.setState(EntityState.COMBAT);
            stateMachine.setState(EntityState.GATHERING); // Back to previous

            expect(stateMachine.getCurrentState()).to.equal(EntityState.GATHERING);
            expect(stateMachine.getPreviousState()).to.equal(EntityState.COMBAT);
        });
    });
});
