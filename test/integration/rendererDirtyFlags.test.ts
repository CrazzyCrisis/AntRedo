/**
 * Integration tests for Renderer dirty flag system
 */

import { expect } from 'chai';
import { Renderer } from '../../src/rendering/Renderer';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { FramebufferManager } from '../../src/rendering/FramebufferManager';
import { Camera } from '../../src/rendering/Camera';

describe('Renderer Layer Dirty Flag Integration Tests', () => {
    let renderer: Renderer;
    let framebufferManager: FramebufferManager;
    let camera: Camera;

    beforeEach(() => {
        // Mock p5.Graphics for framebuffers
        const mockGraphics = {
            clear: () => {},
            push: () => {},
            pop: () => {},
            translate: () => {},
            image: () => {},
            background: () => {}
        };

        // Create framebuffer manager
        framebufferManager = new FramebufferManager(
            () => mockGraphics as any,800, 600,
        );

        camera = new Camera(0, 0, 800, 600);
        renderer = new Renderer(() => mockGraphics as any, 800, 600);
        renderer.setCamera(camera)
    });

    describe('Layer Marking', () => {
        it('should mark layer as dirty', () => {
            renderer.markLayerDirty(RenderLayer.ENTITIES);
            
            expect(framebufferManager.isDirty(RenderLayer.ENTITIES)).to.be.true;
        });

        it('should clear dirty flag after rendering', () => {
            renderer.markLayerDirty(RenderLayer.ENTITIES);
            
            // Simulate render cycle
            renderer.render();
            
            // After render, dirty flag should be cleared
            expect(framebufferManager.isDirty(RenderLayer.ENTITIES)).to.be.false;
        });

        it('should handle multiple layers independently', () => {
            renderer.markLayerDirty(RenderLayer.ENTITIES);
            renderer.markLayerDirty(RenderLayer.UI);
            
            expect(framebufferManager.isDirty(RenderLayer.ENTITIES)).to.be.true;
            expect(framebufferManager.isDirty(RenderLayer.UI)).to.be.true;
            expect(framebufferManager.isDirty(RenderLayer.BACKGROUND)).to.be.false;
        });
    });

    describe('Entity Movement and Dirty Flags', () => {
        it('should mark entity layer dirty when entity moves', () => {
            // Initial state: not dirty
            expect(framebufferManager.isDirty(RenderLayer.ENTITIES)).to.be.false;
            
            // Simulate entity movement
            renderer.markLayerDirty(RenderLayer.ENTITIES);
            
            expect(framebufferManager.isDirty(RenderLayer.ENTITIES)).to.be.true;
        });

        it('should not redraw static layers unnecessarily', () => {
            // Mark only entity layer dirty
            renderer.markLayerDirty(RenderLayer.ENTITIES);
            
            // Background should remain clean
            expect(framebufferManager.isDirty(RenderLayer.BACKGROUND)).to.be.false;
            expect(framebufferManager.isDirty(RenderLayer.GROUND)).to.be.false;
        });
    });

    describe('Continuous Animation Layers', () => {
        it('should handle layers that need constant updates (UI animations)', () => {
            // Simulate multiple frames of UI animation
            for (let frame = 0; frame < 10; frame++) {
                // Mark UI dirty every frame
                renderer.markLayerDirty(RenderLayer.UI);
                
                expect(framebufferManager.isDirty(RenderLayer.UI)).to.be.true;
                
                // Render
                renderer.render();
                
                // Dirty flag cleared after render
                expect(framebufferManager.isDirty(RenderLayer.UI)).to.be.false;
            }
        });
    });

    describe('Performance Optimization', () => {
        it('should skip rendering clean layers', () => {
            let renderCount = 0;
            
            // Mock renderable that tracks render calls
            const mockRenderable = {
                layer: RenderLayer.ENTITIES,
                depth: 0,
                render: () => { renderCount++; }
            };
            
            renderer.register(mockRenderable);
            
            // Render without marking dirty
            renderer.render();
            
            // Should not have rendered
            expect(renderCount).to.equal(0);
            
            // Mark dirty and render
            renderer.markLayerDirty(RenderLayer.ENTITIES);
            renderer.render();
            
            // Should have rendered
            expect(renderCount).to.equal(1);
        });
    });
});
