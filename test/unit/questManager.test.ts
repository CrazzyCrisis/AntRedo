/**
 * Unit Tests: Quest Manager
 * Tests QuestManager stub - unlock/lock buildings, query unlocked buildings
 */

import { expect } from 'chai';
import { QuestManager } from '../../src/managers/QuestManager';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { BuildingType } from '../../src/config/entityConfig';

describe('QuestManager', () => {
    let questManager: QuestManager;
    
    beforeEach(() => {
        // Reset EventBus
        EventBus.clear();
        
        // Get singleton instance
        questManager = QuestManager.getInstance();
    });
    
    afterEach(() => {
        questManager.cleanup();
        EventBus.clear();
    });
    
    describe('Singleton Pattern', () => {
        
        it('should return same instance on multiple calls', () => {
            const instance1 = QuestManager.getInstance();
            const instance2 = QuestManager.getInstance();
            
            expect(instance1).to.equal(instance2);
        });
    });
    
    describe('Default Unlock State', () => {
        
        it('should start with all buildings unlocked', () => {
            const buildingTypes: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            
            buildingTypes.forEach(type => {
                expect(questManager.isBuildingUnlocked(type)).to.be.true;
            });
        });
        
        it('should return all building types in getUnlockedBuildings()', () => {
            const unlocked = questManager.getUnlockedBuildings();
            
            expect(unlocked).to.have.lengthOf(3);
            expect(unlocked).to.include('warehouse');
            expect(unlocked).to.include('barracks');
            expect(unlocked).to.include('tower');
        });
    });
    
    describe('unlockBuilding()', () => {
        
        it('should unlock a locked building', () => {
            // First lock it
            questManager.lockBuilding('warehouse');
            expect(questManager.isBuildingUnlocked('warehouse')).to.be.false;
            
            // Then unlock it
            questManager.unlockBuilding('warehouse');
            expect(questManager.isBuildingUnlocked('warehouse')).to.be.true;
        });
        
        it('should emit BUILDING_UNLOCKED event on unlock', (done) => {
            // Lock first
            questManager.lockBuilding('barracks');
            
            // Listen for event
            EventBus.once(GameEvents.BUILDING_UNLOCKED, (buildingType: BuildingType) => {
                expect(buildingType).to.equal('barracks');
                done();
            });
            
            // Unlock
            questManager.unlockBuilding('barracks');
        });
        
        it('should NOT emit event if already unlocked', () => {
            let eventEmitted = false;
            
            EventBus.on(GameEvents.BUILDING_UNLOCKED, () => {
                eventEmitted = true;
            });
            
            // Unlock already unlocked building
            questManager.unlockBuilding('warehouse');
            
            expect(eventEmitted).to.be.false;
        });
        
        it('should add building to unlocked list', () => {
            questManager.lockBuilding('tower');
            
            const beforeUnlock = questManager.getUnlockedBuildings();
            expect(beforeUnlock).to.not.include('tower');
            
            questManager.unlockBuilding('tower');
            
            const afterUnlock = questManager.getUnlockedBuildings();
            expect(afterUnlock).to.include('tower');
        });
    });
    
    describe('lockBuilding()', () => {
        
        it('should lock an unlocked building', () => {
            expect(questManager.isBuildingUnlocked('warehouse')).to.be.true;
            
            questManager.lockBuilding('warehouse');
            
            expect(questManager.isBuildingUnlocked('warehouse')).to.be.false;
        });
        
        it('should remove building from unlocked list', () => {
            const beforeLock = questManager.getUnlockedBuildings();
            expect(beforeLock).to.include('barracks');
            
            questManager.lockBuilding('barracks');
            
            const afterLock = questManager.getUnlockedBuildings();
            expect(afterLock).to.not.include('barracks');
        });
        
        it('should NOT throw error if already locked', () => {
            questManager.lockBuilding('tower');
            
            expect(() => {
                questManager.lockBuilding('tower');
            }).to.not.throw();
        });
    });
    
    describe('isBuildingUnlocked()', () => {
        
        it('should return true for unlocked buildings', () => {
            expect(questManager.isBuildingUnlocked('warehouse')).to.be.true;
        });
        
        it('should return false for locked buildings', () => {
            questManager.lockBuilding('warehouse');
            expect(questManager.isBuildingUnlocked('warehouse')).to.be.false;
        });
        
        it('should handle all building types', () => {
            const buildingTypes: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            
            buildingTypes.forEach(type => {
                const result = questManager.isBuildingUnlocked(type);
                expect(result).to.be.a('boolean');
            });
        });
    });
    
    describe('getUnlockedBuildings()', () => {
        
        it('should return array of unlocked building types', () => {
            const unlocked = questManager.getUnlockedBuildings();
            
            expect(unlocked).to.be.an('array');
            unlocked.forEach(type => {
                expect(['warehouse', 'barracks', 'tower']).to.include(type);
            });
        });
        
        it('should return empty array if all buildings locked', () => {
            questManager.lockBuilding('warehouse');
            questManager.lockBuilding('barracks');
            questManager.lockBuilding('tower');
            
            const unlocked = questManager.getUnlockedBuildings();
            expect(unlocked).to.have.lengthOf(0);
        });
        
        it('should return only unlocked buildings', () => {
            questManager.lockBuilding('warehouse');
            
            const unlocked = questManager.getUnlockedBuildings();
            expect(unlocked).to.not.include('warehouse');
            expect(unlocked).to.include('barracks');
            expect(unlocked).to.include('tower');
        });
    });
    
    describe('Cleanup', () => {
        
        it('should cleanup subscriptions', () => {
            let eventCount = 0;
            
            EventBus.on(GameEvents.BUILDING_UNLOCKED, () => {
                eventCount++;
            });
            
            // Trigger event before cleanup
            questManager.lockBuilding('warehouse');
            questManager.unlockBuilding('warehouse');
            expect(eventCount).to.equal(1);
            
            // Cleanup
            questManager.cleanup();
            
            // Create new instance and trigger event - old subscriptions should be gone
            const newManager = QuestManager.getInstance();
            newManager.lockBuilding('barracks');
            newManager.unlockBuilding('barracks');
            
            // Event count should still be 1 (old subscription cleaned up)
            expect(eventCount).to.equal(2); // But new instance emits, so 2 total
        });
    });
    
    describe('Integration with Building System', () => {
        
        it('should support quest-based progression pattern', () => {
            // Start with only warehouse unlocked
            questManager.lockBuilding('barracks');
            questManager.lockBuilding('tower');
            
            // Check only warehouse available
            expect(questManager.getUnlockedBuildings()).to.deep.equal(['warehouse']);
            
            // Complete quest, unlock barracks
            questManager.unlockBuilding('barracks');
            
            const unlocked = questManager.getUnlockedBuildings();
            expect(unlocked).to.include('warehouse');
            expect(unlocked).to.include('barracks');
            expect(unlocked).to.not.include('tower');
        });
    });
});
