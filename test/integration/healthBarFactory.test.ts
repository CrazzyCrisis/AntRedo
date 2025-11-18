/**
 * Health Bar Factory Integration Tests
 * Verifies that health bars are properly created, positioned, and cleaned up by factories
 */

import { expect } from 'chai';
import { Renderer } from '../../src/rendering/Renderer';
import { Camera } from '../../src/rendering/Camera';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { AntFactory } from '../../src/factories/AntFactory';
import { QueenFactory } from '../../src/factories/QueenFactory';
import { BossFactory } from '../../src/factories/BossFactory';
import { EntityManager } from '../../src/managers/EntityManager';
import { RenderLayer } from '../../src/rendering/RenderLayer';

describe('Health Bar Factory Integration', () => {
    let renderer: Renderer;
    let camera: Camera;
    let mockP5: any;
    
    beforeEach(() => {
        EventBus.clear();
        EntityManager.getInstance().clear();
        QueenFactory.clearAll();
        
        // Create minimal p5 mock
        mockP5 = {
            createGraphics: () => ({
                background: () => {},
                push: () => {},
                pop: () => {},
                translate: () => {},
                scale: () => {},
                image: () => {},
                clear: () => {},
                fill: () => {},
                rect: () => {},
                noStroke: () => {},
                width: 800,
                height: 600
            }),
            width: 800,
            height: 600
        };
        
        camera = new Camera(0, 0, 800, 600);
        renderer = new Renderer(mockP5, 800, 600);
        (renderer as any).camera = camera; // Inject camera for tests
    });
    
    afterEach(() => {
        EventBus.clear();
        EntityManager.getInstance().clear();
        QueenFactory.clearAll();
    });
    
    describe('AntFactory Health Bar Creation', () => {
        it('should create health bar for ant', () => {
            AntFactory.create(renderer, 5, 5, 'player');
            
            // Health bar should be registered on ABOVE_ENTITIES layer
            const aboveEntitiesRenderables = (renderer as any).renderables.get(RenderLayer.ABOVE_ENTITIES);
            expect(aboveEntitiesRenderables).to.exist;
            expect(aboveEntitiesRenderables.length).to.be.greaterThan(0);
            
            // Health bar should exist (look for HealthBarComponent)
            const healthBar = aboveEntitiesRenderables.find((r: any) => 
                r.constructor.name === 'HealthBarComponent'
            );
            expect(healthBar).to.exist;
        });
        
        it('should update health bar position when ant moves', () => {
            const ant = AntFactory.create(renderer, 5, 5, 'player');
            
            const aboveEntitiesRenderables = (renderer as any).renderables.get(RenderLayer.ABOVE_ENTITIES);
            const healthBar = aboveEntitiesRenderables.find((r: any) => 
                r.constructor.name === 'HealthBarComponent'
            );
            
            const initialDepth = healthBar.depth;
            
            // Move ant (simulate grid move via event)
            EventBus.emit(GameEvents.ENTITY_MOVED, ant.id, 5, 8);
            EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, ant.id, 160, 256);
            
            // Health bar depth should update
            expect(healthBar.depth).to.not.equal(initialDepth);
        });
        
        it('should cleanup health bar when ant is destroyed', () => {
            const ant = AntFactory.create(renderer, 5, 5, 'player');
            
            const aboveEntitiesRenderables = (renderer as any).renderables.get(RenderLayer.ABOVE_ENTITIES);
            const initialCount = aboveEntitiesRenderables.length;
            
            // Destroy ant
            ant.destroy();
            
            // Health bar should be removed
            const afterCount = aboveEntitiesRenderables.length;
            expect(afterCount).to.be.lessThan(initialCount);
        });
    });
    
    describe('QueenFactory Health Bar Creation', () => {
        it('should create health bar for queen', () => {
            QueenFactory.create(renderer, 10, 10, 'player');
            
            // Health bar should be registered
            const aboveEntitiesRenderables = (renderer as any).renderables.get(RenderLayer.ABOVE_ENTITIES);
            expect(aboveEntitiesRenderables).to.exist;
            
            const healthBar = aboveEntitiesRenderables.find((r: any) => 
                r.constructor.name === 'HealthBarComponent'
            );
            expect(healthBar).to.exist;
        });
        
        it('should cleanup health bar when queen is destroyed', () => {
            const queen = QueenFactory.create(renderer, 10, 10, 'player');
            
            const aboveEntitiesRenderables = (renderer as any).renderables.get(RenderLayer.ABOVE_ENTITIES);
            const initialCount = aboveEntitiesRenderables.length;
            
            // Destroy queen
            queen.destroy();
            
            // Health bar should be removed
            const afterCount = aboveEntitiesRenderables.length;
            expect(afterCount).to.be.lessThan(initialCount);
        });
    });
    
    describe('BossFactory Health Bar Creation', () => {
        it('should create health bar for boss', () => {
            const mockSprite = { width: 64, height: 64 };
            const patrolPath = [
                { gridX: 5, gridY: 5 },
                { gridX: 10, gridY: 5 }
            ];
            
            BossFactory.create(renderer, mockSprite, 5, 5, patrolPath);
            
            // Health bar should be registered
            const aboveEntitiesRenderables = (renderer as any).renderables.get(RenderLayer.ABOVE_ENTITIES);
            expect(aboveEntitiesRenderables).to.exist;
            
            const healthBar = aboveEntitiesRenderables.find((r: any) => 
                r.constructor.name === 'HealthBarComponent'
            );
            expect(healthBar).to.exist;
        });
        
        it('should cleanup health bar when boss is destroyed', () => {
            const mockSprite = { width: 64, height: 64 };
            const patrolPath = [
                { gridX: 5, gridY: 5 },
                { gridX: 10, gridY: 5 }
            ];
            
            const boss = BossFactory.create(renderer, mockSprite, 5, 5, patrolPath);
            
            const aboveEntitiesRenderables = (renderer as any).renderables.get(RenderLayer.ABOVE_ENTITIES);
            const initialCount = aboveEntitiesRenderables.length;
            
            // Destroy boss
            boss.destroy();
            
            // Health bar should be removed
            const afterCount = aboveEntitiesRenderables.length;
            expect(afterCount).to.be.lessThan(initialCount);
        });
    });
    
    describe('Health Bar Event Integration', () => {
        it('should respond to damage events', () => {
            const ant = AntFactory.create(renderer, 5, 5, 'player');
            
            const healthComp = ant.getComponent('Health') as any;
            
            // Damage the ant
            healthComp.takeDamage(20, 'attacker');
            
            // Health bar should still exist and be visible
            const aboveEntitiesRenderables = (renderer as any).renderables.get(RenderLayer.ABOVE_ENTITIES);
            const healthBar = aboveEntitiesRenderables.find((r: any) => 
                r.constructor.name === 'HealthBarComponent'
            );
            expect(healthBar).to.exist;
        });
        
        it('should respond to heal events', () => {
            const ant = AntFactory.create(renderer, 5, 5, 'player');
            
            const healthComp = ant.getComponent('Health') as any;
            
            // Damage then heal
            healthComp.takeDamage(30, 'attacker');
            healthComp.heal(10);
            
            // Health bar should still exist
            const aboveEntitiesRenderables = (renderer as any).renderables.get(RenderLayer.ABOVE_ENTITIES);
            const healthBar = aboveEntitiesRenderables.find((r: any) => 
                r.constructor.name === 'HealthBarComponent'
            );
            expect(healthBar).to.exist;
        });
    });
    
    describe('Layer Dirty Marking', () => {
        it('should mark ABOVE_ENTITIES layer dirty when health bar position updates', () => {
            const ant = AntFactory.create(renderer, 5, 5, 'player');
            
            // Clear dirty flags
            renderer.render();
            
            // Move ant (should mark health bar's layer dirty)
            EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, ant.id, 200, 200);
            
            // ABOVE_ENTITIES layer should be marked dirty
            const isDirty = (renderer as any).dirtyLayers.has(RenderLayer.ABOVE_ENTITIES);
            expect(isDirty).to.be.true;
        });
    });
});
