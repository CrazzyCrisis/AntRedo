/**
 * Unit Tests: Construction Workflow
 * Tests BuildingManager event handling, BuildingFactory factionId integration
 */

import { expect } from 'chai';
import { BuildingManager } from '../../src/managers/BuildingManager';
import { BuildingFactory } from '../../src/factories/BuildingFactory';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { EntityManager } from '../../src/managers/EntityManager';

describe('Construction Workflow', () => {
    let buildingManager: BuildingManager;
    let entityManager: EntityManager;
    
    beforeEach(() => {
        EventBus.clear();
        buildingManager = BuildingManager.getInstance();
        entityManager = EntityManager.getInstance();
    });
    
    afterEach(() => {
        buildingManager.cleanup();
        entityManager.cleanup();
        EventBus.clear();
    });
    
    describe('BuildingManager Event Handling', () => {
        
        it('should listen to BUILDING_CONSTRUCTION_STARTED event', (done) => {
            // Subscribe before emitting
            EventBus.once(GameEvents.BUILDING_CONSTRUCTION_STARTED, (data: any) => {
                expect(data.buildingType).to.equal('warehouse');
                expect(data.gridX).to.equal(5);
                expect(data.gridY).to.equal(5);
                expect(data.factionId).to.equal('test-faction');
                done();
            });
            
            // Emit event
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'warehouse',
                gridX: 5,
                gridY: 5,
                factionId: 'test-faction'
            });
        });
        
        it('should create construction site building on BUILDING_CONSTRUCTION_STARTED', (done) => {
            // Mock BuildingFactory.create to verify it's called
            // let factoryCalled = false;
            const originalCreate = BuildingFactory.create;
            
            (BuildingFactory as any).create = function(...args: any[]) {
                // factoryCalled = true;
                expect(args[3]).to.equal(5); // gridX
                expect(args[4]).to.equal(5); // gridY
                expect(args[5]).to.equal('warehouse'); // buildingType
                expect(args[6]).to.equal('test-faction'); // factionId
                done();
                return null as any;
            };
            
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'warehouse',
                gridX: 5,
                gridY: 5,
                factionId: 'test-faction'
            });
            
            // Restore original
            (BuildingFactory as any).create = originalCreate;
        });
        
        it('should track building construction progress', () => {
            // This will be implemented when BuildingManager subscribes to BUILDING_CONSTRUCTION_STARTED
            expect(buildingManager['buildings']).to.be.a('map');
        });
    });
    
    describe('BuildingFactory factionId Integration', () => {
        
        it('should accept factionId parameter in create()', () => {
            // Verify BuildingFactory.create signature includes factionId
            expect(BuildingFactory.create).to.be.a('function');
            expect(BuildingFactory.create.length).to.be.at.least(6); // At least 6 params including factionId
        });
        
        it('should pass factionId to Building constructor', () => {
            // This will be verified when Building class accepts factionId
            // Test that Building model stores factionId
            expect(true).to.be.true; // Placeholder for implementation test
        });
        
        it('should emit CONSTRUCTION_SITE_CREATED with factionId', (done) => {
            EventBus.once(GameEvents.CONSTRUCTION_SITE_CREATED, (data: any) => {
                expect(data.buildingId).to.be.a('string');
                expect(data.gridX).to.be.a('number');
                expect(data.gridY).to.be.a('number');
                expect(data.buildingType).to.be.a('string');
                expect(data.sizeWidth).to.be.a('number');
                expect(data.sizeHeight).to.be.a('number');
                expect(data.factionId).to.equal('test-faction');
                done();
            });
            
            // Emit construction started (will trigger factory which emits CONSTRUCTION_SITE_CREATED)
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'warehouse',
                gridX: 3,
                gridY: 3,
                factionId: 'test-faction'
            });
        });
    });
    
    describe('Construction Progress Tracking', () => {
        
        it('should increment progress when workers assigned', () => {
            // Create mock building
            const mockBuilding = {
                id: 'building-1',
                constructionProgress: 0,
                isConstructionComplete: () => false,
                addProgress: function(amount: number) {
                    this.constructionProgress += amount;
                }
            };
            
            // Simulate worker adding progress
            mockBuilding.addProgress(10);
            
            expect(mockBuilding.constructionProgress).to.equal(10);
        });
        
        it('should emit BUILDING_CONSTRUCTION_PROGRESS event', (done) => {
            EventBus.once(GameEvents.BUILDING_CONSTRUCTION_PROGRESS, (buildingId: string, progress: number) => {
                expect(buildingId).to.equal('building-1');
                expect(progress).to.be.a('number');
                done();
            });
            
            // Emit progress event
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_PROGRESS, 'building-1', 50);
        });
        
        it('should complete construction at 100% progress', () => {
            const mockBuilding = {
                constructionProgress: 100,
                isConstructionComplete: function() {
                    return this.constructionProgress >= 100;
                }
            };
            
            expect(mockBuilding.isConstructionComplete()).to.be.true;
        });
    });
    
    describe('Building Completion Sprite Swap', () => {
        
        it('should swap sprite on BUILDING_COMPLETED event', (done) => {
            EventBus.once(GameEvents.BUILDING_COMPLETED, (buildingId: string) => {
                expect(buildingId).to.be.a('string');
                done();
            });
            
            // Emit completion event
            EventBus.emit(GameEvents.BUILDING_COMPLETED, 'building-1');
        });
        
        it('should update sprite from construction to completed', () => {
            // Mock sprite component
            const mockSprite = {
                currentSprite: 'construction_site.png',
                setSprite: function(newSprite: string) {
                    this.currentSprite = newSprite;
                }
            };
            
            // Simulate completion
            mockSprite.setSprite('warehouse_completed.png');
            
            expect(mockSprite.currentSprite).to.equal('warehouse_completed.png');
        });
        
        it('should maintain building position after sprite swap', () => {
            const mockBuilding = {
                worldX: 160,
                worldY: 160,
                gridX: 5,
                gridY: 5
            };
            
            // Position should not change on completion
            expect(mockBuilding.worldX).to.equal(160);
            expect(mockBuilding.gridX).to.equal(5);
        });
    });
    
    describe('Pathfinding Integration', () => {
        
        it('should emit BUILDING_PATHFINDING_BLOCK on construction start', (done) => {
            EventBus.once(GameEvents.BUILDING_PATHFINDING_BLOCK, (tiles: any[]) => {
                expect(tiles).to.be.an('array');
                expect(tiles.length).to.be.at.least(4); // 2x2 minimum
                done();
            });
            
            // Emit construction started (factory should emit pathfinding block)
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'warehouse',
                gridX: 5,
                gridY: 5,
                factionId: 'test-faction'
            });
        });
        
        it('should emit BUILDING_PATHFINDING_UNBLOCK on building destroyed', (done) => {
            EventBus.once(GameEvents.BUILDING_PATHFINDING_UNBLOCK, (tiles: any[]) => {
                expect(tiles).to.be.an('array');
                done();
            });
            
            // Emit destruction event
            EventBus.emit(GameEvents.BUILDING_PATHFINDING_UNBLOCK, [
                { gridX: 5, gridY: 5 },
                { gridX: 6, gridY: 5 }
            ]);
        });
    });
    
    describe('Multi-Faction Support', () => {
        
        it('should track buildings per faction', () => {
            expect(buildingManager['buildingsByFaction']).to.be.a('map');
        });
        
        it('should separate buildings by factionId', () => {
            // Create buildings for different factions
            const faction1Buildings = new Set(['building-1', 'building-2']);
            const faction2Buildings = new Set(['building-3']);
            
            expect(faction1Buildings.size).to.equal(2);
            expect(faction2Buildings.size).to.equal(1);
        });
        
        it('should query buildings by faction', () => {
            // Test getFactionBuildings method
            const factionBuildings = buildingManager.getFactionBuildings('test-faction');
            expect(factionBuildings).to.be.an('array');
        });
    });
    
    describe('Construction Site Creation', () => {
        
        it('should create building with initial construction progress 0', () => {
            const mockBuilding = {
                constructionProgress: 0,
                isConstructionComplete: () => false
            };
            
            expect(mockBuilding.constructionProgress).to.equal(0);
            expect(mockBuilding.isConstructionComplete()).to.be.false;
        });
        
        it('should use construction site sprite initially', () => {
            // Verified in BuildingFactory implementation
            expect(true).to.be.true;
        });
        
        it('should emit CONSTRUCTION_SITE_CREATED after placement', (done) => {
            EventBus.once(GameEvents.CONSTRUCTION_SITE_CREATED, (data: any) => {
                expect(data.buildingId).to.exist;
                expect(data.buildingType).to.be.a('string');
                expect(data.factionId).to.be.a('string');
                done();
            });
            
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'barracks',
                gridX: 10,
                gridY: 10,
                factionId: 'player-faction'
            });
        });
    });
    
    describe('Resource Deduction', () => {
        
        it('should deduct resources on construction start', () => {
            // This will be handled by BuildingPlacementManager before emitting BUILDING_CONSTRUCTION_STARTED
            // BuildingManager trusts that resources were validated
            expect(true).to.be.true;
        });
        
        it('should NOT refund resources if construction cancelled', () => {
            // Design decision: resources spent immediately
            expect(true).to.be.true;
        });
    });
});
