/**
 * Tests for EntityManager (CONTROLLER)
 * Following TDD: Write tests first, then implementation
 */

import { expect } from 'chai';
import { EntityManager } from '../../src/managers/EntityManager';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';

describe('EntityManager (Controller)', () => {
    let entityManager: EntityManager;

    beforeEach(() => {
        EventBus.clear();
        entityManager = EntityManager.getInstance();
        entityManager.clear();
        entityManager.reinitializeListeners(); // Restore EventBus listeners after clear
    });

    describe('Singleton Pattern', () => {
        it('should return same instance on multiple getInstance calls', () => {
            const instance1 = EntityManager.getInstance();
            const instance2 = EntityManager.getInstance();

            expect(instance1).to.equal(instance2);
        });
    });

    describe('Entity Tracking', () => {
        it('should add entity', () => {
            const entity = new GameObject('ant', 0, 0, 16);
            
            entityManager.addEntity(entity);
            const retrieved = entityManager.getEntity(entity.id);

            expect(retrieved).to.equal(entity);
        });

        it('should emit ENTITY_ADDED event when entity added', () => {
            const entity = new GameObject('ant', 0, 0, 16);
            let eventEmitted = false;
            let emittedId = '';
            let emittedType = '';

            EventBus.on('ENTITY_ADDED', (id: string, type: string) => {
                eventEmitted = true;
                emittedId = id;
                emittedType = type;
            });

            entityManager.addEntity(entity);

            expect(eventEmitted).to.be.true;
            expect(emittedId).to.equal(entity.id);
            expect(emittedType).to.equal('ant');
        });

        it('should remove entity', () => {
            const entity = new GameObject('ant', 0, 0, 16);
            
            entityManager.addEntity(entity);
            entityManager.removeEntity(entity.id);

            expect(entityManager.getEntity(entity.id)).to.be.undefined;
        });

        it('should emit ENTITY_REMOVED event when entity removed', () => {
            const entity = new GameObject('ant', 0, 0, 16);
            let eventEmitted = false;
            let emittedId = '';
            let emittedType = '';

            entityManager.addEntity(entity);

            EventBus.on('ENTITY_REMOVED', (id: string, type: string) => {
                eventEmitted = true;
                emittedId = id;
                emittedType = type;
            });

            entityManager.removeEntity(entity.id);

            expect(eventEmitted).to.be.true;
            expect(emittedId).to.equal(entity.id);
            expect(emittedType).to.equal('ant');
        });

        it('should return undefined for non-existent entity', () => {
            expect(entityManager.getEntity('nonexistent')).to.be.undefined;
        });

        it('should handle removing non-existent entity gracefully', () => {
            // Should not throw error
            expect(() => entityManager.removeEntity('nonexistent')).to.not.throw();
        });

        it('should get all entities', () => {
            const entity1 = new GameObject('ant', 0, 0, 16);
            const entity2 = new GameObject('resource', 1, 1, 16);
            const entity3 = new GameObject('ant', 2, 2, 16);

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);
            entityManager.addEntity(entity3);

            const allEntities = entityManager.getAllEntities();

            expect(allEntities).to.have.lengthOf(3);
            expect(allEntities).to.include(entity1);
            expect(allEntities).to.include(entity2);
            expect(allEntities).to.include(entity3);
        });

        it('should only return active entities', () => {
            const entity1 = new GameObject('ant', 0, 0, 16);
            const entity2 = new GameObject('ant', 1, 1, 16);

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);

            entity1.destroy(); // Mark as inactive

            const allEntities = entityManager.getAllEntities();

            expect(allEntities).to.have.lengthOf(1);
            expect(allEntities).to.include(entity2);
            expect(allEntities).to.not.include(entity1);
        });
    });

    describe('Type Queries', () => {
        it('should get entities by type', () => {
            const ant1 = new GameObject('ant', 0, 0, 16);
            const ant2 = new GameObject('ant', 1, 1, 16);
            const resource = new GameObject('resource', 2, 2, 16);

            entityManager.addEntity(ant1);
            entityManager.addEntity(ant2);
            entityManager.addEntity(resource);

            const ants = entityManager.getEntitiesByType('ant');

            expect(ants).to.have.lengthOf(2);
            expect(ants).to.include(ant1);
            expect(ants).to.include(ant2);
            expect(ants).to.not.include(resource);
        });

        it('should return empty array for type with no entities', () => {
            const ants = entityManager.getEntitiesByType('ant');

            expect(ants).to.be.an('array');
            expect(ants).to.have.lengthOf(0);
        });

        it('should only return active entities by type', () => {
            const ant1 = new GameObject('ant', 0, 0, 16);
            const ant2 = new GameObject('ant', 1, 1, 16);

            entityManager.addEntity(ant1);
            entityManager.addEntity(ant2);

            ant1.destroy();

            const ants = entityManager.getEntitiesByType('ant');

            expect(ants).to.have.lengthOf(1);
            expect(ants).to.include(ant2);
        });
    });

    describe('Count Tracking', () => {
        it('should get total entity count', () => {
            const entity1 = new GameObject('ant', 0, 0, 16);
            const entity2 = new GameObject('resource', 1, 1, 16);

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);

            expect(entityManager.getEntityCount()).to.equal(2);
        });

        it('should get entity count by type', () => {
            const ant1 = new GameObject('ant', 0, 0, 16);
            const ant2 = new GameObject('ant', 1, 1, 16);
            const resource = new GameObject('resource', 2, 2, 16);

            entityManager.addEntity(ant1);
            entityManager.addEntity(ant2);
            entityManager.addEntity(resource);

            expect(entityManager.getEntityCount('ant')).to.equal(2);
            expect(entityManager.getEntityCount('resource')).to.equal(1);
        });

        it('should only count active entities', () => {
            const entity1 = new GameObject('ant', 0, 0, 16);
            const entity2 = new GameObject('ant', 1, 1, 16);

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);

            entity1.destroy();

            expect(entityManager.getEntityCount()).to.equal(1);
            expect(entityManager.getEntityCount('ant')).to.equal(1);
        });
    });

    describe('Spatial Queries', () => {
        it('should get entities at grid position', () => {
            const entity1 = new GameObject('ant', 5, 5, 16);
            const entity2 = new GameObject('resource', 5, 5, 16); // Same position
            const entity3 = new GameObject('ant', 10, 10, 16); // Different position

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);
            entityManager.addEntity(entity3);

            const entitiesAt = entityManager.getEntitiesAt(5, 5);

            expect(entitiesAt).to.have.lengthOf(2);
            expect(entitiesAt).to.include(entity1);
            expect(entitiesAt).to.include(entity2);
            expect(entitiesAt).to.not.include(entity3);
        });

        it('should get entities in radius', () => {
            const TILE_SIZE = 16;
            const center = new GameObject('queen', 5, 5, TILE_SIZE); // worldX: 80, worldY: 80
            const near1 = new GameObject('ant', 6, 5, TILE_SIZE);    // worldX: 96, worldY: 80, distance: 16
            const near2 = new GameObject('ant', 5, 6, TILE_SIZE);    // worldX: 80, worldY: 96, distance: 16
            const far = new GameObject('ant', 10, 10, TILE_SIZE);    // worldX: 160, worldY: 160, distance: ~113

            entityManager.addEntity(center);
            entityManager.addEntity(near1);
            entityManager.addEntity(near2);
            entityManager.addEntity(far);

            // Get entities within radius of 50 pixels from center
            const inRadius = entityManager.getEntitiesInRadius(center.worldX, center.worldY, 50);

            expect(inRadius).to.have.lengthOf(3); // center, near1, near2
            expect(inRadius).to.include(center);
            expect(inRadius).to.include(near1);
            expect(inRadius).to.include(near2);
            expect(inRadius).to.not.include(far);
        });

        it('should get entities in rectangle', () => {
            const entity1 = new GameObject('ant', 0, 0);   // worldX: 0, worldY: 0
            const entity2 = new GameObject('ant', 2, 2);   // worldX: 64, worldY: 64 (32px tiles)
            const entity3 = new GameObject('ant', 10, 10); // worldX: 320, worldY: 320

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);
            entityManager.addEntity(entity3);

            // Rectangle: x: 0, y: 0, width: 100, height: 100
            const inRect = entityManager.getEntitiesInRect(0, 0, 100, 100);

            expect(inRect).to.have.lengthOf(2);
            expect(inRect).to.include(entity1);
            expect(inRect).to.include(entity2);
            expect(inRect).to.not.include(entity3);
        });

        it('should only return active entities in spatial queries', () => {
            const entity1 = new GameObject('ant', 5, 5);
            const entity2 = new GameObject('ant', 5, 5);

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);

            entity1.destroy();

            const entitiesAt = entityManager.getEntitiesAt(5, 5);
            const inRadius = entityManager.getEntitiesInRadius(160, 160, 50); // 5*32 = 160px

            expect(entitiesAt).to.have.lengthOf(1);
            expect(inRadius).to.have.lengthOf(1);
        });
    });

    describe('EventBus Integration', () => {
        it('should auto-remove entity when ENTITY_DESTROYED event fired', () => {
            const entity = new GameObject('ant', 0, 0);
            
            entityManager.addEntity(entity);
            entity.destroy(); // This emits ENTITY_DESTROYED

            // EntityManager should listen and auto-remove
            expect(entityManager.getEntity(entity.id)).to.be.undefined;
        });

        it('should not crash if destroying non-tracked entity', () => {
            const entity = new GameObject('ant', 0, 0);
            
            // Don't add to manager, just destroy
            expect(() => entity.destroy()).to.not.throw();
        });
    });

    describe('Clear', () => {
        it('should clear all entities', () => {
            const entity1 = new GameObject('ant', 0, 0, 16);
            const entity2 = new GameObject('resource', 1, 1, 16);

            entityManager.addEntity(entity1);
            entityManager.addEntity(entity2);

            entityManager.clear();

            expect(entityManager.getEntityCount()).to.equal(0);
            expect(entityManager.getAllEntities()).to.have.lengthOf(0);
        });
    });
});
