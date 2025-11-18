/**
 * Unit Tests for ResourceManager
 * Tests resource tracking, transactions, warehouse integration, and UI updates
 */

import { expect } from 'chai';
import { ResourceManager } from '../../src/managers/ResourceManager';
import { EventBus } from '../../src/utils/eventBus';
import { ResourceType } from '../../src/config/gameplay/entityConfig';

describe('ResourceManager', () => {
    let manager: ResourceManager;
    const testFactionId = 'test-faction';

    beforeEach(() => {
        EventBus.clear();
        manager = ResourceManager.getInstance();
        manager.clear();
        manager.reinitializeListeners(); // Restore EventBus listeners after clear
        
        // Initialize faction resources directly (EventBus listeners were cleared)
        manager.initializeFaction(testFactionId);
    });

    afterEach(() => {
        EventBus.clear();
        manager.clear();
    });

    describe('Initialization', () => {
        it('should be a singleton', () => {
            const instance1 = ResourceManager.getInstance();
            const instance2 = ResourceManager.getInstance();
            expect(instance1).to.equal(instance2);
        });

        it('should initialize faction with starting resources', () => {
            const resources = manager.getAllResourceCounts(testFactionId);
            expect(resources).to.not.be.null;
            expect(resources!.food).to.equal(100);
            expect(resources!.wood).to.equal(50);
            expect(resources!.stone).to.equal(50);
            expect(resources!.magicCrystal).to.equal(0);
        });

        it('should initialize on FACTION_CREATED event', () => {
            const newFactionId = 'new-faction';
            EventBus.emit('FACTION_CREATED', newFactionId);
            
            const resources = manager.getAllResourceCounts(newFactionId);
            expect(resources).to.not.be.null;
            expect(resources!.food).to.equal(100);
        });
    });

    describe('Add Resources', () => {
        it('should add resources to faction', () => {
            manager.addResource(testFactionId, 'food', 50);
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(150);
        });

        it('should emit RESOURCE_UPDATED event when adding', (done) => {
            EventBus.once('RESOURCE_UPDATED', (factionId, type, newAmount) => {
                expect(factionId).to.equal(testFactionId);
                expect(type).to.equal('wood');
                expect(newAmount).to.equal(100);
                done();
            });
            
            manager.addResource(testFactionId, 'wood', 50);
        });

        it('should handle multiple resource additions', () => {
            manager.addResource(testFactionId, 'stone', 25);
            manager.addResource(testFactionId, 'stone', 25);
            expect(manager.getResourceCount(testFactionId, 'stone')).to.equal(100);
        });

        it('should allow adding magic crystals', () => {
            manager.addResource(testFactionId, 'magicCrystal', 10);
            expect(manager.getResourceCount(testFactionId, 'magicCrystal')).to.equal(10);
        });

        it('should warn when adding to unknown faction', () => {
            // Should not crash
            manager.addResource('unknown-faction', 'food', 50);
            expect(manager.getResourceCount('unknown-faction', 'food')).to.equal(0);
        });

        it('should handle RESOURCE_DEPOSITED event', () => {
            EventBus.emit('RESOURCE_DEPOSITED', testFactionId, 'food' as ResourceType, 25);
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(125);
        });

        it('should handle BUILDING_RESOURCE_GENERATED event', () => {
            EventBus.emit('BUILDING_RESOURCE_GENERATED', testFactionId, 'wood', 10);
            expect(manager.getResourceCount(testFactionId, 'wood')).to.equal(60);
        });
    });

    describe('Remove Resources', () => {
        beforeEach(() => {
            // Set up known amounts
            manager.setResource(testFactionId, 'food', 100);
            manager.setResource(testFactionId, 'wood', 50);
        });

        it('should remove resources successfully', () => {
            const result = manager.removeResource(testFactionId, 'food', 25);
            expect(result).to.be.true;
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(75);
        });

        it('should emit RESOURCE_UPDATED event when removing', (done) => {
            EventBus.once('RESOURCE_UPDATED', (factionId, type, newAmount) => {
                expect(factionId).to.equal(testFactionId);
                expect(type).to.equal('wood');
                expect(newAmount).to.equal(30);
                done();
            });
            
            manager.removeResource(testFactionId, 'wood', 20);
        });

        it('should fail when insufficient resources', () => {
            const result = manager.removeResource(testFactionId, 'food', 150);
            expect(result).to.be.false;
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(100);
        });

        it('should emit RESOURCE_INSUFFICIENT event when failing', (done) => {
            EventBus.once('RESOURCE_INSUFFICIENT', (factionId, type, current, needed) => {
                expect(factionId).to.equal(testFactionId);
                expect(type).to.equal('wood');
                expect(current).to.equal(50);
                expect(needed).to.equal(100);
                done();
            });
            
            manager.removeResource(testFactionId, 'wood', 100);
        });

        it('should fail for unknown faction', () => {
            const result = manager.removeResource('unknown-faction', 'food', 10);
            expect(result).to.be.false;
        });

        it('should allow removing exact amount', () => {
            const result = manager.removeResource(testFactionId, 'wood', 50);
            expect(result).to.be.true;
            expect(manager.getResourceCount(testFactionId, 'wood')).to.equal(0);
        });
    });

    describe('Resource Queries', () => {
        beforeEach(() => {
            manager.setResource(testFactionId, 'food', 100);
            manager.setResource(testFactionId, 'wood', 50);
            manager.setResource(testFactionId, 'stone', 25);
            manager.setResource(testFactionId, 'magicCrystal', 10);
        });

        it('should check if has enough resources', () => {
            expect(manager.hasEnough(testFactionId, 'food', 50)).to.be.true;
            expect(manager.hasEnough(testFactionId, 'food', 100)).to.be.true;
            expect(manager.hasEnough(testFactionId, 'food', 101)).to.be.false;
        });

        it('should return false for unknown faction', () => {
            expect(manager.hasEnough('unknown-faction', 'food', 1)).to.be.false;
        });

        it('should get resource count', () => {
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(100);
            expect(manager.getResourceCount(testFactionId, 'wood')).to.equal(50);
            expect(manager.getResourceCount(testFactionId, 'stone')).to.equal(25);
            expect(manager.getResourceCount(testFactionId, 'magicCrystal')).to.equal(10);
        });

        it('should return 0 for unknown faction', () => {
            expect(manager.getResourceCount('unknown-faction', 'food')).to.equal(0);
        });

        it('should get all resource counts', () => {
            const resources = manager.getAllResourceCounts(testFactionId);
            expect(resources).to.not.be.null;
            expect(resources!.food).to.equal(100);
            expect(resources!.wood).to.equal(50);
            expect(resources!.stone).to.equal(25);
            expect(resources!.magicCrystal).to.equal(10);
        });

        it('should return copy to prevent external modification', () => {
            const resources = manager.getAllResourceCounts(testFactionId);
            resources!.food = 999;
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(100);
        });

        it('should return null for unknown faction', () => {
            const resources = manager.getAllResourceCounts('unknown-faction');
            expect(resources).to.be.null;
        });
    });

    describe('Multiple Resource Operations', () => {
        beforeEach(() => {
            manager.setResource(testFactionId, 'food', 100);
            manager.setResource(testFactionId, 'wood', 50);
            manager.setResource(testFactionId, 'stone', 25);
            manager.setResource(testFactionId, 'magicCrystal', 10);
        });

        it('should check if can afford multiple resources', () => {
            const costs = { food: 50, wood: 25, stone: 10 };
            expect(manager.canAfford(testFactionId, costs)).to.be.true;
        });

        it('should fail if cannot afford any single resource', () => {
            const costs = { food: 50, wood: 25, stone: 100 }; // stone too high
            expect(manager.canAfford(testFactionId, costs)).to.be.false;
        });

        it('should handle partial costs', () => {
            const costs = { food: 50 };
            expect(manager.canAfford(testFactionId, costs)).to.be.true;
        });

        it('should return false for unknown faction', () => {
            const costs = { food: 10 };
            expect(manager.canAfford('unknown-faction', costs)).to.be.false;
        });

        it('should spend multiple resources successfully', () => {
            const costs = { food: 50, wood: 25, stone: 10 };
            const result = manager.spendResources(testFactionId, costs);
            
            expect(result).to.be.true;
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(50);
            expect(manager.getResourceCount(testFactionId, 'wood')).to.equal(25);
            expect(manager.getResourceCount(testFactionId, 'stone')).to.equal(15);
        });

        it('should fail to spend if cannot afford', () => {
            const costs = { food: 200 };
            const result = manager.spendResources(testFactionId, costs);
            
            expect(result).to.be.false;
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(100); // Unchanged
        });

        it('should not partially spend on failure', () => {
            const costs = { food: 50, wood: 100 }; // wood too high
            const result = manager.spendResources(testFactionId, costs);
            
            expect(result).to.be.false;
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(100); // Unchanged
            expect(manager.getResourceCount(testFactionId, 'wood')).to.equal(50); // Unchanged
        });
    });

    describe('Direct Resource Setting', () => {
        it('should set resource directly', () => {
            manager.setResource(testFactionId, 'food', 500);
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(500);
        });

        it('should emit RESOURCE_UPDATED event when setting', (done) => {
            EventBus.once('RESOURCE_UPDATED', (factionId, type, newAmount) => {
                expect(factionId).to.equal(testFactionId);
                expect(type).to.equal('magicCrystal');
                expect(newAmount).to.equal(999);
                done();
            });
            
            manager.setResource(testFactionId, 'magicCrystal', 999);
        });

        it('should allow setting to 0', () => {
            manager.setResource(testFactionId, 'food', 0);
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(0);
        });

        it('should handle unknown faction gracefully', () => {
            manager.setResource('unknown-faction', 'food', 100);
            expect(manager.getResourceCount('unknown-faction', 'food')).to.equal(0);
        });
    });

    describe('Clear', () => {
        it('should clear all factions', () => {
            manager.clear();
            const resources = manager.getAllResourceCounts(testFactionId);
            expect(resources).to.be.null;
        });

        it('should allow reinitialization after clear', () => {
            manager.clear();
            EventBus.emit('FACTION_CREATED', testFactionId);
            
            const resources = manager.getAllResourceCounts(testFactionId);
            expect(resources).to.not.be.null;
            expect(resources!.food).to.equal(100);
        });
    });

    describe('Edge Cases', () => {
        it('should handle negative amounts gracefully', () => {
            manager.addResource(testFactionId, 'food', -10);
            // Should reduce food by 10
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(90);
        });

        it('should handle very large numbers', () => {
            manager.setResource(testFactionId, 'food', 1000000);
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(1000000);
        });

        it('should handle fractional amounts', () => {
            manager.addResource(testFactionId, 'food', 10.5);
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(110.5);
        });

        it('should handle zero additions/removals', () => {
            manager.addResource(testFactionId, 'food', 0);
            manager.removeResource(testFactionId, 'food', 0);
            expect(manager.getResourceCount(testFactionId, 'food')).to.equal(100);
        });
    });
});
