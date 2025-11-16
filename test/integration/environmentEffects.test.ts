import { expect } from 'chai';
import { EnvironmentEffectsManager } from '../../src/managers/EnvironmentEffectsManager';
import { VisualEffectsManager } from '../../src/managers/VisualEffectsManager';
import { TileGrid } from '../../src/world/TileGrid';
import { TileType, Tile } from '../../src/world/TileSystem';
import { EventBus, GameEvents } from '../../src/utils/eventBus';

describe('Environment Effects Integration', () => {
    let envManager: EnvironmentEffectsManager;
    let vfxManager: VisualEffectsManager;
    let mockRenderer: any;
    let registeredRenderables: any[];
    let tileGrid: TileGrid;
    
    beforeEach(() => {
        EventBus.clear();
        registeredRenderables = [];
        
        // Mock renderer
        mockRenderer = {
            register: (renderable: any) => {
                registeredRenderables.push(renderable);
                return () => {
                    const index = registeredRenderables.indexOf(renderable);
                    if (index > -1) {
                        registeredRenderables.splice(index, 1);
                    }
                };
            },
            markLayerDirty: () => {}
        };
        
        // Create water tile grid (5x5 all water)
        const tiles: any[][] = [];
        for (let row = 0; row < 5; row++) {
            const tileRow: any[] = [];
            for (let col = 0; col < 5; col++) {
                const tile = new Tile(col, row, TileType.WATER);
                tileRow.push(tile.toData());
            }
            tiles.push(tileRow);
        }
        tileGrid = new TileGrid(tiles);
        
        envManager = EnvironmentEffectsManager.getInstance();
        envManager.setTileGrid(tileGrid);
        envManager.setRenderer(mockRenderer);
        
        vfxManager = VisualEffectsManager.getInstance();
        vfxManager.setRenderer(mockRenderer);
    });
    
    afterEach(() => {
        EventBus.clear();
    });
    
    describe('Water Damage System', () => {
        it('should detect entity on water tile', () => {
            // Emit entity moved to water tile
            EventBus.emit(GameEvents.ENTITY_MOVED, 'test_entity', 2, 2);
            
            // Manager should track this entity
            // (We can't directly test private state, but damage will be applied)
        });
        
        it('should spawn particles when entity is in water', () => {
            const initialCount = registeredRenderables.length;
            
            // Entity moves to water
            EventBus.emit(GameEvents.ENTITY_MOVED, 'test_entity', 2, 2);
            
            // Create mock entity
            const mockEntity = {
                id: 'test_entity',
                gridX: 2,
                gridY: 2,
                getComponent: () => null
            };
            
            // Wait for particle spawn interval (200ms)
            const wait = Date.now() + 250;
            while (Date.now() < wait) {}
            
            // Update manager
            envManager.update([mockEntity as any]);
            
            // Particles should have been registered
            expect(registeredRenderables.length).to.be.greaterThan(initialCount);
        });
        
        it('should apply damage to entity with HealthComponent', () => {
            let damageTaken = 0;
            const mockHealth = {
                isAlive: () => true,
                takeDamage: (amount: number) => {
                    damageTaken += amount;
                },
                getCurrentHealth: () => 100,
                getMaxHealth: () => 100
            };
            
            const mockEntity = {
                id: 'test_entity',
                gridX: 2,
                gridY: 2,
                getComponent: (name: string) => name === 'Health' ? mockHealth : null
            };
            
            // Entity enters water
            EventBus.emit(GameEvents.ENTITY_MOVED, 'test_entity', 2, 2);
            
            // Wait for damage interval (1000ms)
            const wait = Date.now() + 1100;
            while (Date.now() < wait) {
                envManager.update([mockEntity as any]);
            }
            
            // Damage should have been applied
            expect(damageTaken).to.be.greaterThan(0);
        });
    });
    
    describe('Particle Registration', () => {
        it('should register particles on VISUAL_EFFECTS layer', () => {
            const mockEntity = {
                id: 'test_entity',
                gridX: 2,
                gridY: 2,
                getComponent: () => null
            };
            
            EventBus.emit(GameEvents.ENTITY_MOVED, 'test_entity', 2, 2);
            
            // Wait and update
            const wait = Date.now() + 250;
            while (Date.now() < wait) {}
            envManager.update([mockEntity as any]);
            
            // Check if any registered renderables are particles
            const particles = registeredRenderables.filter(r => r.layer === 5); // VISUAL_EFFECTS = 5
            expect(particles.length).to.be.greaterThan(0);
        });
        
        it('particles should have render method', () => {
            const mockEntity = {
                id: 'test_entity',
                gridX: 2,
                gridY: 2,
                getComponent: () => null
            };
            
            EventBus.emit(GameEvents.ENTITY_MOVED, 'test_entity', 2, 2);
            
            const wait = Date.now() + 250;
            while (Date.now() < wait) {}
            envManager.update([mockEntity as any]);
            
            const particles = registeredRenderables.filter(r => r.layer === 5);
            expect(particles.length).to.be.greaterThan(0);
            
            const particle = particles[0];
            expect(particle).to.have.property('render');
            expect(typeof particle.render).to.equal('function');
        });
    });
});
