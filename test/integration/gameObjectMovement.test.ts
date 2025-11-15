/**
 * Integration tests for GameObject movement and event emission
 */

import { expect } from 'chai';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { TILE_SIZE } from '../../src/world/TileSystem';

describe('GameObject Movement Integration Tests', () => {
    let gameObject: GameObject;
    let moveEvents: Array<{ id: string; gridX: number; gridY: number }> = [];

    beforeEach(() => {
        EventBus.clear();
        moveEvents = [];
        
        // Create test game object at (5, 5)
        gameObject = new GameObject('test', 5, 5);
        
        // Listen for ENTITY_MOVED events
        EventBus.on(GameEvents.ENTITY_MOVED, (id: string, gridX: number, gridY: number) => {
            moveEvents.push({ id, gridX, gridY });
        });
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('moveTo() Behavior', () => {
        it('should update grid position', () => {
            gameObject.moveTo(10, 15);
            
            expect(gameObject.gridX).to.equal(10);
            expect(gameObject.gridY).to.equal(15);
        });

        it('should update world position based on tile size', () => {
            gameObject.moveTo(10, 15);
            
            expect(gameObject.worldX).to.equal(10 * TILE_SIZE);
            expect(gameObject.worldY).to.equal(15 * TILE_SIZE);
        });

        it('should emit ENTITY_MOVED event with correct parameters', () => {
            gameObject.moveTo(7, 8);
            
            expect(moveEvents).to.have.lengthOf(1);
            expect(moveEvents[0].id).to.equal(gameObject.id);
            expect(moveEvents[0].gridX).to.equal(7);
            expect(moveEvents[0].gridY).to.equal(8);
        });

        it('should NOT emit event if position unchanged', () => {
            gameObject.moveTo(5, 5); // Same as initial position
            
            expect(moveEvents).to.have.lengthOf(0);
        });

        it('should emit event on each unique move', () => {
            gameObject.moveTo(6, 5);
            gameObject.moveTo(7, 5);
            gameObject.moveTo(8, 5);
            
            expect(moveEvents).to.have.lengthOf(3);
        });
    });

    describe('Component Integration', () => {
        it('should keep owner reference in sync with movement', () => {
            // Mock component
            const component = {
                owner: gameObject,
                onAttach: (owner: GameObject) => { component.owner = owner; },
                onDetach: () => { component.owner = null as any; },
                update: () => {}
            };
            
            gameObject.addComponent('test', component);
            
            gameObject.moveTo(20, 25);
            
            // Component should still reference correct owner with updated position
            expect(component.owner.gridX).to.equal(20);
            expect(component.owner.gridY).to.equal(25);
        });
    });

    describe('Event Timing', () => {
        it('should emit event AFTER position updates', () => {
            let capturedPosition = { gridX: 0, gridY: 0 };
            
            EventBus.on(GameEvents.ENTITY_MOVED, () => {
                capturedPosition = { gridX: gameObject.gridX, gridY: gameObject.gridY };
            });
            
            gameObject.moveTo(15, 20);
            
            // Event should have captured new position
            expect(capturedPosition.gridX).to.equal(15);
            expect(capturedPosition.gridY).to.equal(20);
        });
    });

    describe('Multiple Entities', () => {
        it('should emit separate events for different entities', () => {
            const obj1 = new GameObject('obj1', 0, 0);
            const obj2 = new GameObject('obj2', 10, 10);
            
            obj1.moveTo(1, 1);
            obj2.moveTo(11, 11);
            
            expect(moveEvents).to.have.lengthOf(2);
            expect(moveEvents[0].id).to.equal(obj1.id);
            expect(moveEvents[1].id).to.equal(obj2.id);
        });
    });
});
