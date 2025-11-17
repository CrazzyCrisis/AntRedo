/**
 * Unit Tests: Building Configuration
 * Tests buildingConfig.ts - terrain validation, unlock status, cost lookup
 */

import { expect } from 'chai';
import { getBuildingConfig, BUILDING_PLACEMENT_CONFIG } from '../../src/config/buildingConfig';
import { BuildingType } from '../../src/config/entityConfig';
import { TileType } from '../../src/world/TileSystem';

describe('Building Configuration', () => {
    
    describe('BUILDING_PLACEMENT_CONFIG', () => {
        
        it('should have configuration for all building types', () => {
            const buildingTypes: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            
            buildingTypes.forEach(type => {
                expect(BUILDING_PLACEMENT_CONFIG[type]).to.exist;
                expect(BUILDING_PLACEMENT_CONFIG[type].allowedTerrain).to.be.an('array');
                expect(BUILDING_PLACEMENT_CONFIG[type].constructionSprite).to.be.a('string');
                expect(BUILDING_PLACEMENT_CONFIG[type].completedSprite).to.be.a('string');
                expect(BUILDING_PLACEMENT_CONFIG[type].unlocked).to.be.a('boolean');
            });
        });
        
        it('should have valid terrain types in allowedTerrain', () => {
            const validTileTypes = Object.values(TileType).filter(v => typeof v === 'number');
            
            Object.values(BUILDING_PLACEMENT_CONFIG).forEach(config => {
                config.allowedTerrain.forEach(terrain => {
                    expect(validTileTypes).to.include(terrain);
                });
            });
        });
        
        it('should have unique allowed terrain sets for different buildings', () => {
            const warehouse = BUILDING_PLACEMENT_CONFIG.warehouse;
            const barracks = BUILDING_PLACEMENT_CONFIG.barracks;
            const tower = BUILDING_PLACEMENT_CONFIG.tower;
            
            // Warehouse should allow farmland, grass, dirt
            expect(warehouse.allowedTerrain).to.include(TileType.GRASS);
            expect(warehouse.allowedTerrain).to.include(TileType.DIRT);
            expect(warehouse.allowedTerrain).to.include(TileType.FARMLAND);
            
            // Barracks should allow grass, dirt, stone
            expect(barracks.allowedTerrain).to.include(TileType.GRASS);
            expect(barracks.allowedTerrain).to.include(TileType.DIRT);
            expect(barracks.allowedTerrain).to.include(TileType.STONE);
            
            // Tower should allow grass, stone (more restrictive)
            expect(tower.allowedTerrain).to.include(TileType.GRASS);
            expect(tower.allowedTerrain).to.include(TileType.STONE);
        });
        
        it('should NOT allow buildings on water', () => {
            Object.values(BUILDING_PLACEMENT_CONFIG).forEach(config => {
                expect(config.allowedTerrain).to.not.include(TileType.WATER);
                expect(config.allowedTerrain).to.not.include(TileType.CAVE_WATER);
            });
        });
        
        it('should have valid sprite paths', () => {
            Object.values(BUILDING_PLACEMENT_CONFIG).forEach(config => {
                expect(config.constructionSprite).to.include('assets/');
                expect(config.constructionSprite).to.include('.png');
                expect(config.completedSprite).to.include('assets/');
                expect(config.completedSprite).to.include('.png');
            });
        });
        
        it('should default all buildings to unlocked', () => {
            Object.values(BUILDING_PLACEMENT_CONFIG).forEach(config => {
                expect(config.unlocked).to.be.true;
            });
        });
    });
    
    describe('getBuildingConfig()', () => {
        
        it('should merge ENTITY_CONFIG.BUILDINGS with BUILDING_PLACEMENT_CONFIG', () => {
            const warehouseConfig = getBuildingConfig('warehouse');
            
            // Should have properties from ENTITY_CONFIG.BUILDINGS
            expect(warehouseConfig.size).to.exist;
            expect(warehouseConfig.costs).to.exist;
            expect(warehouseConfig.constructionTime).to.exist;
            expect(warehouseConfig.levels).to.exist;
            
            // Should have properties from BUILDING_PLACEMENT_CONFIG
            expect(warehouseConfig.allowedTerrain).to.exist;
            // Phase 4: constructionSprite/completedSprite may not exist for new buildings (use centralized config)
            // expect(warehouseConfig.constructionSprite).to.exist;
            // expect(warehouseConfig.completedSprite).to.exist;
            expect(warehouseConfig.unlocked).to.exist;
        });
        
        it('should return correct size for all buildings', () => {
            const warehouse = getBuildingConfig('warehouse');
            const barracks = getBuildingConfig('barracks');
            const tower = getBuildingConfig('tower');
            
            // All buildings are 2x2 minimum (Phase 4: use optional chaining)
            expect(warehouse.size?.width).to.equal(2);
            expect(warehouse.size?.height).to.equal(2);
            expect(barracks.size?.width).to.equal(2);
            expect(barracks.size?.height).to.equal(2);
            expect(tower.size?.width).to.equal(2);
            expect(tower.size?.height).to.equal(2);
        });
        
        it('should return correct costs for all buildings', () => {
            const warehouse = getBuildingConfig('warehouse');
            const barracks = getBuildingConfig('barracks');
            const tower = getBuildingConfig('tower');
            
            // Verify costs are positive numbers
            expect(warehouse.costs.wood).to.be.greaterThan(0);
            expect(warehouse.costs.stone).to.be.greaterThan(0);
            expect(barracks.costs.wood).to.be.greaterThan(0);
            expect(barracks.costs.stone).to.be.greaterThan(0);
            expect(tower.costs.wood).to.be.greaterThan(0);
            expect(tower.costs.stone).to.be.greaterThan(0);
        });
        
        it('should return construction time in seconds', () => {
            const warehouse = getBuildingConfig('warehouse');
            const barracks = getBuildingConfig('barracks');
            const tower = getBuildingConfig('tower');
            
            // Construction time should be reasonable (5-60 seconds)
            expect(warehouse.constructionTime).to.be.within(5, 60);
            expect(barracks.constructionTime).to.be.within(5, 60);
            expect(tower.constructionTime).to.be.within(5, 60);
        });
        
        it('should validate terrain correctly', () => {
            const warehouse = getBuildingConfig('warehouse');
            
            // Can place on grass
            expect(warehouse.allowedTerrain.includes(TileType.GRASS)).to.be.true;
            
            // Cannot place on water
            expect(warehouse.allowedTerrain.includes(TileType.WATER)).to.be.false;
        });
    });
    
    describe('Terrain Validation Logic', () => {
        
        it('should reject water tiles for all buildings', () => {
            const buildingTypes: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            const waterTiles = [TileType.WATER, TileType.CAVE_WATER];
            
            buildingTypes.forEach(type => {
                const config = getBuildingConfig(type);
                waterTiles.forEach(waterType => {
                    expect(config.allowedTerrain.includes(waterType)).to.be.false;
                });
            });
        });
        
        it('should allow grass for all buildings', () => {
            const buildingTypes: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            
            buildingTypes.forEach(type => {
                const config = getBuildingConfig(type);
                expect(config.allowedTerrain.includes(TileType.GRASS)).to.be.true;
            });
        });
        
        it('should have at least 2 allowed terrain types per building', () => {
            const buildingTypes: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            
            buildingTypes.forEach(type => {
                const config = getBuildingConfig(type);
                expect(config.allowedTerrain.length).to.be.at.least(2);
            });
        });
    });
});
