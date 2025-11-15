import { expect } from 'chai';
import { AntFactory } from '../../src/factories/AntFactory';
import { Ant } from '../../src/classes/Ant';
import { Renderer } from '../../src/rendering/Renderer';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { AntJobComponent } from '../../src/classes/components/AntJobComponent';

describe('AntFactory', () => {
    let renderer: Renderer;
    let mockP5: any;
    let mockSprite: any;

    beforeEach(() => {
        EventBus.clear();
        
        // Mock p5 instance
        mockP5 = {
            createGraphics: (w: number, h: number) => ({
                width: w,
                height: h,
                clear: () => {},
                push: () => {},
                pop: () => {},
                translate: () => {},
                scale: () => {},
                image: () => {},
                fill: () => {},
                rect: () => {},
                stroke: () => {},
                noStroke: () => {},
                ellipse: () => {},
                beginShape: () => {},
                vertex: () => {},
                endShape: () => {}
            })
        };

        // Mock sprite
        mockSprite = {
            width: 32,
            height: 32
        };

        renderer = new Renderer(mockP5, 800, 600);
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Factory Creation', () => {
        it('should create ant at grid position', () => {
            const ant = AntFactory.create(renderer, mockSprite, 5, 10, 'faction_1');

            expect(ant).to.be.instanceOf(Ant);
            expect(ant.gridX).to.equal(5);
            expect(ant.gridY).to.equal(10);
        });

        it('should create ant with faction ID', () => {
            const ant = AntFactory.create(renderer, mockSprite, 0, 0, 'player_faction');

            expect(ant.getFactionId()).to.equal('player_faction');
        });

        it('should create ant with default GATHERER job', () => {
            const ant = AntFactory.create(renderer, mockSprite, 0, 0, 'faction_1');
            const jobComponent = ant.getComponent('AntJob') as AntJobComponent;

            expect(jobComponent?.getCurrentJob()).to.equal(AntJobComponent.JOB_GATHERER);
        });

        it('should create ant with custom job type', () => {
            const ant = AntFactory.create(
                renderer,
                mockSprite,
                0,
                0,
                'faction_1',
                AntJobComponent.JOB_WARRIOR
            );
            const jobComponent = ant.getComponent('AntJob') as AntJobComponent;

            expect(jobComponent?.getCurrentJob()).to.equal(AntJobComponent.JOB_WARRIOR);
        });
    });

    describe('Rendering Integration', () => {
        it('should register sprite with renderer', () => {
            AntFactory.create(renderer, mockSprite, 5, 10, 'faction_1');

            // Verify renderer has renderable on ENTITIES layer
            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(1);
        });

        it('should use Y position as depth for sprite sorting', () => {
            AntFactory.create(renderer, mockSprite, 5, 10, 'faction_1');

            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            const spriteComponent = renderables[0];
            
            // Depth should equal Y position for proper layering
            expect(spriteComponent.depth).to.equal(10);
        });

        it.skip('should update sprite position on ENTITY_MOVED event', () => {
            const ant = AntFactory.create(renderer, mockSprite, 5, 10, 'faction_1');

            // Get sprite component
            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            const spriteComponent = renderables[0];
            
            // Track setPosition calls
            let setPositionCalled = false;
            let lastX = 0, lastY = 0;
            const originalSetPosition = spriteComponent.setPosition.bind(spriteComponent);
            spriteComponent.setPosition = (x: number, y: number) => {
                setPositionCalled = true;
                lastX = x;
                lastY = y;
                originalSetPosition(x, y);
            };

            // Emit move event
            EventBus.emit(GameEvents.ENTITY_MOVED, ant.id, 8, 12);

            // Should update position via setPosition()
            expect(setPositionCalled).to.be.true;
            expect(lastX).to.equal(8);
            expect(lastY).to.equal(12);
            expect(spriteComponent.depth).to.equal(12); // Depth updates with Y
        });

        it('should remove sprite on ENTITY_DESTROYED event', () => {
            const ant = AntFactory.create(renderer, mockSprite, 5, 10, 'faction_1');

            // Verify sprite exists
            let renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(1);

            // Emit destroy event
            EventBus.emit('ENTITY_DESTROYED', ant.id, 'ant');

            // Sprite should be removed
            renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(0);
        });

        it.skip('should mark layer dirty on sprite position update', () => {
            // Spy on markLayerDirty BEFORE creating ant
            let dirtyLayerCalls = 0;
            const originalMarkDirty = renderer.markLayerDirty.bind(renderer);
            renderer.markLayerDirty = (layer: RenderLayer) => {
                dirtyLayerCalls++;
                originalMarkDirty(layer);
            };
            
            const ant = AntFactory.create(renderer, mockSprite, 5, 10, 'faction_1');
            
            // Reset counter after creation
            dirtyLayerCalls = 0;

            // Emit move event
            EventBus.emit(GameEvents.ENTITY_MOVED, ant.id, 8, 12);

            // Should have marked layer dirty
            expect(dirtyLayerCalls).to.be.greaterThan(0);
        });
    });

    describe('Component Integration', () => {
        it('should create ant with all 9 components', () => {
            const ant = AntFactory.create(renderer, mockSprite, 0, 0, 'faction_1');

            expect(ant.getComponent('StateMachine')).to.exist;
            expect(ant.getComponent('Pathfinding')).to.exist;
            expect(ant.getComponent('Health')).to.exist;
            expect(ant.getComponent('Combat')).to.exist;
            expect(ant.getComponent('Inventory')).to.exist;
            expect(ant.getComponent('Vision')).to.exist;
            expect(ant.getComponent('AIBehavior')).to.exist;
            expect(ant.getComponent('AntJob')).to.exist;
            expect(ant.getComponent('Hunger')).to.exist;
        });

        it('should create autonomous ant by default', () => {
            const ant = AntFactory.create(renderer, mockSprite, 0, 0, 'faction_1');

            expect(ant.isAutonomous()).to.be.true;
        });
    });

    describe('Cleanup', () => {
        it('should provide cleanup method', () => {
            const ant = AntFactory.create(renderer, mockSprite, 5, 10, 'faction_1');

            expect((ant as any)._cleanup).to.be.a('function');
        });

        it('should cleanup sprite and listeners on manual cleanup', () => {
            const ant = AntFactory.create(renderer, mockSprite, 5, 10, 'faction_1');

            // Verify sprite exists
            let renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(1);

            // Manual cleanup
            (ant as any)._cleanup();

            // Sprite should be removed
            renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(0);
        });

        it('should handle destroy event after manual cleanup', () => {
            const ant = AntFactory.create(renderer, mockSprite, 5, 10, 'faction_1');

            // Manual cleanup
            (ant as any)._cleanup();

            // Should not throw when destroy event fires
            expect(() => {
                EventBus.emit('ENTITY_DESTROYED', ant.id, 'ant');
            }).to.not.throw();
        });
    });

    describe('Multiple Ants', () => {
        it('should create multiple ants with separate sprites', () => {
            AntFactory.create(renderer, mockSprite, 0, 0, 'faction_1');
            AntFactory.create(renderer, mockSprite, 5, 5, 'faction_1');
            AntFactory.create(renderer, mockSprite, 10, 10, 'faction_2');

            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(3);
        });

        it.skip('should only update sprite for matching ant ID', () => {
            const ant1 = AntFactory.create(renderer, mockSprite, 0, 0, 'faction_1');
            AntFactory.create(renderer, mockSprite, 5, 5, 'faction_1'); // ant2

            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            const sprite1 = renderables[0];
            const sprite2 = renderables[1];
            
            // Track setPosition calls on sprite2
            let sprite2UpdateCount = 0;
            const originalSetPosition = sprite2.setPosition.bind(sprite2);
            sprite2.setPosition = (x: number, y: number) => {
                sprite2UpdateCount++;
                originalSetPosition(x, y);
            };

            // Move ant1
            EventBus.emit(GameEvents.ENTITY_MOVED, ant1.id, 3, 3);

            // Sprite2 should NOT have been updated
            expect(sprite2UpdateCount).to.equal(0);
            
            // Verify sprite1 updated by checking depth (Y-coordinate)
            expect(sprite1.depth).to.equal(3);
        });

        it('should only remove sprite for matching ant ID on destroy', () => {
            const ant1 = AntFactory.create(renderer, mockSprite, 0, 0, 'faction_1');
            AntFactory.create(renderer, mockSprite, 5, 5, 'faction_1');

            // Destroy ant1
            EventBus.emit('ENTITY_DESTROYED', ant1.id, 'ant');

            // Only sprite1 should be removed
            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle negative grid positions', () => {
            const ant = AntFactory.create(renderer, mockSprite, -5, -10, 'faction_1');

            expect(ant.gridX).to.equal(-5);
            expect(ant.gridY).to.equal(-10);
        });

        it('should handle large grid positions', () => {
            const ant = AntFactory.create(renderer, mockSprite, 1000, 2000, 'faction_1');

            expect(ant.gridX).to.equal(1000);
            expect(ant.gridY).to.equal(2000);
        });

        it('should handle empty faction ID', () => {
            const ant = AntFactory.create(renderer, mockSprite, 0, 0, '');

            expect(ant.getFactionId()).to.equal('');
        });

        it('should handle move events before ant is created', () => {
            // Emit move event for non-existent ant
            expect(() => {
                EventBus.emit(GameEvents.ENTITY_MOVED, 'fake_id', 10, 10);
            }).to.not.throw();
        });
    });
});
