/**
 * Entity Cleanup System Tests
 * Tests the event-driven cleanup pattern for entities
 */

import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { GameObject } from '../../src/classes/GameObject';

describe('Entity Cleanup System', () => {
    beforeEach(() => {
        // Clear EventBus before each test
        EventBus.clear();
    });

    afterEach(() => {
        // Clean up after each test
        EventBus.clear();
    });

    describe('CLEANUP_ALL_ENTITIES Event', () => {
        it('should destroy entity when cleanup signal is broadcast', () => {
            // Create entity
            const entity = new GameObject('test', 10, 10);
            
            // Verify entity is active
            expect(entity.isActive).to.be.true;
            
            // Broadcast cleanup signal
            EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            
            // Verify entity is destroyed
            expect(entity.isActive).to.be.false;
        });

        it('should destroy multiple entities when cleanup signal is broadcast', () => {
            // Create multiple entities
            const entity1 = new GameObject('test1', 10, 10);
            const entity2 = new GameObject('test2', 20, 20);
            const entity3 = new GameObject('test3', 30, 30);
            
            // Verify all are active
            expect(entity1.isActive).to.be.true;
            expect(entity2.isActive).to.be.true;
            expect(entity3.isActive).to.be.true;
            
            // Broadcast cleanup signal
            EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            
            // Verify all are destroyed
            expect(entity1.isActive).to.be.false;
            expect(entity2.isActive).to.be.false;
            expect(entity3.isActive).to.be.false;
        });

        it('should emit ENTITY_DESTROYED event when entity is destroyed by cleanup signal', () => {
            let destroyEventFired = false;
            let destroyedEntityId = '';
            
            // Listen for destroy event
            EventBus.on(GameEvents.ENTITY_DESTROYED, (id: string) => {
                destroyEventFired = true;
                destroyedEntityId = id;
            });
            
            // Create entity
            const entity = new GameObject('test', 10, 10);
            const entityId = entity.id;
            
            // Broadcast cleanup signal
            EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            
            // Verify destroy event was fired
            expect(destroyEventFired).to.be.true;
            expect(destroyedEntityId).to.equal(entityId);
        });

        it('should handle cleanup signal when entity already destroyed manually', () => {
            // Create entity
            const entity = new GameObject('test', 10, 10);
            
            // Manually destroy entity
            entity.destroy();
            expect(entity.isActive).to.be.false;
            
            // Broadcast cleanup signal (should not cause errors)
            expect(() => {
                EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            }).to.not.throw();
            
            // Entity should still be inactive
            expect(entity.isActive).to.be.false;
        });

        it('should unsubscribe from cleanup event when entity is destroyed manually', () => {
            // Create entity
            const entity = new GameObject('test', 10, 10);
            
            // Verify listener is registered
            const initialListenerCount = EventBus.listenerCount(GameEvents.CLEANUP_ALL_ENTITIES);
            expect(initialListenerCount).to.equal(1);
            
            // Manually destroy entity
            entity.destroy();
            
            // Verify listener was removed (this is the key test!)
            const afterDestroyListenerCount = EventBus.listenerCount(GameEvents.CLEANUP_ALL_ENTITIES);
            expect(afterDestroyListenerCount).to.equal(0, 'Entity should unsubscribe from cleanup event when destroyed');
        });

        it('should not process cleanup signal twice for manually destroyed entity', () => {
            let destroyCallCount = 0;
            
            // Create entity
            const entity = new GameObject('test', 10, 10);
            
            // Track how many times destroy() is effectively called
            EventBus.on(GameEvents.ENTITY_DESTROYED, () => {
                destroyCallCount++;
            });
            
            // Manually destroy entity
            entity.destroy();
            expect(destroyCallCount).to.equal(1);
            
            // Broadcast cleanup signal
            EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            
            // Verify destroy was only called once
            expect(destroyCallCount).to.equal(1, 'Destroy should only be called once');
        });
    });

    describe('Multiple Cleanup Cycles', () => {
        it('should handle multiple cleanup cycles correctly', () => {
            // First cycle
            const entity1 = new GameObject('test1', 10, 10);
            expect(entity1.isActive).to.be.true;
            
            EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            expect(entity1.isActive).to.be.false;
            
            // Second cycle - create new entities
            const entity2 = new GameObject('test2', 20, 20);
            const entity3 = new GameObject('test3', 30, 30);
            expect(entity2.isActive).to.be.true;
            expect(entity3.isActive).to.be.true;
            
            // Use entities to avoid unused warning
            expect(entity1.type).to.equal('test1');
            expect(entity2.type).to.equal('test2');
            expect(entity3.type).to.equal('test3');
            
            // Verify old entity listener was removed
            const listenerCount = EventBus.listenerCount(GameEvents.CLEANUP_ALL_ENTITIES);
            expect(listenerCount).to.equal(2, 'Should only have 2 listeners for new entities');
            
            EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            expect(entity2.isActive).to.be.false;
            expect(entity3.isActive).to.be.false;
        });

        it('should clean up listeners after each cycle', () => {
            // Create and destroy entities in first cycle
            const entity1 = new GameObject('test1', 10, 10);
            expect(entity1.isActive).to.be.true; // Use entity
            EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            
            // Verify no listeners remain
            expect(EventBus.listenerCount(GameEvents.CLEANUP_ALL_ENTITIES)).to.equal(0);
            
            // Create entities in second cycle
            const entity2 = new GameObject('test2', 20, 20);
            const entity3 = new GameObject('test3', 30, 30);
            expect(entity2.isActive).to.be.true; // Use entities
            expect(entity3.isActive).to.be.true;
            
            // Verify correct listener count
            expect(EventBus.listenerCount(GameEvents.CLEANUP_ALL_ENTITIES)).to.equal(2);
            
            // Clean up second cycle
            EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            
            // Verify all listeners cleaned up
            expect(EventBus.listenerCount(GameEvents.CLEANUP_ALL_ENTITIES)).to.equal(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle cleanup signal when no entities exist', () => {
            // Should not throw error
            expect(() => {
                EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            }).to.not.throw();
        });

        it('should handle many entities (stress test)', () => {
            // Create 1000 entities
            const entities: GameObject[] = [];
            for (let i = 0; i < 1000; i++) {
                entities.push(new GameObject(`test${i}`, i, i));
            }
            
            // Verify all are active
            entities.forEach(e => expect(e.isActive).to.be.true);
            
            // Broadcast cleanup signal
            EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);
            
            // Verify all are destroyed
            entities.forEach(e => expect(e.isActive).to.be.false);
            
            // Verify no listeners remain
            expect(EventBus.listenerCount(GameEvents.CLEANUP_ALL_ENTITIES)).to.equal(0);
        });
    });
});
