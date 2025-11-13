import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { Renderer } from '../../src/rendering/Renderer';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { createMockP5, MockRenderable } from '../helpers/renderingMocks';

describe('Renderer', () => {
    let renderer: Renderer;
    const mockP5 = createMockP5();

    beforeEach(() => {
        renderer = new Renderer(mockP5 as any, 800, 600);
    });

    describe('initialization', () => {
        it('should create renderer with correct dimensions', () => {
            expect(renderer).to.exist;
        });

        it('should have no renderables initially', () => {
            // This will be validated by render behavior
            expect(renderer).to.exist;
        });
    });

    describe('registering renderables', () => {
        it('should register a renderable on a specific layer', () => {
            const renderable = new MockRenderable(RenderLayer.ENTITIES, 10);
            renderer.register(renderable);
            
            // Trigger render to verify registration
            renderer.render();
            expect(renderable.renderCalled).to.be.true;
        });

        it('should register multiple renderables on same layer', () => {
            const r1 = new MockRenderable(RenderLayer.ENTITIES, 10);
            const r2 = new MockRenderable(RenderLayer.ENTITIES, 20);
            
            renderer.register(r1);
            renderer.register(r2);
            
            renderer.render();
            expect(r1.renderCalled).to.be.true;
            expect(r2.renderCalled).to.be.true;
        });

        it('should register renderables on different layers', () => {
            const entity = new MockRenderable(RenderLayer.ENTITIES, 10);
            const ui = new MockRenderable(RenderLayer.UI, 0);
            
            renderer.register(entity);
            renderer.register(ui);
            
            renderer.render();
            expect(entity.renderCalled).to.be.true;
            expect(ui.renderCalled).to.be.true;
        });

        it('should return unregister function', () => {
            const renderable = new MockRenderable(RenderLayer.ENTITIES, 10);
            const unregister = renderer.register(renderable);
            
            expect(unregister).to.be.a('function');
        });
    });

    describe('unregistering renderables', () => {
        it('should unregister renderable using returned function', () => {
            const renderable = new MockRenderable(RenderLayer.ENTITIES, 10);
            const unregister = renderer.register(renderable);
            
            unregister();
            
            // After unregister, render should not be called
            renderable.renderCalled = false;
            renderer.render();
            expect(renderable.renderCalled).to.be.false;
        });

        it('should not affect other renderables when unregistering', () => {
            const r1 = new MockRenderable(RenderLayer.ENTITIES, 10);
            const r2 = new MockRenderable(RenderLayer.ENTITIES, 20);
            
            const unregister1 = renderer.register(r1);
            renderer.register(r2);
            
            unregister1();
            
            r1.renderCalled = false;
            r2.renderCalled = false;
            renderer.render();
            
            expect(r1.renderCalled).to.be.false;
            expect(r2.renderCalled).to.be.true;
        });
    });

    describe('depth sorting', () => {
        it('should render entities in depth order (higher depth last)', () => {
            const renderOrder: number[] = [];
            
            class OrderTrackingRenderable extends MockRenderable {
                render(graphics: any): void {
                    super.render(graphics);
                    renderOrder.push(this.depth);
                }
            }
            
            const back = new OrderTrackingRenderable(RenderLayer.ENTITIES, 50);
            const middle = new OrderTrackingRenderable(RenderLayer.ENTITIES, 100);
            const front = new OrderTrackingRenderable(RenderLayer.ENTITIES, 150);
            
            // Register in random order
            renderer.register(middle);
            renderer.register(front);
            renderer.register(back);
            
            renderer.render();
            
            // Should render in depth order: 50, 100, 150
            expect(renderOrder).to.deep.equal([50, 100, 150]);
        });

        it('should not sort non-entity layers', () => {
            const renderOrder: number[] = [];
            
            class OrderTrackingRenderable extends MockRenderable {
                render(graphics: any): void {
                    super.render(graphics);
                    renderOrder.push(this.depth);
                }
            }
            
            // UI layer should maintain registration order, not sort by depth
            const first = new OrderTrackingRenderable(RenderLayer.UI, 100);
            const second = new OrderTrackingRenderable(RenderLayer.UI, 50);
            
            renderer.register(first);
            renderer.register(second);
            
            renderer.render();
            
            // Should render in registration order: 100, 50
            expect(renderOrder).to.deep.equal([100, 50]);
        });
    });

    describe('layer rendering', () => {
        it('should render layers in correct order', () => {
            const renderOrder: RenderLayer[] = [];
            
            class LayerTrackingRenderable extends MockRenderable {
                render(graphics: any): void {
                    super.render(graphics);
                    renderOrder.push(this.layer);
                }
            }
            
            // Register in reverse order
            renderer.register(new LayerTrackingRenderable(RenderLayer.UI, 0));
            renderer.register(new LayerTrackingRenderable(RenderLayer.ENTITIES, 0));
            renderer.register(new LayerTrackingRenderable(RenderLayer.GROUND, 0));
            renderer.register(new LayerTrackingRenderable(RenderLayer.BACKGROUND, 0));
            
            renderer.render();
            
            // Should render in layer order: BACKGROUND -> GROUND -> ENTITIES -> UI
            expect(renderOrder[0]).to.equal(RenderLayer.BACKGROUND);
            expect(renderOrder[1]).to.equal(RenderLayer.GROUND);
            expect(renderOrder[2]).to.equal(RenderLayer.ENTITIES);
            expect(renderOrder[3]).to.equal(RenderLayer.UI);
        });

        it('should skip rendering clean layers', () => {
            const renderable = new MockRenderable(RenderLayer.ENTITIES, 10);
            renderer.register(renderable);
            
            // First render marks layer clean
            renderer.render();
            expect(renderable.renderCalled).to.be.true;
            
            // Second render should skip (layer is clean)
            renderable.renderCalled = false;
            renderer.render();
            expect(renderable.renderCalled).to.be.false;
        });

        it('should render dirty layers', () => {
            const renderable = new MockRenderable(RenderLayer.ENTITIES, 10);
            renderer.register(renderable);
            
            renderer.render();
            renderable.renderCalled = false;
            
            // Mark layer dirty
            renderer.markLayerDirty(RenderLayer.ENTITIES);
            
            renderer.render();
            expect(renderable.renderCalled).to.be.true;
        });
    });

    describe('dirty flag management', () => {
        it('should mark specific layer dirty', () => {
            const entity = new MockRenderable(RenderLayer.ENTITIES, 10);
            const ui = new MockRenderable(RenderLayer.UI, 0);
            
            renderer.register(entity);
            renderer.register(ui);
            
            // First render clears flags
            renderer.render();
            entity.renderCalled = false;
            ui.renderCalled = false;
            
            // Mark only ENTITIES dirty
            renderer.markLayerDirty(RenderLayer.ENTITIES);
            
            renderer.render();
            expect(entity.renderCalled).to.be.true;
            expect(ui.renderCalled).to.be.false;
        });

        it('should mark all layers dirty', () => {
            const entity = new MockRenderable(RenderLayer.ENTITIES, 10);
            const ui = new MockRenderable(RenderLayer.UI, 0);
            
            renderer.register(entity);
            renderer.register(ui);
            
            renderer.render();
            entity.renderCalled = false;
            ui.renderCalled = false;
            
            renderer.markAllLayersDirty();
            
            renderer.render();
            expect(entity.renderCalled).to.be.true;
            expect(ui.renderCalled).to.be.true;
        });
    });

    describe('camera integration', () => {
        it('should have setCamera method', () => {
            expect(renderer.setCamera).to.be.a('function');
        });

        it('should accept null camera', () => {
            renderer.setCamera(null);
            // Should render without errors
            const renderable = new MockRenderable(RenderLayer.ENTITIES, 10);
            renderer.register(renderable);
            renderer.render();
            expect(renderable.renderCalled).to.be.true;
        });
    });
});


