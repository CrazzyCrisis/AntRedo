/**
 * InventoryComponent Tests (TDD - RED phase)
 * Tests for item management, capacity limits, and inventory operations
 */

import { expect } from 'chai';
import { InventoryComponent } from '../../src/classes/components/InventoryComponent';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';
import { GameEvents } from '../../src/utils/eventBus';

describe('InventoryComponent', () => {
    let inventory: InventoryComponent;
    let owner: GameObject;

    beforeEach(() => {
        // Clear EventBus before each test
        EventBus.clear();

        // Create owner GameObject
        owner = new GameObject('ant', 5, 5);

        // Create inventory component with capacity of 10
        inventory = new InventoryComponent(10);
        inventory.onAttach(owner);
    });

    describe('Initialization', () => {
        it('should initialize with capacity', () => {
            expect(inventory.getCapacity()).to.equal(10);
        });

        it('should start empty', () => {
            expect(inventory.isEmpty()).to.be.true;
        });

        it('should start not full', () => {
            expect(inventory.isFull()).to.be.false;
        });

        it('should have zero item count initially', () => {
            expect(inventory.getItemCount('food')).to.equal(0);
        });

        it('should have zero total items', () => {
            expect(inventory.getTotalItems()).to.equal(0);
        });
    });

    describe('Adding Items', () => {
        it('should add single item', () => {
            const result = inventory.addItem('food', 1);
            expect(result).to.be.true;
            expect(inventory.getItemCount('food')).to.equal(1);
        });

        it('should add multiple items at once', () => {
            const result = inventory.addItem('food', 5);
            expect(result).to.be.true;
            expect(inventory.getItemCount('food')).to.equal(5);
        });

        it('should accumulate items of same type', () => {
            inventory.addItem('food', 3);
            inventory.addItem('food', 2);
            expect(inventory.getItemCount('food')).to.equal(5);
        });

        it('should track different item types separately', () => {
            inventory.addItem('food', 3);
            inventory.addItem('wood', 2);
            expect(inventory.getItemCount('food')).to.equal(3);
            expect(inventory.getItemCount('wood')).to.equal(2);
        });

        it('should emit ITEM_ADDED event', (done) => {
            EventBus.once(GameEvents.ITEM_ADDED, (entityId: string, itemType: string, amount: number) => {
                expect(entityId).to.equal(owner.id);
                expect(itemType).to.equal('food');
                expect(amount).to.equal(5);
                done();
            });

            inventory.addItem('food', 5);
        });

        it('should not add items when full', () => {
            inventory.addItem('food', 10);
            const result = inventory.addItem('wood', 1);
            expect(result).to.be.false;
            expect(inventory.getItemCount('wood')).to.equal(0);
        });

        it('should emit INVENTORY_FULL event when full', (done) => {
            inventory.addItem('food', 10);

            EventBus.once(GameEvents.INVENTORY_FULL, (entityId: string) => {
                expect(entityId).to.equal(owner.id);
                done();
            });

            inventory.addItem('wood', 1);
        });

        it('should not add zero items', () => {
            const result = inventory.addItem('food', 0);
            expect(result).to.be.false;
            expect(inventory.getItemCount('food')).to.equal(0);
        });

        it('should not add negative items', () => {
            const result = inventory.addItem('food', -5);
            expect(result).to.be.false;
            expect(inventory.getItemCount('food')).to.equal(0);
        });
    });

    describe('Removing Items', () => {
        beforeEach(() => {
            inventory.addItem('food', 5);
            inventory.addItem('wood', 3);
        });

        it('should remove single item', () => {
            const result = inventory.removeItem('food', 1);
            expect(result).to.be.true;
            expect(inventory.getItemCount('food')).to.equal(4);
        });

        it('should remove multiple items at once', () => {
            const result = inventory.removeItem('food', 3);
            expect(result).to.be.true;
            expect(inventory.getItemCount('food')).to.equal(2);
        });

        it('should remove all items of a type', () => {
            const result = inventory.removeItem('food', 5);
            expect(result).to.be.true;
            expect(inventory.getItemCount('food')).to.equal(0);
        });

        it('should emit ITEM_REMOVED event', (done) => {
            EventBus.once(GameEvents.ITEM_REMOVED, (entityId: string, itemType: string, amount: number) => {
                expect(entityId).to.equal(owner.id);
                expect(itemType).to.equal('food');
                expect(amount).to.equal(3);
                done();
            });

            inventory.removeItem('food', 3);
        });

        it('should not remove more items than available', () => {
            const result = inventory.removeItem('food', 10);
            expect(result).to.be.false;
            expect(inventory.getItemCount('food')).to.equal(5);
        });

        it('should not remove items that do not exist', () => {
            const result = inventory.removeItem('stone', 1);
            expect(result).to.be.false;
        });

        it('should not remove zero items', () => {
            const result = inventory.removeItem('food', 0);
            expect(result).to.be.false;
            expect(inventory.getItemCount('food')).to.equal(5);
        });

        it('should not remove negative items', () => {
            const result = inventory.removeItem('food', -2);
            expect(result).to.be.false;
            expect(inventory.getItemCount('food')).to.equal(5);
        });
    });

    describe('Item Queries', () => {
        beforeEach(() => {
            inventory.addItem('food', 5);
            inventory.addItem('wood', 3);
        });

        it('should check if item exists', () => {
            expect(inventory.hasItem('food')).to.be.true;
            expect(inventory.hasItem('stone')).to.be.false;
        });

        it('should check if item exists with minimum amount', () => {
            expect(inventory.hasItem('food', 3)).to.be.true;
            expect(inventory.hasItem('food', 10)).to.be.false;
        });

        it('should get item count for existing items', () => {
            expect(inventory.getItemCount('food')).to.equal(5);
            expect(inventory.getItemCount('wood')).to.equal(3);
        });

        it('should return zero for non-existent items', () => {
            expect(inventory.getItemCount('stone')).to.equal(0);
        });

        it('should get total item count', () => {
            expect(inventory.getTotalItems()).to.equal(8);
        });

        it('should get all items', () => {
            const items = inventory.getAllItems();
            expect(items.size).to.equal(2);
            expect(items.get('food')).to.equal(5);
            expect(items.get('wood')).to.equal(3);
        });
    });

    describe('Capacity Management', () => {
        it('should check if inventory is full', () => {
            inventory.addItem('food', 10);
            expect(inventory.isFull()).to.be.true;
        });

        it('should check if inventory is not full', () => {
            inventory.addItem('food', 5);
            expect(inventory.isFull()).to.be.false;
        });

        it('should check if inventory is empty', () => {
            expect(inventory.isEmpty()).to.be.true;
            inventory.addItem('food', 1);
            expect(inventory.isEmpty()).to.be.false;
        });

        it('should get remaining capacity', () => {
            inventory.addItem('food', 3);
            expect(inventory.getRemainingCapacity()).to.equal(7);
        });

        it('should set new capacity', () => {
            inventory.setCapacity(20);
            expect(inventory.getCapacity()).to.equal(20);
        });

        it('should allow adding more items after capacity increase', () => {
            inventory.addItem('food', 10);
            inventory.setCapacity(15);
            const result = inventory.addItem('wood', 3);
            expect(result).to.be.true;
        });

        it('should not lose items when decreasing capacity', () => {
            inventory.addItem('food', 8);
            inventory.setCapacity(5);
            expect(inventory.getItemCount('food')).to.equal(8);
        });

        it('should prevent adding items if over reduced capacity', () => {
            inventory.addItem('food', 8);
            inventory.setCapacity(5);
            const result = inventory.addItem('wood', 1);
            expect(result).to.be.false;
        });
    });

    describe('Clear Operations', () => {
        beforeEach(() => {
            inventory.addItem('food', 5);
            inventory.addItem('wood', 3);
            inventory.addItem('stone', 2);
        });

        it('should clear all items', () => {
            inventory.clear();
            expect(inventory.isEmpty()).to.be.true;
            expect(inventory.getTotalItems()).to.equal(0);
        });

        it('should clear specific item type', () => {
            inventory.clearItem('food');
            expect(inventory.getItemCount('food')).to.equal(0);
            expect(inventory.getItemCount('wood')).to.equal(3);
            expect(inventory.getItemCount('stone')).to.equal(2);
        });

        it('should handle clearing non-existent item', () => {
            inventory.clearItem('crystal');
            expect(inventory.getTotalItems()).to.equal(10);
        });
    });

    describe('Component Lifecycle', () => {
        it('should attach to owner', () => {
            const newInventory = new InventoryComponent(10);
            const newOwner = new GameObject('ant', 0, 0);

            newInventory.onAttach(newOwner);
            expect(newInventory.owner).to.equal(newOwner);
        });

        it('should detach from owner', () => {
            inventory.onDetach();
            expect(inventory.owner).to.be.undefined;
        });

        it('should clear inventory on detach', () => {
            inventory.addItem('food', 5);
            inventory.onDetach();
            expect(inventory.getTotalItems()).to.equal(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle capacity of zero', () => {
            const zeroInventory = new InventoryComponent(0);
            zeroInventory.onAttach(owner);
            const result = zeroInventory.addItem('food', 1);
            expect(result).to.be.false;
        });

        it('should handle very large item amounts', () => {
            const largeInventory = new InventoryComponent(1000000);
            largeInventory.onAttach(owner);
            largeInventory.addItem('food', 999999);
            expect(largeInventory.getItemCount('food')).to.equal(999999);
        });

        it('should handle many different item types', () => {
            const types = ['food', 'wood', 'stone', 'crystal', 'gold', 'silver'];
            types.forEach((type) => {
                inventory.addItem(type, 1);
            });
            expect(inventory.getAllItems().size).to.equal(6);
        });

        it('should handle item type with special characters', () => {
            const result = inventory.addItem('magic_crystal_123', 5);
            expect(result).to.be.true;
            expect(inventory.getItemCount('magic_crystal_123')).to.equal(5);
        });

        it('should handle rapid add/remove operations', () => {
            for (let i = 0; i < 10; i++) {
                inventory.addItem('food', 1);
                inventory.removeItem('food', 1);
            }
            expect(inventory.getItemCount('food')).to.equal(0);
        });

        it('should handle filling to exact capacity', () => {
            inventory.addItem('food', 5);
            const result = inventory.addItem('wood', 5);
            expect(result).to.be.true;
            expect(inventory.isFull()).to.be.true;
        });

        it('should handle emptying completely', () => {
            inventory.addItem('food', 5);
            inventory.removeItem('food', 5);
            expect(inventory.isEmpty()).to.be.true;
        });

        it('should return readonly map from getAllItems', () => {
            inventory.addItem('food', 5);
            const items = inventory.getAllItems();
            
            // Should be a Map
            expect(items).to.be.instanceOf(Map);
        });
    });
});
