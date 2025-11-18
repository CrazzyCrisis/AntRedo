/**
 * Unit Tests: Building Configuration
 * Tests centralized buildingConfig.ts - terrain validation, unlock status, cost lookup
 */

import { expect } from 'chai';
import { getBuildingByType, BUILDINGS, BuildingType } from '../../src/config/buildings/buildingConfig';
import { TileType } from '../../src/world/TileSystem';

describe('Building Configuration', () => {
    
    describe('BUILDINGS (Centralized Config)', () => {
        
        it('should have configuration for all 12 building types', () => {
            const buildingTypes: BuildingType[] = [
                'warehouse', 'barracks', 'tower',
                'nest', 'builderHut', 'gathererHut', 'spitterHut',
                'speedBeacon', 'attackBeacon', 'attackSpeedBeacon', 'gatherSpeedBeacon', 'terrainNullifierBeacon'
            ];
            
            buildingTypes.forEach(type => {
                expect(BUILDINGS[type]).to.exist;
                expect(BUILDINGS[type].allowedTerrain).to.be.an('array');
                expect(BUILDINGS[type].constructionSprite).to.be.a('string');
                expect(BUILDINGS[type].completedSprite).to.be.a('string');
                expect(BUILDINGS[type].unlocked).to.be.a('boolean');
            });
        });
        
        it('should have valid terrain types in allowedTerrain', () => {
            const validTileTypes = Object.values(TileType).filter(v => typeof v === 'number');
            
            Object.values(BUILDINGS).forEach(config => {
                config.allowedTerrain.forEach((terrain: any) => {
                    expect(validTileTypes).to.include(terrain);
                });
            });
        });
        
        it('should have unique allowed terrain sets for different buildings', () => {
            const warehouse = BUILDINGS.warehouse;
            const barracks = BUILDINGS.barracks;
            const tower = BUILDINGS.tower;
            
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
            Object.values(BUILDINGS).forEach(config => {
                expect(config.allowedTerrain).to.not.include(TileType.WATER);
                expect(config.allowedTerrain).to.not.include(TileType.CAVE_WATER);
            });
        });
        
        it('should have valid sprite paths', () => {
            Object.values(BUILDINGS).forEach(config => {
                expect(config.constructionSprite).to.include('assets/');
                expect(config.constructionSprite).to.include('.png');
                expect(config.completedSprite).to.include('assets/');
                expect(config.completedSprite).to.include('.png');
            });
        });
        
        it('should default all buildings to unlocked', () => {
            Object.values(BUILDINGS).forEach(config => {
                expect(config.unlocked).to.be.true;
            });
        });
    });
    
    describe('getBuildingByType()', () => {
        
        it('should return complete building configuration', () => {
            const warehouseConfig = getBuildingByType('warehouse');
            
            // Should have all properties from centralized config
            expect(warehouseConfig.size).to.exist;
            expect(warehouseConfig.costs).to.exist;
            expect(warehouseConfig.constructionTime).to.exist;
            expect(warehouseConfig.levels).to.exist;
            expect(warehouseConfig.allowedTerrain).to.exist;
            expect(warehouseConfig.constructionSprite).to.exist;
            expect(warehouseConfig.completedSprite).to.exist;
            expect(warehouseConfig.unlocked).to.exist;
        });
        
        it('should return correct size for all buildings', () => {
            const warehouse = getBuildingByType('warehouse');
            const barracks = getBuildingByType('barracks');
            const tower = getBuildingByType('tower');
            
            // Sizes from centralized config
            expect(warehouse.size.width).to.equal(1);
            expect(warehouse.size.height).to.equal(2);
            expect(barracks.size.width).to.equal(2);
            expect(barracks.size.height).to.equal(2);
            expect(tower.size.width).to.equal(2);
            expect(tower.size.height).to.equal(2);
        });
        
        it('should return correct costs for all buildings', () => {
            const warehouse = getBuildingByType('warehouse');
            const barracks = getBuildingByType('barracks');
            const tower = getBuildingByType('tower');
            
            // Verify costs are positive numbers
            expect(warehouse.costs.wood).to.be.greaterThan(0);
            expect(warehouse.costs.stone).to.be.greaterThan(0);
            expect(barracks.costs.wood).to.be.greaterThan(0);
            expect(barracks.costs.stone).to.be.greaterThan(0);
            expect(tower.costs.wood).to.be.greaterThan(0);
            expect(tower.costs.stone).to.be.greaterThan(0);
        });
        
        it('should return construction time in seconds', () => {
            const warehouse = getBuildingByType('warehouse');
            const barracks = getBuildingByType('barracks');
            const tower = getBuildingByType('tower');
            
            // Construction time should be reasonable (5-60 seconds)
            expect(warehouse.constructionTime).to.be.within(5, 60);
            expect(barracks.constructionTime).to.be.within(5, 60);
            expect(tower.constructionTime).to.be.within(5, 60);
        });
        
        it('should validate terrain correctly', () => {
            const warehouse = getBuildingByType('warehouse');
            
            // Can place on grass
            expect(warehouse.allowedTerrain.includes(TileType.GRASS)).to.be.true;
            
            // Cannot place on water
            expect(warehouse.allowedTerrain.includes(TileType.WATER)).to.be.false;
        });
    });
    
    describe('Terrain Validation Logic', () => {
        
        it('should reject water tiles for all buildings', () => {
            const buildingTypes: BuildingType[] = [
                'warehouse', 'barracks', 'tower',
                'nest', 'builderHut', 'gathererHut', 'spitterHut',
                'speedBeacon', 'attackBeacon', 'attackSpeedBeacon', 'gatherSpeedBeacon', 'terrainNullifierBeacon'
            ];
            const waterTiles = [TileType.WATER, TileType.CAVE_WATER];
            
            buildingTypes.forEach(type => {
                const config = getBuildingByType(type);
                waterTiles.forEach(waterType => {
                    expect(config.allowedTerrain.includes(waterType)).to.be.false;
                });
            });
        });
        
        it('should allow grass for all buildings', () => {
            const buildingTypes: BuildingType[] = [
                'warehouse', 'barracks', 'tower',
                'nest', 'builderHut', 'gathererHut', 'spitterHut',
                'speedBeacon', 'attackBeacon', 'attackSpeedBeacon', 'gatherSpeedBeacon', 'terrainNullifierBeacon'
            ];
            
            buildingTypes.forEach(type => {
                const config = getBuildingByType(type);
                expect(config.allowedTerrain.includes(TileType.GRASS)).to.be.true;
            });
        });
        
        it('should have at least 2 allowed terrain types per building', () => {
            const buildingTypes: BuildingType[] = [
                'warehouse', 'barracks', 'tower',
                'nest', 'builderHut', 'gathererHut', 'spitterHut',
                'speedBeacon', 'attackBeacon', 'attackSpeedBeacon', 'gatherSpeedBeacon', 'terrainNullifierBeacon'
            ];
            
            buildingTypes.forEach(type => {
                const config = getBuildingByType(type);
                expect(config.allowedTerrain.length).to.be.at.least(2);
            });
        });
    });
});
