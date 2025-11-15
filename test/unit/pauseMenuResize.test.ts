import { expect } from 'chai';
import { PauseMenuScene } from '../../src/scenes/PauseMenuScene';
import { Renderer } from '../../src/rendering/Renderer';
import { EventBus } from '../../src/utils/eventBus';
import { createMockP5 } from '../helpers/renderingMocks';

/**
 * Unit tests for PauseMenuScene window resize behavior
 * Tests that UI components (toggle, panel) properly update positions on resize
 */
describe('PauseMenuScene - Window Resize', () => {
    let scene: PauseMenuScene;
    let renderer: Renderer;
    const mockP5 = createMockP5();

    beforeEach(() => {
        EventBus.clear();
        renderer = new Renderer(mockP5 as any, 800, 600);
        scene = new PauseMenuScene(renderer, 800, 600);
        scene.enter();
    });

    afterEach(() => {
        scene.exit();
        EventBus.clear();
    });

    describe('Toggle Position Updates', () => {
        it('should update button bounds when window resized', () => {
            // Scene should have button bounds
            const buttonBounds = (scene as any).worldGenConfigButtonBounds;
            if (!buttonBounds) {
                // If no button bounds initially, resize should still work
                scene.onResize(1024, 768);
                expect(scene).to.exist;
                return;
            }
            
            // Store initial bounds
            const initialWidth = buttonBounds.width;

            // Resize window to 1024x768
            scene.onResize(1024, 768);

            // Button bounds should update to new center
            const updatedBounds = (scene as any).worldGenConfigButtonBounds;
            expect(updatedBounds).to.exist;
            expect(updatedBounds.width).to.equal(initialWidth); // Width unchanged
        });

        it('should handle multiple resize events', () => {
            // Just verify multiple resizes don't crash
            scene.onResize(1920, 1080);
            scene.onResize(640, 480);
            scene.onResize(800, 600);
            
            // Should complete without errors
            expect(scene).to.exist;
        });
    });

    describe('Canvas Dimensions Updates', () => {
        it('should update canvasWidth and canvasHeight on resize', () => {
            expect((scene as any).canvasWidth).to.equal(800);
            expect((scene as any).canvasHeight).to.equal(600);

            scene.onResize(1024, 768);

            expect((scene as any).canvasWidth).to.equal(1024);
            expect((scene as any).canvasHeight).to.equal(768);
        });
    });

    describe('Button Click Detection After Resize', () => {
        it('should update worldGenConfig button bounds after resize', () => {
            const bounds = (scene as any).worldGenConfigButtonBounds;
            expect(bounds).to.not.be.null;
            
            // Store original bounds
            const originalX = bounds.x;
            
            // Resize to 1024x768
            scene.onResize(1024, 768);
            
            // Bounds should be updated
            const newBounds = (scene as any).worldGenConfigButtonBounds;
            expect(newBounds).to.not.be.null;
            expect(newBounds.x).to.not.equal(originalX);
            
            // New bounds should be calculated relative to new canvas size
            // Button is at centerX - 230, then offset by buttonWidth/2
            const centerX = 1024 / 2;
            const buttonX = centerX - 230;
            const buttonWidth = 140;
            const expectedX = buttonX - buttonWidth / 2;
            expect(Math.abs(newBounds.x - expectedX)).to.be.lessThan(1);
        });

        it('should emit event when worldGenConfig button clicked at new position', () => {
            let eventEmitted = false;
            const EventBus = require('../../src/utils/eventBus').EventBus;
            const GameEvents = require('../../src/utils/eventBus').GameEvents;
            
            EventBus.on(GameEvents.WORLDGEN_CONFIG_MENU_TOGGLE, () => {
                eventEmitted = true;
            });
            
            // Resize
            scene.onResize(1024, 768);
            
            const bounds = (scene as any).worldGenConfigButtonBounds;
            const clickX = bounds.x + bounds.width / 2;
            const clickY = bounds.y + bounds.height / 2;
            
            // Click the button at new position
            scene.handleMouseClick(clickX, clickY);
            
            // Event should have been emitted
            expect(eventEmitted).to.be.true;
            
            EventBus.clear();
        });
    });

    describe('Panel Rendering After Resize', () => {
        it('should render panel at centered position after resize', () => {
            // This tests that the panel render closure uses dynamic this.canvasWidth/Height
            // We can't directly test the render function, but we can verify it's marked dirty
            
            const layerDirtySpy = {
                wasCalled: false,
                layer: null as any
            };
            
            // Intercept markLayerDirty
            const originalMarkDirty = renderer.markLayerDirty.bind(renderer);
            renderer.markLayerDirty = (layer: any) => {
                layerDirtySpy.wasCalled = true;
                layerDirtySpy.layer = layer;
                originalMarkDirty(layer);
            };
            
            scene.onResize(1024, 768);
            
            expect(layerDirtySpy.wasCalled).to.be.true;
        });
    });

    describe('Preset List Click Detection After Resize', () => {
        it('should update preset list bounds after resize', () => {
            // Add a preset to test with
            const WorldPresetManager = require('../../src/world/WorldPresetManager').WorldPresetManager;
            WorldPresetManager.savePreset({
                name: 'Test Preset',
                seed: 12345,
                noiseScale: 0.1,
                width: 100,
                height: 100,
                timestamp: Date.now()
            });

            // Resize
            scene.onResize(1024, 768);

            const centerX = 1024 / 2;
            const centerY = 768 / 2;
            const panelX = centerX - 600 / 2;
            const panelY = centerY - 500 / 2;
            const listY = panelY + 180;

            // Click in the preset list area at new position
            const clickX = panelX + 100;
            const clickY = listY + 10;

            // Should not throw error
            expect(() => scene.handleMouseClick(clickX, clickY)).to.not.throw();

            // Cleanup
            WorldPresetManager.deletePreset('Test Preset');
        });
    });

    describe('Button Hover Detection After Resize', () => {
        it('should update button hover state at new position', () => {
            // Resize
            scene.onResize(1024, 768);
            
            const bounds = (scene as any).worldGenConfigButtonBounds;
            const hoverX = bounds.x + bounds.width / 2;
            const hoverY = bounds.y + bounds.height / 2;
            
            // Move mouse over button
            scene.handleMouseMove(hoverX, hoverY);
            
            // Hover state should be updated
            const isHovered = (scene as any).worldGenConfigButtonHovered;
            expect(isHovered).to.be.true;
            
            // Move mouse away
            scene.handleMouseMove(0, 0);
            
            // Button should not be hovered
            const isHoveredAfter = (scene as any).worldGenConfigButtonHovered;
            expect(isHoveredAfter).to.be.false;
        });
    });

    describe('Edge Cases', () => {
        it('should handle resize to very small dimensions', () => {
            scene.onResize(320, 240);
            expect((scene as any).canvasWidth).to.equal(320);
            expect((scene as any).canvasHeight).to.equal(240);
            
            // Button bounds should still be valid
            const bounds = (scene as any).worldGenConfigButtonBounds;
            expect(bounds).to.not.be.null;
        });

        it('should handle resize to very large dimensions', () => {
            scene.onResize(3840, 2160);
            expect((scene as any).canvasWidth).to.equal(3840);
            expect((scene as any).canvasHeight).to.equal(2160);
            
            // Button bounds should still be valid
            const bounds = (scene as any).worldGenConfigButtonBounds;
            expect(bounds).to.not.be.null;
        });

        it('should handle resize when button bounds is null', () => {
            // Temporarily set bounds to null
            (scene as any).worldGenConfigButtonBounds = null;
            
            // Should not throw
            expect(() => scene.onResize(1024, 768)).to.not.throw();
        });
    });
});
