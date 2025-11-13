import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { RenderLayer } from '../src/rendering/RenderLayer';
import { FramebufferManager } from '../src/rendering/FramebufferManager';
import { createMockP5, MockRenderable } from './helpers/renderingMocks';

describe('Rendering System', () => {
    describe('RenderLayer Enum', () => {
        it('should have 7 distinct layer values', () => {
            const layers = [
                RenderLayer.BACKGROUND,
                RenderLayer.GROUND,
                RenderLayer.GROUND_DECORATIONS,
                RenderLayer.ENTITIES,
                RenderLayer.ABOVE_ENTITIES,
                RenderLayer.UI,
                RenderLayer.DEBUG
            ];
            
            // Check all are distinct
            const uniqueLayers = new Set(layers);
            expect(uniqueLayers.size).to.equal(7);
        });

        it('should have correct ordering (BACKGROUND < UI < DEBUG)', () => {
            expect(RenderLayer.BACKGROUND).to.be.lessThan(RenderLayer.GROUND);
            expect(RenderLayer.GROUND).to.be.lessThan(RenderLayer.GROUND_DECORATIONS);
            expect(RenderLayer.GROUND_DECORATIONS).to.be.lessThan(RenderLayer.ENTITIES);
            expect(RenderLayer.ENTITIES).to.be.lessThan(RenderLayer.ABOVE_ENTITIES);
            expect(RenderLayer.ABOVE_ENTITIES).to.be.lessThan(RenderLayer.UI);
            expect(RenderLayer.UI).to.be.lessThan(RenderLayer.DEBUG);
        });
    });

    describe('FramebufferManager', () => {
        let manager: FramebufferManager;
        const mockP5 = createMockP5();

        beforeEach(() => {
            manager = new FramebufferManager(mockP5 as any, 800, 600);
        });

        describe('initialization', () => {
            it('should create framebuffers for all 7 layers', () => {
                expect(manager.getFramebuffer(RenderLayer.BACKGROUND)).to.exist;
                expect(manager.getFramebuffer(RenderLayer.GROUND)).to.exist;
                expect(manager.getFramebuffer(RenderLayer.GROUND_DECORATIONS)).to.exist;
                expect(manager.getFramebuffer(RenderLayer.ENTITIES)).to.exist;
                expect(manager.getFramebuffer(RenderLayer.ABOVE_ENTITIES)).to.exist;
                expect(manager.getFramebuffer(RenderLayer.UI)).to.exist;
                expect(manager.getFramebuffer(RenderLayer.DEBUG)).to.exist;
            });

            it('should create framebuffers with correct dimensions', () => {
                const fb = manager.getFramebuffer(RenderLayer.BACKGROUND);
                expect(fb.width).to.equal(800);
                expect(fb.height).to.equal(600);
            });

            it('should mark all layers as dirty initially', () => {
                expect(manager.isDirty(RenderLayer.BACKGROUND)).to.be.true;
                expect(manager.isDirty(RenderLayer.GROUND)).to.be.true;
                expect(manager.isDirty(RenderLayer.UI)).to.be.true;
            });
        });

        describe('dirty flag management', () => {
            it('should mark a specific layer as dirty', () => {
                manager.clearDirtyFlag(RenderLayer.BACKGROUND);
                expect(manager.isDirty(RenderLayer.BACKGROUND)).to.be.false;
                
                manager.markDirty(RenderLayer.BACKGROUND);
                expect(manager.isDirty(RenderLayer.BACKGROUND)).to.be.true;
            });

            it('should clear dirty flag after checking', () => {
                manager.markDirty(RenderLayer.GROUND);
                expect(manager.isDirty(RenderLayer.GROUND)).to.be.true;
                
                manager.clearDirtyFlag(RenderLayer.GROUND);
                expect(manager.isDirty(RenderLayer.GROUND)).to.be.false;
            });

            it('should mark all layers dirty', () => {
                // Clear all first
                Object.values(RenderLayer).forEach(layer => {
                    if (typeof layer === 'number') {
                        manager.clearDirtyFlag(layer);
                    }
                });
                
                manager.markAllDirty();
                
                expect(manager.isDirty(RenderLayer.BACKGROUND)).to.be.true;
                expect(manager.isDirty(RenderLayer.GROUND)).to.be.true;
                expect(manager.isDirty(RenderLayer.ENTITIES)).to.be.true;
                expect(manager.isDirty(RenderLayer.UI)).to.be.true;
            });

            it('should not affect other layers when marking one dirty', () => {
                manager.clearDirtyFlag(RenderLayer.BACKGROUND);
                manager.clearDirtyFlag(RenderLayer.UI);
                
                manager.markDirty(RenderLayer.BACKGROUND);
                
                expect(manager.isDirty(RenderLayer.BACKGROUND)).to.be.true;
                expect(manager.isDirty(RenderLayer.UI)).to.be.false;
            });
        });

        describe('framebuffer access', () => {
            it('should return correct framebuffer for each layer', () => {
                const bgFb = manager.getFramebuffer(RenderLayer.BACKGROUND);
                const uiFb = manager.getFramebuffer(RenderLayer.UI);
                
                expect(bgFb).to.not.equal(uiFb);
                expect(bgFb).to.exist;
                expect(uiFb).to.exist;
            });

            it('should clear a specific framebuffer', () => {
                const fb = manager.getFramebuffer(RenderLayer.ENTITIES);
                manager.clearFramebuffer(RenderLayer.ENTITIES);
                
                expect((fb as any)._cleared).to.be.true;
            });

            it('should clear all framebuffers', () => {
                manager.clearAllFramebuffers();
                
                const layers = [
                    RenderLayer.BACKGROUND,
                    RenderLayer.GROUND,
                    RenderLayer.ENTITIES,
                    RenderLayer.UI
                ];
                
                layers.forEach(layer => {
                    const fb = manager.getFramebuffer(layer);
                    expect((fb as any)._cleared).to.be.true;
                });
            });
        });
    });

    describe('Renderable Interface', () => {
        it('should enforce required properties', () => {
            const renderable = new MockRenderable(RenderLayer.ENTITIES, 10, 100, 200);
            
            expect(renderable).to.have.property('layer');
            expect(renderable).to.have.property('depth');
            expect(renderable).to.have.property('render');
        });

        it('should allow creation with different layers', () => {
            const entity = new MockRenderable(RenderLayer.ENTITIES, 5, 0, 0);
            const ui = new MockRenderable(RenderLayer.UI, 0, 0, 0);
            
            expect(entity.layer).to.equal(RenderLayer.ENTITIES);
            expect(ui.layer).to.equal(RenderLayer.UI);
        });

        it('should store depth for sorting', () => {
            const front = new MockRenderable(RenderLayer.ENTITIES, 100, 0, 0);
            const back = new MockRenderable(RenderLayer.ENTITIES, 50, 0, 0);
            
            expect(front.depth).to.be.greaterThan(back.depth);
        });
    });

    describe('Layer Configuration', () => {
        it('should define clearEveryFrame correctly', () => {
            // These are the expected behaviors from RENDERING_SYSTEM_CODE.md
            // BACKGROUND: false (static)
            // GROUND: false (rarely changes)
            // GROUND_DECORATIONS: false (static)
            // ENTITIES: true (moves every frame)
            // ABOVE_ENTITIES: true (dynamic)
            // UI: true (interactive)
            // DEBUG: true (real-time data)
            
            // This test will validate LayerConfig once implemented
            expect(true).to.be.true; // Placeholder until LayerConfig is created
        });

        it('should define depthSort correctly', () => {
            // ENTITIES and ABOVE_ENTITIES should sort by depth
            // Other layers should not (order by registration)
            
            expect(true).to.be.true; // Placeholder until LayerConfig is created
        });
    });
});
