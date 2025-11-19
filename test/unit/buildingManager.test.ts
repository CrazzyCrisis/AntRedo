/**
 * Unit Tests for BuildingManager
 * Tests building placement, construction, leveling, and boost application
 */

import { expect } from 'chai';
import { BuildingManager } from '../../src/managers/BuildingManager';
import { ResourceManager } from '../../src/managers/ResourceManager';
import { EntityManager } from '../../src/managers/EntityManager';
import { EventBus } from '../../src/utils/eventBus';
import { Building } from '../../src/classes/Building';

describe('BuildingManager', () => {
    let manager: BuildingManager;
    let resourceManager: ResourceManager;
    let entityManager: EntityManager;
    const testFactionId = 'test-faction';

    beforeEach(() => {
        EventBus.clear();
        manager = BuildingManager.getInstance();
        resourceManager = ResourceManager.getInstance();
        entityManager = EntityManager.getInstance();
        
        resourceManager.clear();
        (manager as any).buildings.clear();
        (manager as any).buildingsByFaction.clear();
        
        // Reinitialize EventBus listeners after clear
        manager.reinitializeListeners();
        resourceManager.reinitializeListeners();
        
        // Initialize faction with resources directly (EventBus listeners were cleared)
        resourceManager.initializeFaction(testFactionId);
    });

    afterEach(() => {
        EventBus.clear();
        resourceManager.clear();
        entityManager.clear();
    });

    describe('Initialization', () => {
        it('should be a singleton', () => {
            const instance1 = BuildingManager.getInstance();
            const instance2 = BuildingManager.getInstance();
            expect(instance1).to.equal(instance2);
        });

        it('should initialize with empty building maps', () => {
            expect((manager as any).buildings.size).to.equal(0);
            expect((manager as any).buildingsByFaction.size).to.equal(0);
        });
    });

    describe('Building Placement', () => {
        beforeEach(() => {
            // Give faction enough resources
            resourceManager.setResource(testFactionId, 'food', 200);
            resourceManager.setResource(testFactionId, 'wood', 200);
            resourceManager.setResource(testFactionId, 'stone', 100);
        });

        it('should place construction site with sufficient resources', () => {
            const building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            
            expect(building).to.not.be.null;
            expect(building!.buildingType).to.equal('warehouse');
            expect(building!.gridX).to.equal(10);
            expect(building!.gridY).to.equal(10);
        });

        it('should start construction immediately after placement', () => {
            const building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            
            expect(building!.isConstructed).to.be.false;
            expect(building!.constructionProgress).to.be.at.least(0).and.at.most(100);
        });

        it.skip('should spend resources on placement', () => {
            const foodBefore = resourceManager.getResourceCount(testFactionId, 'food');
            const woodBefore = resourceManager.getResourceCount(testFactionId, 'wood');
            
            const building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            expect(building).to.not.be.null; // Ensure placement succeeded
            
            const foodAfter = resourceManager.getResourceCount(testFactionId, 'food');
            const woodAfter = resourceManager.getResourceCount(testFactionId, 'wood');
            
            expect(foodAfter).to.be.lessThan(foodBefore);
            expect(woodAfter).to.be.lessThan(woodBefore);
        });

        it('should fail placement with insufficient resources', () => {
            // Set low resources
            resourceManager.setResource(testFactionId, 'food', 0);
            resourceManager.setResource(testFactionId, 'wood', 0);
            
            const building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            
            expect(building).to.be.null;
        });

        it('should emit BUILDING_PLACEMENT_FAILED event on failure', () => {
            resourceManager.setResource(testFactionId, 'food', 0);
            resourceManager.setResource(testFactionId, 'wood', 0);
            
            let emitted = false;
            let emittedFactionId = '';
            let emittedBuildingType = '';
            let emittedReason = '';
            
            EventBus.once('BUILDING_PLACEMENT_FAILED', (factionId, buildingType, reason) => {
                emitted = true;
                emittedFactionId = factionId;
                emittedBuildingType = buildingType;
                emittedReason = reason;
            });
            
            const building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            
            expect(building).to.be.null;
            expect(emitted).to.be.true;
            expect(emittedFactionId).to.equal(testFactionId);
            expect(emittedBuildingType).to.equal('warehouse');
            expect(emittedReason).to.equal('insufficient_resources');
        });
        
        it('should track placed building', () => {
            const building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            
            // Add to EntityManager first (required for tracking)
            entityManager.addEntity(building!);
            
            // Emit event to trigger tracking
            EventBus.emit('BUILDING_PLACED', building!.id, 10, 10, 'warehouse');
            
            // Check internal tracking
            expect((manager as any).buildings.has(building!.id)).to.be.true;
        });
    });

    describe('Construction Management', () => {
        let building: Building;

        beforeEach(() => {
            resourceManager.setResource(testFactionId, 'food', 200);
            resourceManager.setResource(testFactionId, 'wood', 200);
            resourceManager.setResource(testFactionId, 'stone', 100);
            
            building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10)!;
            EntityManager.getInstance().addEntity(building);
            EventBus.emit('BUILDING_PLACED', building.id, 10, 10, 'warehouse');
        });

        it('should complete building construction', () => {
            manager.completeBuilding(building.id);
            expect(building.isConstructed).to.be.true;
            expect(building.constructionProgress).to.equal(100);
        });

        it('should emit BUILDING_COMPLETED event', (done) => {
            EventBus.once('BUILDING_COMPLETED', (buildingId) => {
                expect(buildingId).to.equal(building.id);
                done();
            });
            
            manager.completeBuilding(building.id);
        });

        it('should handle unknown building ID gracefully', () => {
            expect(() => manager.completeBuilding('unknown-id')).to.not.throw();
        });
    });

    describe('Building Destruction', () => {
        let building: Building;

        beforeEach(() => {
            resourceManager.setResource(testFactionId, 'food', 200);
            resourceManager.setResource(testFactionId, 'wood', 200);
            resourceManager.setResource(testFactionId, 'stone', 100);
            
            building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10)!;
            EntityManager.getInstance().addEntity(building);
            EventBus.emit('BUILDING_PLACED', building.id, 10, 10, 'warehouse');
        });

        it('should destroy building', () => {
            manager.destroyBuilding(building.id);
            expect(building.isActive).to.be.false;
        });

        it('should untrack destroyed building', () => {
            manager.destroyBuilding(building.id);
            EventBus.emit('BUILDING_DESTROYED', building.id);
            
            expect((manager as any).buildings.has(building.id)).to.be.false;
        });

        it('should handle unknown building ID gracefully', () => {
            expect(() => manager.destroyBuilding('unknown-id')).to.not.throw();
        });
    });

    describe('Building Leveling', () => {
        let building: Building;

        beforeEach(() => {
            // Give plenty of resources for leveling
            resourceManager.setResource(testFactionId, 'food', 1000);
            resourceManager.setResource(testFactionId, 'wood', 1000);
            resourceManager.setResource(testFactionId, 'stone', 1000);
            resourceManager.setResource(testFactionId, 'magicCrystal', 100);
            
            building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10)!;
            EntityManager.getInstance().addEntity(building);
            EventBus.emit('BUILDING_PLACED', building.id, 10, 10, 'warehouse');
            manager.completeBuilding(building.id);
        });

        it('should level up constructed building', () => {
            const result = manager.levelUpBuilding(building.id);
            expect(result).to.be.true;
            expect(building.level).to.equal(2);
        });

        it('should fail to level up unconstructed building', () => {
            const newBuilding = manager.placeConstructionSite(testFactionId, 'warehouse', 20, 20)!;
            EntityManager.getInstance().addEntity(newBuilding);
            
            const result = manager.levelUpBuilding(newBuilding.id);
            expect(result).to.be.false;
        });

        it('should fail to level up max level building', () => {
            // Level up to max
            building.level = building.maxLevel;
            
            const result = manager.levelUpBuilding(building.id);
            expect(result).to.be.false;
        });

        it('should emit BUILDING_LEVEL_UP_COMPLETE event', (done) => {
            EventBus.once('BUILDING_LEVEL_UP_COMPLETE', (buildingId, newLevel) => {
                expect(buildingId).to.equal(building.id);
                expect(newLevel).to.equal(2);
                done();
            });
            
            // Manually set level and emit event
            building.level = 2;
            EventBus.emit('BUILDING_LEVELED_UP', building.id, 2);
        });

        it('should handle unknown building ID gracefully', () => {
            const result = manager.levelUpBuilding('unknown-id');
            expect(result).to.be.false;
        });

        it('should level up multiple times', () => {
            manager.levelUpBuilding(building.id);
            expect(building.level).to.equal(2);
            
            manager.levelUpBuilding(building.id);
            expect(building.level).to.equal(3);
        });
    });

    describe('Building Queries', () => {
        beforeEach(() => {
            resourceManager.setResource(testFactionId, 'food', 1000);
            resourceManager.setResource(testFactionId, 'wood', 1000);
            resourceManager.setResource(testFactionId, 'stone', 1000);
        });

        it.skip('should get buildings of specific type', () => {
            const building1 = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            const building2 = manager.placeConstructionSite(testFactionId, 'warehouse', 20, 20);
            const building3 = manager.placeConstructionSite(testFactionId, 'barracks', 30, 30);
            
            EntityManager.getInstance().addEntity(building1!);
            EntityManager.getInstance().addEntity(building2!);
            EntityManager.getInstance().addEntity(building3!);
            
            // Emit events to trigger tracking
            EventBus.emit('BUILDING_PLACED', building1!.id, 10, 10, 'warehouse');
            EventBus.emit('BUILDING_PLACED', building2!.id, 20, 20, 'warehouse');
            EventBus.emit('BUILDING_PLACED', building3!.id, 30, 30, 'barracks');
            
            const warehouses = manager.getBuildingsOfType(testFactionId, 'warehouse');
            
            expect(warehouses.length).to.equal(2);
            expect(warehouses.every(b => b.buildingType === 'warehouse')).to.be.true;
        });

        it('should return empty array for unknown faction', () => {
            const buildings = manager.getBuildingsOfType('unknown-faction', 'warehouse');
            expect(buildings).to.be.an('array').that.is.empty;
        });

        it('should return empty array for type with no buildings', () => {
            const buildings = manager.getBuildingsOfType(testFactionId, 'barracks');
            expect(buildings).to.be.an('array').that.is.empty;
        });
    });

    describe('Event Handling', () => {
        it('should track building on BUILDING_PLACED event', () => {
            resourceManager.setResource(testFactionId, 'food', 200);
            resourceManager.setResource(testFactionId, 'wood', 200);
            
            const building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            EntityManager.getInstance().addEntity(building!);
            
            EventBus.emit('BUILDING_PLACED', building!.id, 10, 10, 'warehouse');
            
            expect((manager as any).buildings.has(building!.id)).to.be.true;
        });

        it('should untrack building on BUILDING_DESTROYED event', () => {
            resourceManager.setResource(testFactionId, 'food', 200);
            resourceManager.setResource(testFactionId, 'wood', 200);
            
            const building = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            EntityManager.getInstance().addEntity(building!);
            EventBus.emit('BUILDING_PLACED', building!.id, 10, 10, 'warehouse');
            
            EventBus.emit('BUILDING_DESTROYED', building!.id);
            
            expect((manager as any).buildings.has(building!.id)).to.be.false;
        });
    });

    describe('Edge Cases', () => {
        it('should handle multiple simultaneous placements', () => {
            resourceManager.setResource(testFactionId, 'food', 1000);
            resourceManager.setResource(testFactionId, 'wood', 1000);
            resourceManager.setResource(testFactionId, 'stone', 1000);
            
            const building1 = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            const building2 = manager.placeConstructionSite(testFactionId, 'barracks', 20, 20);
            const building3 = manager.placeConstructionSite(testFactionId, 'warehouse', 30, 30);
            
            expect(building1).to.not.be.null;
            expect(building2).to.not.be.null;
            expect(building3).to.not.be.null;
        });

        it('should handle placement at same location', () => {
            resourceManager.setResource(testFactionId, 'food', 1000);
            resourceManager.setResource(testFactionId, 'wood', 1000);
            
            const building1 = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            const building2 = manager.placeConstructionSite(testFactionId, 'warehouse', 10, 10);
            
            // Both should succeed (validation would be in placement logic, not manager)
            expect(building1).to.not.be.null;
            expect(building2).to.not.be.null;
        });

        it('should handle rapid construction and destruction cycles', () => {
            resourceManager.setResource(testFactionId, 'food', 1000);
            resourceManager.setResource(testFactionId, 'wood', 1000);
            
            for (let i = 0; i < 10; i++) {
                const building = manager.placeConstructionSite(testFactionId, 'warehouse', i, i);
                if (building) {
                    EntityManager.getInstance().addEntity(building);
                    EventBus.emit('BUILDING_PLACED', building.id, i, i, 'warehouse');
                    manager.destroyBuilding(building.id);
                    EventBus.emit('BUILDING_DESTROYED', building.id);
                }
            }
            
            expect((manager as any).buildings.size).to.equal(0);
        });
    });
});
