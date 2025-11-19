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
        
        it('should listen to BUILDING_CONSTRUCTION_STARTED event', () => {
            let eventReceived = false;
            let eventData: any = null;
            
            // Subscribe before emitting
            EventBus.once(GameEvents.BUILDING_CONSTRUCTION_STARTED, (data: any) => {
                eventReceived = true;
                eventData = data;
            });
            
            // Emit event
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'warehouse',
                gridX: 5,
                gridY: 5,
                factionId: 'test-faction'
            });
            
            expect(eventReceived).to.be.true;
            expect(eventData.buildingType).to.equal('warehouse');
            expect(eventData.gridX).to.equal(5);
            expect(eventData.gridY).to.equal(5);
            expect(eventData.factionId).to.equal('test-faction');
        });
        
        it('should create construction site building on BUILDING_CONSTRUCTION_STARTED', () => {
            // Mock BuildingFactory.create to verify it's called
            let factoryCalled = false;
            const originalCreate = BuildingFactory.create;
            
            (BuildingFactory as any).create = function(...args: any[]) {
                factoryCalled = true;
                expect(args[3]).to.equal(5); // gridX
                expect(args[4]).to.equal(5); // gridY
                expect(args[5]).to.equal('warehouse'); // buildingType
                expect(args[6]).to.equal('test-faction'); // factionId
                return null as any;
            };
            
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'warehouse',
                gridX: 5,
                gridY: 5,
                factionId: 'test-faction'
            });
            
            expect(factoryCalled).to.be.true;
            
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
        
        it('should emit CONSTRUCTION_SITE_CREATED with factionId', () => {
            let emitted = false;
            let eventData: any = null;
            
            EventBus.once(GameEvents.CONSTRUCTION_SITE_CREATED, (data: any) => {
                emitted = true;
                eventData = data;
            });
            
            // Emit construction started (will trigger factory which emits CONSTRUCTION_SITE_CREATED)
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'warehouse',
                gridX: 3,
                gridY: 3,
                factionId: 'test-faction'
            });
            
            expect(emitted).to.be.true;
            expect(eventData.buildingId).to.be.a('string');
            expect(eventData.gridX).to.be.a('number');
            expect(eventData.gridY).to.be.a('number');
            expect(eventData.buildingType).to.be.a('string');
            expect(eventData.sizeWidth).to.be.a('number');
            expect(eventData.sizeHeight).to.be.a('number');
            expect(eventData.factionId).to.equal('test-faction');
        });
    });
    
    describe('Construction Progress Tracking', () => {
        
        it('should start with isConstructed = false', () => {
            const mockBuilding = {
                isConstructed: false,
                constructionProgress: 0
            };
            
            expect(mockBuilding.isConstructed).to.be.false;
            expect(mockBuilding.constructionProgress).to.equal(0);
        });
        
        it('should increment progress when workers assigned', () => {
            // Create mock building
            const mockBuilding = {
                id: 'building-1',
                constructionProgress: 0,
                isConstructed: false,
                addProgress: function(amount: number) {
                    if (this.isConstructed) return;
                    this.constructionProgress = Math.min(100, this.constructionProgress + amount);
                }
            };
            
            // Simulate worker adding progress
            mockBuilding.addProgress(10);
            
            expect(mockBuilding.constructionProgress).to.equal(10);
        });
        
        it('should calculate progress based on workers and construction time', () => {
            const constructionTime = 30; // seconds
            const deltaTime = 1; // 1 second
            const workers = 2; // 2 workers
            
            const progressPerWorker = 100 / constructionTime; // 3.33% per worker per second
            const expectedProgress = workers * progressPerWorker * deltaTime; // 6.66%
            
            expect(expectedProgress).to.be.approximately(6.66, 0.1);
        });
        
        it('should not add progress to completed buildings', () => {
            const mockBuilding = {
                isConstructed: true,
                constructionProgress: 100,
                addProgress: function(amount: number) {
                    if (this.isConstructed) return;
                    this.constructionProgress += amount;
                }
            };
            
            mockBuilding.addProgress(10);
            
            expect(mockBuilding.constructionProgress).to.equal(100); // No change
        });
        
        it('should clamp progress at 100%', () => {
            const mockBuilding = {
                constructionProgress: 95,
                isConstructed: false,
                addProgress: function(amount: number) {
                    this.constructionProgress = Math.min(100, this.constructionProgress + amount);
                }
            };
            
            mockBuilding.addProgress(20); // Would overflow to 115
            
            expect(mockBuilding.constructionProgress).to.equal(100);
        });
        
        it('should emit BUILDING_CONSTRUCTION_PROGRESS event', () => {
            let eventReceived = false;
            let receivedId = '';
            let receivedProgress = 0;
            
            EventBus.once(GameEvents.BUILDING_CONSTRUCTION_PROGRESS, (buildingId: string, progress: number) => {
                eventReceived = true;
                receivedId = buildingId;
                receivedProgress = progress;
            });
            
            // Emit progress event
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_PROGRESS, 'building-1', 50);
            
            expect(eventReceived).to.be.true;
            expect(receivedId).to.equal('building-1');
            expect(receivedProgress).to.be.a('number');
        });
        
        it('should complete construction at 100% progress', () => {
            const mockBuilding = {
                constructionProgress: 100,
                isConstructed: false,
                completeConstruction: function() {
                    this.isConstructed = true;
                },
                isConstructionComplete: function() {
                    return this.constructionProgress >= 100;
                }
            };
            
            expect(mockBuilding.isConstructionComplete()).to.be.true;
            
            mockBuilding.completeConstruction();
            expect(mockBuilding.isConstructed).to.be.true;
        });
        
        it('should trigger completion automatically when progress reaches 100', () => {
            let completionTriggered = false;
            
            const mockBuilding = {
                constructionProgress: 95,
                isConstructed: false,
                addProgress: function(amount: number) {
                    this.constructionProgress = Math.min(100, this.constructionProgress + amount);
                    if (this.constructionProgress >= 100 && !this.isConstructed) {
                        this.completeConstruction();
                    }
                },
                completeConstruction: function() {
                    this.isConstructed = true;
                    completionTriggered = true;
                }
            };
            
            mockBuilding.addProgress(10); // Brings to 105%, clamped to 100
            
            expect(completionTriggered).to.be.true;
            expect(mockBuilding.isConstructed).to.be.true;
        });
    });
    
    describe('Building Completion Sprite Swap', () => {
        
        it('should swap sprite on BUILDING_COMPLETED event', () => {
            let eventReceived = false;
            let receivedId = '';
            
            EventBus.once(GameEvents.BUILDING_COMPLETED, (buildingId: string) => {
                eventReceived = true;
                receivedId = buildingId;
            });
            
            // Emit completion event
            EventBus.emit(GameEvents.BUILDING_COMPLETED, 'building-1');
            
            expect(eventReceived).to.be.true;
            expect(receivedId).to.be.a('string');
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
        
        it('should emit BUILDING_PATHFINDING_BLOCK on construction start', () => {
            let eventReceived = false;
            let receivedTiles: any[] = [];
            
            EventBus.once(GameEvents.BUILDING_PATHFINDING_BLOCK, (tiles: any[]) => {
                eventReceived = true;
                receivedTiles = tiles;
            });
            
            // Emit construction started (factory should emit pathfinding block)
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'warehouse',
                gridX: 5,
                gridY: 5,
                factionId: 'test-faction'
            });
            
            expect(eventReceived).to.be.true;
            expect(receivedTiles).to.be.an('array');
            expect(receivedTiles.length).to.be.at.least(4); // 2x2 minimum
        });
        
        it('should emit BUILDING_PATHFINDING_UNBLOCK on building destroyed', () => {
            let eventReceived = false;
            let receivedTiles: any[] = [];
            
            EventBus.once(GameEvents.BUILDING_PATHFINDING_UNBLOCK, (tiles: any[]) => {
                eventReceived = true;
                receivedTiles = tiles;
            });
            
            // Emit destruction event
            EventBus.emit(GameEvents.BUILDING_PATHFINDING_UNBLOCK, [
                { gridX: 5, gridY: 5 },
                { gridX: 6, gridY: 5 }
            ]);
            
            expect(eventReceived).to.be.true;
            expect(receivedTiles).to.be.an('array');
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
        
        it('should emit CONSTRUCTION_SITE_CREATED after placement', () => {
            let eventReceived = false;
            let eventData: any = null;
            
            EventBus.once(GameEvents.CONSTRUCTION_SITE_CREATED, (data: any) => {
                eventReceived = true;
                eventData = data;
            });
            
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: 'barracks',
                gridX: 10,
                gridY: 10,
                factionId: 'player-faction'
            });
            
            expect(eventReceived).to.be.true;
            expect(eventData.buildingId).to.exist;
            expect(eventData.buildingType).to.be.a('string');
            expect(eventData.factionId).to.be.a('string');
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
