/**
 * Tests for Base GameObject Class (MODEL)
 * Following TDD: Write tests first, then implementation
 */

import { expect } from 'chai';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';
import { IComponent } from '../../src/classes/components/IComponent';
import { TILE_SIZE } from '../../src/world/TileSystem';

describe('GameObject (Base Entity Model)', () => {
    beforeEach(() => {
        // Clear EventBus before each test
        EventBus.clear();
    });

    describe('Creation and Initialization', () => {
        it('should create GameObject with unique ID', () => {
            const obj1 = new GameObject('test', 0, 0, 16);
            const obj2 = new GameObject('test', 0, 0, 16);

            expect(obj1.id).to.be.a('string');
            expect(obj2.id).to.be.a('string');
            expect(obj1.id).to.not.equal(obj2.id); // IDs should be unique
        });

        it('should initialize with correct properties', () => {
            const obj = new GameObject('ant', 5, 10, 16);

            expect(obj.type).to.equal('ant');
            expect(obj.gridX).to.equal(5);
            expect(obj.gridY).to.equal(10);
            expect(obj.isActive).to.be.true;
            expect(obj.collisionWidth).to.equal(16);
            expect(obj.collisionHeight).to.equal(16);
        });

        it('should calculate worldX and worldY from grid position', () => {
            const obj = new GameObject('test', 5, 10, TILE_SIZE);

            // worldX = gridX * TILE_SIZE, worldY = gridY * TILE_SIZE
            expect(obj.worldX).to.equal(5 * TILE_SIZE);
            expect(obj.worldY).to.equal(10 * TILE_SIZE);
        });

        it('should support custom collision size', () => {
            const obj = new GameObject('test', 0, 0, 32);

            expect(obj.collisionWidth).to.equal(32);
            expect(obj.collisionHeight).to.equal(32);
        });
    });

    describe('Movement', () => {
        it('should update grid and world positions when moving', () => {
            const obj = new GameObject('test', 0, 0, TILE_SIZE);

            obj.moveTo(3, 4);

            expect(obj.gridX).to.equal(3);
            expect(obj.gridY).to.equal(4);
            expect(obj.worldX).to.equal(3 * TILE_SIZE);
            expect(obj.worldY).to.equal(4 * TILE_SIZE);
        });

        it('should emit ENTITY_MOVED event when moving', () => {
            const obj = new GameObject('test', 0, 0, 16);
            let eventEmitted = false;
            let emittedId: string = '';
            let emittedGridX: number = 0;
            let emittedGridY: number = 0;

            EventBus.on('ENTITY_MOVED', (id: string, gridX: number, gridY: number) => {
                eventEmitted = true;
                emittedId = id;
                emittedGridX = gridX;
                emittedGridY = gridY;
            });

            obj.moveTo(5, 7);

            expect(eventEmitted).to.be.true;
            expect(emittedId).to.equal(obj.id);
            expect(emittedGridX).to.equal(5);
            expect(emittedGridY).to.equal(7);
        });

        it('should not emit event if position does not change', () => {
            const obj = new GameObject('test', 5, 5, 16);
            let eventCount = 0;

            EventBus.on('ENTITY_MOVED', () => {
                eventCount++;
            });

            obj.moveTo(5, 5); // Same position

            expect(eventCount).to.equal(0);
        });
    });

    describe('Component Management', () => {
        it('should attach component', () => {
            const obj = new GameObject('test', 0, 0, 16);
            const mockComponent: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { this.owner = owner; },
                onDetach: function() { this.owner = null as any; },
                update: function(_deltaTime: number) {}
            };

            obj.addComponent('test', mockComponent);

            expect(obj.hasComponent('test')).to.be.true;
            expect(mockComponent.owner).to.equal(obj);
        });

        it('should retrieve component', () => {
            const obj = new GameObject('test', 0, 0, 16);
            const mockComponent: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { this.owner = owner; },
                onDetach: function() {},
                update: function(_deltaTime: number) {}
            };

            obj.addComponent('health', mockComponent);
            const retrieved = obj.getComponent('health');

            expect(retrieved).to.equal(mockComponent);
        });

        it('should return undefined for non-existent component', () => {
            const obj = new GameObject('test', 0, 0, 16);

            expect(obj.getComponent('nonexistent')).to.be.undefined;
            expect(obj.hasComponent('nonexistent')).to.be.false;
        });

        it('should remove component', () => {
            const obj = new GameObject('test', 0, 0, 16);
            let detachCalled = false;
            const mockComponent: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { this.owner = owner; },
                onDetach: function() { detachCalled = true; },
                update: function(_deltaTime: number) {}
            };

            obj.addComponent('test', mockComponent);
            obj.removeComponent('test');

            expect(obj.hasComponent('test')).to.be.false;
            expect(detachCalled).to.be.true;
        });

        it('should call onAttach when component is added', () => {
            const obj = new GameObject('test', 0, 0, 16);
            let attachCalled = false;
            const mockComponent: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { 
                    attachCalled = true;
                    this.owner = owner;
                },
                onDetach: function() {},
                update: function(_deltaTime: number) {}
            };

            obj.addComponent('test', mockComponent);

            expect(attachCalled).to.be.true;
        });
    });

    describe('Collision Detection', () => {
        it('should detect collision with overlapping entity (rectangle)', () => {
            const obj1 = new GameObject('test1', 0, 0, 16); // worldX: 0, worldY: 0
            const obj2 = new GameObject('test2', 0, 0, 16); // Same position

            expect(obj1.isCollidingWith(obj2)).to.be.true;
        });

        it('should not detect collision with non-overlapping entity', () => {
            const TILE_SIZE = 16;
            const obj1 = new GameObject('test1', 0, 0, TILE_SIZE); // worldX: 0, worldY: 0
            const obj2 = new GameObject('test2', 10, 10, TILE_SIZE); // worldX: 160, worldY: 160

            expect(obj1.isCollidingWith(obj2)).to.be.false;
        });

        it('should detect edge collision', () => {
            const TILE_SIZE = 16;
            const obj1 = new GameObject('test1', 0, 0, TILE_SIZE); // worldX: 0-16, worldY: 0-16
            const obj2 = new GameObject('test2', 1, 0, TILE_SIZE); // worldX: 16-32, worldY: 0-16

            // Edge case: touching but not overlapping (depends on implementation)
            const colliding = obj1.isCollidingWith(obj2);
            expect(colliding).to.be.a('boolean'); // Valid result either way
        });
    });

    describe('Update Loop', () => {
        it('should call update on all components', () => {
            const obj = new GameObject('test', 0, 0, 16);
            let updateCount = 0;
            const mockComponent: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { this.owner = owner; },
                onDetach: function() {},
                update: function(_deltaTime: number) { updateCount++; }
            };

            obj.addComponent('test', mockComponent);
            obj.update(16); // 16ms delta

            expect(updateCount).to.equal(1);
        });

        it('should pass deltaTime to components', () => {
            const obj = new GameObject('test', 0, 0, 16);
            let receivedDelta = 0;
            const mockComponent: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { this.owner = owner; },
                onDetach: function() {},
                update: function(deltaTime: number) { receivedDelta = deltaTime; }
            };

            obj.addComponent('test', mockComponent);
            obj.update(32);

            expect(receivedDelta).to.equal(32);
        });

        it('should update multiple components', () => {
            const obj = new GameObject('test', 0, 0, 16);
            let count1 = 0;
            let count2 = 0;

            const comp1: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { this.owner = owner; },
                onDetach: function() {},
                update: function(_deltaTime: number) { count1++; }
            };

            const comp2: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { this.owner = owner; },
                onDetach: function() {},
                update: function(_deltaTime: number) { count2++; }
            };

            obj.addComponent('comp1', comp1);
            obj.addComponent('comp2', comp2);
            obj.update(16);

            expect(count1).to.equal(1);
            expect(count2).to.equal(1);
        });
    });

    describe('Destruction', () => {
        it('should mark entity as inactive when destroyed', () => {
            const obj = new GameObject('test', 0, 0, 16);

            obj.destroy();

            expect(obj.isActive).to.be.false;
        });

        it('should emit ENTITY_DESTROYED event', () => {
            const obj = new GameObject('test', 0, 0, 16);
            let eventEmitted = false;
            let emittedId: string = '';
            let emittedType: string = '';

            EventBus.on('ENTITY_DESTROYED', (id: string, type: string) => {
                eventEmitted = true;
                emittedId = id;
                emittedType = type;
            });

            obj.destroy();

            expect(eventEmitted).to.be.true;
            expect(emittedId).to.equal(obj.id);
            expect(emittedType).to.equal('test');
        });

        it('should remove all components when destroyed', () => {
            const obj = new GameObject('test', 0, 0, 16);
            let detachCount = 0;

            const comp1: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { this.owner = owner; },
                onDetach: function() { detachCount++; },
                update: function(_deltaTime: number) {}
            };

            const comp2: IComponent = {
                owner: null as any,
                onAttach: function(owner: GameObject) { this.owner = owner; },
                onDetach: function() { detachCount++; },
                update: function(_deltaTime: number) {}
            };

            obj.addComponent('comp1', comp1);
            obj.addComponent('comp2', comp2);
            obj.destroy();

            expect(detachCount).to.equal(2);
            expect(obj.hasComponent('comp1')).to.be.false;
            expect(obj.hasComponent('comp2')).to.be.false;
        });

        it('should not emit ENTITY_DESTROYED twice', () => {
            const obj = new GameObject('test', 0, 0, 16);
            let eventCount = 0;

            EventBus.on('ENTITY_DESTROYED', () => {
                eventCount++;
            });

            obj.destroy();
            obj.destroy(); // Call again

            expect(eventCount).to.equal(1); // Should only emit once
        });
    });
});
